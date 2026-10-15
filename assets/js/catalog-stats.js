import { buildUniversityCatalog } from '../data/university-identities.js';
async function load() {
  const elements = [...document.querySelectorAll('[data-catalog-count]')];
  try {
    const response = await fetch('/assets/data/schools.json',{signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Không tải được danh sách');
    const { stats } = buildUniversityCatalog(await response.json());
    elements.forEach(el => { el.textContent = String(stats.universities); });
    const note = document.getElementById('catalogCountNote');
    if (note) note.textContent = `Dữ liệu trường: ${stats.universities} hồ sơ đại học · ${stats.systems} đại học vùng thống kê riêng · ${stats.unresolved} bản ghi cần xác minh; không đồng nghĩa toàn bộ đề án đã được xác minh.`;
  } catch {
    elements.forEach(el => { el.textContent = '—'; });
    const note = document.getElementById('catalogCountNote');
    if (note) note.textContent = 'Chưa tải được số lượng trường. Mở trang tra cứu để thử lại; không hiển thị 0 thay cho lỗi tải.';
  }
}
load();
