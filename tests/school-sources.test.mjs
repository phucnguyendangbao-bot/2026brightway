import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sources from '../assets/data/school-admissions-sources.js';
import policy from '../assets/data/admissions-policy.js';
test('School references retain the PDF scope and do not certify complete formulas from a URL', () => {
  assert.equal(sources.universities.length, 19);
  assert.equal(new Set(sources.universities.map(row => row.school_id)).size, 19);
  for (const row of sources.universities) {
    assert.equal(row.admission_year,2026);
    assert.ok(['verified_partial_formula','needs_program_verification'].includes(row.formula_status));
    assert.equal(new URL(row.source_url).protocol,'https:');
    if (row.source_status !== 'confirmed_2026_source') assert.equal(row.source_verified_at,null);
  }
});
test('Updated admissions links preserve legacy school IDs and do not enable old unverified method records', () => {
  const schools=JSON.parse(fs.readFileSync(new URL('../assets/data/schools.json',import.meta.url)));
  assert.equal(schools.length,40);
  for (const row of schools.filter(s=>s.source_registry_id)) {
    const source=sources.universities.find(s=>s.school_id===row.source_registry_id);
    assert.ok(source);
    assert.equal(row.admissionUrl,source.source_url);
    assert.equal(row.source_url,source.source_url);
    assert.equal(row.status,'needs_school_verification');
    assert.equal(row.verified_at,null);
  }
  assert.ok(policy.documents.find(doc=>doc.id==='CV_2304_2026'));
});
