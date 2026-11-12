import test from 'node:test';
import assert from 'node:assert/strict';
import { researchedSchoolDetails, researchedScholarships } from '../assets/data/school-research-2026.js';
import { detailsWithResearch, admissionSourceWithResearch } from '../assets/js/school-research-layer.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { canDisplayProgramScores } from '../assets/js/score-provenance.js';

const AGGREGATORS = /tuyensinh247|thuvienphapluat|vnexpress|thanhnien|tuoitre|dantri|vietnamnet|wikipedia|facebook|znews|kenh14|diemthi|edu2review/i;
const httpsOfficial = value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !AGGREGATORS.test(url.hostname);
};

test('every researched fact links to an https school page, never an aggregator or news site', () => {
  for (const [id, row] of Object.entries(researchedSchoolDetails)) {
    for (const field of ['tuition', 'admission', 'scores', 'programs']) if (row[field]) assert.ok(httpsOfficial(row[field].source), `${id}.${field}`);
    if (row.homepage) assert.ok(httpsOfficial(row.homepage), `${id}.homepage`);
  }
  for (const item of researchedScholarships) {
    assert.ok(httpsOfficial(item.sourceUrl), item.id);
    assert.equal(item.kind, 'scholarship');
    assert.equal(item.funding, 'editorial');
    assert.equal(item.availability, 'reference');
  }
});

test('researched data is 2026 only, scores stay within their stated scale and can be displayed', () => {
  for (const [id, row] of Object.entries(researchedSchoolDetails)) {
    if (row.tuition) {
      assert.equal(row.tuition.year, 2026, id);
      assert.match(row.tuition.summary, /2026/, `${id} tuition names its year`);
    }
    if (row.scores) {
      assert.ok(row.scores.programs.every(program => program.score > 0 && program.score <= row.scores.scale), `${id} scores within scale`);
      assert.match(row.scores.method, /2026/, `${id} method names its year`);
      assert.ok(canDisplayProgramScores(detailsWithResearch(id), 2026), `${id} scores pass the display gate`);
    }
  }
  assert.equal(detailsWithResearch('ctu', 2027), null);
});

test('reviewed exclusions stay out: draft đề án, mislabelled school, unclear year, flattened table', () => {
  assert.equal(researchedSchoolDetails.hucfl, undefined);
  // Pass 1 rows that were excluded only come back from a second, cleaner source.
  assert.equal(researchedSchoolDetails.due.admission.published, '2026-06-22', 'final notice, not the draft');
  assert.equal(researchedSchoolDetails.phuxuan.tuition.published, '2026-05-30', 'dated 2026 admissions post');
  assert.ok(researchedSchoolDetails.donga.scores.programs.every(row => /^7\d{6}$/.test(row.code)), 'table re-read with proper codes');
  assert.ok(!researchedScholarships.some(item => /-research-scholarship-/.test(item.id) && ['hufi', 'ntu', 'husc'].includes(item.schoolId)));
  assert.ok(!researchedScholarships.some(item => /Nhất 70/.test(item.description)));
});

test('pass 2 fills from tables read on the school pages, with every row inside its scale', () => {
  const filled = ['due', 'uit', 'hcmut', 'hcmus', 'husc', 'hcmiu', 'hub', 'nlu', 'sgu', 'tdtu', 'uel', 'ctump', 'hcmue', 'vku'];
  for (const id of filled) assert.ok(researchedSchoolDetails[id].scores.programs.length > 0, id);
  assert.equal(researchedSchoolDetails.hcmue.scores.programs.length, 47, 'round-1 table, not the 3-row round 2');
  for (const id of ['nlu', 'due', 'hcmut', 'ueh', 'dut', 'ctump', 'sgu', 'hcmiu']) assert.match(researchedSchoolDetails[id].tuition.summary, /2026/, id);
});

test('research only fills gaps: curated 2026 records and scores are kept as they are', () => {
  const fpt = detailsWithResearch('fpt');
  assert.equal(fpt.scoreSource, detailsForSchool('fpt').scoreSource);
  assert.equal(fpt.programs.find(program => program.code === '7480101').score, 21);
  assert.equal(detailsWithResearch('ntu').scoreScale, 40);
  const curated = { admission_year: 2026, source_url: 'https://example.edu.vn/2026', source_summary: 'curated' };
  assert.equal(admissionSourceWithResearch(curated, 'hub'), curated);
});
