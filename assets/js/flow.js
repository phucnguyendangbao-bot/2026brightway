/* Shared navigation and the visitor's next step. No account is required. */
(function () {
  'use strict';
  const KEY = 'bwJourneyV1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = patch => {
    const value = { ...read(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
    return value;
  };
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function holland() {
    try {
      const imported = JSON.parse(localStorage.getItem('studentHollandImportedV1') || 'null');
      const tested = JSON.parse(localStorage.getItem('studentHollandV1') || 'null');
      const chosen = imported && (!tested || imported.savedAt >= tested.savedAt) ? imported : tested;
      const code = chosen === tested && !tested?.completed && tested?.answered !== 42 ? '' : chosen?.code;
      return /^[RIASEC]{1,3}$/.test(code || '') ? code : '';
    } catch { return ''; }
  }
  function nextStep(container, title, description, links) {
    if (!container) return;
    container.innerHTML = `<section class="flow-next"><div><span class="flow-kicker">Bước tiếp theo</span><h2>${escape(title)}</h2><p>${escape(description)}</p></div><div class="flow-actions">${links.map(([label, href]) => `<a href="${escape(href)}">${escape(label)} →</a>`).join('')}</div></section>`;
  }
  window.BWFlow = { read, save, holland, nextStep };
  const page = location.pathname.split('/').pop() || 'index.html';
  const nav = document.querySelector('nav.bw-nav, nav.p2-nav, nav.lp-nav, nav.nav');
  if (nav) {
    const search = nav.querySelector('.p2-search-bar');
    const senior = nav.querySelector('.senior-toggle');
    const auth = document.getElementById('navAuthSlot');
    const theme = document.getElementById('themeToggle');
    const items = [
      ['Trang chủ', 'index.html', ['index.html']],
      ['Khám phá nghề', 'careers-holland.html', ['careers-holland.html','majors.html','major-detail.html']],
      ['Test Holland', 'holland.html', ['holland.html']],
      ['Trường & điểm', 'page2.html', ['page2.html','score-calculator.html']],
      ['Tin tuyển sinh', 'resources.html', ['resources.html','news.html','news-detail.html']],
      ['Waybi', 'waybi.html', ['waybi.html']],
    ];
    nav.className = 'flow-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');
    nav.innerHTML = `<div class="flow-nav-inner"><a class="flow-logo" href="index.html"><img src="assets/images/brand/brightway-mark.png" alt="" aria-hidden="true"><span>BrightWay Career</span></a><button type="button" class="flow-menu" aria-controls="navLinks" aria-expanded="false" aria-label="Mở menu">Menu <span aria-hidden="true">☰</span></button><div id="navLinks" class="flow-links">${items.map(([label, href, pages]) => `<a href="${href}" ${pages.includes(page) ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}<a href="profile.html" ${page === 'profile.html' ? 'class="active" aria-current="page"' : ''}>Hồ sơ</a></div></div>`;
    const links = nav.querySelector('#navLinks');
    if (senior) links.appendChild(senior);
    if (theme) { theme.classList.add('flow-theme'); links.appendChild(theme); }
    if (auth) links.appendChild(auth);
    if (search) {
      const toolbar = document.createElement('div');
      toolbar.className = 'flow-toolbar';
      toolbar.appendChild(search);
      const other = document.createElement('a');
      other.href = page === 'page2.html' ? 'score-calculator.html' : 'page2.html';
      other.textContent = page === 'page2.html' ? 'Tính điểm xét tuyển →' : 'Tra cứu trường →';
      toolbar.appendChild(other);
      nav.after(toolbar);
    }
    const button = nav.querySelector('.flow-menu');
    const close = () => { links.classList.remove('open'); button.setAttribute('aria-expanded','false'); };
    button.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); button.focus(); } });
  }

  // Keep sign-in tied to the page the visitor was using.
  document.querySelectorAll('a[href="login.html"]').forEach(a => {
    a.href = 'login.html?return=' + encodeURIComponent(location.pathname + location.search + location.hash);
  });
  function init() {
    const state = read();
    if (page === 'index.html') {
      const host = document.createElement('div');
      host.className = 'flow-resume';
      document.getElementById('hero-actions')?.after(host);
      if (holland() || state.career || state.scores) {
        nextStep(host, 'Tiếp tục hành trình của bạn', [holland() ? 'Holland: ' + holland() : '', state.career?.name].filter(Boolean).join(' · ') || 'Điểm bạn đã nhập được giữ trên thiết bị này.', [
          state.career ? ['Tra cứu trường', 'page2.html'] : ['Xem nghề phù hợp', 'careers-holland.html' + (holland() ? '?holland=' + holland() : '')],
          ['Tính điểm', 'score-calculator.html']
        ]);
      }
    }
    if (page === 'profile.html') {
      const host = document.createElement('div');
      host.className = 'flow-local-profile';
      document.querySelector('.profile-page .container')?.prepend(host);
      const score = state.scores;
      nextStep(host, 'Hành trình trên thiết bị này', [holland() ? 'Mã Holland: ' + holland() : 'Chưa có kết quả Holland', state.career ? 'Nghề đang tìm: ' + state.career.name : '', state.school ? 'Trường đã chọn: ' + state.school.name : '', score ? 'Tổ hợp đã nhập: ' + score.combo : ''].filter(Boolean).join(' · '), [['Khám phá nghề', 'careers-holland.html'], ['Xem điểm đã nhập', 'score-calculator.html']]);
      try {
        const favorites = JSON.parse(localStorage.getItem('bw_favorites') || '[]');
        if (Array.isArray(favorites) && favorites.length) {
          const saved = document.createElement('div');
          saved.className = 'flow-next';
          saved.innerHTML = '<div><h2>Nghề đã lưu trên thiết bị</h2><p>Mở một nghề để xem lại hoặc thay đổi trạng thái lưu.</p></div><div class="flow-actions">' + favorites.map(job => `<a href="careers-holland.html?q=${encodeURIComponent(job.name)}&holland=all">${escape(job.name)}</a>`).join('') + '</div>';
          host.appendChild(saved);
        }
      } catch {}
    }
    if (['calendar.html','scholarship-roadmap.html'].includes(page)) {
      const host = document.createElement('div');
      host.className = 'flow-resume';
      document.querySelector('footer')?.before(host);
      nextStep(host, 'Chuẩn bị cho bước tiếp theo', 'Xem tin tuyển sinh chính thức hoặc mở hồ sơ để xem lại hành trình của bạn.', [['Tin tuyển sinh','resources.html'], ['Hồ sơ của tôi','profile.html']]);
    }
    // Quick routes are available on both chatbot implementations, without an AI request.
    for (const id of ['waybi-suggest', 'bwChatSuggestions']) {
      const target = document.getElementById(id);
      if (!target) continue;
      const shortcuts = document.createElement('div');
      shortcuts.className = 'flow-chat-links';
      shortcuts.setAttribute('aria-label', 'Mở nhanh công cụ');
      shortcuts.innerHTML = '<a href="holland.html">Test Holland</a><a href="page2.html">Tra cứu trường</a><a href="score-calculator.html">Tính điểm</a><a href="resources.html">Tin tuyển sinh</a>';
      target.before(shortcuts);
    }
    if (page === 'waybi.html') {
      const host = document.createElement('div');
      host.className = 'flow-resume';
      document.querySelector('.w-hero, .lp-hero, section')?.after(host);
      nextStep(host, 'Bạn muốn bắt đầu từ đâu?', 'Chọn công cụ hoặc mở nút chat Waybi ở góc màn hình để được hướng dẫn.', [['Test Holland','holland.html'], ['Tra cứu trường','page2.html'], ['Tính điểm','score-calculator.html']]);
    }
  }
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
