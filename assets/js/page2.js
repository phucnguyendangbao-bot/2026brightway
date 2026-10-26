import sourceRegistry from '../data/school-admissions-sources.js';
import { buildUniversityCatalog, canonicalSchoolId, REVIEWED_AT } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { universityIdentityHTML, renderUniversityLogo } from './university-card.js';
import { uniqueSchools, normalizeWishes, wishKey, addWish, wishFromProgram, importLegacySchools } from './selection-model.js';
import { comparisonCells } from './school-comparison-model.js';
import { canDisplayProgramScores } from './score-provenance.js';
import { sortedPrograms, searchScore, schoolSearchScore, classifyProgram, catalogVersionForYear, TAXONOMY_SOURCE } from './training-taxonomy.js';

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
let programSort = 'code';
const activeYear = 2026;
let searchTimer;
let activeQuery = '';
let searchMode = 'school';
let activeRegion = '';
let activeGroupCode = '';
let promotionUI = null;
let comparisonOpportunities = [];
// Optional editorial scholarship data must never become a dependency of lookup.
import('../data/university-promotions.js').then(module => {
  comparisonOpportunities = module.universityOpportunities;
  renderCompare();
}).catch(() => { /* comparison keeps explicit missing data; organic lookup remains available */ });
let catalogReady = false;
let savedOnly = false;
const savedSchools = () => uniqueSchools(window.BWFlow?.read().savedSchools);
const selectedWishes = () => normalizeWishes(window.BWFlow?.read().wishes);
const wishYear = () => window.BWFlow?.read().admissionPlanYear === 2026 ? 2026 : 2027;
const isSchoolSaved = id => savedSchools().some(school => school.id === canonicalSchoolId(id));
let compareIds = [];
const compareHost = document.getElementById('schoolCompare');
const compareTable = document.getElementById('schoolCompareTable');
const compareStorageKey = 'bw-school-compare-2026';
try { const rows = JSON.parse(localStorage.getItem(compareStorageKey) || '[]'); compareIds = Array.isArray(rows) ? [...new Set(rows.filter(id => typeof id === 'string').map(canonicalSchoolId))].slice(0, 3) : []; } catch { compareIds = []; }
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
    const matching = matchingPrograms(school, searchMode === 'major' ? activeQuery : '', activeGroupCode);
    const matches = matching.slice(0, 3);
    const subtitle = source?.source_summary || 'Mở hồ sơ để xem nguồn tuyển sinh của trường và tình trạng dữ liệu hiện có.';
    return `<section class="school-section" id="${escapeHtml(school.id)}">
      ${universityIdentityHTML(school, {logoId:'icon-' + school.id, titleTag:'h2', interactive:true})}
      <span class="school-card-status ${details?.programs?.length && !details.programSourceStatus ? 'school-card-status-ready' : ''}">${details?.programSourceStatus === 'secondary' ? 'Danh mục tham khảo · nguồn thứ cấp' : details?.programSourceStatus === 'current_catalog' ? 'Danh mục hiện hành · cần kiểm tra kỳ nhập học' : canDisplayProgramScores(details,activeYear) && details?.programs?.some(program => Number.isFinite(program.score)) ? 'Có ngành và điểm chuẩn 2026' : details?.programs?.length ? `Đã nhập ${details.programs.length} ngành/CT 2026` : details?.scoreSource ? 'Có nguồn điểm chuẩn' : source ? 'Có nguồn tuyển sinh' : 'Đang bổ sung nguồn'}</span>
      ${matches.length ? `<div class="school-card-programs" aria-label="Ngành khớp tìm kiếm">${matches.map(program => `<span>${escapeHtml(program.name)}</span>`).join('')}${matching.length > 3 ? `<small>+${matching.length - 3} ngành khác</small>` : ''}</div>` : ''}
      <p class="school-card-description">${escapeHtml(subtitle)}</p>
      <div class="school-card-bottom">
        <span>${school.identity.entity_kind === 'university_system' ? 'Đại học vùng' : source ? `Nguồn tuyển sinh ${source.admission_year}` : 'Hồ sơ trường'}</span>
        <span><label class="school-card-compare"><input type="checkbox" data-action="compare-school" data-school-id="${escapeHtml(school.id)}" ${compareIds.includes(school.id) ? 'checked' : ''} aria-label="Thêm ${escapeHtml(school.name)} vào so sánh"> So sánh</label><button type="button" class="school-card-open" data-action="open-school" data-school-id="${escapeHtml(school.id)}">Xem hồ sơ <span aria-hidden="true">→</span></button></span>
      </div>
      <button type="button" class="school-save-button" data-action="toggle-saved-school" data-school-id="${escapeHtml(school.id)}" aria-pressed="${isSchoolSaved(school.id)}">${isSchoolSaved(school.id) ? '✓ Đã lưu trường' : 'Lưu trường'}</button>
    </section>`;
  }).join('');
  items.forEach(school => renderLogo(school));
}

function compareCell(school, cell) {
  return `<p>${escapeHtml(cell.text)}</p>${cell.programs ? `<details><summary>Xem danh mục ngành</summary><ul>${cell.programs.map(program => `<li>${escapeHtml(program.name)}${program.code ? ` · ${escapeHtml(program.code)}` : ''}${program.track ? ` · ${escapeHtml(program.track)}` : ''}${program.campus ? ` · ${escapeHtml(program.campus)}` : ''}</li>`).join('')}</ul></details>` : ''}${cell.reviewed ? `<small>Đối chiếu nguồn: ${escapeHtml(cell.reviewed)}</small>` : ''}${cell.source ? officialLink(cell.source, cell.sourceLabel || 'Xem nguồn chính thức', 'school-compare-source') : ''}${(cell.links || []).map(link => officialLink(link.url, link.label, 'school-compare-source')).join('')}${cell.action ? `<button type="button" class="school-compare-profile" data-action="compare-profile" data-school-id="${escapeHtml(school.id)}" data-tab="${cell.action}">Mở hồ sơ ${escapeHtml(school.short || school.name)} →</button>` : ''}`;
}
function renderCompare() {
  const selected = compareIds.map(id => schools.find(school => school.id === id)).filter(Boolean);
  const status = document.getElementById('compareSelectionStatus');
  if (status) status.textContent = selected.length ? `Đã chọn ${selected.length}/3 trường để so sánh.${selected.length === 1 ? ' Chọn thêm một trường để mở bảng.' : selected.length === 3 ? ' Bỏ một trường để chọn trường khác.' : ''}` : 'Chọn “So sánh” trên 2–3 hồ sơ trường để xem cùng nhau.';
  if (!compareHost || !compareTable) return;
  compareHost.hidden = selected.length < 2;
  if (selected.length < 2) { compareTable.innerHTML = ''; return; }
  const rows = [['Khu vực','location'],['Ngành đào tạo · 2026','programs'],['Học phí · 2026','tuition'],['Học bổng · nguồn tham khảo','scholarship'],['Phương thức xét tuyển · 2026','admission'],['Điểm chuẩn theo năm · 2026','scores'],['Website chính thức','website']];
  const cells = selected.map(school => comparisonCells(school, detailsForSchool(school.id), sourceForSchool(school.id), {year:activeYear,opportunities:comparisonOpportunities}));
  compareTable.innerHTML = `<table class="school-compare-table"><caption>Đối chiếu nguồn trước khi chọn trường. Điểm chuẩn khác phương thức hoặc thang điểm không dùng thay thế cho nhau. Nguồn 2026 chưa xác nhận tuyển sinh 2027.</caption><thead><tr><th scope="col">Tiêu chí</th>${selected.map(school => `<th scope="col"><strong>${escapeHtml(school.name)}</strong><button type="button" class="school-compare-remove" data-action="remove-compare" data-school-id="${escapeHtml(school.id)}" aria-label="Bỏ ${escapeHtml(school.name)} khỏi so sánh">Bỏ trường</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label,key]) => `<tr><th scope="row">${label}</th>${selected.map((school,index) => `<td>${compareCell(school,cells[index][key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function updateCompare(id, checked, fromCheckbox = false) {
  if (checked && !compareIds.includes(id) && compareIds.length < 3) compareIds.push(id);
  if (!checked) compareIds = compareIds.filter(item => item !== id);
  try { localStorage.setItem(compareStorageKey, JSON.stringify(compareIds)); } catch { /* private mode */ }
  renderSchools(filteredSchools); renderCompare();
  const focusTarget = fromCheckbox
    ? [...mainContent.querySelectorAll('[data-action="compare-school"]')].find(node => node.dataset.schoolId === id)
    : compareHost?.hidden ? document.getElementById('compareSelectionStatus') : compareHost?.querySelector('[data-action="remove-compare"]');
  focusTarget?.focus({preventScroll:true});
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
  const hasScores = canDisplayProgramScores(details,activeYear) && details.programs.some(program => Number.isFinite(program.score));
  const hasTracks = details.programs.some(program => program.track);
  const hasCombinations = details.programs.some(program => program.combination);
  const hasQuotas = details.programs.some(program => Number.isFinite(program.quota));
  const canPlan = Boolean(wishFromProgram(school, details, 0, wishYear()));
  const columnCount = 2 + Number(hasTracks) + Number(hasQuotas) + Number(hasCombinations) + Number(hasScores);
  let previousField = '', previousGroup = '', previousMajor = '';
  const rows = sortedPrograms(details.programs, programSort).map(({program,index,taxonomy}) => {
    let headings = '';
    if (taxonomy.fieldName !== previousField) {
      headings += `<tr class="school-taxonomy-field"><th colspan="${columnCount}" scope="colgroup">${escapeHtml(taxonomy.fieldCode ? `${taxonomy.fieldCode} · ` : '')}${escapeHtml(taxonomy.fieldName)}</th></tr>`;
      previousField = taxonomy.fieldName; previousGroup = ''; previousMajor = '';
    }
    if (taxonomy.groupName !== previousGroup) {
      headings += `<tr class="school-taxonomy-group"><th colspan="${columnCount}" scope="colgroup">${escapeHtml(taxonomy.groupCode ? `${taxonomy.groupCode} · ` : '')}${escapeHtml(taxonomy.groupName)}</th></tr>`;
      previousGroup = taxonomy.groupName; previousMajor = '';
    }
    if (taxonomy.majorCode !== previousMajor && taxonomy.majorCode) {
      headings += `<tr class="school-taxonomy-major"><th colspan="${columnCount}" scope="colgroup">${escapeHtml(taxonomy.majorCode)} · ${escapeHtml(taxonomy.majorName)}</th></tr>`;
      previousMajor = taxonomy.majorCode;
    }
    const candidate = wishFromProgram(school, details, index, wishYear());
    const added = candidate && selectedWishes().some(item => item.id === wishKey(candidate));
    const verify = taxonomy.needsVerification ? `<small class="school-program-verify">${taxonomy.status === 'missing-code' ? 'Thiếu mã · cần xác minh' : taxonomy.status === 'unknown-code' ? 'Mã chưa có trong danh mục đối chiếu · cần xác minh' : 'Mã/tên chương trình riêng · cần đối chiếu ngành chuẩn'}</small>` : '';
    return `${headings}<tr data-program-index="${index}"><td>${program.code ? escapeHtml(program.code) : '<span class="school-program-code-missing">Chưa đối chiếu mã</span>'}</td><td>${escapeHtml(program.name)}${verify}<div class="school-program-actions"><button type="button" data-action="save-major" data-program="${index}">Lưu ngành</button>${candidate ? `<button type="button" data-action="add-wish" data-program="${index}" ${added ? 'disabled' : ''}>${added ? '✓ Đã thêm nguyện vọng' : 'Thêm nguyện vọng'}</button>` : ''}<a href="score-calculator.html?school=${encodeURIComponent(school.id)}&program=${index}" data-action="score-program" data-program="${index}">Đối chiếu điểm →</a></div></td>${hasTracks ? `<td>${escapeHtml(program.track || '')}</td>` : ''}${hasQuotas ? `<td>${Number.isFinite(program.quota) ? escapeHtml(program.quota) : ''}</td>` : ''}${hasCombinations ? `<td>${escapeHtml(program.combination || '')}</td>` : ''}${hasScores ? `<td>${Number.isFinite(program.score) ? `<strong>${escapeHtml(formatScore(program.score))}</strong>` : ''}</td>` : ''}</tr>`;
  }).join('');
  return `<p class="school-dialog-lead"><strong>${details.programs.length} ngành/chương trình</strong> ${details.programSourceStatus === 'current_catalog' ? 'trong danh mục hiện hành; chưa xác nhận toàn bộ chương trình mở tuyển trong kỳ 2026' : 'trong dữ liệu ghi nhận cho năm ' + details.year}.${hasScores ? ' Điểm chuẩn cùng năm nằm ở cột cuối.' : ''}</p>
    ${details.programNote ? `<p class="school-program-note">${escapeHtml(details.programNote)}</p>` : ''}
    <div class="school-program-sort"><label for="schoolProgramSort">Sắp xếp trong nhóm ngành</label><select id="schoolProgramSort"><option value="code" ${programSort === 'code' ? 'selected' : ''}>Mã ngành tăng dần</option><option value="az" ${programSort === 'az' ? 'selected' : ''}>Tên A–Z</option></select></div><p class="school-taxonomy-note">Lĩnh vực → Nhóm ngành → Ngành chuẩn → Chương trình trường. Danh mục 2026 đối chiếu theo <a href="${escapeHtml(TAXONOMY_SOURCE)}" target="_blank" rel="noopener noreferrer">Thông tư 09/2022 ↗</a> và <a href="${escapeHtml(catalogVersionForYear(2026).supplementarySource)}" target="_blank" rel="noopener noreferrer">ngành thí điểm 2024 ↗</a>; mã xét tuyển riêng được giữ nguyên. <a href="${escapeHtml(catalogVersionForYear(2027).source)}" target="_blank" rel="noopener noreferrer">Danh mục áp dụng từ tuyển sinh 2027 ↗</a>. Các mục chưa đối chiếu được tách riêng.</p>
    <div class="school-program-table-wrap"><table class="school-program-table"><thead><tr><th>Mã xét tuyển</th><th>Ngành / chương trình</th>${hasTracks ? '<th>Phân loại</th>' : ''}${hasQuotas ? '<th>Chỉ tiêu dự kiến</th>' : ''}${hasCombinations ? '<th>Tổ hợp trích</th>' : ''}${hasScores ? `<th>Điểm chuẩn ${details.year}${details.scoreScale ? ' · thang ' + details.scoreScale : ''}</th>` : ''}</tr></thead><tbody>
    ${rows}
    </tbody></table></div>
    <div class="wish-planning"><label for="wishPlanYear">Năm dự kiến của danh sách nguyện vọng</label><select id="wishPlanYear"><option value="2026" ${wishYear() === 2026 ? 'selected' : ''}>2026</option><option value="2027" ${wishYear() === 2027 ? 'selected' : ''}>2027 · chuẩn bị</option></select><p>Nguồn ngành: ${details.year}. Khi lập danh sách cho 2027, nguồn 2026 chỉ để tham khảo; cần kiểm tra thông báo mới trước khi đăng ký.</p>${canPlan ? '' : '<p>Danh mục này chưa có nguồn chính thức theo năm đủ để thêm nguyện vọng. Bạn vẫn có thể lưu trường hoặc ngành quan tâm.</p>'}<a href="profile.html?tab=journey#my-choices">Xem Nguyện vọng của tôi →</a></div>
    ${details.scoreMethod ? `<p class="school-dialog-footnote">${escapeHtml(details.scoreMethod)}. Chọn đúng cơ sở và chương trình khi đăng ký.</p>` : ''}
    ${officialLink(details.programSource, details.programSourceLabel || 'Danh sách ngành trên trang trường', 'school-dialog-link')}
    ${(details.supplementarySources || []).map(source => officialLink(source.url, source.label, 'school-dialog-link')).join('')}`;
}

function renderScores(school, details) {
  const programScores = canDisplayProgramScores(details,activeYear)
    ? details.programs.filter(program => Number.isFinite(program.score)).map(program => program.score) : [];
  if (programScores.length) {
    const minimum = Math.min(...programScores);
    const maximum = Math.max(...programScores);
    const scoreRange = minimum === maximum ? formatScore(minimum) : `${formatScore(minimum)} – ${formatScore(maximum)}`;
    return `<div class="school-score-summary"><span>Điểm chuẩn ${details.year}</span><strong>${escapeHtml(scoreRange)}${details.scoreScale ? ' / ' + details.scoreScale : ''}</strong><small>${escapeHtml(details.scoreMethod)}</small></div>
      ${renderPrograms(school, details)}
      ${details.scoreSource === details.programSource ? '' : officialLink(details.scoreSource, 'Thông báo điểm chuẩn gốc', 'school-dialog-link')}`;
  }
  if (details?.score && canDisplayProgramScores(details,activeYear)) return `<div class="school-score-summary"><span>Điểm chuẩn ${activeYear}</span><strong>${escapeHtml(details.score)}</strong><small>${escapeHtml(details.scoreMethod)}</small></div>
    ${details.scoreNote ? `<p class="school-dialog-footnote">${escapeHtml(details.scoreNote)}</p>` : ''}
    ${officialLink(details.scoreSource, 'Thông báo điểm chuẩn gốc', 'school-dialog-link')}`;
  if (details?.scoreSource) return `<div class="school-dialog-empty"><h3>Trường đã công bố điểm chuẩn ${details.year}</h3>
    <p>Chưa hiển thị số khi phương thức hoặc thang điểm chưa được đối chiếu. Hãy xem bảng gốc để xác định đúng ngành, chương trình, phương thức và điều kiện áp dụng.</p>
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
  const isSaved = isSchoolSaved(activeSchool.id);
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

function openSchool(id, tab = 'majors') {
  activeSchool = schools.find(school => school.id === canonicalSchoolId(id));
  if (!activeSchool) return;
  activeTab = ['majors','scores','admission','opportunities'].includes(tab) ? tab : 'majors';
  programSort = 'code';
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

function matchingPrograms(school, query, groupCode = activeGroupCode) {
  const details = detailsForSchool(school.id);
  if (!String(query || '').trim() && !groupCode) return [];
  return (details?.programs || []).map((program,index) => ({
    program,index,taxonomy:classifyProgram(program,details.year),rank:query ? searchScore(program,query,details.year) : 1,
  })).filter(item => item.rank > 0 && (!groupCode || (groupCode === 'unverified' ? !item.taxonomy.groupCode : item.taxonomy.groupCode === groupCode)))
    .sort((a,b) => b.rank-a.rank || (a.taxonomy.majorCode || '9999999').localeCompare(b.taxonomy.majorCode || '9999999') || a.index-b.index)
    .map(item => item.program);
}

function filterSchools(value) {
  if (!catalogReady) return;
  const query = normalizeText(value.trim());
  activeQuery = value.trim();
  filteredSchools = schools.filter(school => {
    if (savedOnly && !isSchoolSaved(school.id)) return false;
    if (activeRegion && normalizeText(school.city) !== normalizeText(activeRegion)) return false;
    if (activeGroupCode && !matchingPrograms(school,'',activeGroupCode).length) return false;
    if (!query) return true;
    return searchMode === 'major'
      ? matchingPrograms(school, value).length > 0
      : schoolSearchScore(school,value) > 0 || safelyMatches([school.name, school.short, school.city, school.id, ...(school.aliases || [])].join(' '), value);
  });
  if (query && searchMode === 'major') filteredSchools = filteredSchools.map(school => ({
    school, rank: searchScore(matchingPrograms(school,value)[0],value),
  })).sort((a,b) => b.rank-a.rank || a.school.name.localeCompare(b.school.name,'vi')).map(item => item.school);
  if (query && searchMode === 'school') filteredSchools.sort((a,b) =>
    schoolSearchScore(b,value)-schoolSearchScore(a,value) || a.name.localeCompare(b.name,'vi'));
  renderSidebar(filteredSchools);
  renderSchools(filteredSchools);
  refreshContextualPromotions();
  document.getElementById('searchClear').hidden = !query;
  const url = new URL(location.href);
  url.searchParams.set('mode', searchMode);
  if (value.trim()) url.searchParams.set('q', value.trim()); else url.searchParams.delete('q');
  url.searchParams.delete('major');
  if (activeRegion) url.searchParams.set('region', activeRegion); else url.searchParams.delete('region');
  if (activeGroupCode) url.searchParams.set('group', activeGroupCode); else url.searchParams.delete('group');
  if (savedOnly) url.searchParams.set('saved', '1'); else url.searchParams.delete('saved');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  document.getElementById('savedSchoolTotal').textContent = savedSchools().length;
  window.BWFlow?.save({ schoolFilters: { query: value.trim(), mode: searchMode, region: activeRegion, group: activeGroupCode, savedOnly } });
  document.getElementById('schoolCatalogStatus').textContent = query
    ? `Tìm thấy ${filteredSchools.length} trường theo ${searchMode === 'major' ? 'ngành đào tạo' : 'tên trường'} “${value.trim()}”${activeRegion ? ` tại ${activeRegion}` : ''}${activeGroupCode ? ' trong nhóm ngành đã chọn' : ''}.`
    : savedOnly || activeRegion || activeGroupCode ? `${filteredSchools.length} trường phù hợp với bộ lọc hiện tại.` : `${schools.filter(school => school.identity.entity_kind === 'university').length} hồ sơ trường đại học · ${schools.filter(school => school.identity.entity_kind === 'university_system').length} đại học vùng · Rà soát ${REVIEWED_AT}.`;
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
document.addEventListener('change', event => {
  if (event.target.id === 'wishPlanYear') { window.BWFlow?.save({ admissionPlanYear: Number(event.target.value) }); renderDialog(); dialog.querySelector('#wishPlanYear')?.focus(); }
  if (event.target.id === 'schoolProgramSort') { programSort = event.target.value === 'az' ? 'az' : 'code'; renderDialog(); dialog.querySelector('#schoolProgramSort')?.focus(); }
});

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'add-wish' && activeSchool) {
    const item = wishFromProgram(activeSchool, detailsForSchool(activeSchool.id), Number(target.dataset.program), wishYear());
    if (item) {
      window.BWFlow?.save({ wishes: addWish(selectedWishes(), item) });
      target.textContent = '✓ Đã thêm nguyện vọng'; target.disabled = true;
    }
    return;
  }
  if (action === 'toggle-saved-school') {
    const school = schools.find(item => item.id === target.dataset.schoolId);
    if (school) {
      if (isSchoolSaved(school.id)) window.BWFlow?.save({ savedSchools: savedSchools().filter(item => item.id !== school.id) });
      else window.BWFlow?.addUnique('savedSchools', { id: school.id, name: school.name, city: school.city });
      filterSchools(document.getElementById('searchInput').value);
      [...mainContent.querySelectorAll('[data-action="toggle-saved-school"]')].find(node => node.dataset.schoolId === school.id)?.focus({preventScroll:true});
    }
    return;
  }
  if (action === 'compare-school') { event.stopPropagation(); updateCompare(target.dataset.schoolId, target.checked, true); return; }
  if (action === 'remove-compare') { updateCompare(target.dataset.schoolId, false); return; }
  if (action === 'compare-profile') { openSchool(target.dataset.schoolId, target.dataset.tab); return; }
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
    const saved = isSchoolSaved(activeSchool.id);
    if (saved) window.BWFlow?.save({ savedSchools: savedSchools().filter(item => item.id !== activeSchool.id) });
    else window.BWFlow?.addUnique('savedSchools', { id: activeSchool.id, name: activeSchool.name, city: activeSchool.city });
    renderDialog();
    filterSchools(document.getElementById('searchInput').value);
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
  savedOnly = false;
  document.getElementById('savedSchoolOnly').checked = false;
  activeRegion = '';
  document.getElementById('regionFilter').value = '';
  activeGroupCode = '';
  document.getElementById('groupFilter').value = '';
  document.getElementById('searchInput').value = '';
  filterSchools('');
});
document.getElementById('savedSchoolOnly')?.addEventListener('change', event => { savedOnly = event.target.checked; filterSchools(document.getElementById('searchInput').value); });
document.getElementById('clearSchoolCompare')?.addEventListener('click', () => { compareIds = []; try { localStorage.removeItem(compareStorageKey); } catch {} renderSchools(filteredSchools); renderCompare(); });
document.querySelectorAll('input[name="schoolSearchMode"]').forEach(input => input.addEventListener('change', event => {
  searchMode = event.target.value;
  updateSearchSuggestions();
  filterSchools(document.getElementById('searchInput').value);
}));
document.getElementById('regionFilter')?.addEventListener('change', event => {
  activeRegion = event.target.value;
  filterSchools(document.getElementById('searchInput').value);
});
document.getElementById('groupFilter')?.addEventListener('change', event => {
  activeGroupCode = event.target.value;
  filterSchools(document.getElementById('searchInput').value);
});
window.addEventListener('hashchange', scrollToTargetFromUrl);

async function initPage2() {
  catalogReady = false;
  document.getElementById('schoolCatalogStatus').textContent = 'Đang tải danh sách trường…';
  document.getElementById('schoolCatalogCount').textContent = 'Đang tải…';
  mainContent.setAttribute('aria-busy', 'true');
  const controls = [...document.querySelectorAll('#searchInput, #regionFilter, #groupFilter, input[name="schoolSearchMode"], #resetSchoolFilters, #savedSchoolOnly')];
  controls.forEach(control => { control.disabled = true; });
  try {
    const response = await fetch('/assets/data/schools.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = buildUniversityCatalog(await response.json(), sourceRegistry.universities);
    schools = catalog.schools;
    let legacy = [];
    try { legacy = JSON.parse(window.BWFlow?.storage.get('bw_schools_selected') || '[]'); } catch { /* keep unreadable legacy storage untouched */ }
    window.BWFlow?.save(importLegacySchools(savedSchools(), legacy, schools, window.BWFlow?.read().importedSchoolCodes));
    catalogReady = true;
    const params = new URLSearchParams(location.search);
    const previousFilters = !params.size ? window.BWFlow?.read().schoolFilters : null;
    savedOnly = params.get('saved') === '1' || Boolean(previousFilters?.savedOnly);
    document.getElementById('savedSchoolOnly').checked = savedOnly;
    const initialQuery = params.get('major') || params.get('q') || previousFilters?.query || '';
    searchMode = params.get('mode') === 'major' || params.has('major') || params.get('focus') === 'major' ? 'major' : 'school';
    activeRegion = params.get('region') || '';
    activeGroupCode = params.get('group') || '';
    if (previousFilters) { searchMode = previousFilters.mode === 'major' ? 'major' : 'school'; activeRegion = previousFilters.region || ''; activeGroupCode = previousFilters.group || ''; }
    document.querySelector(`input[name="schoolSearchMode"][value="${searchMode}"]`).checked = true;
    const regions = [...new Set(schools.map(school => school.city).filter(Boolean))].sort((first, second) => first.localeCompare(second, 'vi'));
    document.getElementById('regionFilter').innerHTML = '<option value="">Tất cả khu vực</option>' + regions.map(region => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join('');
    if (regions.includes(activeRegion)) document.getElementById('regionFilter').value = activeRegion; else activeRegion = '';
    const groups = new Map();
    let hasUnverified = false;
    schools.forEach(school => (detailsForSchool(school.id)?.programs || []).forEach(program => {
      const taxonomy = classifyProgram(program);
      if (taxonomy.groupCode) groups.set(taxonomy.groupCode,taxonomy.groupName);
      else hasUnverified = true;
    }));
    document.getElementById('groupFilter').innerHTML = '<option value="">Tất cả nhóm ngành</option>'
      + [...groups].sort(([a],[b]) => a.localeCompare(b)).map(([code,name]) => `<option value="${escapeHtml(code)}">${escapeHtml(code)} · ${escapeHtml(name)}</option>`).join('')
      + (hasUnverified ? '<option value="unverified">Chưa xác minh nhóm</option>' : '');
    if (activeGroupCode === 'unverified' && hasUnverified || groups.has(activeGroupCode)) document.getElementById('groupFilter').value = activeGroupCode;
    else activeGroupCode = '';
    updateSearchSuggestions();
    document.getElementById('searchInput').value = initialQuery;
    filterSchools(initialQuery);
    renderCompare();
    // Searching is not a decision to save a major.
    document.getElementById('schoolCatalogCount').textContent = `${catalog.stats.universities} trường`;
    const career = new URLSearchParams(location.search).get('career') || window.BWFlow?.read().career?.name;
    if (career && !document.getElementById('schoolJourney')) {
      const host = document.createElement('div');
      host.id = 'schoolJourney';
      host.className = 'flow-resume';
      document.querySelector('.p2-layout')?.before(host);
      const returnPath = params.get('careerReturn');
      const back = /^\/?careers-holland\.html\?(?:[^#]*)$/.test(returnPath || '') ? returnPath : 'careers-holland.html?q=' + encodeURIComponent(career);
      window.BWFlow?.nextStep(host, `Nghề bạn đang quan tâm: ${career}`, 'Đọc danh mục ngành và nguồn tuyển sinh, rồi thêm chương trình muốn tìm hiểu vào nguyện vọng dự kiến.', [['Quay lại nghề đang xem', back], ['Nguyện vọng của tôi', 'profile.html?tab=journey#my-choices']]);
    }
    requestAnimationFrame(scrollToTargetFromUrl);
    if (params.get('focus') === 'major') requestAnimationFrame(() => document.getElementById('searchInput')?.focus());
  } catch (error) {
    console.error('[school catalog]', error);
    document.getElementById('schoolCatalogCount').textContent = 'Chưa tải được';
    document.getElementById('schoolCatalogStatus').textContent = 'Chưa tải được danh sách trường. Vui lòng thử lại.';
    sidebar.innerHTML = '<p class="p2-sidebar-empty">Danh sách trường chưa khả dụng.</p>';
    mainContent.innerHTML = '<div class="p2-no-results">Không thể tải dữ liệu trường. <button type="button" id="retrySchoolCatalog">Thử lại</button></div>';
    document.getElementById('retrySchoolCatalog').addEventListener('click', initPage2);
  } finally {
    mainContent.setAttribute('aria-busy', 'false');
    controls.forEach(control => { control.disabled = !catalogReady; });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage2);
else initPage2();
