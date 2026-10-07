// patch-page2-v3.cjs — patch page2.js dùng regex match (linh hoạt hơn)
const fs = require('fs');
const path = require('path');

const file = path.resolve('assets', 'js', 'page2.js');
let src = fs.readFileSync(file, 'utf8');

// ════════════════════════════════════════
// Step 1: Header
// ════════════════════════════════════════

const oldHeader = `/* ═══════════════════════════════════════
   SCHOLARSHIP DATA (giữ nguyên từ file gốc)
   Sẽ migrate sang Supabase khi RLS/policies xong (Phase 3)
   ════════════════════════════════════════ */
const SCHOOLS = [`;

const newHeader = `/* ═══════════════════════════════════════
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
const __PENDING_SCHOOLS__ = [`;

if (!src.includes(oldHeader)) { console.error('Header not found'); process.exit(1); }
src = src.replace(oldHeader, newHeader);

// ════════════════════════════════════════
// Step 2: Closing
// ════════════════════════════════════════

const closingRe = /\n\];\n\n\/\* ═{15,} RENDER ═{15,} \*\//;
if (!closingRe.test(src)) {
  console.error('ClosingSchools marker not found');
  process.exit(1);
}
src = src.replace(closingRe, `\n];\nSCHOOLS = __PENDING_SCHOOLS__;\n\n/* ${'═'.repeat(15)} RENDER ${'═'.repeat(15)} */`);

// ════════════════════════════════════════
// Step 3: Update initPage2()
// ════════════════════════════════════════

const oldInit = `function initPage2() {
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
}`;

const newInit = `async function initPage2() {
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
}`;

if (!src.includes(oldInit)) {
  console.error('initPage2 not found');
  process.exit(1);
}
src = src.replace(oldInit, newInit);

// ════════════════════════════════════════
// Step 4: Update logo render — use regex match
// ════════════════════════════════════════

// Match whole block from "// Inject logos:" to closing of forEach + function renderFallbackBadge
const logoBlockRe = /  \/\/ Inject logos:[\s\S]*?iconEl\.textContent = initials;[\s\S]*?\n\}\n/;

const newRender = `  // Inject logos (Phase 4 — logo thật local + chain):
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
    const googleFav = domain ? \`https://www.google.com/s2/favicons?sz=64&domain=\${domain}\` : null;

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
          .replace(/ĐH\\s*/i, '')
          .replace(/[^A-Za-zÀ-ỹ\\s]/g, '')
          .split(/\\s+/).slice(0, 2)
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

`;

if (!logoBlockRe.test(src)) {
  console.error('Logo block not found');
  process.exit(1);
}
src = src.replace(logoBlockRe, newRender);

// ════════════════════════════════════════
// Step 5: Add admission link
// ════════════════════════════════════════

const oldNameRender = `            <h2 class="school-name">\${s.website ? \`<a href="\${s.website}" target="_blank" rel="noopener" class="school-name-link">\${s.name} <svg style="display:inline;vertical-align:middle;margin-left:5px;opacity:.55" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>\` : s.name}</h2>`;

const newNameRender = `            <h2 class="school-name">\${s.website ? \`<a href="\${s.website}" target="_blank" rel="noopener" class="school-name-link">\${s.name} <svg style="display:inline;vertical-align:middle;margin-left:5px;opacity:.55" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>\` : s.name}</h2>
            \${s.admissionUrl ? \`<a href="\${s.admissionUrl}" target="_blank" rel="noopener" class="school-admission-link" title="Cổng thông tin tuyển sinh chính thức">📋 Thông tin tuyển sinh</a>\` : ''}`;

if (!src.includes(oldNameRender)) {
  console.error('Old name render not found');
  process.exit(1);
}
src = src.replace(oldNameRender, newNameRender);

fs.writeFileSync(file, src, 'utf8');
console.log('✓ Patched page2.js (v3)');