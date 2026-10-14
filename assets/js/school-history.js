import { historyForSchool } from '../data/school-admissions-history.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const link = ({ label, url }) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;

export function renderSchoolHistory(id) {
  const record = historyForSchool(id, 2025);
  const body = record ? `
    <div class="school-history-heading"><h3>${escape(record.title)}</h3><span class="school-history-status">${record.source_status === 'provisional_methods' ? 'Có nội dung dự kiến' : record.source_status === 'linked_document' ? 'Có tài liệu chính thức' : 'Có nguồn chính thức'}</span></div>
    <p>${escape(record.summary)}</p>
    <p class="school-history-note">${escape(record.note)}</p>
    <div class="school-history-links">${record.links.map(link).join('')}</div>
    <p class="school-history-meta">Kiểm tra nguồn: ${record.checked_at} · Chưa nhập bảng điểm chuẩn/học phí chi tiết theo ngành.</p>
  ` : `
    <h3>Chưa bổ sung nguồn tuyển sinh 2025 cho trường này</h3>
    <p>Chưa có bản lưu trữ được đối chiếu. Dữ liệu 2026 không được dùng để thay thế thông tin 2025.</p>
  `;
  return `<div class="school-history-content">${body}<p class="school-history-disclaimer">Thông tin năm trước chỉ để tham khảo. Phương thức, điểm chuẩn và thời hạn cũ không tự áp dụng cho tuyển sinh 2026 hoặc 2027; không dùng để kết luận đỗ/trượt.</p></div>`;
}
