// Font quality gate: keep all user-facing typography on the bundled BrightWay fonts.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const issues = [];
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const sourceFiles = [
  ...htmlFiles.map(file => path.join(root, file)),
  ...fs.readdirSync(path.join(root, 'assets/css')).filter(file => file.endsWith('.css')).map(file => path.join(root, 'assets/css', file)),
  ...fs.readdirSync(path.join(root, 'assets/js')).filter(file => file.endsWith('.js')).map(file => path.join(root, 'assets/js', file)),
];
const externalFontPattern = /https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/i;
const unbundledFamilyPattern = /font-family\s*:\s*[^;]*(?:Nunito|Poppins|Inter|Pacifico)/i;

for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const label = path.relative(root, file);
  if (externalFontPattern.test(text)) issues.push(`${label}: external Google font reference`);
  if (unbundledFamilyPattern.test(text)) issues.push(`${label}: unbundled font family reference`);
  if (/font-display\s*:\s*optional/i.test(text)) issues.push(`${label}: font-display optional can leave fallback typography`);
}

const fontCss = fs.readFileSync(path.join(root, 'assets/fonts/brightway-fonts.css'), 'utf8');
for (const match of fontCss.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
  const asset = match[2];
  if (asset.startsWith('./') && !fs.existsSync(path.join(root, 'assets/fonts', asset.slice(2)))) {
    issues.push(`assets/fonts/brightway-fonts.css: missing ${asset}`);
  }
}
assert.equal(issues.length, 0, issues.join('\n'));

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!target.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
  fs.readFile(target, (error, body) => error ? res.writeHead(404).end() : res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' }).end(body));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  try {
    for (const file of ['index.html', 'holland.html', 'careers-holland.html', 'page2.html?mode=school', 'profile.html?tab=journey', 'score-calculator.html']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const fontRequests = [];
      const errors = [];
      page.on('request', request => { if (externalFontPattern.test(request.url())) fontRequests.push(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/${file}`, { waitUntil: 'networkidle', timeout: 30000 });
      const status = await page.evaluate(() => ({ fontStatus: document.fonts.status, body: getComputedStyle(document.body).fontFamily }));
      assert.deepEqual(fontRequests, [], `${file}: external font request`);
      assert.deepEqual(errors, [], `${file}: JavaScript error: ${errors.join('; ')}`);
      assert.equal(status.fontStatus, 'loaded', `${file}: document.fonts did not settle`);
      results.push({ file, status: 'PASS', fontStatus: status.fontStatus, bodyFont: status.body });
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log(JSON.stringify({ status: 'PASS', staticFiles: sourceFiles.length, pages: results }, null, 2));
})().catch(error => {
  console.error(error.stack || error.message);
  server.close();
  process.exitCode = 1;
});
