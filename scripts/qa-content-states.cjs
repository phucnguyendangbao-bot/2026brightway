// Recovery checks against real CMS responses. Only failures are injected; successful data is never replaced.
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'.cache/product-polish/content-states');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,data)=>error?res.writeHead(404).end():res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const scenarios=[];
  async function scenario(name,run){
    console.log('Running '+name);
    const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try {await run(page,context);assert.deepEqual(errors,[]);scenarios.push({name,status:'PASS'});}
    catch(error){await page.screenshot({path:path.join(out,name+'-failure.png'),fullPage:true}).catch(()=>{});scenarios.push({name,status:'FAIL',error:error.message});}
    finally{await context.close();}
  }
  try{
    for(const file of ['majors.html','news.html','major-detail.html?slug=__qa_missing__','news-detail.html?slug=__qa_missing__']){
      await scenario('sdk-failure-retry-'+file.split('.')[0],async page=>{
        let sdkRequests=0;
        const sdk='**/npm/@supabase/supabase-js@2';
        await page.route(sdk,route=>{sdkRequests++;return route.abort('failed');});
        await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
        const retry=page.getByRole('button',{name:'Thử lại',exact:true});
        await retry.waitFor();
        const host=page.locator(file.startsWith('major-detail')?'#container':file.startsWith('news-detail')?'#article-container':'#main-content');
        assert.equal(await host.getAttribute('aria-busy'),'false');
        await retry.click();
        await retry.waitFor();
        assert.ok(sdkRequests>=2,'Retry must issue a new SDK request');
        await page.screenshot({path:path.join(out,file.split('.')[0]+'-offline.png'),fullPage:true});
        await page.unroute(sdk);
        await retry.click();
        await page.waitForFunction(()=>Boolean(window.supabaseClient),null,{timeout:20000});
        await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'),null,{timeout:20000});
        if(!file.includes('detail'))assert.equal(await retry.count(),0,'Live CMS list must recover to real records or a verified empty state: '+(await host.innerText()));
        else assert.ok((await host.innerText()).includes('Không thể tải'),'Missing slug ends in a clear recoverable state');
      });
    }
    await scenario('live-major-filter-and-keyboard-detail',async page=>{
      await page.goto(base+'/majors.html',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#main-content').getAttribute('aria-busy')==='false');
      const card=page.locator('[data-major-slug]').first();
      assert.ok(await card.count(),'Real CMS major records must load');
      await card.focus();
      const slug=await card.getAttribute('data-major-slug');
      await page.keyboard.press('Enter');
      await page.waitForURL('**/major-detail.html?slug='+encodeURIComponent(slug));
      await page.waitForFunction(()=>document.querySelector('#container').getAttribute('aria-busy')==='false');
      assert.equal(await page.getByRole('button',{name:'Thử lại',exact:true}).count(),0);
      assert.ok(await page.locator('#container h1').isVisible());
    });
    await scenario('verified-waybi-calendar-and-deferred-images',async page=>{
      const imageRequests=[];
      page.on('request',request=>{if(/\/assets\/images\/hero\//.test(request.url()))imageRequests.push(request.url());});
      await page.goto(base+'/index.html',{waitUntil:'networkidle'});
      const inactive=['02-ctu','03-ueh','14-rmit','06-vlu','16-uit-campus','17-tdtu-campus','11-hcmus'];
      assert.ok(!imageRequests.some(url=>inactive.some(name=>url.includes(name))),'Hidden carousel photos must not download at startup');
      const frame=await page.locator('#bwHeroCarousel').boundingBox();
      await page.locator('#bwHeroNext').click();
      await page.locator('#bwHeroCarousel .is-active img').evaluate(img=>img.decode());
      assert.equal(await page.locator('#bwHeroCaption').innerText(),'ĐH Cần Thơ');
      assert.equal((await page.locator('#bwHeroCarousel').boundingBox()).height,frame.height);
      await page.goto(base+'/waybi.html',{waitUntil:'networkidle'});
      const result=await page.evaluate(async()=>{
        const [{default:policy},{officialEvents}]=await Promise.all([import('./assets/data/admissions-policy.js'),import('./assets/js/calendar-rules.js')]);
        return {expected:[...new Set(officialEvents(policy,2026).map(event=>event.d))].length,actual:document.querySelectorAll('#calGrid .has-event').length};
      });
      assert.ok(result.expected>0);
      assert.equal(result.actual,result.expected);
      assert.ok(!(await page.locator('#calendar').innerText()).includes('Thi V-ACT đợt 3'));
    });
  }finally{await browser.close();server.close();}
  const report={pass:scenarios.filter(s=>s.status==='PASS').length,fail:scenarios.filter(s=>s.status==='FAIL').length,scenarios,note:'Real CMS responses and existing official admissions sources. Network/SDK failures are injected only for recovery checks.'};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(report.fail)process.exitCode=1;
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
