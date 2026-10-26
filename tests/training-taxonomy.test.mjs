import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MOET_UNDERGRADUATE_CATALOG } from '../assets/data/moet-undergraduate-catalog-2022.js';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { classifyProgram, sortedPrograms, searchScore, catalogEntry } from '../assets/js/training-taxonomy.js';

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
