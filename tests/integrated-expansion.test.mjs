import test from 'node:test';
import assert from 'node:assert/strict';
import {integratedSchools,integratedCombos} from '../assets/data/integrated-admissions-2026.js';
import {calculateIntegrated} from '../assets/js/integrated-score-rules.js';
import {hcmusPercentiles,hcmusVactToThpt} from '../assets/data/hcmus-percentiles-2026.js';
import {integratedVerification,verificationLabels} from '../assets/js/integrated-verification.js';
import {integratedThresholds} from '../assets/js/integrated-thresholds.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function data(id,extra={}) {
 const school=integratedSchools.find(s=>s.schoolId===id),program=school.programs[0],combo=program.combos[0],keys=integratedCombos[combo];
 return {schoolId:id,programId:program.programId,year:2026,cohort:'current',combo,exams:'both',bonus:'none',region:'KV3',object:'none',confirmed:true,vact:900,vactMath:240,
  thpt:Object.fromEntries(keys.map(k=>[k,8])),annual:Object.fromEntries(keys.flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,9]))),semester:Object.fromEntries(keys.flatMap(k=>[10,11,12].flatMap(g=>[1,2].map(t=>[`${k}_${g}_${t}`,9])))),...extra};
}
test('all eight schools have selectable verified scopes; no unsupported program fabricates a result',()=>{
 for(const school of integratedSchools){assert.ok(school.programs.length);for(const program of school.programs){assert.ok(program.programId);for(const combo of program.combos)assert.ok(integratedCombos[combo],school.schoolId+'/'+combo);}}
 for(const id of integratedSchools.map(s=>s.schoolId))assert.equal(calculateIntegrated(data(id,{programId:'unverified'})).final,null);
});
test('HCMUT doubles Math in all three components and never treats raw 1200 as weighted 1500',()=>{
 const result=calculateIntegrated(data('hcmut'));
 assert.equal(result.status,'official');close(result.academic,.7*(900+240)/15+.2*80+.1*90);close(result.final,78.2);
 const noVact=calculateIntegrated(data('hcmut',{exams:'thpt',vact:'ignored',vactMath:'ignored'}));close(noVact.final,.7*(.75*80)+.2*80+.1*90);
 assert.equal(calculateIntegrated(data('hcmut',{vact:1000,vactMath:20})).final,null);
 assert.equal(calculateIntegrated(data('hcmut',{vactMath:''})).status,'invalid');
 assert.equal(calculateIntegrated(data('hcmut',{exams:'vact'})).final,null);
});
test('HCMUT subject weighting, priority rounding and year gate match independent arithmetic',()=>{
 const x=data('hcmut',{thpt:{math:10,phy:6,che:8},region:'KV1',object:'UT1'});const r=calculateIntegrated(x);
 close(r.rows[0].converted,85);const expected=Math.round((100-r.academic)/25*(2.75*100/30)*100)/100;close(r.priority,expected);
 assert.equal(calculateIntegrated({...x,year:2027}).final,null);
});
test('HCMUS official 101 percentile anchors and interpolation boundaries',()=>{
 assert.equal(hcmusPercentiles.length,101);
 for(const [i,[x,y]] of hcmusPercentiles.entries()){close(hcmusVactToThpt(x),y);if(i>0){assert.ok(x<hcmusPercentiles[i-1][0]);assert.ok(y<hcmusPercentiles[i-1][1]);}}
 close(hcmusVactToThpt(900),25.25+(25.5-25.25)*6/11);
 assert.equal(hcmusVactToThpt(369),null);assert.equal(hcmusVactToThpt(1140),null);assert.equal(hcmusVactToThpt(NaN),null);
});
test('HCMUS independently selects the better exam branch and permits a different HB combination',()=>{
 const low=calculateIntegrated(data('hcmus',{vact:600}));close(low.final,82);assert.match(low.rows[0].label,/THPT/);
 const high=calculateIntegrated(data('hcmus',{vact:1108}));close(high.final,.8*(29.75*100/30)+.2*90);assert.match(high.rows[0].label,/V-ACT/);
 const mixed=data('hcmus',{hbCombo:'A02'});mixed.annual.phy_10='10';mixed.annual.phy_11='10';mixed.annual.phy_12='10';
 const r=calculateIntegrated(mixed);close(r.rows[1].raw,28);assert.match(r.rows[1].label,/A02/);
 assert.equal(calculateIntegrated(data('hcmus',{vact:1200})).final,null);
});
test('UEL uses actual six-semester inputs and final 55/35/10; provisional competing branches stay reference',()=>{
 const r=calculateIntegrated(data('uel',{vact:1100}));assert.equal(r.status,'official');close(r.final,.55*(1100/12)+.35*80+.1*90);
 const example=data('uel',{combo:'A01',thpt:{math:8.3,phy:8.2,eng:8},annual:{},semester:Object.fromEntries(['math','phy','eng'].flatMap((k,i)=>[10,11,12].flatMap(g=>[1,2].map(t=>[`${k}_${g}_${t}`,[9,9.3,9.2][i]])))),vact:890});
 const result=calculateIntegrated(example);assert.equal(result.status,'reference');close(result.academic,.9*(24.5*100/30)+.1*(27.5*100/30));assert.equal(result.final,null);
 for(const exams of ['thpt','vact'])assert.equal(calculateIntegrated(data('uel',{cohort:'previous',exams})).final,null);
 assert.equal(calculateIntegrated(data('uel',{semester:{}})).status,'invalid');
});
test('AGU fixed July weights are distinct from the still-provisional substitution coefficients',()=>{
 const r=calculateIntegrated(data('agu'));assert.equal(r.status,'reference');close(r.academic,.8*80+.2*90);assert.equal(r.final,null);
 for(const programId of ['7380101','7140209'])assert.equal(calculateIntegrated(data('agu',{programId,combo:'A01',exams:'vact'})).final,null);
 assert.equal(calculateIntegrated(data('agu',{programId:'7380101',combo:'A01',thpt:{math:5,phy:5,eng:5}})).academic,null);
 assert.equal(calculateIntegrated(data('agu',{programId:'7140201',combo:'M00'})).final,null);
});
test('all new precise engines reject unverified bonuses and invalid priorities/confirmation',()=>{
 for(const id of ['hcmut','hcmus','uel']){
  for(const bonus of ['unverified',5,null])assert.equal(calculateIntegrated(data(id,{bonus})).final,null);
  assert.equal(calculateIntegrated(data(id,{confirmed:false,vact:1100})).final,null);
  assert.equal(calculateIntegrated(data(id,{region:'invented',vact:1100})).final,null);
 }
});

test('verification is resolved per program, branch, year and bonus, not only school',()=>{
 assert.equal(integratedVerification(data('hcmiu')).level,'verified');
 assert.equal(integratedVerification(data('hcmiu',{exams:'vact'})).level,'partial');
 assert.equal(integratedVerification(data('hcmiu',{exams:'vact',cohort:'previous'})).level,'verified');
 assert.equal(integratedVerification(data('agu',{programId:'7140201'})).level,'partial');
 assert.equal(integratedVerification(data('uel',{exams:'thpt'})).level,'partial');
 const x=data('uel',{vact:600});assert.equal(integratedVerification(x,calculateIntegrated(x)).level,'partial');
 assert.equal(integratedVerification(data('hcmut',{year:2027})).label,verificationLabels.unverified);
 assert.equal(integratedVerification(data('hcmut',{programId:'TNE'})).level,'unverified');
 for(const bonus of ['achievement','certificate','school149'])assert.equal(integratedVerification(data('hcmut',{bonus})).level,'partial');
});

test('only transcript, SAT/ACT, achievements and 149 school claims never fabricate a total',()=>{
 for(const school of integratedSchools) {
  for(const exams of ['transcript','certificate']) {
   const x=data(school.schoolId,{exams});assert.equal(calculateIntegrated(x).final,null);
   assert.equal(integratedVerification(x).level,'partial');
  }
  for(const bonus of ['achievement','certificate','school149']) {
   const x=data(school.schoolId,{bonus});assert.equal(calculateIntegrated(x).final,null);
  }
 }
});

test('every selectable program/combination and available-exam branch has valid school-specific input routing',()=>{
 let cases=0;
 for(const school of integratedSchools)for(const program of school.programs)for(const combo of program.combos)for(const exams of ['both','thpt','vact']) {
  const keys=integratedCombos[combo];
  const x=data(school.schoolId,{programId:program.programId,combo,exams,vact:1100,cohort:'previous',
   thpt:Object.fromEntries(keys.map(k=>[k,8])),
   annual:Object.fromEntries(keys.flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,9]))),
   semester:Object.fromEntries(keys.flatMap(k=>[10,11,12].flatMap(g=>[1,2].map(t=>[`${k}_${g}_${t}`,9])))),
  });
  const result=calculateIntegrated(x);assert.notEqual(result.status,'invalid',`${school.schoolId}/${program.programId}/${combo}/${exams}: ${result.message}`);
  if(result.final!==null)assert.ok(Number.isFinite(result.final)&&result.final>=0&&result.final<=100);
  cases++;
 }
 assert.ok(cases>900,`only ${cases} program/combination/exam cases`);
});

test('threshold checks use named numerical basis, ignore unrelated saved subjects and never promise eligibility',()=>{
 const x=data('hcmut'),r=calculateIntegrated(x);assert.equal(integratedThresholds(x,r)[0].met,true);
 const low=data('hcmiu',{exams:'thpt',thpt:{math:1,phy:1,che:1},annual:Object.fromEntries(['math','phy','che'].flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,1])))});
 assert.equal(integratedThresholds(low,calculateIntegrated(low))[0].met,false);
 const u=data('uel',{vact:1100});u.thpt.unrelated=10;
 const checks=integratedThresholds({...u,thptKeys:['math','phy','che']},calculateIntegrated(u));assert.equal(checks[1].value,24);
 const s=data('hcmus',{exams:'vact'});const h=integratedThresholds(s,calculateIntegrated(s));assert.equal(h[0].minimum,17);assert.equal(h[1].met,null);
 assert.deepEqual(integratedThresholds(data('uhs'),calculateIntegrated(data('uhs'))),[]);
});
