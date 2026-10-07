// retry-final.cjs — Final attempt với Special:FilePath và scraping
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const outDir = path.join(__dirname, '..', 'assets', 'images', 'logos');
const TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 6;

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: TIMEOUT_MS
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        return resolve(fetchUrl(next, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(new Error('Timeout')); });
    req.on('error', reject);
  });
}

const filenameMap = {
  'FTU2': 'ftu2.png',
  'HUCFL': 'hucfl.png',
  'HCMUT OISP': 'hcmutoisp.png'
};

const WIKI_FILEPATHS = {
  'FTU2': [
    'https://commons.wikimedia.org/wiki/Special:FilePath/FTU_logo_2020.png',
    'https://commons.wikimedia.org/wiki/Special:FilePath/FTU_logo.svg',
    'https://upload.wikimedia.org/wikipedia/vi/8/8c/FTU_logo_2020.png'
  ],
  'HUCFL': [
    'https://commons.wikimedia.org/wiki/Special:FilePath/HUCFL_Logo.png',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Hue_College_of_Foreign_Languages_logo.png',
    'https://upload.wikimedia.org/wikipedia/vi/0/05/HUCFL_Logo.png'
  ],
  'HCMUT OISP': [
    'https://oisp.hcmut.edu.vn/sites/all/themes/oisp/logo.png',
    'https://oisp.hcmut.edu.vn/sites/default/files/logo.png',
    'https://oisp.hcmut.edu.vn/templates/oisp/logo.png',
    'https://oisp.hcmut.edu.vn/sites/default/files/styles/large/public/OISP_Logo.png'
  ]
};

const HOMEPAGES = {
  'FTU2': 'https://www.ftu.edu.vn/',
  'HUCFL': 'https://hucfl.hueuni.edu.vn/',
  'HCMUT OISP': 'https://oisp.hcmut.edu.vn/'
};

function fetchHtml(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 Brightway' },
      timeout: TIMEOUT_MS
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        return resolve(fetchHtml(next, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const ct = res.headers['content-type'] || '';
      if (!ct.includes('html')) { res.resume(); return reject(new Error('Not HTML')); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(new Error('Timeout')); });
    req.on('error', reject);
  });
}

(async () => {
  for (const short of Object.keys(filenameMap)) {
    const outPath = path.join(outDir, filenameMap[short]);
    let ok = false;
    let source = 'fail';

    // 1. Try Wiki FilePath
    for (const u of WIKI_FILEPATHS[short] || []) {
      try {
        const buf = await fetchUrl(u);
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
        if ((isPng || isJpg) && buf.length > 500) {
          fs.writeFileSync(outPath, buf);
          ok = true; source = 'wiki-fp'; break;
        }
      } catch (e) {}
    }

    // 2. Scrape homepage
    if (!ok) {
      try {
        const html = await fetchHtml(HOMEPAGES[short]);
        // Look for og:image or logo in <img>
        const patterns = [
          /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
          /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
          /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
          /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i
        ];
        for (const pat of patterns) {
          const m = html.match(pat);
          if (m && m[1]) {
            let imgUrl = m[1];
            if (!imgUrl.startsWith('http')) {
              const base = HOMEPAGES[short];
              imgUrl = new URL(imgUrl, base).toString();
            }
            if (imgUrl.endsWith('.svg')) continue; // skip svgs for now
            try {
              const buf = await fetchUrl(imgUrl);
              const isPng = buf[0] === 0x89 && buf[1] === 0x50;
              const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
              if ((isPng || isJpg) && buf.length > 500) {
                fs.writeFileSync(outPath, buf);
                ok = true; source = 'scraped'; break;
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    console.log(`${ok ? '✓' : '✗'} ${short.padEnd(14)} ${source}`);
  }
})();