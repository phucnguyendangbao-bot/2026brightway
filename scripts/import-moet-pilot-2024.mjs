// Reproduce the undergraduate pilot catalog from the government publication of QD 1596/2024.
// Keep this supplement separate from both the 2022 and 2027 baseline catalogs.
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-moet-pilot-2024.mjs <saved-government-html>');
const html = fs.readFileSync(input, 'utf8');
const start = html.indexOf('Phần I:');
const end = html.indexOf('Phần II:', start);
if (start < 0 || end < 0) throw new Error('Undergraduate pilot appendix not found');
const clean = value => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const entries = [...html.slice(start, end).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  .map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => clean(cell[1])))
  .filter(row => /^7\d{2}(?:\d{2}){0,2}$/.test(row[0]))
  .map(([code, name, effective = '', note = '']) => ({ code, name, effective, note }));
const codes = new Set(entries.map(entry => entry.code));
if (entries.length !== 82 || codes.size !== 82 || entries.filter(entry => entry.code.length === 7).length !== 40)
  throw new Error(`Unexpected pilot extraction: ${entries.length} entries, ${codes.size} unique codes`);
for (const entry of entries.filter(entry => entry.code.length === 7)) {
  if (!codes.has(entry.code.slice(0, 3)) || !codes.has(entry.code.slice(0, 5)))
    throw new Error(`Missing pilot hierarchy for ${entry.code}`);
}
const source = 'https://xaydungchinhsach.chinhphu.vn/dao-tao-thi-diem-trinh-do-dai-hoc-nganh-ky-thuat-robot-chi-huy-tham-muu-tac-chien-khong-gian-mang-119240610094542482.htm';
fs.writeFileSync(new URL('../assets/data/moet-undergraduate-pilot-2024.js', import.meta.url),
  `// Undergraduate pilot appendix of QD 1596/2024; separate from school admissions.\nexport const MOET_UNDERGRADUATE_PILOT_2024 = Object.freeze(${JSON.stringify({
    title: 'Danh mục ngành đào tạo thí điểm trình độ đại học — Quyết định 1596/QĐ-BGDĐT',
    source, effective: '2024-06-07', reviewedAt: '2026-10-26', entries,
  }, null, 2)});\n`);
console.log(`Extracted ${entries.length} pilot hierarchy entries, including 40 major codes`);
