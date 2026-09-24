import fs from 'node:fs';

const FILE = 'e:/PROJECT 2026/AIYOUNGGURU-main/assets/data/jobs.json';
const raw = fs.readFileSync(FILE, 'utf8').replace(/^\uFEFF/, '');
const jobs = JSON.parse(raw);

function pickHolland(job) {
  const group = job.group || '';
  const text = ((job.name || '') + ' ' + (job.skills || []).join(' ')).toLowerCase();
  const set = new Set();

  if (group.includes('Nghệ thuật') || group.includes('Sáng tạo')) set.add('A');
  if (group.includes('Kỹ thuật') || group.includes('Vận hành') ||
      group.includes('Xây dựng') || group.includes('Thủ công') ||
      group.includes('Nông')) set.add('R');
  if (group.includes('Phân tích') || group.includes('Logic')) { set.add('I'); set.add('C'); }
  if (group.includes('Ngôn ngữ')) { set.add('S'); set.add('A'); }
  if (group.includes('Dịch vụ')) set.add('S');

  if (/lập trình|developer|engineer|kỹ sư|khoa học|dữ liệu|ai |machine|devops|network|sql/.test(text)) set.add('I');
  if (/sáng tạo|content|ca sĩ|diễn|nhiếp|đồ họa|thời trang|thiết kế|nội thất|kiến trúc|mỹ thuật|quay|dựng|composer|bếp trưởng/.test(text)) set.add('A');
  if (/quản lý|lãnh đạo|giám đốc|trưởng|marketing|bán hàng|kpi|kinh doanh|môi giới|broker|tuyển dụng|đào tạo/.test(text)) set.add('E');
  if (/giáo viên|dạy học|tư vấn|tâm lý|công tác xã hội|chăm sóc|điều dưỡng|bác sĩ|bệnh viện|hộ sinh|y tế/.test(text)) set.add('S');
  if (/số liệu|kế toán|accounting|audit|tax|tài chính|excel|sql/.test(text)) set.add('C');
  if (/sửa chữa|hàn|thợ|may|mộc|cơ khí|ô tô|điện|thi công|công trường|nông trại|chăn nuôi/.test(text)) set.add('R');
  if (/hàng không|phi công|kiểm soát|quân đội|cảnh sát|pccc/.test(text)) { set.add('R'); set.add('C'); }

  if (set.size === 0) set.add('I');
  return Array.from(set).slice(0, 3);
}

const enriched = jobs.map(j => ({ ...j, holland: pickHolland(j) }));
fs.writeFileSync(FILE, JSON.stringify(enriched, null, 2));

console.log('Enriched', enriched.length, 'jobs');
const dist = {};
enriched.forEach(j => j.holland.forEach(c => { dist[c] = (dist[c] || 0) + 1; }));
console.log('Distribution:', dist);

// Sample
console.log('\nSamples:');
['Bác sĩ đa khoa', 'Lập trình viên / Phát triển phần mềm', 'Nhà thiết kế thời trang',
 'Phi công', 'Giáo viên ngoại ngữ', 'Kế toán', 'Đầu bếp'].forEach(name => {
  const j = enriched.find(x => x.name === name);
  if (j) console.log(' -', j.name, '→', j.holland);
});
