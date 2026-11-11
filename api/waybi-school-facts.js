// Verified school facts for Waybi: when a message names a school, its researched 2026 data from official
// pages is added to the answering model's context, with sources, so Waybi can cite instead of saying "no data".
import { researchedSchoolDetails } from '../assets/data/school-research-2026.js';
import { SCHOOL_INDEX } from './waybi-school-index.js';

const schools = () => SCHOOL_INDEX;
const fold = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

// Schools named in the text, by short code (whole word, e.g. "UIT") or by full name.
export function schoolsMentioned(text, limit = 3) {
  const plain = fold(text);
  const hits = [];
  for (const school of schools()) {
    const short = fold(school.short).trim();
    const name = fold(school.name).replace(/^(truong )?dai hoc /, '').split(/\s[–-]\s/)[0].trim();
    const byShort = short.length >= 2 && new RegExp(`(^|[^a-z0-9])${short.replace(/[^a-z0-9]/g, '')}([^a-z0-9]|$)`).test(plain);
    const byName = name.length >= 6 && plain.includes(name);
    if ((byShort || byName) && !hits.some(hit => hit.id === school.id)) hits.push(school);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function schoolFactsContext(text) {
  const lines = [];
  for (const school of schoolsMentioned(text)) {
    const facts = researchedSchoolDetails[school.id];
    if (!facts) continue;
    const parts = [`- ${school.name} (${school.short}):`];
    if (facts.tuition) parts.push(`  Học phí 2026: ${facts.tuition.summary} Nguồn: ${facts.tuition.source}`);
    if (facts.admission) parts.push(`  Phương thức 2026: ${facts.admission.summary} Nguồn: ${facts.admission.source}`);
    if (facts.scores?.programs?.length) {
      const values = facts.scores.programs.map(row => row.score);
      parts.push(`  Điểm chuẩn 2026 (${facts.scores.method}): từ ${Math.min(...values)} đến ${Math.max(...values)} tùy ngành. Nguồn: ${facts.scores.source}`);
    }
    if (parts.length > 1) lines.push(parts.join('\n'));
  }
  return lines.length ? `\n\n=== DỮ LIỆU TRƯỜNG 2026 ĐÃ ĐỐI CHIẾU NGUỒN CHÍNH THỨC ===\nDùng đúng các số liệu này khi được hỏi, nêu nguồn, nói rõ là năm 2026, không suy ra cho 2027.\n${lines.join('\n')}` : '';
}
