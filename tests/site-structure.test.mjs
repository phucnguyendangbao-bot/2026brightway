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
    assert.match(read(file), /\/assets\/css\/brightway-theme\.css\?v=[\w-]+/, file);
  }
  const theme = read('assets/css/brightway-theme.css');
  assert.match(theme, /--bw-brand:\s*#7969d0/);
  assert.match(theme, /--bw-brand-gradient:\s*linear-gradient\(135deg, #7969d0 0%, #8a77d4 100%\)/);
  assert.match(read('assets/css/admissions-home.css'), /\.bw-metric-band[^]*background:var\(--bw-brand-gradient\)/);
});

test('homepage tells one journey: hero, five chapters in order, then the ending', () => {
  const home = read('index.html');
  const order = ['id="hero-actions"', 'id="chuong-1"', 'id="chuong-2"', 'id="chuong-3"', 'id="chuong-4"', 'id="chuong-5"', 'id="chuong-ket"'];
  order.reduce((previous, marker) => { const at = home.indexOf(marker); assert.ok(at > previous, marker); return at; }, -1);
  for (const step of [0, 1, 2, 3, 4]) assert.equal((home.match(new RegExp(`data-step="${step}"`, 'g')) || []).length, 1);
  assert.doesNotMatch(home, /<section class="bw-(roadmap|tools|waybi-home|audience|timeline|stage|next|schools-mini|school-gallery)/);
  assert.doesNotMatch(home, /<div class="bw-(tabbar|fab|sticky-cta|metric-band)/);
  assert.doesNotMatch(home, /SPA ROUTER|id="spa-view"|id="schoolModal"/);
  assert.match(home, /href="holland.html#import-result"/);
  assert.match(home, /href="calendar.html#study-plan"/);
  assert.match(home, /data-journey-host/);
  assert.match(home, /data-countdown-slot/);
});

test('five primary pages ship the shared navigation before JavaScript enhancement', () => {
  const pages = ['index.html', 'careers-holland.html', 'page2.html', 'score-calculator.html', 'profile.html'];
  const labels = ['Trang chủ', 'Khám phá nghề', 'Khám phá trường', 'Tính điểm', 'Hành trình của tôi'];
  for (const file of pages) {
    const html = read(file);
    const nav = html.match(/<nav\b[^>]*class="[^"]*flow-nav[^"]*"[^>]*>[\s\S]*?<\/nav>/i)?.[0] || '';
    assert.ok(nav, `${file}: shared fallback header`);
    for (const label of labels) assert.match(nav, new RegExp(`>${label}<`), `${file}: ${label}`);
    assert.match(nav, />Waybi</, `${file}: Waybi access`);
    assert.doesNotMatch(nav, />Tra cứu nghề<|>Test Holland<|>Tra cứu & Test<|>Đề án tuyển sinh</, `${file}: legacy header label`);
  }
});

test('Can Tho University homepage photo uses a documented official source', () => {
  const home = read('index.html');
  const sources = read('assets/images/hero/SOURCES.md');
  assert.equal((home.match(/assets\/images\/hero\/02-ctu\.jpg\?v=4/g) || []).length, 2);
  assert.match(home, /alt="Nhà Điều hành Đại học Cần Thơ tại Khu II"/);
  assert.match(sources, /02-ctu\.jpg[\s\S]*www\.ctu\.edu\.vn\/images\/upload\/images\/IMG_4835\.jpg/);
});

test('12 study suggestions are separate from official admissions dates', () => {
  const calendar = read('calendar.html');
  assert.equal((calendar.match(/<details class="study-plan-month">/g) || []).length, 12);
  assert.match(calendar, /id="study-plan"/);
  assert.match(calendar, /không phải lịch tuyển sinh chính thức/);
  assert.match(calendar, /không tự xác định giai đoạn/);
});

test('home foregrounds three clear journeys, a Waybi guide per chapter, and a three-group Holland picker', () => {
  const home = read('index.html');
  const hero = home.slice(home.indexOf('<section class="bw-hero'), home.indexOf('id="chuong-1"'));
  assert.match(hero, /Đi để lối thành[\s\S]*đường của bạn/);
  assert.match(hero, /Bạn đang ở bước nào\?/);
  assert.match(hero, /href="holland.html"[\s\S]*Chưa biết chọn ngành gì/);
  assert.match(hero, /href="page2.html\?focus=major"[\s\S]*Đã có ngành yêu thích/);
  assert.match(hero, /href="score-calculator.html"[\s\S]*Muốn tính điểm xét tuyển/);
  assert.equal((hero.match(/class="home-journey-card"/g) || []).length, 3);
  assert.match(hero, /data-open-waybi/);
  assert.doesNotMatch(home, /id="waybi-home"/);
  for (const n of [1, 2, 3, 4]) assert.match(home, new RegExp(`data-waybi-line="${n}"`));
  const chapterOne = home.slice(home.indexOf('id="chuong-1"'), home.indexOf('id="chuong-2"'));
  assert.match(chapterOne, /<section class="home-holland" id="home-holland"/);
  assert.equal((chapterOne.match(/data-holland-slot=/g) || []).length, 3);
  for (const group of 'RIASEC') assert.match(home, new RegExp('data-holland-code="' + group + '"'));
  assert.match(home, /<strong>R<\/strong><span>Kỹ thuật<\/span>/);
  assert.match(home, /<strong>C<\/strong><span>Nghiệp vụ<\/span>/);
  assert.equal((home.match(/data-holland-code=/g) || []).length, 6);
  assert.match(home, /id="homeHollandSubmit" disabled/);
  assert.match(home, /Chọn đúng 3 nhóm theo thứ tự ưu tiên/);
  const chapterThree = home.slice(home.indexOf('id="chuong-3"'), home.indexOf('id="chuong-4"'));
  assert.match(chapterThree, /id="university-discovery"/);
  assert.match(chapterThree, /id="admissions-news"/);
});

test('shared journey uses a versioned local profile and simplified navigation', () => {
  const flow = read('assets/js/flow.js');
  assert.match(flow, /bwJourneyV2/);
  assert.match(flow, /version:\s*2/);
  assert.match(flow, /Hành trình của tôi/);
  assert.match(flow, /Tìm ngành & trường/);
  assert.match(flow, /data-flow-reset/);
  assert.match(flow, /savedCareers/);
  assert.match(flow, /savedMajors/);
  assert.match(flow, /savedSchools/);
});

test('school lookup searches verified 2026 programs and lets visitors save schools', () => {
  const page = read('page2.html');
  const script = read('assets/js/page2.js');
  assert.match(page, /Tìm ngành, trường, mã trường hoặc thành phố/);
  assert.match(page, /schoolSearchSuggestions/);
  assert.match(script, /function matchingPrograms/);
  assert.match(script, /detailsForSchool\(school\.id\)\?\.programs/);
  assert.match(script, /data-action="save-school"/);
  assert.match(script, /addUnique\('savedSchools'/);
});

test('score calculator progressively reveals inputs by admission method', () => {
  const page = read('score-calculator.html');
  const script = read('assets/js/score-calculator.js');
  for (const method of ['thpt', 'transcript', 'other']) assert.match(page, new RegExp(`name="admissionMethod" value="${method}"`));
  assert.match(page, /id="transcriptCard" hidden/);
  assert.match(page, /id="otherExamCard" hidden/);
  assert.match(script, /function updateMethodUI/);
  assert.match(script, /method === 'other'/);
  assert.match(script, /calc-input-error/);
  assert.match(page, /name="targetMode" value="quick" checked/);
  assert.match(page, /name="targetMode" value="guided"/);
  assert.match(page, /id="targetSelectors" hidden/);
  assert.match(page, /id="resultTarget"/);
  assert.match(script, /target:\s*null/);
  assert.match(script, /Hãy chọn trường trước khi đối chiếu/);
  assert.match(script, /Hãy chọn ngành hoặc chương trình đào tạo/);
});

test('manual Holland codes require exactly three distinct RIASEC letters', () => {
  const homeImport = read('assets/js/home-holland.js');
  const holland = read('assets/js/holland.js');
  const flow = read('assets/js/flow.js');
  for (const source of [homeImport, holland, flow]) {
    assert.match(source, /\^\[RIASEC\]\{3\}\$/);
    assert.doesNotMatch(source, /\^\[RIASEC\]\{1,3\}\$/);
  }
  assert.match(homeImport, /selected\.length === 3/);
  assert.match(homeImport, /selected\.length < 3/);
  assert.match(holland, /new Set\(code\)\.size === 3/);
  assert.match(flow, /new Set\(code\)\.size === 3/);
});

test('homepage loading states keep their size instead of printing placeholder text', () => {
  const home = read('index.html');
  const story = home.slice(home.indexOf('data-story'), home.indexOf('class="bw-faq"'));
  assert.match(story, /data-catalog-count><span class="bw-skeleton-text"/);
  assert.equal((story.match(/class="bw-skeleton university-skeleton"/g) || []).length, 3);
  assert.doesNotMatch(story, />…</);
  assert.doesNotMatch(story, />Đang tải hồ sơ giới thiệu trường…</);
  assert.match(read('assets/css/motion.css'), /\.bw-skeleton\s*\{/);
});

test('homepage motion uses shared tokens and keeps a single looping signal', () => {
  const home = read('index.html');
  const motion = read('assets/css/motion.css');
  const story = read('assets/css/story.css');
  for (const token of ['--motion-fast', '--motion-sm', '--motion-md', '--motion-lg', '--motion-ease']) assert.match(motion, new RegExp(token + ':'));
  assert.match(motion, /prefers-reduced-motion: reduce/);
  const loops = [home, story].join('\n').match(/animation:[^;]*infinite/g) || [];
  assert.deepEqual(loops.map(rule => rule.match(/animation:\s*([\w-]+)/)[1]).sort(), ['bwDot', 'now-pulse']);
  assert.doesNotMatch(home, /bwHeroAutoplay|setInterval\(next/);
  assert.match(story, /prefers-reduced-motion: reduce[\s\S]*\.month-now-dot \{ animation: none/);
  assert.doesNotMatch(read('assets/js/waybi-presence.js'), /infinite/);
});

test('career lookup has no quiz tab or mini-test; full test remains standalone', () => {
  const careers = read('careers-holland.html');
  const script = read('assets/js/careers.js');
  assert.doesNotMatch(careers, /hollandTab|hollandPanel|hollandMini|holland-mini.js|2 công cụ trong/);
  assert.doesNotMatch(script, /switchTab|activeTab/);
  assert.match(careers, /id="hollandFilter"/);
  assert.match(careers, /href="holland.html">Trắc nghiệm Holland/);
  assert.match(read('holland.html'), /id="importForm"/);
  assert.match(script, /state\.importedCode\.includes\(k\)/);
  assert.match(script, /state\.importedCode\.indexOf\(k\) \+ 1/);
  assert.match(script, /\[\.\.\.state\.importedCode\]\.some\(code => \(j\.holland \|\| \[\]\)\.includes\(code\)\)/);
});

test('school admission sidebar is text-only without decorative icons', () => {
  const page = read('page2.html');
  const script = read('assets/js/page2.js');
  const sidebarSource = script.slice(script.indexOf('function renderSidebar'), script.indexOf('function renderSchools'));
  assert.match(page, /<div class="p2-sidebar-title">Phương thức xét tuyển theo trường<\/div>/);
  assert.doesNotMatch(sidebarSource, /📚|💻|⚙️|🔬|🏥|🌾|💼|🎓|🌐|🏫/);
  assert.doesNotMatch(sidebarSource, /p2-sidebar-(logo|emoji)/);
  assert.doesNotMatch(sidebarSource, /UNILogoImg/);
});

test('school lookup exposes only 2026 admissions information', () => {
  const page = read('page2.html');
  const script = read('assets/js/page2.js');
  assert.match(page, /TRA CỨU TUYỂN SINH · 2026/);
  assert.doesNotMatch(page, /2024–2026/);
  assert.doesNotMatch(script, /school-dialog-years|data-action="school-year"/);
  assert.doesNotMatch(script, /historyForSchool|\[2024, 2025, 2026\]/);
  assert.match(script, /params\.get\('admission_year'\) === '2026'/);
});

test('school profiles expose verified coverage and fail closed for missing 2026 tuition', () => {
  const script = read('assets/js/page2.js');
  assert.match(script, /renderProfileCoverage/);
  assert.match(script, /Học phí & học bổng/);
  assert.match(script, /Chưa có dữ liệu học phí \$\{activeYear\} đã xác minh/);
  assert.match(script, /không dùng mức học phí cũ hoặc dữ liệu không rõ chương trình/);
  assert.match(script, /data-action="score-program"/);
  assert.match(script, /target:\s*\{\s*mode:\s*'guided'/);
});
