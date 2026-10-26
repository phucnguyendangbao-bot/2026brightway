import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MOET_UNDERGRADUATE_CATALOG } from '../assets/data/moet-undergraduate-catalog-2022.js';
import { MOET_UNDERGRADUATE_PILOT_2024 } from '../assets/data/moet-undergraduate-pilot-2024.js';
import { MOET_UNDERGRADUATE_CATALOG_2026 } from '../assets/data/moet-undergraduate-catalog-2026.js';
import { MOET_CATALOG_TRANSITIONS_2026 } from '../assets/data/moet-catalog-transition-2026.js';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { classifyProgram, sortedPrograms, searchScore, schoolSearchScore, catalogEntry, catalogVersionForYear, transitionForCode } from '../assets/js/training-taxonomy.js';
import { canDisplayProgramScores } from '../assets/js/score-provenance.js';
import { comparisonCells } from '../assets/js/school-comparison-model.js';

const schools = buildUniversityCatalog(JSON.parse(fs.readFileSync(new URL('../assets/data/schools.json', import.meta.url)))).schools
  .filter(school => school.identity.entity_kind === 'university');

test('official bachelor catalog has unique hierarchical codes and known mappings', () => {
  assert.equal(MOET_UNDERGRADUATE_CATALOG.entries.length, 496);
  assert.equal(new Set(MOET_UNDERGRADUATE_CATALOG.entries.map(entry => entry.code)).size, 496);
  for (const entry of MOET_UNDERGRADUATE_CATALOG.entries) {
    assert.match(entry.code, /^7\d{2}(?:\d{2}){0,2}$/);
    if (entry.code.length === 7) {
      assert.ok(catalogEntry(entry.code.slice(0, 3)));
      assert.ok(catalogEntry(entry.code.slice(0, 5)));
    }
  }
  assert.deepEqual([classifyProgram({code:'7480201',name:'Công nghệ thông tin'}).fieldName,
    classifyProgram({code:'7480201',name:'Công nghệ thông tin'}).groupName],
    ['Máy tính và công nghệ thông tin','Công nghệ thông tin']);
  assert.equal(classifyProgram({code:'7720101',name:'Y khoa'}).groupName,'Y học');
});

test('2024 pilot additions classify 2026 rows through the published hierarchy without changing admissions', () => {
  assert.equal(MOET_UNDERGRADUATE_PILOT_2024.entries.length,82);
  assert.equal(MOET_UNDERGRADUATE_PILOT_2024.entries.filter(row=>row.code.length===7).length,40);
  assert.equal(catalogVersionForYear(2026).entries.length,536);
  for (const entry of MOET_UNDERGRADUATE_PILOT_2024.entries.filter(row=>row.code.length===7)) {
    assert.equal(catalogEntry(entry.code,2026)?.name,entry.name);
    assert.ok(catalogEntry(entry.code.slice(0,3),2026),entry.code);
    assert.ok(catalogEntry(entry.code.slice(0,5),2026),entry.code);
  }
  for (const [schoolId,code] of [['pnt','7720609'],['pnt','7720610'],['ump','7720202'],['huaf','7620210']]) {
    const row=detailsForSchool(schoolId).programs.find(program=>program.code===code);
    assert.ok(row,`${schoolId}: ${code}`);
    const classified=classifyProgram(row,2026);
    assert.equal(classified.status,'catalog-match');
    assert.equal(classified.catalogDocument,'pilot-2024');
    assert.equal(classified.admissionCode,code);
  }
});

test('missing, proprietary and unlisted codes are never replaced with a guessed ministry code', () => {
  const missing = classifyProgram({code:'',name:'Kỹ thuật máy tính'});
  assert.equal(missing.majorCode,'');
  assert.equal(missing.status,'missing-code');
  assert.equal(missing.admissionCode,'');
  const proprietary = classifyProgram({code:'7480201C',name:'Công nghệ thông tin (CTCLC)'});
  assert.equal(proprietary.admissionCode,'7480201C');
  assert.equal(proprietary.majorCode,'7480201');
  assert.equal(proprietary.status,'school-specific-code');
  const unknown = classifyProgram({code:'75202A1',name:'Thiết kế vi mạch'});
  assert.equal(unknown.majorCode,'');
  assert.equal(unknown.status,'unknown-code');
});

test('default ordering is stable by ministry field, group and code; A–Z stays within groups', () => {
  const input = [
    {code:'7480201',name:'Công nghệ thông tin',score:18},
    {code:'7340115',name:'Marketing',score:20},
    {code:'7340101',name:'Quản trị kinh doanh',score:21},
    {code:'7340122',name:'Thương mại điện tử',score:22},
    {code:'',name:'Chương trình riêng',score:19},
  ];
  const before = structuredClone(input);
  assert.deepEqual(sortedPrograms(input).map(row => row.program.code),['7340101','7340115','7340122','7480201','']);
  assert.deepEqual(sortedPrograms(input,'az').map(row => row.program.name),
    ['Marketing','Quản trị kinh doanh','Thương mại điện tử','Công nghệ thông tin','Chương trình riêng']);
  assert.deepEqual(input,before);
  assert.deepEqual(sortedPrograms(input).map(row => row.index).sort((a,b)=>a-b),[0,1,2,3,4]);
});

test('accentless search, abbreviations and synonyms rank exact names above broad matches', () => {
  const exact={code:'7480201',name:'Công nghệ thông tin'};
  const variant={code:'7480201C',name:'Công nghệ thông tin (CTCLC)'};
  assert.ok(searchScore(exact,'cntt') > searchScore(variant,'cntt'));
  assert.ok(searchScore(exact,'cong nghe thong tin') > 0);
  assert.ok(searchScore(exact,'ngành CNTT') > 0);
  assert.ok(searchScore({code:'7480107',name:'Trí tuệ nhân tạo'},'artificial intelligence') > 0);
  assert.ok(searchScore({code:'7340122',name:'Thương mại điện tử'},'tmdt') > 0);
  assert.equal(searchScore(exact,'duoc hoc'),0);
});

test('all 35 university profiles keep their original program rows and admissions values', () => {
  assert.equal(schools.length,35);
  const populated = schools.filter(school => detailsForSchool(school.id)?.programs?.length);
  assert.equal(populated.length,23);
  for (const school of populated) {
    const rows = detailsForSchool(school.id).programs;
    const snapshot = JSON.stringify(rows);
    const ordered = sortedPrograms(rows);
    assert.equal(ordered.length,rows.length,school.id);
    assert.deepEqual(ordered.map(row => row.index).sort((a,b)=>a-b),rows.map((_,index)=>index),school.id);
    for (const {program,index,taxonomy} of ordered) {
      assert.equal(program,rows[index],school.id);
      assert.equal(taxonomy.admissionCode,String(program.code ?? '').trim(),school.id);
      assert.equal(program.score,rows[index].score,school.id);
      assert.equal(program.combination,rows[index].combination,school.id);
      assert.equal(program.quota,rows[index].quota,school.id);
    }
    assert.equal(JSON.stringify(rows),snapshot,school.id);
  }
});

test('same-name variants with different codes, campuses or tracks remain separate rows', () => {
  const rows=[
    {code:'7480201',name:'Công nghệ thông tin',campus:'Hà Nội'},
    {code:'7480201C',name:'Công nghệ thông tin',track:'Chất lượng cao'},
    {code:'7480201',name:'Công nghệ thông tin',campus:'TP.HCM'},
  ];
  const ordered=sortedPrograms(rows);
  assert.equal(ordered.length,3);
  assert.deepEqual(ordered.map(row=>row.index).sort(),[0,1,2]);
});

test('2027 uses the six-digit TT 74/2026 catalog without rewriting 2026 rows', () => {
  assert.equal(catalogVersionForYear(2026).source,MOET_UNDERGRADUATE_CATALOG.source);
  assert.equal(catalogVersionForYear(2026).supplementarySource,MOET_UNDERGRADUATE_PILOT_2024.source);
  assert.equal(catalogVersionForYear(2027),MOET_UNDERGRADUATE_CATALOG_2026);
  assert.equal(MOET_UNDERGRADUATE_CATALOG_2026.entries.length,553);
  assert.equal(new Set(MOET_UNDERGRADUATE_CATALOG_2026.entries.map(row => row.code)).size,553);
  const newCatalog = new Map(MOET_UNDERGRADUATE_CATALOG_2026.entries.map(row => [row.code,row]));
  for (const entry of MOET_UNDERGRADUATE_CATALOG_2026.entries.filter(row => row.code.length === 6)) {
    assert.ok(newCatalog.has(entry.code.slice(0,2)),entry.code);
    assert.ok(newCatalog.has(entry.code.slice(0,4)),entry.code);
  }
  assert.equal(catalogEntry('480201',2026),null);
  assert.equal(catalogEntry('7480201',2027),null);
  assert.equal(classifyProgram({code:'480201',name:'Công nghệ thông tin'},2027).status,'catalog-match');
  assert.equal(classifyProgram({code:'7480201',name:'Công nghệ thông tin'},2026).status,'catalog-match');
  assert.equal(classifyProgram({code:'7480201',name:'Công nghệ thông tin'},2027).status,'unknown-code');
  assert.equal(classifyProgram({code:'220111',name:'Ngôn ngữ Ảrập'},2027).status,'catalog-group-conflict');
});

test('official transition appendix keeps ambiguous old codes unresolved', () => {
  assert.equal(MOET_CATALOG_TRANSITIONS_2026.rows.length,120);
  for (const row of MOET_CATALOG_TRANSITIONS_2026.rows) assert.ok(catalogEntry(row.newCode,2027),row.newCode);
  assert.deepEqual(transitionForCode('7810104').matches.map(row => row.newCode),['810101','810201']);
  assert.equal(transitionForCode('7810104').status,'ambiguous');
  assert.equal(transitionForCode('7140223').status,'explicit');
  assert.equal(transitionForCode('7480201').status,'not-listed');
});

test('search ranking puts exact school and major names ahead of abbreviations and weak matches', () => {
  assert.ok(searchScore({code:'7480201',name:'Công nghệ thông tin'},'công nghệ thông tin')
    > searchScore({code:'7480201C',name:'Công nghệ thông tin (CTCLC)'},'cntt'));
  assert.ok(searchScore({code:'7480201',name:'Công nghệ thông tin'},'công nghệ thông tin')
    > searchScore({code:'7480201',name:'Công nghệ thông tin'},'7480201'));
  assert.equal(searchScore({code:'7480201',name:'Công nghệ thông tin'},'thú y'),0);
  assert.ok(searchScore({code:'7480201',name:'Công nghệ thông tin'},'công nghệ thông tin')
    > searchScore({code:'7510301',name:'Công nghệ kỹ thuật điện, điện tử'},'công nghệ thông tin'));
  const exact = {name:'Trường Đại học Cần Thơ',short:'CTU',id:'ctu',aliases:['Can Tho University']};
  const weak = {name:'Trường Đại học Kỹ thuật Cần Thơ',short:'CTUT',id:'ctut',aliases:[]};
  assert.ok(schoolSearchScore(exact,'Trường Đại học Cần Thơ') > schoolSearchScore(weak,'Trường Đại học Cần Thơ'));
  assert.ok(schoolSearchScore(exact,'CTU') > schoolSearchScore(weak,'CTU'));
});

test('a shared canonical major retains separate records and sources for each school', () => {
  const offerings = schools.map(school => ({school,details:detailsForSchool(school.id)}))
    .flatMap(({school,details}) => (details?.programs || []).map(program => ({school,details,program})))
    .filter(({program}) => classifyProgram(program).majorCode === '7480201');
  assert.ok(new Set(offerings.map(row => row.school.id)).size > 1);
  assert.ok(offerings.every(row => row.details.year === 2026 && row.details.programSource));
  assert.ok(offerings.some(row => row.program.code !== '7480201'));
});

test('numeric cutoffs require a source, year, named method and scale before display', () => {
  assert.equal(canDisplayProgramScores(detailsForSchool('fpt')),true);
  assert.equal(canDisplayProgramScores(detailsForSchool('ntu')),true);
  assert.equal(canDisplayProgramScores(detailsForSchool('dut')),false);
  assert.equal(canDisplayProgramScores(detailsForSchool('fpt'),2027),false);
  const dutComparison = comparisonCells({id:'dut',name:'DUT',city:'Đà Nẵng'},detailsForSchool('dut'),null);
  assert.match(dutComparison.scores.text,/Chưa có số liệu đủ điều kiện/);
  assert.doesNotMatch(dutComparison.scores.text,/27[,\.]1/);
});
