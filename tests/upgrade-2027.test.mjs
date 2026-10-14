import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildUniversityCatalog, canonicalSchoolId } from '../assets/data/university-identities.js';
import { COMBO_SUBJECTS, parseScore, fptComponent } from '../assets/js/score-rules.js';
import { officialEvents, nextOfficialEvent } from '../assets/js/calendar-rules.js';
import policy from '../assets/data/admissions-policy.js';
import registry from '../assets/data/school-admissions-sources.js';
const schools = JSON.parse(readFileSync(new URL('../assets/data/schools.json',import.meta.url)));

test('40 legacy records become 35 school profiles, 2 regional universities and 1 unresolved identity; original data untouched', () => {
  const before = JSON.stringify(schools);
  const catalog = buildUniversityCatalog(schools,registry.universities);
  assert.deepEqual(catalog.stats,{universities:35,systems:2,unresolved:1,total:37});
  assert.equal(new Set(catalog.schools.map(s=>s.id)).size,37);
  assert.equal(canonicalSchoolId('fpt-ai'),'fpt');
  assert.equal(canonicalSchoolId('khtn-hcm'),'hcmus');
  assert.equal(catalog.unresolved[0].id,'hucfl');
  assert.equal(JSON.stringify(schools),before);
  assert.equal(catalog.schools.some(s=>s.admission_year===2027),false);
  assert.match(catalog.schools.find(s=>s.id==='hufi').name,/Công Thương/);
});

test('score limits, blank/zero, invalid characters and decimals are checked without scientific coercion', () => {
  assert.deepEqual(parseScore('',10),{value:null});
  for (const max of [10,1200,150,100]) {
    assert.deepEqual(parseScore(String(max),max),{value:max});
    assert.ok(parseScore(String(max+0.01),max).error);
  }
  assert.deepEqual(parseScore('0',10),{value:0});
  assert.deepEqual(parseScore('8.75',10),{value:8.75});
  for (const raw of ['-1','Infinity','NaN','8x','8,5','2e0','0xA','8.999']) assert.ok(parseScore(raw,10).error,raw);
});

test('combination mappings include corrected C codes and the new subjects', () => {
  assert.deepEqual(COMBO_SUBJECTS.C01,['lit','math','phy']);
  assert.deepEqual(COMBO_SUBJECTS.C02,['lit','math','che']);
  assert.deepEqual(COMBO_SUBJECTS.C03,['lit','math','his']);
  assert.deepEqual(COMBO_SUBJECTS.X25,['math','civic','eng']);
  assert.deepEqual(COMBO_SUBJECTS.X26,['math','informatics','eng']);
});

test('FPT partial formula matches manual arithmetic only within tested 2026 prerequisites', () => {
  assert.equal(fptComponent({combo:'A00',raw:26,grade12:8.4}),25.6);
  assert.equal(fptComponent({combo:'C01',raw:15,grade12:7}),18);
  assert.equal(fptComponent({combo:'A00',raw:30,grade12:10}),30);
  for (const patch of [{raw:14.99},{grade12:null},{grade12:11},{raw:31},{combo:'D01'},{year:2027}]) {
    assert.equal(fptComponent({combo:'A00',raw:26,grade12:8.4,...patch}),null);
  }
});

test('only sourced official valid dates are used in grids and countdowns', () => {
  assert.equal(officialEvents(policy,2026).length,11);
  assert.equal(officialEvents(policy,2027).length,0);
  assert.equal(nextOfficialEvent(policy,2027),null);
  assert.equal(nextOfficialEvent(policy,2026,Date.parse('2026-10-15T00:00:00+07:00')),null);
  const event = policy.calendar_events[0];
  for (const patch of [{at:'bad-date'},{status:'expected'},{source_url:null},{verified_at:null},{source_id:'unknown'},{at:'2026-02-30T14:00:00+07:00',d:'2026-02-30'}]) {
    assert.equal(officialEvents({...policy,calendar_events:[{...event,...patch}]},2026).length,0);
  }
});

test('job names/descriptions are present and unique; unsupported salaries are not published as verified data', () => {
  const jobs=JSON.parse(readFileSync(new URL('../assets/data/jobs.json',import.meta.url)));
  assert.equal(jobs.length,102);
  assert.equal(new Set(jobs.map(j=>j.name.trim().toLowerCase())).size,102);
  assert.ok(jobs.every(j=>j.name.trim()&&j.desc.trim()));
  assert.equal(jobs.filter(j=>j.salary_source_url).length,0);
});
