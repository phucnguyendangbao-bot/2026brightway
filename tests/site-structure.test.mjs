import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { ALLOWED_TYPES, buildRequest } from '../api/prompts.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('AI portfolio/CV tools are removed without disabling essay/outline analysis', () => {
  assert.deepEqual(ALLOWED_TYPES, ['essay', 'outline']);
  for (const type of ['portfolio', 'cv']) assert.throws(() => buildRequest({ type, content: 'test' }), { status: 400 });
  for (const type of ALLOWED_TYPES) assert.ok(buildRequest({ type, content: 'test' }).system);
  for (const path of ['cv-review.html', 'assets/js/cv-review.js', 'assets/css/cv-review.css']) {
    assert.equal(existsSync(new URL('../' + path, import.meta.url)), false, path);
  }
  assert.equal(read('vercel.json').includes('cv-review'), false);
});

test('public pages have no CV feature links or alternate brand names', () => {
  for (const file of readdirSync(new URL('../', import.meta.url)).filter(name => name.endsWith('.html'))) {
    assert.doesNotMatch(read(file), /cv-review|BrightWay (Scholars|Admissions)/, file);
  }
});

test('homepage starts with the hero and has one main career process', () => {
  const home = read('index.html');
  assert.ok(home.indexOf('<section class="bw-hero"') < home.indexOf('<section class="admissions-home"'));
  assert.equal((home.match(/<section class="bw-roadmap/g) || []).length, 1);
  assert.doesNotMatch(home, /<section class="bw-(audience|timeline|stage|next|schools-mini|school-gallery)/);
  assert.doesNotMatch(home, /<div class="bw-(tabbar|fab|sticky-cta)/);
  assert.match(home, /href="holland.html#import-result"/);
  assert.match(home, /href="calendar.html#study-plan"/);
});

test('12 study suggestions are separate from official admissions dates', () => {
  const calendar = read('calendar.html');
  assert.equal((calendar.match(/<details class="study-plan-month">/g) || []).length, 12);
  assert.match(calendar, /id="study-plan"/);
  assert.match(calendar, /không phải lịch tuyển sinh chính thức/);
  assert.match(calendar, /không tự xác định giai đoạn/);
});
