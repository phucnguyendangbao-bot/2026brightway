// Read-only audit of editorial CMS suggestions. Does not modify Supabase.
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../assets/js/supabase-client.js', import.meta.url),'utf8');
const url = /url:\s*'([^']+)'/.exec(source)?.[1];
const key = /anonKey:\s*'([^']+)'/.exec(source)?.[1];
if (!url || !key) throw new Error('Supabase public read configuration unavailable');
const response = await fetch(`${url}/rest/v1/majors?select=slug,name_vi,top_universities`,{
  headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000),
});
if (!response.ok) throw new Error(`CMS read failed: HTTP ${response.status}`);
const majors = await response.json();
if (!Array.isArray(majors)) throw new Error('Unexpected CMS response');
const columns = ['topicSlug','topicName','suggestedSchool','current','proposed','evidence','status'];
const issueRows = majors.flatMap(major => (Array.isArray(major.top_universities) ? major.top_universities : [])
  .filter(school => typeof school === 'string' && school.trim()).map(school => [
    major.slug,major.name_vi,school,
    `CMS gợi ý ${school} cho chủ đề ${major.name_vi}`,
    'Chỉ gắn liên kết tuyển sinh sau khi đối chiếu trường, chương trình, mã và năm; hiện giữ như gợi ý biên tập',
    `Supabase public.majors slug=${major.slug}; chưa có nguồn tuyển sinh theo từng liên kết`,
    'chưa xác minh liên kết trường–ngành',
  ]));
const cell = value => '"'+String(value ?? '').replace(/"/g,'""').replace(/^[\s]*([=+@-])/,'\'$1')+'"';
fs.writeFileSync(new URL('../docs/training-taxonomy-cms-links-2026.csv',import.meta.url),
  '\uFEFF'+[columns,...issueRows].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n');
console.log(JSON.stringify({cmsTopics:majors.length,editorialSchoolSuggestions:issueRows.length,
  verifiedAdmissionLinks:0,mode:'read-only'}));
