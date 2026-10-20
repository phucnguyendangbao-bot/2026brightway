// Real repository data is served unchanged. Fault routes only simulate unavailable data;
// retries return to the real files, never a replacement successful catalog.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.cache', 'admissions-regression');
fs.mkdirSync(artifacts, { recursive: true });
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
  try { const body = fs.readFileSync(target); res.writeHead(200, { 'Content-Type':mime[path.extname(target)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404).end(); }
});
const report = [];
let browser, base;
async function check(name, fn, width = 390) {
  const context = await browser.newContext({ viewport:{ width, height:900 }, timezoneId:'Asia/Ho_Chi_Minh', reducedMotion:'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try { const details = await fn(page, context); assert.deepEqual(errors, []); report.push({ name, status:'PASS', ...details }); }
  catch (error) { report.push({ name, status:'FAIL', error:error.message }); await page.screenshot({ path:path.join(artifacts, name + '-failure.png'), fullPage:true }).catch(() => {}); }
  finally { await context.close(); console.log(name + ': ' + report[report.length - 1].status); }
}
async function goto(page, file) { await page.goto(base + '/' + file, { waitUntil:'domcontentloaded' }); }
async function loadedTargets(page) { await page.waitForFunction(() => document.querySelector('#targetSchool')?.options.length > 1); }
async function noOverflow(page) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, 'Page overflows horizontally'); }

async function run() {
  await check('reset-and-target-restoration', async page => {
    await goto(page, 'score-calculator.html?school=fpt&program=0');
    await loadedTargets(page);
    assert.equal(await page.locator('#targetProgram').inputValue(), '0');
    await page.locator('#resetBtn').click();
    await page.reload({ waitUntil:'domcontentloaded' });
    await loadedTargets(page);
    assert.equal(await page.locator('input[name="targetMode"][value="quick"]').isChecked(), true, 'Reset must survive reload of a school deep link');
    assert.equal(await page.locator('#targetSchool').inputValue(), '');
    assert.equal(new URL(page.url()).searchParams.has('school'), false);
    await page.locator('input[name="targetMode"][value="guided"]').check();
    await page.locator('#targetSchool').selectOption('ctu');
    await page.locator('#targetProgram').selectOption('0');
    await page.reload({ waitUntil:'domcontentloaded' });
    await loadedTargets(page);
    assert.equal(await page.locator('#targetSchool').inputValue(), 'ctu');
    assert.equal(await page.locator('#targetProgram').inputValue(), '0');
    return { checks:6 };
  });

  await check('calculator-all-combinations', async page => {
    await goto(page, 'score-calculator.html');
    await loadedTargets(page);
    const { COMBO_SUBJECTS } = await import('../assets/js/score-rules.js');
    const ids = { math:'Math', lit:'Lit', eng:'Eng', phy:'Phy', che:'Che', bio:'Bio', his:'His', geo:'Geo', civic:'Civic', informatics:'Informatics' };
    let cases = 0;
    for (const method of ['thpt', 'transcript']) {
      await page.locator(`input[name="admissionMethod"][value="${method}"]`).check();
      for (const [combo, keys] of Object.entries(COMBO_SUBJECTS)) {
        await page.locator('#comboSelect').selectOption(combo);
        const expected = keys.map(key => (method === 'thpt' ? 's' : 'h') + ids[key]).sort();
        const visible = await page.locator('.score-input input:visible').evaluateAll(nodes => nodes.map(node => node.id).sort());
        assert.deepEqual(visible, expected, `${method}/${combo}: only selected subjects visible`);
        for (const [index, id] of expected.entries()) await page.locator('#' + id).fill(['0','8.25','10'][index]);
        await page.locator('#calcBtn').click();
        assert.equal(await page.locator(method === 'thpt' ? '#sumCombo' : '#sumTranscript').innerText(), '18.25', `${method}/${combo} arithmetic`);
        await page.locator('#editScoreBtn').click();
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.matches('.score-input input') && document.activeElement.checkVisibility())), true, `${method}/${combo}: Edit must focus a visible score`);
        cases++;
      }
    }
    return { cases };
  });

  await check('exam-switching-and-validation', async page => {
    await goto(page, 'score-calculator.html');
    await loadedTargets(page);
    await page.locator('input[name="admissionMethod"][value="other"]').check();
    for (const [id, max] of [['sVact',1200],['sHsa',150],['sTsa',100]]) {
      await page.locator('#examType').selectOption(id);
      assert.deepEqual(await page.locator('#otherExamCard input:visible').evaluateAll(nodes => nodes.map(n => n.id)), [id]);
      await page.locator('#' + id).fill(String(max + 1));
      await page.locator('#calcBtn').click();
      assert.equal(await page.locator('#calcError').isVisible(), true);
      await page.locator('#' + id).fill('0');
      await page.locator('#calcBtn').click();
      assert.equal(await page.locator('.summary-item:visible').count(), 1, 'Only the selected exam summary should be shown');
      await page.locator('#editScoreBtn').click();
      assert.equal(await page.evaluate(() => document.activeElement.id), id);
    }
    await page.locator('input[name="admissionMethod"][value="thpt"]').check();
    await page.locator('#comboSelect').selectOption('A00');
    for (const invalid of ['', '-1', '10.01', '1.234', '1e1']) {
      for (const id of ['sMath','sPhy','sChe']) await page.locator('#' + id).fill('8');
      await page.locator('#sMath').fill(invalid);
      await page.locator('#calcBtn').click();
      assert.equal(await page.locator('#calcError').isVisible(), true, 'Reject ' + invalid);
      assert.equal(await page.locator('#resultSummary').isHidden(), true);
    }
    await page.locator('#resetBtn').click();
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 0, 'Reset must clear invalid state');
    assert.equal(await page.locator('.calc-input-error').count(), 0);
    return { exams:3, invalidValues:5 };
  });

  await check('catalog-and-score-retry', async (page, context) => {
    await context.route('**/assets/data/schools.json', route => route.fulfill({ status:503, body:'Unavailable' }));
    await goto(page, 'page2.html?mode=major');
    await page.locator('.p2-no-results button').waitFor();
    assert.doesNotMatch(await page.locator('#schoolCatalogCount').innerText(), /Đang tải/, 'Loading counter must settle on error');
    await context.unroute('**/assets/data/schools.json');
    await page.locator('.p2-no-results button').click();
    await page.locator('.school-section').first().waitFor();
    assert.match(await page.locator('#schoolCatalogCount').innerText(), /35/);
    await page.locator('#searchInput').fill('Công nghệ thông tin');
    await page.waitForFunction(() => document.querySelector('#schoolCatalogStatus').textContent.includes('Công nghệ thông tin'));
    assert.ok(await page.locator('.school-card-programs').count() > 0);
    await page.locator('#regionFilter').selectOption({ label:'TP.HCM' });
    assert.ok(await page.locator('.school-section').count() > 0);
    assert.equal(await page.locator('.school-card-kicker').evaluateAll(nodes => nodes.every(node => node.textContent.includes('TP.HCM'))), true);
    await page.locator('#searchInput').fill('khong-co-nganh-987654321');
    await page.waitForFunction(() => document.querySelector('#schoolCatalogStatus').textContent.includes('khong-co-nganh-987654321'));
    assert.equal(await page.locator('.school-section').count(), 0);
    assert.match(await page.locator('.p2-no-results').innerText(), /Không tìm thấy/);
    await context.route('**/assets/data/schools.json', route => route.fulfill({ status:503, body:'Unavailable' }));
    await goto(page, 'score-calculator.html?school=fpt&program=0');
    await page.locator('#retryTarget').waitFor();
    await context.unroute('**/assets/data/schools.json');
    await page.locator('#retryTarget').click();
    await loadedTargets(page);
    assert.equal(await page.locator('#targetProgram').inputValue(), '0');
    assert.equal(await page.locator('#retryTarget').isHidden(), true);
    await context.route('**/assets/data/jobs.json', route => route.fulfill({ status:503, body:'Unavailable' }));
    await goto(page, 'careers-holland.html');
    await page.locator('#careerCount button').waitFor();
    await context.unroute('**/assets/data/jobs.json');
    await page.locator('#careerCount button').click();
    await page.locator('.career-list-item').first().waitFor();
    assert.match(await page.locator('#careerCount').innerText(), /102/);
    return { source:'Actual schools.json and jobs.json restored after simulated HTTP 503' };
  });

  await check('target-load-does-not-change-later-choice', async (page, context) => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await context.route('**/assets/data/schools.json', async route => { await gate; await route.continue(); });
    await goto(page, 'score-calculator.html?school=fpt&program=0');
    await page.locator('input[name="targetMode"][value="quick"]').check();
    await page.locator('#resetBtn').click();
    release();
    await loadedTargets(page);
    assert.equal(await page.locator('input[name="targetMode"][value="quick"]').isChecked(), true, 'Late request must not restore the cleared target');
  });

  for (const width of [360,390,768,1366]) {
    await check('journey-responsive-' + width, async page => {
      await goto(page, 'index.html');
      await noOverflow(page);
      await page.screenshot({ path:path.join(artifacts, 'home-' + width + '.png'), fullPage:true });
      await goto(page, 'holland.html');
      for (let index = 0; index < 42; index++) {
        await page.locator(`.q-btn[data-idx="${index}"][data-val="${index % 5 + 1}"]`).click();
        if ((index + 1) % 5 === 0 && index < 41) await page.locator('#btnNext').click();
      }
      await page.locator('#btnFinish').click();
      await page.locator('#resultCard.show').waitFor();
      await noOverflow(page);
      await page.locator('#resultCard').screenshot({ path:path.join(artifacts, 'holland-' + width + '.png') });
      await page.locator('#resultCareersLink').click();
      await page.locator('.career-list-item').first().waitFor();
      await page.locator('.career-list-item').first().click();
      await page.locator('#favBtn').click();
      await noOverflow(page);
      await page.screenshot({ path:path.join(artifacts, 'career-' + width + '.png'), fullPage:true });
      await page.locator('.flow-next a[href*="page2.html?career="]').click();
      await page.locator('.school-section').first().waitFor();
      await page.locator('input[name="schoolSearchMode"][value="school"]').check();
      await page.locator('#searchInput').fill('FPT');
      await page.locator('#fpt .school-card-open').click();
      await page.locator('[data-action="save-school"]').click();
      assert.ok((await page.locator('[data-action="save-school"]').boundingBox()).height < 60, 'Saved CTA must not wrap vertically');
      const table = page.locator('.school-program-table-wrap');
      assert.ok(await table.evaluate(node => node.scrollWidth >= node.clientWidth));
      await page.locator('#schoolDialog').screenshot({ path:path.join(artifacts, 'school-' + width + '.png') });
      await noOverflow(page);
      await page.locator('.school-program-actions a').first().click();
      await loadedTargets(page);
      assert.equal(await page.locator('#targetProgram').inputValue(), '0');
      for (const id of ['sMath','sPhy','sChe']) await page.locator('#' + id).fill('8');
      await page.locator('#calcBtn').click();
      assert.equal(await page.locator('#sumCombo').innerText(), '24.00');
      await page.locator('#resultSummary').scrollIntoViewIfNeeded();
      await noOverflow(page);
      await page.screenshot({ path:path.join(artifacts, 'score-' + width + '.png'), fullPage:true });
      await page.reload({ waitUntil:'domcontentloaded' });
      await loadedTargets(page);
      assert.equal(await page.locator('#sMath').inputValue(), '8');
      assert.equal(await page.locator('#targetProgram').inputValue(), '0');
      assert.equal(await page.evaluate(() => BWFlow.read().savedSchools.some(s => s.id === 'fpt')), true);
      return { questions:42, screenshots:5, data:'Actual repository catalogs', horizontalOverflow:false };
    }, width);
  }

  await check('year-context', async page => {
    await goto(page, 'calendar.html?year=2027');
    await page.locator('#grid .cal-m').first().waitFor();
    assert.match(await page.locator('.cal-tag').innerText(), /Chuẩn bị.*2027/);
    assert.match(await page.locator('#calendarYearNote').innerText(), /chưa có lịch chính thức 2027 trong bộ nguồn/);
    assert.equal(await page.locator('[data-event-date^="2026"]').count(), 0);
    await page.locator('#calendarYear').selectOption('2026');
    assert.ok(await page.locator('[data-event-date^="2026"]').count() > 0);
    assert.match(await page.locator('.cal-tag').innerText(), /2026.*tham khảo/);
    await goto(page, 'page2.html');
    await page.locator('.school-section').first().waitFor();
    assert.match(await page.locator('.p2-intro-copy').innerText(), /2026.*tham khảo/);
  });
}
(async () => {
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ channel:process.env.BRIGHTWAY_BROWSER || 'msedge', headless:true });
    await run();
  } catch (error) { report.push({ name:'runner', status:'FAIL', error:error.stack }); }
  finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    const result = { status:report.every(row => row.status === 'PASS') ? 'PASS' : 'FAIL', pass:report.filter(r => r.status === 'PASS').length, fail:report.filter(r => r.status === 'FAIL').length, report, artifacts };
    fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    if (result.fail) process.exitCode = 1;
  }
})();
