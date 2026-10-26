// Classification only. School admission rows remain the source of truth for codes,
// campuses, tracks, combinations, scores, quotas and calculation identifiers.
import { MOET_UNDERGRADUATE_CATALOG } from '../data/moet-undergraduate-catalog-2022.js';
import { MOET_UNDERGRADUATE_PILOT_2024 } from '../data/moet-undergraduate-pilot-2024.js';
import { MOET_UNDERGRADUATE_CATALOG_2026 } from '../data/moet-undergraduate-catalog-2026.js';
import { MOET_CATALOG_TRANSITIONS_2026 } from '../data/moet-catalog-transition-2026.js';

const pilotCodes = new Set(MOET_UNDERGRADUATE_PILOT_2024.entries.filter(entry => entry.code.length === 7)
  .map(entry => entry.code));
const catalog2026 = Object.freeze({
  ...MOET_UNDERGRADUATE_CATALOG,
  title: `${MOET_UNDERGRADUATE_CATALOG.title}; bổ sung ngành thí điểm theo Quyết định 1596/QĐ-BGDĐT`,
  supplementarySource: MOET_UNDERGRADUATE_PILOT_2024.source,
  entries: [...new Map([...MOET_UNDERGRADUATE_CATALOG.entries,...MOET_UNDERGRADUATE_PILOT_2024.entries]
    .map(entry => [entry.code, entry])).values()],
});
const catalogs = new Map([
  [2026, new Map(catalog2026.entries.map(entry => [entry.code, entry]))],
  [2027, new Map(MOET_UNDERGRADUATE_CATALOG_2026.entries.map(entry => [entry.code, entry]))],
]);
const transitions = new Map();
for (const row of MOET_CATALOG_TRANSITIONS_2026.rows) {
  if (!transitions.has(row.oldCode)) transitions.set(row.oldCode, []);
  transitions.get(row.oldCode).push(row);
}
const aliases = Object.freeze({
  cntt: 'cong nghe thong tin', it: 'cong nghe thong tin',
  ai: 'tri tue nhan tao', 'artificial intelligence': 'tri tue nhan tao',
  tmdt: 'thuong mai dien tu', ecommerce: 'thuong mai dien tu',
  qtkd: 'quan tri kinh doanh', ktpm: 'ky thuat phan mem',
  'software engineering': 'ky thuat phan mem',
  attt: 'an toan thong tin', 'data science': 'khoa hoc du lieu',
  logistics: 'logistics',
  marketing: 'marketing', duoc: 'duoc hoc',
});

export function textKey(value) {
  return String(value ?? '').toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export const catalogVersionForYear = year => Number(year) >= 2027
  ? MOET_UNDERGRADUATE_CATALOG_2026 : catalog2026;

export function catalogEntry(code, year = 2026) {
  return catalogs.get(Number(year) >= 2027 ? 2027 : 2026).get(String(code || '')) || null;
}

// Appendix II is not one-to-one. Return every printed mapping; never silently
// choose a target for a code such as 7810104 that has two destinations.
export function transitionForCode(oldCode) {
  const matches = transitions.get(String(oldCode || '').trim()) || [];
  return { status: !matches.length ? 'not-listed' : matches.length === 1 ? 'explicit' : 'ambiguous',
    matches: matches.map(row => ({ ...row })) };
}

export function classifyProgram(program = {}, year = 2026) {
  const rawCode = String(program.code ?? '').trim();
  const isNewCatalog = Number(year) >= 2027;
  const baseCode = (isNewCatalog ? /^\d{6}/ : /^7\d{6}/).exec(rawCode)?.[0] || '';
  const major = catalogEntry(baseCode, year);
  const field = major && catalogEntry(baseCode.slice(0, isNewCatalog ? 2 : 3), year);
  const group = major && catalogEntry(baseCode.slice(0, isNewCatalog ? 4 : 5), year);
  const official = Boolean(major && field && group);
  const sameName = official && textKey(program.name) === textKey(major.name);
  const resemblesName = official && textKey(program.name).includes(textKey(major.name));
  const status = !rawCode ? 'missing-code'
    : !official ? 'unknown-code'
      : major.listedGroupCode && major.listedGroupCode !== group.code ? 'catalog-group-conflict'
      : major.note?.startsWith('Chuyển đến') ? 'legacy-code'
        : rawCode !== baseCode ? 'school-specific-code'
          : sameName ? 'catalog-match' : 'name-differs';
  return {
    fieldCode: official ? field.code : '', fieldName: official ? field.name : 'Chưa xác minh lĩnh vực',
    groupCode: official ? group.code : '', groupName: official ? group.name : 'Chưa xác minh nhóm ngành',
    majorCode: official ? major.code : '', majorName: official ? major.name : 'Chưa xác minh ngành chuẩn',
    admissionCode: rawCode, catalogYear: isNewCatalog ? 2027 : 2026,
    catalogSource: !isNewCatalog && pilotCodes.has(baseCode)
      ? MOET_UNDERGRADUATE_PILOT_2024.source : catalogVersionForYear(year).source,
    catalogDocument: !isNewCatalog && pilotCodes.has(baseCode) ? 'pilot-2024'
      : isNewCatalog ? 'catalog-2027' : 'catalog-2022',
    listedGroupCode: major?.listedGroupCode || '', status, sameName, resemblesName,
    needsVerification: status !== 'catalog-match',
  };
}

export function sortedPrograms(programs = [], mode = 'code', year = 2026) {
  return programs.map((program, index) => ({ program, index, taxonomy: classifyProgram(program, year) }))
    .sort((a, b) => {
      const x = a.taxonomy, y = b.taxonomy;
      const hierarchy = (x.fieldCode || '999').localeCompare(y.fieldCode || '999')
        || (x.groupCode || '99999').localeCompare(y.groupCode || '99999');
      if (hierarchy) return hierarchy;
      const name = textKey(a.program.name).localeCompare(textKey(b.program.name), 'vi');
      const code = (x.majorCode || '9999999').localeCompare(y.majorCode || '9999999')
        || x.admissionCode.localeCompare(y.admissionCode, 'vi', { numeric: true });
      return (mode === 'az' ? name || code : code || name)
        || textKey(a.program.track).localeCompare(textKey(b.program.track), 'vi')
        || textKey(a.program.campus).localeCompare(textKey(b.program.campus), 'vi')
        || a.index - b.index;
    });
}

export function searchScore(program, query, year = 2026) {
  const raw = textKey(query);
  if (!raw) return 1;
  const term = raw.replace(/^(nganh|chuong trinh)\s+/, '');
  const alias = aliases[term];
  const q = alias || term;
  const classification = classifyProgram(program, year);
  const name = textKey(program.name);
  const officialName = classification.majorCode ? textKey(classification.majorName) : '';
  const code = textKey(program.code);
  const haystack = [name, officialName, code, textKey(program.track), textKey(program.campus)].join(' ');
  if (!alias && name === q) return 130;
  if (code && code === raw) return 120;
  if (!alias && officialName === q) return 110;
  if (name === q) return 100;
  if (officialName === q) return 95;
  if (name.startsWith(q) || officialName.startsWith(q)) return alias ? 78 : 90;
  if (name.includes(q)) return alias ? 68 : 75;
  if (officialName.includes(q)) return alias ? 58 : 65;
  if (haystack.includes(q)) return alias ? 48 : 55;
  const words = haystack.split(/\s+/);
  return q.split(' ').every(token => words.some(word => word.startsWith(token))) ? 30 : 0;
}

export function schoolSearchScore(school, query) {
  const q = textKey(query);
  if (!q) return 1;
  const name = textKey(school.name);
  const short = textKey(school.short);
  const id = textKey(school.id);
  const aliases = (school.aliases || []).map(textKey);
  if (name === q) return 130;
  if (short === q || id === q || aliases.includes(q)) return 110;
  if (name.startsWith(q)) return 90;
  if (name.includes(q)) return 80;
  if ([short,id,...aliases].some(value => value.startsWith(q))) return 70;
  if ([short,id,...aliases].some(value => value.includes(q))) return 60;
  const words = [name,short,id,...aliases].join(' ').split(' ');
  return q.split(' ').every(token => words.some(word => word.startsWith(token))) ? 40 : 0;
}

export const TAXONOMY_SOURCE = MOET_UNDERGRADUATE_CATALOG.source;
