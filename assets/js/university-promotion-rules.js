// Pure presentation eligibility. Never imported by Holland or admission-score rules.
export const normalizeMajor = value => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const dateValue = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return NaN;
  const [year, month, day] = value.slice(0,10).split('-').map(Number);
  if (new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0,10) !== value.slice(0,10)) return NaN;
  return Date.parse(value);
};
export const reviewed = (value, now) => Number.isFinite(dateValue(value)) && dateValue(value) <= now;

export function officialUniversityUrl(value, school) {
  try {
    const url = new URL(value);
    const official = new URL(school.website).hostname.replace(/^www\./, '');
    return url.protocol === 'https:' && !url.username && !url.password && (url.hostname === official || url.hostname.endsWith('.' + official)) ? url.href : '';
  } catch { return ''; }
}

export function relevantPrograms(school, query) {
  const tokens = normalizeMajor(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  return (Array.isArray(school.programs) ? school.programs : []).filter(program => {
    const text = normalizeMajor(`${program.name} ${program.code || ''}`);
    return tokens.every(token => text.split(' ').includes(token));
  });
}

export function eligibleOpportunity(record, school, now = Date.now()) {
  if (!record || !school || school.identity?.entity_kind !== 'university' || record.schoolId !== school.id) return false;
  if (record.status !== 'verified' || !reviewed(record.verifiedAt, now) || !officialUniversityUrl(record.sourceUrl, school)) return false;
  if (!['scholarship','admissions','event','consultation'].includes(record.kind) || typeof record.title !== 'string' || !record.title.trim()) return false;
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(record.id || '')) return false;
  if (record.publishedAt && !reviewed(record.publishedAt, now)) return false;
  if (record.reviewExpiresAt && !(dateValue(record.reviewExpiresAt) > now)) return false;
  if (record.kind === 'consultation' && (!record.reviewExpiresAt || !officialUniversityUrl(record.consultationUrl, school))) return false;
  if (record.kind === 'event' && !(dateValue(record.eventAt) > now && record.availability === 'active')) return false;
  if (record.availability === 'active') return reviewed(record.startsAt, now) && dateValue(record.endsAt) > now;
  return ['reference','contact'].includes(record.availability) && record.kind !== 'event';
}

export function verifiedSponsorship(record, partners, now = Date.now()) {
  const partner = (Array.isArray(partners) ? partners : []).find(item => item?.id === record.partnerId && item.schoolId === record.schoolId);
  return record.funding === 'sponsored' && partner?.status === 'verified' && reviewed(partner.verifiedAt, now) && dateValue(partner.expiresAt) > now;
}

export function selectSponsoredCampaigns(records, partners, schools, { placement, query = '', region = '', now = Date.now() } = {}) {
  return (Array.isArray(records) ? records : []).filter(record => {
    if (!record || typeof record !== 'object') return false;
    const school = schools.find(item => item.id === record.schoolId);
    if (record.funding !== 'sponsored' || record.availability !== 'active' || !eligibleOpportunity(record, school, now)) return false;
    if (!verifiedSponsorship(record, partners, now)) return false;
    if (!Array.isArray(record.placements) || !record.placements.includes(placement) || !reviewed(record.startsAt, now) || !(dateValue(record.endsAt) > now)) return false;
    if (record.programCodes && !Array.isArray(record.programCodes)) return false;
    if (region && normalizeMajor(school.city) !== normalizeMajor(region)) return false;
    if (placement === 'major_context') {
      const matches = relevantPrograms(school, query);
      if (!matches.length) return false;
      if (record.programCodes?.length && !matches.some(program => record.programCodes.includes(program.code))) return false;
    }
    return true;
  }).slice(0, placement === 'home_featured' ? 1 : 2);
}

export function selectEditorialOpportunities(records, schools, { schoolId, now = Date.now() } = {}) {
  return (Array.isArray(records) ? records : []).filter(record => record?.funding === 'editorial' && (!schoolId || record.schoolId === schoolId) && eligibleOpportunity(record, schools.find(school => school.id === record.schoolId), now));
}
