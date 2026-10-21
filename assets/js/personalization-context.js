import { normalizePersonalization } from './personalization-model.js';
import { textKey } from './selection-model.js';
import { detailsForSchool } from '../data/school-profile-details.js';
export function contextForQuestion(question,state,{jobs=[],schools=[],holland=''}={}) {
  const p=normalizePersonalization(state?.personalization);
  if(!p.enabled || !p.waybiSharing)return null;
  const q=textKey(question), result={version:1};
  const names=(field,catalog)=>[...new Set((Array.isArray(field)?field:[]).map(x=>x?.name).filter(name=>catalog.some(x=>x.name===name)))].slice(0,5);
  if(/holland|so thich|nghe|nganh/.test(q)) {
    if(/^[RIASEC]{3}$/.test(holland) && new Set(holland).size===3)result.holland=holland;
    const careers=names(state.savedCareers,jobs); if(careers.length)result.careers=careers;
    if(/nganh/.test(q)) {
      const officialNames=new Set(schools.flatMap(school=>{
        const details=detailsForSchool(school.id);
        return details?.year===2026 && !details.programSourceStatus && /^https:\/\//.test(details.programSource || '') ? (details.programs || []).map(x=>x.name) : [];
      }));
      const majors=[...new Set((state.savedMajors || []).map(x=>x?.name).filter(name=>officialNames.has(name)))].slice(0,5);
      if(majors.length)result.majors=majors;
    }
    if(p.groups.length)result.groups=p.groups;
  }
  if(p.subjects.length && /mon hoc|the manh|nang luc/.test(q))result.subjects=p.subjects;
  if(p.grade && /khoi lop|lop may|nam hoc/.test(q))result.grade=p.grade;
  if(/truong|nguyen vong|so sanh/.test(q)) {
    const ids=(state.savedSchools || []).map(x=>x?.id).filter(id=>schools.some(s=>s.id===id));
    if(ids.length)result.schoolIds=[...new Set(ids)].slice(0,5);
    if(/nguyen vong/.test(q)) {
      const wishes=(state.wishes || []).filter(x=>{
        if(!schools.some(s=>s.id===x?.schoolId))return false;
        const details=detailsForSchool(x.schoolId);
        return !details?.programSourceStatus && details?.year===x.sourceYear && /^https:\/\//.test(details?.programSource || '') && details?.programs?.some(program=>program.name===x.programName);
      }).slice(0,5);
      // Names of degree programs are supplied by the existing annual source, not free text.
      result.wishes=wishes.map(x=>({schoolId:x.schoolId,programName:x.programName,year:x.year,sourceYear:x.sourceYear}));
    }
    if(p.region)result.region=p.region;
  }
  if(/hoc phi|ngan sach|chi phi/.test(q)) {
    if(p.budgetMin!==null)result.budgetMin=p.budgetMin;
    if(p.budgetMax!==null)result.budgetMax=p.budgetMax;
    if(p.budgetMin!==null || p.budgetMax!==null)result.budgetUnit='VND/năm';
  }
  if(/truong|nganh|nguyen vong|hoc phi|ngan sach|chi phi|tuyen sinh|xet tuyen|ke hoach|buoc tiep/.test(q) && p.year)result.year=p.year;
  if(/buoc tiep|tiep theo|ke hoach/.test(q))result.progress={careers:(state.savedCareers || []).length,schools:(state.savedSchools || []).length,wishes:(state.wishes || []).length,holland:Boolean(holland)};
  return Object.keys(result).length>1?result:null;
}
