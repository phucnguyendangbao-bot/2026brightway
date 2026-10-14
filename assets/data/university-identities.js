// Identity review only, not verification of admission programs or scholarship data.
export const REVIEWED_AT = '2026-10-15';
export const ALIASES = { 'fpt-ai': 'fpt', 'khtn-hcm': 'hcmus' };
const UNIT_ALIASES = { 'hcmut-oisp':'hcmut', 'hcmut-ai':'hcmut', 'uit-ai':'uit' };
export const canonicalSchoolId = id => ALIASES[id] || UNIT_ALIASES[id] || id;
const definitions = [
  ['hcmut','https://hcmut.edu.vn/'], ['uit','https://www.uit.edu.vn/'],
  ['fpt','https://daihoc.fpt.edu.vn/'], ['ueh','https://www.ueh.edu.vn/'],
  ['ftu','https://www.ftu.edu.vn/'], ['vlu','https://www.vlu.edu.vn/'],
  ['pnt','https://pnt.edu.vn/'], ['ctump','https://ctump.edu.vn/','needs_review'],
  ['ump','https://ump.edu.vn/','needs_review'], ['ussh','https://hcmussh.edu.vn/'],
  ['rmit','https://www.rmit.edu.vn/'], ['hub','https://hub.edu.vn/'],
  ['hcmue','https://hcmue.edu.vn/'], ['ctu','https://www.ctu.edu.vn/'],
  ['dthu','https://dthu.edu.vn/'], ['hcmus','https://hcmus.edu.vn/'],
  ['tdtu','https://tdtu.edu.vn/','needs_review'], ['nttu','https://ntt.edu.vn/'],
  ['hcmiu','https://hcmiu.edu.vn/','needs_review'], ['nlu','https://nlu.edu.vn/'],
  ['hufi','https://huit.edu.vn/tin-tuc/quyet-dinh-doi-ten-truong-dh-cong-nghiep-thuc-pham-tp-hcm-thanh-truong-dh-cong-thuong-tp-hcm'],
  ['huemed','https://humed.hueuni.edu.vn/ve-nha-truong'], ['smp-udn','https://smp.udn.vn/'],
  ['duytan','https://duytan.edu.vn/'], ['due','https://due.udn.vn/'],
  ['ntu','https://ntu.edu.vn/'], ['donga','https://donga.edu.vn/','needs_review'],
  ['dut','https://dut.udn.vn/','needs_review'], ['qnu','https://qnu.edu.vn/'],
  ['husc','https://husc.hueuni.edu.vn/','needs_review'], ['huaf','https://huaf.edu.vn/'],
  ['phuxuan','https://pxu.edu.vn/'], ['vku','https://vku.udn.vn/','needs_review'],
  ['dnu','https://www.udn.vn/'], ['hue-uni','https://hueuni.edu.vn/portal/vi/'],
  ['sgu','https://sgu.edu.vn/'], ['uel','https://www.uel.edu.vn/','needs_review'],
];
export const identities = Object.fromEntries(definitions.map(([id, source_url, status = 'identity_source_opened']) => [id, {
  id, source_url, status, updated_at: REVIEWED_AT,
  entity_kind: ['dnu','hue-uni'].includes(id) ? 'university_system' : 'university',
}]));
Object.assign(identities.ftu, { name: 'Trường Đại học Ngoại thương', represented_unit: 'Phân hiệu tại TP.HCM; không đếm là một trường độc lập.' });
Object.assign(identities.hufi, { name: 'Trường Đại học Công Thương TP.HCM', short: 'HUIT' });
Object.assign(identities['smp-udn'], { name: 'Trường Y Dược – Đại học Đà Nẵng' });
identities.hucfl = {
  id:'hucfl', entity_kind:'unresolved', status:'identity_conflict', updated_at:REVIEWED_AT,
  source_url:'https://sinhvien.hueuni.edu.vn/',
  note:'Tên KHXH & NV – Đại học Huế không khớp đơn vị ở nguồn đang có; đường dẫn gốc lại trỏ tới Đại học Khoa học. Chưa đếm là một trường độc lập, không tự gán sang Đại học Ngoại ngữ.',
};

export function buildUniversityCatalog(raw, registry = []) {
  if (!Array.isArray(raw)) throw new Error('Danh sách trường không hợp lệ');
  const seen = new Set(), schools = [], unresolved = [];
  for (const original of raw) {
    if (!original?.id || !original?.name?.trim()) { unresolved.push(original); continue; }
    const id = canonicalSchoolId(original.id), identity = identities[id];
    if (!identity || identity.entity_kind === 'unresolved') { unresolved.push(original); continue; }
    if (seen.has(id)) continue;
    seen.add(id);
    const source = registry.find(row => row.school_id === id);
    schools.push({ ...original, id, name:identity.name || original.name,
      short:identity.short || original.short, website:identity.source_url,
      aliases:Object.keys(ALIASES).filter(alias => ALIASES[alias] === id),
      identity, admission_year:source?.admission_year || null,
      updated_at:REVIEWED_AT, official_source:source?.source_url || null,
      verification_status:source?.formula_status || 'needs_school_verification',
      admissionUrl:source?.source_url || null,
    });
  }
  return { schools, unresolved, stats:{
    universities:schools.filter(s=>s.identity.entity_kind === 'university').length,
    systems:schools.filter(s=>s.identity.entity_kind === 'university_system').length,
    unresolved:unresolved.length, total:schools.length,
  } };
}
