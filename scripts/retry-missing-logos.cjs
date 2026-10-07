// retry-missing-logos.cjs — Thử lại với Google Favicon sz=64 + DuckDuckGo + scraping homepage og:image
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
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

// Try fetching homepage and extracting og:image or first big <img>
function fetchHtml(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 BrightwayCareers' },
      timeout: TIMEOUT_MS
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        return resolve(fetchHtml(next, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const ct = res.headers['content-type'] || '';
      if (!ct.includes('html')) {
        res.resume();
        return reject(new Error('Not HTML'));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(new Error('Timeout')); });
    req.on('error', reject);
  });
}

// Custom known logo URLs (verified from university homepages / favicon sources)
const KNOWN_LOGOS = {
  // UMP — Tải logo from homepage og:image (Facebook share image often has logo)
  'UMP': [
    'https://graph.facebook.com/ump.edu.vn/picture?type=large',
    'https://ump.edu.vn/sites/default/files/logo-ump.png',
    'https://ump.edu.vn/themes/portal/logo.png',
    'https://ump.edu.vn/logo.png'
  ],
  'VLU': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Logo_VLU_2022.png/330px-Logo_VLU_2022.png',
    'https://graph.facebook.com/vanlanguni.edu.vn/picture?type=large'
  ],
  'FTU2': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Logo_FTU.svg/330px-Logo_FTU.svg.png',
    'https://graph.facebook.com/ftu.edu.vn/picture?type=large'
  ],
  'HCMIU': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/HCMIU_logo.svg/330px-HCMIU_logo.svg.png',
    'https://graph.facebook.com/hcmiu.edu.vn/picture?type=large'
  ],
  'HUFI': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/HUFI_logo.svg/330px-HUFI_logo.svg.png',
    'https://graph.facebook.com/hufi.edu.vn/picture?type=large'
  ],
  'NTU': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Logo_Nha_Trang.svg/330px-Logo_Nha_Trang.svg.png',
    'https://graph.facebook.com/ntu.edu.vn/picture?type=large'
  ],
  'QNU': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Quy_Nhon_University_logo.svg/330px-Quy_Nhon_University_logo.svg.png',
    'https://graph.facebook.com/qnu.edu.vn/picture?type=large'
  ],
  'DUE': [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Logo_DUE.svg/330px-Logo_DUE.svg.png',
    'https://graph.facebook.com/due.udn.vn/picture?type=large'
  ],
  'HUCFL': [
    'https://graph.facebook.com/hucfl.hueuni.edu.vn/picture?type=large',
    'https://www.google.com/s2/favicons?domain=hucfl.hueuni.edu.vn&sz=128'
  ],
  'HCMUT OISP': [
    'https://oisp.hcmut.edu.vn/sites/default/files/OISP_logo.png',
    'https://oisp.hcmut.edu.vn/themes/oisp/logo.png'
  ]
};

// Mapping từ short -> logo filename
const filenameMap = {
  'UMP': 'ump.png',
  'VLU': 'vlu.png',
  'FTU2': 'ftu2.png',
  'HCMIU': 'hcmiu.png',
  'HUFI': 'hufi.png',
  'NTU': 'ntu.png',
  'QNU': 'qnu.png',
  'DUE': 'due.png',
  'HUCFL': 'hucfl.png',
  'HCMUT OISP': 'hcmutoisp.png'
};

const DOMAINS = {
  'UMP': 'ump.edu.vn',
  'VLU': 'vanlanguni.edu.vn',
  'FTU2': 'ftu.edu.vn',
  'HCMIU': 'hcmiu.edu.vn',
  'HUFI': 'huit.edu.vn',
  'NTU': 'ntu.edu.vn',
  'QNU': 'qnu.edu.vn',
  'DUE': 'due.udn.vn',
  'HUCFL': 'hucfl.hueuni.edu.vn',
  'HCMUT OISP': 'oisp.hcmut.edu.vn'
};

(async () => {
  const results = {};
  for (const short of Object.keys(filenameMap)) {
    const filename = filenameMap[short];
    const outPath = path.join(outDir, filename);
    let ok = false;
    let source = 'fail';

    // 1. Try known logo URLs first
    for (const u of KNOWN_LOGOS[short] || []) {
      try {
        const buf = await fetchUrl(u);
        if (buf.length > 500) {
          // Check it's a valid image (PNG/JPEG/SVG magic)
          const isPng = buf[0] === 0x89 && buf[1] === 0x50;
          const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
          const isWebp = buf.toString('utf8', 0, 4) === 'RIFF';
          const isSvg = buf.toString('utf8', 0, 200).includes('<svg') || buf.toString('utf8', 0, 100).includes('<?xml');
          if (isPng || isJpg || isWebp || isSvg) {
            fs.writeFileSync(outPath, buf);
            ok = true;
            source = u.includes('wikimedia') ? 'wiki' : (u.includes('facebook') ? 'fb' : 'direct');
            break;
          }
        }
      } catch (e) { /* continue */ }
    }

    // 2. Try DuckDuckGo favicon as last
    if (!ok) {
      try {
        const domain = DOMAINS[short];
        const u = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        const buf = await fetchUrl(u);
        if (buf.length > 500) {
          fs.writeFileSync(outPath, buf);
          ok = true;
          source = 'ddg';
        }
      } catch (e) {}
    }

    // 3. Try scraping homepage og:image
    if (!ok) {
      try {
        const domain = DOMAINS[short];
        const html = await fetchHtml(`https://${domain}/`);
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        if (ogMatch && ogMatch[1]) {
          const ogUrl = ogMatch[1].startsWith('http') ? ogMatch[1] : `https://${domain}${ogMatch[1].startsWith('/') ? '' : '/'}${ogMatch[1]}`;
          const buf = await fetchUrl(ogUrl);
          if (buf.length > 1000) {
            fs.writeFileSync(outPath, buf);
            ok = true;
            source = 'og:image';
          }
        }
      } catch (e) {}
    }

    results[short] = { ok, source };
    console.log(`${ok ? '✓' : '✗'} ${short.padEnd(14)} ${source}`);
  }

  console.log(`\nResult: ${Object.values(results).filter(r => r.ok).length}/${Object.keys(results).length}`);
})();