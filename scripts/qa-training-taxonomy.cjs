const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const artifacts = path.join(root,'.cache/training-taxonomy');
fs.mkdirSync(artifacts,{recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,data) => error ? res.writeHead(404).end() : res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(data));
});

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:390,height:850}});
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  try {
    await page.goto(base + '/page2.html?mode=major',{waitUntil:'domcontentloaded'});
    await page.locator('#searchInput').waitFor({state:'visible'});
    await page.waitForFunction(() => !document.querySelector('#searchInput').disabled);
    await page.locator('#searchInput').fill('cntt');
    await page.waitForFunction(() => document.querySelector('#schoolCatalogStatus').textContent.includes('cntt'));
    assert.ok(await page.locator('.school-section').count() > 0,'Abbreviation search must return schools');
    assert.ok((await page.locator('.school-card-programs').first().innerText()).toLowerCase().includes('công nghệ thông tin'));

    await page.locator('#searchInput').fill('');
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('q'));
    await page.locator('.school-card-open[data-school-id="ctu"]').click();
    const dialog = page.locator('#schoolDialog');
    assert.ok(await dialog.isVisible());
    assert.equal(await dialog.locator('#schoolProgramSort').inputValue(),'code');
    assert.ok(await dialog.locator('.school-taxonomy-field').count() > 0);
    assert.ok(await dialog.locator('.school-taxonomy-group').count() > 0);
    assert.ok(await dialog.locator('.school-taxonomy-major').count() > 0);
    await dialog.locator('#schoolProgramSort').scrollIntoViewIfNeeded();
    await dialog.screenshot({path:path.join(artifacts,'school-ctu-mobile.png')});
    const before = await dialog.locator('tr[data-program-index]').evaluateAll(rows => rows.map(row => row.dataset.programIndex));
    assert.equal(before.length,127);
    await dialog.locator('#schoolProgramSort').selectOption('az');
    const after = await dialog.locator('tr[data-program-index]').evaluateAll(rows => rows.map(row => row.dataset.programIndex));
    assert.notDeepEqual(after,before,'A–Z must change ordering within the taxonomy');
    assert.deepEqual([...after].sort((a,b)=>Number(a)-Number(b)),[...before].sort((a,b)=>Number(a)-Number(b)),'Sorting cannot remove or duplicate programs');

    const first = dialog.locator('tr[data-program-index]').first();
    const index = await first.getAttribute('data-program-index');
    const name = await first.locator('td:nth-child(2)').evaluate(cell => cell.firstChild.textContent.trim());
    await first.locator('[data-action="score-program"]').click();
    await page.waitForURL('**/score-calculator.html?school=ctu&program=' + index);
    await page.waitForFunction(() => !document.querySelector('#targetProgram').disabled);
    assert.equal(await page.locator('#targetProgram').inputValue(),index,'Calculator must keep original row index after display sorting');
    assert.ok((await page.locator('#targetProgram option:checked').innerText()).includes(name));
    assert.deepEqual(errors,[]);
    console.log('PASS: major search, hierarchy, A–Z, original index and calculator handoff');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
