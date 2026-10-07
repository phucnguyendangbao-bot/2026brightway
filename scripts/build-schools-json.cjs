// build-schools-json.cjs
// Extract SCHOOLS array from page2.js -> assets/data/schools.json
// Augment with admissionUrl from docx file
const fs = require('fs');
const path = require('path');

const page2Path = path.join(__dirname, '..', 'assets', 'js', 'page2.js');
const outPath = path.join(__dirname, '..', 'assets', 'data', 'schools.json');
const docxLinksPath = path.join(__dirname, 'docx-utf8.txt');

const src = fs.readFileSync(page2Path, 'utf8');

// Find SCHOOLS array literal
const m = src.match(/const SCHOOLS = (\[[\s\S]*?\n\]);/);
if (!m) { console.error('Could not find SCHOOLS array'); process.exit(1); }
const SCHOOLS = eval(m[1]);

// Admission URL map từ file docx — key theo short code
const admissionMap = {
  // ===== MIỀN NAM (HCM) =====
  'UIT': 'https://tuyensinh.uit.edu.vn/',
  'FPTU': 'https://fpt.edu.vn/tuyen-sinh',
  'UEH': 'https://tuyensinh.ueh.edu.vn/',
  'VLU': 'https://tuyensinh.vanlanguni.edu.vn/',
  'PNTU': 'https://pts.pnt.edu.vn/',
  'CTUMP': 'https://tuyensinh.ctump.edu.vn/',
  'UMP': 'https://ump.edu.vn/tuyen-sinh-dao-tao/dai-hoc/tuyen-sinh',
  'USSH': 'https://hcmussh.edu.vn/tuyensinh',
  'RMIT': 'https://www.rmit.edu.vn/vi/hoc-tap-tai-rmit/chuong-trinh-cu-nhan',
  'HUB': 'https://tuyensinh.hub.edu.vn/',
  'HCMUE': 'https://tuyensinh.hcmue.edu.vn/',
  'HCMUS': 'https://tuyensinh.hcmus.edu.vn/',
  'TDTU': 'https://tuyensinh.tdtu.edu.vn/',
  'NTTU': 'https://tuyensinh.ntt.edu.vn/',

  // ===== AI / DATA =====
  'HCMUT': 'https://hcmut.edu.vn/tuyen-sinh-dh/dai-hoc-chinh-quy',
  'HCMUT OISP': 'https://oisp.hcmut.edu.vn/',
  'UIT AI': 'https://tuyensinh.uit.edu.vn/',
  'FPTU AI': 'https://fpt.edu.vn/tuyen-sinh',
  'HCMIU': 'https://tuyensinh.hcmiu.edu.vn/',
  'NLU': 'https://ts.hcmuaf.edu.vn/',
  'HUFI': 'https://ts.huit.edu.vn/dai-hoc',

  // ===== MIỀN TÂY =====
  'CTU': 'https://tuyensinh.ctu.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh.html',
  'DThU': 'https://tuyensinh.dthu.edu.vn/',

  // ===== MIỀN TRUNG =====
  'HuemedU': 'https://tuyensinh.huemed-univ.edu.vn/',
  'SMP-UDN': 'https://smp.udn.vn/tuyen-sinh',
  'DTU': 'https://tuyensinh.duytan.edu.vn/',
  'DUE': 'https://due.udn.vn/vi-vn/tuyen-sinh',
  'NTU': 'https://tuyensinh.ntu.edu.vn/',
  'DAU': 'https://tuyensinh.donga.edu.vn/',
  'DUT': 'https://dut.udn.vn/tuyen-sinh',
  'QNU': 'https://tuyensinh.qnu.edu.vn/',
  'HUSC': 'https://husc.hueuni.edu.vn/tuyen-sinh',
  'HUAF': 'https://huaf.edu.vn/tuyen-sinh',
  'HUCFL': 'https://hucfl.hueuni.edu.vn/tuyen-sinh',
  'PXU': 'https://phuxuan.edu.vn/tuyen-sinh',
  'VKU': 'https://vku.udn.vn/tuyen-sinh',

  // ===== MIỀN BẮC — bổ sung phổ biến =====
  'FTU2': 'https://tuyensinh.ftu.edu.vn/',
  'BK HN': 'https://ts.hust.edu.vn/',
  'NEU': 'https://tuyensinh.neu.edu.vn/',
  'HMU': 'https://tuyensinh.hmu.edu.vn/'
};

// Helper: tạo logo URL fallback chain — verified Wikimedia + Google Favicon
// (page2 sẽ tự fallback nếu ảnh lỗi)
const logoFallback = (short) => {
  // 1. local asset (downloaded)
  // 2. Wikimedia Commons verified thumb 330px
  // 3. Google Favicon API (works on most .edu.vn)
  // 4. SVG brand badge (handled in JS)
  return `assets/images/logos/${short.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`;
};

const result = SCHOOLS.map(s => {
  const admissionUrl = admissionMap[s.short] || '';
  return {
    id: s.id,
    name: s.name,
    short: s.short,
    city: s.city,
    logoUrl: logoFallback(s.short),
    logoFallback: s.logoFallback || '🏫',
    website: s.website || '',
    admissionUrl: admissionUrl,
    scholarships: s.scholarships
  };
});

fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`✓ Wrote ${result.length} schools to ${outPath}`);