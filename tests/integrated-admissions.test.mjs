import test from 'node:test';
import assert from 'node:assert/strict';
import { integratedSchools, integratedCombos } from '../assets/data/integrated-admissions-2026.js';
import { calculateIntegrated, integratedRequirements } from '../assets/js/integrated-score-rules.js';
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function input(patch={}) {
  return { schoolId:'hcmiu', programId:'7480201', combo:'A00', year:2026, cohort:'current', exams:'both',
    thpt:{math:8,phy:8,che:8}, annual:Object.fromEntries(['math','phy','che'].flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,9]))),
    vact:900, region:'KV3', object:'none', bonus:'none', confirmed:true, ...patch };
}
test('eight unique canonical identities, schema and sources, no manufactured dates/default coefficients',()=>{
  assert.deepEqual(integratedSchools.map(s=>s.schoolId),['hcmut','uhs','hcmus','ussh','uit','uel','hcmiu','agu']);
  for (const school of integratedSchools) {
    for (const key of ['schoolId','admissionYear','admissionMethod','eligibilityRules','requiredInputs','weights','conversionRules','substitutionRules','bonusRules','priorityRules','sourceUrl','sourceDate','verificationStatus']) assert.ok(Object.hasOwn(school,key),key);
    assert.equal(school.admissionYear,2026); assert.match(school.sourceUrl,/^https:/);
  }
  assert.deepEqual(integratedSchools.find(s=>s.schoolId==='uhs').weights,{thpt:[.3,.35],vact:[.45,.5],transcript:.2});
  assert.deepEqual(integratedSchools.find(s=>s.schoolId==='agu').weights,{thpt:.4,vact:.4,transcript:.2});
});
test('component-only schools never output guessed totals or default 149-school bonuses',()=>{
  for (const school of integratedSchools.filter(s=>s.verificationStatus==='components-only')) {
    const program=school.programs[0],combo=program.combos[0],keys=integratedCombos[combo];
    const result=calculateIntegrated(input({schoolId:school.schoolId,programId:program.programId,combo,thpt:Object.fromEntries(keys.map(k=>[k,8])),annual:Object.fromEntries(keys.flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,8])))}));
    assert.equal(result.status,'reference'); assert.equal(result.final,null); assert.equal(result.academic,null); assert.ok(result.rows.length>0);
  }
});
test('IU current graduate: independent arithmetic with and without V-ACT',()=>{
  const both=calculateIntegrated(input());
  assert.equal(both.status,'official'); close(both.final,80*.4+75*.5+90*.1);
  const noVact=calculateIntegrated(input({exams:'thpt',vact:'ignored-invalid'}));
  close(noVact.final,80*.4+(.83*80)*.5+90*.1);
  assert.equal(calculateIntegrated(input({exams:'vact'})).final,null);
});
test('IU previous graduate: all three verified substitution branches',()=>{
  close(calculateIntegrated(input({cohort:'previous'})).final,80*.4+75*.5+(1.02*80)*.1);
  close(calculateIntegrated(input({cohort:'previous',exams:'thpt'})).final,80*.4+(.83*80)*.5+(1.02*80)*.1);
  close(calculateIntegrated(input({cohort:'previous',exams:'vact'})).final,(1.2*75)*.4+75*.5+(1.25*75)*.1);
  const config=integratedSchools.find(s=>s.schoolId==='hcmiu');
  assert.deepEqual(integratedRequirements(config,{cohort:'previous',exams:'vact'}),['vact']);
});
test('IU priorities before and after threshold, never rounded prematurely',()=>{
  const above=calculateIntegrated(input({region:'KV1',object:'UT1'}));
  close(above.priority,(100-above.academic)/25*(2.5+6.66));
  close(above.final,above.academic+above.priority);
  const below=calculateIntegrated(input({thpt:{math:5,phy:5,che:5},vact:600,region:'KV2NT',object:'UT2'}));
  close(below.priority,1.67+3.33);
  assert.equal(calculateIntegrated(input({region:'guessed'})).final,null);
});
test('IU rejects unverified bonuses, programs, years, missing confirmation and overflow substitutions',()=>{
  for (const patch of [{bonus:'unverified'},{bonus:5},{programId:'law'},{programId:'7480201_LK'},{combo:'B00'},{year:2027},{confirmed:false},{cohort:'foreign'},{cohort:'previous',exams:'vact',vact:1200}]) {
    assert.equal(calculateIntegrated(input(patch)).final,null,JSON.stringify(patch));
  }
});
test('all required score inputs validated, missing is not zero, hidden components ignored',()=>{
  for (const vact of ['',-1,1200.01,'NaN','1e3','900.123']) assert.equal(calculateIntegrated(input({vact})).status,'invalid');
  for (const math of ['',-1,10.01,'1e1','8.123']) assert.equal(calculateIntegrated(input({thpt:{math,phy:8,che:8}})).status,'invalid');
  assert.equal(calculateIntegrated(input({annual:{}})).status,'invalid');
  const zero=calculateIntegrated(input({vact:0,thpt:{math:0,phy:0,che:0}}));
  assert.equal(zero.status,'official'); close(zero.final,9);
});
test('every configured IU program/combination uses subject-specific annual grades',()=>{
  for (const program of integratedSchools.find(s=>s.schoolId==='hcmiu').programs) for (const combo of program.combos) {
    const keys=integratedCombos[combo];
    const result=calculateIntegrated(input({programId:program.programId,combo,thpt:Object.fromEntries(keys.map(k=>[k,8])),annual:Object.fromEntries(keys.flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,9])))}));
    close(result.final,78.5);
  }
});
test('HCMUS published percentile table enables verified branches; special majors remain blocked',()=>{
  const common={schoolId:'hcmus',programId:'7420101',combo:'B00',thpt:{math:8,che:8,bio:8},annual:Object.fromEntries(['math','che','bio'].flatMap(k=>[10,11,12].map(g=>[`${k}_${g}`,9])))};
  const result=calculateIntegrated(input({...common,exams:'thpt'}));
  assert.equal(result.status,'official'); close(result.academic,82); close(result.final,82);
  for (const exams of ['both','vact']) assert.equal(calculateIntegrated(input({...common,exams})).status,'official');
  assert.equal(calculateIntegrated(input({...common,programId:'74401a1',exams:'thpt'})).status,'unsupported');
});
