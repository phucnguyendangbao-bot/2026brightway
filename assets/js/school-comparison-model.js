// Read-only presentation of existing annual records; no ranking or score engine.
import { selectEditorialOpportunities } from './university-promotion-rules.js';

const https = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
};
const missing = () => ({text:'Chưa có dữ liệu đã xác minh cho năm này.'});
export function comparisonCells(school, details, source, {year = 2026, opportunities = [], now = Date.now()} = {}) {
  const annual = details?.year === year ? details : null;
  const programsSource = annual && !annual.programSourceStatus && https(annual.programSource);
  const programs = programsSource ? (annual.programs || []).filter(row => row?.name) : [];
  const admissionSource = source?.admission_year === year && https(source.source_url);
  const tuition = annual?.tuition;
  const scholarship = selectEditorialOpportunities(opportunities, [school], {schoolId:school.id, now}).filter(item => item.kind === 'scholarship');
  const scoreSource = annual && https(annual.scoreSource);
  // Compare only values with a named method and scale. Each school's scale is
  // kept separate; these are historic cutoffs, never admission predictions.
  const scores = scoreSource && annual.scoreMethod && Number.isFinite(annual.scoreScale)
    ? (annual.programs || []).filter(row => Number.isFinite(row.score)).map(row => row.score) : [];
  const format = value => new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(value);
  return {
    location: {text:school.city || 'Chưa có địa điểm trong hồ sơ.'},
    programs: programs.length ? {text:`${programs.length} ngành/chương trình · ${year}`, programs:programs.map(row => ({name:row.name,code:row.code || '',track:row.track || '',campus:row.campus || ''})), source:programsSource, action:'majors'} : missing(),
    tuition: tuition?.year === year && tuition.summary && https(tuition.source) ? {text:tuition.summary,source:https(tuition.source)} : missing(),
    scholarship: scholarship.length ? {text:'Nguồn học bổng đã đối chiếu; kiểm tra kỳ tuyển sinh và thời hạn tại trường.',links:scholarship.map(item => ({label:`${item.title} · ${item.availability === 'active' ? 'Đang trong thời gian công bố' : 'Tư liệu tham khảo, chưa xác nhận còn nhận hồ sơ'}`,url:item.sourceUrl}))} : missing(),
    admission: admissionSource ? {text:source.source_summary || `Thông tin tuyển sinh ${year} tại nguồn trường.`,source:admissionSource,reviewed:source.source_verified_at || source.checked_at || '',action:'admission'} : missing(),
    scores: scoreSource ? {text:scores.length ? `${format(Math.min(...scores))} – ${format(Math.max(...scores))} · năm ${year} · thang ${annual.scoreScale}. ${annual.scoreMethod}` : `Có thông báo điểm chuẩn ${year}; xem bảng gốc theo ngành và phương thức. Chưa có số liệu đủ điều kiện để so sánh.`,source:scoreSource,action:'scores'} : missing(),
    website: https(school.website) ? {text:school.name,source:https(school.website),sourceLabel:'Website chính thức'} : missing(),
  };
}
