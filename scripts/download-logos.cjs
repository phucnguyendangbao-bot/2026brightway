// download-logos.cjs — Download logo thật cho từng trường về assets/images/logos/
// Strategy:
//   1. Wikimedia Commons verified 330px thumb (từ uni-logos.js verified list)
//   3. Google Favicon API (works for most .edu.vn)
//   4. Clearbit Logo API (fallback)
// Returns success/failure for each school. Fails open: missing files sẽ
// được JS-side fallback sang SVG brand badge (window.UNILogoSvg).

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dataPath = path.join(__dirname, '..', 'assets', 'data', 'schools.json');
const outDir = path.join(__dirname, '..', 'assets', 'images', 'logos');

const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Verified Wikimedia Commons 330px logos — copied từ assets/js/uni-logos.js
const WIKI_LOGOS = {
  'UIT':            'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Logo_UIT.svg/330px-Logo_UIT.svg.png',
  'FPTU':           'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Logo_FPT_Education.svg/280px-Logo_FPT_Education.svg.png',
  'UEH':            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/UEH_logo.svg/330px-UEH_logo.svg.png',
  'VLU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_Van_Lang.svg/330px-Logo_Van_Lang.svg.png',
  'PNTU':           'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_PNT.svg/330px-Logo_PNT.svg.png',
  'CTUMP':          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Logo_CTUMP.svg/330px-Logo_CTUMP.svg.png',
  'UMP':            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Logo_UMP.svg/330px-Logo_UMP.svg.png',
  'USSH':           'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Logo_USSH.svg/330px-Logo_USSH.svg.png',
  'HUB':            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Logo_HUB.svg/330px-Logo_HUB.svg.png',
  'HCMUE':          'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Logo_HCMUE.svg/330px-Logo_HCMUE.svg.png',
  'HCMUS':          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Logo_HCMUS.svg/330px-Logo_HCMUS.svg.png',
  'TDTU':           'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Logo_TDTU.svg/330px-Logo_TDTU.svg.png',
  'NTTU':           'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_NTTU.svg/330px-Logo_NTTU.svg.png',
  'HCMUT':          'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Logo_HCMUT.svg/330px-Logo_HCMUT.svg.png',
  'HCMUT OISP':     'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Logo_HCMUT.svg/330px-Logo_HCMUT.svg.png',
  'HCMIU':          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Logo_HCMIU.svg/330px-Logo_HCMIU.svg.png',
  'NLU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Logo_NLU.svg/330px-Logo_NLU.svg.png',
  'HUFI':            'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Logo_HUFI.svg/330px-Logo_HUFI.svg.png',
  'CTU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Logo_CTU.svg/330px-Logo_CTU.svg.png',
  'DThU':           'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Logo_DThU.svg/330px-Logo_DThU.svg.png',
  'HuemedU':        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Logo_HUEMED.svg/330px-Logo_HUEMED.svg.png',
  'SMP-UDN':        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Logo_SMP-UDN.svg/330px-Logo_SMP-UDN.svg.png',
  'DTU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Logo_DTU.svg/330px-Logo_DTU.svg.png',
  'DUE':            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Logo_DUE.svg/330px-Logo_DUE.svg.png',
  'NTU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Logo_NTU.svg/330px-Logo_NTU.svg.png',
  'DAU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Logo_DAU.svg/330px-Logo_DAU.svg.png',
  'DUT':            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Logo_DUT.svg/330px-Logo_DUT.svg.png',
  'QNU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_QNU.svg/330px-Logo_QNU.svg.png',
  'HUSC':           'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Logo_HUSC.svg/330px-Logo_HUSC.svg.png',
  'HUAF':           'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Logo_HUAF.svg/330px-Logo_HUAF.svg.png',
  'HUCFL':          'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Logo_HUCFL.svg/330px-Logo_HUCFL.svg.png',
  'PXU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Logo_PXU.svg/330px-Logo_PXU.svg.png',
  'VKU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Logo_VKU.svg/330px-Logo_VKU.svg.png',
  'FTU2':           'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Logo_FTU.svg/330px-Logo_FTU.svg.png',
  'BK HN':          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_HUST.svg/330px-Logo_HUST.svg.png',
  'NEU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Logo_NEU.svg/330px-Logo_NEU.svg.png',
  'HMU':            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Logo_HMU.svg/330px-Logo_HMU.svg.png',
  'RMIT':           'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/RMIT_University_Logo.svg/330px-RMIT_University_Logo.svg.png',
  'UIT AI':         'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Logo_UIT.svg/330px-Logo_UIT.svg.png',
  'FPTU AI':        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Logo_FPT_Education.svg/280px-Logo_FPT_Education.svg.png'
};

// Mapping từ short -> domain cho Google Favicon (clearbit/favicon)
const FAVICON_DOMAINS = {
  'UIT': 'uit.edu.vn',
  'FPTU': 'daihoc.fpt.edu.vn',
  'UEH': 'ueh.edu.vn',
  'VLU': 'vanlanguni.edu.vn',
  'PNTU': 'pnt.edu.vn',
  'CTUMP': 'ctump.edu.vn',
  'UMP': 'ump.edu.vn',
  'USSH': 'hcmussh.edu.vn',
  'HUB': 'hub.edu.vn',
  'HCMUE': 'hcmue.edu.vn',
  'HCMUS': 'hcmus.edu.vn',
  'TDTU': 'tdtu.edu.vn',
  'NTTU': 'ntt.edu.vn',
  'HCMUT': 'hcmut.edu.vn',
  'HCMUT OISP': 'oisp.hcmut.edu.vn',
  'HCMIU': 'hcmiu.edu.vn',
  'NLU': 'hcmuaf.edu.vn',
  'HUFI': 'huit.edu.vn',
  'CTU': 'ctu.edu.vn',
  'DThU': 'dthu.edu.vn',
  'HuemedU': 'huemed-univ.edu.vn',
  'SMP-UDN': 'smp.udn.vn',
  'DTU': 'duytan.edu.vn',
  'DUE': 'due.udn.vn',
  'NTU': 'ntu.edu.vn',
  'DAU': 'donga.edu.vn',
  'DUT': 'dut.udn.vn',
  'QNU': 'qnu.edu.vn',
  'HUSC': 'husc.hueuni.edu.vn',
  'HUAF': 'huaf.edu.vn',
  'HUCFL': 'hucfl.hueuni.edu.vn',
  'PXU': 'phuxuan.edu.vn',
  'VKU': 'vku.udn.vn',
  'FTU2': 'ftu.edu.vn',
  'BK HN': 'hust.edu.vn',
  'NEU': 'neu.edu.vn',
  'HMU': 'hmu.edu.vn',
  'RMIT': 'rmit.edu.vn',
  'UIT AI': 'uit.edu.vn',
  'FPTU AI': 'daihoc.fpt.edu.vn'
};

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 BrightwayCareers/1.0',
        'Accept': 'image/png,image/jpeg,image/webp,image/svg+xml,image/*,*/*'
      },
      timeout: TIMEOUT_MS
    }, (res) => {
      // Handle redirects
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

function downloadOne(short, filename) {
  // Try Wikimedia first (verified, public-domain), then Favicon, then Clearbit
  const candidates = [];
  if (WIKI_LOGOS[short]) candidates.push({ url: WIKI_LOGOS[short], source: 'wiki' });
  const domain = FAVICON_DOMAINS[short];
  if (domain) {
    candidates.push({ url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, source: 'gfav' });
    candidates.push({ url: `https://logo.clearbit.com/${domain}?size=200`, source: 'clearbit' });
  }
  return (async () => {
    for (const c of candidates) {
      try {
        const buf = await fetchUrl(c.url);
        if (buf.length < 200) continue; // too small / placeholder
        fs.writeFileSync(path.join(outDir, filename), buf);
        return { ok: true, source: c.source, size: buf.length };
      } catch (e) {
        // continue
      }
    }
    return { ok: false };
  })();
}

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  // Parallel download with concurrency limit
  const concurrency = 6;
  let cursor = 0;
  async function worker() {
    while (cursor < schools.length) {
      const i = cursor++;
      const s = schools[i];
      const filename = s.logoUrl.split('/').pop();
      if (fs.existsSync(path.join(outDir, filename)) && fs.statSync(path.join(outDir, filename)).size > 1000) {
        results.push({ short: s.short, ok: true, source: 'cached' });
        continue;
      }
      const r = await downloadOne(s.short, filename);
      results.push({ short: s.short, ok: r.ok, source: r.source });
      process.stdout.write(`${r.ok ? '✓' : '✗'} ${s.short.padEnd(12)} ${r.source || 'fail'}\n`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  console.log(`\nDone: ${results.filter(r => r.ok).length}/${schools.length} success`);
  fs.writeFileSync(path.join(__dirname, 'logo-download-results.json'), JSON.stringify(results, null, 2));
})();