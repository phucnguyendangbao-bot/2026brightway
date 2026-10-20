// Read-only production smoke test. No persistent browser profile or account is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

(async () => {
  const base = (process.env.BRIGHTWAY_PRODUCTION_URL || 'https://pdp-brightway-careers.vercel.app').replace(/\/$/, '');
  const browser = await chromium.launch({ channel: process.env.BRIGHTWAY_BROWSER || 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    // Defensive boundary: the smoke test must not write to production services.
    await context.route('**/*', route => ['GET','HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/index.html?university_discovery=${Date.now()}`, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('[data-featured-universities] .university-card').length===3);
    assert.equal(await page.locator('#bwHeroCarousel .slide').count(),8);
    assert.equal(await page.locator('.is-sponsored').count(),0);
    await page.setViewportSize({width:390,height:900});
    for (const entry of await page.locator('.home-journey-card').all()) assert.equal(await entry.isVisible(),true);
    assert.equal(await page.locator('[data-promotion-consent]').isChecked(),false);
    await page.setViewportSize({width:1366,height:900});
    const response = await page.goto(`${base}/page2.html?school=ntu&audit=${Date.now()}`, { waitUntil:'domcontentloaded' });
    assert.equal(response.status(), 200);
    assert.match(await response.text(), /page2\.js\?v=20261020-regression/);
    await page.locator('#schoolDialog[open]').waitFor();
    assert.match(await page.locator('#schoolDialog').innerText(), /thang 40/);
    await page.locator('#schoolDialog [data-action="close-school"]').click();
    assert.match(await page.locator('#hue-uni .school-card-kicker').innerText(), /HUEUNI/);
    assert.equal(await page.locator('#icon-hue-uni img').count(), 0);

    await page.goto(`${base}/score-calculator.html?school=fpt&program=0`, { waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#targetProgram')?.value === '0');
    await page.locator('#comboSelect').selectOption('C00');
    for (const id of ['sLit','sHis','sGeo']) await page.locator(`#${id}`).fill('8');
    await page.locator('#fptCard summary').click();
    await page.locator('#sGrade12').fill('8');
    await page.locator('#calcBtn').click();
    assert.match(await page.locator('#schoolList .school-row-status').innerText(), /không áp dụng cho ngành/);
    await page.locator('#comboSelect').selectOption('D01');
    for (const id of ['sMath','sLit','sEng']) await page.locator(`#${id}`).fill('8');
    await page.locator('#calcBtn').click();
    assert.match(await page.locator('#schoolList .school-row-status').innerText(), /24.00/);

    await page.locator('input[name="admissionMethod"][value="other"]').check();
    await page.locator('#examType').selectOption('sHsa');
    await page.locator('#sHsa').fill('100');
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('.summary-item:visible').count(), 1);
    await page.locator('#editScoreBtn').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'sHsa');
    await page.locator('#resetBtn').click();
    await page.reload({ waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#targetSchool')?.options.length > 1);
    assert.equal(await page.locator('input[name="targetMode"][value="quick"]').isChecked(), true);
    assert.equal(await page.locator('#targetSchool').inputValue(), '');

    await page.locator('input[name="admissionMethod"][value="integrated"]').check();
    assert.deepEqual(await page.locator('#integratedSchool option').evaluateAll(nodes => nodes.map(n => n.value).filter(Boolean)), ['hcmut','uhs','hcmus','ussh','uit','uel','hcmiu','agu']);
    await page.locator('#integratedSchool').selectOption('hcmiu');
    await page.locator('#integratedProgram').selectOption('7480201');
    for (const input of await page.locator('#integratedFields input[inputmode="decimal"]:visible').all()) await input.fill('8');
    await page.locator('#i_confirmed').check();
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').innerText(), '73.20/100');
    assert.match(await page.locator('#integratedResult a').getAttribute('href'), /^https:\/\/tuyensinh\.hcmiu\.edu\.vn\//);
    const artifacts = path.resolve(__dirname, '../.cache/production-integrated');
    fs.mkdirSync(artifacts, {recursive:true});
    for (const width of [360,390,768,1366]) {
      await page.setViewportSize({width,height:900});
      await page.locator('#integratedResult').scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, 'Production overflow at ' + width);
      await page.screenshot({path:path.join(artifacts, 'result-' + width + '.png')});
    }
    await page.locator('#i_bonus').selectOption('unverified');
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').count(), 0);
    assert.match(await page.locator('#integratedResult').innerText(), /Không mặc định cộng 5/);
    await page.locator('#integratedSchool').selectOption('uhs');
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').count(), 0);
    assert.match(await page.locator('#integratedResult').innerText(), /Chưa hỗ trợ tính/);
    await page.locator('#integratedSchool').selectOption('hcmus');
    await page.locator('#integratedProgram').selectOption('7420101');
    for (const input of await page.locator('#integratedFields input[inputmode="decimal"]:visible').all()) await input.fill('8');
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedAcademic').innerText(), '80.00/100');
    assert.equal(await page.locator('#integratedTotal').count(), 0);
    await page.locator('#i_exams').selectOption('both');
    await page.locator('#calcBtn').click();
    assert.match(await page.locator('#integratedResult').innerText(), /bách phân vị/);

    await page.goto(`${base}/calendar.html?year=2027`, { waitUntil:'domcontentloaded' });
    await page.locator('#grid .cal-m').first().waitFor();
    assert.match(await page.locator('.cal-tag').innerText(), /Chuẩn bị.*2027/);
    assert.equal(await page.locator('[data-event-date^="2026"]').count(), 0);

    await page.goto(`${base}/careers-holland.html?holland=all&q=${encodeURIComponent('Bác sĩ đa khoa')}`, { waitUntil:'domcontentloaded' });
    await page.locator('#favBtn').waitFor();
    assert.match(await page.locator('.career-result').innerText(), /12 tháng/);
    assert.equal(await page.locator('a[href*="baochinhphu.vn"]').count(), 1);
    assert.deepEqual(errors, []);
    const report = { status:'PASS', base, checkedAt:new Date().toISOString(), checks:['deployed university-discovery version','3 editorial profiles and 8 preserved campus slides','mobile student intents visible','metrics consent defaults off, no invented sponsors','NTU scale 40 and direct school dialog','Hue system identity','FPT C00 IT rejection','FPT D01 IT component 24','single selected exam summary and visible edit focus','reset target survives reload','8 integrated school identities','IU scoped calculation 73.20/100 with official source','unverified bonus blocked','UHS missing formula blocked','HCMUS reference only and percentile branch blocked','integrated responsive 360/390/768/1366 without page overflow','2027 preparation label and year isolation','doctor sourced route'], pageErrors:errors };
    fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
