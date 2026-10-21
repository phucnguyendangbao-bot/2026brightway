import { uniqueSchools, normalizeWishes, moveWish, wishText, wishCsv, textKey, importLegacySchools } from './selection-model.js';
import { buildUniversityCatalog } from '../data/university-identities.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const state = () => window.BWFlow?.read() || {};
const profile = document.getElementById('my-choices');
const saved = () => uniqueSchools(state().savedSchools);
const wishes = () => normalizeWishes(state().wishes);
let query = '', city = '';

function renderFavorites() {
  const list = document.getElementById('mySavedSchools');
  if (!list) return;
  const all = saved();
  const select = document.getElementById('savedSchoolCity');
  const cities = [...new Set(all.map(item => item.city).filter(Boolean))].sort();
  if (city && !cities.includes(city)) city = '';
  select.innerHTML = '<option value="">Tất cả khu vực</option>' + cities.map(value => `<option ${value === city ? 'selected' : ''}>${esc(value)}</option>`).join('');
  const filtered = all.filter(item => (!city || city === item.city) && textKey(`${item.name} ${item.id} ${item.city}`).includes(textKey(query)));
  document.getElementById('savedSchoolCount').textContent = `${filtered.length}/${all.length} trường đã lưu`;
  list.innerHTML = filtered.length ? filtered.map(item => `<li><div><a href="page2.html?school=${encodeURIComponent(item.id)}">${esc(item.name || item.id)}</a><p>${esc(item.city || 'Chưa có địa điểm trong dữ liệu đã lưu')}</p></div><button type="button" data-unsave-school="${esc(item.id)}" aria-label="Bỏ lưu ${esc(item.name || item.id)}">Bỏ lưu</button></li>`).join('') : `<li>${all.length ? 'Không có trường khớp bộ lọc.' : 'Chưa lưu trường nào. Tìm trường và chọn “Lưu trường” để bắt đầu.'}</li>`;
}
function renderWishes() {
  const list = document.getElementById('myWishes');
  if (!list) return;
  const rows = wishes();
  document.getElementById('wishCount').textContent = `${rows.length} nguyện vọng dự kiến`;
  list.innerHTML = rows.length ? rows.map((item, index) => `<li data-wish-id="${esc(item.id)}"><span class="choice-priority" aria-label="Ưu tiên ${index + 1}">${index + 1}</span><div class="choice-detail"><h3>${esc(item.programName)}</h3><a href="page2.html?school=${encodeURIComponent(item.schoolId)}">${esc(item.schoolName)}</a><p>${item.programCode ? `Mã: ${esc(item.programCode)}` : 'Chưa có mã đã đối chiếu'}${item.track ? ` · ${esc(item.track)}` : ''}${item.campus ? ` · ${esc(item.campus)}` : ''}</p><p>Năm dự kiến: <strong>${item.year}</strong> · Dữ liệu nguồn: ${item.sourceYear}</p>${item.year !== item.sourceYear ? `<p class="choice-reference">Nguồn ${item.sourceYear} dùng tham khảo, chưa xác nhận mở tuyển năm ${item.year}.</p>` : ''}<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">Nguồn danh mục ngành ${item.sourceYear} ↗</a></div><div class="choice-actions"><button type="button" data-move-wish="-1" ${index === 0 ? 'disabled' : ''} aria-label="Tăng ưu tiên ${esc(item.programName)}">↑</button><button type="button" data-move-wish="1" ${index === rows.length - 1 ? 'disabled' : ''} aria-label="Giảm ưu tiên ${esc(item.programName)}">↓</button><button type="button" data-delete-wish aria-label="Xóa nguyện vọng ${esc(item.programName)}">Xóa</button></div></li>`).join('') : '<li>Chưa có nguyện vọng. Mở hồ sơ trường → Ngành đào tạo → Thêm nguyện vọng.</li>';
  document.getElementById('exportWishes').disabled = !rows.length;
  document.getElementById('exportWishesCsv').disabled = !rows.length;
}
function renderSummary() {
  const count = saved().length, wishCount = wishes().length;
  document.querySelectorAll('[data-choice-summary]').forEach(host => {
    host.innerHTML = `<a class="flow-primary" href="profile.html?tab=journey#my-choices">Nguyện vọng của tôi${wishCount ? ` (${wishCount})` : ''} →</a><p>${count || wishCount ? `Bạn đã lưu ${count} trường và ${wishCount} nguyện vọng dự kiến. ${wishCount ? 'Xem lại thứ tự và nguồn tuyển sinh.' : 'Chọn ngành trong hồ sơ trường để thêm nguyện vọng.'}` : 'Lưu trường yêu thích và sắp xếp ngành muốn tìm hiểu. Dùng ngay, không cần tài khoản.'}</p>`;
  });
}
// Ensure the existing home preview uses the same favorites as school search.
function renderHomePreview() {
  const host = document.getElementById('selectedSchoolsPreview');
  if (host) host.innerHTML = `<strong>${saved().length} trường yêu thích đã lưu</strong><p><a href="profile.html?tab=journey#my-choices">Xem danh sách và nguyện vọng →</a></p>`;
}
function init() {
  if (profile) {
    profile.innerHTML = `<div class="choices-heading"><div><span class="flow-kicker">LƯU TRÊN THIẾT BỊ NÀY</span><h2 id="myChoicesTitle">Nguyện vọng của tôi</h2><p>Danh sách để tìm hiểu và lập kế hoạch, chưa đăng ký nguyện vọng chính thức. Trường yêu thích và nguyện vọng được lưu riêng.</p></div><a href="page2.html?mode=major">Thêm ngành từ hồ sơ trường →</a></div><section aria-labelledby="savedSchoolsTitle"><h3 id="savedSchoolsTitle">Trường yêu thích</h3><div class="choices-filters"><label>Tìm trong trường đã lưu<input type="search" id="savedSchoolSearch" placeholder="Tên trường, mã hoặc địa điểm"></label><label>Khu vực<select id="savedSchoolCity"></select></label><a href="page2.html?saved=1">Tra cứu & so sánh trường đã lưu →</a></div><p id="savedSchoolCount" role="status"></p><ul id="mySavedSchools" class="choices-list"></ul></section><section aria-labelledby="wishListTitle"><div class="choices-heading"><h3 id="wishListTitle">Thứ tự nguyện vọng dự kiến</h3><button type="button" id="exportWishes">Xuất danh sách .txt</button></div><p>Thứ tự dưới đây do bạn sắp xếp. Có thể thêm nhiều lựa chọn; kiểm tra quy định áp dụng cho đúng năm khi đăng ký chính thức.</p><p id="wishCount" role="status"></p><ol id="myWishes" class="choices-list"></ol><p id="choiceStatus" role="status" aria-live="polite"></p></section>`;
    document.getElementById('exportWishes').insertAdjacentHTML('afterend', '<button type="button" id="exportWishesCsv">Xuất CSV</button>');
    profile.addEventListener('input', event => { if (event.target.id === 'savedSchoolSearch') { query = event.target.value; renderFavorites(); } });
    profile.addEventListener('change', event => { if (event.target.id === 'savedSchoolCity') { city = event.target.value; renderFavorites(); } });
    profile.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const id = button.closest('[data-wish-id]')?.dataset.wishId;
      if (button.dataset.unsaveSchool) window.BWFlow.save({ savedSchools: saved().filter(item => item.id !== button.dataset.unsaveSchool) });
      if (button.hasAttribute('data-delete-wish')) window.BWFlow.save({ wishes: wishes().filter(item => item.id !== id) });
      if (button.dataset.moveWish) {
        const rows = moveWish(wishes(), id, Number(button.dataset.moveWish));
        window.BWFlow.save({ wishes: rows });
        const row = [...profile.querySelectorAll('[data-wish-id]')].find(node => node.dataset.wishId === id);
        const focusTarget = row?.querySelector(`button[data-move-wish="${button.dataset.moveWish}"]:not(:disabled)`) || row?.querySelector('button:not(:disabled)');
        focusTarget?.focus();
        document.getElementById('choiceStatus').textContent = `Đã chuyển tới ưu tiên ${rows.findIndex(item => item.id === id) + 1}.`;
      }
      if (button.id === 'exportWishes' || button.id === 'exportWishesCsv') {
        const csv = button.id === 'exportWishesCsv';
        const url = URL.createObjectURL(new Blob([csv ? wishCsv(wishes()) : wishText(wishes())], { type:csv ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' }));
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = csv ? 'brightway-nguyen-vong.csv' : 'brightway-nguyen-vong.txt'; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        document.getElementById('choiceStatus').textContent = 'Đã xuất danh sách dự kiến kèm năm và nguồn.';
      }
    });
  }
  const update = () => { renderFavorites(); renderWishes(); renderSummary(); renderHomePreview(); };
  window.addEventListener('bw:journey-change', update);
  update();
  profile?.setAttribute('aria-busy', 'false');
  // Import the old home picker once per recognized code. Keep its original
  // storage intact, including schools that cannot yet be resolved reliably.
  let legacy = [];
  try { legacy = JSON.parse(window.BWFlow.storage.get('bw_schools_selected') || '[]'); } catch { /* preserve original */ }
  if (!document.getElementById('savedSchoolOnly') && Array.isArray(legacy) && legacy.some(code => !state().importedSchoolCodes?.includes(code))) {
    fetch('/assets/data/schools.json', {signal:AbortSignal.timeout(8000)}).then(response => {
      if (!response.ok) throw new Error('catalog unavailable');
      return response.json();
    }).then(raw => window.BWFlow.save(importLegacySchools(saved(), legacy, buildUniversityCatalog(raw).schools, state().importedSchoolCodes))).catch(() => {
      const host = document.createElement('p'); host.textContent = 'Chưa nhập được lựa chọn trường cũ. Dữ liệu cũ vẫn được giữ; mở tra cứu trường để thử lại.';
      (profile || document.querySelector('[data-choice-summary]'))?.append(host);
    });
  }
  if (location.hash === '#my-choices') requestAnimationFrame(() => profile?.scrollIntoView());
}
if (document.readyState === 'loading' || !window.BWFlow) document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
