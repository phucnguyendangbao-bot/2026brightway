import { canonicalSchoolId } from '../data/university-identities.js';

export const textKey = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
export function uniqueSchools(rows = []) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).filter(row => row && typeof row.id === 'string').map(row => ({ ...row, id: canonicalSchoolId(row.id) })).filter(row => {
    if (seen.has(row.id)) return false;
    seen.add(row.id); return true;
  });
}
export function importLegacySchools(current, codes, catalog, imported = []) {
  const handled = new Set(Array.isArray(imported) ? imported : []);
  const additions = [];
  for (const code of Array.isArray(codes) ? codes : []) {
    if (typeof code !== 'string' || handled.has(code)) continue;
    const key = textKey(code);
    const alias = {fpt2:'fpt',tdt:'tdtu',buh:'hub'}[key] || canonicalSchoolId(key);
    const school = catalog.find(item => item.id === alias || textKey(item.short) === key);
    if (school) { additions.push({id:school.id,name:school.name,city:school.city}); handled.add(code); }
  }
  return { savedSchools:uniqueSchools([...current, ...additions]), importedSchoolCodes:[...handled] };
}
export function wishKey(item) {
  return JSON.stringify([canonicalSchoolId(item.schoolId), textKey(item.programCode), textKey(item.programName), textKey(item.track), textKey(item.campus), Number(item.year)]);
}
export function normalizeWishes(rows = []) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).filter(item => item && typeof item.schoolId === 'string' && typeof item.schoolName === 'string' && typeof item.programName === 'string' && item.programName.trim() && Number.isInteger(item.year) && Number.isInteger(item.sourceYear) && /^https:\/\//i.test(item.source || '')).map(item => ({ ...item, schoolId: canonicalSchoolId(item.schoolId), id: wishKey(item) })).filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id); return true;
  });
}
export function addWish(rows, item) {
  return normalizeWishes([...normalizeWishes(rows), item]);
}
export function moveWish(rows, id, direction) {
  const list = normalizeWishes(rows);
  const from = list.findIndex(item => item.id === id);
  const to = from + direction;
  if (from < 0 || ![-1, 1].includes(direction) || to < 0 || to >= list.length) return list;
  [list[from], list[to]] = [list[to], list[from]];
  return list;
}
export function wishText(rows) {
  return ['NGUYỆN VỌNG DỰ KIẾN — BRIGHTWAY', 'Danh sách cá nhân, chưa đăng ký nguyện vọng chính thức.', ...normalizeWishes(rows).map((item, index) => `${index + 1}. ${item.schoolName} — ${item.programName}${item.programCode ? ` (${item.programCode})` : ''}${item.track ? ` · ${item.track}` : ''}\nNăm dự kiến: ${item.year} · Nguồn tuyển sinh: ${item.sourceYear}\n${item.source}`)].join('\n\n');
}

// Quote every field and prevent a saved text value from becoming a spreadsheet
// formula. Numeric metadata and source URLs retain their own columns.
export function wishCsv(rows) {
  const field = value => {
    const text = String(value ?? '');
    return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
  };
  const header = ['Ưu tiên','Trường đại học','Ngành / chương trình','Mã ngành','Phân loại','Cơ sở','Năm dự kiến','Năm nguồn','Nguồn','Lưu ý'];
  const records = normalizeWishes(rows).map((item,index) => [index+1,item.schoolName,item.programName,item.programCode || '',item.track || '',item.campus || '',item.year,item.sourceYear,item.source,'Danh sách dự kiến, chưa đăng ký nguyện vọng chính thức.' + (item.year !== item.sourceYear ? ` Nguồn ${item.sourceYear} tham khảo; chưa xác nhận mở tuyển ${item.year}.` : '')]);
  return '\uFEFF' + [header,...records].map(row => row.map(field).join(',')).join('\r\n') + '\r\n';
}

// A choice can only originate from the existing annual official program catalog.
export function wishFromProgram(school, details, index, year) {
  const program = details?.programs?.[index];
  if (!school?.id || !program?.name || details.programSourceStatus || !Number.isInteger(details.year) || !/^https:\/\//i.test(details.programSource || '') || ![2026, 2027].includes(Number(year))) return null;
  return { schoolId: canonicalSchoolId(school.id), schoolName: school.name, programName: program.name, programCode: program.code || '', track: program.track || '', campus: program.campus || '', year: Number(year), sourceYear: details.year, source: details.programSource };
}
