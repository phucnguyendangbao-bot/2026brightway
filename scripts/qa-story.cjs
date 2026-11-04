// Measures the homepage story against the UI plan's targets.
// Usage: node scripts/qa-story.cjs [url]   (default http://localhost:8080/index.html)
// Browser: BRIGHTWAY_BROWSER_PATH=/path/to/chrome, or BRIGHTWAY_BROWSER=msedge|chrome (default msedge).
const { chromium } = require('playwright-core');

const url = process.argv[2] || 'http://localhost:8080/index.html';
const launch = process.env.BRIGHTWAY_BROWSER_PATH
  ? { executablePath: process.env.BRIGHTWAY_BROWSER_PATH }
  : { channel: process.env.BRIGHTWAY_BROWSER || 'msedge' };

async function measure(browser, options) {
  const page = await browser.newPage(options);
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0;
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const result = await page.evaluate(async () => {
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
    scrollTo(0, 0);
    const visible = el => el.getClientRects().length > 0;
    return {
      screens: +(height / innerHeight).toFixed(1),
      storyScreens: +((document.querySelector('[data-story]')?.getBoundingClientRect().height || 0) / innerHeight).toFixed(1),
      linksAndButtons: [...document.querySelectorAll('a, button')].filter(visible).length,
      loopingAnimations: [...document.querySelectorAll('*')].filter(el => { const s = getComputedStyle(el); return s.animationName !== 'none' && s.animationIterationCount.includes('infinite'); }).map(el => getComputedStyle(el).animationName),
      scripts: [...document.scripts].filter(s => s.src).length,
      horizontalScroll: document.documentElement.scrollWidth > innerWidth,
      lcpMs: Math.round(window.__lcp),
      cls: +window.__cls.toFixed(3),
    };
  });
  await page.close();
  return { ...result, errors };
}

(async () => {
  const browser = await chromium.launch({ ...launch, headless: true });
  try {
    const rows = {
      'mobile 375x812': await measure(browser, { viewport: { width: 375, height: 812 } }),
      'mobile, reduced motion': await measure(browser, { viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' }),
      'desktop 1440x900': await measure(browser, { viewport: { width: 1440, height: 900 } }),
    };
    console.table(Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, { ...v, loopingAnimations: v.loopingAnimations.join(', '), errors: v.errors.length }])));
    const mobile = rows['mobile 375x812'];
    const fails = [];
    if (mobile.storyScreens > 8) fails.push(`story is ${mobile.storyScreens} screens on mobile (target ≤ 8)`);
    if (mobile.loopingAnimations.length > 1) fails.push(`looping animations: ${mobile.loopingAnimations.join(', ')}`);
    if (rows['mobile, reduced motion'].loopingAnimations.length) fails.push('reduced motion still loops');
    if (mobile.cls >= 0.1) fails.push(`CLS ${mobile.cls}`);
    for (const [k, v] of Object.entries(rows)) if (v.errors.length) fails.push(`${k}: ${v.errors[0]}`);
    if (fails.length) { console.error('\n' + fails.join('\n')); process.exitCode = 1; }
  } finally { await browser.close(); }
})();
