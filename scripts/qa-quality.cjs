// Focused quality audit. Successful school/program data always comes from the repository.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const phase = process.env.QA_PHASE === 'before' ? 'before' : 'after';
const artifacts = path.join(root, '.cache', 'quality-2026-10-21', phase);
fs.mkdirSync(artifacts, {recursive:true});
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, body) => error ? res.writeHead(404).end() : res.writeHead(200, {'Content-Type': (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8'}).end(body));
});
const report = {phase, scenarios:[], accessibility:[], artifacts};
let browser, base;
async function scenario(name, run) {
  const context = await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  console.log('Running ' + name);
  try {
    await run(page, context);
    assert.deepEqual(errors, [], 'JavaScript errors');
    report.scenarios.push({name,status:'PASS'});
  } catch (error) {
    await page.screenshot({path:path.join(artifacts,name+'-failure.png'),fullPage:true,animations:'disabled'}).catch(()=>{});
    report.scenarios.push({name,status:'FAIL',error:error.message,url:page.url()});
  } finally { await context.close(); }
}
async function comparison(page) {
  await page.goto(base+'/page2.html?mode=school', {waitUntil:'domcontentloaded'});
  await page.locator('#fpt').waitFor();
  for (const id of ['fpt','ctu']) await page.locator(`#${id} [data-action="compare-school"]`).check();
}
(async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    await scenario('01-comparison-provenance', async page => {
      await comparison(page);
      await page.locator('#schoolCompare').screenshot({path:path.join(artifacts,'comparison.png'),style:'.flow-nav { visibility:hidden; }'});
      for (const label of ['Ngành đào tạo','Học phí','Học bổng','Phương thức xét tuyển','Điểm chuẩn','Website chính thức']) assert.ok((await page.locator('#schoolCompareTable').innerText()).includes(label),label+' missing');
      const scores = page.locator('#schoolCompareTable tr').filter({has:page.locator('th[scope="row"]').filter({hasText:'Điểm chuẩn'})});
      assert.match(await scores.innerText(), /2026/);
      assert.match(await scores.innerText(), /thang 30/);
      assert.ok(await scores.locator('a[href^="https://daihoc.fpt.edu.vn/"]').count());
      assert.match(await page.locator('#schoolCompareTable').innerText(),/Tư liệu.*2026|tham khảo/);
    });
    await scenario('02-keyboard-comparison-and-save', async page => {
      await page.goto(base+'/page2.html?mode=school',{waitUntil:'domcontentloaded'});
      const toggle = page.locator('#fpt [data-action="compare-school"]');
      await toggle.focus(); await page.keyboard.press('Space');
      assert.equal(await toggle.isChecked(),true);
      assert.equal(await toggle.evaluate(node=>node===document.activeElement),true,'Comparison loses keyboard focus');
      const save = page.locator('#fpt [data-action="toggle-saved-school"]');
      await save.focus(); await page.keyboard.press('Enter');
      assert.equal(await save.getAttribute('aria-pressed'),'true');
      assert.equal(await save.evaluate(node=>node===document.activeElement),true,'Save school loses keyboard focus');
    });
    await scenario('03-wish-csv-download', async page => {
      await page.goto(base+'/page2.html?school=fpt',{waitUntil:'domcontentloaded'});
      await page.locator('[data-action="add-wish"]').nth(0).click();
      await page.locator('[data-action="add-wish"]').nth(1).click();
      await page.goto(base+'/profile.html?tab=journey#my-choices',{waitUntil:'domcontentloaded'});
      await page.locator('#myWishes [data-move-wish="-1"]').nth(1).click();
      const expected = await page.locator('#myWishes h3').first().innerText();
      await page.locator('#exportWishesCsv').waitFor();
      const downloadPromise=page.waitForEvent('download');
      await page.locator('#exportWishesCsv').click();
      const download=await downloadPromise;
      assert.equal(download.suggestedFilename(),'brightway-nguyen-vong.csv');
      const file=path.join(artifacts,download.suggestedFilename()); await download.saveAs(file);
      const text=fs.readFileSync(file,'utf8');
      assert.equal(text.charCodeAt(0),0xfeff);
      assert.ok(text.indexOf(expected)<text.lastIndexOf('Công nghệ thông tin'));
      assert.match(text,/2027.*2026/);
      assert.match(text,/chưa đăng ký nguyện vọng chính thức/i);
      assert.match(text,/https:\/\/daihoc.fpt.edu.vn/);
    });
    for (const home of [false,true]) await scenario(home?'05-home-waybi-retry':'04-shared-waybi-retry',async page=>{
      const payloads=[]; let fail=true;
      await page.route('**/api/chat', route=>{
        payloads.push(route.request().postDataJSON());
        return route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Unavailable'}:{reply:'Bạn có thể mở Nguyện vọng của tôi để sắp xếp lựa chọn đã lưu.'})});
      });
      await page.goto(base+(home?'/index.html':'/profile.html?tab=journey#my-choices'),{waitUntil:'domcontentloaded'});
      await page.locator(home?'#bwChatLauncher':'#waybi-fab').click();
      const panel=page.locator(home?'#bwChatPanel':'#waybi-panel');
      await panel.getByRole('textbox', {name:'Câu hỏi cho Waybi'}).fill('Làm sao sắp xếp nguyện vọng của tôi?');
      await page.locator(home?'#bwChatSend':'#waybi-send').click();
      await panel.getByText(/Mình chưa kết nối được/).waitFor();
      await panel.screenshot({path:path.join(artifacts,home?'waybi-home-error.png':'waybi-shared-error.png')});
      const retry=panel.getByRole('button',{name:'Thử gửi lại'});
      await retry.waitFor(); fail=false; await retry.click();
      await panel.getByText('Bạn có thể mở Nguyện vọng của tôi để sắp xếp lựa chọn đã lưu.',{exact:true}).waitFor();
      assert.equal(payloads.length,2);
      assert.equal(payloads[1].messages.filter(row=>row.role==='user').length,1,'Retry duplicated question');
      assert.equal(await panel.locator(home?'.bw-msg.user':'.waybi-msg.user').count(),1);
      assert.equal(await page.locator(home?'#bwChatSend':'#waybi-send').isEnabled(),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator(home?'#bwChatLauncher':'#waybi-fab').evaluate(node=>node===document.activeElement),true);
    });
    if (phase==='after') {
      await scenario('07-stalled-module-recovery', async page=>{
        let held;
        await page.route('**/assets/js/school-comparison-model.js',route=>{held=route;});
        await page.goto(base+'/page2.html?mode=major',{waitUntil:'domcontentloaded'});
        await page.locator('#retrySchoolModule').waitFor();
        assert.equal(await page.locator('#mainContent').getAttribute('aria-busy'),'false');
        await page.screenshot({path:path.join(artifacts,'module-stalled-recovery.png')});
        await held.abort(); await page.unroute('**/assets/js/school-comparison-model.js');
        await page.locator('#retrySchoolModule').click();
        await page.locator('#fpt').waitFor();
        assert.equal(await page.locator('input[value="major"]').isChecked(),true);
        await page.route('**/assets/js/career-pathways.js',route=>route.abort());
        await page.goto(base+'/careers-holland.html?holland=all&q='+encodeURIComponent('Bác sĩ đa khoa'),{waitUntil:'domcontentloaded'});
        await page.getByRole('button',{name:'Thử tải lại đối chiếu ngành'}).waitFor();
        await page.unroute('**/assets/js/career-pathways.js');
        await page.getByRole('button',{name:'Thử tải lại đối chiếu ngành'}).click();
        await page.locator('.career-pathways a').first().waitFor();
      });
      await scenario('08-unaccented-search-and-carousel', async page=>{
        await page.goto(base+'/page2.html?school=ctu',{waitUntil:'domcontentloaded'});
        await page.locator('#schoolDialog [data-action="save-school"]').click();
        await page.goto(base+'/profile.html?tab=journey#my-choices',{waitUntil:'domcontentloaded'});
        await page.locator('#savedSchoolSearch').fill('dai hoc can tho');
        assert.equal(await page.locator('#mySavedSchools li a').count(),1);
        const fontRequests=[];
        page.on('request',request=>{if(/fonts\.googleapis|fonts\.gstatic/.test(request.url())) fontRequests.push(request.url());});
        await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
        const auto=page.locator('#bwHeroAutoplay');
        assert.equal(await auto.getAttribute('aria-pressed'),'false');
        await page.locator('#bwHeroNext').click();
        await page.locator('#bwHeroCarousel .slide.is-active img').evaluate(image=>image.decode());
        assert.equal(await page.locator('#bwHeroCarousel .slide.is-active').getAttribute('data-school'),'ĐH Cần Thơ');
        await auto.click(); assert.equal(await auto.getAttribute('aria-pressed'),'true');
        await page.waitForFunction(()=>document.querySelector('#bwHeroCarousel .slide.is-active').dataset.school==='UEH - TP.HCM');
        await auto.click(); assert.equal(await auto.getAttribute('aria-pressed'),'false');
        assert.deepEqual(fontRequests,[],'Main pages still depend on remote font stylesheets');
        assert.equal(await page.locator('#bwHeroCarousel .slide').count(),8);
      });
      await scenario('06-responsive-and-accessibility', async page=>{
        const accessibilityFailures=[];
        let AxeBuilder;
        try { AxeBuilder=require(path.join(root,'.cache/qa-tools/node_modules/@axe-core/playwright')).default; }
        catch { report.accessibility.push({status:'BLOCKED',reason:'axe unavailable'}); }
        for (const file of ['index.html','holland.html','careers-holland.html?holland=all','page2.html?mode=school','profile.html?tab=journey#my-choices']) {
          await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
          await page.locator('.flow-logo').waitFor();
          if(file.startsWith('page2')) await comparison(page);
          if(file.startsWith('careers')) await page.locator('.career-list-item').first().waitFor();
          for(const width of [360,390,768,1366,1920]) {
            await page.setViewportSize({width,height:900});
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file} overflow at ${width}`);
            if(file==='index.html') assert.equal(await page.locator('.home-journey-card').count(),3);
            if(file.startsWith('page2')) await page.locator('#schoolCompare').screenshot({path:path.join(artifacts,`comparison-${width}.png`),animations:'disabled',style:'.flow-nav { visibility:hidden; }'});
            if(file==='index.html' && [390,1366].includes(width)) await page.screenshot({path:path.join(artifacts,`home-${width}.png`),fullPage:true,animations:'disabled'});
          }
          if(AxeBuilder) {
            await page.setViewportSize({width:390,height:900});
            await page.waitForTimeout(350); // measure settled colours, not transition frames
            const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
            report.accessibility.push({file,violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
            fs.writeFileSync(path.join(artifacts,`axe-${file.split('.')[0]}.json`),JSON.stringify(result,null,2));
            const severe=result.violations.filter(v=>['critical','serious'].includes(v.impact));
            accessibilityFailures.push(...severe.map(v=>`${file}: ${v.id}`));
            if(file==='index.html' || file.startsWith('page2')) {
              await page.locator(file==='index.html'?'#bwChatLauncher':'#waybi-fab').click();
              await page.waitForTimeout(350);
              const selector=file==='index.html'?'#bwChatPanel':'#waybi-panel';
              const chat=await new AxeBuilder({page}).include(selector).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
              fs.writeFileSync(path.join(artifacts,`axe-chat-${file.split('.')[0]}.json`),JSON.stringify(chat,null,2));
              report.accessibility.push({file:file+' chat',violations:chat.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
              accessibilityFailures.push(...chat.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>`${file} chat: ${v.id}`));
              await page.keyboard.press('Escape');
            }
          }
        }
        assert.deepEqual(accessibilityFailures,[],'Serious accessibility errors');
      });
    }
  } finally {
    await browser?.close(); await new Promise(resolve=>server.close(resolve));
    report.pass=report.scenarios.filter(s=>s.status==='PASS').length;
    report.fail=report.scenarios.filter(s=>s.status==='FAIL').length;
    fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({phase,pass:report.pass,fail:report.fail,scenarios:report.scenarios,artifacts},null,2));
    if(report.fail) process.exitCode=1;
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
