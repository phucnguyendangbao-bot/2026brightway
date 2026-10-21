import { textKey, uniqueSchools, normalizeWishes, wishKey } from './selection-model.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { relatedMajorNames } from './career-pathways.js';

export const PROFILE_VERSION = 1;
export const GROUPS = ['Ngôn ngữ','Phân tích – Logic','Nghệ thuật – Sáng tạo','Kỹ thuật – Vận hành','Xây dựng – Thủ công','Dịch vụ','Nông – Lâm – Thủy sản'];
export const REGIONS = ['TP.HCM','Hà Nội','Đà Nẵng','Cần Thơ','Đồng Tháp','Huế','Nha Trang','Bình Định'];
export const SUBJECTS = ['Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học','Lịch sử','Địa lí','Giáo dục kinh tế và pháp luật','Tin học','Công nghệ'];
const list = value => Array.isArray(value) ? value : [];
const pick = (value, options, fallback = '') => options.includes(value) ? value : fallback;
const money = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2e9 ? value : null;
const unique = values => [...new Set(values)];
export function normalizePersonalization(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const supported = source.version === PROFILE_VERSION;
  if (!supported) return {version:PROFILE_VERSION,enabled:false,waybiSharing:false,metricsConsent:false,grade:'',year:null,groups:[],region:'',regionMode:'soft',budgetMin:null,budgetMax:null,budgetMode:'soft',subjects:[],unsupported:Boolean(value)};
  const min = money(source.budgetMin), max = money(source.budgetMax);
  return {version:PROFILE_VERSION,enabled:source.enabled === true,waybiSharing:source.enabled === true && source.waybiSharing === true,metricsConsent:source.enabled === true && source.metricsConsent === true,
    grade:pick(source.grade,['10','11','12','other']),year:Number.isInteger(source.year) && source.year >= 2026 && source.year <= 2035 ? source.year : null,
    groups:unique(list(source.groups).filter(x=>GROUPS.includes(x))),region:pick(source.region,REGIONS),regionMode:pick(source.regionMode,['soft','required'],'soft'),
    budgetMin:min !== null && max !== null && min > max ? null : min,budgetMax:min !== null && max !== null && min > max ? null : max,budgetMode:pick(source.budgetMode,['soft','required'],'soft'),
    subjects:unique(list(source.subjects).filter(x=>SUBJECTS.includes(x))),unsupported:false};
}
export function profileErrors(value) {
  const errors=[];
  for(const field of ['budgetMin','budgetMax']) if(value[field] !== null && value[field] !== undefined && money(value[field]) === null) errors.push('Học phí phải là số từ 0 đến 2.000 triệu đồng/năm.');
  if(money(value.budgetMin)!==null && money(value.budgetMax)!==null && value.budgetMin>value.budgetMax) errors.push('Ngân sách thấp nhất phải nhỏ hơn hoặc bằng mức cao nhất.');
  return unique(errors);
}
// Only structured, sourced annual amounts can support a numerical comparison.
// Historic free-text tuition estimates in schools.json are deliberately unused.
export function annualTuition(details, year) {
  const t=details?.tuition;
  if(!year || t?.year!==year || !/^https:\/\//.test(t.source || '') || !Number.isFinite(t.annualMinVnd) || !Number.isFinite(t.annualMaxVnd) || t.annualMinVnd<0 || t.annualMaxVnd<t.annualMinVnd) return null;
  return t;
}
export function schoolAssessment(school, profile, details) {
  const p=normalizePersonalization(profile), reasons=[], unknown=[], outside=[];
  if(p.region) {
    const cities=String(school.city || '').split('/').map(textKey).filter(Boolean);
    if(!cities.length) unknown.push('Chưa có địa điểm đã đối chiếu.');
    else if(!cities.includes(textKey(p.region))) (p.regionMode==='required'?outside:unknown).push(`Địa điểm trong hồ sơ khác ${p.region}.`);
    else if(cities.length>1) unknown.push(`Trường có nhiều cơ sở; cần xác minh ngành tại ${p.region}.`);
    else reasons.push(`Địa điểm trong hồ sơ: ${p.region}.`);
  }
  if(p.budgetMin!==null || p.budgetMax!==null) {
    const tuition=annualTuition(details,p.year);
    if(!tuition) unknown.push(`Chưa có học phí theo năm${p.year?' '+p.year:''} đủ dữ liệu để so ngân sách; cần kiểm tra tại trường.`);
    else if((p.budgetMax!==null && tuition.annualMinVnd>p.budgetMax) || (p.budgetMin!==null && tuition.annualMaxVnd<p.budgetMin)) {
      (p.budgetMode==='required'?outside:unknown).push('Khoảng học phí đã có nguồn nằm ngoài ngân sách bạn khai báo.');
    } else if((p.budgetMax!==null && tuition.annualMaxVnd>p.budgetMax) || (p.budgetMin!==null && tuition.annualMinVnd<p.budgetMin)) unknown.push('Khoảng học phí chỉ giao một phần với ngân sách; cần chọn đúng chương trình.');
    else reasons.push(`Khoảng học phí có nguồn nằm trong ngân sách · năm ${p.year}.`);
  }
  const requiredUnknown=(p.region && p.regionMode==='required' && unknown.some(x=>/địa điểm|cơ sở/.test(x))) || ((p.budgetMin!==null || p.budgetMax!==null) && p.budgetMode==='required' && unknown.some(x=>/học phí/.test(x)));
  return {reasons,unknown,outside,status:outside.length?'outside':requiredUnknown?'unknown':'explore'};
}
export function recommend({state={},profile=state.personalization,holland='',jobs=[],schools=[],details=detailsForSchool}={}) {
  const p=normalizePersonalization(profile);
  if(!p.enabled)return {careers:[],schools:[],unknown:[],outside:[],notices:[]};
  const savedCareerNames=list(state.savedCareers).map(x=>x.name);
  const code=/^[RIASEC]{3}$/.test(holland) && new Set(holland).size===3?holland:'';
  const careers=jobs.map(job=>{
    const reasons=[];
    if(savedCareerNames.includes(job.name))reasons.push('Bạn đã lưu nghề này.');
    const overlap=[...code].filter(c=>list(job.holland).includes(c));
    if(overlap.length)reasons.push(`Có nhóm sở thích Holland ${overlap.join(', ')} trong mã ${code}.`);
    if(p.groups.includes(job.group))reasons.push(`Thuộc nhóm lĩnh vực bạn quan tâm: ${job.group}.`);
    return {job,reasons};
  }).filter(x=>x.reasons.length).sort((a,b)=>b.reasons.length-a.reasons.length || a.job.name.localeCompare(b.job.name,'vi'));
  const majors=unique([...list(state.savedMajors).map(x=>x.name),...normalizeWishes(state.wishes).map(x=>x.programName),...careers.slice(0,12).flatMap(x=>relatedMajorNames(x.job))].filter(x=>typeof x==='string'));
  const savedIds=uniqueSchools(state.savedSchools).map(x=>x.id);
  const buckets={schools:[],unknown:[],outside:[]};
  for(const school of schools) {
    const d=details(school.id), assessment=schoolAssessment(school,p,d);
    const programs=d?.year===2026 && !d.programSourceStatus && /^https:\/\//.test(d.programSource || '') ? list(d.programs).filter(x=>majors.some(name=>textKey(name)===textKey(x.name))) : [];
    const reasons=[...assessment.reasons];
    if(savedIds.includes(school.id))reasons.push('Bạn đã lưu trường này.');
    if(programs.length)reasons.push(`Có ngành trong danh sách quan tâm/đối chiếu nghề: ${unique(programs.map(x=>x.name)).slice(0,3).join(', ')} · nguồn ${d.year}, cần kiểm tra năm đăng ký.`);
    const entry={school,...assessment,reasons,programs,programSource:programs.length?d.programSource:''};
    if(assessment.status==='outside')buckets.outside.push(entry);
    else if(assessment.status==='unknown')buckets.unknown.push(entry);
    else buckets.schools.push(entry);
  }
  // No sponsor, historical score, or inferred aptitude enters this order.
  for(const rows of Object.values(buckets))rows.sort((a,b)=>b.reasons.length-a.reasons.length || a.school.name.localeCompare(b.school.name,'vi'));
  return {careers,...buckets,notices:[...(!p.year?['Chưa chọn năm dự kiến; không thể xác nhận học phí hoặc điều kiện theo năm.']:[]),...(majors.length?[]:['Chưa có đối chiếu ngành đáng tin cậy từ các nghề hiện chọn. Bạn vẫn có thể tìm mọi ngành trong thư viện.'])]};
}
export function wishReview(state, schools, details=detailsForSchool) {
  const p=normalizePersonalization(state.personalization), raw=list(state.wishes), warnings=[];
  const keys=raw.filter(x=>x && typeof x.schoolId==='string').map(wishKey);
  if(new Set(keys).size<keys.length)warnings.push('Có nguyện vọng trùng trường, ngành, chương trình và năm trong dữ liệu lưu; danh sách chỉ hiển thị một bản.');
  for(const wish of normalizeWishes(raw)) {
    const prefix=`${wish.schoolName} — ${wish.programName}: `;
    if(wish.year!==wish.sourceYear)warnings.push(prefix+`nguồn ${wish.sourceYear} dùng tham khảo, cần xác minh quy định ${wish.year}.`);
    else warnings.push(prefix+`đọc lại nguồn ${wish.sourceYear} và điều kiện của đúng chương trình trước khi đăng ký.`);
    if(p.enabled && p.year && wish.year!==p.year)warnings.push(prefix+`năm dự kiến ${wish.year} khác hồ sơ ${p.year}; bạn tự kiểm tra và chỉnh lựa chọn.`);
    if(p.enabled && (p.budgetMin!==null || p.budgetMax!==null)) {
      const school=schools.find(x=>x.id===wish.schoolId) || {id:wish.schoolId};
      const assessment=schoolAssessment(school,{...p,year:wish.year},details(wish.schoolId));
      for(const note of [...assessment.unknown,...assessment.outside].filter(x=>/học phí/.test(x)))warnings.push(prefix+note);
    }
  }
  return warnings;
}
export function nextActions(state, holland='') {
  const actions=[];
  if(!holland && !state.skipHolland)actions.push({text:'Khám phá sở thích hoặc bỏ qua Holland',href:'holland.html'});
  if(!list(state.savedCareers).length && !list(state.savedMajors).length)actions.push({text:'Lưu một nghề hoặc tìm ngành quan tâm',href:'careers-holland.html'});
  if(!list(state.savedSchools).length)actions.push({text:'Tìm và lưu một trường để đối chiếu',href:'page2.html?mode=major'});
  if(!normalizeWishes(state.wishes).length)actions.push({text:'Thêm ngành vào nguyện vọng dự kiến',href:'page2.html?mode=major'});
  else actions.push({text:'Kiểm tra năm, nguồn và thứ tự nguyện vọng',href:'profile.html?tab=journey#my-choices'});
  for(const task of list(state.tasks).filter(x=>x && !x.done).slice(0,3))actions.push({text:task.text,href:'profile.html?tab=journey#action-plan'});
  return actions;
}
