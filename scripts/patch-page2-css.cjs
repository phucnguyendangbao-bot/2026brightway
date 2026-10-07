// patch-page2-css.cjs
const fs = require('fs');
const file = 'assets/css/page2.css';
let src = fs.readFileSync(file, 'utf8');

const oldBlock = `.school-name-link:hover {
  color: var(--accent);
  border-color: var(--accent);
}`;

const newBlock = `.school-name-link:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.school-admission-link {
  display: inline-flex; align-items: center; gap: 4px;
  margin-top: 6px;
  font-size: .78rem; font-weight: 600;
  color: #0369a1;
  background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(14,165,233,0.15));
  border: 1px solid rgba(14,165,233,0.28);
  border-radius: 999px;
  padding: 3px 10px;
  text-decoration: none;
  transition: all .2s;
}
.school-admission-link:hover {
  background: linear-gradient(135deg, rgba(56,189,248,0.18), rgba(14,165,233,0.25));
  border-color: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14,165,233,0.2);
}`;

if (!src.includes(oldBlock)) { console.error('Block not found'); process.exit(1); }
src = src.replace(oldBlock, newBlock);
fs.writeFileSync(file, src, 'utf8');
console.log('✓ Patched page2.css');