import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detailsForSchool, schoolProfileDetails } from '../assets/data/school-profile-details.js';
import { PROGRAM_IMPORT_METADATA, schoolProgramDetails } from '../assets/data/school-programs-2024-2026.js';

test('2026 FPT program scores are explicit, sourced and separate from legacy estimates', () => {
  const details = detailsForSchool('fpt');
  const legacy = JSON.parse(readFileSync(new URL('../assets/data/schools.json', import.meta.url)))
    .find(school => school.id === 'fpt');
  assert.equal(details.year, 2026);
  assert.equal(details.programs.length, 8);
  assert.equal(new Set(details.programs.map(program => program.code)).size, 8);
  assert.equal(details.programs.find(program => program.code === '7480101').score, 21);
  assert.ok(details.programs.filter(program => program.code !== '7480101').every(program => program.score === 18));
  assert.notDeepEqual(details.programs.map(program => program.score), Object.values(legacy.cutoffScores.thptqg));
  for (const url of [details.programSource, details.scoreSource]) {
    assert.equal(new URL(url).hostname, 'daihoc.fpt.edu.vn');
  }
});

test('a source-only score notice does not become an unsourced numeric cutoff', () => {
  assert.equal(detailsForSchool('fpt-ai'), schoolProfileDetails.fpt);
  for (const id of ['uit', 'hcmus']) {
    assert.equal(detailsForSchool(id).year, 2026);
    assert.ok(detailsForSchool(id).scoreSource.startsWith('https://'));
    assert.ok(!detailsForSchool(id).programs?.some(program => Number.isFinite(program.score)));
  }
  assert.equal(detailsForSchool('hcmut').programs.length, 12);
});

test('school profiles expose only 2026 admissions data', () => {
  assert.equal(detailsForSchool('fpt', 2026).programs.find(program => program.code === '7480101').score, 21);
  assert.equal(detailsForSchool('fpt', 2024), null);
  assert.equal(detailsForSchool('fpt', 2025), null);
  assert.equal(detailsForSchool('hcmut', 2024), null);
  assert.equal(detailsForSchool('hcmut', 2025), null);
  assert.equal(detailsForSchool('fpt', 2023), null);
  assert.equal(detailsForSchool('fpt', 2027), null);
  assert.equal(detailsForSchool('uit', 2024), null);
  assert.equal(detailsForSchool('hcmus', 2024), null);
});

test('secondary and current-catalog sources are not treated as confirmed annual program lists', () => {
  for (const id of ['hufi', 'hub']) assert.equal(detailsForSchool(id, 2026).programSourceStatus, 'secondary');
  assert.equal(detailsForSchool('rmit', 2026).programSourceStatus, 'current_catalog');
  assert.equal(detailsForSchool('fpt', 2026).scoreScale, 30);
  assert.equal(detailsForSchool('ntu', 2026).scoreScale, 40);
});

test('spreadsheet program import adds only the supplied school-year rows', () => {
  assert.equal(PROGRAM_IMPORT_METADATA.totalRows, 614);
  assert.equal(PROGRAM_IMPORT_METADATA.schoolCount, 22);
  assert.deepEqual(PROGRAM_IMPORT_METADATA.years, [2026]);
  assert.equal(PROGRAM_IMPORT_METADATA.missingCodeRows, 176);
  assert.equal(schoolProgramDetails.ctu[2026].programs.length, 127);
  assert.equal(schoolProgramDetails.hcmus[2026].programs.length, 39);
  assert.equal(schoolProgramDetails.hcmue[2026].programs.length, 28);
  assert.equal(schoolProgramDetails.uit[2026].programs.length, 15);
  assert.equal(schoolProgramDetails.duytan[2026].programs.length, 53);
  assert.equal(schoolProgramDetails.donga[2026].programs.length, 40);
  assert.equal(schoolProgramDetails.tdtu[2026].programs.length, 16);
  assert.equal(schoolProgramDetails.qnu[2026].programs.length, 8);
  assert.equal(schoolProgramDetails.hufi[2026].programs.length, 4);
  assert.equal(schoolProgramDetails.hub[2026].programs.length, 4);
  assert.equal(schoolProgramDetails.ntu[2026].programs.length, 53);
  assert.equal(schoolProgramDetails.huaf[2026].programs.length, 19);
  assert.equal(schoolProgramDetails.vku[2026].programs.length, 6);
  assert.equal(schoolProgramDetails.dut[2026].programs.length, 49);
  assert.equal(schoolProgramDetails.hcmut[2026].programs.length, 12);
  assert.equal(schoolProgramDetails.vlu[2026].programs.length, 64);
  assert.equal(schoolProgramDetails.pnt[2026].programs.length, 14);
  assert.equal(schoolProgramDetails.ueh[2026].programs.length, 8);
  assert.equal(schoolProgramDetails.ftu[2026].programs.length, 2);
  assert.equal(schoolProgramDetails.ctump[2026].programs.length, 15);
  assert.equal(schoolProgramDetails.ump[2026].programs.length, 13);
  assert.equal(schoolProgramDetails.rmit[2026].programs.length, 25);
  assert.equal(schoolProgramDetails.ussh, undefined);
  assert.equal(detailsForSchool('hcmus', 2026).scoreSource, schoolProfileDetails.hcmus.scoreSource);
  assert.equal(detailsForSchool('hcmus', 2026).programs.length, 39);
  assert.equal(detailsForSchool('uit', 2026).programs.length, 15);
  assert.equal(detailsForSchool('ntu', 2026).programs.find(program => program.code === '7340115').score, 27);
  assert.equal(detailsForSchool('ntu', 2026).programs.find(program => program.code === '7220204').combination, 'TVA2');
  assert.equal(detailsForSchool('ntu', 2026).programs.filter(program => Number.isFinite(program.score)).length, 53);
  assert.equal(detailsForSchool('ntu', 2026).scoreScale, 40);
  assert.ok(detailsForSchool('ntu', 2026).programs.every(program => ['T2VA', 'TVA2', 'TV2A'].includes(program.combination)));
  assert.equal(detailsForSchool('huaf', 2026).programs.find(program => program.code === '7640101').name, 'Thú y');
  assert.ok(detailsForSchool('vku', 2026).programs.every(program => !program.code));
  assert.equal(detailsForSchool('dut', 2026).programs.find(program => program.code === '7520216TN').score, 27.1);
  assert.equal(detailsForSchool('dut', 2026).programs.find(program => program.code === '7480201TN').quota, 30);
  assert.equal(detailsForSchool('dut', 2026).programs.filter(program => Number.isFinite(program.score)).length, 2);
  assert.match(detailsForSchool('hcmut', 2026).programNote, /12 trong 44/);
  assert.equal(detailsForSchool('vlu', 2026).programs.find(program => program.code === '7720101').name, 'Y Khoa');
  assert.equal(detailsForSchool('pnt', 2026).programs.find(program => program.code === '7720609').name, 'Khúc xạ nhãn khoa');
  assert.ok(detailsForSchool('ueh', 2026).programs.every(program => !program.code));
  assert.match(detailsForSchool('ueh', 2026).programNote, /chưa phải danh mục đầy đủ/);
  assert.ok(detailsForSchool('ftu', 2026).programs.every(program => !program.code));
  assert.equal(detailsForSchool('ctump', 2026).programs.find(program => program.code === '7720101E').name, 'Y khoa (tiếng Anh)');
  assert.equal(detailsForSchool('ump', 2026).programs.find(program => program.code === '772030103').name, 'Điều dưỡng chuyên ngành Gây mê hồi sức');
  assert.ok(detailsForSchool('rmit', 2026).programs.every(program => !program.code));
  assert.match(detailsForSchool('rmit', 2026).programNote, /không dùng mã xét tuyển ngành Việt Nam/);
  assert.equal(detailsForSchool('ctu', 2024), null);
  assert.equal(detailsForSchool('ctu', 2025), null);
  assert.equal(detailsForSchool('hcmue', 2025), null);
  assert.ok(schoolProgramDetails.ctu[2026].programs.every(program => program.code && program.name && program.track));
  assert.ok(Object.values(schoolProgramDetails).flatMap(years => Object.values(years))
    .flatMap(details => details.programs).every(program => program.name && program.track));
});
