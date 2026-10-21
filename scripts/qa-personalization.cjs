const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'.cache','personalization-qa');
fs.mkdirSync(artifacts,{recursive:true});
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,body)=>error?res.writeHead(404).end():res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream'}).end(body));
});
let browser,base;
const report=[];
async function scenario(name,run){
  const context=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {console.log('Running '+name);await run(page,context);assert.deepEqual(errors,[]);report.push({name,status:'PASS'});}
  catch(error){await page.screenshot({path:path.join(artifacts,name+'-failure.png'),fullPage:true}).catch(()=>{});report.push({name,status:'FAIL',error:error.message,url:page.url()});}
  finally{await context.close();}
}
async function open(page,file='profile.html?tab=journey#personal-profile'){
  await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.BWPersonalization));
  if(file.startsWith('profile'))await page.locator('#personalProfileForm').waitFor();
}
async function save(page){await page.locator('#personalProfileForm button[type="submit"]').click();await page.locator('#personalProfileStatus').filter({hasText:'Đã lưu'}).waitFor();}
async function enable(page){await page.locator('#personalEnabled').check();await save(page);await page.locator('#personal-recommendations[aria-busy="false"]').waitFor();}
async function chat(page,question,home=false){
  await page.locator(home?'#bwChatLauncher':'#waybi-fab').click();
  await page.locator(home?'#bwChatInput':'#waybi-input').fill(question);
  await page.locator(home?'#bwChatSend':'#waybi-send').click();
  await page.locator(home?'#bwChatBody':'#waybi-messages').getByText('Phản hồi kiểm thử kênh chat.',{exact:true}).last().waitFor();
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    await scenario('01-new-visitor-and-skip-all',async page=>{
      await open(page,'index.html');assert.equal(await page.locator('.home-journey-card').count(),3);assert.equal(await page.locator('#personalDashboard').isVisible(),false);
      assert.equal(await page.evaluate(()=>localStorage.getItem('bwJourneyV2')),null);
      await open(page);await page.locator('#personalSkip').click();
      assert.equal(await page.locator('#personalEnabled').isChecked(),false);
      assert.equal(await page.locator('#personalDashboard').isVisible(),false);
      assert.equal(await page.evaluate(()=>BWFlow.read().personalization.waybiSharing),false);
    });
    await scenario('02-partial-profile-reload-export',async page=>{
      await open(page);await page.locator('#personalYear').selectOption('2027');await page.locator('#personalRegion').selectOption('Cần Thơ');await enable(page);
      assert.equal(await page.evaluate(()=>BWFlow.read().personalization.year),2027);
      await page.reload();await page.locator('#personalRegion').waitFor();assert.equal(await page.locator('#personalRegion').inputValue(),'Cần Thơ');
      const downloadPromise=page.waitForEvent('download');await page.locator('#personalExport').click();const download=await downloadPromise;const target=path.join(artifacts,'profile-export.json');await download.saveAs(target);
      const file=JSON.parse(fs.readFileSync(target,'utf8'));assert.equal(file.personalization.year,2027);assert.equal(file.format,'brightway-personal-profile');assert.equal('scores' in file,false);
      await open(page,'index.html');assert.equal(await page.locator('#personalDashboard').isVisible(),true);assert.equal(await page.locator('.flow-resume > .flow-journey').isVisible(),false);
    });
    await scenario('03-holland-real-42-questions',async page=>{
      await open(page);await enable(page);await open(page,'holland.html');
      for(let i=0;i<42;i++){await page.locator(`.q-btn[data-idx="${i}"][data-val="${i%5+1}"]`).click();if((i+1)%5===0 && i<41)await page.locator('#btnNext').click();}
      await page.locator('#btnFinish').click();await page.locator('#resultCard.show').waitFor();
      await open(page);await page.locator('#personal-recommendations .personal-results').first().waitFor();
      assert.match(await page.locator('#personalDashboard').innerText(),/Holland: [RIASEC]{3}/);
      assert.match(await page.locator('#personal-recommendations').innerText(),/Có nhóm sở thích Holland/);
    });
    await scenario('04-location-budget-and-invalid-range',async page=>{
      await open(page);await page.locator('#personalRegion').selectOption('Cần Thơ');await page.locator('#personalRegionMode').selectOption('required');await enable(page);
      let result=await page.evaluate(async()=>{const m=await import('/assets/js/personalization-model.js');const r=await fetch('/assets/data/schools.json');const {buildUniversityCatalog}=await import('/assets/data/university-identities.js');return m.recommend({state:BWFlow.read(),schools:buildUniversityCatalog(await r.json()).schools}).outside.map(x=>x.school.id);});
      await page.locator('#personalRegion').selectOption('TP.HCM');await save(page);
      const other=await page.evaluate(async()=>{const m=await import('/assets/js/personalization-model.js');const r=await fetch('/assets/data/schools.json');const {buildUniversityCatalog}=await import('/assets/data/university-identities.js');return m.recommend({state:BWFlow.read(),schools:buildUniversityCatalog(await r.json()).schools}).outside.map(x=>x.school.id);});assert.notDeepEqual(result,other);
      await page.locator('#personalBudgetMin').fill('50');await page.locator('#personalBudgetMax').fill('20');await page.locator('#personalProfileForm button[type="submit"]').click();await page.getByText('Ngân sách thấp nhất phải nhỏ hơn hoặc bằng mức cao nhất.',{exact:true}).waitFor();
      await page.locator('#personalBudgetMin').fill('');await page.locator('#personalBudgetMode').selectOption('required');await save(page);
      await page.getByText(/^Chưa đủ dữ liệu theo điều kiện bắt buộc/).click();assert.match(await page.locator('#personal-recommendations').innerText(),/Chưa có học phí theo năm/);
      assert.equal(await page.evaluate(()=>BWFlow.read().personalization.budgetMax),20e6);
    });
    await scenario('05-existing-schools-wishes-and-reminders',async page=>{
      await open(page,'page2.html?school=fpt');await page.locator('#schoolDialog [data-action="save-school"]').click();
      await page.locator('[data-action="add-wish"]').first().click();await page.locator('[data-action="add-wish"]').nth(1).click();
      await open(page);await page.locator('#personalYear').selectOption('2027');await page.locator('#personalBudgetMax').fill('25');await enable(page);
      assert.equal(await page.locator('#myWishes > li').count(),2);await page.locator('#personalWishReview > summary').click();assert.match(await page.locator('#personalWishReview').innerText(),/học phí/);
      const before=await page.locator('#myWishes h3').allTextContents();await page.locator('#personalRegion').selectOption('Cần Thơ');await save(page);assert.deepEqual(await page.locator('#myWishes h3').allTextContents(),before);
      await page.locator('[data-move-wish="-1"]').nth(1).click();const reordered=await page.locator('#myWishes h3').allTextContents();assert.notDeepEqual(reordered,before);
      await page.reload();await page.locator('#myWishes h3').first().waitFor();assert.deepEqual(await page.locator('#myWishes h3').allTextContents(),reordered);
    });
    for(const home of [false,true])await scenario(home?'07-home-waybi-consent':'06-shared-waybi-consent',async page=>{
      const payloads=[];await page.route('**/api/chat',route=>{payloads.push(route.request().postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'Phản hồi kiểm thử kênh chat.'})});});
      await open(page);await page.locator('#personalYear').selectOption('2027');await page.locator('#personalBudgetMax').fill('20');await enable(page);
      if(home)await open(page,'index.html');
      await chat(page,'Ngân sách học phí của tôi là gì?',home);assert.equal(payloads[0].context,undefined);
      const panel=page.locator(home?'#bwChatPanel':'#waybi-panel');await panel.locator('[data-waybi-profile]').check();
      await page.locator(home?'#bwChatInput':'#waybi-input').fill('Ngân sách học phí của tôi là gì?');await page.locator(home?'#bwChatSend':'#waybi-send').click();await panel.getByText('Phản hồi kiểm thử kênh chat.',{exact:true}).last().waitFor();
      assert.match(payloads[1].context,/20000000/);assert.equal(payloads[1].messages.length,1);assert.doesNotMatch(payloads[1].context,/scores|tasks|email|savedCareers/);
      await panel.locator('[data-waybi-profile]').uncheck();await page.locator(home?'#bwChatInput':'#waybi-input').fill('Xin chào');await page.locator(home?'#bwChatSend':'#waybi-send').click();await panel.getByText('Phản hồi kiểm thử kênh chat.',{exact:true}).last().waitFor();
      assert.equal(payloads[2].context,undefined);assert.equal(payloads[2].messages.length,1);
    });
    await scenario('08-failed-data-retry-and-empty',async page=>{
      await page.route('**/assets/data/jobs.json',route=>route.abort());await open(page);await page.locator('#personalEnabled').check();await save(page);
      await page.locator('[data-personal-retry]').waitFor();assert.equal(await page.locator('#personal-recommendations').getAttribute('aria-busy'),'false');
      await page.screenshot({path:path.join(artifacts,'data-load-error.png'),fullPage:true});
      await page.unroute('**/assets/data/jobs.json');await page.locator('[data-personal-retry]').click();await page.getByText('Trường đáng khám phá',{exact:true}).waitFor();
      await page.route('**/assets/data/jobs.json',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));await page.reload();await page.locator('[data-personal-retry]').waitFor();
    });
    await scenario('09-malformed-version-and-storage-denied',async(page,context)=>{
      await context.addInitScript(()=>{if(!sessionStorage.getItem('qaSeeded')){localStorage.setItem('bwJourneyV2','{broken');sessionStorage.setItem('qaSeeded','1');}});
      await open(page);assert.equal(await page.locator('#personalEnabled').isChecked(),false);assert.match(await page.locator('#journeyStorageNotice').innerText(),/không đọc được/);
      await page.evaluate(()=>BWFlow.save({personalization:{version:99,enabled:true,waybiSharing:true}}));await page.reload();await page.getByText(/Phiên bản hồ sơ cá nhân hóa chưa được hỗ trợ/).waitFor();assert.equal(await page.locator('#personalWaybi').isChecked(),false);
      await context.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};});
      await page.reload();await page.locator('#personalProfileForm').waitFor();await page.locator('#personalEnabled').check();await page.locator('#personalProfileForm button[type="submit"]').click();assert.match(await page.locator('#journeyStorageNotice').innerText(),/Chưa lưu được/);assert.match(await page.locator('#personalProfileStatus').innerText(),/Chưa lưu được/);
    });
    await scenario('10-delete-disable-metrics-and-clear-all',async page=>{
      await open(page);await enable(page);await page.locator('.personal-privacy > summary').click();await page.locator('#personalMetrics').check();
      await page.locator('#personalExport').click();assert.ok(await page.evaluate(()=>BWFlow.read().personalMetrics?.actions>0));
      await page.locator('#personalMetrics').uncheck();assert.equal(await page.evaluate(()=>BWFlow.read().personalMetrics),null);
      await page.locator('#personalEnabled').uncheck();assert.equal(await page.locator('#personalDashboard').isVisible(),false);
      await page.locator('#personalDelete').click();assert.equal(await page.locator('#personalRegion').inputValue(),'');
      await page.evaluate(()=>{BWFlow.save({savedSchools:[{id:'ctu',name:'Đại học Cần Thơ'}],tasks:[{id:'t',text:'Đọc nguồn',done:false}]});BWFlow.storage.set('studentHollandImportedV1',JSON.stringify({code:'RIA',savedAt:Date.now()}));});
      page.once('dialog',dialog=>dialog.accept());await page.locator('[data-flow-reset]').click();await page.waitForLoadState('domcontentloaded');await page.locator('#personalProfileForm').waitFor();
      assert.equal(await page.evaluate(()=>BWFlow.holland()),'');assert.equal(await page.evaluate(()=>BWFlow.read().savedSchools.length),0);assert.equal(await page.evaluate(()=>BWFlow.read().tasks?.length||0),0);
    });
    await scenario('11-responsive-dashboard-and-chat',async page=>{
      await open(page);await page.locator('#personalRegion').selectOption('TP.HCM');await page.locator('#personalYear').selectOption('2027');await enable(page);
      for(const width of [360,390,768,1366]){
        await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`profile overflow ${width}`);
        await page.locator('#personal-profile').screenshot({path:path.join(artifacts,`profile-${width}.png`),animations:'disabled',style:'.flow-nav,#waybi-fab {visibility:hidden}'});
        await page.locator('#waybi-fab').click();const box=await page.locator('#waybi-panel').boundingBox();assert.ok(box.x>=0 && box.x+box.width<=width);await page.keyboard.press('Escape');
      }
      await open(page,'index.html');await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.locator('#personalDashboard').screenshot({path:path.join(artifacts,'home-dashboard-390.png'),style:'.flow-nav {visibility:hidden}'});
    });
  }finally{
    await browser.close();await new Promise(resolve=>server.close(resolve));
    const result={pass:report.filter(x=>x.status==='PASS').length,fail:report.filter(x=>x.status==='FAIL').length,scenarios:report,artifacts,waybiBackend:'Request contract tested using intercepted /api/chat; no live external model call.'};
    fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(result.fail)process.exitCode=1;
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
