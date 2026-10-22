const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const phase = process.argv[2] === 'before' ? 'before' : 'after';
const artifacts = path.join(root, '.cache', 'ui-system-qa', phase);
fs.mkdirSync(artifacts, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
};
const publicRoutes = [
  'index.html', 'calendar.html', 'careers-holland.html?holland=all',
  'essay-review.html', 'holland.html', 'interview-prep.html', 'login.html',
  'major-detail.html', 'majors.html', 'news-detail.html', 'news.html',
  'page2.html?mode=school', 'profile.html?tab=journey', 'resources.html',
  'scholarship-roadmap.html', 'score-calculator.html', 'waybi.html',
];
const responsiveWidths = [360, 390, 768, 1024, 1366, 1920];
const mainLabels = ['Trang chủ', 'Khám phá nghề', 'Khám phá trường', 'Tính điểm', 'Hành trình của tôi'];
const scenarios = [];
let browser;
let base;

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(target, (error, body) => {
    if (error) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream' }).end(body);
  });
});

async function runScenario(name, run, viewport = { width: 1366, height: 900 }) {
  process.stdout.write(`Running ${name}\n`);
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|ERR_ABORTED|Failed to load resource/.test(message.text())) consoleErrors.push(message.text());
  });
  page.setDefaultTimeout(15000);
  try {
    await run(page, context);
    assert.deepEqual(pageErrors, [], `JavaScript errors: ${pageErrors.join(' | ')}`);
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join(' | ')}`);
    scenarios.push({ name, status: 'PASS' });
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, `${name}-failure.png`), fullPage: true, animations: 'disabled' }).catch(() => {});
    scenarios.push({ name, status: 'FAIL', error: error.message, url: page.url() });
  } finally {
    await context.close();
  }
}

async function openFlowPage(page, route) {
  await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.BWFlow));
  await page.locator('.flow-nav').waitFor();
}

async function captureBaseline() {
  const selections = [['index.html', 'home'], ['page2.html?mode=school', 'schools'], ['profile.html?tab=journey#countdowns', 'journey']];
  for (const [route, label] of selections) {
    for (const width of [390, 1366]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await openFlowPage(page, route);
      await page.screenshot({ path: path.join(artifacts, `${label}-${width}.png`), animations: 'disabled' });
      await context.close();
    }
  }
  scenarios.push({ name: 'baseline-capture', status: 'PASS' });
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: process.env.BRIGHTWAY_BROWSER || 'msedge', headless: true });
  try {
    if (phase === 'before') {
      await captureBaseline();
    } else {
      await runScenario('01-shared-navigation-desktop', async page => {
        await openFlowPage(page, 'index.html');
        const labels = await page.locator('#navLinks > a:not(.flow-waybi-link)').allTextContents();
        assert.deepEqual(labels.map(value => value.trim()), mainLabels);
        assert.equal(await page.locator('.flow-nav').count(), 1);
        assert.equal(await page.locator('.flow-links > a[aria-current="page"]').innerText(), 'Trang chủ');
        await page.locator('.flow-more-button').click();
        assert.equal(await page.locator('.flow-more-button').getAttribute('aria-expanded'), 'true');
        assert.ok(await page.locator('.flow-more-menu a').count() >= 6);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.flow-more-button').getAttribute('aria-expanded'), 'false');
        await page.goto(`${base}/calendar.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.BWFlow));
        assert.ok(await page.locator('.flow-more-button').evaluate(node => node.classList.contains('active')), 'Secondary page exposes its active group');
        await page.goto(`${base}/holland.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.BWFlow));
        assert.equal(await page.locator('.flow-links > a[aria-current="page"]').innerText(), 'Khám phá nghề');
        assert.equal(await page.locator('.flow-more-button').evaluate(node => node.classList.contains('active')), false, 'Main category remains the visible active state');
        await page.goto(`${base}/waybi.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.BWFlow));
        assert.equal(await page.locator('.flow-waybi-link').getAttribute('aria-current'), 'page');
        assert.ok(await page.locator('.flow-waybi-link').evaluate(node => node.classList.contains('active')));
      });

      await runScenario('02-mobile-navigation-and-tools', async page => {
        await openFlowPage(page, 'index.html');
        await page.locator('.flow-menu').click();
        assert.equal(await page.locator('.flow-menu').getAttribute('aria-expanded'), 'true');
        await page.locator('.flow-more-button').click();
        assert.equal(await page.locator('.flow-more-button').getAttribute('aria-expanded'), 'true');
        for (const target of ['.flow-menu', '.flow-more-button', '.flow-more-menu a']) {
          const box = await page.locator(target).first().boundingBox();
          assert.ok(box && box.height >= 44, `${target}: touch target must be at least 44px high`);
        }
        const countdown = page.locator('.flow-more-menu a[href="profile.html?tab=journey#countdowns"]');
        assert.equal(await countdown.innerText(), 'BrightWay Countdown');
        await countdown.click();
        await page.waitForURL(/profile\.html\?tab=journey#countdowns$/);
        await page.locator('#countdowns').waitFor();
        await page.locator('.flow-menu').click();
        await page.locator('.flow-more-button').click();
        await page.locator('.flow-more-menu a[href="holland.html"]').click();
        await page.waitForURL(/holland\.html$/);
        assert.ok(await page.locator('body').isVisible());
      }, { width: 390, height: 900 });

      await runScenario('03-static-header-fallbacks', async page => {
        await page.route('**/assets/js/flow.js*', route => route.abort('failed'));
        for (const route of ['index.html', 'careers-holland.html', 'page2.html?mode=school', 'score-calculator.html', 'profile.html?tab=journey']) {
          await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' });
          const labels = await page.locator('.flow-nav #navLinks > a:not(.flow-waybi-link)').allTextContents();
          assert.deepEqual(labels.map(value => value.trim()), mainLabels, `${route}: static shared header`);
          assert.equal(await page.locator('.flow-nav').count(), 1, `${route}: one fallback header`);
        }
      });

      await runScenario('04-all-routes-shared-shell-responsive', async page => {
        for (const route of publicRoutes) {
          await openFlowPage(page, route);
          assert.equal(await page.locator('.flow-nav').count(), 1, `${route}: one shared header`);
          assert.equal(await page.locator('.flow-footer').count(), 1, `${route}: one shared footer`);
          assert.equal(await page.locator('.flow-logo').innerText(), 'BrightWay Career', `${route}: shared logo`);
          assert.equal(await page.locator('.flow-footer-note').count(), 1, `${route}: shared disclaimer`);
          for (const width of responsiveWidths) {
            await page.setViewportSize({ width, height: 900 });
            const metrics = await page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth,
              navVisible: getComputedStyle(document.querySelector('.flow-nav')).display !== 'none',
            }));
            assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `${route}: horizontal overflow at ${width}px (${metrics.scrollWidth}px)`);
            assert.equal(metrics.navVisible, true, `${route}: header hidden at ${width}px`);
          }
        }
      });

      await runScenario('05-shared-footer-on-legacy-pages', async page => {
        for (const route of ['essay-review.html', 'interview-prep.html', 'major-detail.html', 'majors.html', 'news-detail.html', 'news.html']) {
          await openFlowPage(page, route);
          await page.locator('.flow-footer').scrollIntoViewIfNeeded();
          assert.ok(await page.locator('.flow-footer').isVisible(), `${route}: footer visible`);
          assert.equal(await page.locator('.flow-footer nav a').count(), 6, `${route}: common footer links`);
        }
      });

      await runScenario('06-waybi-shared-name-and-bounds', async page => {
        for (const route of ['index.html', 'careers-holland.html?holland=all', 'page2.html?mode=school', 'profile.html?tab=journey', 'score-calculator.html']) {
          await openFlowPage(page, route);
          for (const width of [360, 390, 768, 1366]) {
            await page.setViewportSize({ width, height: 900 });
            const home = route === 'index.html';
            const launcher = page.locator(home ? '#bwChatLauncher' : '#waybi-fab');
            await launcher.click();
            const panel = page.locator(home ? '#bwChatPanel' : '#waybi-panel');
            await panel.waitFor({ state: 'visible' });
            assert.equal(await panel.getAttribute('aria-label'), 'Trợ lý hướng nghiệp Waybi');
            const box = await panel.boundingBox();
            assert.ok(box && box.x >= -1 && box.x + box.width <= width + 1, `${route}: Waybi horizontal bounds at ${width}px`);
            assert.ok(box && box.y >= -1 && box.y + box.height <= 901, `${route}: Waybi vertical bounds at ${width}px`);
            await page.keyboard.press('Escape');
            await panel.waitFor({ state: 'hidden' });
          }
        }
      });

      await runScenario('07-profile-journey-and-storage', async page => {
        await openFlowPage(page, 'profile.html?tab=journey#countdowns');
        assert.equal(await page.locator('body').getAttribute('data-profile-view'), 'journey');
        assert.equal(await page.locator('.profile-page [data-profile-view="journey"]').isVisible(), true);
        assert.equal(await page.locator('.profile-page [data-profile-view="account"]').isVisible(), false);
        await page.locator('.flow-profile-details').waitFor();
        await page.locator('#countdowns').waitFor();
        assert.equal(await page.locator('[data-profile-view-link="journey"]').getAttribute('aria-current'), 'page');
        await page.evaluate(() => window.BWFlow.save({ savedSchools: [{ id: 'ctu', name: 'Đại học Cần Thơ' }] }));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.BWFlow));
        assert.equal(await page.evaluate(() => window.BWFlow.read().savedSchools[0].id), 'ctu');
        await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(window.BWFlow));
        assert.equal(await page.evaluate(() => window.BWFlow.read().savedSchools[0].id), 'ctu');
        assert.ok(await page.locator('.flow-resume').isVisible(), 'Home compact journey widget is visible');
        const keys = await page.evaluate(() => Object.keys(localStorage).filter(key => /journey|countdown/i.test(key)));
        assert.deepEqual(keys, ['bwJourneyV2'], 'Journey and countdown use one canonical localStorage record');
        await page.goto(`${base}/profile.html?tab=account`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.body.dataset.profileView === 'account');
        assert.equal(await page.locator('.profile-page [data-profile-view="journey"]').isVisible(), false);
        assert.equal(await page.locator('.profile-page [data-profile-view="account"]').isVisible(), true);
      });

      await runScenario('08-screenshots-five-primary-pages', async page => {
        for (const [route, label] of [['index.html', 'home'], ['careers-holland.html?holland=all', 'careers'], ['page2.html?mode=school', 'schools'], ['score-calculator.html', 'score'], ['profile.html?tab=journey#countdowns', 'journey']]) {
          for (const width of [390, 1366]) {
            await page.setViewportSize({ width, height: 900 });
            await openFlowPage(page, route);
            await page.screenshot({ path: path.join(artifacts, `${label}-${width}.png`), animations: 'disabled' });
          }
        }
      });
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const report = { phase, status: scenarios.some(item => item.status === 'FAIL') ? 'FAIL' : 'PASS', routes: publicRoutes.length, widths: responsiveWidths, scenarios };
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status === 'FAIL') process.exitCode = 1;
})().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
