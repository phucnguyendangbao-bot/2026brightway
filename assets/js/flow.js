/* Shared navigation and the visitor's journey. No account is required. */
(function () {
  'use strict';
  const KEY = 'bwJourneyV2';
  const LEGACY_KEY = 'bwJourneyV1';
  const emptyState = () => ({ version: 2, updatedAt: 0, savedCareers: [], savedMajors: [], savedSchools: [] });
  const safeArray = value => Array.isArray(value) ? value.filter(Boolean) : [];
  const normalize = value => {
    const source = value && typeof value === 'object' ? value : {};
    return { ...emptyState(), ...source, version: 2, savedCareers: safeArray(source.savedCareers), savedMajors: safeArray(source.savedMajors), savedSchools: safeArray(source.savedSchools) };
  };
  const readRaw = key => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };
  const read = () => normalize(readRaw(KEY) || readRaw(LEGACY_KEY));
  const write = value => {
    const normalized = normalize({ ...value, updatedAt: Date.now() });
    try { localStorage.setItem(KEY, JSON.stringify(normalized)); } catch {}
    return normalized;
  };
  const save = patch => write({ ...read(), ...patch });
  const clear = () => {
    try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); } catch {}
    return emptyState();
  };
  const addUnique = (field, item, identity = 'id') => {
    if (!item) return read();
    const state = read();
    const values = safeArray(state[field]).filter(value => value?.[identity] !== item?.[identity]);
    return save({ [field]: [...values, item] });
  };
  const removeSaved = (field, identityValue, identity = 'id') => {
    const state = read();
    return save({ [field]: safeArray(state[field]).filter(value => value?.[identity] !== identityValue) });
  };
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

  function holland() {
    try {
      const imported = JSON.parse(localStorage.getItem('studentHollandImportedV1') || 'null');
      const tested = JSON.parse(localStorage.getItem('studentHollandV1') || 'null');
      const chosen = imported && (!tested || imported.savedAt >= tested.savedAt) ? imported : tested;
      const code = chosen === tested && !tested?.completed && tested?.answered !== 42 ? '' : chosen?.code;
      return /^[RIASEC]{3}$/.test(code || '') && new Set(code).size === 3 ? code : '';
    } catch { return ''; }
  }

  function nextStep(container, title, description, links) {
    if (!container) return;
    container.innerHTML = `<section class="flow-next"><div><span class="flow-kicker">Bước tiếp theo</span><h2>${escape(title)}</h2><p>${escape(description)}</p></div><div class="flow-actions">${links.map(([label, href]) => `<a href="${escape(href)}">${escape(label)} →</a>`).join('')}</div></section>`;
  }

  function progress(state = read()) {
    const code = holland();
    const hasCareer = Boolean(state.career?.name || state.savedCareers.length);
    const hasSchool = Boolean(state.savedSchools.length);
    const hasPlan = Boolean(state.scores?.completedAt || state.admissions?.method);
    return [
      { label: 'Khám phá bản thân', complete: Boolean(code), href: 'holland.html', detail: code ? `Mã Holland ${code}` : 'Làm Holland hoặc nhập mã đã có' },
      { label: 'Chọn ngành nghề', complete: hasCareer, href: 'careers-holland.html', detail: hasCareer ? (state.career?.name || `${state.savedCareers.length} nghề đã lưu`) : 'Khám phá nghề và ngành liên quan' },
      { label: 'Tìm trường phù hợp', complete: hasSchool, href: 'page2.html?focus=major', detail: hasSchool ? `${state.savedSchools.length} trường đã lưu` : 'Tìm theo ngành hoặc tên trường' },
      { label: 'Lập kế hoạch xét tuyển', complete: hasPlan, href: 'score-calculator.html', detail: hasPlan ? 'Đã có phương thức hoặc kết quả tính' : 'Chọn phương thức và tính điểm' },
    ];
  }

  function renderJourney(container, compact = false) {
    if (!container) return;
    const state = read();
    const steps = progress(state);
    const next = steps.find(step => !step.complete) || steps[steps.length - 1];
    container.innerHTML = `<section class="flow-journey ${compact ? 'flow-journey-compact' : ''}" aria-labelledby="flowJourneyTitle"><div class="flow-journey-heading"><div><span class="flow-kicker">LƯU TRÊN THIẾT BỊ NÀY</span><h2 id="flowJourneyTitle">Hành trình của tôi</h2><p>Các bước là gợi ý, không phải điều kiện bắt buộc.</p></div><a class="flow-continue" href="${escape(next.href)}">${steps.every(step => step.complete) ? 'Xem lại kế hoạch' : 'Tiếp tục: ' + escape(next.label)} →</a></div><ol class="flow-journey-steps">${steps.map((step, index) => `<li class="${step.complete ? 'is-complete' : ''}"><a href="${escape(step.href)}"><span>${step.complete ? '✓' : index + 1}</span><strong>${escape(step.label)}</strong><small>${escape(step.detail)}</small></a></li>`).join('')}</ol>${compact ? '' : '<button type="button" class="flow-reset" data-flow-reset>Xóa dữ liệu hành trình trên thiết bị</button>'}</section>`;
  }

  window.BWFlow = { read, save, clear, holland, nextStep, progress, renderJourney, addUnique, removeSaved };
  const page = location.pathname.split('/').pop() || 'index.html';
  const nav = document.querySelector('nav.bw-nav, nav.p2-nav, nav.lp-nav, nav.nav');
  if (nav) {
    const search = nav.querySelector('.p2-search-bar');
    const senior = nav.querySelector('.senior-toggle');
    const auth = document.getElementById('navAuthSlot');
    const theme = document.getElementById('themeToggle');
    const items = [
      ['Trang chủ', 'index.html', ['index.html']],
      ['Khám phá nghề', 'careers-holland.html', ['careers-holland.html','holland.html','majors.html','major-detail.html']],
      ['Tìm ngành & trường', 'page2.html?focus=major', ['page2.html']],
      ['Tính điểm', 'score-calculator.html', ['score-calculator.html']],
      ['Hành trình của tôi', 'profile.html?tab=journey', ['profile.html']],
    ];
    nav.className = 'flow-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');
    nav.innerHTML = `<div class="flow-nav-inner"><a class="flow-logo" href="index.html"><img src="assets/images/brand/brightway-mark.png" alt="" aria-hidden="true"><span>BrightWay Career</span></a><button type="button" class="flow-menu" aria-controls="navLinks" aria-expanded="false" aria-label="Mở menu">Menu <span aria-hidden="true">☰</span></button><div id="navLinks" class="flow-links">${items.map(([label, href, pages]) => `<a href="${href}" ${pages.includes(page) ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}<a class="flow-waybi-link" href="waybi.html">Waybi</a></div></div>`;
    const links = nav.querySelector('#navLinks');
    if (senior) links.appendChild(senior);
    if (theme) { theme.classList.add('flow-theme'); links.appendChild(theme); }
    if (auth) links.appendChild(auth);
    if (search) {
      const toolbar = document.createElement('div');
      toolbar.className = 'flow-toolbar';
      toolbar.appendChild(search);
      const other = document.createElement('a');
      other.href = page === 'page2.html' ? 'score-calculator.html' : 'page2.html?focus=major';
      other.textContent = page === 'page2.html' ? 'Tính điểm xét tuyển →' : 'Tìm ngành & trường →';
      toolbar.appendChild(other);
      nav.after(toolbar);
    }
    const button = nav.querySelector('.flow-menu');
    const close = () => { links.classList.remove('open'); button.setAttribute('aria-expanded','false'); };
    button.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); button.focus(); } });
  }

  document.querySelectorAll('a[href="login.html"]').forEach(anchor => {
    anchor.href = 'login.html?return=' + encodeURIComponent(location.pathname + location.search + location.hash);
  });

  function init() {
    if (page === 'index.html') {
      const host = document.createElement('div');
      host.className = 'flow-resume';
      document.getElementById('hero-actions')?.after(host);
      renderJourney(host, true);
    }
    if (page === 'profile.html') {
      const host = document.createElement('div');
      host.className = 'flow-local-profile';
      document.querySelector('.profile-page .container')?.prepend(host);
      renderJourney(host);
    }
    if (['calendar.html','scholarship-roadmap.html'].includes(page)) {
      const host = document.createElement('div');
      host.className = 'flow-resume';
      document.querySelector('footer')?.before(host);
      nextStep(host, 'Chuẩn bị cho bước tiếp theo', 'Xem nguồn tuyển sinh hoặc quay lại hành trình để tiếp tục.', [['Tin tuyển sinh','resources.html'], ['Hành trình của tôi','profile.html?tab=journey']]);
    }
    for (const id of ['waybi-suggest', 'bwChatSuggestions']) {
      const target = document.getElementById(id);
      if (!target) continue;
      const shortcuts = document.createElement('div');
      shortcuts.className = 'flow-chat-links';
      shortcuts.setAttribute('aria-label', 'Mở nhanh công cụ');
      shortcuts.innerHTML = '<a href="holland.html">Khám phá bản thân</a><a href="page2.html?focus=major">Tìm ngành & trường</a><a href="score-calculator.html">Tính điểm</a>';
      target.before(shortcuts);
    }
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-flow-reset]')) return;
      if (!window.confirm('Xóa dữ liệu hành trình đã lưu trên thiết bị này?')) return;
      clear();
      location.reload();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
