const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.cache', 'countdown-qa');
fs.mkdirSync(artifacts, { recursive:true });
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, body) => error ? res.writeHead(404).end() : res.writeHead(200, { 'Content-Type':{ '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.woff2':'font/woff2' }[path.extname(file)] || 'application/octet-stream' }).end(body));
});
const reports = [];
let browser, base;
function isoDate(offset = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
  const record = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(record.year), Number(record.month) - 1, Number(record.day) + offset));
  return date.toISOString().slice(0, 10);
}
async function scenario(name, run, options = {}) {
  const context = await browser.newContext({ viewport:{ width:1366, height:900 }, acceptDownloads:true, reducedMotion:options.reducedMotion || 'no-preference' });
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try { console.log('Running ' + name); await run(page, context); assert.deepEqual(errors, []); reports.push({ name, status:'PASS' }); }
  catch (error) { await page.screenshot({ path:path.join(artifacts, name + '-failure.png'), fullPage:true }).catch(() => {}); reports.push({ name, status:'FAIL', error:error.message, url:page.url() }); }
  finally { await context.close(); }
}
async function open(page, file = 'profile.html?tab=journey#countdowns') {
  await page.goto(base + '/' + file, { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.BWCountdown));
  if (file.startsWith('profile')) await page.locator('#countdownForm').waitFor({ state:'attached' });
}
async function ensureEditor(page) {
  const details = page.locator('#countdownEditor');
  if (!await details.evaluate(element => element.open)) await details.locator(':scope > summary').click();
}
async function createPersonal(page, { name='Đạt IELTS 6.5', date=isoDate(30), description='', milestones='', goalType='language-score' } = {}) {
  await ensureEditor(page);
  await page.locator('#countdownGoalType').selectOption(goalType);
  await page.locator('#countdownName').fill(name);
  await page.locator('#countdownDate').fill(date);
  if (description) await page.locator('#countdownDescription').fill(description);
  if (milestones) await page.locator('#countdownMilestones').fill(milestones);
  await page.locator('[name="countdownReminder"][value="30"]').check();
  await page.locator('[name="countdownReminder"][value="7"]').check();
  await page.locator('#countdownForm button[type="submit"]').click();
  await page.locator('#countdownFormStatus').filter({ hasText:'Đã lưu' }).waitFor();
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel:'msedge', headless:true });
  try {
    await scenario('01-personal-goal-persistence-and-existing-data', async page => {
      await page.addInitScript(() => { if (!sessionStorage.getItem('countdownSeeded')) { localStorage.setItem('bwJourneyV2', JSON.stringify({ version:2, savedCareers:[], savedMajors:[], savedSchools:[{ id:'ctu', name:'Đại học Cần Thơ' }], wishes:[], tasks:[], updatedAt:Date.now() })); sessionStorage.setItem('countdownSeeded', '1'); } });
      await open(page); await ensureEditor(page); assert.equal(await page.locator('[data-exam-field]').first().isVisible(), false); await createPersonal(page, { milestones:'Đánh giá đầu vào\nHọc từ vựng\nThi thử' });
      assert.equal(await page.locator('#countdownList .countdown-card').count(), 1);
      assert.equal(await page.locator('.countdown-milestones input').count(), 3);
      await page.locator('.countdown-milestones input').first().check();
      assert.match(await page.locator('.countdown-progress').innerText(), /1\/3/);
      await page.reload(); await page.locator('#countdownList .countdown-card').waitFor();
      assert.equal(await page.evaluate(() => BWFlow.read().savedSchools[0].id), 'ctu');
      assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items.length), 1);
      assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items[0].goalType), 'language-score');
      assert.equal(await page.locator('.countdown-milestones input').first().isChecked(), true);
    });

    await scenario('02-official-sat-sessions-and-unannounced-exam', async page => {
      await open(page); await ensureEditor(page);
      await page.locator('#countdownKind').selectOption('exam'); await page.locator('#countdownExam').selectOption('sat');
      assert.equal(await page.locator('#countdownSession option').count(), 6);
      await page.locator('#countdownSession').selectOption('sat-2027-03-06');
      assert.equal(await page.locator('#countdownDate').inputValue(), '2027-03-06');
      await page.locator('#countdownForm button[type="submit"]').click();
      await page.locator('.countdown-badge.is-official').waitFor();
      assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items[0].sourceURL.includes('collegeboard.org')), true);
      await ensureEditor(page); await page.locator('#countdownKind').selectOption('exam'); await page.locator('#countdownExam').selectOption('thpt');
      assert.equal(await page.locator('#countdownSession option').count(), 1);
      assert.match(await page.locator('#countdownScheduleNote').innerText(), /Chưa có lịch chính thức/);
      await page.locator('#countdownName').fill('Kỳ thi tốt nghiệp THPT 2027'); await page.locator('#countdownDate').fill('2027-06-20');
      await page.locator('#countdownForm button[type="submit"]').click();
      assert.equal(await page.locator('.countdown-badge.is-tentative').count(), 1);
      assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items[1].sourceURL), '');
    });

    await scenario('03-edit-status-pin-delete-and-home-widget', async page => {
      await open(page); await createPersonal(page, { name:'Hoàn thành hồ sơ du học', date:isoDate(45) });
      const card = page.locator('#countdownList .countdown-card');
      await card.getByRole('button', { name:'Sửa' }).click(); await page.locator('#countdownDate').fill(isoDate(50)); await page.locator('#countdownForm button[type="submit"]').click();
      assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items[0].targetDate), isoDate(50));
      await card.getByRole('button', { name:'Tạm dừng' }).click(); assert.match(await card.innerText(), /Đang tạm dừng/);
      await card.getByRole('button', { name:'Tiếp tục' }).click(); await card.getByRole('button', { name:'Ghim trang chủ' }).click();
      await open(page, 'index.html'); assert.equal(await page.locator('#countdownWidget .countdown-card').count(), 1); assert.match(await page.locator('#countdownWidget').innerText(), /Hoàn thành hồ sơ du học/);
      await open(page); await page.locator('#countdownList .countdown-card').getByRole('button', { name:'Hoàn thành' }).click();
      await page.getByRole('button', { name:'Đã hoàn thành' }).click(); assert.match(await page.locator('#countdownList').innerText(), /Đã hoàn thành/);
      page.once('dialog', dialog => dialog.accept()); await page.locator('#countdownList .countdown-card').getByRole('button', { name:'Xóa' }).click(); assert.equal(await page.locator('#countdownList .countdown-card').count(), 0);
    });

    await scenario('04-today-overdue-filters-and-duplicate-prevention', async page => {
      await open(page); await createPersonal(page, { name:'Mốc hôm nay', date:isoDate(0) });
      assert.match(await page.locator('#countdownList').innerText(), /Hôm nay/);
      await createPersonal(page, { name:'Mốc đã qua', date:isoDate(-1) });
      await page.getByRole('button', { name:'Quá hạn' }).click(); assert.equal(await page.locator('#countdownList .countdown-card').count(), 1); assert.doesNotMatch(await page.locator('#countdownList').innerText(), /-1/);
      await page.getByRole('button', { name:'Sắp tới' }).click(); await ensureEditor(page);
      await page.locator('#countdownName').fill('Mốc hôm nay'); await page.locator('#countdownDate').fill(isoDate(0)); await page.locator('#countdownForm button[type="submit"]').click();
      assert.match(await page.locator('#countdownFormStatus').innerText(), /đã có/); assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items.length), 2);
    });

    await scenario('05-export-and-delete-only-countdowns', async page => {
      await page.addInitScript(() => { localStorage.setItem('studentHollandImportedV1', JSON.stringify({ code:'RIA', savedAt:Date.now() })); localStorage.setItem('bwJourneyV2', JSON.stringify({ version:2, savedCareers:[{ id:'x', name:'Kỹ sư' }], savedMajors:[], savedSchools:[], updatedAt:Date.now() })); });
      await open(page); await createPersonal(page);
      const downloadEvent = page.waitForEvent('download'); await page.locator('#countdownExport').click(); const download = await downloadEvent; const file = path.join(artifacts, 'countdown-export.json'); await download.saveAs(file);
      const exported = JSON.parse(fs.readFileSync(file, 'utf8')); assert.equal(exported.format, 'brightway-countdowns'); assert.equal(exported.items.length, 1); assert.equal('savedCareers' in exported, false);
      page.once('dialog', dialog => dialog.accept()); await page.locator('#countdownDeleteAll').click();
      assert.equal(await page.evaluate(() => BWFlow.read().countdowns.items.length), 0); assert.equal(await page.evaluate(() => BWFlow.read().savedCareers.length), 1); assert.equal(await page.evaluate(() => BWFlow.holland()), 'RIA');
    });

    await scenario('06-corrupt-data-and-profile-suggestions', async page => {
      await page.addInitScript(() => localStorage.setItem('bwJourneyV2', JSON.stringify({ version:2, savedCareers:[], savedMajors:[], savedSchools:[{ id:'uit', name:'Đại học Công nghệ Thông tin' }], wishes:[{ schoolId:'uit' }], personalization:{ version:1, enabled:true, grade:'12' }, countdowns:{ version:1, items:[null,{ name:'Hỏng', targetDate:'2027-02-29' }] }, updatedAt:Date.now() })));
      await open(page); assert.equal(await page.evaluate(() => BWCountdown.read().items.length), 0);
      assert.match(await page.locator('.countdown-suggestions').innerText(), /THPT/); assert.match(await page.locator('.countdown-suggestions').innerText(), /V-ACT/); assert.match(await page.locator('.countdown-suggestions').innerText(), /nguyện vọng/);
      assert.equal(await page.evaluate(() => BWFlow.read().savedSchools[0].id), 'uit');
    });

    await scenario('07-keyboard-reduced-motion-and-responsive', async page => {
      await open(page); await createPersonal(page, { name:'Nộp hồ sơ học bổng', date:isoDate(14) });
      for (const width of [360,390,768,1366]) {
        await page.setViewportSize({ width, height:900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `overflow ${width}`);
        const managerBox = await page.locator('#countdowns').boundingBox(); assert.ok(managerBox.x >= 0 && managerBox.x + managerBox.width <= width + 1);
        await page.locator('#countdowns').screenshot({ path:path.join(artifacts, `countdown-${width}.png`), animations:'disabled', style:'.flow-nav,#waybi-fab{visibility:hidden}' });
      }
      await page.keyboard.press('Home'); await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.activeElement !== document.body));
      assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    }, { reducedMotion:'reduce' });

    await scenario('08-home-empty-and-midnight-refresh-hooks', async page => {
      await open(page, 'index.html'); assert.match(await page.locator('#countdownWidget').innerText(), /Chưa có mốc nào/);
      assert.equal(await page.locator('#countdownWidget').isVisible(), true);
      await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
      assert.equal(await page.locator('#countdownWidget .countdown-empty').count(), 1);
      await page.setViewportSize({ width:390, height:900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.locator('#countdownWidget').screenshot({ path:path.join(artifacts, 'home-widget-empty-390.png'), animations:'disabled' });
    });
  } finally {
    await browser.close(); await new Promise(resolve => server.close(resolve));
    const result = { pass:reports.filter(row => row.status === 'PASS').length, fail:reports.filter(row => row.status === 'FAIL').length, scenarios:reports, artifacts, note:'Playwright dùng dữ liệu thật trong repository; không gọi backend hay tạo lịch thi chính thức giả.' };
    fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2)); if (result.fail) process.exitCode = 1;
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
