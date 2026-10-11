import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'e:/PROJECT 2026/AIYOUNGGURU-main';

const FOOTER_SVG = `<div class="emoji"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><defs><linearGradient id="ftLg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6b8eff"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs><path d="M32 6 C 18 6, 8 18, 8 32 C 8 46, 18 56, 32 56 C 46 56, 56 46, 56 32 C 56 18, 46 6, 32 6 Z" fill="url(#ftLg)"/><circle cx="24" cy="30" r="3" fill="#fff"/><circle cx="40" cy="30" r="3" fill="#fff"/><path d="M27 40 Q 32 44 37 40" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="20" y="14" width="24" height="3" fill="#1a1a3e"/><rect x="22" y="12" width="20" height="3" fill="#1a1a3e" rx="1"/></svg></div>`;

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !f.match(/^(login|_home|_replace)/));
let count = 0;
for (const file of files) {
  const fp = path.join(ROOT, file);
  let content = fs.readFileSync(fp, 'utf8');
  const re = /<div class="emoji">🎓<\/div>/g;
  if (re.test(content)) {
    content = content.replace(re, FOOTER_SVG);
    fs.writeFileSync(fp, content, 'utf8');
    count++;
    console.log('✓', file);
  }
}
console.log(`Total: ${count} files`);
