// Presentation layer: curated 2026 records first, then researched 2026 facts from official school pages
// fill only what the curated record lacks. Nothing here estimates, ranks or carries data across years.
import { detailsForSchool as curatedDetails } from '../data/school-profile-details.js';
import { canonicalSchoolId } from '../data/university-identities.js';
import { researchedSchoolDetails, researchedScholarships } from '../data/school-research-2026.js?v=20261111u';
import { canDisplayProgramScores } from './score-provenance.js';

const https = value => /^https:\/\//.test(String(value || ''));
const key = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const researchFor = id => researchedSchoolDetails[canonicalSchoolId(id)] || null;
export { researchedScholarships };

export function detailsWithResearch(id, year = 2026) {
  const base = curatedDetails(id, year);
  const research = Number(year) === 2026 ? researchFor(id) : null;
  if (!research) return base;
  const out = { ...(base || {}), year: 2026 };
  if (research.tuition && !(base?.tuition?.year === 2026 && https(base.tuition.source))) out.tuition = research.tuition;
  if (research.admission && !https(out.admissionSource)) out.admissionSource = research.admission.source;
  const officialList = research.programs?.list?.length && https(research.programs.source);
  const fuller = officialList && base?.programs?.length && research.programs.list.length > base.programs.length
    && research.programs.list.some(row => row.code) && !base.programs.some(row => Number.isFinite(row.score) || Number.isFinite(row.quota));
  if (officialList && (!base?.programs?.length || base.programSourceStatus === 'secondary' || fuller)) {
    out.programs = research.programs.list.map(row => ({ ...row }));
    out.programSource = research.programs.source;
    out.programNote = research.programs.note || `${research.programs.list.length} ngành/chương trình từ nguồn chính thức của trường năm 2026.`;
    delete out.programSourceStatus; delete out.programSourceLabel;
  }
  const scores = research.scores;
  if (scores?.programs?.length && https(scores.source) && !canDisplayProgramScores(base, 2026)) {
    out.scoreSource = scores.source;
    out.scoreScale = scores.scale;
    out.scoreMethod = scores.method;
    if (scores.note) out.scoreNote = scores.note;
    const byCode = new Map(scores.programs.filter(row => row.code).map(row => [key(row.code), row]));
    const byName = new Map(scores.programs.map(row => [key(row.name), row]));
    const used = new Set();
    const programs = (out.programs || []).map(program => {
      const hit = (program.code && byCode.get(key(program.code))) || byName.get(key(program.name));
      if (!hit || Number.isFinite(program.score)) return { ...program };
      used.add(hit);
      return { ...program, score: hit.score };
    });
    const extra = scores.programs.filter(row => !used.has(row) && !programs.some(program => (row.code && key(program.code) === key(row.code)) || key(program.name) === key(row.name)));
    out.programs = [...programs, ...extra.map(row => ({ ...row }))];
    if (!https(out.programSource)) out.programSource = scores.source;
  }
  return out;
}

// Registry rows with an official 2026 notice win; otherwise the researched 2026 admission page fills in.
export function admissionSourceWithResearch(source, id) {
  if (source?.admission_year === 2026 && https(source.source_url)) return source;
  const admission = researchFor(id)?.admission;
  if (!admission || !https(admission.source)) return source;
  return { ...(source || {}), school_id: canonicalSchoolId(id), admission_year: 2026, source_url: admission.source, source_summary: admission.summary, source_verified_at: '2026-11-11' };
}

export const homepageFor = (school) => researchFor(school?.id)?.homepage || school?.website || '';
