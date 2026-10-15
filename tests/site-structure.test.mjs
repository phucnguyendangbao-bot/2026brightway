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

test('every standalone page uses the transparent BrightWay tab logo', () => {
  const rootPages = readdirSync(new URL('../', import.meta.url)).filter(name => name.endsWith('.html'));
  const adminPages = readdirSync(new URL('../admin/', import.meta.url)).filter(name => name.endsWith('.html')).map(name => 'admin/' + name);
  for (const file of [...rootPages, ...adminPages]) {
    const html = read(file);
    if (!/<head[\s>]/i.test(html)) continue;
    assert.match(html, /<link\s+rel="icon"\s+type="image\/png"\s+href="\/favicon\.png\?v=20261015"\s*\/?>/i, file);
    assert.equal((html.match(/rel="icon"/gi) || []).length, 1, file);
  }
});

test('every user-facing page loads the shared BrightWay colour theme', () => {
  const rootPages = [
    'admin.html', 'calendar.html', 'careers-holland.html', 'careers.html',
    'essay-review.html', 'holland.html', 'index.html', 'interview-prep.html',
    'login.html', 'major-detail.html', 'majors.html', 'news-detail.html',
    'news.html', 'page2.html', 'profile.html', 'resources.html',
    'scholarship-roadmap.html', 'score-calculator.html', 'waybi.html'
  ];
  const adminPages = ['index.html', 'major-edit.html', 'majors.html', 'post-edit.html', 'posts.html', 'resource-edit.html', 'users.html']
    .map(name => `admin/${name}`);
  for (const file of [...rootPages, ...adminPages]) {
    assert.match(read(file), /\/assets\/css\/brightway-theme\.css\?v=4/, file);
  }
  const theme = read('assets/css/brightway-theme.css');
  assert.match(theme, /--bw-brand:\s*#6b60ff/);
  assert.match(theme, /--bw-brand-gradient:\s*linear-gradient\(135deg, #6b60ff 0%, #8b6bff 100%\)/);
  assert.match(read('assets/css/admissions-home.css'), /\.bw-metric-band[^]*background:var\(--bw-brand-gradient\)/);
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

test('home foregrounds career search and Waybi, and restores six Holland routes with an import option', () => {
  const home = read('index.html');
  const hero = home.slice(home.indexOf('<section class="bw-hero"'), home.indexOf('<section class="bw-waybi-home"'));
  assert.match(hero, /Đi để lối thành[\s\S]*đường của bạn/);
  assert.match(hero, /href="careers-holland.html\?holland=all" class="bw-btn bw-btn-primary[\s\S]*Tra cứu ngành/);
  assert.match(hero, /href="page2.html" class="bw-btn bw-btn-outline[\s\S]*Tra cứu trường/);
  assert.doesNotMatch(hero, /Làm trắc nghiệm ngay/);
  assert.match(hero, /data-open-waybi/);
  assert.equal((home.match(/id="waybi-home"/g) || []).length, 1);
  assert.ok(home.indexOf('<section class="bw-waybi-home"') < home.indexOf('<section class="admissions-home"'));
  assert.ok(home.indexOf('<section class="home-holland"') < home.indexOf('<section class="admissions-home"'));
  for (const group of 'RIASEC') assert.match(home, new RegExp('href="careers-holland.html\\?holland=' + group + '"'));
  assert.match(home, /id="homeImportForm"/);
  assert.match(home, /Tôi đã làm test Holland rồi/);
});

test('homepage presents four access figures as a responsive metric band', () => {
  const home = read('index.html');
  const css = read('assets/css/admissions-home.css');
  const band = home.slice(home.indexOf('<div class="bw-metric-band'), home.indexOf('<section class="bw-waybi-home"'));
  assert.equal((band.match(/class="bw-metric-item"/g) || []).length, 4);
  assert.match(band, /data-visit-total[^]*tổng lượt truy cập/);
  assert.match(band, /data-visit-today[^]*lượt truy cập hôm nay/);
  assert.match(band, /data-visit-month[^]*lượt truy cập tháng này/);
  assert.match(band, /data-visit-online[^]*đang truy cập/);
  assert.doesNotMatch(band, /bw-trust-divider/);
  assert.match(css, /\.bw-metric-band[^]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:900px\)[^]*\.bw-metric-band[^]*repeat\(2,minmax\(0,1fr\)\)/);
});

test('career lookup has no quiz tab or mini-test; full test remains standalone', () => {
  const careers = read('careers-holland.html');
  assert.doesNotMatch(careers, /hollandTab|hollandPanel|hollandMini|holland-mini.js|2 công cụ trong/);
  assert.doesNotMatch(read('assets/js/careers.js'), /switchTab|activeTab/);
  assert.match(careers, /id="hollandFilter"/);
  assert.match(careers, /href="holland.html">Test Holland/);
  assert.match(read('holland.html'), /id="importForm"/);
});
