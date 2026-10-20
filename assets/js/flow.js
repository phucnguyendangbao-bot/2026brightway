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
      try { localStorage.setItem(key, value); memory.delete(key); return true; }
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

  window.BWFlow = { read, save, clear, holland, nextStep, progress, renderJourney, addUnique, removeSaved, storage };
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
      ['Nguyện vọng', 'profile.html?tab=journey#my-choices', []],
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
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && links.classList.contains('open')) { close(); button.focus(); } });
  }

  document.querySelectorAll('a[href="login.html"]').forEach(anchor => {
    anchor.href = 'login.html?return=' + encodeURIComponent(location.pathname + location.search + location.hash);
  });

  function init() {
    if (page === 'index.html') {
      const hero = document.getElementById('hero-actions');
      // The three intent cards already explain these benefits on the homepage.
      let anchor = hero;
      for (const id of ['university-discovery', 'roadmap', 'tools', 'admissions-news']) {
        const section = document.getElementById(id);
        if (section) { anchor.after(section); anchor = section; }
      }
      const host = document.createElement('div');
      host.className = 'flow-resume';
      document.getElementById('hero-actions')?.after(host);
      if (read().updatedAt || holland()) renderJourney(host, true);
    }
    if (page === 'profile.html') {
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
