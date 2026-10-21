import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePersonalization, profileErrors, recommend, schoolAssessment, wishReview, nextActions, annualTuition } from '../assets/js/personalization-model.js';
import { contextForQuestion } from '../assets/js/personalization-context.js';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { wishFromProgram } from '../assets/js/selection-model.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
const schools=buildUniversityCatalog(JSON.parse(fs.readFileSync(new URL('../assets/data/schools.json',import.meta.url),'utf8'))).schools;
const jobs=JSON.parse(fs.readFileSync(new URL('../assets/data/jobs.json',import.meta.url),'utf8'));
const profile=extra=>normalizePersonalization({version:1,enabled:true,...extra});

test('optional profile fails closed for unsupported schemas and sanitizes corrupt fields without identifiers',()=>{
  for(const value of [null,[],3,'broken',{version:99,enabled:true,waybiSharing:true}])assert.equal(normalizePersonalization(value).waybiSharing,false);
  const p=profile({groups:[jobs[0].group,jobs[0].group,'fake'],subjects:['Toán','unknown'],year:'2027',budgetMax:Infinity,region:'bad',grade:'12',email:'secret@example.com',phone:'1234'});
  assert.deepEqual(p.groups,[jobs[0].group]);assert.deepEqual(p.subjects,['Toán']);assert.equal(p.year,null);assert.equal(p.region,'');assert.equal(p.budgetMax,null);assert.equal('email' in p,false);
  assert.equal(profileErrors({budgetMin:50e6,budgetMax:20e6}).length,1);
  assert.equal(profileErrors({budgetMax:NaN}).length,1);
  assert.equal(profile({enabled:false,waybiSharing:true,metricsConsent:true}).waybiSharing,false);
});
test('required versus soft location constraints and missing multi-campus data remain distinct',()=>{
  const p=profile({region:'Cần Thơ',regionMode:'required'});
  assert.equal(schoolAssessment({city:'TP.HCM'},p,null).status,'outside');
  assert.equal(schoolAssessment({city:''},p,null).status,'unknown');
  assert.equal(schoolAssessment({city:'TP.HCM / Cần Thơ'},p,null).status,'unknown');
  assert.equal(schoolAssessment({city:'Cần Thơ'},p,null).status,'explore');
  assert.equal(schoolAssessment({city:'TP.HCM'},{...p,regionMode:'soft'},null).status,'explore');
});
test('annual tuition never parses unverified estimates and keeps year, units and missing data explicit',()=>{
  const p=profile({year:2027,budgetMax:30e6,budgetMode:'required'});
  assert.equal(annualTuition({tuition:{year:2026,source:'https://example.edu.vn',annualMinVnd:10e6,annualMaxVnd:20e6}},2027),null);
  assert.equal(schoolAssessment({city:'TP.HCM'},p,{tuition:'20 triệu/năm'}).status,'unknown');
  const tuition={year:2027,source:'https://example.edu.vn',annualMinVnd:40e6,annualMaxVnd:50e6};
  assert.equal(schoolAssessment({},p,{tuition}).status,'outside');
  assert.equal(schoolAssessment({},{...p,budgetMode:'soft'},{tuition}).status,'explore');
  assert.match(schoolAssessment({},p,{tuition}).outside.join(' '),/ngân sách/);
});
test('real catalogs produce explainable careers and preserve every school across separate groups',()=>{
  const state={personalization:profile({region:'Cần Thơ',regionMode:'required',year:2027,budgetMax:25e6,budgetMode:'required'}),savedCareers:[{name:jobs[0].name}],savedMajors:[{name:'Công nghệ thông tin'}],savedSchools:[{id:'ctu'}]};
  const result=recommend({state,holland:'SAE',jobs,schools});
  assert.ok(result.careers.length);assert.ok(result.careers.every(x=>x.reasons.length));
  const all=[...result.schools,...result.unknown,...result.outside];assert.equal(all.length,schools.length);assert.equal(new Set(all.map(x=>x.school.id)).size,schools.length);
  assert.ok(result.unknown.length);assert.ok(result.outside.length);
  const other=recommend({state:{...state,personalization:profile({region:'TP.HCM',regionMode:'required'})},jobs,schools});
  assert.notDeepEqual(result.outside.map(x=>x.school.id),other.outside.map(x=>x.school.id));
  assert.deepEqual(recommend({state:{},jobs,schools}).schools,[]);
  const sponsored=schools.map(x=>({...x,funding:'sponsored',matchingScore:1000}));
  assert.deepEqual(recommend({state,jobs,schools:sponsored}).outside.map(x=>x.school.id),recommend({state,jobs,schools}).outside.map(x=>x.school.id));
});
test('wish review detects duplicates and source/planning conflicts without mutating priority',()=>{
  const fpt=schools.find(x=>x.id==='fpt');const wish=wishFromProgram(fpt,detailsForSchool('fpt'),0,2027);
  const state={personalization:profile({year:2026,budgetMax:25e6}),wishes:[wish,wish,null]};
  const before=JSON.stringify(state);const warnings=wishReview(state,schools);
  assert.match(warnings.join(' '),/trùng/);assert.match(warnings.join(' '),/2027/);assert.match(warnings.join(' '),/học phí/);assert.equal(JSON.stringify(state),before);
  assert.ok(nextActions(state,'').some(x=>x.href.includes('my-choices')));
});
test('Waybi context is consent-gated, question-specific and bounded to actual catalog choices',()=>{
  const base={personalization:profile({year:2027,region:'Cần Thơ',budgetMax:20e6,groups:[jobs[0].group],subjects:['Toán']}),savedCareers:[jobs[0],{name:'private@example.com'}],savedMajors:[{name:'Công nghệ thông tin'},{name:'private@example.com'}],savedSchools:[{id:'ctu'},{id:'private'}],wishes:[],email:'private@example.com',scores:{secret:30},tasks:[{text:'private task'}]};
  assert.equal(contextForQuestion('so sánh trường',base,{jobs,schools}),null);
  const state={...base,personalization:{...base.personalization,waybiSharing:true}};
  assert.equal(contextForQuestion('Xin chào',state,{jobs,schools}),null);
  const career=contextForQuestion('nghề nào hợp Holland?',state,{jobs,schools,holland:'SAE'});
  assert.equal(career.holland,'SAE');assert.deepEqual(career.careers,[jobs[0].name]);assert.equal('budgetMax' in career,false);assert.equal('schoolIds' in career,false);
  const comparison=contextForQuestion('So sánh trường quan tâm',state,{jobs,schools});assert.deepEqual(comparison.schoolIds,['ctu']);assert.equal('careers' in comparison,false);assert.equal('budgetMax' in comparison,false);
  const majors=contextForQuestion('Ngành đã lưu của tôi',state,{jobs,schools});assert.deepEqual(majors.majors,['Công nghệ thông tin']);
  const budget=contextForQuestion('Ngân sách học phí của tôi',state,{jobs,schools});assert.equal(budget.budgetMax,20e6);assert.equal('schoolIds' in budget,false);
  assert.equal(budget.budgetUnit,'VND/năm');
  const subjects=contextForQuestion('Môn học thế mạnh của tôi',state,{jobs,schools});assert.deepEqual(subjects.subjects,['Toán']);assert.equal('holland' in subjects,false);assert.equal('budgetMax' in subjects,false);
  assert.doesNotMatch(JSON.stringify([career,comparison,budget]),/private|secret|scores/);
});
