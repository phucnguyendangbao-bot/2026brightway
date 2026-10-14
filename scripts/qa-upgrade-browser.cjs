// Read-only browser regression checks; use BRIGHTWAY_BASE for production.
// Requires Playwright; BRIGHTWAY_PLAYWRIGHT may point to an existing installation.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.BRIGHTWAY_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname,'..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
  try {const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}
  catch {res.writeHead(404);res.end();}
});
server.listen(0,async()=>{
  let browser;
  try {
    browser=await chromium.launch({channel:process.env.BRIGHTWAY_BROWSER || 'msedge',headless:true});
    const base=process.env.BRIGHTWAY_BASE || 'http://127.0.0.1:'+server.address().port;
    const cases=[];
    for (const width of [1440,768,390]) {
      const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Ho_Chi_Minh'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      for (const file of ['index.html','calendar.html','holland.html','careers-holland.html','page2.html','score-calculator.html','resources.html','scholarship-roadmap.html']) {
        await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
        await page.locator('.flow-logo').waitFor();
        if(width<1150) {
          await page.locator('.flow-menu').click();
          assert.equal(await page.locator('.flow-menu').getAttribute('aria-expanded'),'true');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.flow-menu').getAttribute('aria-expanded'),'false');
        }
        if(file==='index.html') {
          await page.waitForFunction(()=>document.querySelector('[data-catalog-count]').textContent==='35');
          assert.equal(await page.locator('.bw-roadmap').count(),1);
          assert.doesNotMatch(await page.locator('.bw-faq-list').innerText(),/Đừng ôn ngay|Chốt 3-5/);
          const order=await page.evaluate(()=>['.bw-hero','.admissions-home','.bw-roadmap'].map(s=>document.querySelector(s).getBoundingClientRect().top));
          assert.ok(order[0]<order[1] && order[1]<order[2]);
          for(const target of ['#roadmap','#tools','.bw-faq']) {
            await page.locator(target).scrollIntoViewIfNeeded();
            await page.waitForFunction(s=>getComputedStyle(document.querySelector(s)).opacity==='1',target);
          }
          await page.evaluate(()=>window.scrollTo(0,0));
          if(fs.existsSync(path.join(root,'.cache'))) await page.screenshot({path:path.join(root,'.cache/upgrade-home-'+width+'.png'),fullPage:true});
          await page.locator('#tools a[href="calendar.html#study-plan"]').click();
          await page.waitForURL(/calendar\.html#study-plan$/);
          await page.selectOption('#calendarYear','2026');
          await page.waitForFunction(()=>document.querySelectorAll('#calendarEventList .policy-event').length===11);
        }
        if(file==='calendar.html') {
          assert.equal(await page.locator('#calendarYear').inputValue(),'2027');
          assert.equal(await page.locator('.cal-countdown-timer').isVisible(),false);
          assert.equal(await page.locator('#calendarEventList .policy-event').count(),0);
          await page.selectOption('#calendarYear','2026');
          assert.equal(await page.locator('#calendarEventList .policy-event').count(),11);
          assert.match(await page.locator('#calendarEventList').innerText(),/Đã đối chiếu nguồn/);
          assert.equal(await page.locator('#grid .has-event').count(),11);
          assert.equal(await page.locator('#study-plan details').count(),12);
          assert.match(await page.locator('#study-plan').innerText(),/Ôn tập, kiểm tra và chuẩn bị kết thúc học kỳ I/);
          await page.selectOption('#calendarYear','2027');
          await page.reload({waitUntil:'domcontentloaded'});
          assert.equal(await page.locator('#calendarYear').inputValue(),'2027');
        }
        if(file==='holland.html') {
          await page.locator('#importResult summary').click();
          for(const invalid of ['RR','XYZ','RIAE','R-I','RI A']) {
            await page.locator('#importCode').fill(invalid);
            await page.locator('#importForm button').click();
            assert.equal(await page.locator('#importError').isVisible(),true);
          }
          await page.locator('#importCode').fill('isa');
          await page.locator('#importForm button').click();
          assert.match(await page.locator('#rCode').innerText(),/I – S – A/);
          await page.reload({waitUntil:'domcontentloaded'});
          assert.match(await page.locator('#rCode').innerText(),/I – S – A/);
          await page.evaluate(()=>{localStorage.removeItem('studentHollandImportedV1');localStorage.setItem('studentHollandV1',JSON.stringify({answers:Array(42).fill(3)}));});
          await page.reload({waitUntil:'domcontentloaded'});
          assert.match(await page.locator('#resultTieNote').innerText(),/đồng điểm/);
          await page.waitForFunction(()=>JSON.parse(localStorage.getItem('studentHollandV1')).completed===true);
          assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('studentHollandV1')).answered),42);
        }
        if(file==='careers-holland.html') {
          await page.waitForFunction(()=>document.getElementById('careerCount').textContent.includes('102'));
          await page.goto(base+'/careers-holland.html?holland=all&q='+encodeURIComponent('Giảng viên đại học'),{waitUntil:'domcontentloaded'});
          await page.locator('.career-salary').waitFor();
          assert.match(await page.locator('.career-salary').innerText(),/Chưa có dữ liệu xác minh/);
          await page.locator('#favBtn').click();
          await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bw_favorites')||'[]').some(j=>j.name==='Giảng viên đại học'));
          await page.reload({waitUntil:'domcontentloaded'});
          await page.locator('#favBtn.saved').waitFor();
          await page.locator('#careerSearch').fill('zz-no-matching-career');
          await page.locator('#careerSearch').press('Enter');
          await page.waitForFunction(()=>document.getElementById('careerResult').textContent.includes('Không tìm thấy'));
        }
        if(file==='page2.html') {
          await page.locator('.school-section').first().waitFor();
          assert.equal(await page.locator('.school-section').count(),37);
          assert.match(await page.locator('#schoolCatalogStatus').innerText(),/35 hồ sơ trường/);
          const archive=page.locator('#admissions-hcmut-2025');
          assert.equal(await archive.isVisible(),false);
          await page.locator('#year-hcmut-2025').click();
          assert.equal(await archive.isVisible(),true);
          assert.equal(await page.locator('#admissions-hcmut-2026').isVisible(),false);
          assert.equal(await page.locator('#year-hcmut-2025').getAttribute('aria-pressed'),'true');
          assert.match(await archive.innerText(),/Thông báo điểm chuẩn 2025/);
          assert.match(await archive.innerText(),/không tự áp dụng/);
          assert.match(await archive.locator('a').first().getAttribute('href'),/hcmut\.edu\.vn.*2025/);
          assert.match(await page.locator('#hcmut .flow-actions').innerText(),/Tính điểm tham khảo 2026/);
          assert.equal(await page.locator('#admissions-uit-2026').isVisible(),true);
          if(fs.existsSync(path.join(root,'.cache'))) await page.locator('#hcmut').screenshot({path:path.join(root,'.cache/school-history-'+width+'.png')});
          await page.locator('#searchInput').fill('fpt');
          assert.equal(await page.locator('.school-section').count(),1);
          await page.locator('#searchInput').fill('');
          assert.equal(await page.locator('#admissions-hcmut-2025').isVisible(),true);
          await page.locator('#year-hcmut-2026').focus();
          await page.keyboard.press('Space');
          assert.equal(await page.locator('#admissions-hcmut-2026').isVisible(),true);
          assert.equal(await page.locator('#admissions-hcmut-2025').isVisible(),false);
          await page.locator('#searchInput').fill('zz-no-matching-school');
          assert.equal(await page.locator('.school-section').count(),0);
          await page.goto(base+'/page2.html#fpt-ai',{waitUntil:'domcontentloaded'});
          await page.locator('#fpt').waitFor();
          assert.equal(await page.locator('#fpt-ai').count(),0);
          await page.goto(base+'/page2.html#hucfl',{waitUntil:'domcontentloaded'});
          await page.locator('#hucfl').waitFor();
          assert.match(await page.locator('#hucfl').innerText(),/chờ xác minh/);
          await page.goto(base+'/page2.html?admission_year=2025#fpt-ai',{waitUntil:'domcontentloaded'});
          await page.locator('#admissions-fpt-2025').waitFor();
          assert.equal(await page.locator('#admissions-fpt-2026').isVisible(),false);
          assert.match(await page.locator('#admissions-fpt-2025').innerText(),/có cả hai năm/);
          assert.match(await page.locator('#admissions-ump-2025').innerText(),/Chưa bổ sung nguồn/);
          assert.equal(await page.locator('#admissions-ump-2025 a').count(),0);
          await page.reload({waitUntil:'domcontentloaded'});
          await page.locator('#admissions-fpt-2025').waitFor();
        }
        if(file==='score-calculator.html') {
          await page.locator('#scoreNextStep').waitFor({state:'attached'});
          await page.locator('#resetBtn').click();
          await page.locator('#calcBtn').click();
          assert.equal(await page.locator('#calcError').isVisible(),true);
          for(const [id,v] of [['sMath','9'],['sPhy','8'],['sChe','9'],['sGrade12','8.4']]) await page.locator('#'+id).fill(v);
          await page.locator('#calcBtn').click();
          assert.equal(await page.locator('#sumCombo').innerText(),'26.00');
          assert.match(await page.locator('.school-outcome').first().innerText(),/25.60/);
          await page.locator('details').filter({has:page.locator('#sVact')}).locator('summary').click();
          for(const [id,v] of [['sVact','1201'],['sHsa','151'],['sTsa','101'],['hLit','-1']]) {
            await page.locator('#'+id).fill(v);await page.locator('#calcBtn').click();
            assert.equal(await page.locator('#calcError').isVisible(),true);
            assert.equal(await page.locator('#resultSummary').isVisible(),false);
            await page.locator('#'+id).fill('');
          }
          for(const [id,v] of [['sVact','1200'],['sHsa','150'],['sTsa','100']]) await page.locator('#'+id).fill(v);
          await page.locator('#calcBtn').click();
          assert.equal(await page.locator('#sumVact').innerText(),'1200');
          assert.equal(await page.locator('#sumHsa').innerText(),'150');
          assert.equal(await page.locator('#sumTsa').innerText(),'100');
          await page.locator('#sMath').fill('5');await page.locator('#sPhy').fill('4');await page.locator('#sChe').fill('5');
          await page.locator('#calcBtn').click();
          assert.match(await page.locator('.school-outcome').first().innerText(),/dưới 15/);
          assert.doesNotMatch(await page.locator('.school-outcome').first().innerText(),/\d+\.\d{2}\/30/);
          await page.locator('#resetBtn').click();
          await page.selectOption('#comboSelect','X26');
          for(const [id,v] of [['sMath','8'],['sInformatics','9'],['sEng','7']]) await page.locator('#'+id).fill(v);
          await page.locator('#calcBtn').click();
          assert.equal(await page.locator('#sumCombo').innerText(),'24.00');
          await page.reload({waitUntil:'domcontentloaded'});
          assert.equal(await page.locator('#comboSelect').inputValue(),'X26');
          assert.equal(await page.locator('#sInformatics').inputValue(),'9');
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false,file+' overflow at '+width);
        cases.push({width,file,ok:true});
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
    // Explicit empty, malformed and failed-load states (isolated browser sessions).
    for(const [file,resource,body] of [
      ['page2.html','schools.json','[]'], ['page2.html','schools.json','{}'],
      ['careers-holland.html','jobs.json','[]'], ['careers-holland.html','jobs.json',null],
    ]) {
      const context=await browser.newContext(),page=await context.newPage();
      await page.route('**/assets/data/'+resource,route=>body===null?route.abort():route.fulfill({status:200,contentType:'application/json',body}));
      await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
      if(file==='page2.html') {
        await page.waitForFunction(()=>!document.getElementById('schoolCatalogStatus').textContent.includes('Đang tải'));
        assert.equal(await page.locator('.school-section').count(),0);
      } else {
        await page.waitForFunction(()=>!document.getElementById('careerCount').textContent.includes('Đang tải'));
        assert.match(await page.locator('#careerResult,#careerCount').allTextContents().then(t=>t.join(' ')),/Chưa có dữ liệu|Chưa tải/);
      }
      cases.push({file,state:body===null?'failed-load':body==='[]'?'empty':'invalid',ok:true});
      await context.close();
    }
    for(const state of ['loading','failed-load']) {
      const context=await browser.newContext(),page=await context.newPage();
      await page.route('**/assets/data/schools.json',async route=>{
        if(state==='failed-load') return route.abort();
        await new Promise(resolve=>setTimeout(resolve,1500));
        await route.fulfill({status:200,contentType:'application/json',body:fs.readFileSync(path.join(root,'assets/data/schools.json'),'utf8')});
      });
      await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
      if(state==='loading') {
        assert.equal(await page.locator('[data-catalog-count]').first().innerText(),'…');
        await page.waitForFunction(()=>document.querySelector('[data-catalog-count]').textContent==='35');
      } else {
        await page.waitForFunction(()=>document.querySelector('[data-catalog-count]').textContent==='—');
        assert.match(await page.locator('#catalogCountNote').innerText(),/Chưa tải/);
      }
      cases.push({file:'index.html',state,ok:true});
      await context.close();
    }
    console.log(JSON.stringify({passed:cases.length,cases}));
  } catch(error) {console.error(error);process.exitCode=1;}
  finally {await browser?.close();server.close();}
});
