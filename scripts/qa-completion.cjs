const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const phase = process.env.QA_PHASE === 'before' ? 'before' : 'after';
const artifacts = path.join(root, '.cache', 'completion-2026-10-21', phase);
fs.mkdirSync(artifacts, {recursive:true});
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp'};
const server = http.createServer((req,res) => {
  const target = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(target, (err,body) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, {'Content-Type':(mime[path.extname(target)] || 'application/octet-stream') + '; charset=utf-8'}).end(body);
  });
});
const scenarios = [];
let browser, base;
async function scenario(name, run) {
  console.log(`Running ${name}`);
  const context = await browser.newContext({viewport:{width:1366,height:900}});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  page.setDefaultTimeout(12000);
  try {
    await run(page, context);
    assert.deepEqual(errors,[], 'Unexpected JavaScript error');
    scenarios.push({name,status:'PASS'});
  } catch(error) {
    await page.screenshot({path:path.join(artifacts, `${name}-failure.png`), fullPage:true,animations:'disabled'}).catch(()=>{});
    scenarios.push({name,status:'FAIL',error:error.message,url:page.url()});
  } finally { await context.close(); }
}
const catalog = async page => {
  await page.goto(`${base}/page2.html?mode=school`,{waitUntil:'domcontentloaded'});
  await page.locator('#hcmut').waitFor();
};

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  try {
    browser = await chromium.launch({channel:process.env.BRIGHTWAY_BROWSER || 'msedge',headless:true});
    await scenario('01-favorite-filter-removal', async page => {
      await catalog(page);
      for (const id of ['ctu','hcmut']) await page.locator(`#${id} [data-action="toggle-saved-school"]`).click();
      await page.goto(`${base}/profile.html?tab=journey#my-choices`,{waitUntil:'domcontentloaded'});
      await page.locator('[data-unsave-school="ctu"]').waitFor();
      await page.locator('#savedSchoolCity').selectOption({label:'Cần Thơ'});
      assert.equal(await page.locator('#mySavedSchools li a').count(),1);
      await page.locator('[data-unsave-school="ctu"]').click();
      assert.equal(await page.locator('#savedSchoolCity').inputValue(),'');
      assert.equal(await page.locator('#mySavedSchools li a').count(),1,'Remaining school must appear when selected city no longer exists');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('[data-unsave-school="hcmut"]').waitFor();
      assert.equal(await page.locator('#mySavedSchools li a').count(),1);
      await page.locator('#my-choices').screenshot({path:path.join(artifacts,'favorites-filter-recovered.png')});
    });
    await scenario('02-compare-two-three-reload-filter-remove', async page => {
      await catalog(page);
      const toggle = id=>page.locator(`#${id} [data-action="compare-school"]`);
      await toggle('hcmut').check();
      await toggle('ctu').check();
      assert.equal(await page.locator('#schoolCompare thead th').count(),3);
      await toggle('fpt').check();
      assert.equal(await page.locator('#schoolCompare thead th').count(),4);
      for (const width of [360,390,768,1366]) {
        await page.setViewportSize({width,height:900});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`compare overflow ${width}`);
        const removeBox=await page.locator('#schoolCompare [data-action="remove-compare"]').first().boundingBox();
        assert.ok(removeBox.height>=44 && removeBox.width>=44,`compare remove touch target ${width}`);
        await page.locator('#schoolCompare').evaluate(node=>window.scrollTo(0,node.getBoundingClientRect().top+scrollY-90));
        await page.locator('#schoolCompare').screenshot({path:path.join(artifacts,`compare-${width}.png`),animations:'disabled'});
        if(width===360) {
          await page.locator('[data-action="remove-compare"][data-school-id="fpt"]').click();
          assert.equal(await page.locator('#schoolCompare thead th').count(),3);
          await toggle('fpt').check();
          assert.equal(await page.locator('#schoolCompare thead th').count(),4);
        }
      }
      await toggle('ueh').click();
      assert.equal(await toggle('ueh').isChecked(),false);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#schoolCompare:not([hidden])').waitFor();
      assert.equal(await page.locator('#schoolCompare thead th').count(),4);
      await page.locator('#searchInput').fill('khong-co-truong-xyz');
      await page.locator('.p2-no-results').waitFor();
      assert.equal(await page.locator('#schoolCompare thead th').count(),4,'Search must not discard comparison');
      await page.locator('[data-action="remove-compare"][data-school-id="ctu"]').click();
      assert.equal(await page.locator('#schoolCompare thead th').count(),3);
      await page.locator('#clearSchoolCompare').click();
      assert.equal(await page.locator('#schoolCompare').isVisible(),false);
      await page.locator('#resetSchoolFilters').click();
      assert.equal(await page.locator('[data-action="compare-school"]:checked').count(),0);
    });
    await scenario('03-favorite-last-region-search-reset', async page => {
      await catalog(page);
      await page.locator('#ctu [data-action="toggle-saved-school"]').click();
      await page.locator('#savedSchoolOnly').check();
      await page.locator('#regionFilter').selectOption({label:'Cần Thơ'});
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#ctu').waitFor();
      assert.equal(await page.locator('#savedSchoolOnly').isChecked(),true);
      assert.equal(await page.locator('#regionFilter').inputValue(),'Cần Thơ');
      await page.locator('#ctu [data-action="toggle-saved-school"]').click();
      await page.locator('.p2-no-results').waitFor();
      assert.equal(await page.locator('#savedSchoolTotal').innerText(),'0');
      await page.locator('#resetSchoolFilters').click();
      await page.locator('#hcmut').waitFor();
      assert.equal(await page.locator('.school-section').count(),37);
    });
    await scenario('04-wishes-keyboard-priority', async page => {
      await page.goto(`${base}/page2.html?school=fpt`,{waitUntil:'domcontentloaded'});
      await page.locator('#schoolDialog[open]').waitFor();
      await page.locator('[data-action="add-wish"]').nth(0).click();
      await page.locator('[data-action="add-wish"]').nth(1).click();
      await page.goto(`${base}/profile.html?tab=journey#my-choices`,{waitUntil:'domcontentloaded'});
      await page.locator('#myWishes h3').first().waitFor();
      const secondName = await page.locator('#myWishes h3').nth(1).innerText();
      await page.locator('#myWishes [data-move-wish="-1"]').nth(1).focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#myWishes h3').first().innerText(),secondName);
      assert.equal(await page.evaluate(()=>document.activeElement.closest('[data-wish-id]')?.querySelector('h3').textContent),secondName,'Keyboard focus must stay with the moved wish');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#myWishes h3').first().waitFor();
      assert.equal(await page.locator('#myWishes h3').first().innerText(),secondName);
      await page.locator('#my-choices').screenshot({path:path.join(artifacts,'wishes-reordered.png')});
    });
    await scenario('05-school-slow-offline-retry-empty', async page => {
      let release;
      const gate=new Promise(resolve=>{release=resolve;});
      await page.route('**/assets/data/schools.json',async route=>{await gate; await route.continue();});
      await page.goto(`${base}/page2.html?mode=major`,{waitUntil:'domcontentloaded'});
      assert.equal(await page.locator('#mainContent').getAttribute('aria-busy'),'true');
      assert.equal(await page.locator('#searchInput').isDisabled(),true);
      await page.screenshot({path:path.join(artifacts,'school-loading.png')});
      release();
      await page.locator('#fpt').waitFor();
      assert.equal(await page.locator('#mainContent').getAttribute('aria-busy'),'false');
      await page.unroute('**/assets/data/schools.json');
      await page.route('**/assets/data/schools.json',route=>route.abort('internetdisconnected'));
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#retrySchoolCatalog').waitFor();
      assert.equal(await page.locator('#mainContent').getAttribute('aria-busy'),'false');
      await page.screenshot({path:path.join(artifacts,'school-offline.png')});
      await page.unroute('**/assets/data/schools.json');
      await page.locator('#retrySchoolCatalog').click();
      await page.locator('#fpt').waitFor();
      await page.locator('#searchInput').fill('khong-co-nganh-xyz');
      await page.locator('.p2-no-results').waitFor();
      await page.screenshot({path:path.join(artifacts,'school-search-empty.png')});
      await page.locator('#searchClear').click();
      await page.locator('#fpt').waitFor();
    });
    await scenario('06-career-offline-retry-empty', async page => {
      await page.route('**/assets/data/jobs.json',route=>route.abort('internetdisconnected'));
      await page.goto(`${base}/careers-holland.html?holland=all`,{waitUntil:'domcontentloaded'});
      await page.locator('#careerCount button').waitFor();
      await page.screenshot({path:path.join(artifacts,'careers-offline.png')});
      await page.unroute('**/assets/data/jobs.json');
      await page.locator('#careerCount button').click();
      await page.locator('.career-list-item').first().waitFor();
      await page.locator('#careerSearch').fill('khong-co-nghe-xyz');
      await page.locator('.career-empty-big').filter({hasText:'Không tìm thấy'}).waitFor();
      await page.screenshot({path:path.join(artifacts,'careers-search-empty.png')});
      await page.locator('.flow-clear-filters').click();
      await page.locator('.career-list-item').first().waitFor();
    });
    await scenario('07-waybi-name-and-mobile-controls', async page => {
      for (const pathname of ['index.html','careers-holland.html?holland=all','page2.html?mode=school','profile.html?tab=journey#my-choices','waybi.html']) {
        await page.goto(`${base}/${pathname}`,{waitUntil:'domcontentloaded'});
        const home=pathname==='index.html';
        const launcher=page.locator(home ? '#bwChatLauncher' : '#waybi-fab');
        await launcher.click();
        const panel=page.locator(home ? '#bwChatPanel' : '#waybi-panel');
        await panel.waitFor({state:'visible'});
        assert.equal(await panel.getAttribute('aria-label'),'Trợ lý hướng nghiệp Waybi');
        assert.equal(await panel.locator(home ? '.bw-chat-title' : '#waybi-name').innerText(),'Trợ lý hướng nghiệp Waybi');
        for (const width of [360,390,768,1366]) {
          await page.setViewportSize({width,height:900});
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${pathname} overflow ${width}`);
          const box=await panel.boundingBox();
          assert.ok(box.x>=0 && box.x+box.width<=width+1 && box.y>=0 && box.y+box.height<=901,`${pathname} chat outside viewport ${width}`);
          const titleBox=await panel.locator(home ? '.bw-chat-title' : '#waybi-name').boundingBox();
          const closeBox=await panel.locator(home ? '#bwChatClose' : '#waybi-close').boundingBox();
          assert.ok(titleBox.x+titleBox.width<=closeBox.x+1,`${pathname} title overlaps close control ${width}`);
          await page.screenshot({path:path.join(artifacts,`waybi-${pathname.split('.')[0]}-${width}.png`),animations:'disabled'});
        }
        await page.keyboard.press('Escape');
        assert.equal(await panel.isVisible(),false);
        await page.setViewportSize({width:390,height:900});
        await page.locator('.flow-menu').click();
        await page.locator('#navLinks a[href="profile.html?tab=journey#my-choices"]').click();
        await page.waitForURL(/profile\.html\?tab=journey#my-choices$/);
        await page.locator('#my-choices').waitFor();
      }
    });
    await scenario('08-school-module-offline-retry', async page => {
      await page.route('**/assets/data/school-profile-details.js',route=>route.abort('internetdisconnected'));
      await page.goto(`${base}/page2.html?mode=major`,{waitUntil:'domcontentloaded'});
      await page.locator('#retrySchoolModule').waitFor();
      assert.equal(await page.locator('#mainContent').getAttribute('aria-busy'),'false');
      assert.equal(await page.locator('#searchInput').isDisabled(),true);
      await page.screenshot({path:path.join(artifacts,'school-module-offline.png')});
      await page.unroute('**/assets/data/school-profile-details.js');
      await page.locator('#retrySchoolModule').click();
      await page.locator('#fpt').waitFor();
      assert.equal(await page.locator('#searchInput').isDisabled(),false);
      assert.equal(await page.locator('input[value="major"]').isChecked(),true);
    });
    await scenario('09-empty-data-recovers-with-real-catalog', async page => {
      // Only exercise the empty transport state. No fabricated records; after
      // removing each route all successful catalog data comes from the repo.
      await page.route('**/assets/data/schools.json',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
      await page.goto(`${base}/page2.html?mode=major`,{waitUntil:'domcontentloaded'});
      await page.locator('.p2-no-results').waitFor();
      assert.equal(await page.locator('#mainContent').getAttribute('aria-busy'),'false');
      assert.equal(await page.locator('.school-section').count(),0);
      await page.screenshot({path:path.join(artifacts,'school-data-empty.png')});
      await page.unroute('**/assets/data/schools.json');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#fpt').waitFor();
      assert.equal(await page.locator('.school-section').count(),37);
      await page.route('**/assets/data/jobs.json',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
      await page.goto(`${base}/careers-holland.html?holland=all`,{waitUntil:'domcontentloaded'});
      await page.locator('.career-empty').filter({hasText:'Chưa có dữ liệu nghề nghiệp hợp lệ'}).waitFor();
      assert.match(await page.locator('#careerCount').innerText(),/0 nghề/);
      await page.screenshot({path:path.join(artifacts,'career-data-empty.png')});
      await page.unroute('**/assets/data/jobs.json');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('.career-list-item').first().waitFor();
    });
  } finally {
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
  const report={phase,pass:scenarios.filter(s=>s.status==='PASS').length,fail:scenarios.filter(s=>s.status==='FAIL').length,scenarios,artifacts};
  fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(report.fail) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
