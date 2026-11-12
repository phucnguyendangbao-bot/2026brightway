// Merge research batches into assets/data/school-research-2026.js after validation.
// Rejects: non-https, non-official hosts, aggregator hosts, empty summaries, non-numeric scores.
import fs from 'node:fs';
const dir = new URL('./2026-11-11/', import.meta.url).pathname;
const repo = new URL('../../', import.meta.url).pathname;
const schools = JSON.parse(fs.readFileSync(repo + 'assets/data/schools.json', 'utf8'));
const { canonicalSchoolId } = await import(repo + 'assets/data/university-identities.js');

// Official host families per school: school website host, admission host, plus parent systems.
const PARENTS = {
  hcmut: ['vnuhcm.edu.vn'], uit: ['vnuhcm.edu.vn'], hcmus: ['vnuhcm.edu.vn'], ussh: ['vnuhcm.edu.vn'], hcmiu: ['vnuhcm.edu.vn'], uel: ['vnuhcm.edu.vn'],
  dut: ['udn.vn', 'ud.edu.vn'], due: ['udn.vn', 'ud.edu.vn'], 'smp-udn': ['udn.vn', 'ud.edu.vn'], vku: ['udn.vn', 'ud.edu.vn'],
  huemed: ['hueuni.edu.vn'], husc: ['hueuni.edu.vn', 'husc.edu.vn'], huaf: ['hueuni.edu.vn'], hucfl: ['hueuni.edu.vn'], 'hue-uni': ['hueuni.edu.vn'],
};
const BLOCK = /tuyensinh247|thuvienphapluat|vnexpress|thanhnien|tuoitre|dantri|vietnamnet|wikipedia|facebook|zingnews|znews|kenh14|laodong|nld\.com|giaoducthoidai|baomoi|hocmai|diemthi|kenhtuyensinh|edu2review|vietjack/i;
const root = host => host.replace(/^www\./, '').split('.').slice(-3).join('.');
function officialHosts(id) {
  const hosts = new Set(PARENTS[id] || []);
  hosts.add('moet.gov.vn');
  for (const s of schools.filter(s => canonicalSchoolId(s.id) === id)) {
    for (const u of [s.website, s.admissionUrl, s.source_url]) {
      try { const h = new URL(u).hostname.replace(/^www\./, ''); hosts.add(h); hosts.add(h.split('.').slice(-2).join('.') === 'edu.vn' ? h : root(h)); } catch {}
    }
  }
  return [...hosts];
}
const issues = [];
function okUrl(id, field, value, extraHosts = []) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) throw new Error('not https');
    if (BLOCK.test(u.hostname)) throw new Error('aggregator/news host');
    const h = u.hostname.replace(/^www\./, '');
    const hosts = [...officialHosts(id), ...extraHosts];
    const base = h.split('.').slice(-3).join('.');
    const match = hosts.some(x => h === x || h.endsWith('.' + x) || base === x || x.endsWith('.' + base));
    if (!match) issues.push(`${id}.${field}: host ${h} not in ${hosts.join(',')} (kept for review)`);
    return u.href;
  } catch (e) { issues.push(`${id}.${field}: rejected ${value} (${e.message})`); return ''; }
}
const text = (v, max) => typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null;

// Reviewed exclusions: kept out of the site even though a page was found.
const EXCLUDE = {
  hucfl: { all: 'BrightWay record is labelled KHXH&NV Huế but research covers ĐH Ngoại ngữ Huế; fix the record identity first' },
  due: { admission: 'draft đề án (dự thảo), not final', programs: 'draft đề án (dự thảo), not final' },
  donga: { scores: 'table extracted flattened; agent asked for visual check' },
  phuxuan: { tuition: 'page does not state the school year' },
  hufi: { scholarships: 'page labels them as expected from previous years' },
  ntu: { scholarships: 'dormitory fee waivers, not scholarships' },
  husc: { scholarships: 'faculty-level page (Khoa Ngữ văn), not school-wide' },
};
// Pass 2 review: the hucfl identity is still unresolved; HCMUE's agent row is round 2 only (the full round-1 table was read in the browser).
const EXCLUDE_PASS2 = {
  '*': { hucfl: { all: 'record identity unresolved' } },
  'pass2/c3.json': { hcmue: { scores: 'round-2 table only; the round-1 table was read in the browser' } },
};
// Reviewed wording: partial score tables say so, and an amount not quoted verbatim is left out.
const METHOD_SUFFIX = {
  vlu: 'chỉ gồm các ngành có điểm ghi trong bài công bố; bảng đầy đủ xem tại nguồn',
  nttu: 'bảng gồm các ngành sức khỏe, luật; các ngành còn lại 15 điểm',
};
const SCHOLARSHIP_TEXT = {
  'dut:Học bổng cho thí sinh đạt giải học sinh giỏi quốc gia': 'Tân sinh viên K2026 đạt giải học sinh giỏi quốc gia nhận học bổng (giải Nhì 60 triệu đồng, giải Ba 50 triệu đồng); xem mức giải Nhất tại nguồn trường.',
};
const details = {}; const scholarships = []; const report = {};
// Pass 1 (b1–b6), then pass 2 (agents c1–c6, then pages read in a browser); a later source replaces a field it fills.
const PASS2 = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'browser'].map(name => `pass2/${name}.json`);
const files = [...fs.readdirSync(dir).filter(f => /^b\d\.json$/.test(f)).sort(), ...PASS2.filter(f => fs.existsSync(dir + f))];
for (const f of files) {
  const pass2 = f.startsWith('pass2/');
  const batch = JSON.parse(fs.readFileSync(dir + f, 'utf8'));
  for (const s of batch.schools || []) {
    const id = canonicalSchoolId(s.school_id);
    const ex = pass2 ? { ...EXCLUDE_PASS2['*'][id], ...EXCLUDE_PASS2[f]?.[id] } : EXCLUDE[id] || {};
    if (ex.all) { report[id] = { excluded: ex.all }; continue; }
    for (const f of ['tuition', 'admission', 'scores', 'programs']) if (ex[f]) s[f] = null;
    if (ex.scholarships) s.scholarships = [];
    const d = {}; const got = [];
    if (s.website) { const u = okUrl(id, 'website', s.website); if (u) { d.homepage = u; got.push('website'); } }
    if (s.tuition?.summary && s.tuition?.source) {
      const u = okUrl(id, 'tuition', s.tuition.source);
      if (u) { d.tuition = { year: 2026, summary: text(s.tuition.summary, 260), source: u, published: date(s.tuition.published) }; got.push('tuition'); }
    }
    if (s.admission?.summary && s.admission?.source) {
      const u = okUrl(id, 'admission', s.admission.source);
      if (u) { d.admission = { summary: text(s.admission.summary, 320), source: u, published: date(s.admission.published) }; got.push('admission'); }
    }
    const scoreRows = (s.scores?.programs || []).filter(p => p && text(p.name, 160) && Number.isFinite(Number(p.score)) && Number(p.score) > 0)
      .map(p => ({ code: text(String(p.code ?? ''), 24), name: text(p.name, 160), score: Number(p.score) }));
    if (s.scores?.source && Number.isFinite(Number(s.scores.scale)) && text(s.scores.method, 200)) {
      const u = okUrl(id, 'scores', s.scores.source);
      if (u) {
        const bad = scoreRows.filter(r => r.score > Number(s.scores.scale));
        if (bad.length) issues.push(`${id}.scores: ${bad.length} rows above scale ${s.scores.scale}`);
        d.scores = { source: u, scale: Number(s.scores.scale), method: text(s.scores.method + (METHOD_SUFFIX[id] ? '; ' + METHOD_SUFFIX[id] : ''), 260), note: text(s.scores.note, 260), programs: scoreRows.filter(r => r.score <= Number(s.scores.scale)) };
        got.push(`scores(${d.scores.programs.length})`);
      }
    }
    const progRows = (s.programs?.list || []).filter(p => p && text(p.name, 160)).map(p => ({ code: text(String(p.code ?? ''), 24), name: text(p.name, 160) }));
    if (s.programs?.source && progRows.length) {
      const u = okUrl(id, 'programs', s.programs.source);
      if (u) { d.programs = { source: u, note: text(s.programs.note, 260), list: progRows }; got.push(`programs(${progRows.length})`); }
    }
    for (const [i, sc] of (s.scholarships || []).slice(0, 3).entries()) {
      if (!text(sc?.title, 120) || !sc?.source) continue;
      const u = okUrl(id, 'scholarship', sc.source);
      if (!u) continue;
      scholarships.push({ id: `${id}-research${pass2 ? '2' : ''}-scholarship-${i + 1}`, schoolId: id, kind: 'scholarship', funding: 'editorial', status: 'verified', availability: 'reference',
        title: text(sc.title, 120), description: SCHOLARSHIP_TEXT[`${id}:${text(sc.title, 120)}`] || text(sc.description, 200) || 'Xem điều kiện và thời hạn tại nguồn trường.', publishedAt: date(sc.publishedAt), verifiedAt: batch.researched_at || '2026-11-11', sourceUrl: u });
      got.push('scholarship');
    }
    if (Object.keys(d).length) details[id] = { ...(details[id] || {}), ...d };
    report[id] = { got, not_found: s.not_found || {} };
  }
}
const header = `// Researched 2026 school facts, each tied to an official school page (researched ${new Date().toISOString().slice(0, 10)}).
// Generated from reviewed research files; edit the research, not this file, when refreshing.
`;
fs.writeFileSync(repo + 'assets/data/school-research-2026.js', header +
  `export const researchedSchoolDetails = ${JSON.stringify(details, null, 1)};\n\nexport const researchedScholarships = ${JSON.stringify(scholarships, null, 1)};\n`);
fs.writeFileSync(dir + 'merge-report.json', JSON.stringify({ issues, report }, null, 1));
console.log('schools with data:', Object.keys(details).length, '· scholarships:', scholarships.length);
console.log('issues:', issues.length); issues.slice(0, 60).forEach(i => console.log(' -', i));
