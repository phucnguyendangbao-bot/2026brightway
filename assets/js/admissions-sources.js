import policy from '../data/admissions-policy.js';
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
