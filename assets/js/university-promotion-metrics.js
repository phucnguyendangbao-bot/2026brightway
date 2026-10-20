// No cookies, storage, network, user IDs, search terms, contact details or quiz/score data.
// A future reporter is an explicit integration; default runtime has no reporter.
export function createPromotionMetrics({ reporter = null, privacySignal = false } = {}) {
  let consent = false;
  const counts = new Map();
  const seen = new Set();
  const placements = ['home_featured','home_opportunity','major_context','school_profile'];
  const actions = ['impression','click','consultation_interest'];
  const identifier = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(value);
  return {
    setConsent(value) { consent = value === true && !privacySignal; if (!consent) { counts.clear(); seen.clear(); } return consent; },
    get consent() { return consent; },
    record(input) {
      if (!consent || !identifier(input?.schoolId) || !identifier(input?.contentId) || !placements.includes(input?.placement) || !actions.includes(input?.action)) return false;
      const key = [input.schoolId, input.contentId, input.placement, input.action].join(':');
      if (input.action === 'impression' && seen.has(key)) return false;
      if (input.action === 'impression') seen.add(key);
      const event = { schemaVersion:1, schoolId:input.schoolId, contentId:input.contentId, placement:input.placement, action:input.action, day:new Date().toISOString().slice(0,10) };
      counts.set(key, { ...event, count:(counts.get(key)?.count || 0) + 1 });
      if (reporter) { try { Promise.resolve(reporter(Object.freeze(event))).catch(() => {}); } catch { /* Reporting must never block navigation. */ } }
      return true;
    },
    snapshot() { return [...counts.values()].map(row => ({...row})); },
  };
}

export const promotionMetrics = createPromotionMetrics({ privacySignal: typeof navigator !== 'undefined' && (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') });
