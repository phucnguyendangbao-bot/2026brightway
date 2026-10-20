import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildUniversityCatalog} from '../assets/data/university-identities.js';
import {detailsForSchool} from '../assets/data/school-profile-details.js';
import {featuredUniversityIds, universityPartners, universityCampaigns, universityOpportunities} from '../assets/data/university-promotions.js';
import {relevantPrograms, officialUniversityUrl, eligibleOpportunity, selectSponsoredCampaigns, selectEditorialOpportunities} from '../assets/js/university-promotion-rules.js';
import {createPromotionMetrics} from '../assets/js/university-promotion-metrics.js';
import {universityCardHTML} from '../assets/js/university-card.js';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const schools = buildUniversityCatalog(JSON.parse(read('assets/data/schools.json'))).schools.map(school => ({...school, programs:detailsForSchool(school.id)?.programs || []}));
const fpt = schools.find(school => school.id === 'fpt');
const now = Date.parse('2026-10-20T10:00:00+07:00');
// Synthetic commercial fixtures, never shipped as public campaign/partner data.
const partner = {id:'fixture-partner', schoolId:'fpt', status:'verified', verifiedAt:'2026-10-19', expiresAt:'2026-11-01'};
const campaign = {id:'fixture-ad', partnerId:partner.id, schoolId:'fpt', funding:'sponsored', status:'verified', availability:'active', kind:'admissions', title:'Synthetic test only', verifiedAt:'2026-10-19', startsAt:'2026-10-19', endsAt:'2026-10-21', placements:['home_featured','major_context'], sourceUrl:'https://daihoc.fpt.edu.vn/'};
const select = (record = campaign, partnerRecord = partner, options = {}) => selectSponsoredCampaigns([record], [partnerRecord], schools, {now, placement:'home_featured', ...options});

test('public university discovery never invents sponsored partners and preserves campus showcases', () => {
  assert.deepEqual(universityPartners, []);
  assert.deepEqual(universityCampaigns, []);
  assert.ok(featuredUniversityIds.every(id => schools.some(school => school.id === id)));
  const home = read('index.html');
  assert.equal((home.match(/class="home-journey-card"/g) || []).length, 3);
  assert.ok(home.indexOf('id="hero-actions"') < home.indexOf('id="university-discovery"'));
  assert.match(home, />Trường nổi bật</);
  assert.match(home, /id="admissionsHighlights"/);
  assert.equal((home.match(/class="slide(?: is-active)?" data-school=/g) || []).length, 8);
  assert.doesNotMatch(home, /<details class="home-tools-disclosure"/);
});

test('paid content fails closed unless both content and relationship are verified and in date', () => {
  assert.equal(select().length, 1);
  for (const patch of [{status:'draft'}, {funding:'unknown'}, {verifiedAt:null}, {verifiedAt:'2026-10-21'}, {startsAt:'2026-10-21'}, {endsAt:'2026-10-20'}, {endsAt:'2026-02-30'}, {placements:'home_featured'}, {schoolId:'hucfl'}, {sourceUrl:'https://example.com/'}, {sourceUrl:'javascript:alert(1)'}, {sourceUrl:'https://daihoc.fpt.edu.vn.evil.example/'}, {availability:'reference'}]) assert.equal(select({...campaign,...patch}).length,0, JSON.stringify(patch));
  for (const patch of [{status:'pending'}, {schoolId:'ctu'}, {verifiedAt:null}, {verifiedAt:'2026-10-21'}, {expiresAt:'2026-10-19'}, {expiresAt:null}]) assert.equal(select(campaign,{...partner,...patch}).length,0,JSON.stringify(patch));
  assert.equal(selectSponsoredCampaigns([campaign], [], schools, {now,placement:'home_featured'}).length,0);
  assert.deepEqual(selectSponsoredCampaigns(null, null, schools, {now,placement:'home_featured'}),[]);
  assert.deepEqual(selectSponsoredCampaigns([null], [null], schools, {now,placement:'home_featured'}),[]);
});

test('contextual promotion uses real program names/codes and area, never sponsorship matching scores', () => {
  const frozen = JSON.stringify(schools);
  assert.ok(relevantPrograms(fpt,'cong nghe thong tin').length > 0);
  assert.equal(relevantPrograms(fpt,'Y khoa').length,0);
  assert.equal(select(campaign,partner,{placement:'major_context',query:'Công nghệ thông tin'}).length,1);
  assert.equal(select(campaign,partner,{placement:'major_context',query:'Y khoa'}).length,0);
  assert.equal(select(campaign,partner,{placement:'major_context',query:''}).length,0);
  assert.equal(select(campaign,partner,{placement:'major_context',query:'Công nghệ thông tin',region:'not-fpt-city'}).length,0);
  assert.equal(select({...campaign,programCodes:['7380101']},partner,{placement:'major_context',query:'Công nghệ thông tin'}).length,0);
  assert.equal(select({...campaign,programCodes:['7480201']},partner,{placement:'major_context',query:'Công nghệ thông tin'}).length,1);
  assert.equal(JSON.stringify(schools),frozen);
  for (const file of ['assets/js/score-rules.js','assets/js/admissions-rules.js','assets/js/holland.js']) assert.doesNotMatch(read(file),/university-promotion|universityPartners|universityCampaigns/);
});

test('opportunities retain provenance, unknown deadlines are reference-only and events must be future', () => {
  assert.equal(selectEditorialOpportunities(universityOpportunities,schools,{now}).length,3);
  assert.equal(universityOpportunities.filter(item => item.kind === 'scholarship')[0].availability,'reference');
  assert.equal(eligibleOpportunity({...campaign,kind:'event',eventAt:'2026-10-19'},fpt,now),false);
  assert.equal(eligibleOpportunity({...campaign,kind:'event',eventAt:'2026-10-21'},fpt,now),true);
  const contact = universityOpportunities.find(item => item.kind === 'consultation');
  assert.equal(eligibleOpportunity({...contact,consultationUrl:'https://evil.example/'},fpt,now),false);
  assert.equal(eligibleOpportunity({...contact,reviewExpiresAt:null},fpt,now),false);
  assert.equal(eligibleOpportunity(contact,fpt,Date.parse('2026-11-21')),false);
  assert.equal(officialUniversityUrl('https://user:pass@daihoc.fpt.edu.vn/',fpt),'');
});

test('university cards escape content, disclose paid placement and mark outbound sponsored links', () => {
  const html = universityCardHTML(fpt,{campaign:{...campaign,title:'<img src=x onerror=alert(1)>'}});
  assert.match(html,/>Được tài trợ</);
  assert.match(html,/rel="noopener noreferrer sponsored"/);
  assert.match(html,/&lt;img src=x/);
  assert.doesNotMatch(html,/<img src=x/);
  assert.match(universityCardHTML(fpt),/Biên tập giới thiệu · Không tài trợ/);
});

test('metrics are off by default, minimized, deduplicated, consent-gated and erasable', async () => {
  const delivered = [];
  const metrics = createPromotionMetrics({reporter:event=>delivered.push(event)});
  const input = {schoolId:'fpt',contentId:'fixture-ad',placement:'major_context',action:'impression',email:'private@example.com',phone:'0123456789',query:'private query',holland:'RIA',score:30};
  assert.equal(metrics.record(input),false);
  assert.deepEqual(metrics.snapshot(),[]);
  assert.equal(delivered.length,0);
  metrics.setConsent(true);
  assert.equal(metrics.record(input),true);
  assert.equal(metrics.record(input),false);
  assert.equal(metrics.record({...input,action:'click'}),true);
  assert.equal(metrics.record({...input,action:'registration'}),false);
  assert.equal(metrics.record({...input,action:'consultation_interest'}),true);
  assert.equal(delivered.length,3);
  assert.deepEqual(Object.keys(delivered[0]).sort(),['action','contentId','day','placement','schemaVersion','schoolId']);
  assert.equal(metrics.record({...input,contentId:'private@example.com'}),false);
  metrics.setConsent(false);
  assert.deepEqual(metrics.snapshot(),[]);
  assert.equal(metrics.record({...input,action:'click'}),false);
  const blocked = createPromotionMetrics({privacySignal:true});
  assert.equal(blocked.setConsent(true),false);
  assert.equal(blocked.record(input),false);
});

test('reporting failures cannot break university navigation or collect contacts', () => {
  const metrics = createPromotionMetrics({reporter:()=>{throw Error('offline');}});
  metrics.setConsent(true);
  assert.doesNotThrow(()=>metrics.record({schoolId:'fpt',contentId:'fixture',placement:'home_featured',action:'click'}));
  const source = read('assets/js/university-promotion-metrics.js');
  assert.doesNotMatch(source,/fetch\(|sendBeacon\(|localStorage\.|document\.cookie/);
});
