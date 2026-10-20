// Only raw inputs and independently sourced components, never admission predictions.
export const COMBO_SUBJECTS = {
  A00:['math','phy','che'], A01:['math','phy','eng'], A02:['math','phy','bio'],
  B00:['math','che','bio'], C00:['lit','his','geo'], C01:['lit','math','phy'],
  C02:['lit','math','che'], C03:['lit','math','his'], C04:['lit','math','geo'],
  D01:['lit','math','eng'], D07:['math','che','eng'], D08:['math','bio','eng'],
  D09:['math','his','eng'], D10:['math','geo','eng'], D11:['lit','phy','eng'],
  X25:['math','civic','eng'], X26:['math','informatics','eng'],
};
export function parseScore(raw, max) {
  const text = String(raw ?? '').trim();
  if (!text) return {value:null};
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(text)) return {error:'format'};
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 && value <= max ? {value} : {error:'range'};
}
// FPT defines Axx/Cxx by the presence of Math/Literature, not the generic code prefix.
// Official notice 10/04/2026, section I.2 (checked 20/10/2026).
export function fptCombinationAllowed(combo, programCode = '') {
  const subjects = COMBO_SUBJECTS[combo];
  if (!subjects) return false;
  if (['7480201', '7480101'].includes(programCode)) return subjects.includes('math');
  return subjects.includes('math') || subjects.includes('lit');
}
export function fptComponent({ combo, raw, grade12, year = 2026, programCode = '' }) {
  if (year !== 2026 || !fptCombinationAllowed(combo, programCode)) return null;
  if (!Number.isFinite(raw) || raw < 15 || raw > 30 || !Number.isFinite(grade12) || grade12 < 0 || grade12 > 10) return null;
  return (raw + grade12 * 3) / 2;
}
