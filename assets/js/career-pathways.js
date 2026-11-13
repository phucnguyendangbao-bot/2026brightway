import { identities } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { textKey } from './selection-model.js';

const words = value => textKey(value).replace(/[^a-z0-9]+/g, ' ').trim();

// Major names from the official 2026 programme lists of the schools in the catalogue.
function officialMajors() {
  const names = new Map();
  for (const id of Object.keys(identities)) {
    const details = detailsForSchool(id);
    if (!details?.programSource || details.programSourceStatus || details.year !== 2026) continue;
    for (const program of details.programs || []) {
      const key = words(program.name);
      if (key.length >= 4 && !names.has(key)) names.set(key, program.name);
    }
  }
  return names;
}

// No fuzzy mapping from a job title to a degree. Require the degree name to
// occur in the sourced education route, and in an official annual school list.
export function relatedMajorNames(job) {
  if (!/^https:\/\//i.test(job?.eduSource || '')) return [];
  const route = ` ${words(job.edu)} `;
  return [...officialMajors()].filter(([key]) => route.includes(` ${key} `)).map(([, name]) => name)
    .sort((a, b) => a.localeCompare(b, 'vi'));
}

// For a route without a source link: a major counts only when the route names it as a whole
// item of its list ("Cử nhân Kế toán, Kiểm toán"), so "Kỹ thuật Điện tử" never yields "Kỹ thuật điện".
// The page labels these as suggestions taken from the route, not as a sourced pathway.
export function suggestedMajorNames(job) {
  const items = String(job?.edu || '').split(/[,.;:/+()–—]|\s-\s|\bhoặc\b|\bvà\b/i).map(words).filter(Boolean);
  const found = new Map();
  for (const item of items) {
    // Within one item the longest name wins: "Thiết kế Đồ họa" rather than also "Đồ họa".
    let best = null;
    for (const [key, name] of officialMajors()) {
      if ((item === key || item.endsWith(` ${key}`)) && (!best || key.length > best[0].length)) best = [key, name];
    }
    if (best) found.set(best[0], best[1]);
  }
  return [...found.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}
