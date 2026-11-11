import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { schoolsMentioned, schoolFactsContext } from '../api/waybi-school-facts.js';
import { SCHOOL_INDEX } from '../api/waybi-school-index.js';

test('school index stays in sync with the school catalog', () => {
  const catalog = JSON.parse(readFileSync(new URL('../assets/data/schools.json', import.meta.url), 'utf8'));
  assert.deepEqual(SCHOOL_INDEX.map(s => s.id), catalog.map(s => s.id));
});

test('schools are found by short code as a whole word or by name, never inside other words', () => {
  assert.deepEqual(schoolsMentioned('Học phí UIT năm 2026?').map(s => s.id), ['uit']);
  assert.ok(schoolsMentioned('so sánh Đại học Cần Thơ').some(s => s.id === 'ctu'));
  assert.deepEqual(schoolsMentioned('mình thích vẽ, nên học ngành gì'), []);
  assert.deepEqual(schoolsMentioned('suitable'), []);
});

test('named schools bring their sourced 2026 facts into the answer context; others add nothing', () => {
  const context = schoolFactsContext('học phí uit bao nhiêu');
  assert.match(context, /ĐÃ ĐỐI CHIẾU NGUỒN CHÍNH THỨC/);
  assert.match(context, /UIT[\s\S]*Học phí 2026:[\s\S]*Nguồn: https:\/\//);
  assert.equal(schoolFactsContext('thời tiết hôm nay'), '');
  const chat = readFileSync(new URL('../api/chat.js', import.meta.url), 'utf8');
  assert.match(chat, /schoolFactsContext\(/);
});
