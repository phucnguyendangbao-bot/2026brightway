// page2.js — extracted từ page2.html (Phase 2 — kiến trúc)
// Loaded với <script type="module"> nên file chạy đúng 1 lần.
// Các hàm dùng bởi inline onclick/oninput tạm thời vẫn được gán lên window
// để không vỡ UI; sẽ migrate sang addEventListener ở commit riêng.
import sourceRegistry from '../data/school-admissions-sources.js';
import { buildUniversityCatalog, canonicalSchoolId, REVIEWED_AT } from '../data/university-identities.js';
import { renderSchoolHistory } from './school-history.js';
const sourceAliases = { 'fpt-ai': 'fpt', 'khtn-hcm': 'hcmus' };
function sourceForSchool(id) {
  return sourceRegistry.universities.find(row => row.school_id === (sourceAliases[id] || id));
}
const sourceEscape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ═══════════════════════════════════════
   SCHOLARSHIP DATA
   Load từ assets/data/schools.json (Phase 4 — cập nhật từ docx + logo thật)
   ════════════════════════════════════════ */
let SCHOOLS = [];
let SCHOOLS_LOAD_ERROR = null;

async function loadSchoolsData() {
  try {
    const res = await fetch('/assets/data/schools.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const catalog = buildUniversityCatalog(data, sourceRegistry.universities);
    SCHOOLS = catalog.schools;
    document.getElementById('schoolCatalogStatus').textContent = `${catalog.stats.universities} hồ sơ trường đại học · ${catalog.stats.systems} đại học vùng (không đếm cơ sở/chương trình là trường riêng). ${catalog.stats.unresolved} bản ghi cần xác minh danh tính, chưa tính vào số trường. Rà soát ${REVIEWED_AT}; tuyển sinh 2027 chưa được kế thừa dữ liệu 2026.`;
    return SCHOOLS;
  } catch (err) {
    console.error('[loadSchoolsData] failed:', err);
    SCHOOLS_LOAD_ERROR = err.message;
    document.getElementById('schoolCatalogStatus').textContent = 'Chưa tải được danh sách trường. Không dùng số 0 để thay cho lỗi dữ liệu.';
    SCHOOLS = [];
    return [];
  }
}

/* ═══════════════ RENDER ═══════════════ */
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
let searchTerm = '';
// Keep per-school selection while searching; an explicit deep link may open 2025.
const initialAdmissionYear = new URLSearchParams(location.search).get('admission_year') === '2025' ? 2025 : 2026;
const schoolYears = new Map();

function renderSidebar(schools) {
  if (!sidebar) return;
  try {
    const titleHtml = '<div class="p2-sidebar-title">Phương thức xét tuyển theo trường</div>';

    // Thứ tự nhóm ngành hiển thị
    const FIELD_LABELS = {
      'it':           { label: 'Công nghệ thông tin',       order: 1 },
      'engineering':  { label: 'Kỹ thuật – Công nghệ',      order: 2 },
      'science':      { label: 'Khoa học tự nhiên',         order: 3 },
      'medicine':     { label: 'Y khoa – Sức khỏe',         order: 4 },
      'agriculture':  { label: 'Nông nghiệp – Thủy sản',    order: 5 },
      'business':     { label: 'Kinh tế – Quản trị',        order: 6 },
      'social':       { label: 'Xã hội – Nhân văn',         order: 7 },
      'education':    { label: 'Sư phạm – Giáo dục',        order: 8 },
      'private':      { label: 'Tư thục – Quốc tế',         order: 9 },
      'other':        { label: 'Khác',                      order: 99 }
    };

    // Group trường theo fields[0] (nhóm chính)
    const grouped = {};
    const safeSchools = Array.isArray(schools) ? schools : [];
    safeSchools.forEach(s => {
      const fields = s.fields && s.fields.length ? s.fields : ['other'];
      const mainField = fields[0];
      if (!grouped[mainField]) grouped[mainField] = [];
      grouped[mainField].push(s);
    });

    // Sort nhóm theo order
    const sortedFields = Object.keys(grouped).sort((a, b) => {
      const oa = FIELD_LABELS[a]?.order || 99;
      const ob = FIELD_LABELS[b]?.order || 99;
      return oa - ob;
    });

    let linksHtml = '';
    sortedFields.forEach(field => {
      const fieldInfo = FIELD_LABELS[field] || FIELD_LABELS['other'];
      linksHtml += `<div class="p2-sidebar-field-title">${fieldInfo.label}</div>`;
      grouped[field].forEach(s => {
        const mainLink = `<a href="#${s.id}" data-id="${s.id}" data-action="highlight-section" data-school-id="${s.id}" class="p2-sidebar-school">
          <span class="p2-sidebar-school-text">
            <span class="p2-sidebar-school-name">${s.short || s.name || '---'}</span>
            <span class="p2-sidebar-school-city">${s.city || ''}</span>
          </span>
        </a>`;
        const variantLinks = (s.status === 'verified_school_scheme' && s.variants && s.variants.length)
          ? s.variants.map(v => {
              return `<a href="#${v.id}" data-id="${v.id}" data-action="highlight-section" data-school-id="${v.id}" class="p2-sidebar-school p2-sidebar-variant">
                <span class="p2-sidebar-school-text">
                  <span class="p2-sidebar-school-name">${v.label || v.short || v.name}</span>
                </span>
              </a>`;
            }).join('')
          : '';
        linksHtml += mainLink + variantLinks;
      });
    });

    const emptyMsg = safeSchools.length === 0
      ? '<div class="p2-sidebar-empty">Không có trường nào khớp từ khóa.</div>'
      : '';
    sidebar.innerHTML = titleHtml + linksHtml + emptyMsg;
  } catch (err) {
    console.error('[renderSidebar] error:', err);
    sidebar.innerHTML = '<div class="p2-sidebar-title">Phương thức xét tuyển theo trường</div><div class="p2-sidebar-error">Lỗi hiển thị danh sách. Vui lòng tải lại trang.</div>';
  }
}

function renderSchools(schools) {
  if (schools.length === 0) {
    mainContent.innerHTML = '<div class="p2-no-results">Không tìm thấy trường phù hợp với từ khóa.</div>';
    return;
  }
  mainContent.innerHTML = schools.map(s => {
    const selectedYear = schoolYears.get(s.id) || initialAdmissionYear;
    const source = sourceForSchool(s.id);
    const verified = s.status === 'verified_school_scheme' && s.policy_year === 2026 && Boolean(s.verified_at);
    const methods = verified ? s.admissionMethods || [] : [];
    const cardsHtml = methods.map(m => `
      <div class="ad-card">
        <div class="ad-card-title">📋 ${m.name}</div>
        <div class="ad-row">
          <span class="ad-label">📚 Tổ hợp môn:</span>
          <span class="ad-value">${m.subjects}</span>
        </div>
        <div class="ad-row">
          <span class="ad-label">📊 Chỉ tiêu:</span>
          <span class="ad-value"><span class="ad-tag ad-tag-blue">${m.quota}</span></span>
        </div>
        <div class="ad-row">
          <span class="ad-label">📅 Thời gian:</span>
          <span class="ad-value"><span class="ad-tag ad-tag-green">${m.timeline}</span></span>
        </div>
        ${m.note ? `<div class="ad-note">💡 ${m.note}</div>` : ''}
      </div>
    `).join('');

    // Render variants (chương trình con) nếu có
    const variantsHtml = (s.variants && s.variants.length)
      ? s.variants.map(v => {
          const vMethods = verified && v.status === 'verified_school_scheme' ? v.admissionMethods || [] : [];
          const vCards = vMethods.map(m => `
            <div class="ad-card ad-card-variant">
              <div class="ad-card-title">📋 ${m.name}</div>
              <div class="ad-row">
                <span class="ad-label">📚 Tổ hợp môn:</span>
                <span class="ad-value">${m.subjects}</span>
              </div>
              <div class="ad-row">
                <span class="ad-label">📊 Chỉ tiêu:</span>
                <span class="ad-value"><span class="ad-tag ad-tag-blue">${m.quota}</span></span>
              </div>
              <div class="ad-row">
                <span class="ad-label">📅 Thời gian:</span>
                <span class="ad-value"><span class="ad-tag ad-tag-green">${m.timeline}</span></span>
              </div>
              ${m.note ? `<div class="ad-note">💡 ${m.note}</div>` : ''}
            </div>
          `).join('');
          return `
            <div class="school-variant" id="${v.id}">
              <div class="school-variant-header">
                <h3 class="school-variant-title">
                  ${v.website ? `<a href="${v.website}" target="_blank" rel="noopener" class="school-name-link">${v.name} <svg style="display:inline;vertical-align:middle;margin-left:4px;opacity:.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : v.name}
                </h3>
                <span class="school-variant-tag">${v.label || ''}</span>
                ${v.admissionUrl ? `<a href="${v.admissionUrl}" target="_blank" rel="noopener" class="school-admission-cta" title="Xem chi tiết tuyển sinh chính thức">Xem chi tiết →</a>` : ''}
              </div>
              <div class="ad-cards ad-cards-variant">
                ${vCards}
              </div>
            </div>
          `;
        }).join('')
      : '';

    return `
      <section class="school-section" id="${s.id}">
        <div class="school-header">
          <div class="school-icon" id="icon-${s.id}"></div>
          <div class="school-info">
            <h2 class="school-name">${s.website ? `<a href="${s.website}" target="_blank" rel="noopener" class="school-name-link">${s.name} <svg style="display:inline;vertical-align:middle;margin-left:5px;opacity:.55" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : s.name}</h2>
            <div class="school-badges">
              <span class="school-badge-short">${s.short}</span>
              <span class="school-badge-city">📍 ${s.city}</span>
              <span class="school-badge-variants">${s.identity.entity_kind === 'university_system' ? 'Đại học vùng · gồm các trường thành viên' : 'Hồ sơ trường đại học'}</span>
              ${s.identity.represented_unit ? `<span>${sourceEscape(s.identity.represented_unit)}</span>` : ''}
            </div>
          </div>
          ${s.admissionUrl ? `<a href="${s.admissionUrl}" target="_blank" rel="noopener" class="school-admission-cta school-admission-cta-main" title="Mở nguồn tuyển sinh chính thức; nguồn năm trước nằm trong mục 2025 bên dưới">${source ? `Nguồn tuyển sinh ${source.admission_year}` : 'Cổng tuyển sinh trường'} →</a>` : ''}
        </div>

        <div class="school-years">
          <span id="year-label-${s.id}" class="school-years-label">Thông tin tuyển sinh theo năm</span>
          <div class="school-year-controls" role="group" aria-labelledby="year-label-${s.id}">
            ${[2026, 2025].map(year => `<button type="button" id="year-${s.id}-${year}" data-action="school-year" data-school-id="${s.id}" data-year="${year}" aria-pressed="${selectedYear === year}" aria-controls="admissions-${s.id}-${year}">${year}${year === 2025 ? ' · Năm trước' : ''}</button>`).join('')}
          </div>
        </div>
        <div id="admissions-${s.id}-2025" class="school-year-panel" role="region" aria-labelledby="year-${s.id}-2025" ${selectedYear === 2025 ? '' : 'hidden'}>
          ${renderSchoolHistory(s.id)}
        </div>
        <div id="admissions-${s.id}-2026" class="school-year-panel" role="region" aria-labelledby="year-${s.id}-2026" ${selectedYear === 2026 ? '' : 'hidden'}>
        <!-- THÔNG TIN BỔ SUNG: Cơ sở, Chương trình, Tỉnh điểm -->
        ${source ? `<div class="ad-note school-source-note">
          <strong>Tuyển sinh ${source.admission_year} · ${source.source_status === 'confirmed_2026_source' ? 'Đã xác nhận nguồn' : 'Cần kiểm tra tài liệu đầy đủ'}</strong>
          <p>${sourceEscape(source.source_summary)}</p>
          <p>${sourceEscape(source.review_note)}</p>
          <a href="${sourceEscape(source.source_url)}" target="_blank" rel="noopener noreferrer">Nguồn tuyển sinh ↗</a>
          · <a href="${sourceEscape(source.supplementary_url)}" target="_blank" rel="noopener noreferrer">Nguồn bổ sung ↗</a>
          <p>Kiểm tra nguồn: ${source.checked_at}. Công thức theo ngành: ${source.formula_status === 'verified_partial_formula' ? 'đã xác nhận thành phần; cần điều kiện ngành' : 'chưa đủ dữ liệu để tính chính xác'}.</p>
        </div>` : ''}
        ${!verified ? `<div class="ad-note">Dữ liệu chi tiết trường đang chờ đối chiếu đề án theo năm. Tổ hợp, chỉ tiêu, cơ sở và thời hạn cần kiểm tra tại thông báo chính thức của trường. <a href="resources.html?school=${encodeURIComponent(s.id)}">Xem tin tuyển sinh của trường →</a></div>` : ''}
        <div class="ad-note"><p>Năm dữ liệu tuyển sinh: ${s.admission_year || 'Chưa có dữ liệu xác minh'} · Rà soát hồ sơ: ${s.updated_at} · Chưa xác minh đầy đủ đề án.</p><p>Học phí, điểm chuẩn theo ngành/năm: Chưa có dữ liệu xác minh. Không dùng thông tin này để dự đoán đỗ/trượt.</p><p>Danh tính: ${s.identity.status === 'identity_source_opened' ? 'Đã mở nguồn nhận diện trường; không phải xác minh công thức' : 'Nguồn cần kiểm tra lại'}.</p><a href="${sourceEscape(s.identity.source_url)}" target="_blank" rel="noopener noreferrer">Nguồn nhận diện trường ↗</a></div>
        <div class="school-info-grid">
          ${verified && s.campuses && s.campuses.length ? `
          <div class="info-grid-item">
            <div class="info-grid-label">🏫 Cơ sở đào tạo</div>
            <div class="info-grid-value">${s.campuses.map(c => `<span class="info-tag">${c}</span>`).join('')}</div>
          </div>` : ''}
          ${verified && s.programs && s.programs.length ? `
          <div class="info-grid-item">
            <div class="info-grid-label">📖 Chương trình đào tạo</div>
            <div class="info-grid-value">${s.programs.map(p => `<span class="info-tag info-tag-purple">${p}</span>`).join('')}</div>
          </div>` : ''}
          ${verified && s.provinces ? `
          <div class="info-grid-item info-grid-item-full">
            <div class="info-grid-label">🗺️ Tỉnh điểm tuyển sinh</div>
            <div class="info-grid-value">${s.provinces}</div>
          </div>` : ''}
        </div>

        <div class="ad-cards">
          ${cardsHtml}
        </div>
        ${variantsHtml ? `<div class="school-variants">${variantsHtml}</div>` : ''}
        </div>
        <div class="flow-actions" style="margin-top:20px">
          <a href="resources.html?school=${encodeURIComponent(s.id)}">Tin tuyển sinh đã đối chiếu →</a>
          <a href="score-calculator.html?school=${encodeURIComponent(s.id)}" data-action="choose-school" data-school-id="${s.id}">Tính điểm tham khảo 2026 →</a>
          <a href="calendar.html">Xem lộ trình tuyển sinh →</a>
        </div>
      </section>
    `;
  }).join('');

  // Inject logos (Phase 4 — logo thật local + chain):
  //   1. Local asset (assets/images/logos/<short>.png) — file thật kéo về repo
  //   2. Wikimedia Commons verified
  //   3. Google Favicon API
  //   4. SVG brand gradient badge
  schools.forEach(s => {
    const iconEl = document.getElementById('icon-' + s.id);
    if (!iconEl) return;

    // 1. Wikimedia verified (match short/alias/name)
    const uniInfo = (window.UNILogo && window.UNILogo(s.short || s.name)) || null;
    const hasVerifiedLogo = (url) => url && typeof url === 'string' && url.includes('upload.wikimedia.org/wikipedia/commons/');
    const wikiLogo = uniInfo && hasVerifiedLogo(uniInfo.logo) ? uniInfo.logo : null;
    const wikiLogoAlt = uniInfo && hasVerifiedLogo(uniInfo.logoAlt) && uniInfo.logoAlt !== wikiLogo ? uniInfo.logoAlt : null;

    function getDomain(url) { try { return new URL(url).hostname; } catch(e) { return null; } }
    const domain = getDomain(s.website) || (s.logoUrl && s.logoUrl.startsWith('http') ? getDomain(s.logoUrl) : null);
    const googleFav = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : null;

    // 2. Local asset (chỉ khi logoUrl là đường dẫn assets/...)
    const localLogo = (s.logoUrl && !s.logoUrl.startsWith('http')) ? s.logoUrl : null;

    const srcs = [];
    if (localLogo) srcs.push(localLogo);
    if (wikiLogo) srcs.push(wikiLogo);
    if (wikiLogoAlt) srcs.push(wikiLogoAlt);
    if (googleFav) srcs.push(googleFav);

    function renderFallbackBadge() {
      iconEl.innerHTML = '';
      if (window.UNILogoSvg) {
        iconEl.innerHTML = window.UNILogoSvg(s.short || s.name, { size: 56 });
        iconEl.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
      } else {
        const initials = (s.short || s.name || '?')
          .replace(/ĐH\s*/i, '')
          .replace(/[^A-Za-zÀ-ỹ\s]/g, '')
          .split(/\s+/).slice(0, 2)
          .map(w => w[0] || '')
          .join('').toUpperCase() || '?';
        iconEl.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,#6366f1,#a78bfa);color:#fff;font-weight:800;font-size:18px;border-radius:8px;font-family:"Nunito",sans-serif;';
        iconEl.textContent = initials;
      }
    }

    if (srcs.length > 0) {
      const img = document.createElement('img');
      img.alt = s.short;
      img.title = s.name;
      img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:4px;display:block;';
      let step = 0;
      img.onerror = () => {
        step++;
        if (step < srcs.length) { img.src = srcs[step]; }
        else { renderFallbackBadge(); }
      };
      img.src = srcs[0];
      iconEl.appendChild(img);
    } else {
      renderFallbackBadge();
    }
  });
}


// Normalize Vietnamese text: lowercase + remove diacritics for accent-insensitive search
function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function filterSchools(val) {
  try {
    searchTerm = normalizeText(val);
    const filtered = !searchTerm ? SCHOOLS : SCHOOLS.filter(s => {
      const haystack = normalizeText([
        s.id, s.name, s.short, s.city,
        ...(Array.isArray(s.aliases) ? s.aliases : []),
        s.identity?.name
      ].filter(Boolean).join(' '));
      return haystack.includes(searchTerm);
    });
    const clearButton = document.getElementById('searchClear');
    if (clearButton) clearButton.hidden = !searchTerm;
    const status = document.getElementById('schoolCatalogStatus');
    if (status && SCHOOLS.length) {
      status.textContent = searchTerm
        ? `Đang hiển thị ${filtered.length}/${SCHOOLS.length} trường phù hợp với “${val.trim()}”.`
        : `${SCHOOLS.length} hồ sơ trường đại học · Nhập tên trường hoặc thành phố để lọc nhanh.`;
    }
    renderSidebar(filtered);
    renderSchools(filtered);
    try {
      setupObserver(filtered.map(s => s.id));
    } catch (e) { /* observer is optional */ }
  } catch (err) {
    console.error('[filterSchools] error:', err);
    renderSidebar(SCHOOLS);
    renderSchools(SCHOOLS);
  }
}

let searchDebounceTimer = null;

function highlightSection(id) {
  id = canonicalSchoolId(id);
  // Xóa highlight cũ
  document.querySelectorAll('.school-section.highlight, .school-variant.highlight').forEach(el => el.classList.remove('highlight'));
  document.querySelectorAll('.p2-sidebar a').forEach(a => a.classList.remove('active'));

  // Tìm element theo id (có thể là school-section hoặc school-variant)
  let el = document.getElementById(id);
  if (!el) return;

  // Nếu click vào variant → scroll tới section cha, rồi highlight variant
  if (el.classList.contains('school-variant')) {
    const parentSection = el.closest('.school-section');
    if (parentSection) {
      // Scroll tới section cha trước (tránh header che)
      const rect = parentSection.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - 96; // 96 = nav height + buffer
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      // Sau khi scroll xong, highlight variant
      setTimeout(() => {
        el.classList.add('highlight');
        // Đánh dấu active trên sidebar
        const link = document.querySelector(`.p2-sidebar a[data-id="${id}"]`);
        if (link) link.classList.add('active');
      }, 500);
      return;
    }
  }

  // School section bình thường
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => el.classList.add('highlight'), 100);
  const link = document.querySelector(`.p2-sidebar a[data-id="${id}"]`);
  if (link) link.classList.add('active');
}

/* ═══════════════ INIT ═══════════════ */

let activeObserver = null;

function setupObserver(currentIds) {
  if (activeObserver) activeObserver.disconnect();

  activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.p2-sidebar a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.p2-sidebar a[data-id="${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

  currentIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) activeObserver.observe(el);
  });
}

function scrollToTargetFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('school');
  const fromHash = window.location.hash ? window.location.hash.slice(1) : '';
  const targetId = canonicalSchoolId(fromHash || fromQuery);

  if (!targetId) return;

  // A valid deep link must remain reachable even when the current search hid it.
  if (SCHOOLS.some(s => s.id === targetId) && !document.getElementById(targetId)) {
    searchTerm = '';
    document.getElementById('searchInput').value = '';
    renderSidebar(SCHOOLS);
    renderSchools(SCHOOLS);
    if (typeof IntersectionObserver !== 'undefined') setupObserver(SCHOOLS.map(s=>s.id));
  }

  if (!fromHash && fromQuery) {
    window.location.hash = `#${fromQuery}`;
    return; // hashchange will handle the scroll
  }

  if (targetId === 'hucfl' && !document.getElementById(targetId)) {
    mainContent.insertAdjacentHTML('afterbegin', '<section id="hucfl" class="ad-note"><h2>Bản ghi trường đang chờ xác minh</h2><p>Tên KHXH &amp; NV – Đại học Huế không khớp nguồn hiện có; chưa đếm là một trường độc lập. Dữ liệu gốc được giữ, không tự chuyển sang trường khác.</p><a href="https://sinhvien.hueuni.edu.vn/" target="_blank" rel="noopener noreferrer">Đối chiếu các đơn vị Đại học Huế ↗</a></section>');
  }
  const el = document.getElementById(targetId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightSection(targetId);

    document.querySelectorAll('.p2-sidebar a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.p2-sidebar a[data-id="${targetId}"]`);
    if (link) link.classList.add('active');
  }
}

function toggleAccordion(card) {
  const detail = card.querySelector('.accordion-detail');
  const arrow = card.querySelector('.accordion-arrow');
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  card.classList.toggle('open', !isOpen);
  if (!isOpen) {
    card.style.gridColumn = window.innerWidth > 640 ? '1 / -1' : '';
  } else {
    card.style.gridColumn = '';
  }
}

async function initPage2() {
  // Load dữ liệu trường từ JSON trước
  await loadSchoolsData();
  const career = new URLSearchParams(location.search).get('career') || window.BWFlow?.read().career?.name;
  if (career && !document.getElementById('schoolJourney')) {
    const host = document.createElement('div');
    host.id = 'schoolJourney';
    host.className = 'flow-resume';
    document.querySelector('.p2-layout')?.before(host);
    window.BWFlow?.nextStep(host, 'Nghề bạn đang quan tâm: ' + career, 'Tìm trường rồi đối chiếu ngành đào tạo trên trang tuyển sinh chính thức trước khi tính điểm.', [['Đổi nghề', 'careers-holland.html'], ['Tính điểm', 'score-calculator.html']]);
  }
  try {
    renderSidebar(SCHOOLS);
    renderSchools(SCHOOLS);
  } catch (e) {
    console.error('[init render] error:', e);
  }
  try {
    if (typeof IntersectionObserver !== 'undefined') {
      setupObserver(SCHOOLS.map(s => s.id));
    }
  } catch (e) {
    console.error('[init observer] error:', e);
  }
  setTimeout(() => {
    try { scrollToTargetFromUrl(); } catch (e) { console.error('[scrollTo] error:', e); }
  }, 150);
  // Show error banner nếu load fail
  if (SCHOOLS_LOAD_ERROR && mainContent) {
    mainContent.insertAdjacentHTML('afterbegin', '<div class="flow-status" role="status">Chưa tải được danh sách trường. <button type="button" data-action="retry-schools">Thử lại</button></div>');
  }
}

// ── Event delegation thay cho inline onclick/oninput ──
//
// Mọi tương tác được route qua data-action:
//   - filter-schools (input#searchInput): filterSchools(value)
//   - highlight-section (a.p2-sidebar a): highlightSection(schoolId)
function attachPage2Listeners() {
  document.addEventListener('input', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    if (target.getAttribute('data-action') === 'filter-schools') {
      window.clearTimeout(searchDebounceTimer);
      const value = target.value;
      searchDebounceTimer = window.setTimeout(() => filterSchools(value), 120);
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'school-year') {
      const id = canonicalSchoolId(target.dataset.schoolId);
      const year = Number(target.dataset.year);
      if (![2025, 2026].includes(year) || !SCHOOLS.some(s => s.id === id)) return;
      schoolYears.set(id, year);
      const section = document.getElementById(id);
      section.querySelectorAll('[data-action="school-year"]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.year) === year)));
      [2025, 2026].forEach(y => { document.getElementById(`admissions-${id}-${y}`).hidden = y !== year; });
      return;
    }
    if (action === 'retry-schools') { location.reload(); return; }
    if (action === 'choose-school') {
      const school = SCHOOLS.find(s => s.id === target.dataset.schoolId);
      if (school) window.BWFlow?.save({ school: { id: school.id, name: school.name } });
      return;
    }
    if (action === 'highlight-section') {
      const id = target.getAttribute('data-school-id');
      if (id) highlightSection(id);
      return;
    }
    if (action === 'toggle-accordion') {
      // card là chính target (đã được .closest tìm thấy)
      toggleAccordion(target);
      return;
    }
  });

  document.getElementById('searchClear')?.addEventListener('click', () => {
    const input = document.getElementById('searchInput');
    if (!input) return;
    window.clearTimeout(searchDebounceTimer);
    input.value = '';
    input.focus();
    filterSchools('');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    attachPage2Listeners();
    initPage2();
  });
} else {
  attachPage2Listeners();
  initPage2();
}

window.addEventListener('hashchange', () => {
  setTimeout(scrollToTargetFromUrl, 50);
});

// (window.filterSchools/highlightSection/toggleAccordion đã bỏ —
// module giờ route qua data-action; giữ lại sẽ tốn bộ nhớ global không cần thiết.)
