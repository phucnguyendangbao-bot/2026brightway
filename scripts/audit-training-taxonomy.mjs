import fs from 'node:fs';
import { buildUniversityCatalog } from '../assets/data/university-identities.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { classifyProgram, textKey } from '../assets/js/training-taxonomy.js';

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
const columns = ['schoolId','schoolName','sourceYear','sourceStatus','originalIndex','admissionCode','programName','track','campus','fieldCode','fieldName','groupCode','groupName','majorCode','majorName','classificationStatus','sameNameWithinSchool','sameMajorWithinSchool','sameNameAcrossSchools','manualReview'];
const cell = value => '"' + String(value ?? '').replace(/"/g,'""').replace(/^[\s]*([=+@-])/,'\'$1') + '"';
const records = rows.map(row => {
  const {school,details,index,program,taxonomy} = row;
  const nameKey = textKey(program?.name);
  return [school.id,school.name,details?.year || '',details?.programSourceStatus || (details?.programSource ? 'school-source' : 'missing-source'),index < 0 ? '' : index,
    program?.code || '',program?.name || '',program?.track || '',program?.campus || '',taxonomy?.fieldCode || '',taxonomy?.fieldName || '',
    taxonomy?.groupCode || '',taxonomy?.groupName || '',taxonomy?.majorCode || '',taxonomy?.majorName || '',taxonomy?.status || 'no-program-list',
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
