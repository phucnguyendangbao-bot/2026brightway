import policy from '../data/admissions-policy.js';
import schoolSources from '../data/school-admissions-sources.js';
const host = document.getElementById('policySourcesList');
const filter = document.getElementById('policyYearFilter');
const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render() {
  const docs = policy.documents.filter(doc => filter.value === 'all' || doc.policy_years.includes(filter.value));
  host.innerHTML = docs.map(doc => {
    const draft = doc.status === 'du_thao_chua_thi_hanh';
    const status = draft ? 'Dự thảo · chưa áp dụng' : doc.id === 'TT_74_2026' ? 'Áp dụng cho khóa từ 2027' : 'Đã ban hành · ' + doc.policy_year;
    return '<article class="policy-source"><span class="policy-status' + (draft ? ' draft' : '') + '">' + escape(status) +
      '</span><h3>' + escape(doc.number) + '</h3><p>' + escape(doc.name) + '</p><p>' + escape(doc.notes) +
      '</p><a href="' + escape(doc.source_url) + '" target="_blank" rel="noopener noreferrer">Văn bản chính thức ↗</a>' +
      (doc.reading_url || doc.backup_url ? ' · <a href="' + escape(doc.reading_url || doc.backup_url) + '" target="_blank" rel="noopener noreferrer">Bản đọc đối chiếu ↗</a>' : '') +
      '<small>Ban hành: ' + escape(doc.issued) + ' · Đối chiếu nguồn: ' + escape(doc.verified_at) + '</small></article>';
  }).join('');
}
filter.addEventListener('change', render);
render();
const schoolHost = document.getElementById('schoolSourcesList');
const schoolSearch = document.getElementById('schoolSourceSearch');
function renderSchoolSources() {
  const normalize = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d');
  const keyword = normalize(schoolSearch.value);
  const rows = schoolSources.universities.filter(row => normalize(row.name + ' ' + row.school_id).includes(keyword));
  schoolHost.innerHTML = rows.map(row => '<article class="policy-source school-source"><span class="policy-status">' +
    (row.source_status === 'confirmed_2026_source' ? '2026 · Đã xác nhận nguồn' : '2026 · Cần kiểm tra tài liệu đầy đủ') +
    '</span><h3>' + escape(row.name) + '</h3><p>' + escape(row.source_summary) + '</p><p>' + escape(row.review_note) +
    '</p><a href="' + escape(row.source_url) + '" target="_blank" rel="noopener noreferrer">Nguồn trường ↗</a> · <a href="' +
    escape(row.supplementary_url) + '" target="_blank" rel="noopener noreferrer">Bổ sung/phụ lục ↗</a><small>Kiểm tra: ' +
    row.checked_at + ' · Công thức: ' + (row.formula_status === 'verified_partial_formula' ? 'đã xác nhận thành phần' : 'cần đối chiếu theo ngành') + '</small></article>').join('') ||
    '<p>Không có trường khớp từ khóa.</p>';
}
schoolSearch.addEventListener('input', renderSchoolSources);
if (location.hash === '#school-sources') document.getElementById('school-sources').open = true;
renderSchoolSources();
