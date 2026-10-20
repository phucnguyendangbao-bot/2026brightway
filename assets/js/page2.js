import sourceRegistry from '../data/school-admissions-sources.js';
import { buildUniversityCatalog, canonicalSchoolId, REVIEWED_AT } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { universityIdentityHTML, renderUniversityLogo } from './university-card.js';

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
const activeYear = 2026;
let searchTimer;
let activeQuery = '';
let searchMode = 'school';
let activeRegion = '';
let promotionUI = null;
// A failed campaign feed/module must never prevent organic lookup from loading.
import('./university-promotions.js').then(module => {
  promotionUI = module;
  refreshContextualPromotions();
  if (dialog?.open && activeTab === 'opportunities') renderDialog();
}).catch(error => {
  console.warn('[university promotion] Discovery unavailable; organic lookup remains independent.', error.message);
  const privacy = document.getElementById('universityPromotionPrivacy');
  if (privacy) privacy.textContent = 'Khu giới thiệu trường đang không khả dụng. Tra cứu tự nhiên và liên kết nguồn trường vẫn hoạt động.';
});

function refreshContextualPromotions() {
  try { promotionUI?.renderContextualUniversityPromotions(document.getElementById('contextualUniversityPromotions'), schools, {mode:searchMode, query:activeQuery, region:activeRegion}); }
  catch (error) { console.warn('[university promotion] Context unavailable.', error.message); }
}

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
    const subject = searchMode === 'major' ? 'ngành đào tạo' : 'trường';
    mainContent.innerHTML = `<div class="p2-no-results">Không tìm thấy ${subject} phù hợp trong dữ liệu 2026. Hãy thử từ khóa ngắn hơn, kiểm tra khu vực hoặc đổi chế độ tìm kiếm.</div>`;
    return;
  }
  mainContent.innerHTML = items.map(school => {
    const details = detailsForSchool(school.id);
    const source = sourceForSchool(school.id);
    const matches = matchingPrograms(school, activeQuery).slice(0, 3);
    const subtitle = source?.source_summary || 'Mở hồ sơ để xem nguồn tuyển sinh của trường và tình trạng dữ liệu hiện có.';
    return `<section class="school-section" id="${escapeHtml(school.id)}">
      ${universityIdentityHTML(school, {logoId:'icon-' + school.id, titleTag:'h2', interactive:true})}
      <span class="school-card-status ${details?.programs?.length && !details.programSourceStatus ? 'school-card-status-ready' : ''}">${details?.programSourceStatus === 'secondary' ? 'Danh mục tham khảo · nguồn thứ cấp' : details?.programSourceStatus === 'current_catalog' ? 'Danh mục hiện hành · cần kiểm tra kỳ nhập học' : details?.programs?.some(program => Number.isFinite(program.score)) ? 'Có ngành và điểm chuẩn 2026' : details?.programs?.length ? `Đã nhập ${details.programs.length} ngành/CT 2026` : details?.scoreSource ? 'Có nguồn điểm chuẩn' : source ? 'Có nguồn tuyển sinh' : 'Đang bổ sung nguồn'}</span>
      ${matches.length ? `<div class="school-card-programs" aria-label="Ngành khớp tìm kiếm">${matches.map(program => `<span>${escapeHtml(program.name)}</span>`).join('')}${matchingPrograms(school, activeQuery).length > 3 ? `<small>+${matchingPrograms(school, activeQuery).length - 3} ngành khác</small>` : ''}</div>` : ''}
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
  renderUniversityLogo(document.getElementById(`icon-${school.id}`), school);
}

function renderPrograms(school, details) {
  if (!details?.programs?.length) return `<div class="school-dialog-empty">
    <h3>Chưa nhập danh sách ngành ${activeYear}</h3>
    <p>Chưa xác minh được bảng ngành theo đúng năm, cơ sở và chương trình. Không dùng danh sách của năm khác để thay thế.</p>
    ${officialLink(details?.admissionSource || sourceForSchool(school.id)?.source_url, 'Xem nguồn năm 2026', 'school-dialog-link')}
  </div>`;
  const hasScores = details.programs.some(program => Number.isFinite(program.score));
  const hasTracks = details.programs.some(program => program.track);
  const hasCombinations = details.programs.some(program => program.combination);
  const hasQuotas = details.programs.some(program => Number.isFinite(program.quota));
  return `<p class="school-dialog-lead"><strong>${details.programs.length} ngành/chương trình</strong> ${details.programSourceStatus === 'current_catalog' ? 'trong danh mục hiện hành; chưa xác nhận toàn bộ chương trình mở tuyển trong kỳ 2026' : 'trong dữ liệu ghi nhận cho năm ' + details.year}.${hasScores ? ' Điểm chuẩn cùng năm nằm ở cột cuối.' : ''}</p>
    ${details.programNote ? `<p class="school-program-note">${escapeHtml(details.programNote)}</p>` : ''}
    <div class="school-program-table-wrap"><table class="school-program-table"><thead><tr><th>Mã xét tuyển</th><th>Ngành / chương trình</th>${hasTracks ? '<th>Phân loại</th>' : ''}${hasQuotas ? '<th>Chỉ tiêu dự kiến</th>' : ''}${hasCombinations ? '<th>Tổ hợp trích</th>' : ''}${hasScores ? `<th>Điểm chuẩn ${details.year}${details.scoreScale ? ' · thang ' + details.scoreScale : ''}</th>` : ''}</tr></thead><tbody>
    ${details.programs.map((program, index) => `<tr><td>${program.code ? escapeHtml(program.code) : '<span class="school-program-code-missing">Chưa đối chiếu mã</span>'}</td><td>${escapeHtml(program.name)}<div class="school-program-actions"><button type="button" data-action="save-major" data-program="${index}">Lưu ngành</button><a href="score-calculator.html?school=${encodeURIComponent(school.id)}&program=${index}" data-action="score-program" data-program="${index}">Đối chiếu điểm →</a></div></td>${hasTracks ? `<td>${escapeHtml(program.track || '')}</td>` : ''}${hasQuotas ? `<td>${Number.isFinite(program.quota) ? escapeHtml(program.quota) : ''}</td>` : ''}${hasCombinations ? `<td>${escapeHtml(program.combination || '')}</td>` : ''}${hasScores ? `<td>${Number.isFinite(program.score) ? `<strong>${escapeHtml(formatScore(program.score))}</strong>` : ''}</td>` : ''}</tr>`).join('')}
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
    return `<div class="school-score-summary"><span>Điểm chuẩn ${details.year}</span><strong>${escapeHtml(scoreRange)}${details.scoreScale ? ' / ' + details.scoreScale : ''}</strong><small>${escapeHtml(details.scoreMethod)}</small></div>
      ${renderPrograms(school, details)}
      ${details.scoreSource === details.programSource ? '' : officialLink(details.scoreSource, 'Thông báo điểm chuẩn gốc', 'school-dialog-link')}`;
  }
  if (details?.score) return `<div class="school-score-summary"><span>Điểm chuẩn ${activeYear}</span><strong>${escapeHtml(details.score)}</strong><small>${escapeHtml(details.scoreMethod)}</small></div>
    ${details.scoreNote ? `<p class="school-dialog-footnote">${escapeHtml(details.scoreNote)}</p>` : ''}
    ${officialLink(details.scoreSource, 'Thông báo điểm chuẩn gốc', 'school-dialog-link')}`;
  if (details?.scoreSource) return `<div class="school-dialog-empty"><h3>Trường đã công bố điểm chuẩn ${details.year}</h3>
    <p>Bảng điểm được đăng dưới dạng hình hoặc tài liệu. Hãy xem bảng gốc để đối chiếu đúng ngành, chương trình và phương thức; chưa nhập số lẻ chưa xác minh vào hệ thống.</p>
    ${officialLink(details.scoreSource, 'Mở bảng điểm chuẩn chính thức', 'school-dialog-link')}</div>`;
  return `<div class="school-dialog-empty"><h3>Chưa nhập bảng điểm chuẩn ${activeYear}</h3>
    <p>Không dùng điểm tham khảo trong dữ liệu cũ hoặc điểm của năm khác làm điểm trúng tuyển. Hãy đối chiếu đúng phương thức và chương trình trên cổng trường.</p>
    ${officialLink(details?.admissionSource || sourceForSchool(school.id)?.source_url, 'Xem nguồn năm 2026', 'school-dialog-link')}
    <a class="school-dialog-link" href="resources.html?school=${encodeURIComponent(school.id)}">Xem tin tuyển sinh đã đối chiếu →</a></div>`;
}

function renderAdmission(school, details) {
  const source = sourceForSchool(school.id);
  const links = [source?.source_url && { label: 'Nguồn tuyển sinh 2026', url: source.source_url }, source?.supplementary_url && { label: 'Tài liệu bổ sung', url: source.supplementary_url }].filter(Boolean);
  return `<div class="school-admission-panel">
    <div class="school-admission-year"><span>Năm tuyển sinh ${activeYear}</span><span>${links.length ? 'Có nguồn trường để đối chiếu' : 'Chưa có nguồn được đối chiếu'}</span></div>
    ${source ? `<h3>Thông tin từ nguồn tuyển sinh</h3><p>${escapeHtml(source.source_summary)}</p><p class="school-dialog-note">${escapeHtml(source.review_note)}</p>` : ''}
    ${!links.length ? '<p>Chưa có đề án hoặc thông báo tuyển sinh đúng năm được đối chiếu cho hồ sơ này.</p>' : ''}
    <div class="school-dialog-links">${links.map(link => officialLink(link.url, link.label, 'school-dialog-link')).join('')}</div>
    ${links.length ? '<small>Xem văn bản gốc để kiểm tra ngành, cơ sở, phương thức và chỉ tiêu; nguồn liên kết không xác nhận toàn bộ dữ liệu chi tiết.</small>' : officialLink(school.website, 'Trang chính thức của trường', 'school-dialog-link')}
  </div>`;
}

function renderCostsAndSupport(school, details) {
  const tuition = details?.tuition;
  const verifiedTuition = tuition?.year === activeYear && /^https:\/\//i.test(tuition.source || '') && tuition.summary;
  const fallbackUrl = details?.admissionSource || sourceForSchool(school.id)?.source_url || school.website;
  return `<section class="school-cost-support" aria-labelledby="schoolCostTitle">
    <h3 id="schoolCostTitle">Học phí ${activeYear}</h3>
    ${verifiedTuition
      ? `<p>${escapeHtml(tuition.summary)}</p>${officialLink(tuition.source, 'Nguồn học phí chính thức', 'school-dialog-link')}`
      : `<div class="school-dialog-empty"><h3>Chưa có dữ liệu học phí ${activeYear} đã xác minh</h3><p>BrightWay không dùng mức học phí cũ hoặc dữ liệu không rõ chương trình để lấp chỗ trống. Hãy xem nguồn trường và kiểm tra đúng ngành, khóa học, cơ sở.</p>${officialLink(fallbackUrl, 'Kiểm tra trên nguồn chính thức', 'school-dialog-link')}</div>`}
    <div class="school-support-separator"><h3>Học bổng và hỗ trợ</h3><p>Nội dung giới thiệu hoặc tài trợ, nếu có, được gắn nhãn riêng và không ảnh hưởng kết quả tìm kiếm hay tính điểm.</p></div>
    <div data-school-opportunities>Khu học bổng và kết nối đang tải hoặc chưa có dữ liệu được xác minh.</div>
  </section>`;
}

function renderProfileCoverage(school, details) {
  const source = sourceForSchool(school.id);
  const hasPrograms = Boolean(details?.programs?.length);
  const hasAdmission = Boolean(source?.source_url || details?.admissionSource);
  const hasTuition = Boolean(details?.tuition?.year === activeYear && details?.tuition?.source);
  return `<div class="school-profile-coverage" aria-label="Phạm vi dữ liệu hồ sơ">
    <span class="${hasPrograms ? 'has-data' : ''}"><strong>Ngành</strong>${hasPrograms ? `${details.programs.length} mục` : 'Chưa có dữ liệu 2026'}</span>
    <span class="${hasAdmission ? 'has-data' : ''}"><strong>Tuyển sinh</strong>${hasAdmission ? 'Có nguồn chính thức' : 'Chưa có nguồn 2026'}</span>
    <span class="${hasTuition ? 'has-data' : ''}"><strong>Học phí</strong>${hasTuition ? 'Đã xác minh' : 'Chưa xác minh 2026'}</span>
    <span><strong>Học bổng</strong>Chỉ hiện khi có nguồn</span>
  </div>`;
}

function renderDialog() {
  if (!activeSchool || !dialog) return;
  const details = detailsForSchool(activeSchool.id);
  const tabs = [
    ['majors', 'Ngành đào tạo'], ['scores', 'Điểm chuẩn'], ['admission', 'Đề án tuyển sinh'],
    ['opportunities', 'Học phí & học bổng'],
  ];
  const body = activeTab === 'majors' ? renderPrograms(activeSchool, details)
    : activeTab === 'scores' ? renderScores(activeSchool, details) : activeTab === 'opportunities' ? renderCostsAndSupport(activeSchool, details) : renderAdmission(activeSchool, details);
  const isSaved = window.BWFlow?.read().savedSchools?.some(school => school.id === activeSchool.id);
  promotionUI?.cleanupPromotionHosts(dialog);
  dialog.innerHTML = `<div class="school-dialog-shell">
    <header class="school-dialog-header"><div><span class="school-card-kicker">HỒ SƠ TRƯỜNG · ${escapeHtml(activeSchool.short || '')}</span><h2 id="schoolDialogTitle">${escapeHtml(activeSchool.name)}</h2><p>${escapeHtml(activeSchool.city)} · Dữ liệu tuyển sinh 2026 theo nguồn đã ghi nhận</p></div><div class="school-dialog-header-actions"><button type="button" class="school-save-button ${isSaved ? 'is-saved' : ''}" data-action="save-school">${isSaved ? '✓ Đã lưu' : 'Lưu trường'}</button><button type="button" class="school-dialog-close" data-action="close-school" aria-label="Đóng hồ sơ">×</button></div></header>
    ${renderProfileCoverage(activeSchool, details)}
    <div class="school-dialog-tabs" role="tablist" aria-label="Thông tin trường">${tabs.map(([key, label]) => `<button type="button" role="tab" id="tab-${key}" aria-controls="schoolDialogPanel" aria-selected="${activeTab === key}" tabindex="${activeTab === key ? '0' : '-1'}" data-action="school-tab" data-tab="${key}">${label}</button>`).join('')}</div>
    <div class="school-dialog-content" id="schoolDialogPanel" role="tabpanel" aria-labelledby="tab-${activeTab}">${body}</div>
    <footer class="school-dialog-footer"><span>Điểm chuẩn giữa các phương thức không dùng thay thế cho nhau.</span>${officialLink(activeSchool.website, 'Trang trường', '')}</footer>
  </div>`;
  if (activeTab === 'opportunities' && promotionUI) {
    try { promotionUI.renderSchoolOpportunities(dialog.querySelector('[data-school-opportunities]'), activeSchool); }
    catch (error) { console.warn('[university promotion] School opportunities unavailable.', error.message); }
  }
}

function openSchool(id) {
  activeSchool = schools.find(school => school.id === canonicalSchoolId(id));
  if (!activeSchool) return;
  activeTab = 'majors';
  renderDialog();
  if (!dialog.open) dialog.showModal();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function editDistance(first, second) {
  if (first === second) return 0;
  const row = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let previous = row[0];
    row[0] = firstIndex;
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const current = row[secondIndex];
      row[secondIndex] = Math.min(
        row[secondIndex] + 1,
        row[secondIndex - 1] + 1,
        previous + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[second.length];
}

function safelyMatches(candidate, query) {
  const normalizedCandidate = normalizeText(candidate);
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) return true;
  if (normalizedCandidate.includes(normalizedQuery)) return true;
  const words = normalizedCandidate.split(/[^a-z0-9]+/).filter(Boolean);
  return normalizedQuery.split(/\s+/).every(token => words.some(word =>
    word.startsWith(token) || (token.length >= 4 && word.length >= 4 && editDistance(word, token) <= 1)
  ));
}

function matchingPrograms(school, query) {
  if (!String(query || '').trim()) return [];
  return (detailsForSchool(school.id)?.programs || []).filter(program => safelyMatches([program.name, program.code, program.track].join(' '), query));
}

function filterSchools(value) {
  const query = normalizeText(value.trim());
  activeQuery = value.trim();
  filteredSchools = schools.filter(school => {
    if (activeRegion && normalizeText(school.city) !== normalizeText(activeRegion)) return false;
    if (!query) return true;
    return searchMode === 'major'
      ? matchingPrograms(school, value).length > 0
      : safelyMatches([school.name, school.short, school.city, school.id, ...(school.aliases || [])].join(' '), value);
  });
  renderSidebar(filteredSchools);
  renderSchools(filteredSchools);
  refreshContextualPromotions();
  document.getElementById('searchClear').hidden = !query;
  const url = new URL(location.href);
  url.searchParams.set('mode', searchMode);
  if (value.trim()) url.searchParams.set('q', value.trim()); else url.searchParams.delete('q');
  url.searchParams.delete('major');
  if (activeRegion) url.searchParams.set('region', activeRegion); else url.searchParams.delete('region');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  window.BWFlow?.save({ schoolFilters: { query: value.trim(), mode: searchMode, region: activeRegion } });
  document.getElementById('schoolCatalogStatus').textContent = query
    ? `Tìm thấy ${filteredSchools.length} trường theo ${searchMode === 'major' ? 'ngành đào tạo' : 'tên trường'} “${value.trim()}”${activeRegion ? ` tại ${activeRegion}` : ''}.`
    : `${schools.filter(school => school.identity.entity_kind === 'university').length} hồ sơ trường đại học · ${schools.filter(school => school.identity.entity_kind === 'university_system').length} đại học vùng · Rà soát ${REVIEWED_AT}.`;
}

function updateSearchSuggestions() {
  const values = new Set();
  schools.forEach(school => {
    if (searchMode === 'school') values.add(school.name);
    else (detailsForSchool(school.id)?.programs || []).forEach(program => values.add(program.name));
  });
  document.getElementById('schoolSearchSuggestions').innerHTML = [...values].sort((first, second) => first.localeCompare(second, 'vi')).map(value => `<option value="${escapeHtml(value)}"></option>`).join('');
  document.getElementById('searchInput').placeholder = searchMode === 'major'
    ? 'Ví dụ: Công nghệ thông tin'
    : 'Ví dụ: Đại học Bách khoa hoặc HCMUT';
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
  let requested = location.hash.slice(1) || params.get('school') || '';
  try { requested = decodeURIComponent(requested); }
  catch { console.warn('[school catalog] Invalid encoded school identifier'); }
  const target = canonicalSchoolId(requested);
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
  if (params.has('school') || params.get('admission_year') === '2026') openSchool(target);
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
  if (action === 'save-major' && activeSchool) {
    const program = detailsForSchool(activeSchool.id)?.programs?.[target.dataset.program];
    if (program) {
      window.BWFlow?.addUnique('savedMajors', { id: normalizeText(program.name), name: program.name });
      target.textContent = '✓ Đã lưu ngành';
      target.setAttribute('aria-pressed', 'true');
    }
  }
  if (action === 'score-program' && activeSchool) {
    const program = detailsForSchool(activeSchool.id)?.programs?.[target.dataset.program];
    if (program) {
      window.BWFlow?.addUnique('savedMajors', { id: normalizeText(program.name), name: program.name, code: program.code || '', school: activeSchool.id });
      window.BWFlow?.addUnique('savedSchools', { id: activeSchool.id, name: activeSchool.name, city: activeSchool.city });
      window.BWFlow?.save({ target: { mode: 'guided', school: activeSchool.id, program: target.dataset.program, name: program.name } });
    }
  }
  if (action === 'open-school') openSchool(target.dataset.schoolId);
  if (action === 'close-school') dialog.close();
  if (action === 'save-school' && activeSchool) {
    const saved = window.BWFlow?.read().savedSchools?.some(school => school.id === activeSchool.id);
    if (saved) window.BWFlow?.removeSaved('savedSchools', activeSchool.id);
    else window.BWFlow?.addUnique('savedSchools', { id: activeSchool.id, name: activeSchool.name, city: activeSchool.city });
    renderDialog();
  }
  if (action === 'school-tab' && ['majors', 'scores', 'admission', 'opportunities'].includes(target.dataset.tab)) {
    activeTab = target.dataset.tab;
    renderDialog();
    document.getElementById(`tab-${activeTab}`)?.focus();
  }
  if (action === 'highlight-section') {
    event.preventDefault();
    const url = new URL(location.href);
    url.hash = target.dataset.schoolId;
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    highlightSection(target.dataset.schoolId);
  }
});

dialog?.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.getAttribute('role') !== 'tab') return;
  event.preventDefault();
  const tabs = [...dialog.querySelectorAll('[role="tab"]')].map(tab => tab.dataset.tab);
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
document.getElementById('resetSchoolFilters')?.addEventListener('click', () => {
  activeRegion = '';
  document.getElementById('regionFilter').value = '';
  document.getElementById('searchInput').value = '';
  filterSchools('');
});
document.querySelectorAll('input[name="schoolSearchMode"]').forEach(input => input.addEventListener('change', event => {
  searchMode = event.target.value;
  updateSearchSuggestions();
  filterSchools(document.getElementById('searchInput').value);
}));
document.getElementById('regionFilter')?.addEventListener('change', event => {
  activeRegion = event.target.value;
  filterSchools(document.getElementById('searchInput').value);
});
window.addEventListener('hashchange', scrollToTargetFromUrl);

async function initPage2() {
  try {
    const response = await fetch('/assets/data/schools.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = buildUniversityCatalog(await response.json(), sourceRegistry.universities);
    schools = catalog.schools;
    const params = new URLSearchParams(location.search);
    const previousFilters = !params.size ? window.BWFlow?.read().schoolFilters : null;
    const initialQuery = params.get('major') || params.get('q') || previousFilters?.query || '';
    searchMode = params.get('mode') === 'major' || params.has('major') || params.get('focus') === 'major' ? 'major' : 'school';
    activeRegion = params.get('region') || '';
    if (previousFilters) { searchMode = previousFilters.mode === 'major' ? 'major' : 'school'; activeRegion = previousFilters.region || ''; }
    document.querySelector(`input[name="schoolSearchMode"][value="${searchMode}"]`).checked = true;
    const regions = [...new Set(schools.map(school => school.city).filter(Boolean))].sort((first, second) => first.localeCompare(second, 'vi'));
    document.getElementById('regionFilter').innerHTML = '<option value="">Tất cả khu vực</option>' + regions.map(region => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join('');
    if (regions.includes(activeRegion)) document.getElementById('regionFilter').value = activeRegion; else activeRegion = '';
    updateSearchSuggestions();
    document.getElementById('searchInput').value = initialQuery;
    filterSchools(initialQuery);
    // Searching is not a decision to save a major.
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
    if (params.get('focus') === 'major') requestAnimationFrame(() => document.getElementById('searchInput')?.focus());
  } catch (error) {
    console.error('[school catalog]', error);
    document.getElementById('schoolCatalogStatus').textContent = 'Chưa tải được danh sách trường. Vui lòng thử lại.';
    mainContent.innerHTML = '<div class="p2-no-results">Không thể tải dữ liệu trường. <button type="button" onclick="location.reload()">Tải lại</button></div>';
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage2);
else initPage2();
