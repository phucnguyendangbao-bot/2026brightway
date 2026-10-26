// Classification only. School admission rows remain the source of truth for codes,
// campuses, tracks, combinations, scores, quotas and calculation identifiers.
import { MOET_UNDERGRADUATE_CATALOG } from '../data/moet-undergraduate-catalog-2022.js';

const catalog = new Map(MOET_UNDERGRADUATE_CATALOG.entries.map(entry => [entry.code, entry]));
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

export function catalogEntry(code) { return catalog.get(String(code || '')) || null; }

export function classifyProgram(program = {}) {
  const rawCode = String(program.code ?? '').trim();
  const baseCode = /^7\d{6}/.exec(rawCode)?.[0] || '';
  const major = catalogEntry(baseCode);
  const field = major && catalogEntry(baseCode.slice(0, 3));
  const group = major && catalogEntry(baseCode.slice(0, 5));
  const official = Boolean(major && field && group);
  const sameName = official && textKey(program.name) === textKey(major.name);
  const resemblesName = official && textKey(program.name).includes(textKey(major.name));
  const status = !rawCode ? 'missing-code'
    : !official ? 'unknown-code'
      : major.note?.startsWith('Chuyển đến') ? 'legacy-code'
        : rawCode !== baseCode ? 'school-specific-code'
          : sameName ? 'catalog-match' : 'name-differs';
  return {
    fieldCode: official ? field.code : '', fieldName: official ? field.name : 'Chưa xác minh lĩnh vực',
    groupCode: official ? group.code : '', groupName: official ? group.name : 'Chưa xác minh nhóm ngành',
    majorCode: official ? major.code : '', majorName: official ? major.name : 'Chưa xác minh ngành chuẩn',
    admissionCode: rawCode, status, sameName, resemblesName,
    needsVerification: status !== 'catalog-match',
  };
}

export function sortedPrograms(programs = [], mode = 'code') {
  return programs.map((program, index) => ({ program, index, taxonomy: classifyProgram(program) }))
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

export function searchScore(program, query) {
  const raw = textKey(query);
  if (!raw) return 1;
  const term = raw.replace(/^(nganh|chuong trinh)\s+/, '');
  const q = aliases[term] || term;
  const classification = classifyProgram(program);
  const name = textKey(program.name);
  const officialName = classification.majorCode ? textKey(classification.majorName) : '';
  const code = textKey(program.code);
  const haystack = [name, officialName, code, textKey(program.track), textKey(program.campus)].join(' ');
  if (code && code === raw) return 120;
  if (name === q) return 110;
  if (officialName === q) return 100;
  if (name.startsWith(q) || officialName.startsWith(q)) return 90;
  if (name.includes(q)) return 75;
  if (officialName.includes(q)) return 65;
  if (haystack.includes(q)) return 55;
  const words = haystack.split(/\s+/);
  return q.split(' ').every(token => words.some(word => word.startsWith(token))) ? 30 : 0;
}

export const TAXONOMY_SOURCE = MOET_UNDERGRADUATE_CATALOG.source;
