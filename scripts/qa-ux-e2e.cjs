const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const artifactDir = path.join(root, '.cache', 'ux-e2e');
fs.mkdirSync(artifactDir, { recursive: true });

const mime = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!target.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = fs.readFileSync(target);
    response.writeHead(200, { 'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

function listen() {
  return new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
}

function closeServer() {
  return new Promise(resolve => server.close(resolve));
}

async function newCheckedPage(browser, base, viewport) {
  const context = await browser.newContext({ viewport, timezoneId: 'Asia/Ho_Chi_Minh' });
  const page = await context.newPage();
  const errors = [];
  const localOrigin = new URL(base).origin;
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('response', response => {
    if (response.url().startsWith(localOrigin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith(localOrigin)) errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`);
  });
  return { context, page, errors };
}

async function testNewUser(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1440, height: 1000 });
  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.home-journey-card').count(), 3);
  assert.deepEqual(await page.locator('.home-journey-card strong').allTextContents(), [
    'Chưa biết chọn ngành gì', 'Đã có ngành yêu thích', 'Muốn tính điểm xét tuyển',
  ]);
  const expected = [/holland\.html$/, /page2\.html\?focus=major$/, /score-calculator\.html$/];
  for (let index = 0; index < expected.length; index += 1) {
    await page.locator('.home-journey-card').nth(index).click();
    await page.waitForURL(expected[index]);
    await page.goBack({ waitUntil: 'domcontentloaded' });
  }
  for (const selector of ['#roadmap', '#tools', '.bw-faq']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(550);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(artifactDir, 'after-home-1440.png'), fullPage: true });
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '01-new-user', status: 'PASS', assertions: 5 });
}

async function testHolland(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1440, height: 1000 });
  await page.goto(`${base}/holland.html`, { waitUntil: 'domcontentloaded' });
  for (let index = 0; index < 42; index += 1) {
    const score = (index % 5) + 1;
    await page.locator(`.q-btn[data-idx="${index}"][data-val="${score}"]`).click();
    if ((index + 1) % 5 === 0 && index < 41) await page.locator('#btnNext').click();
  }
  await page.locator('#btnFinish').click();
  await page.locator('#resultCard.show').waitFor();
  assert.match(await page.locator('#rCode').innerText(), /^[RIASEC] – [RIASEC] – [RIASEC]$/);
  assert.ok(await page.locator('#rMajors a[href*="page2.html?mode=major"]').count() > 0);
  assert.match(await page.locator('#resultInterpretation').innerText(), /gợi ý|RIASEC/i);
  assert.equal(await page.locator('#resultCareersLink').innerText(), 'Tiếp tục khám phá →');
  await page.locator('#resultCareersLink').click();
  await page.waitForURL(/careers-holland\.html\?holland=[RIASEC]{3}$/);
  await page.locator('.career-list-item').first().waitFor();
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.locator('#resultCard.show').waitFor();
  assert.ok(await page.evaluate(() => Boolean(localStorage.getItem('studentHollandV1'))));
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '02-holland-flow', status: 'PASS', assertions: 7 });
}

async function testSchoolSearch(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1440, height: 1000 });
  await page.goto(`${base}/page2.html?mode=major`, { waitUntil: 'domcontentloaded' });
  await page.locator('.school-section').first().waitFor();
  assert.equal(await page.locator('input[name="schoolSearchMode"][value="major"]').isChecked(), true);
  await page.locator('#searchInput').fill('Cong nghe thong tin');
  await page.waitForFunction(() => document.querySelectorAll('.school-section').length > 0 && document.querySelector('#schoolCatalogStatus').textContent.includes('Cong nghe thong tin'));
  const majorCount = await page.locator('.school-section').count();
  assert.ok(majorCount > 0);
  const matchText = (await page.locator('.school-card-programs').allTextContents()).join(' ');
  assert.match(matchText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), /cong nghe thong tin/);
  await page.locator('.school-card-open').first().click();
  await page.locator('#schoolDialog[open]').waitFor();
  await page.locator('[data-action="close-school"]').click();
  assert.equal(await page.locator('#searchInput').inputValue(), 'Cong nghe thong tin');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.school-section').first().waitFor();
  assert.equal(await page.locator('#searchInput').inputValue(), 'Cong nghe thong tin');
  await page.locator('input[name="schoolSearchMode"][value="school"]').check();
  await page.locator('#searchInput').fill('Dai hoc Bach khoa');
  await page.waitForFunction(() => document.querySelectorAll('.school-section').length > 0 && document.querySelector('#schoolCatalogStatus').textContent.includes('Dai hoc Bach khoa'));
  assert.match((await page.locator('.school-name').allTextContents()).join(' '), /Bách khoa/i);
  assert.ok(await page.locator('#regionFilter option').count() > 2);
  await page.screenshot({ path: path.join(artifactDir, 'after-school-search-1440.png'), fullPage: true });
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '03-school-search', status: 'PASS', assertions: 8, results: majorCount });
}

async function testVerifiedSchoolLogos(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 920, height: 620 });
  await page.goto(`${base}/page2.html?mode=school`, { waitUntil: 'domcontentloaded' });
  await page.locator('.school-section').first().waitFor();

  const cases = [
    { query: 'VLU', id: 'vlu', file: 'vlu-official.svg' },
    { query: 'HuemedU', id: 'huemed', file: 'huemedu-official.png' },
    { query: 'DUE', id: 'due', file: 'due-official.png' },
  ];

  for (const item of cases) {
    await page.goto(`${base}/page2.html?mode=school&q=${encodeURIComponent(item.query)}`, { waitUntil: 'domcontentloaded' });
    const image = page.locator(`#icon-${item.id} img`);
    await image.waitFor();
    await page.waitForFunction(selector => {
      const node = document.querySelector(selector);
      return Boolean(node?.complete && node.naturalWidth > 0);
    }, `#icon-${item.id} img`);
    assert.equal(await image.evaluate(node => node.complete && node.naturalWidth > 0), true);
    assert.match(await image.getAttribute('src'), new RegExp(`${item.file.replace('.', '\\.')}$`));
    assert.equal(await page.locator(`#${item.id}`).count(), 1);
    await page.locator(`#${item.id}`).screenshot({ path: path.join(artifactDir, `school-logo-${item.id}.png`) });
  }

  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '04-verified-school-logos', status: 'PASS', assertions: 10 });
}

async function testScoreCalculator(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1440, height: 1000 });
  await page.goto(`${base}/score-calculator.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#resetBtn').click();
  assert.equal(await page.locator('#examCard .score-input:visible').count(), 3);
  assert.deepEqual(await page.locator('#examCard .score-input:visible span').allTextContents(), ['Toán', 'Vật lý', 'Hóa học']);
  for (const id of ['sMath', 'sPhy', 'sChe']) await page.locator(`#${id}`).fill('8');
  await page.locator('#calcBtn').click();
  assert.equal(await page.locator('#sumCombo').innerText(), '24.00');
  assert.equal(await page.locator('#resultMethod').innerText(), 'Điểm thi tốt nghiệp THPT');
  assert.match(await page.locator('#resultFormula').innerText(), /8\.00.*8\.00.*8\.00.*24\.00/);
  assert.match(await page.locator('#resultAdjustments').innerText(), /Chưa áp dụng/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(artifactDir, 'after-score-a00-1440.png'), fullPage: true });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#sMath').inputValue(), '8');
  await page.locator('#sChe').fill('');
  await page.locator('#calcBtn').click();
  assert.match(await page.locator('#calcError').innerText(), /Hóa học/);
  await page.locator('#sChe').fill('11');
  await page.locator('#calcBtn').click();
  assert.match(await page.locator('#calcError').innerText(), /0 đến 10/);
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '04-score-a00', status: 'PASS', assertions: 10 });
}

async function testResponsiveAndRegression(browser, base, report) {
  const widths = [320, 360, 390, 768, 1366, 1920];
  const files = ['index.html', 'holland.html', 'careers-holland.html', 'page2.html?mode=major', 'score-calculator.html', 'profile.html?tab=journey'];
  let checks = 0;
  const layoutFailures = [];
  for (const width of widths) {
    const { context, page, errors } = await newCheckedPage(browser, base, { width, height: 900 });
    for (const file of files) {
      await page.goto(`${base}/${file}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.flow-logo').waitFor();
      const overflowing = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[hidden], .school-program-table-wrap');
      }).slice(0, 12).map(el => ({tag:el.tagName,id:el.id,class:el.className,width:Math.round(el.getBoundingClientRect().width)})));
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) layoutFailures.push({file,width,overflowing});
      if (width === 320 || width === 1366) await page.screenshot({ path: path.join(artifactDir, `review-${file.split('.')[0]}-${width}.png`), fullPage: true });
      if (width < 1180) {
        await page.locator('.flow-menu').click();
        assert.equal(await page.locator('.flow-menu').getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.flow-menu').getAttribute('aria-expanded'), 'false');
      }
      const launcher = page.locator('#bwChatLauncher');
      if (await launcher.count()) {
        const box = await launcher.boundingBox();
        assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1);
      }
      checks += 1;
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  assert.deepEqual(layoutFailures, [], JSON.stringify(layoutFailures));

  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1440, height: 1000 });
  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  assert.deepEqual(await page.locator('.flow-links > a').evaluateAll(links => links.slice(0, 5).map(link => link.textContent.trim())), [
    'Trang chủ', 'Khám phá nghề', 'Tìm ngành & trường', 'Tính điểm', 'Hành trình của tôi',
  ]);
  await page.locator('[data-open-waybi]').first().click();
  await page.locator('#bwChatPanel.open').waitFor();
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '05-mobile', status: 'PASS', viewports: widths, pageChecks: checks });
  report.push({ test: '06-regression', status: 'PASS', assertions: 3 });
}

async function testJourneyPersistence(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 390, height: 844 });
  await page.goto(`${base}/holland.html`, { waitUntil: 'domcontentloaded' });
  for (let index = 0; index < 5; index++) await page.locator(`.q-btn[data-idx="${index}"][data-val="4"]`).click();
  assert.equal(await page.locator('.q-btn[data-idx="0"]').count(), 5, 'Quiz must not advance automatically');
  await page.locator('#btnNext').click();
  await page.locator('.q-btn[data-idx="5"][data-val="2"]').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.q-btn[data-idx="5"][data-val="2"]').getAttribute('aria-pressed'), 'true');
  await page.locator('#btnPrev').click();
  assert.equal(await page.locator('.q-btn[data-idx="0"][data-val="4"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-skip-holland]').click();
  await page.locator('.career-list-item').first().waitFor();
  await page.locator('#careerSearch').fill('lap trinh');
  await page.locator('#careerSearch').press('Enter');
  const unaccented = await page.locator('.career-list-item').count();
  await page.locator('#careerSearch').fill('lập trình');
  await page.locator('#careerSearch').press('Enter');
  assert.equal(await page.locator('.career-list-item').count(), unaccented);
  assert.ok(unaccented > 0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.career-list-item').first().waitFor();
  assert.equal(await page.locator('#careerSearch').inputValue(), 'lập trình');
  await page.locator('.career-list-item').first().click();
  await page.locator('#favBtn').click();
  assert.equal(await page.evaluate(() => BWFlow.read().savedCareers.length), 1);

  await page.goto(`${base}/page2.html?mode=school&q=FPT`, { waitUntil: 'domcontentloaded' });
  await page.locator('#fpt .school-card-open').click();
  await page.locator('[data-action="save-school"]').click();
  await page.locator('[data-action="save-major"]').first().click();
  await page.locator('.school-program-actions a').first().click();
  await page.waitForFunction(() => document.querySelector('#targetProgram')?.value === '0');
  assert.equal(await page.locator('#targetSchool').inputValue(), 'fpt');
  assert.equal(await page.evaluate(() => BWFlow.progress()[3].complete), false, 'Selecting a method is not completion');
  for (const id of ['sMath', 'sPhy', 'sChe']) await page.locator(`#${id}`).fill('8');
  await page.locator('#calcBtn').click();
  assert.equal(await page.locator('#sumCombo').innerText(), '24.00');
  await page.goto(`${base}/profile.html?tab=journey`, { waitUntil: 'domcontentloaded' });
  await page.locator('#journeyTask').fill('Đọc đề án FPT');
  await page.locator('#journeyTaskForm button').click();
  await page.locator('#journeyTasks input').check();
  assert.match(await page.locator('.flow-profile-details').innerText(), /24\.00/);
  assert.match(await page.locator('.flow-profile-details').innerText(), /Công nghệ thông tin/);
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#journeyTasks input').isChecked(), true);
  assert.equal(await page.locator('.flow-journey-steps .is-complete').count(), 4);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(artifactDir, 'profile-saved-390.png'), fullPage: true });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-flow-reset]').click();
  await page.waitForFunction(() => !localStorage.getItem('bwJourneyV2') && !localStorage.getItem('studentHollandV1'));
  assert.equal(await page.locator('#journeyTasks input').count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '08-persistence-and-back-navigation', status: 'PASS', checks: 'partial quiz, explicit next, accented search, save career/major/school, target handoff, scores, tasks, reset' });
}

async function testFailureStates(browser, base, report) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', error => jsErrors.push(error.message));
  await page.route('**/assets/data/schools.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(`${base}/score-calculator.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#retryTarget').waitFor();
  assert.match(await page.locator('#targetStatus').innerText(), /Chưa tải/);
  await page.unroute('**/assets/data/schools.json');
  await page.locator('#retryTarget').click();
  await page.waitForFunction(() => document.querySelector('#targetSchool').options.length > 1);
  await page.locator('#targetSchool').selectOption('huemed');
  assert.equal(await page.locator('#targetProgram').isDisabled(), true);
  assert.equal(await page.locator('#fptCard').isVisible(), false);
  await page.locator('input[name="admissionMethod"][value="other"]').check();
  await page.locator('#examType').selectOption('sHsa');
  assert.equal(await page.locator('#otherExamCard .dgnl-input:visible').count(), 1);
  await page.locator('#sHsa').fill('151');
  await page.locator('#calcBtn').click();
  assert.match(await page.locator('#calcError').innerText(), /150/);
  await page.locator('#sHsa').fill('0');
  await page.locator('#calcBtn').click();
  assert.equal(await page.locator('#sumHsa').innerText(), '0');
  await page.route('**/api/chat', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.locator('#waybi-fab').click();
  await page.locator('#waybi-input').fill('Giải thích điểm gốc');
  await page.locator('#waybi-send').click();
  await page.locator('#waybi-messages a[href*="page2"]').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#waybi-fab').evaluate(node => node === document.activeElement), true);
  assert.deepEqual(jsErrors, []);
  await context.close();

  const blocked = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage disabled', 'QuotaExceededError'); };
  });
  const tab = await blocked.newPage();
  await tab.goto(`${base}/holland.html`, { waitUntil: 'domcontentloaded' });
  await tab.locator('.q-btn[data-idx="0"][data-val="3"]').click();
  await tab.locator('#journeyStorageNotice').waitFor();
  assert.match(await tab.locator('#journeyStorageNotice').innerText(), /Chưa lưu được/);
  assert.equal(await tab.locator('.q-btn[data-idx="0"][data-val="3"]').getAttribute('aria-pressed'), 'true');
  await blocked.close();
  report.push({ test: '09-failure-states', status: 'PASS', checks: '503 + retry, missing program, exam bounds 0/151, Waybi fallback, blocked storage' });
}

async function testSlowAndEmptyData(browser, base, report) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/assets/data/schools.json', async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto(`${base}/page2.html?mode=school&q=khongcotrường123`, { waitUntil: 'domcontentloaded' });
  assert.match(await page.locator('#schoolCatalogStatus').innerText(), /Đang tải/);
  await page.locator('.p2-no-results').waitFor();
  assert.match(await page.locator('.p2-no-results').innerText(), /Không tìm thấy/);
  await page.locator('#searchInput').fill('<img src=x onerror=alert(1)>');
  await page.waitForFunction(() => document.querySelector('#schoolCatalogStatus').textContent.includes('<img'));
  assert.equal(await page.locator('#schoolCatalogStatus img').count(), 0);
  await page.route('**/assets/data/jobs.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto(`${base}/careers-holland.html`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Chưa có dữ liệu nghề nghiệp hợp lệ.', { exact: false }).waitFor();
  await context.close();
  report.push({ test: '10-slow-empty-and-untrusted-input', status: 'PASS', checks: '900ms delayed catalog, empty career data, Vietnamese empty search, HTML input rendered as text, reduced motion' });
}

async function testInformationAndFunctionAudit(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1366, height: 900 });
  await page.goto(`${base}/score-calculator.html?school=fpt&program=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#targetProgram')?.value === '0');
  await page.locator('#comboSelect').selectOption('C00');
  for (const id of ['sLit','sHis','sGeo']) await page.locator(`#${id}`).fill('8');
  await page.locator('#fptCard summary').click();
  await page.locator('#sGrade12').fill('8');
  await page.locator('#calcBtn').click();
  assert.match(await page.locator('#schoolList .school-row-status').innerText(), /không áp dụng cho ngành/);
  assert.doesNotMatch(await page.locator('#schoolList .school-outcome').innerText(), /Thành phần điểm kết hợp/);
  await page.locator('#targetProgram').selectOption('2');
  await page.locator('#calcBtn').click();
  assert.match(await page.locator('#schoolList .school-row-status').innerText(), /24.00/);
  await page.locator('#targetProgram').selectOption('0');
  await page.locator('#comboSelect').selectOption('D01');
  for (const id of ['sMath','sLit','sEng']) await page.locator(`#${id}`).fill('8');
  await page.locator('#calcBtn').click();
  assert.match(await page.locator('#schoolList .school-row-status').innerText(), /24.00/);
  await page.locator('#targetSchool').selectOption('ctu');
  await page.locator('input[name="admissionMethod"][value="transcript"]').check();
  for (const id of ['hMath','hLit','hEng']) await page.locator(`#${id}`).fill('8');
  await page.locator('#calcBtn').click();
  await page.locator('#schoolList details summary').click();
  assert.match(await page.locator('#schoolList .school-outcome').innerText(), /Tổng học bạ gốc/);
  assert.doesNotMatch(await page.locator('#schoolList .school-outcome').innerText(), /Chưa xác nhận ngưỡng/);
  await page.locator('input[name="admissionMethod"][value="other"]').check();
  await page.locator('#examType').selectOption('sHsa');
  await page.locator('#sHsa').fill('100');
  await page.locator('#calcBtn').click();
  await page.locator('#schoolList details summary').click();
  assert.match(await page.locator('#schoolList .school-outcome').innerText(), /Chưa có công thức quy đổi/);
  await page.goto(`${base}/profile.html?tab=journey`, { waitUntil: 'domcontentloaded' });
  await page.locator('.flow-profile-details').waitFor();
  assert.match(await page.locator('.flow-profile-details').innerText(), /HSA: 100\/150/);

  await page.goto(`${base}/score-calculator.html?school=hufi`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#targetSchool')?.value === 'hufi');
  assert.equal(await page.locator('#targetStatus a[href*="tuyensinh247"]').count(), 0);
  await page.goto(`${base}/page2.html#%E0%A4%A`, { waitUntil: 'domcontentloaded' });
  await page.locator('#hue-uni').waitFor();
  assert.match(await page.locator('#hue-uni .school-card-kicker').innerText(), /HUEUNI/);
  assert.equal(await page.locator('#icon-hue-uni img').count(), 0);
  assert.match(await page.locator('#hub .school-card-status').innerText(), /nguồn thứ cấp/);
  await page.goto(`${base}/page2.html?school=hub`, { waitUntil: 'domcontentloaded' });
  await page.locator('#schoolDialog[open]').waitFor();
  assert.match(await page.locator('#schoolDialog').innerText(), /nguồn tra cứu thứ cấp/);
  await page.goto(`${base}/page2.html?school=uit`, { waitUntil: 'domcontentloaded' });
  await page.locator('#schoolDialog[open]').waitFor();
  assert.match(await page.locator('#schoolDialog').innerText(), /Chưa đối chiếu mã/);
  await page.goto(`${base}/page2.html?school=ntu`, { waitUntil: 'domcontentloaded' });
  await page.locator('#schoolDialog[open]').waitFor();
  assert.match(await page.locator('#schoolDialog').innerText(), /thang 40/);

  const query = encodeURIComponent('Bác sĩ đa khoa');
  await page.goto(`${base}/careers-holland.html?holland=all&q=${query}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#favBtn').waitFor();
  assert.match(await page.locator('.career-result').innerText(), /12 tháng/);
  assert.equal(await page.locator('a[href*="baochinhphu.vn"]').count(), 1);
  // Simulate an existing cloud favorite, without writing to a real account.
  await page.evaluate(() => {
    BWAuth.isSignedIn = () => true;
    BWSync.isFavorited = async () => true;
    BWSync.logSearch = async () => {};
    window.auditFavoriteCalls = 0;
    BWSync.toggleFavorite = async () => { window.auditFavoriteCalls++; return {saved:false}; };
  });
  await page.locator('#careerSearch').fill('Phi công');
  await page.locator('#careerSearch').press('Enter');
  await page.waitForFunction(() => document.querySelector('#favBtn')?.getAttribute('aria-pressed') === 'true');
  await page.locator('#favBtn').click();
  await page.waitForFunction(() => window.auditFavoriteCalls === 1);
  assert.equal(await page.locator('#favBtn').getAttribute('aria-pressed'), 'false');
  assert.doesNotMatch(await page.locator('.career-result').innerText(), /2–5 tỷ/);
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test:'11-information-and-functional-audit', status:'PASS', checks:'FPT subject/program restrictions; CTU method isolation; HSA profile persistence; source provenance; Hue identity; malformed hash; doctor practice source; cloud favorite removal (simulated)' });
}

async function testLegacyMajorInformation(browser, base, report) {
  const { context, page, errors } = await newCheckedPage(browser, base, { width: 1366, height: 900 });
  const untrusted = '<img src=x onerror="window.auditXss=true">';
  const fixture = {
    slug: "x');window.auditXss=true;//", name_vi: 'Ngành thử ' + untrusted,
    name_en: untrusted, category: untrusted, description: 'Dữ liệu giả lập để kiểm thử hiển thị.',
    salary_range: '999 triệu/tháng', job_prospects: '100% có việc làm',
    top_universities: [untrusted], views_count: untrusted,
  };
  // Replace only the data boundary: no CMS/account reads or writes in this fixture test.
  await context.route('**/assets/js/supabase-client.js', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.getSupabase=async()=>({auth:{getUser:async()=>({data:{user:null}})}});',
  }));
  await context.route('**/assets/js/cms-service.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.auditFixture=${JSON.stringify(fixture)};window.CMS={listMajors:async()=>[window.auditFixture],getMajorBySlug:async slug=>{window.auditRequestedSlug=slug;return window.auditFixture;},categoryLabel:()=>window.auditFixture.category};`,
  }));
  await page.goto(`${base}/majors.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.major-card').waitFor();
  assert.equal(await page.locator('#main-content img').count(), 0);
  assert.match(await page.locator('#main-content').innerText(), /chưa có nguồn\/năm đối chiếu/);
  assert.doesNotMatch(await page.locator('#main-content').innerText(), /999 triệu|100% có việc làm/);
  await page.locator('.major-card').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/major-detail.html?slug=*');
  await page.locator('.header-card').waitFor();
  assert.equal(await page.evaluate(() => window.auditRequestedSlug), fixture.slug);
  assert.equal(await page.locator('#container img').count(), 0);
  assert.match(await page.locator('#container').innerText(), /Chưa có nguồn và năm khảo sát/);
  assert.doesNotMatch(await page.locator('#container').innerText(), /999 triệu|100% có việc làm|trường hàng đầu/i);
  assert.match(await page.locator('.uni-card-name').innerText(), /<img src=x/);
  assert.equal(await page.evaluate(() => Boolean(window.auditXss)), false);
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test:'12-legacy-major-provenance-and-safe-rendering', status:'PASS', checks:'simulated CMS data: unsupported salary/employment claims withheld; HTML rendered as text; encoded slug and keyboard navigation; unknown school safe fallback' });
}

async function testUniversityDiscoveryAndPrivacy(browser, base, report) {
  const {context,page,errors} = await newCheckedPage(browser,base,{width:390,height:900});
  await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('[data-featured-universities] .university-card').length===3);
  for (const card of await page.locator('.home-journey-card').all()) assert.equal(await card.isVisible(),true);
  assert.equal(await page.locator('#bwHeroCarousel .slide').count(),8);
  assert.equal(await page.locator('#admissionsHighlights .admissions-news-card').count(),3);
  assert.equal(await page.locator('.is-sponsored').count(),0);
  assert.equal(await page.locator('[data-university-discovery-retry]').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.querySelector('#university-discovery').getBoundingClientRect().top > document.querySelector('.home-journey-grid').getBoundingClientRect().bottom),true);
  const metrics = () => page.evaluate(async()=> (await import('/assets/js/university-promotion-metrics.js')).promotionMetrics.snapshot());
  const firstCard = page.locator('[data-featured-universities] .university-card').first();
  const firstLink = firstCard.locator('.university-card-actions a').first();
  await firstLink.evaluate(link=>link.addEventListener('click',event=>event.preventDefault()));
  await firstLink.click();
  assert.deepEqual(await metrics(),[]);
  await page.locator('.university-transparency summary').click();
  await page.locator('[data-promotion-consent]').check();
  await firstCard.scrollIntoViewIfNeeded();
  await page.waitForFunction(async()=> (await import('/assets/js/university-promotion-metrics.js')).promotionMetrics.snapshot().some(row=>row.action==='impression'),{},{timeout:6000});
  await firstLink.click();
  assert.ok((await metrics()).some(row=>row.action==='click'));
  await page.locator('[data-promotion-consent]').uncheck();
  assert.deepEqual(await metrics(),[]);

  await page.locator('[data-open-university-consultation="fpt-consultation"]').click();
  const consultation = page.locator('.university-consultation-dialog[open]');
  await consultation.waitFor();
  assert.equal(await consultation.locator('[data-consultation-confirm]').isChecked(),false);
  assert.equal(await consultation.locator('[data-consultation-continue]').isVisible(),false);
  assert.equal(await consultation.locator('input:not([type="checkbox"])').count(),0);
  await consultation.locator('[data-consultation-confirm]').check();
  const outbound = consultation.locator('[data-consultation-continue]');
  assert.equal(await outbound.getAttribute('referrerpolicy'),'no-referrer');
  assert.match(await outbound.getAttribute('href'),/^https:\/\/daihoc\.fpt\.edu\.vn\//);
  await consultation.locator('[data-consultation-cancel]').click();
  assert.equal(await page.locator('.university-consultation-dialog[open]').count(),0);
  await page.locator('#university-discovery').screenshot({path:path.join(artifactDir,'university-discovery-390.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.goto(`${base}/page2.html?school=fpt`,{waitUntil:'domcontentloaded'});
  await page.locator('#schoolDialog[open]').waitFor();
  await page.locator('[data-tab="opportunities"]').click();
  assert.match(await page.locator('#schoolDialogPanel').innerText(),/Học bổng Nguyễn Văn Đạo/);
  assert.equal(await page.locator('#schoolDialogPanel .is-sponsored').count(),0);
  assert.match(await page.locator('#schoolDialogPanel').innerText(),/Tư liệu đã công bố/);
  await page.locator('[data-tab="opportunities"]').press('ArrowLeft');
  assert.equal(await page.locator('[data-tab="admission"]').getAttribute('aria-selected'),'true');
  await page.locator('[data-tab="admission"]').press('ArrowRight');
  assert.equal(await page.locator('[data-tab="opportunities"]').getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
  await context.close();
  report.push({test:'13-university-discovery-and-privacy',status:'PASS',checks:'three visible student intents on mobile; preserved 8 campus slides and 3 news cards; 3 editorial profiles; consent defaults off/opt-in impressions and clicks/erase; voluntary outbound consultation gate with no contact fields; profile opportunities'});
}

async function testSponsoredPlacementIsolation(browser, base, report) {
  const {context,page,errors} = await newCheckedPage(browser,base,{width:1366,height:900});
  const target = `${base}/page2.html?mode=major&q=${encodeURIComponent('Công nghệ thông tin')}`;
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.locator('#mainContent .school-section').first().waitFor();
  const baseline = await page.locator('#mainContent .school-section').evaluateAll(cards=>cards.map(card=>card.id));
  const now = Date.now();
  const date = delta=>new Date(now+delta*86400000).toISOString();
  const partner = {id:'synthetic-partner',schoolId:'fpt',status:'verified',verifiedAt:date(-1),expiresAt:date(2)};
  const campaign = {id:'synthetic-campaign',partnerId:partner.id,schoolId:'fpt',funding:'sponsored',status:'verified',availability:'active',kind:'admissions',title:'Synthetic test campaign',description:'Browser fixture only; not a real partnership.',verifiedAt:date(-1),startsAt:date(-1),endsAt:date(1),placements:['home_featured','major_context'],programCodes:['7480201'],sourceUrl:'https://daihoc.fpt.edu.vn/'};
  const original = fs.readFileSync(path.join(root,'assets/data/university-promotions.js'),'utf8');
  await context.route('**/assets/data/university-promotions.js',route=>route.fulfill({contentType:'application/javascript',body:original.replace('export const universityPartners = [];',`export const universityPartners = ${JSON.stringify([partner])};`).replace('export const universityCampaigns = [];',`export const universityCampaigns = ${JSON.stringify([campaign])};`)}));
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.locator('#contextualUniversityPromotions .is-sponsored').waitFor();
  assert.deepEqual(await page.locator('#mainContent .school-section').evaluateAll(cards=>cards.map(card=>card.id)),baseline);
  assert.equal(await page.locator('#mainContent .is-sponsored').count(),0);
  assert.equal(await page.locator('#contextualUniversityPromotions .is-sponsored').innerText(),'Được tài trợ');
  assert.ok(await page.locator('#contextualUniversityPromotions a[rel~="sponsored"]').count()>0);
  await page.locator('#contextualUniversityPromotions').screenshot({path:path.join(artifactDir,'university-context-sponsored-fixture-1366.png')});
  await page.locator('#searchInput').fill('Y khoa');
  await page.waitForFunction(()=>document.querySelector('#schoolCatalogStatus').textContent.includes('Y khoa'));
  assert.equal(await page.locator('#contextualUniversityPromotions .is-sponsored').count(),0);
  await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-sponsored-universities] .is-sponsored').waitFor();
  assert.equal(await page.locator('[data-featured-universities] .is-sponsored').count(),0);
  assert.deepEqual(errors,[]);
  await context.close();
  report.push({test:'14-paid-placement-isolation-fixture',status:'PASS',checks:'synthetic verified sponsor only: explicit label and rel=sponsored; separate home/context slot; identical organic IDs/order; unrelated major excludes promotion; no live partner created'});
}

async function testPromotionFailureAndPrivacySignals(browser, base, report) {
  const {context,page,errors} = await newCheckedPage(browser,base,{width:390,height:900});
  await context.addInitScript(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true,configurable:true}));
  let unavailable = true;
  await context.route('**/assets/data/schools.json',route=>unavailable ? route.fulfill({status:503,body:'unavailable'}) : route.continue());
  await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-university-discovery-retry]').waitFor();
  assert.equal(await page.locator('.home-journey-card').count(),3);
  assert.equal(await page.locator('#university-discovery a[href="page2.html"]').isVisible(),true);
  await page.locator('.university-transparency summary').click();
  assert.equal(await page.locator('[data-promotion-consent]').isDisabled(),true);
  assert.equal(await page.locator('[data-promotion-consent]').isChecked(),false);
  unavailable = false;
  await page.locator('[data-university-discovery-retry]').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-featured-universities] .university-card').length===3);
  assert.equal(await page.locator('[data-university-discovery-retry]').isVisible(),false);
  assert.deepEqual(await page.evaluate(async()=> (await import('/assets/js/university-promotion-metrics.js')).promotionMetrics.snapshot()),[]);
  await context.route('**/assets/data/university-promotions.js',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.goto(`${base}/page2.html?mode=school`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#mainContent .school-section').length===37);
  await page.waitForFunction(()=>document.querySelector('#universityPromotionPrivacy').textContent.includes('đang không khả dụng'));
  await page.locator('#searchInput').fill('FPT');
  await page.waitForFunction(()=>document.querySelector('#schoolCatalogStatus').textContent.includes('FPT'));
  assert.equal(await page.locator('#mainContent .school-section').count(),1);
  assert.ok(errors.some(error=>error.startsWith('503 ')));
  // Edge reports the intentionally rejected module as both HTTP 503 and ERR_ABORTED.
  const expectedFailures = new Set([`503 ${base}/assets/data/schools.json`, `503 ${base}/assets/data/university-promotions.js`, `requestfailed: ${base}/assets/data/university-promotions.js net::ERR_ABORTED`]);
  assert.deepEqual(errors.filter(error=>!expectedFailures.has(error)),[]);
  await context.close();
  report.push({test:'15-promotion-retry-and-privacy-signals',status:'PASS',checks:'503 section fallback and retry; failed promotional feed cannot block organic FPT search; Global Privacy Control disables counting, no consent preselection'});
}

async function testAccountMenu(browser, base, report) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 760 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><base href="${base}/"><style>
    :root{--text:#24234a;--text-mid:#4d4a78;--grad-btn:linear-gradient(135deg,#665df5,#8b5cf6)}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:radial-gradient(circle at 80% 10%,#dceaff,transparent 38%),linear-gradient(135deg,#f7f5ff,#e9f2ff);color:#24234a}
    nav{height:76px;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.46);border-bottom:1px solid rgba(99,102,241,.12)}
    .brand{font-weight:900;color:#5b50db}.hero{margin:40px auto;width:min(90%,900px);height:380px;border-radius:32px;background:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.8);box-shadow:0 24px 80px rgba(79,70,229,.08)}
  </style></head><body><nav><div class="brand">BrightWay Career</div><div id="navLinks"></div></nav><div class="hero"></div></body></html>`);
  await page.evaluate(() => {
    const user = { email: 'admin@brightway.vn', user_metadata: {} };
    const profile = { full_name: 'Admin BrightWay', role: 'admin', avatar_url: '' };
    window.BWAuth = {
      getUser: () => user,
      getProfile: () => profile,
      on: callback => { callback('INIT'); return () => {}; },
      signOut: async () => {},
    };
  });
  await page.addScriptTag({ path: path.join(root, 'assets', 'js', 'nav-auth.js') });
  const trigger = page.locator('#navUserTrigger');
  await trigger.click();
  const dropdown = page.locator('#navDropdown');
  await dropdown.waitFor({ state: 'visible' });
  await page.waitForTimeout(250);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await dropdown.getAttribute('role'), 'menu');
  assert.equal(await dropdown.locator('[role="menuitem"]').count(), 5);
  assert.equal(await dropdown.locator('.staff-link').isVisible(), true);
  assert.match(await page.locator('#navUserAvatar img').getAttribute('src'), /assets\/images\/brand\/pdp-admin-avatar\.png/);
  let box = await dropdown.boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= 1100 && box.y + box.height <= 760);
  await page.screenshot({ path: path.join(artifactDir, 'account-menu-1100.png') });
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  await page.setViewportSize({ width: 390, height: 760 });
  await trigger.click();
  await page.waitForTimeout(250);
  box = await dropdown.boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= 390 && box.y + box.height <= 760);
  assert.equal(await page.locator('.nav-user-name').isVisible(), false);
  await page.screenshot({ path: path.join(artifactDir, 'account-menu-390.png') });
  assert.deepEqual(errors, []);
  await context.close();
  report.push({ test: '16-account-menu', status: 'PASS', assertions: 10 });
}

(async () => {
  const report = [];
  let browser;
  try {
    await listen();
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: process.env.BRIGHTWAY_BROWSER || 'msedge', headless: true });
    if (process.env.BRIGHTWAY_PRODUCTION_URL) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.goto(process.env.BRIGHTWAY_PRODUCTION_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      for (const selector of ['#roadmap', '#tools', '.bw-faq']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(550);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(artifactDir, 'before-production-home-1440.png'), fullPage: true });
      await page.close();
    }
    await testNewUser(browser, base, report);
    await testHolland(browser, base, report);
    await testSchoolSearch(browser, base, report);
    await testVerifiedSchoolLogos(browser, base, report);
    await testScoreCalculator(browser, base, report);
    await testJourneyPersistence(browser, base, report);
    await testFailureStates(browser, base, report);
    await testSlowAndEmptyData(browser, base, report);
    await testInformationAndFunctionAudit(browser, base, report);
    await testLegacyMajorInformation(browser, base, report);
    await testUniversityDiscoveryAndPrivacy(browser, base, report);
    await testSponsoredPlacementIsolation(browser, base, report);
    await testPromotionFailureAndPrivacySignals(browser, base, report);
    await testResponsiveAndRegression(browser, base, report);
    await testAccountMenu(browser, base, report);
    const result = { status: 'PASS', scenarios: report.length, report, artifacts: artifactDir };
    fs.writeFileSync(path.join(artifactDir, 'report.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await closeServer();
  }
})();
