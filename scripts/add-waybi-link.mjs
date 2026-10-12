import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'e:/PROJECT 2026/AIYOUNGGURU-main';
const WAYBI_LINK = `      <a href="waybi.html" style="display:inline-flex;align-items:center;gap:4px;font-weight:800;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;">🤖 Waybi</a>`;

const files = fs.readdirSync(ROOT).filter(f =>
  f.endsWith('.html') &&
  !f.match(/^(login|waybi|_home|_replace)/)
);

let count = 0;
for (const file of files) {
  const fp = path.join(ROOT, file);
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('href="waybi.html"')) {
    console.log('— skip', file);
    continue;
  }
  if (content.includes('<div class="lp-nav-links">')) {
    content = content.replace(
      /(<div class="lp-nav-links">)/,
      '$1\n' + WAYBI_LINK
    );
    fs.writeFileSync(fp, content, 'utf8');
    count++;
    console.log('✓', file);
  } else {
    console.log('— no lp-nav-links:', file);
  }
}
console.log('Total updated:', count);
