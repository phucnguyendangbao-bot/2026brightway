import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { uniqueSchools, wishFromProgram, addWish, moveWish, normalizeWishes, wishText, textKey, importLegacySchools } from '../assets/js/selection-model.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { relatedMajorNames } from '../assets/js/career-pathways.js';

const fpt = { id: 'fpt', name: 'Đại học FPT' };
const first = () => wishFromProgram(fpt, detailsForSchool('fpt'), 0, 2027);
const second = () => wishFromProgram(fpt, detailsForSchool('fpt'), 1, 2027);

test('favorite school aliases and represented units collapse without dropping other schools', () => {
  assert.deepEqual(uniqueSchools([{id:'fpt-ai'},{id:'fpt'},{id:'hcmut-oisp'},{id:'hcmut'},{id:'ctu'}]).map(item => item.id), ['fpt','hcmut','ctu']);
  assert.deepEqual(uniqueSchools({}), []);
});
test('wish retains actual annual program code and source, with a separate planning year', () => {
  const item = first();
  assert.equal(item.programCode, '7480201');
  assert.equal(item.sourceYear, 2026);
  assert.equal(item.year, 2027);
  assert.equal(item.source, detailsForSchool('fpt').programSource);
  assert.equal(wishFromProgram(fpt, detailsForSchool('fpt'), 99, 2027), null);
});
test('old picker imports recognized schools once, deduplicates campuses and does not resurrect removed favorites', () => {
  const catalog = [{id:'fpt',name:'Đại học FPT',short:'FPT'}];
  const imported = importLegacySchools([], ['FPT','FPT2','UNRESOLVED'], catalog);
  assert.equal(imported.savedSchools.length, 1);
  assert.deepEqual(imported.importedSchoolCodes, ['FPT','FPT2']);
  assert.deepEqual(importLegacySchools([], ['FPT','FPT2'], catalog, imported.importedSchoolCodes).savedSchools, []);
});
test('secondary, current-catalog, missing-source and invalid years cannot create annual wishes', () => {
  for (const id of ['hufi','rmit']) assert.equal(wishFromProgram({id}, detailsForSchool(id), 0, 2027), null);
  assert.equal(wishFromProgram(fpt, {programs:[{name:'Công nghệ thông tin'}],year:2026},0,2027), null);
  assert.equal(wishFromProgram(fpt, detailsForSchool('fpt'),0,2030), null);
});
test('duplicate additions preserve priority and collapse school aliases', () => {
  const list = addWish(addWish([], first()), second());
  const again = addWish(list, {...first(),schoolId:'fpt-ai'});
  assert.deepEqual(again, list);
  assert.equal(addWish(list, {...first(),year:2026}).length, 3);
});
test('different programs, tracks and campuses are not incorrectly merged', () => {
  const list = addWish([first(), second()], {...first(),track:'Chương trình tiếng Anh'});
  assert.equal(list.length, 3);
  assert.equal(addWish(list, {...first(),campus:'Cơ sở khác'}).length, 4);
});
test('reorder, remove and JSON restoration preserve exact choices and boundaries', () => {
  let list = addWish([first()], second());
  list = moveWish(list, list[1].id, -1);
  assert.equal(list[0].programName, second().programName);
  assert.deepEqual(moveWish(list, list[0].id, -1), list);
  assert.deepEqual(moveWish(list, 'missing', 1), list);
  const restored = normalizeWishes(JSON.parse(JSON.stringify(list.slice(0,1))));
  assert.equal(restored[0].programName, second().programName);
});
test('export includes priorities, reference years, sources and official-registration distinction', () => {
  const output = wishText([first(), second()]);
  assert.match(output, /1\. Đại học FPT/);
  assert.match(output, /Năm dự kiến: 2027 · Nguồn tuyển sinh: 2026/);
  assert.ok(output.includes(first().source));
  assert.match(output, /chưa đăng ký nguyện vọng chính thức/);
  assert.deepEqual(normalizeWishes([{...first(),source:'javascript:alert(1)'}]), []);
});
test('career pathways require a sourced education route and an exact existing major name', () => {
  const jobs = JSON.parse(fs.readFileSync(new URL('../assets/data/jobs.json', import.meta.url)));
  assert.ok(relatedMajorNames(jobs.find(job => job.name === 'Bác sĩ đa khoa')).map(textKey).includes('y khoa'));
  assert.deepEqual(relatedMajorNames(jobs.find(job => job.name === 'Kế toán')), []);
  assert.deepEqual(relatedMajorNames({ name:'Y khoa', edu:'Không nêu ngành', eduSource:'https://example.org' }), []);
});
