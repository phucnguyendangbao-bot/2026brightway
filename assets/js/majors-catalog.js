// The "Ngành học" catalogue: every major named in a school's official 2026 programme list,
// with the schools that list it and the careers whose education route names it.
// Same data as the career → major → school path, so the three pages always agree.
import { identities } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { classifyProgram, textKey } from './training-taxonomy.js';
import { relatedMajorNames, suggestedMajorNames } from './career-pathways.js';

export function majorsFromSchools(schoolRows = []) {
  const meta = new Map(schoolRows.map(row => [row.id, row]));
  const majors = new Map();
  for (const id of Object.keys(identities)) {
    const details = detailsForSchool(id);
    if (!details?.programSource || details.programSourceStatus || details.year !== 2026) continue;
    const school = meta.get(id) || { id };
    for (const program of details.programs || []) {
      const key = textKey(program.name);
      if (key.length < 3) continue;
      if (!majors.has(key)) majors.set(key, { key, name: program.name, fields: new Map(), schools: new Map(), careers: [] });
      const entry = majors.get(key);
      const field = classifyProgram(program).fieldName;
      if (!/^Chưa/.test(field)) entry.fields.set(field, (entry.fields.get(field) || 0) + 1);
      if (!entry.schools.has(id)) entry.schools.set(id, { id, short: school.short || id.toUpperCase(), name: school.name || id, city: school.city || '', logoUrl: school.logoUrl || '' });
    }
  }
  return [...majors.values()].map(entry => ({
    key: entry.key,
    name: entry.name,
    field: [...entry.fields].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Khác',
    schools: [...entry.schools.values()].sort((a, b) => a.short.localeCompare(b.short, 'vi')),
    careers: [],
  })).sort((a, b) => b.schools.length - a.schools.length || a.name.localeCompare(b.name, 'vi'));
}

// Reverse of the career page: a career lists a major only when its route names it exactly.
export function attachCareers(majors, jobs = []) {
  const byKey = new Map(majors.map(major => [major.key, major]));
  for (const job of jobs) {
    const sourced = relatedMajorNames(job);
    for (const name of sourced.length ? sourced : suggestedMajorNames(job)) {
      const major = byKey.get(textKey(name));
      if (major && !major.careers.some(c => c.name === job.name)) major.careers.push({ name: job.name, holland: job.holland || [] });
    }
  }
  return majors;
}

// Majors that careers matching the reader's Holland code lead to, best fit first.
export function majorsForCode(majors, code) {
  const letters = String(code || '').toUpperCase().replace(/[^RIASEC]/g, '');
  if (letters.length !== 3) return [];
  const fit = career => career.holland.filter(c => letters.includes(c)).length;
  return majors.map(major => ({ major, best: Math.max(0, ...major.careers.map(fit)) }))
    .filter(item => item.best >= 2).sort((a, b) => b.best - a.best || b.major.schools.length - a.major.schools.length)
    .map(item => item.major);
}

export function filterMajors(majors, { query = '', field = '' } = {}) {
  const q = textKey(query);
  return majors.filter(major => (!field || major.field === field)
    && (!q || major.key.includes(q) || major.careers.some(c => textKey(c.name).includes(q))));
}
