import { identities } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { textKey } from './selection-model.js';

// No fuzzy mapping from a job title to a degree. Require the degree name to
// occur in the sourced education route, and in an official annual school list.
export function relatedMajorNames(job) {
  if (!/^https:\/\//i.test(job?.eduSource || '')) return [];
  const route = ` ${textKey(job.edu).replace(/[^a-z0-9]+/g, ' ')} `;
  const names = new Map();
  for (const id of Object.keys(identities)) {
    const details = detailsForSchool(id);
    if (!details?.programSource || details.programSourceStatus || details.year !== 2026) continue;
    for (const program of details.programs || []) {
      const key = textKey(program.name).replace(/[^a-z0-9]+/g, ' ').trim();
      if (key.length >= 4 && route.includes(` ${key} `) && !names.has(key)) names.set(key, program.name);
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}
