import sourceRegistry from '../data/school-admissions-sources.js';
import { buildUniversityCatalog, canonicalSchoolId, REVIEWED_AT } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { historyForSchool } from '../data/school-admissions-history.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const formatScore = value => Number.isFinite(value)
  ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
  : '';
const officialLink = (url, label, className = '') => {
  if (!url || !/^https:\/\//i.test(url)) return '';
  return `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`;
};
const fieldLabels = {
  it: 'Công nghệ thông tin', engineering: 'Kỹ thuật – Công nghệ', science: 'Khoa học tự nhiên',
  medicine: 'Y khoa – Sức khỏe', agriculture: 'Nông nghiệp – Thủy sản', business: 'Kinh tế – Quản trị',
  social: 'Xã hội – Nhân văn', education: 'Sư phạm – Giáo dục', private: 'Tư thục – Quốc tế', other: 'Khác',
};
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const dialog = document.getElementById('schoolDialog');
let schools = [];
let filteredSchools = [];
let activeSchool = null;
let activeTab = 'majors';
let activeYear = 2026;
let searchTimer;

const sourceForSchool = id => sourceRegistry.universities.find(row => row.school_id === canonicalSchoolId(id));

function renderSidebar(items) {
  if (!sidebar) return;
  const groups = new Map();
  items.forEach(school => {
    const field = school.fields?.[0] || 'other';
    if (!groups.has(field)) groups.set(field, []);
    groups.get(field).push(school);
  });
  const links = [...groups].sort(([first], [second]) =>
    Object.keys(fieldLabels).indexOf(first) - Object.keys(fieldLabels).indexOf(second)
  ).map(([field, group]) => `
    <div class="p2-sidebar-field-title">${escapeHtml(fieldLabels[field] || fieldLabels.other)}</div>
    ${group.map(school => `
      <a href="#${escapeHtml(school.id)}" data-action="highlight-section" data-school-id="${escapeHtml(school.id)}" data-id="${escapeHtml(school.id)}" class="p2-sidebar-school">
        <span class="p2-sidebar-school-text"><span class="p2-sidebar-school-name">${escapeHtml(school.short || school.name)}</span><span class="p2-sidebar-school-city">${escapeHtml(school.city)}</span></span>
      </a>`).join('')}
  `).join('');
  sidebar.innerHTML = `<div class="p2-sidebar-title">Phương thức xét tuyển theo trường</div>${links}${items.length ? '' : '<p class="p2-sidebar-empty">Không có trường phù hợp.</p>'}`;
}

function renderSchools(items) {
  if (!mainContent) return;
  if (!items.length) {
    mainContent.innerHTML = '<div class="p2-no-results">Không tìm thấy trường phù hợp. Hãy thử tên viết tắt hoặc thành phố khác.</div>';
    return;
  }
  mainContent.innerHTML = items.map(school => {
    const details = detailsForSchool(school.id);
    const source = sourceForSchool(school.id);
    const subtitle = source?.source_summary || 'Mở hồ sơ để xem nguồn tuyển sinh của trường và tình trạng dữ liệu hiện có.';
    return `<section class="school-section" id="${escapeHtml(school.id)}">
      <div class="school-card-top">
        <button type="button" class="school-icon" id="icon-${escapeHtml(school.id)}" data-action="open-school" data-school-id="${escapeHtml(school.id)}" aria-label="Xem ngành, điểm chuẩn và đề án tuyển sinh của ${escapeHtml(school.name)}"></button>
        <div class="school-card-identity">
          <span class="school-card-kicker">${escapeHtml(school.short || 'TRƯỜNG ĐẠI HỌC')} · ${escapeHtml(school.city)}</span>
          <h2 class="school-name">${escapeHtml(school.name)}</h2>
        </div>
      </div>
      <span class="school-card-status ${details?.programs?.length ? 'school-card-status-ready' : ''}">${details?.programs?.some(program => Number.isFinite(program.score)) ? 'Có ngành và điểm chuẩn 2026' : details?.programs?.length ? `Có ${details.programs.length} ngành 2026` : details?.scoreSource ? 'Có nguồn điểm chuẩn' : source ? 'Có nguồn tuyển sinh' : 'Đang bổ sung nguồn'}</span>
      <p class="school-card-description">${escapeHtml(subtitle)}</p>
      <div class="school-card-bottom">
        <span>${school.identity.entity_kind === 'university_system' ? 'Đại học vùng' : source ? `Nguồn tuyển sinh ${source.admission_year}` : 'Hồ sơ trường'}</span>
        <button type="button" class="school-card-open" data-action="open-school" data-school-id="${escapeHtml(school.id)}">Xem hồ sơ <span aria-hidden="true">→</span></button>
      </div>
    </section>`;
  }).join('');
  items.forEach(school => renderLogo(school));
}

function renderLogo(school) {
  const host = document.getElementById(`icon-${school.id}`);
  if (!host) return;
  const logo = window.UNILogo?.(school.short || school.name);
  const sources = [school.logoUrl, logo?.logo, logo?.logoAlt].filter(url =>
    typeof url === 'string' && (/^assets\/images\/logos\//.test(url) || /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(url))
  );
  let position = 0;
  const fallback = () => {
    host.innerHTML = window.UNILogoSvg?.(school.short || school.name, { size: 60 }) || `<span class="school-icon-fallback">${escapeHtml(school.short || school.name.slice(0, 2))}</span>`;
  };
  if (!sources.length) { fallback(); return; }
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'lazy';
  image.onerror = () => {
    position += 1;
    if (position < sources.length) image.src = sources[position];
    else fallback();
  };
  image.src = sources[position];
  host.appendChild(image);
}

function renderPrograms(school, details) {
  if (!details?.programs?.length) return `<div class="school-dialog-empty">
    <h3>Chưa nhập danh sách ngành ${activeYear}</h3>
    <p>Chưa xác minh được bảng ngành theo đúng năm, cơ sở và chương trình. Không dùng danh sách của năm khác để thay thế.</p>
    ${officialLink(details?.admissionSource || (activeYear === 2026 ? sourceForSchool(school.id)?.source_url : historyForSchool(school.id, activeYear)?.links[0]?.url), `Xem nguồn năm ${activeYear}`, 'school-dialog-link')}
  </div>`;
  const hasScores = details.programs.some(program => Number.isFinite(program.score));
  const hasTracks = details.programs.some(program => program.track);
  const hasCombinations = details.programs.some(program => program.combination);
  const hasQuotas = details.programs.some(program => Number.isFinite(program.quota));
  return `<p class="school-dialog-lead"><strong>${details.programs.length} ngành/chương trình</strong> trong dữ liệu tuyển sinh ${details.year}.${hasScores ? ' Điểm chuẩn cùng năm nằm ở cột cuối.' : ''}</p>
    ${details.programNote ? `<p class="school-program-note">${escapeHtml(details.programNote)}</p>` : ''}
    <div class="school-program-table-wrap"><table class="school-program-table"><thead><tr><th>Mã xét tuyển</th><th>Ngành / chương trình</th>${hasTracks ? '<th>Phân loại</th>' : ''}${hasQuotas ? '<th>Chỉ tiêu dự kiến</th>' : ''}${hasCombinations ? '<th>Tổ hợp trích</th>' : ''}${hasScores ? `<th>Điểm chuẩn ${details.year}</th>` : ''}</tr></thead><tbody>
    ${details.programs.map(program => `<tr><td>${program.code ? escapeHtml(program.code) : '<span class="school-program-code-missing">Chưa công bố</span>'}</td><td>${escapeHtml(program.name)}</td>${hasTracks ? `<td>${escapeHtml(program.track || '')}</td>` : ''}${hasQuotas ? `<td>${Number.isFinite(program.quota) ? escapeHtml(program.quota) : ''}</td>` : ''}${hasCombinations ? `<td>${escapeHtml(program.combination || '')}</td>` : ''}${hasScores ? `<td>${Number.isFinite(program.score) ? `<strong>${escapeHtml(formatScore(program.score))}</strong>` : ''}</td>` : ''}</tr>`).join('')}
    </tbody></table></div>
    ${details.scoreMethod ? `<p class="school-dialog-footnote">${escapeHtml(details.scoreMethod)}. Chọn đúng cơ sở và chương trình khi đăng ký.</p>` : ''}
    ${officialLink(details.programSource, details.programSourceLabel || 'Danh sách ngành trên trang trường', 'school-dialog-link')}
    ${(details.supplementarySources || []).map(source => officialLink(source.url, source.label, 'school-dialog-link')).join('')}`;
}

function renderScores(school, details) {
  const programScores = details?.programs?.filter(program => Number.isFinite(program.score)).map(program => program.score) || [];
  if (programScores.length) {
    const minimum = Math.min(...programScores);
    const maximum = Math.max(...programScores);
    const scoreRange = minimum === maximum ? formatScore(minimum) : `${formatScore(minimum)} – ${formatScore(maximum)}`;
    return `<div class="school-score-summary"><span>Điểm chuẩn ${details.year}</span><strong>${escapeHtml(scoreRange)}</strong><small>${escapeHtml(details.scoreMethod)}</small></div>
      ${renderPrograms(school, details)}
      ${details.scoreSource === details.programSource ? '' : officialLink(details.scoreSource, 'Thông báo điểm chuẩn gốc', 'school-dialog-link')}`;
  }
  if (details?.score) return `<div class="school-score-summary"><span>Điểm chuẩn ${activeYear}</span><strong>${escapeHtml(details.score)}</strong><small>${escapeHtml(details.scoreMethod)}</small></div>
    ${details.scoreNote ? `<p class="school-dialog-footnote">${escapeHtml(details.scoreNote)}</p>` : ''}
    ${officialLink(details.scoreSource, 'Thông báo điểm chuẩn gốc', 'school-dialog-link')}`;
  if (details?.scoreSource) return `<div class="school-dialog-empty"><h3>Trường đã công bố điểm chuẩn ${details.year}</h3>
    <p>Bảng điểm được đăng dưới dạng hình hoặc tài liệu. Hãy xem bảng gốc để đối chiếu đúng ngành, chương trình và phương thức; chưa nhập số lẻ chưa xác minh vào hệ thống.</p>
    ${officialLink(details.scoreSource, 'Mở bảng điểm chuẩn chính thức', 'school-dialog-link')}</div>`;
  const history = historyForSchool(school.id, activeYear);
  const scoreLink = history?.links.find(link => /điểm|kết quả/i.test(link.label));
  return `<div class="school-dialog-empty"><h3>Chưa nhập bảng điểm chuẩn ${activeYear}</h3>
    <p>Không dùng điểm tham khảo trong dữ liệu cũ hoặc điểm của năm khác làm điểm trúng tuyển. Hãy đối chiếu đúng phương thức và chương trình trên cổng trường.</p>
    ${officialLink(scoreLink?.url || details?.admissionSource || (activeYear === 2026 ? sourceForSchool(school.id)?.source_url : history?.links[0]?.url), `Xem nguồn năm ${activeYear}`, 'school-dialog-link')}
    <a class="school-dialog-link" href="resources.html?school=${encodeURIComponent(school.id)}">Xem tin tuyển sinh đã đối chiếu →</a></div>`;
}

function renderAdmission(school, details) {
  const source = activeYear === 2026 ? sourceForSchool(school.id) : null;
  const history = historyForSchool(school.id, activeYear);
  const links = activeYear === 2026
    ? [source?.source_url && { label: 'Nguồn tuyển sinh 2026', url: source.source_url }, source?.supplementary_url && { label: 'Tài liệu bổ sung', url: source.supplementary_url }].filter(Boolean)
    : [details?.admissionSource && { label: `Đề án/thông tin tuyển sinh ${activeYear}`, url: details.admissionSource }, ...(history?.links || []), details?.scoreSource && !history?.links.some(link => link.url === details.scoreSource) && { label: `Thông báo điểm chuẩn ${activeYear}`, url: details.scoreSource }].filter(Boolean);
  return `<div class="school-admission-panel">
    <div class="school-admission-year"><span>Năm tuyển sinh ${activeYear}</span><span>${links.length ? 'Có nguồn trường để đối chiếu' : 'Chưa có nguồn được đối chiếu'}</span></div>
    ${source ? `<h3>Thông tin từ nguồn tuyển sinh</h3><p>${escapeHtml(source.source_summary)}</p><p class="school-dialog-note">${escapeHtml(source.review_note)}</p>` : ''}
    ${history ? `<h3>${escapeHtml(history.title)}</h3><p>${escapeHtml(history.summary)}</p><p class="school-dialog-note">${escapeHtml(history.note)}</p>` : ''}
    ${!links.length ? '<p>Chưa có đề án hoặc thông báo tuyển sinh đúng năm được đối chiếu cho hồ sơ này.</p>' : ''}
    <div class="school-dialog-links">${links.map(link => officialLink(link.url, link.label, 'school-dialog-link')).join('')}</div>
    ${links.length ? '<small>Xem văn bản gốc để kiểm tra ngành, cơ sở, phương thức và chỉ tiêu; nguồn liên kết không xác nhận toàn bộ dữ liệu chi tiết.</small>' : officialLink(school.website, 'Trang chính thức của trường', 'school-dialog-link')}
  </div>`;
}

function renderDialog() {
  if (!activeSchool || !dialog) return;
  const details = detailsForSchool(activeSchool.id, activeYear);
  const tabs = [
    ['majors', 'Ngành đào tạo'], ['scores', 'Điểm chuẩn'], ['admission', 'Đề án tuyển sinh'],
  ];
  const body = activeTab === 'majors' ? renderPrograms(activeSchool, details)
    : activeTab === 'scores' ? renderScores(activeSchool, details) : renderAdmission(activeSchool, details);
  dialog.innerHTML = `<div class="school-dialog-shell">
    <header class="school-dialog-header"><div><span class="school-card-kicker">HỒ SƠ TRƯỜNG · ${escapeHtml(activeSchool.short || '')}</span><h2 id="schoolDialogTitle">${escapeHtml(activeSchool.name)}</h2><p>${escapeHtml(activeSchool.city)} · Dữ liệu tuyển sinh theo nguồn đã ghi nhận</p></div><button type="button" class="school-dialog-close" data-action="close-school" aria-label="Đóng hồ sơ">×</button></header>
    <div class="school-dialog-years" role="group" aria-label="Chọn năm tuyển sinh"><span>Năm tuyển sinh</span>${[2024, 2025, 2026].map(year => `<button type="button" data-action="school-year" data-year="${year}" aria-pressed="${activeYear === year}">${year}</button>`).join('')}</div>
    <div class="school-dialog-tabs" role="tablist" aria-label="Thông tin trường">${tabs.map(([key, label]) => `<button type="button" role="tab" id="tab-${key}" aria-controls="schoolDialogPanel" aria-selected="${activeTab === key}" tabindex="${activeTab === key ? '0' : '-1'}" data-action="school-tab" data-tab="${key}">${label}</button>`).join('')}</div>
    <div class="school-dialog-content" id="schoolDialogPanel" role="tabpanel" aria-labelledby="tab-${activeTab}">${body}</div>
    <footer class="school-dialog-footer"><span>Điểm chuẩn các năm và phương thức khác nhau không dùng thay thế cho nhau.</span>${officialLink(activeSchool.website, 'Trang trường', '')}</footer>
  </div>`;
}

function openSchool(id) {
  activeSchool = schools.find(school => school.id === canonicalSchoolId(id));
  if (!activeSchool) return;
  const requestedYear = Number(new URLSearchParams(location.search).get('admission_year'));
  activeYear = [2024, 2025, 2026].includes(requestedYear) ? requestedYear : 2026;
  activeTab = requestedYear === 2024 || requestedYear === 2025 ? 'admission' : 'majors';
  renderDialog();
  if (!dialog.open) dialog.showModal();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function filterSchools(value) {
  const query = normalizeText(value.trim());
  filteredSchools = query ? schools.filter(school => normalizeText([school.name, school.short, school.city, school.id, ...(school.aliases || [])].join(' ')).includes(query)) : schools;
  renderSidebar(filteredSchools);
  renderSchools(filteredSchools);
  document.getElementById('searchClear').hidden = !query;
  document.getElementById('schoolCatalogStatus').textContent = query
    ? `Tìm thấy ${filteredSchools.length} trường phù hợp với “${value.trim()}”.`
    : `${schools.filter(school => school.identity.entity_kind === 'university').length} hồ sơ trường đại học · ${schools.filter(school => school.identity.entity_kind === 'university_system').length} đại học vùng · Rà soát ${REVIEWED_AT}.`;
}

function highlightSection(id) {
  const canonicalId = canonicalSchoolId(id);
  const card = document.getElementById(canonicalId);
  if (!card) return;
  document.querySelectorAll('.p2-sidebar-school.active').forEach(link => link.classList.remove('active'));
  document.querySelector(`.p2-sidebar-school[data-id="${canonicalId}"]`)?.classList.add('active');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('highlight');
  requestAnimationFrame(() => card.classList.add('highlight'));
}

function scrollToTargetFromUrl() {
  const params = new URLSearchParams(location.search);
  const target = canonicalSchoolId(decodeURIComponent(location.hash.slice(1) || params.get('school') || ''));
  if (target === 'hucfl') {
    mainContent.insertAdjacentHTML('afterbegin', '<div class="school-dialog-empty">Bản ghi trường này đang chờ xác minh danh tính. Vui lòng kiểm tra tại Đại học Huế.</div>');
    return;
  }
  if (!target || !schools.some(school => school.id === target)) return;
  if (!document.getElementById(target)) {
    document.getElementById('searchInput').value = '';
    filterSchools('');
  }
  highlightSection(target);
  if (['2024', '2025', '2026'].includes(params.get('admission_year'))) openSchool(target);
}

document.addEventListener('input', event => {
  if (event.target.id !== 'searchInput') return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => filterSchools(event.target.value), 120);
});

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'open-school') openSchool(target.dataset.schoolId);
  if (action === 'close-school') dialog.close();
  if (action === 'school-tab' && ['majors', 'scores', 'admission'].includes(target.dataset.tab)) {
    activeTab = target.dataset.tab;
    renderDialog();
    document.getElementById(`tab-${activeTab}`)?.focus();
  }
  if (action === 'school-year' && ['2024', '2025', '2026'].includes(target.dataset.year)) {
    activeYear = Number(target.dataset.year);
    renderDialog();
    dialog.querySelector(`[data-action="school-year"][data-year="${activeYear}"]`)?.focus();
  }
  if (action === 'highlight-section') {
    event.preventDefault();
    history.replaceState(null, '', `#${target.dataset.schoolId}`);
    highlightSection(target.dataset.schoolId);
  }
});

dialog?.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.getAttribute('role') !== 'tab') return;
  event.preventDefault();
  const tabs = ['majors', 'scores', 'admission'];
  const offset = event.key === 'ArrowRight' ? 1 : -1;
  activeTab = tabs[(tabs.indexOf(activeTab) + offset + tabs.length) % tabs.length];
  renderDialog();
  document.getElementById(`tab-${activeTab}`)?.focus();
});

dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.getElementById('searchClear')?.addEventListener('click', () => {
  const input = document.getElementById('searchInput');
  input.value = '';
  input.focus();
  filterSchools('');
});
window.addEventListener('hashchange', scrollToTargetFromUrl);

async function initPage2() {
  try {
    const response = await fetch('/assets/data/schools.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = buildUniversityCatalog(await response.json(), sourceRegistry.universities);
    schools = catalog.schools;
    filterSchools('');
    document.getElementById('schoolCatalogCount').textContent = `${catalog.stats.universities} trường`;
    const career = new URLSearchParams(location.search).get('career') || window.BWFlow?.read().career?.name;
    if (career) {
      const host = document.createElement('div');
      host.id = 'schoolJourney';
      host.className = 'flow-resume';
      document.querySelector('.p2-layout')?.before(host);
      window.BWFlow?.nextStep(host, `Nghề bạn đang quan tâm: ${career}`, 'Đối chiếu ngành và đề án tuyển sinh trên trang trường trước khi tính điểm.', [['Đổi nghề', 'careers-holland.html'], ['Tính điểm', 'score-calculator.html']]);
    }
    requestAnimationFrame(scrollToTargetFromUrl);
  } catch (error) {
    console.error('[school catalog]', error);
    document.getElementById('schoolCatalogStatus').textContent = 'Chưa tải được danh sách trường. Vui lòng thử lại.';
    mainContent.innerHTML = '<div class="p2-no-results">Không thể tải dữ liệu trường. <button type="button" onclick="location.reload()">Tải lại</button></div>';
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage2);
else initPage2();
