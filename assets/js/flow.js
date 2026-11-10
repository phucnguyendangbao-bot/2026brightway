/* Shared navigation and the visitor's journey. No account is required. */
(function () {
  'use strict';
  const KEY = 'bwJourneyV2';
  const LEGACY_KEY = 'bwJourneyV1';
  const memory = new Map();
  let storageWarning = '';
  function warnStorage(message) {
    storageWarning = message;
    if (!document.body) return;
    let notice = document.getElementById('journeyStorageNotice');
    if (!notice) {
      notice = document.createElement('p');
      notice.id = 'journeyStorageNotice';
      notice.className = 'flow-storage-notice';
      notice.setAttribute('role', 'status');
      document.body.prepend(notice);
    }
    notice.textContent = message;
  }
  const storage = {
    get(key) {
      if (memory.has(key)) return memory.get(key);
      try { return localStorage.getItem(key); }
      catch { warnStorage('Trình duyệt đang chặn lưu dữ liệu. Tiến độ chỉ giữ trong trang này; tải lại có thể mất dữ liệu.'); return memory.get(key) ?? null; }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value); memory.delete(key);
        if (['studentHollandV1','studentHollandImportedV1'].includes(key)) window.dispatchEvent(new CustomEvent('bw:journey-change', { detail: { storageKey:key } }));
        return true;
      }
      catch { memory.set(key, value); warnStorage('Chưa lưu được trên thiết bị. Tiến độ chỉ giữ trong trang này; hãy kiểm tra dung lượng hoặc quyền lưu của trình duyệt.'); return false; }
    },
    remove(key) {
      memory.set(key, null);
      try { localStorage.removeItem(key); return true; }
      catch { warnStorage('Chưa xóa được dữ liệu trên thiết bị. Hãy xóa dữ liệu website trong cài đặt trình duyệt.'); return false; }
    }
  };
  window.addEventListener('storage', event => {
    if (event.key) memory.delete(event.key); else memory.clear();
    window.dispatchEvent(new CustomEvent('bw:journey-change'));
  });
  const emptyState = () => ({ version: 2, updatedAt: 0, savedCareers: [], savedMajors: [], savedSchools: [] });
  const safeArray = value => Array.isArray(value) ? value.filter(Boolean) : [];
  const normalize = value => {
    const source = value && typeof value === 'object' ? value : {};
    return { ...emptyState(), ...source, version: 2, tasks: safeArray(source.tasks).filter(item => typeof item.text === 'string' && typeof item.id === 'string'), savedCareers: safeArray(source.savedCareers).filter(item => typeof item === 'object'), savedMajors: safeArray(source.savedMajors).filter(item => typeof item === 'object'), savedSchools: safeArray(source.savedSchools).filter(item => typeof item === 'object') };
  };
  const readRaw = key => { try { return JSON.parse(storage.get(key)) || null; } catch { warnStorage('Một phần dữ liệu đã lưu không đọc được. Bạn có thể nhập lại hoặc xóa dữ liệu hành trình.'); return null; } };
  const read = () => {
    const saved = readRaw(KEY) || readRaw(LEGACY_KEY);
    if (saved) return normalize(saved);
    const favorites = safeArray(readRaw('bw_favorites')).filter(item => typeof item.name === 'string');
    return normalize({ savedCareers: favorites.map(item => ({ id: item.name, name: item.name, group: item.group })) });
  };
  const write = value => {
    const normalized = normalize({ ...value, updatedAt: Date.now() });
    storage.set(KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('bw:journey-change'));
    return normalized;
  };
  const save = patch => write({ ...read(), ...patch });
  const clear = () => {
    let cleared = true;
    for (const key of [KEY, LEGACY_KEY, 'studentHollandV1', 'studentHollandImportedV1', 'studentHollandTimer', 'bw_favorites', 'bw_history', 'bw_schools_selected', 'bw-school-compare-2026']) {
      if (!storage.remove(key)) cleared = false;
    }
    window.dispatchEvent(new CustomEvent('bw:waybi-privacy-reset'));
    window.dispatchEvent(new CustomEvent('bw:journey-change'));
    if (!cleared) return null;
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
      const imported = readRaw('studentHollandImportedV1');
      const tested = readRaw('studentHollandV1');
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
    const hasCareer = Boolean(state.career?.name || state.savedCareers.length || state.savedMajors.length);
    const hasSchool = Boolean(state.savedSchools.length);
    const hasPlan = Boolean(state.scores?.completedAt);
    return [
      { label: 'Khám phá bản thân', complete: Boolean(code), href: 'holland.html', detail: code ? `Mã Holland ${code}` : 'Làm Holland hoặc nhập mã đã có' },
      { label: 'Chọn ngành nghề', complete: hasCareer, href: 'careers-holland.html', detail: hasCareer ? (state.career?.name || `${state.savedCareers.length} nghề đã lưu`) : 'Khám phá nghề và ngành liên quan' },
      { label: 'Tìm trường phù hợp', complete: hasSchool, href: 'page2.html?focus=major', detail: hasSchool ? `${state.savedSchools.length} trường đã lưu` : 'Tìm theo ngành hoặc tên trường' },
      { label: 'Lập kế hoạch xét tuyển', complete: hasPlan, href: 'score-calculator.html', detail: hasPlan ? 'Đã có phương thức hoặc kết quả tính' : 'Chọn phương thức và tính điểm' },
      { label: 'Kế hoạch hành động', complete: Boolean(state.tasks?.length && state.tasks.every(task => task.done)), href: 'profile.html?tab=journey#action-plan', detail: 'Ghi việc cần làm và đánh dấu tiến độ' },
    ];
  }

  function renderJourney(container, compact = false) {
    if (!container) return;
    const state = read();
    const steps = progress(state);
    const next = steps.find((step, index) => !step.complete && !(index === 0 && state.skipHolland)) || steps[steps.length - 1];
    container.innerHTML = `<section class="flow-journey ${compact ? 'flow-journey-compact' : ''}" aria-labelledby="flowJourneyTitle"><div class="flow-journey-heading"><div><span class="flow-kicker">LƯU TRÊN THIẾT BỊ NÀY</span><h2 id="flowJourneyTitle">Hành trình của tôi</h2><p>Các bước là gợi ý, không phải điều kiện bắt buộc.</p></div><a class="flow-continue" href="${escape(next.href)}">${steps.every(step => step.complete) ? 'Xem lại kế hoạch' : 'Tiếp tục: ' + escape(next.label)} →</a></div><ol class="flow-journey-steps">${steps.map((step, index) => `<li class="${step.complete ? 'is-complete' : ''}"><a href="${escape(step.href)}"><span>${step.complete ? '✓' : index + 1}</span><strong>${escape(step.label)}</strong><small>${escape(step.detail)}</small></a></li>`).join('')}</ol>${compact ? '' : '<button type="button" class="flow-reset" data-flow-reset>Xóa dữ liệu hành trình trên thiết bị</button>'}</section>`;
  }

  window.BWFlow = { read, save, clear, holland, nextStep, progress, renderJourney, addUnique, removeSaved, storage, get storageWarning() { return storageWarning; } };
  const page = location.pathname.split('/').pop() || 'index.html';
  const nav = document.querySelector('nav.bw-nav, nav.p2-nav, nav.lp-nav, nav.nav');
  if (nav) {
    const search = nav.querySelector('.p2-search-bar') || document.querySelector('[data-flow-toolbar-source] .p2-search-bar');
    const senior = nav.querySelector('.senior-toggle');
    const auth = document.getElementById('navAuthSlot');
    const theme = document.getElementById('themeToggle');
    const items = [
      ['Trang chủ', 'index.html', ['index.html']],
      ['Khám phá nghề', 'careers-holland.html', ['careers-holland.html','holland.html','majors.html','major-detail.html']],
      ['Khám phá trường', 'page2.html?mode=school', ['page2.html']],
      ['Tính điểm', 'score-calculator.html', ['score-calculator.html']],
      ['Hành trình của tôi', 'profile.html?tab=journey', ['profile.html']],
    ];
    const tools = [
      ['Trắc nghiệm Holland', 'holland.html', ['holland.html']],
      ['Nguyện vọng của tôi', 'profile.html?tab=journey#my-choices', []],
      ['BrightWay Countdown', 'profile.html?tab=journey#countdowns', []],
      ['Lịch Lớp 12', 'calendar.html', ['calendar.html']],
      ['Tin tuyển sinh', 'resources.html', ['resources.html','news.html','news-detail.html']],
      ['Lộ trình học bổng', 'scholarship-roadmap.html', ['scholarship-roadmap.html','essay-review.html','interview-prep.html']],
    ];
    const hashActive = href => page === 'profile.html' && href.includes(location.hash) && Boolean(location.hash);
    const hasMainActive = items.some(([, , pages]) => pages.includes(page));
    const hasSecondaryActive = tools.some(([, href, pages]) => pages.includes(page) || hashActive(href));
    const moreActive = !hasMainActive && hasSecondaryActive;
    nav.className = 'flow-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');
    nav.innerHTML = `<div class="flow-nav-inner"><a class="flow-logo" href="index.html"><img src="assets/images/brand/brightway-mark-96.webp" width="48" height="48" alt="" aria-hidden="true"><span>BrightWay Career</span></a><button type="button" class="flow-menu" aria-controls="navLinks" aria-expanded="false" aria-label="Mở menu chính">Menu <span aria-hidden="true">☰</span></button><div id="navLinks" class="flow-links">${items.map(([label, href, pages]) => `<a href="${href}" ${pages.includes(page) ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}<div class="flow-more"><button type="button" class="flow-more-button ${moreActive ? 'active' : ''}" aria-controls="flowMoreMenu" aria-expanded="false" ${moreActive ? 'aria-label="Công cụ, trang hiện tại thuộc nhóm này"' : ''}>Công cụ <span aria-hidden="true">⌄</span></button><div id="flowMoreMenu" class="flow-more-menu">${tools.map(([label, href, pages]) => `<a href="${href}" ${(pages.includes(page) || hashActive(href)) ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}</div></div><a class="flow-waybi-link ${page === 'waybi.html' ? 'active' : ''}" href="waybi.html" ${page === 'waybi.html' ? 'aria-current="page"' : ''}>Waybi</a></div></div>`;
    const links = nav.querySelector('#navLinks');
    if (senior) links.appendChild(senior);
    if (theme) { theme.classList.add('flow-theme'); links.appendChild(theme); }
    if (auth) links.appendChild(auth);
    if (search) {
      const toolbar = document.createElement('div');
      toolbar.className = 'flow-toolbar';
      toolbar.appendChild(search);
      document.querySelector('[data-flow-toolbar-source]')?.remove();
      const other = document.createElement('a');
      other.href = page === 'page2.html' ? 'score-calculator.html' : 'page2.html?focus=major';
      other.textContent = page === 'page2.html' ? 'Tính điểm xét tuyển →' : 'Tìm ngành & trường →';
      toolbar.appendChild(other);
      nav.after(toolbar);
    }
    const button = nav.querySelector('.flow-menu');
    const more = nav.querySelector('.flow-more');
    const moreButton = nav.querySelector('.flow-more-button');
    const closeMore = () => { more?.classList.remove('open'); moreButton?.setAttribute('aria-expanded','false'); };
    const close = () => { links.classList.remove('open'); button.setAttribute('aria-expanded','false'); closeMore(); };
    button.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    moreButton?.addEventListener('click', event => {
      event.stopPropagation();
      const open = more.classList.toggle('open');
      moreButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target)) { close(); return; }
      if (more?.classList.contains('open') && !event.target.closest('.flow-more')) closeMore();
    });
    window.matchMedia('(min-width:1181px)').addEventListener('change', event => { if (event.matches) close(); });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (more?.classList.contains('open')) { closeMore(); moreButton.focus(); return; }
      if (links.classList.contains('open')) { close(); button.focus(); }
    });
  }

  function ensureSharedFooter() {
    if (['admin.html','careers.html'].includes(page)) return;
    let footer = document.querySelector('footer');
    if (!footer) { footer = document.createElement('footer'); document.body.append(footer); }
    footer.className = 'flow-footer';
    footer.setAttribute('aria-label', 'Thông tin BrightWay Career');
    footer.innerHTML = `<div class="flow-footer-inner"><div class="flow-footer-brand"><a href="index.html"><img src="assets/images/brand/brightway-mark-96.webp" width="40" height="40" alt=""><strong>BrightWay Career</strong></a><p>Đồng hành cùng học sinh trên hành trình hướng nghiệp và chuẩn bị xét tuyển.</p></div><nav aria-label="Liên kết cuối trang"><a href="careers-holland.html">Khám phá nghề</a><a href="page2.html?mode=school">Khám phá trường</a><a href="profile.html?tab=journey#my-choices">Nguyện vọng</a><a href="profile.html?tab=journey#countdowns">Countdown</a><a href="resources.html">Tin tuyển sinh</a><a href="calendar.html">Lịch Lớp 12</a></nav><div class="flow-footer-meta"><a href="mailto:pdpbrightwaycarrers@gmail.com">pdpbrightwaycarrers@gmail.com</a><a href="tel:+84939249060">0939 249 060</a><p>© ${new Date().getFullYear()} BrightWay Career</p></div></div><p class="flow-footer-note">Thông tin chỉ mang tính tham khảo; hãy kiểm tra nguồn chính thức trước khi đưa ra quyết định tuyển sinh.</p>`;
  }

  document.querySelectorAll('a[href="login.html"]').forEach(anchor => {
    anchor.href = 'login.html?return=' + encodeURIComponent(location.pathname + location.search + location.hash);
  });

  function init() {
    document.body.dataset.bwPage = page;
    ensureSharedFooter();
    if (page === 'index.html') {
      // The homepage tells the journey in HTML order; the ending scene shows this visitor's road.
      let host = document.querySelector('[data-journey-host]');
      if (!host) { host = document.createElement('div'); host.className = 'flow-resume'; document.getElementById('hero-actions')?.after(host); }
      renderJourney(host, true);
      window.addEventListener('bw:journey-change', () => renderJourney(host, true));
    }
    if (page === 'profile.html') {
      const requestedTab = new URLSearchParams(location.search).get('tab');
      const profileView = ['account','info','favorites','history'].includes(requestedTab) ? 'account' : 'journey';
      document.querySelectorAll('[data-profile-view]').forEach(section => { section.hidden = section.dataset.profileView !== profileView; });
      document.querySelectorAll('[data-profile-view-link]').forEach(link => {
        const active = link.dataset.profileViewLink === profileView;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      });
      document.body.dataset.profileView = profileView;
      const host = document.createElement('div');
      host.className = 'flow-local-profile';
      const choices = document.getElementById('my-choices');
      if (choices) choices.after(host);
      else document.querySelector('.profile-page .container')?.prepend(host);
      renderJourney(host);
      renderLocalProfile(host);
      window.addEventListener('bw:journey-change', () => {
        const journey = host.querySelector('.flow-journey');
        if (!journey) return;
        const updated = document.createElement('div');
        renderJourney(updated);
        journey.replaceWith(updated.firstElementChild);
      });
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
      shortcuts.innerHTML = '<a href="holland.html">Khám phá bản thân</a><a href="page2.html?focus=major">Tìm ngành & trường</a><a href="profile.html?tab=journey#my-choices">Nguyện vọng của tôi</a><a href="score-calculator.html">Tính điểm</a>';
      target.before(shortcuts);
    }
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-flow-reset]')) return;
      if (!window.confirm('Xóa dữ liệu hành trình đã lưu trên thiết bị này?')) return;
      if (clear()) location.reload();
    });
    if (storageWarning) warnStorage(storageWarning);
    import('./personalization.js').then(module => module.initPersonalization()).catch(() => {
      const host = document.createElement('p');
      host.className = 'flow-status'; host.setAttribute('role','status');
      host.innerHTML = 'Chưa mở được cá nhân hóa. Lựa chọn đã lưu vẫn được giữ. <button type="button">Thử tải lại</button>';
      host.querySelector('button').addEventListener('click', () => location.reload());
      if (page === 'profile.html') document.querySelector('.flow-local-profile')?.prepend(host);
    });
    import('./countdown.js').then(module => module.initCountdown()).catch(() => {
      if (!['index.html','profile.html'].includes(page)) return;
      const host = document.createElement('p');
      host.className = 'flow-status'; host.setAttribute('role','status');
      host.innerHTML = 'Chưa mở được BrightWay Countdown. Dữ liệu hành trình khác vẫn được giữ. <button type="button">Thử tải lại</button>';
      host.querySelector('button').addEventListener('click', () => location.reload());
      if (page === 'profile.html') document.querySelector('.flow-local-profile')?.append(host);
      else document.querySelector('.flow-resume')?.after(host);
    });
    const stepIndex = { 'holland.html': 0, 'careers-holland.html': 1, 'page2.html': 2, 'score-calculator.html': 3 }[page];
    if (stepIndex !== undefined) {
      const steps = progress();
      const bar = document.createElement('section');
      bar.className = 'flow-stepbar';
      bar.setAttribute('aria-label', 'Tiến trình hướng nghiệp');
      bar.innerHTML = `<span>Bước ${stepIndex + 1}/5 · ${escape(steps[stepIndex].label)}</span><progress max="5" value="${steps.filter(step => step.complete).length}" aria-label="Số bước đã hoàn thành"></progress><a href="${stepIndex ? steps[stepIndex - 1].href : 'index.html'}">← Quay lại</a><a href="${steps[stepIndex + 1].href}" ${stepIndex === 0 ? 'data-skip-holland' : ''}>${stepIndex === 0 ? 'Bỏ qua Holland' : 'Tiếp tục'} →</a>`;
      document.querySelector('.flow-nav')?.after(bar);
      bar.querySelector('[data-skip-holland]')?.addEventListener('click', () => save({ skipHolland: true }));
    }
    initGlowBand();
    initAurora();
  }

  // Every page opens in the same glowing dark band as the homepage (styles in glow-page.css).
  // Scroll colour: three painted skies behind the page cross-fade as the reader moves down
  // (dawn blue and coral, sunset peach, dusk periwinkle). Only opacity changes, so nothing repaints.
  function initAurora() {
    if (page.startsWith('admin') || document.querySelector('.bw-aurora')) return;
    const sky = document.createElement('div');
    sky.className = 'bw-aurora';
    sky.setAttribute('aria-hidden', 'true');
    sky.innerHTML = '<i class="bw-sky-dawn"></i><i class="bw-sky-sunset"></i><i class="bw-sky-dusk"></i>';
    document.body.prepend(sky);
    document.body.classList.add('bw-aurora-on');
    // Once the page moves, a see-through bar darkens so text underneath never collides with the links.
    const onScroll = () => document.body.classList.toggle('bw-nav-scrolled', scrollY > 12);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const bar = document.createElement('div');
    bar.className = 'bw-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.append(bar);
    if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
      const [dawn, sunset, dusk] = sky.children;
      let queued = false;
      const paint = () => {
        queued = false;
        const p = Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
        dawn.style.opacity = Math.max(0, 1 - p / 0.45);
        sunset.style.opacity = Math.max(0, 1 - Math.abs(p - 0.45) / 0.42);
        dusk.style.opacity = Math.max(0, (p - 0.4) / 0.6);
        bar.style.transform = `scaleX(${p})`;
      };
      addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
      addEventListener('resize', paint);
      paint();
    }
    // Opaque white panels become glass over the sky; full-width paper sections let the sky through.
    const SKIP = 'input, select, textarea, option, img, svg, video, canvas, iframe, table *, dialog, dialog *, [role="dialog"], [role="dialog"] *, .flow-nav, .flow-nav *, .glow-band, .glow-band *, .glow-hero, .glow-hero *, .is-deep, .is-deep *, .bw-aurora, .ks-toc *, .waybi-widget, .waybi-widget *';
    const tone = color => { const m = color.match(/[\d.]+/g); if (!m) return [0, 0]; const [r, g, b, a = 1] = m.map(Number); return [(0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, a]; };
    const scan = scope => {
      const els = scope.nodeType === 1 ? [scope, ...scope.querySelectorAll('*')] : [];
      for (const el of els) {
        if (el.classList.contains('bw-glass') || el.classList.contains('bw-clear') || el.matches(SKIP)) continue;
        const s = getComputedStyle(el);
        if (s.position === 'fixed') continue;
        // A pale wash painted as a gradient counts as a white panel too.
        const img = s.backgroundImage;
        let paleWash = false;
        if (img !== 'none') {
          if (/url\(|radial|conic/.test(img) || !img.startsWith('linear-gradient')) continue;
          const stops = img.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi) || [];
          paleWash = stops.length > 0 && stops.every(c => { const [cl, ca] = tone(c); return c.startsWith('#') ? false : cl > 0.9 && ca > 0.5; });
          if (!paleWash) continue;
        }
        const [l, a] = tone(s.backgroundColor);
        if (!paleWash && (a < 0.85 || l < 0.9)) continue;
        const w = el.offsetWidth, h = el.offsetHeight;
        if (w >= innerWidth * 0.92 && el.tagName !== 'BODY') el.classList.add('bw-clear');
        else if (w >= 150 && h >= 56) {
          el.classList.add('bw-glass');
          if (paleWash) el.classList.add('bw-glass-wash');
          // Cards rise in one by one; big wrappers stay put so their content does not move twice.
          if (s.animationName === 'none' && h < innerHeight * 1.1 && !el.parentElement?.closest('.bw-rise')) el.classList.add('bw-rise');
        }
      }
    };
    const host = document.body;
    scan(host);
    // Headings rise in as they arrive; the dark opening's contents fade and soften as they leave.
    host.querySelectorAll('h2').forEach(h => { if (!h.closest('.glow-band, .glow-hero, .bw-glass, .ks-toc') && getComputedStyle(h).animationName === 'none') h.classList.add('bw-rise'); });
    // The dark opening plays like a film as it scrolls away: each layer drifts at its own depth.
    document.querySelectorAll('.glow-band').forEach(band => {
      [...band.children].forEach((el, i) => {
        if (getComputedStyle(el).animationName !== 'none') return;
        el.style.setProperty('--bw-depth', String(1 + i * 0.7));
        el.classList.add('bw-band-out');
        const h1 = el.matches('h1') ? el : el.querySelector('h1');
        if (h1 && getComputedStyle(h1).animationName === 'none') h1.classList.add('bw-intro');
      });
    });
    stagger(document);
    initPointerLight();
    // Floating buttons and panels get their own GPU layer so scrolling never repaints beneath them.
    const promote = () => document.querySelectorAll('body > *').forEach(el => { if (getComputedStyle(el).position === 'fixed' && !el.style.willChange) el.style.willChange = 'transform'; });
    promote(); setTimeout(promote, 1500);
    // Lists that render later (schools, careers, news) join in as they appear.
    let pending = [];
    let timer = 0;
    new MutationObserver(records => {
      for (const r of records) r.addedNodes.forEach(n => { if (n.nodeType === 1) pending.push(n); });
      if (pending.length && !timer) timer = setTimeout(() => { const batch = pending; pending = []; timer = 0; batch.forEach(n => n.isConnected && scan(n)); stagger(document); }, 120);
    }).observe(host, { childList: true, subtree: true });
  }
  // Cards side by side arrive as a wave: each one a beat after its left-hand neighbour.
  function stagger(scope) {
    const rows = new Map();
    scope.querySelectorAll('.bw-rise:not([data-bw-wave])').forEach(el => {
      el.dataset.bwWave = '';
      const parent = el.parentElement;
      if (!rows.has(parent)) rows.set(parent, []);
      rows.get(parent).push(el);
    });
    rows.forEach(list => {
      const tops = list.map(el => el.offsetTop);
      list.forEach((el, i) => {
        let col = 0;
        for (let j = i - 1; j >= 0 && Math.abs(tops[j] - tops[i]) < 8; j--) col++;
        el.style.setProperty('--bw-i', String(Math.min(col, 5)));
      });
    });
  }

  // Desktop only: a soft light follows the pointer behind the glass, and glass cards lean toward it.
  function initPointerLight() {
    if (!matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const glow = document.createElement('div');
    glow.className = 'bw-cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.querySelector('.bw-aurora')?.after(glow);
    let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty, running = false;
    const step = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      running = Math.abs(tx - x) + Math.abs(ty - y) > 0.5;
      if (running) requestAnimationFrame(step);
    };
    const TILT = '.bw-glass, .ks-toc .home-journey-card, .glow-thumb';
    let card = null, pending = null, queued = false;
    const tilt = () => {
      queued = false;
      if (!card || !pending) return;
      const r = card.getBoundingClientRect();
      if (r.width > 760 || r.height > 640) return;
      const dx = (pending.x - r.left) / r.width - 0.5, dy = (pending.y - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-dy * 8).toFixed(2)}deg) rotateY(${(dx * 10).toFixed(2)}deg) translate3d(0, -4px, 0)`;
    };
    const release = el => {
      el.style.transition = 'transform .6s cubic-bezier(.2, .8, .2, 1)';
      el.style.transform = '';
      setTimeout(() => { if (el !== card) el.style.transition = ''; }, 650);
    };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('is-on');
      if (!running) { running = true; requestAnimationFrame(step); }
      const next = e.target.closest?.(TILT) || null;
      if (next !== card) {
        if (card) release(card);
        card = next;
        if (card) card.style.transition = 'transform .15s ease-out';
      }
      pending = { x: e.clientX, y: e.clientY };
      if (card && !queued) { queued = true; requestAnimationFrame(tilt); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { glow.classList.remove('is-on'); if (card) { release(card); card = null; } });
  }
  const GLOW_BANDS = ['.glow-band', 'section.bw-hero', 'header.p2-intro', 'section.calc-hero', 'header.journey-welcome', 'header.cal-hero', 'header.res-hero', 'header.rm-hero', 'section.w-hero', 'section.hero', 'div.hero', 'div.iv-page-hero', 'section.auth-page'];
  function initGlowBand() {
    if (page === 'index.html' || page.startsWith('admin')) return;
    const band = GLOW_BANDS.flatMap(sel => [...document.querySelectorAll(sel)]).find(el => el.getClientRects().length);
    if (!band) return;
    // Section tabs above the opening (profile) travel inside it, so the band can still open the page.
    const tabs = document.querySelector('.profile-view-tabs');
    if (tabs && tabs.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING) band.prepend(tabs);
    band.classList.add('glow-band');
    // Light cards inside the band keep dark text.
    const lightness = color => { const m = color.match(/[\d.]+/g); if (!m) return [0, 0]; const [r, g, b, a = 1] = m.map(Number); return [(0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, a]; };
    band.querySelectorAll('.auth-card, [data-glow-surface]').forEach(el => el.classList.add('glow-surface'));
    for (const el of band.querySelectorAll('*')) {
      if (el.closest('.glow-surface')) continue;
      const [l, a] = lightness(getComputedStyle(el).backgroundColor);
      if (a > 0.45 && l > 0.78) el.classList.add('glow-surface', ...(a < 0.98 ? ['glow-surface-solid'] : []));
    }
    const nav = document.querySelector('.flow-nav');
    if (!nav) return;
    if (band.getBoundingClientRect().width < innerWidth - 4) band.classList.add('glow-band-bleed');
    // Measure in page coordinates so a restored scroll position cannot skew the result.
    const docTop = el => el.getBoundingClientRect().top + scrollY;
    const navH = nav.offsetHeight;
    const stepbar = document.querySelector('.flow-stepbar');
    // The journey step bar rides inside the opening; measure only after it has moved.
    if (stepbar && stepbar.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING && docTop(band) - docTop(stepbar) < 400) band.prepend(stepbar);
    if (docTop(band) - navH >= 160) return;              // the band does not open the page
    // A band that opens the page slides under the see-through navigation.
    if (scrollY < 40) document.body.classList.add('bw-nav-glass');
    const gap = Math.max(0, docTop(band) - navH);
    const pad = parseFloat(getComputedStyle(band).paddingTop) || 0;
    band.style.marginTop = `-${Math.round(navH + gap)}px`;
    band.style.paddingTop = `${Math.round(pad + navH + Math.min(Math.max(gap, 24), 48))}px`;
    // Collapsing margins can shift the result; land the band exactly at the top of the page.
    const drift = Math.round(docTop(band));
    if (drift) band.style.marginTop = `${parseFloat(band.style.marginTop) - drift}px`;
    // A wrapper that hides overflow would cut the band off under the navigation; clip sideways only.
    for (let el = band.parentElement; el && el !== document.body; el = el.parentElement) {
      const s = getComputedStyle(el);
      if (s.overflowY !== 'visible' && s.overflowY !== 'clip') { el.style.overflowY = 'visible'; el.style.overflowX = 'clip'; }
    }
    // Content that tucks up into the opening sits fully on the paper instead of half over the dark.
    const bandBottom = () => docTop(band) + band.offsetHeight;
    const next = band.nextElementSibling || band.parentElement?.nextElementSibling;
    const firstBox = next && [next, ...next.querySelectorAll(':scope > *')].find(el => el.getClientRects().length && el.offsetHeight > 40);
    const overlap = firstBox ? bandBottom() - docTop(firstBox) : 0;
    if (overlap > 2 && overlap < 240) band.style.marginBottom = `${(parseFloat(getComputedStyle(band).marginBottom) || 0) + Math.round(overlap) + 24}px`;
    document.documentElement.style.setProperty('--glow-spill-y', `${Math.round(docTop(band) + band.offsetHeight)}px`);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { document.body.classList.toggle('bw-nav-glass', e.isIntersecting); setTimeout(() => document.body.classList.add('bw-nav-ready'), 400); }, { rootMargin: `-${navH}px 0px 0px 0px` }).observe(band);
    }
  }

  function renderLocalProfile(host) {
    const state = read();
    const details = document.createElement('section');
    details.className = 'flow-profile-details';
    details.innerHTML = `<h1>Hồ sơ hướng nghiệp của tôi</h1><p>Không cần tài khoản. Dữ liệu dưới đây được lưu trên trình duyệt này.</p><div class="flow-profile-grid"><article><h2>Holland</h2><p>${holland() ? escape(holland()) + ' · Gợi ý sở thích, không phải kết luận năng lực.' : 'Chưa có kết quả hoàn chỉnh.'}</p><a href="holland.html">Xem hoặc làm tiếp →</a></article>${[['savedCareers','Nghề quan tâm','careers-holland.html'], ['savedMajors','Ngành quan tâm','page2.html?mode=major'], ['savedSchools','Trường đã lưu','page2.html']].map(([field,title,href]) => `<article><h2>${title}</h2>${state[field].length ? `<ul>${state[field].map(item => `<li><a href="${href}${href.includes('?') ? '&' : '?'}${field === 'savedSchools' ? 'school=' + encodeURIComponent(item.id) : 'q=' + encodeURIComponent(item.name || '')}">${escape(item.name || item.id)}</a> <button type="button" data-remove-field="${field}" data-remove-id="${escape(item.id || item.name)}" aria-label="Bỏ lưu ${escape(item.name || item.id)}">Bỏ lưu</button></li>`).join('')}</ul>` : '<p>Chưa có lựa chọn đã lưu.</p>'}<a href="${href}">Khám phá thêm →</a></article>`).join('')}<article><h2>Kết quả tính điểm</h2><p>${state.scores?.completedAt ? escape(state.scores.summary || 'Đã tính điểm; mở công cụ để xem lại công thức.') : 'Chưa có kết quả. Điểm đang nhập được lưu nháp.'}</p><a href="score-calculator.html">Mở điểm đã nhập →</a></article></div><section id="action-plan"><h2>Kế hoạch hành động</h2><p>Ghi việc cụ thể, chẳng hạn đọc đề án trường hoặc trao đổi với giáo viên.</p><form id="journeyTaskForm"><label for="journeyTask">Việc cần làm</label><div class="flow-actions"><input id="journeyTask" maxlength="180" required placeholder="Ví dụ: kiểm tra điều kiện ngành yêu thích"><button type="submit">Thêm việc</button></div></form><ul id="journeyTasks"></ul></section>`;
    // School favorites have their searchable management section above.
    details.querySelector('a[href="page2.html"]')?.closest('article')?.remove();
    host.prepend(details);
    const renderTasks = () => {
      const tasks = read().tasks || [];
      details.querySelector('#journeyTasks').innerHTML = tasks.length ? tasks.map(task => `<li><label><input type="checkbox" data-task="${escape(task.id)}" ${task.done ? 'checked' : ''}> ${escape(task.text)}</label><button type="button" data-remove-task="${escape(task.id)}" aria-label="Xóa việc ${escape(task.text)}">Xóa</button></li>`).join('') : '<li>Chưa có việc nào. Thêm một việc nhỏ để bắt đầu.</li>';
    };
    renderTasks();
    details.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const input = details.querySelector('#journeyTask');
      if (!input.value.trim()) return;
      save({ tasks: [...(read().tasks || []), { id: String(Date.now()), text: input.value.trim(), done: false }] });
      input.value = ''; renderTasks();
    });
    details.addEventListener('change', event => {
      if (event.target.dataset.task) save({ tasks: (read().tasks || []).map(task => task.id === event.target.dataset.task ? { ...task, done: event.target.checked } : task) });
    });
    details.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (button?.dataset.removeTask) { save({ tasks: (read().tasks || []).filter(task => task.id !== button.dataset.removeTask) }); renderTasks(); }
      if (button?.dataset.removeField) {
        removeSaved(button.dataset.removeField, button.dataset.removeId);
        const list = button.closest('ul');
        button.closest('li').remove();
        if (!list.children.length) list.outerHTML = '<p>Chưa có lựa chọn đã lưu.</p>';
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
