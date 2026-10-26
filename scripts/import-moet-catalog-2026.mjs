// Reproducible extraction from an HTML transcription of TT 74/2026, Appendix I/II.
// Review the generated data against the signed government PDF before changing admissions records.
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-moet-catalog-2026.mjs <saved-html-transcription>');
const html = fs.readFileSync(input, 'utf8');
const appendixI = html.indexOf('DANH MỤC NGÀNH ĐÀO TẠO CÁC TRÌNH ĐỘ');
const appendixII = html.indexOf('THỐNG KÊ CÁC NGÀNH ĐÃ ĐƯỢC SẮP XẾP', appendixI);
if (appendixI < 0 || appendixII < 0) throw new Error('Appendix headings not found');
const clean = value => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const rows = section => [...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  .map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map(cell => clean(cell[1])));
const catalog = rows(html.slice(appendixI, appendixII))
  .filter(row => /^(?:\d{2}|\d{4}|\d{6})$/.test(row[0]))
  .map(([code, name, effective = '', note = '']) => ({ code, name, effective, note }));
let listedGroupCode = '';
for (const entry of catalog) {
  if (entry.code.length === 4) listedGroupCode = entry.code;
  if (entry.code.length === 6 && entry.code.slice(0, 4) !== listedGroupCode)
    entry.listedGroupCode = listedGroupCode;
}
const transitions = rows(html.slice(appendixII))
  .filter(row => /^7\d{6}$/.test(row[0]) && /^\d{6}$/.test(row[2]))
  .map(([oldCode, oldName, newCode, newName, note = '', levels = '']) =>
    ({ oldCode, oldName, newCode, newName, note, levels }));
if (catalog.length !== 553 || new Set(catalog.map(entry => entry.code)).size !== 553 || transitions.length !== 120)
  throw new Error(`Unexpected extraction: ${catalog.length} catalog codes, ${transitions.length} transitions`);
const source = 'https://chinhphu.vn/?classid=1&docid=219455&pageid=27160&typegroupid=6';
const transcription = 'https://luatvietnam.vn/giao-duc/thong-tu-74-2026-tt-bgddt-danh-muc-nganh-dao-tao-trinh-do-giao-duc-dai-hoc-447389-d1.html';
const header = '// Extracted from an HTML transcription of the signed TT 74/2026 Appendix;\n'
  + '// preserve historical 2026 admissions codes and review disputed mappings against the original PDF.\n';
fs.writeFileSync(new URL('../assets/data/moet-undergraduate-catalog-2026.js', import.meta.url),
  `${header}export const MOET_UNDERGRADUATE_CATALOG_2026 = Object.freeze(${JSON.stringify({
    title: 'Danh mục ngành đào tạo — Thông tư 74/2026/TT-BGDĐT, Phụ lục I',
    source, transcription, effective: '2026-10-12', appliesToAdmissionsFrom: '2027-01-01',
    reviewedAt: '2026-10-26',
    note: 'Bản trích HTML cần đối chiếu từng dòng với PDF ký số. Không dùng danh mục này để tự đổi mã tuyển sinh 2026.',
    entries: catalog,
  }, null, 2)});\n`);
fs.writeFileSync(new URL('../assets/data/moet-catalog-transition-2026.js', import.meta.url),
  `${header}export const MOET_CATALOG_TRANSITIONS_2026 = Object.freeze(${JSON.stringify({
    title: 'Các dòng mã cũ → mới được liệt kê tại Phụ lục II, Thông tư 74/2026/TT-BGDĐT',
    source, transcription, reviewedAt: '2026-10-26', rows: transitions,
  }, null, 2)});\n`);
console.log(`Extracted ${catalog.length} catalog entries and ${transitions.length} undergraduate transition rows`);
