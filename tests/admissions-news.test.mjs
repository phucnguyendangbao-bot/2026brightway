import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { admissionNews } from '../assets/data/admissions-news.js';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { selectNews } from '../assets/js/admissions-news.js';

const raw = JSON.parse(readFileSync(new URL('../assets/data/schools.json', import.meta.url), 'utf8'));
const schools = buildUniversityCatalog(raw).schools.filter(school => school.identity.entity_kind === 'university');
const byId = new Map(schools.map(school => [school.id, school]));

test('only actual university profiles receive dated official 2026/2027 news', () => {
  assert.equal(schools.length, 35);
  assert.ok(admissionNews.length > 0);
  const seen = new Set();
  for (const item of admissionNews) {
    assert.ok(byId.has(item.schoolId), item.schoolId);
    assert.match(item.title, /\S/);
    assert.match(item.description, /\S/);
    assert.equal(Number(item.published.slice(0, 4)), item.year);
    assert.ok(!Number.isNaN(Date.parse(item.published)));
    assert.ok([2026, 2027].includes(item.year));
    const url = new URL(item.url);
    assert.equal(url.protocol, 'https:');
    const official = new URL(byId.get(item.schoolId).identity.source_url).hostname.replace(/^www\./, '');
    assert.ok(url.hostname === official || url.hostname.endsWith(`.${official}`), item.url);
    assert.ok(!seen.has(item.url), item.url);
    seen.add(item.url);
  }
});

test('year, school and type filters do not mix admission cohorts', () => {
  assert.ok(selectNews(admissionNews, { year:'2026' }).every(item => item.year === 2026));
  assert.deepEqual(selectNews(admissionNews, { year:'2027' }), []);
  assert.ok(selectNews(admissionNews, { school:'uit', year:'2026' }).every(item => item.schoolId === 'uit'));
  assert.ok(selectNews(admissionNews, { type:'Điểm chuẩn' }).every(item => item.type === 'Điểm chuẩn'));
});

test('news page has verified-empty state and profile links, without the old CMS catalog', () => {
  const html = readFileSync(new URL('../resources.html', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../assets/js/admissions-news.js', import.meta.url), 'utf8');
  const profiles = readFileSync(new URL('../assets/js/page2.js', import.meta.url), 'utf8');
  assert.match(html, /Chưa có thông báo được xác minh/);
  assert.match(html, /id="newsSchool"/);
  assert.match(html, /id="newsYear"/);
  assert.match(html, /id="newsType"/);
  assert.doesNotMatch(html, /resources-data\.js|cms-service\.js|Khóa học/);
  assert.match(script, /page2\.html#/);
  assert.match(profiles, /resources\.html\?school=/);
  assert.match(html, /id="policy-sources"/);
  assert.match(html, /id="school-sources"/);
});
