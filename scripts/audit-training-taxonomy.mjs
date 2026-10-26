import fs from 'node:fs';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { schoolProgramDetails } from '../assets/data/school-programs-2024-2026.js';
import { schoolProfileDetails } from '../assets/data/school-profile-details.js';
import { MOET_UNDERGRADUATE_CATALOG } from '../assets/data/moet-undergraduate-catalog-2022.js';
import { MOET_UNDERGRADUATE_PILOT_2024 } from '../assets/data/moet-undergraduate-pilot-2024.js';
import { MOET_UNDERGRADUATE_CATALOG_2026 } from '../assets/data/moet-undergraduate-catalog-2026.js';
import { MOET_CATALOG_TRANSITIONS_2026 } from '../assets/data/moet-catalog-transition-2026.js';
import * as integratedPrograms from '../assets/data/integrated-programs-2026.js';
import { canDisplayProgramScores } from '../assets/js/score-provenance.js';
import { classifyProgram, textKey, transitionForCode } from '../assets/js/training-taxonomy.js';

const raw = JSON.parse(fs.readFileSync(new URL('../assets/data/schools.json', import.meta.url)));
const schools = buildUniversityCatalog(raw).schools.filter(school => school.identity.entity_kind === 'university');
const rows = schools.flatMap(school => {
  const details = detailsForSchool(school.id);
  if (!details?.programs?.length) return [{school,details,index:-1,program:null,taxonomy:null}];
  return details.programs.map((program,index) => ({school,details,index,program,taxonomy:classifyProgram(program)}));
});
const bySchoolName = new Map();
const bySchoolMajor = new Map();
const byName = new Map();
for (const row of rows.filter(row => row.program)) {
  const schoolName = `${row.school.id}|${textKey(row.program.name)}`;
  bySchoolName.set(schoolName,(bySchoolName.get(schoolName) || 0)+1);
  if (row.taxonomy.majorCode) {
    const schoolMajor = `${row.school.id}|${row.taxonomy.majorCode}`;
    bySchoolMajor.set(schoolMajor,(bySchoolMajor.get(schoolMajor) || 0)+1);
  }
  const name = textKey(row.program.name);
  if (!byName.has(name)) byName.set(name,new Set());
  byName.get(name).add(row.school.id);
}
const columns = ['schoolId','schoolName','sourceYear','sourceStatus','originalIndex','admissionCode','programName','track','campus','fieldCode','fieldName','groupCode','groupName','majorCode','majorName','catalogDocument','classificationStatus','sameNameWithinSchool','sameMajorWithinSchool','sameNameAcrossSchools','manualReview'];
const cell = value => '"' + String(value ?? '').replace(/"/g,'""').replace(/^[\s]*([=+@-])/,'\'$1') + '"';
const records = rows.map(row => {
  const {school,details,index,program,taxonomy} = row;
  const nameKey = textKey(program?.name);
  return [school.id,school.name,details?.year || '',details?.programSourceStatus || (details?.programSource ? 'school-source' : 'missing-source'),index < 0 ? '' : index,
    program?.code || '',program?.name || '',program?.track || '',program?.campus || '',taxonomy?.fieldCode || '',taxonomy?.fieldName || '',
    taxonomy?.groupCode || '',taxonomy?.groupName || '',taxonomy?.majorCode || '',taxonomy?.majorName || '',taxonomy?.catalogDocument || '',taxonomy?.status || 'no-program-list',
    program ? (bySchoolName.get(`${school.id}|${nameKey}`) || 0)>1 : false,
    program && taxonomy.majorCode ? (bySchoolMajor.get(`${school.id}|${taxonomy.majorCode}`) || 0)>1 : false,
    program ? (byName.get(nameKey)?.size || 0)>1 : false,
    !program || taxonomy.needsVerification];
});
const output = new URL('../docs/training-taxonomy-audit-2026.csv', import.meta.url);
fs.writeFileSync(output,'\uFEFF'+[columns,...records].map(row => row.map(cell).join(',')).join('\r\n')+'\r\n','utf8');
const counts = Object.fromEntries([...new Set(rows.map(row => row.taxonomy?.status || 'no-program-list'))]
  .map(status => [status,rows.filter(row => (row.taxonomy?.status || 'no-program-list') === status).length]));
console.log(JSON.stringify({schools:schools.length,programRows:rows.filter(row=>row.program).length,counts,
  sameNameWithinSchool:[...bySchoolName.values()].filter(count=>count>1).length,
  sameMajorWithinSchool:[...bySchoolMajor.values()].filter(count=>count>1).length,
  sameNameAcrossSchools:[...byName.values()].filter(ids=>ids.size>1).length,
  output:output.pathname},null,2));

const issues = [];
const addIssue = (type, schoolId, originalIndex, current, proposed, evidence, status) =>
  issues.push({type,schoolId,originalIndex,current,proposed,evidence,status});
const programRows = rows.filter(row => row.program);
const byCode = new Map(), byNameCode = new Map();
for (const row of programRows) {
  const {school,details,index,program,taxonomy} = row;
  const reference = details.programSource || details.admissionSource || school.website || '';
  if (taxonomy.status === 'missing-code') addIssue('missing-code',school.id,index,
    `${program.name} · mã trống`,'Giữ mã trống; đối chiếu thông báo đúng trường/kỳ/cơ sở',reference,'cần xác minh thủ công');
  else if (taxonomy.status === 'unknown-code') addIssue('unlisted-code',school.id,index,
    `${program.code} · ${program.name}`,'Giữ mã gốc; đối chiếu mã xét tuyển riêng, quyết định mở ngành hoặc danh mục bổ sung',reference,'cần xác minh thủ công');
  else if (taxonomy.status === 'school-specific-code') addIssue('school-specific-code',school.id,index,
    `${program.code} · ${program.name}`,
    `Giữ mã xét tuyển riêng; ngành mẹ ${taxonomy.majorCode} · ${taxonomy.majorName} chỉ là tham chiếu`,
    `${reference} | ${taxonomy.catalogSource}`,'cần xác minh ánh xạ');
  else if (taxonomy.status === 'name-differs') addIssue('code-name-difference',school.id,index,
    `${program.code} · ${program.name}`,
    `Giữ tên trường; đối chiếu ngành chuẩn ${taxonomy.majorCode} · ${taxonomy.majorName}`,
    `${reference} | ${taxonomy.catalogSource}`,'cần xác minh thủ công');
  if (Number.isFinite(program.score) && !canDisplayProgramScores(details,details.year)) addIssue('cutoff-incomplete-provenance',school.id,index,
    `${program.code} · ${program.name} · ${program.score} · ${details.year}; phương thức=${details.scoreMethod || 'thiếu'}; thang=${details.scoreScale || 'thiếu'}`,
    'Giữ nguyên số gốc; ẩn khỏi UI cho đến khi xác minh phương thức, thang và điều kiện',
    details.scoreSource || reference,'đã ẩn trên UI; cần xác minh nguồn');
  if (program.code) {
    if (!byCode.has(program.code)) byCode.set(program.code,[]);
    byCode.get(program.code).push(row);
  }
  const key = textKey(program.name);
  if (!byNameCode.has(key)) byNameCode.set(key,[]);
  byNameCode.get(key).push(row);
}
for (const [code,group] of byCode) {
  const names = [...new Set(group.map(row => textKey(row.program.name)))];
  if (names.length < 2) continue;
  addIssue('same-code-different-names',group.map(row=>row.school.id).join('|'),'',
    `${code}: ${[...new Set(group.map(row => row.program.name))].join(' | ')}`,
    'Giữ từng tên chương trình; xác minh ngành chuẩn và cơ sở theo nguồn trường',
    [...new Set(group.map(row => row.details.programSource).filter(Boolean))].join(' | '),'biến thể được bảo toàn; cần đối chiếu');
}
for (const [name,group] of byNameCode) {
  const codes = [...new Set(group.map(row => row.program.code).filter(Boolean))];
  if (codes.length < 2) continue;
  addIssue('same-name-different-codes',group.map(row=>row.school.id).join('|'),'',
    `${group[0].program.name}: ${codes.join(' | ')}`,
    'Giữ các bản ghi theo trường, mã, chương trình và cơ sở; không gộp theo tên',
    [...new Set(group.map(row => row.details.programSource).filter(Boolean))].join(' | '),'biến thể được bảo toàn; cần đối chiếu');
}
const knownIds = new Set(schools.map(school => school.id));
for (const id of new Set([...Object.keys(schoolProgramDetails),...Object.keys(schoolProfileDetails)])) {
  if (!knownIds.has(id)) addIssue('orphan-school-program',id,'',id,'Xác minh trường hoặc bỏ liên kết khỏi UI sau khi đối chiếu','assets/data/schools.json','cần xác minh');
}
for (const row of rows.filter(row => !row.program)) addIssue('no-program-list',row.school.id,'',
  'Chưa có danh sách chương trình trong hồ sơ',
  'Nhập từ đề án tuyển sinh đúng năm; không sao chép từ trường khác',
  row.details?.programSource || row.school.website || '', 'cần bổ sung nguồn');
for (const entry of MOET_UNDERGRADUATE_CATALOG_2026.entries.filter(entry => entry.listedGroupCode)) addIssue(
  'catalog-group-conflict','','',`${entry.code} · ${entry.name}: phụ lục in trong nhóm ${entry.listedGroupCode}, tiền tố mã là ${entry.code.slice(0,4)}`,
  'Giữ mã và đánh dấu cần xác minh; chưa tự sửa nhóm hoặc mã',MOET_UNDERGRADUATE_CATALOG_2026.source,'cần xác minh văn bản gốc');
for (const code of new Set(MOET_CATALOG_TRANSITIONS_2026.rows.map(row => row.oldCode))) {
  const transition = transitionForCode(code);
  if (transition.status !== 'ambiguous') continue;
  addIssue('ambiguous-2027-transition','','',`${code} → ${transition.matches.map(row=>row.newCode).join(' | ')}`,
    'Không tự chọn mã 2027; yêu cầu ngành/chương trình và quyết định cập nhật của trường',
    MOET_CATALOG_TRANSITIONS_2026.source,'cần xác minh thủ công');
}
const issueColumns = ['type','schoolId','originalIndex','current','proposed','evidence','status'];
const issueOutput = new URL('../docs/training-taxonomy-issues-2026-2027.csv', import.meta.url);
fs.writeFileSync(issueOutput,'\uFEFF'+[issueColumns,...issues.map(issue => issueColumns.map(column => issue[column]))]
  .map(record => record.map(cell).join(',')).join('\r\n')+'\r\n','utf8');
const oldMajors = MOET_UNDERGRADUATE_CATALOG.entries.filter(entry => entry.code.length === 7);
const linkedMajors = new Set(programRows.map(row => row.taxonomy.majorCode).filter(Boolean));
const summary = {
  schools:schools.length,schoolsWithPrograms:new Set(programRows.map(row=>row.school.id)).size,
  programs:programRows.length,uniqueProgramNames:new Set(programRows.map(row=>textKey(row.program.name))).size,
  programSourceProfiles:Object.fromEntries([...new Set(programRows.map(row => row.details.programSourceStatus || 'school-source'))]
    .map(status => [status,new Set(programRows.filter(row => (row.details.programSourceStatus || 'school-source') === status).map(row=>row.school.id)).size])),
  integratedCalculatorProgramRows:Object.values(integratedPrograms).reduce((total,programs)=>total+programs.length,0),
  integratedCalculatorSchoolScopes:Object.keys(integratedPrograms).length,
  uniqueLinkedOfficialMajors:linkedMajors.size,
  officialMajorsWithoutProfileLink:oldMajors.filter(entry=>!linkedMajors.has(entry.code)).length,
  pilotMajors:MOET_UNDERGRADUATE_PILOT_2024.entries.filter(entry=>entry.code.length===7).length,
  pilotClassifiedPrograms:programRows.filter(row=>row.taxonomy.catalogDocument==='pilot-2024').length,
  pilotMajorsWithoutProfileLink:MOET_UNDERGRADUATE_PILOT_2024.entries.filter(entry=>entry.code.length===7&&!linkedMajors.has(entry.code)).length,
  legacyCutoffSchoolRecords:schools.filter(school=>school.cutoffScores).length,
  issueCounts:Object.fromEntries([...new Set(issues.map(issue=>issue.type))].map(type=>[type,issues.filter(issue=>issue.type===type).length])),
};
const summaryOutput = new URL('../docs/training-taxonomy-audit-summary.json', import.meta.url);
fs.writeFileSync(summaryOutput,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({summary,issues:issues.length,issueOutput:issueOutput.pathname},null,2));
