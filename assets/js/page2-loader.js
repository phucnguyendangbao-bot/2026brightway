function showModuleError() {
  const status = document.getElementById('schoolCatalogStatus');
  status.textContent = 'Chưa tải được dữ liệu hoặc mã tra cứu trường/ngành. Lựa chọn đã lưu vẫn được giữ trên thiết bị.';
  document.getElementById('schoolCatalogCount').textContent = 'Chưa tải được';
  document.getElementById('mainContent').innerHTML = '<div class="p2-no-results">Không thể mở danh mục trường/ngành. <button type="button" id="retrySchoolModule">Thử lại</button><p><a href="profile.html?tab=journey#my-choices">Xem lựa chọn đã lưu</a></p></div>';
  document.getElementById('mainContent').setAttribute('aria-busy', 'false');
  document.getElementById('retrySchoolModule').addEventListener('click', () => location.reload());
}
// A stalled module request must also offer recovery, not only rejected imports.
const moduleTimer = setTimeout(showModuleError, 8000);
import('./page2.js?v=20261026-taxonomy').then(() => clearTimeout(moduleTimer)).catch(() => {
  clearTimeout(moduleTimer);
  showModuleError();
});
