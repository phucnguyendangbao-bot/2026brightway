// Browser audit complements the task-level functional suites; uses the repository's real pages and assets.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const phase = process.argv[2] === 'before' ? 'before' : 'after';
const out = path.join(root, '.cache/product-polish', phase);
fs.mkdirSync(out, { recursive: true });
const routes = ['index.html','careers-holland.html?holland=all','holland.html','page2.html?mode=school','score-calculator.html','profile.html?tab=journey','profile.html?tab=account','calendar.html','resources.html','news.html','news-detail.html','majors.html','major-detail.html','scholarship-roadmap.html','essay-review.html','interview-prep.html','login.html','waybi.html'];
const widths = [360,390,768,1024,1366,1440,1920];
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,data) => error ? res.writeHead(404).end() : res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(data));
});
function inventory(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item => {
    if (['.git','.cache','node_modules','.vercel'].includes(item.name)) return [];
    const file = path.join(dir,item.name);
    return item.isDirectory() ? inventory(file) : [path.relative(root,file).replaceAll('\\','/')];
  });
}
(async () => {
  const files=inventory(root);
  fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({html:files.filter(f=>f.endsWith('.html')),css:files.filter(f=>f.endsWith('.css')),javascript:files.filter(f=>/\.(?:js|cjs|mjs)$/.test(f)),assets:files.filter(f=>f.startsWith('assets/')),all:files},null,2));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const pages = [];
  let AxeBuilder;
  try { AxeBuilder=require(path.join(root,'.cache/qa-tools/node_modules/@axe-core/playwright')).default; } catch {}
  try {
    for (const route of routes) {
      console.log('Auditing '+route);
      const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
      const page=await context.newPage();
      page.setDefaultTimeout(12000);
      const result={route,issues:[],javascriptErrors:[],consoleErrors:[],missingLocalAssets:[],screenshots:[],accessibility:[]};
      page.on('pageerror',error=>result.javascriptErrors.push(error.message));
      page.on('console',message=>{ if(message.type()==='error' && !/Failed to load resource/.test(message.text())) result.consoleErrors.push(message.text()); });
      page.on('response',response=>{if(response.status()>=400 && response.url().startsWith(base)) result.missingLocalAssets.push({url:response.url().replace(base,''),status:response.status()});});
      try {
        await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>Boolean(window.BWFlow));
        await page.evaluate(()=>document.fonts.ready);
        // Waybi reveals its unread badge after a short idle period. Keep the
        // regression check long enough to catch badge animations that enlarge
        // document scroll width on narrow screens.
        if (route.startsWith('page2.html') || route.startsWith('profile.html')) await page.waitForTimeout(3200);
        // Allow asynchronous catalogs to settle, without requiring backend-only account services.
        await page.waitForFunction(()=>!document.querySelector('#schoolCatalogStatus[aria-busy="true"],#my-choices[aria-busy="true"]'),null,{timeout:8000}).catch(()=>{});
        result.shell=await page.evaluate(()=>({header:document.querySelectorAll('.flow-nav').length,footer:document.querySelectorAll('.flow-footer').length,active:[...document.querySelectorAll('.flow-nav [aria-current="page"]')].map(a=>a.textContent.trim()),font:getComputedStyle(document.body).fontFamily,labels:[...document.querySelectorAll('.flow-links>a:not(.flow-waybi-link)')].map(a=>a.textContent.trim())}));
        if(result.shell.header!==1 || result.shell.footer!==1) result.issues.push('shared shell count');
        for (const width of widths) {
          await page.setViewportSize({width,height:900});
          const overflow=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));
          if(overflow.content>width+1) result.issues.push(`overflow ${width}: ${overflow.content}`);
          if([390,1366].includes(width)) {
            const name=route.replace(/[^a-z0-9]+/gi,'-')+'-'+width+'.png';
            await page.screenshot({path:path.join(out,name),fullPage:true,animations:'disabled'});
            result.screenshots.push(name);
          }
        }
        await page.setViewportSize({width:390,height:900});
        await page.locator('.flow-menu').click();
        result.mobileMenu=await page.locator('.flow-menu').getAttribute('aria-expanded')==='true';
        await page.keyboard.press('Escape');
        if(await page.locator('.flow-menu').getAttribute('aria-expanded')!=='false') result.issues.push('Escape does not close mobile menu');
        const invalidText=await page.locator('body').innerText();
        if(/\b(?:undefined|NaN|null)\b/.test(invalidText)) result.issues.push('unresolved data text');
        if(AxeBuilder) {
          const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
          result.accessibility=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}));
          if(axe.violations.some(v=>['serious','critical'].includes(v.impact))) result.issues.push('serious accessibility');
        } else result.accessibilityStatus='BLOCKED: axe unavailable';
        if(result.javascriptErrors.length) result.issues.push('JavaScript errors');
        if(result.missingLocalAssets.length) result.issues.push('missing local resources');
      } catch(error) {result.issues.push(error.message);}
      result.status=result.issues.length?'FAIL':'PASS';
      pages.push(result);
      fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({phase,widths,pages},null,2));
      console.log(`${result.status}: ${result.issues.join('; ') || 'shell, responsive, keyboard, assets and accessibility'}`);
      await context.close();
    }
  } finally {await browser.close();server.close();}
  console.log(JSON.stringify({phase,pass:pages.filter(p=>p.status==='PASS').length,fail:pages.filter(p=>p.status==='FAIL').length,artifacts:out},null,2));
  if(pages.some(p=>p.status==='FAIL')) process.exitCode=1;
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
