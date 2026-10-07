// patch-uni-logos.cjs — thay FTU entry + thêm OISP entry
const fs = require('fs');
const path = require('path');

// Resolve relative to CWD (which is project root when invoked via npm/script)
const file = path.resolve('assets', 'js', 'uni-logos.js');

let src = fs.readFileSync(file, 'utf8');

const ftuRe = /'FTU': \{[\s\S]*?\n  \},/;
const m = src.match(ftuRe);
if (!m) { console.error('FTU block not found'); process.exit(1); }
console.log('Found FTU block, length=', m[0].length);

const replacement = `'FTU': {
    name: 'ĐH Ngoại thương',
    short: 'FTU',
    aliases: ['ĐH Ngoại thương – Cơ sở II TP.HCM', 'Ngoại thương', 'FTU2'],
    // Verified from 'File:FTU_logo_2020.png' on vi.wikipedia
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/FTU_logo_2020.png/330px-FTU_logo_2020.png',
    logoAlt: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/FTU_logo_2020.png',
    fallback: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&h=120&fit=crop'
  },
  // OISP = chương trình quốc tế của HCMUT, dùng chung brand
  'OISP': {
    name: 'Chương trình OISP – ĐH Bách khoa ĐHQG TP.HCM',
    short: 'HCMUT OISP',
    aliases: ['OISP', 'HCMUT OISP', 'ĐH Bách khoa – ĐHQG TP.HCM (OISP)'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HCMUT_official_logo.png/330px-HCMUT_official_logo.png',
    logoAlt: 'https://upload.wikimedia.org/wikipedia/commons/d/de/HCMUT_official_logo.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
`;

src = src.replace(ftuRe, replacement);
fs.writeFileSync(file, src, 'utf8');
console.log('✓ Patched FTU + added OISP');