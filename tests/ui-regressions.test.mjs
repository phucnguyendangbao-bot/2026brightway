import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('career cards do not publish unsupported salary or outlook claims', () => {
  const source = read('assets/js/careers.js');
  assert.match(source, /Chưa có dữ liệu đã đối chiếu/);
  assert.doesNotMatch(source, /escapeHtml\(j\.outlook\)/);
  assert.doesNotMatch(source, /escapeHtml\(j\.salary\)/);
});

test('empty unverified-school section is hidden instead of showing a zero-state contradiction', () => {
  const html = read('resources.html');
  const source = read('assets/js/admissions-news.js');
  assert.match(html, /id="newsUnverified"[^>]*hidden/);
  assert.match(source, /unverified\.hidden = missing\.length === 0/);
});

test('program tables keep usable mobile column widths and scroll horizontally', () => {
  const css = read('assets/css/page2.css');
  assert.match(css, /\.school-program-table \{ min-width: 680px; \}/);
  assert.match(css, /\.school-program-table th:nth-child\(2\).*min-width: 260px/);
});

test('unconfirmed transcript input warns but no longer blocks a valid calculation', () => {
  const source = read('assets/js/score-calculator.js');
  assert.match(source, /const transcriptConfirmed =/);
  assert.match(source, /warning\.hidden = !\(startedTranscript && !transcriptConfirmed\)/);
  assert.doesNotMatch(source, /errors\.push\('Hãy xác nhận điểm học bạ/);
});
