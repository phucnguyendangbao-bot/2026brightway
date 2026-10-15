import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detailsForSchool, schoolProfileDetails } from '../assets/data/school-profile-details.js';

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
    assert.equal(detailsForSchool(id).programs, undefined);
  }
  assert.equal(detailsForSchool('hcmut'), null);
});

test('2024–2026 records remain year-specific and preserve each scoring scale', () => {
  assert.equal(detailsForSchool('fpt', 2024).score, '21');
  assert.match(detailsForSchool('fpt', 2024).scoreMethod, /THPT 2024/);
  assert.equal(detailsForSchool('fpt', 2025).score, '18,5');
  assert.match(detailsForSchool('fpt', 2025).scoreNote, /thế hệ 1/);
  assert.equal(detailsForSchool('fpt', 2026).programs.find(program => program.code === '7480101').score, 21);
  assert.equal(detailsForSchool('hcmut', 2024).score, '55,38–84,16/90');
  assert.equal(detailsForSchool('hcmut', 2025), null);
  assert.equal(detailsForSchool('fpt', 2023), null);
  assert.equal(detailsForSchool('fpt', 2027), null);
  assert.equal(detailsForSchool('uit', 2024).score, undefined);
  assert.equal(detailsForSchool('hcmus', 2024).score, undefined);
});
