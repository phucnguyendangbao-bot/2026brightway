// merge-uit-hcmut.cjs — Gộp UIT + UIT AI, HCMUT + HCMUT OISP thành variant
const fs = require('fs');
const path = require('path');
const file = path.resolve('assets/data/schools.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Gộp UIT: tìm 'uit' và 'uit-ai', merge vào 'uit'
const uitMain = data.find(s => s.id === 'uit');
const uitAi = data.find(s => s.id === 'uit-ai');
if (uitMain && uitAi) {
  uitMain.variants = [
    {
      id: 'uit-ai',
      label: 'UIT AI / Chương trình AI & Data',
      name: uitAi.name,
      website: uitAi.website,
      admissionUrl: uitAi.admissionUrl,
      scholarships: uitAi.scholarships
    }
  ];
  console.log('✓ Gộp UIT + UIT AI → variants[]');
}

// 2. Gộp HCMUT: tìm 'hcmut-oisp' (main) và 'hcmut-ai' (variant)
// Lưu ý: 'hcmut-oisp' nói về OISP, 'hcmut-ai' nói về AI/Robotics
// Cả 2 đều là variant của HCMUT, nên gộp thành main 'hcmut' với 2 variants
const hcmutOisp = data.find(s => s.id === 'hcmut-oisp');
const hcmutAi = data.find(s => s.id === 'hcmut-ai');
if (hcmutOisp && hcmutAi) {
  // Convert hcmut-oisp → hcmut (main) với 2 variants
  hcmutOisp.id = 'hcmut';
  hcmutOisp.name = 'Đại học Bách khoa – ĐHQG TP.HCM';
  hcmutOisp.short = 'HCMUT';
  hcmutOisp.website = 'https://hcmut.edu.vn/hoc-bong';
  hcmutOisp.admissionUrl = 'https://hcmut.edu.vn/tuyen-sinh-dh/dai-hoc-chinh-quy';
  hcmutOisp.variants = [
    {
      id: 'hcmut-oisp',
      label: 'Chương trình OISP / Tiên tiến',
      name: 'Đại học Bách khoa – ĐHQG TP.HCM (OISP)',
      website: 'https://oisp.hcmut.edu.vn/scholarships',
      admissionUrl: 'https://oisp.hcmut.edu.vn/',
      scholarships: hcmutOisp.scholarships
    },
    {
      id: 'hcmut-ai',
      label: 'Chương trình AI / Robotics',
      name: hcmutAi.name,
      website: hcmutAi.website,
      admissionUrl: hcmutAi.admissionUrl,
      scholarships: hcmutAi.scholarships
    }
  ];
  console.log('✓ Gộp HCMUT OISP + HCMUT AI → main "hcmut" với 2 variants[]');
}

// Xóa các entry variant (đã được gộp vào main)
const filtered = data.filter(s => s.id !== 'uit-ai' && s.id !== 'hcmut-ai');
const removed = data.length - filtered.length;
console.log(`✓ Xóa ${removed} entry variant đã gộp`);

fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf8');
console.log(`✓ Saved. Total schools: ${filtered.length}`);