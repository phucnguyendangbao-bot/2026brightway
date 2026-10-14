import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { admissionsHistory, historyForSchool } from '../assets/data/school-admissions-history.js';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { renderSchoolHistory } from '../assets/js/school-history.js';

test('2025 archive has seven explicitly sourced records, separate from live data and calculator', () => {
  const raw = JSON.parse(readFileSync(new URL('../assets/data/schools.json', import.meta.url)));
  const ids = new Set(buildUniversityCatalog(raw).schools.map(s => s.id));
  assert.equal(admissionsHistory.length, 7);
  assert.equal(new Set(admissionsHistory.map(s => s.school_id)).size, 7);
  for (const record of admissionsHistory) {
    assert.ok(ids.has(record.school_id));
    assert.equal(record.admission_year, 2025);
    assert.equal(record.checked_at, '2026-10-15');
    assert.equal(record.use_for_calculation, false);
    assert.ok(record.links.length);
    for (const { label, url } of record.links) {
      assert.ok(label);
      const parsed = new URL(url);
      assert.equal(parsed.protocol, 'https:');
      assert.match(parsed.hostname, /\.edu\.vn$/);
    }
    assert.equal(Object.hasOwn(record, 'cutoff'), false);
    assert.equal(Object.hasOwn(record, 'tuition'), false);
  }
});

test('aliases resolve to the same archive; missing schools/years never fall back', () => {
  assert.equal(historyForSchool('fpt-ai'), historyForSchool('fpt'));
  assert.equal(historyForSchool('khtn-hcm'), historyForSchool('hcmus'));
  assert.equal(historyForSchool('hcmut-oisp'), historyForSchool('hcmut'));
  for (const year of [2024, 2026, 2027, null, 'bad']) assert.equal(historyForSchool('hcmut', year), null);
  assert.equal(historyForSchool('hucfl'), null);
  assert.equal(historyForSchool('ump'), null);
});

test('archive UI labels provisional and document-only sources without claiming full verification', () => {
  assert.match(renderSchoolHistory('uit'), /Có nội dung dự kiến/);
  assert.match(renderSchoolHistory('ctu'), /Chưa nhập bảng ngành/);
  assert.match(renderSchoolHistory('sgu'), /Có tài liệu chính thức/);
  assert.match(renderSchoolHistory('fpt'), /có cả hai năm/);
  assert.match(renderSchoolHistory('hcmut'), /Thông báo điểm chuẩn 2025/);
  assert.match(renderSchoolHistory('ueh'), /KSA.*KSV/);
  assert.match(renderSchoolHistory('ump'), /Chưa bổ sung nguồn tuyển sinh 2025/);
  assert.doesNotMatch(renderSchoolHistory('ump'), /href=/);
  for (const id of ['hcmut', 'ump']) {
    assert.match(renderSchoolHistory(id), /không tự áp dụng/);
    assert.match(renderSchoolHistory(id), /không dùng để kết luận đỗ\/trượt/);
  }
});
