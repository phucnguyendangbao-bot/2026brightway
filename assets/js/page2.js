// page2.js — extracted từ page2.html (Phase 2 — kiến trúc)
// Loaded với <script type="module"> nên file chạy đúng 1 lần.
// Các hàm dùng bởi inline onclick/oninput tạm thời vẫn được gán lên window
// để không vỡ UI; sẽ migrate sang addEventListener ở commit riêng.

/* ═══════════════════════════════════════
   SCHOLARSHIP DATA
   Load từ assets/data/schools.json (Phase 4 — cập nhật từ docx + logo thật)
   ════════════════════════════════════════ */
let SCHOOLS = [];
let SCHOOLS_LOAD_ERROR = null;

async function loadSchoolsData() {
  try {
    const res = await fetch('assets/data/schools.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    SCHOOLS = Array.isArray(data) ? data : [];
    return SCHOOLS;
  } catch (err) {
    console.error('[loadSchoolsData] failed:', err);
    SCHOOLS_LOAD_ERROR = err.message;
    SCHOOLS = [];
    return [];
  }
}

/* ═══════════════ RENDER ═══════════════ */
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
let searchTerm = '';

function renderSidebar(schools) {
  if (!sidebar) return;
  try {
    const titleHtml = '<div class="p2-sidebar-title">📚 Phương thức xét tuyển theo trường</div>';

    // Thứ tự nhóm ngành hiển thị
    const FIELD_LABELS = {
      'it':           { label: '💻 Công nghệ thông tin',          order: 1 },
      'engineering':  { label: '⚙️ Kỹ thuật – Công nghệ',         order: 2 },
      'science':      { label: '🔬 Khoa học tự nhiên',              order: 3 },
      'medicine':     { label: '🏥 Y khoa – Sức khỏe',             order: 4 },
      'agriculture':  { label: '🌾 Nông nghiệp – Thủy sản',        order: 5 },
      'business':     { label: '💼 Kinh tế – Quản trị',            order: 6 },
      'social':       { label: '📚 Xã hội – Nhân văn',              order: 7 },
      'education':    { label: '🎓 Sư phạm – Giáo dục',            order: 8 },
      'private':      { label: '🌐 Tư thục – Quốc tế',             order: 9 },
      'other':        { label: '🏫 Khác',                            order: 99 }
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
        // Logo thật: dùng UNILogoImg (logoLocal -> Wikimedia -> SVG fallback)
        const logoHtml = (window.UNILogoImg && s.short)
          ? window.UNILogoImg(s.short, { size: 28, class: 'p2-sidebar-logo' })
          : `<span class="p2-sidebar-emoji">${s.logoFallback || '🏫'}</span>`;
        const mainLink = `<a href="#${s.id}" data-id="${s.id}" data-action="highlight-section" data-school-id="${s.id}" class="p2-sidebar-school">
          <span class="p2-sidebar-logo-wrap">${logoHtml}</span>
          <span class="p2-sidebar-school-text">
            <span class="p2-sidebar-school-name">${s.short || s.name || '---'}</span>
            <span class="p2-sidebar-school-city">${s.city || ''}</span>
          </span>
        </a>`;
        const variantLinks = (s.variants && s.variants.length)
          ? s.variants.map(v => {
              const vLogo = (window.UNILogoImg && s.short)
                ? window.UNILogoImg(s.short, { size: 22, class: 'p2-sidebar-logo p2-sidebar-logo-sm' })
                : `<span class="p2-sidebar-emoji">${s.logoFallback || '🏫'}</span>`;
              return `<a href="#${v.id}" data-id="${v.id}" data-action="highlight-section" data-school-id="${v.id}" class="p2-sidebar-school p2-sidebar-variant">
                <span class="p2-sidebar-logo-wrap">${vLogo}</span>
                <span class="p2-sidebar-school-text">
                  <span class="p2-sidebar-school-name">↳ ${v.label || v.short || v.name}</span>
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
    sidebar.innerHTML = '<div class="p2-sidebar-title">📚 Phương thức xét tuyển theo trường</div><div class="p2-sidebar-error">Lỗi hiển thị danh sách. Vui lòng tải lại trang.</div>';
  }
}

function renderSchools(schools) {
  if (schools.length === 0) {
    mainContent.innerHTML = '<div class="p2-no-results">Không tìm thấy trường phù hợp với từ khóa.</div>';
    return;
  }
  mainContent.innerHTML = schools.map(s => {
    const methods = s.admissionMethods || [];
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
          const vMethods = v.admissionMethods || [];
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
              ${s.variants && s.variants.length ? `<span class="school-badge-variants">+ ${s.variants.length} chương trình</span>` : ''}
            </div>
          </div>
          ${s.admissionUrl ? `<a href="${s.admissionUrl}" target="_blank" rel="noopener" class="school-admission-cta school-admission-cta-main" title="Xem chi tiết phương thức xét tuyển trên trang chính thức của trường">Xem chi tiết tuyển sinh →</a>` : ''}
        </div>

        <!-- THÔNG TIN BỔ SUNG: Cơ sở, Chương trình, Tỉnh điểm -->
        <div class="school-info-grid">
          ${s.campuses && s.campuses.length ? `
          <div class="info-grid-item">
            <div class="info-grid-label">🏫 Cơ sở đào tạo</div>
            <div class="info-grid-value">${s.campuses.map(c => `<span class="info-tag">${c}</span>`).join('')}</div>
          </div>` : ''}
          ${s.programs && s.programs.length ? `
          <div class="info-grid-item">
            <div class="info-grid-label">📖 Chương trình đào tạo</div>
            <div class="info-grid-value">${s.programs.map(p => `<span class="info-tag info-tag-purple">${p}</span>`).join('')}</div>
          </div>` : ''}
          ${s.provinces ? `
          <div class="info-grid-item info-grid-item-full">
            <div class="info-grid-label">🗺️ Tỉnh điểm tuyển sinh</div>
            <div class="info-grid-value">${s.provinces}</div>
          </div>` : ''}
        </div>

        <div class="ad-cards">
          ${cardsHtml}
        </div>
        ${variantsHtml ? `<div class="school-variants">${variantsHtml}</div>` : ''}
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
      const haystack = normalizeText(s.name + ' ' + s.short + ' ' + s.city);
      return haystack.includes(searchTerm);
    });
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

function highlightSection(id) {
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
  const targetId = fromHash || fromQuery;

  if (!targetId) return;

  if (!fromHash && fromQuery) {
    window.location.hash = `#${fromQuery}`;
    return; // hashchange will handle the scroll
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
    mainContent.insertAdjacentHTML('afterbegin', '<div style="padding:14px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;margin-bottom:12px;font-size:.9rem;">⚠ Không tải được dữ liệu trường. Vui lòng thử lại sau.</div>');
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
      filterSchools(target.value);
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
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
