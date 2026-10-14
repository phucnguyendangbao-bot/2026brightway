export function officialEvents(policy, year) {
  const docs = new Map(policy.documents.map(doc => [doc.id, doc]));
  return policy.calendar_events.filter(event => {
    const doc = docs.get(event.source_id);
    return event.policy_year === Number(year) && event.status === `official_${year}` &&
      /^https:\/\//.test(event.source_url || '') && Boolean(event.verified_at) &&
      doc && !String(doc.status).includes('du_thao') &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/.test(event.at || '') &&
      Number.isFinite(Date.parse(event.at)) && event.d === event.at.slice(0,10) &&
      new Date(Date.parse(event.at) + 7 * 3600000).toISOString().slice(0,10) === event.d &&
      event.d.startsWith(String(year)+'-');
  }).sort((a,b) => Date.parse(a.at)-Date.parse(b.at));
}
export const nextOfficialEvent = (policy, year, now = Date.now()) => officialEvents(policy,year).find(event => Date.parse(event.at)>now) || null;
