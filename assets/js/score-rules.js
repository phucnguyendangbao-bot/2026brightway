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
export function fptComponent({ combo, raw, grade12, year = 2026 }) {
  if (year !== 2026 || !COMBO_SUBJECTS[combo] || !/^[AC]/.test(combo)) return null;
  if (!Number.isFinite(raw) || raw < 15 || raw > 30 || !Number.isFinite(grade12) || grade12 < 0 || grade12 > 10) return null;
  return (raw + grade12 * 3) / 2;
}
