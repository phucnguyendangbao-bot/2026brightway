/* ════════════════════════════════════════════════════════
   CAREERS — Tra cứu nghề (với Holland filter + dark mode friendly)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const POPULAR = [
    'Lập trình viên', 'Bác sĩ thú y', 'Kế toán', 'Kiến trúc sư',
    'Phi công', 'Đầu bếp', 'Luật sư', 'Giáo viên ngoại ngữ'
  ];

  const HOLLAND_META = {
    all: { label: 'Tất cả', emoji: '🌐', color: '#082e85', desc: 'Mọi nhóm' },
    R: { label: 'Kỹ thuật', emoji: '🔧', color: '#f59e0b', desc: 'Làm việc với tay, máy móc.' },
    I: { label: 'Nghiên cứu', emoji: '🔬', color: '#082e85', desc: 'Phân tích, khám phá, giải quyết vấn đề.' },
    A: { label: 'Nghệ thuật', emoji: '🎨', color: '#ec4899', desc: 'Sáng tạo, biểu đạt phong phú.' },
    S: { label: 'Xã hội', emoji: '🤝', color: '#10b981', desc: 'Giao tiếp, giúp đỡ mọi người.' },
    E: { label: 'Lãnh đạo', emoji: '🚀', color: '#f97316', desc: 'Kinh doanh, thuyết phục, dẫn dắt.' },
    C: { label: 'Nghiệp vụ', emoji: '📊', color: '#0a3496', desc: 'Trật tự, chi tiết, dữ liệu.' }
  };
  // Line icons from holland-icons.js; the emoji stays only as a fallback if that file did not load.
  const hIcon = k => (window.BWHollandIcon && window.BWHollandIcon(k)) || HOLLAND_META[k].emoji;

  const state = {
    jobs: [],
    query: '',
    activeHolland: 'all',
    importedCode: ''
  };

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  let suggestionIndex = -1;

  function norm(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  // ─── FILTER + SEARCH ───
  function getFiltered() {
    const q = norm(state.query.trim());
    const h = state.activeHolland;
    const list = state.jobs.filter(j => {
      const matchQ = !q ||
        norm(j.name).includes(q) ||
        norm(j.en).includes(q) ||
        norm(j.group).includes(q) ||
        (j.code || '').includes(q);
      const matchH = state.importedCode
        ? [...state.importedCode].some(code => (j.holland || []).includes(code))
        : h === 'all' || (j.holland || []).includes(h);
      return matchQ && matchH;
    });
    return ranked(list);
  }

  // How well a career fits the reader's three-letter code: the code's first letter weighs most,
  // and so does a group listed first for the career.
  function matchScore(j, code) {
    return [...(code || '')].reduce((sum, c, i) => {
      const k = (j.holland || []).indexOf(c);
      return k < 0 ? sum : sum + (3 - i) * (3 - Math.min(k, 2));
    }, 0);
  }
  const shared = j => (j.holland || []).filter(c => state.importedCode.includes(c)).length;
  function ranked(list) {
    if (!state.importedCode) return list;
    return list.map((j, i) => ({ j, i, s: matchScore(j, state.importedCode) }))
      .sort((a, b) => shared(b.j) - shared(a.j) || b.s - a.s || a.i - b.i).map(x => x.j);
  }
  let listLimit = 20;

  function search(q) {
    state.query = q;
    return getFiltered();
  }

  // "Clear all filters" only appears when something is actually filtered.
  function syncClearFilters() {
    document.querySelectorAll('a.flow-clear-filters').forEach(link => { link.hidden = !(state.query || state.importedCode || (state.activeHolland && state.activeHolland !== 'all')); });
  }
  function persistFilters() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    params.set('holland', state.importedCode || state.activeHolland);
    history.replaceState(null, '', '?' + params.toString());
    window.BWFlow?.save({ careerFilters: { query: state.query, holland: state.importedCode || state.activeHolland } });
    syncClearFilters();
    $('careerCount').textContent = `${getFiltered().length} kết quả / ${state.jobs.length} nghề · Nhóm Holland là gợi ý sở thích`;
  }

  // A reader who arrives with a code sees it named at once, not a general welcome.
  function personalise(code) {
    const names = [...code].map(c => HOLLAND_META[c].label.toLowerCase()).join(', ');
    const h2 = document.querySelector('.career-intro h2');
    const intro = document.querySelector('.career-intro p:not(.explorer-eyebrow)');
    const cta = document.querySelector('.explorer-cta');
    const note = document.querySelector('.explorer-hero-note');
    if (h2) h2.textContent = `Nghề hợp mã ${code} của bạn`;
    if (intro) intro.textContent = `Nghề có nhiều nhóm ${names} đứng đầu danh sách. Chọn một nghề để xem công việc, ngành học liên quan, rồi tới trường đào tạo.`;
    if (cta) cta.innerHTML = `Xem nghề hợp mã ${escapeHtml(code)} <span aria-hidden="true">↓</span>`;
    if (note) note.textContent = 'Bước tiếp sau Holland: nghề → ngành học → trường';
    const compass = document.querySelector('.explorer-compass');
    if (compass) {
      compass.querySelector('.explorer-eyebrow').textContent = 'MÃ HOLLAND CỦA BẠN';
      compass.querySelector('h2').textContent = `${code} · ${[...code].map(c => HOLLAND_META[c].label).join(' – ')}`;
      const p = compass.querySelector('p:not(.explorer-eyebrow)');
      if (p) p.textContent = 'Danh sách bên dưới đã xếp theo mã này. Muốn chắc hơn, làm lại trắc nghiệm.';
      compass.querySelectorAll('.explorer-letters span').forEach(span => span.classList.toggle('is-mine', code.includes(span.textContent)));
      const link = compass.querySelector('a');
      if (link) link.innerHTML = 'Làm lại trắc nghiệm <span aria-hidden="true">→</span>';
    }
  }

  // ─── HOLLAND FILTER UI ───
  function renderHollandFilter() {
    const wrap = $('hollandFilterChips');
    if (!wrap) return;
    wrap.innerHTML = Object.entries(HOLLAND_META).map(([k, m]) => {
      const active = state.importedCode ? k !== 'all' && state.importedCode.includes(k) : k === state.activeHolland;
      const rank = state.importedCode && k !== 'all' ? state.importedCode.indexOf(k) + 1 : 0;
      return `
      <button class="holland-chip ${active ? 'active' : ''}"
              data-code="${k}"
              aria-pressed="${active ? 'true' : 'false'}"
              style="--c:${m.color}">
        <span class="emoji">${hIcon(k)}</span>
        <span class="label">${m.label}</span>
        ${rank ? `<span class="rank" aria-label="Ưu tiên ${rank}">${rank}</span>` : ''}
      </button>
    `;
    }).join('');
    wrap.querySelectorAll('.holland-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeHolland = btn.dataset.code;
        state.importedCode = '';
        listLimit = 20;
        persistFilters();
        $('hollandFilterLabel').textContent = 'Lọc theo nhóm Holland:';
        // re-render
        renderHollandFilter();
        // re-render result based on current state
        if (state.query) {
          handle(state.query);
        } else {
          // Show all in current filter
          const list = getFiltered();
          renderListResult(list);
        }
      });
    });
    // Show filter section only when jobs loaded
    const section = $('hollandFilter');
    if (section) section.hidden = state.jobs.length === 0;
  }

  // ─── RENDER ───
  function renderChips() {
    const wrap = $('careerChips');
    if (!wrap) return;
    wrap.innerHTML = POPULAR.map(p =>
      `<button type="button" class="career-chip" data-name="${p}">${p}</button>`
    ).join('');
    wrap.querySelectorAll('.career-chip').forEach(el => {
      el.addEventListener('click', () => {
        $('careerSearch').value = el.dataset.name;
        handle(el.dataset.name);
        $('careerSuggestions').classList.remove('show');
      });
    });
  }

  function renderSuggestions(list) {
    const box = $('careerSuggestions');
    if (!box) return;
    if (!list.length) {
      box.classList.remove('show');
      $('careerSearch').setAttribute('aria-expanded', 'false');
      return;
    }
    const suggestions = list.slice(0, 8);
    box.innerHTML = suggestions.map((j, index) => {
      const hollandBadge = (j.holland || []).map(c => {
        const m = HOLLAND_META[c];
        return `<span class="badge-h" aria-hidden="true" style="background:${m.color}22;border-color:${m.color};color:${m.color}">${hIcon(c)}</span>`;
      }).join('');
      return `
        <button class="career-sugg-item" type="button" role="option" aria-selected="false" id="careerSuggestion${index}" data-name="${escapeHtml(j.name)}">
          <div class="career-sugg-name">${escapeHtml(j.name)}</div>
          <div class="career-sugg-meta">
            ${escapeHtml(j.en)} · ${escapeHtml(j.group)} · Mã ${escapeHtml(j.code)}
            ${hollandBadge ? `<span class="career-sugg-holland">${hollandBadge}</span>` : ''}
          </div>
        </button>
      `;
    }).join('');
    box.classList.add('show');
    $('careerSearch').setAttribute('aria-expanded', 'true');
    suggestionIndex = -1;
    box.querySelectorAll('.career-sugg-item').forEach(el => {
      el.addEventListener('click', () => {
        $('careerSearch').value = el.dataset.name;
        handle(el.dataset.name);
        box.classList.remove('show');
        $('careerSearch').setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Line icons for the detail sections (same drawing style as the Holland set).
  const detailIcon = body => `<svg class="career-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const DETAIL_ICON = {
    work: detailIcon('<rect x="3.5" y="7.5" width="17" height="12" rx="2.2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>'),
    skills: detailIcon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>'),
    study: detailIcon('<path d="M12 4.5 21.5 9 12 13.5 2.5 9z"/><path d="M6.5 11v4.6c3.2 2.4 7.8 2.4 11 0V11"/><path d="M21.5 9v5"/>'),
    fit: detailIcon('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/><path d="m15.5 4.5 1.2 1.2 2.3-2.3"/>'),
    similar: detailIcon('<rect x="3.5" y="3.5" width="8" height="8" rx="2"/><rect x="12.5" y="12.5" width="8" height="8" rx="2"/><path d="M15.5 8.5h3v3M8.5 15.5v3h3"/>'),
  };

  function renderJob(j) {
    const r = $('careerResult');
    const hollandTags = (j.holland || []).map(c => {
      const m = HOLLAND_META[c];
      return `<span class="job-holland-tag" style="background:${m.color}1a;border:1.5px solid ${m.color};color:${m.color}">${hIcon(c)} ${m.label}</span>`;
    }).join('');
    // Who this career suits: its Holland groups, matched against the reader's own code when there is one.
    const myCode = String(state.importedCode || window.BWFlow?.holland?.() || '').toUpperCase().replace(/[^RIASEC]/g, '');
    const matched = (j.holland || []).filter(c => myCode.includes(c));
    // Careers with the most Holland groups in common (earlier letters weigh more), then the same field.
    const weight = (a, b) => (a || []).reduce((sum, c, i) => { const k = (b || []).indexOf(c); return k < 0 ? sum : sum + (3 - i) + (3 - k); }, 0);
    const similar = state.jobs.filter(o => o.name !== j.name)
      .map(o => ({ o, score: weight(j.holland, o.holland) + (o.group === j.group ? 2 : 0) }))
      .filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map(x => x.o);

    r.innerHTML = `
      <div class="career-result">
        ${listReturn ? `<button type="button" class="career-back" data-career-back>← ${state.importedCode ? `Danh sách nghề hợp mã ${escapeHtml(state.importedCode)}` : 'Quay lại danh sách nghề'}</button>` : ''}
        <div class="career-result-hd">
          <div class="career-result-top">
          <div class="career-code" title="Mã nội bộ của BrightWay, chưa đối chiếu chuẩn mã nghề">Mã ${escapeHtml(j.code)} · ${escapeHtml(j.group)}</div>
            <button class="btn-fav" id="favBtn" data-name="${escapeHtml(j.name)}" title="Lưu nghề yêu thích" aria-pressed="false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span class="fav-label">Lưu</span>
            </button>
          </div>
          <div class="career-title">${escapeHtml(j.name)}</div>
          <div class="career-en">${escapeHtml(j.en)}</div>
          ${hollandTags ? `<div class="career-holland-row">${hollandTags}</div>` : ''}
        </div>
        <div class="career-detail-grid">
          <section class="career-block">
            <h3 class="career-label">${DETAIL_ICON.work}Công việc</h3>
            <p class="career-body">${escapeHtml(j.desc)}</p>
          </section>
          <section class="career-block">
            <h3 class="career-label">${DETAIL_ICON.skills}Kỹ năng cần có</h3>
            <ul class="career-skills">${(j.skills || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          </section>
          <section class="career-block">
            <h3 class="career-label">${DETAIL_ICON.study}Con đường học tập</h3>
            <p class="career-body">${escapeHtml(j.edu)}</p>
            <p class="career-note">Lộ trình định hướng, chưa phải đủ điều kiện tuyển dụng hay cấp phép. Kiểm tra quy định khi đăng ký.</p>
            ${/^https:\/\//.test(j.eduSource || '') ? `<p class="career-note"><a href="${escapeHtml(j.eduSource)}" target="_blank" rel="noopener noreferrer">Nguồn yêu cầu hành nghề ↗</a> · Đối chiếu ${escapeHtml(j.eduReviewedAt)}</p>` : ''}
          </section>
          <section class="career-block career-fit">
            <h3 class="career-label">${DETAIL_ICON.fit}Hợp với ai</h3>
            ${myCode ? `<p class="career-status${matched.length ? '' : ' is-quiet'}">${matched.length ? `Khớp ${matched.length}/${(j.holland || []).length} nhóm với mã ${escapeHtml(myCode)} của bạn` : `Chưa khớp nhóm nào với mã ${escapeHtml(myCode)} của bạn`}</p>` : ''}
            <ul class="career-fit-list">${(j.holland || []).map(c => `<li class="${myCode.includes(c) ? 'is-match' : ''}" style="--c:${HOLLAND_META[c].color}"><span class="career-fit-icon">${hIcon(c)}</span><span><strong>${c} · ${HOLLAND_META[c].label}</strong>${escapeHtml(HOLLAND_META[c].desc)}</span></li>`).join('')}</ul>
          </section>
          ${similar.length ? `<section class="career-block career-similar">
            <h3 class="career-label">${DETAIL_ICON.similar}Nghề gần giống</h3>
            <div class="career-similar-list">${similar.map(o => `<button type="button" data-similar="${escapeHtml(o.name)}"><strong>${escapeHtml(o.name)}</strong><span>${(o.holland || []).map(c => `<b style="color:${HOLLAND_META[c].color}">${c}</b>`).join('')} · ${escapeHtml(o.group)}</span></button>`).join('')}</div>
          </section>` : ''}
        </div>
      </div>
    `;
    window.BWFlow?.save({ career: { name: j.name, group: j.group } });
    persistFilters();
    r.querySelector('[data-career-back]')?.addEventListener('click', () => {
      const back = listReturn;
      listReturn = null;
      $('careerSearch').value = back.query;
      state.query = back.query;
      listLimit = back.limit;
      persistFilters();
      renderListResult(getFiltered());
      const item = [...r.querySelectorAll('.career-list-item')].find(el => el.dataset.name === j.name);
      (item || r).scrollIntoView({ block: 'center' });
      item?.focus({ preventScroll: true });
    });
    r.querySelectorAll('[data-similar]').forEach(button => button.addEventListener('click', () => {
      const other = state.jobs.find(o => o.name === button.dataset.similar);
      if (!other) return;
      $('careerSearch').value = other.name;
      renderJob(other);
      bindFavButton(other);
      r.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }));
    const next = document.createElement('div');
    r.appendChild(next);
    window.BWFlow?.nextStep(next, 'Tìm nơi học cho nghề bạn quan tâm', 'Đọc phần học vấn ở trên, rồi đối chiếu ngành đào tạo và phương thức tuyển sinh tại các trường.', [['Tra cứu trường', 'page2.html?career=' + encodeURIComponent(j.name)], ['Tài liệu & bài viết', 'resources.html']]);
    const pathways = document.createElement('section');
    pathways.className = 'career-pathways';
    pathways.setAttribute('aria-label', 'Ngành đào tạo đã đối chiếu');
    pathways.hidden = true;   // shown only once there is something to list
    next.before(pathways);
    let pathwayTimer;
    const pathwayTimeout = new Promise((resolve, reject) => { pathwayTimer = setTimeout(() => reject(new Error('Pathways timeout')), 8000); });
    Promise.race([import('./career-pathways.js?v=20261113f'), pathwayTimeout]).then(({ relatedMajorNames, suggestedMajorNames }) => {
      if (!pathways.isConnected) return;
      const sourced = relatedMajorNames(j);
      const majors = sourced.length ? sourced : suggestedMajorNames(j);
      const why = sourced.length
        ? 'Tên ngành xuất hiện trong lộ trình học vấn có nguồn ở trên và trong danh mục ngành 2026 của trường.'
        : 'Tên ngành lấy từ lộ trình học gợi ý ở trên, khớp đúng tên trong danh mục ngành 2026 của trường.';
      pathways.innerHTML = '<h2>Bước tiếp: ngành học cho nghề này</h2>' + (majors.length
        ? `<p>${why} Đây là hướng tìm hiểu, không phải kết luận nghề và ngành là một. Chọn một ngành để xem trường nào đào tạo.</p><div class="flow-actions">` + majors.map(name => {
          const params = new URLSearchParams({ mode:'major', q:name, career:j.name, careerReturn:location.pathname + location.search });
          return `<a href="page2.html?${escapeHtml(params.toString())}">${escapeHtml(name)} · Tìm trường →</a>`;
        }).join('') + '</div>'
        : '');
      if (!majors.length) pathways.remove(); else pathways.hidden = false;
    }).catch(() => {
      if (!pathways.isConnected) return;
      pathways.hidden = false;
      pathways.textContent = 'Chưa tải được dữ liệu đối chiếu ngành. Bạn vẫn có thể dùng liên kết Tra cứu trường bên dưới. ';
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'flow-clear-filters'; retry.textContent = 'Thử tải lại đối chiếu ngành';
      retry.addEventListener('click', () => location.reload());
      pathways.appendChild(retry);
    }).finally(() => clearTimeout(pathwayTimer));
  }

  function renderListResult(list) {
    $('careerCount').textContent = state.importedCode
      ? `${list.length} nghề có ít nhất một nhóm trong mã ${state.importedCode}, xếp từ khớp nhiều nhất`
      : `${list.length} kết quả / ${state.jobs.length} nghề`;
    const r = $('careerResult');
    if (!list.length) {
      r.innerHTML = `
        <div class="career-empty">
          <div class="career-empty-big">🔍 Không tìm thấy nghề phù hợp</div>
          <div>Thử đổi bộ lọc Holland hoặc nhập từ khóa khác.</div>
        </div>
      `;
      return;
    }
    // Show top 20 with holland badges
    r.innerHTML = `
      <div class="career-list">
        ${list.slice(0, listLimit).map(j => {
          const hollandTags = (j.holland || []).map(c => {
            const m = HOLLAND_META[c];
            return `<span class="job-holland-tag sm" title="${m.label}" style="background:${m.color}1a;border:1px solid ${m.color};color:${m.color}">${hIcon(c)}<b>${c}</b></span>`;
          }).join('');
          return `
            <button class="career-list-item" type="button" data-name="${escapeHtml(j.name)}">
              <div class="career-list-name">${escapeHtml(j.name)}</div>
              <div class="career-list-meta">${escapeHtml(j.en)} · ${escapeHtml(j.group)}</div>
              <div class="career-list-holland">${hollandTags}${state.importedCode ? `<span class="career-list-fit${shared(j) === 3 ? ' is-full' : ''}">Khớp ${shared(j)}/3</span>` : ''}</div>
            </button>
          `;
        }).join('')}
        ${list.length > listLimit ? `<div class="career-list-more"><button type="button" class="career-more-btn">Xem thêm ${Math.min(20, list.length - listLimit)} nghề</button><span>Còn ${list.length - listLimit} nghề. Hoặc gõ tên nghề vào ô tìm.</span></div>` : ''}
      </div>
    `;
    bindListItemClicks();
    r.querySelector('.career-more-btn')?.addEventListener('click', () => {
      const from = listLimit;
      listLimit += 20;
      renderListResult(list);
      r.querySelectorAll('.career-list-item')[from]?.focus();
    });
  }

  function handle(q) {
    if (q !== state.query) listLimit = 20;
    state.query = q;
    persistFilters();
    const list = getFiltered();
    if (!list.length) {
      const r = $('careerResult');
      r.innerHTML = `
        <div class="career-empty">
          <div class="career-empty-big">🔍 Không tìm thấy nghề phù hợp</div>
          <div>Thử nhập từ khóa khác hoặc đổi bộ lọc Holland.</div>
        </div>
      `;
      return;
    }
    const exact = list.find(j => norm(j.name) === norm(q));
    if (exact) {
      renderJob(exact);
      bindFavButton(exact);
      // Log to cloud
      window.BWSync?.logSearch(q, state.activeHolland, list.length);
    } else {
      renderListResult(list);
      window.BWSync?.logSearch(q, state.activeHolland, list.length);
    }
  }

  async function bindFavButton(job) {
    const btn = $('favBtn');
    if (!btn) return;
    let modified = false;
    const setFavoriteState = saved => {
      btn.classList.toggle('saved', saved);
      btn.setAttribute('aria-pressed', String(saved));
      btn.querySelector('.fav-label').textContent = saved ? 'Bỏ lưu' : 'Lưu';
      btn.title = saved ? 'Bỏ lưu nghề yêu thích' : 'Lưu nghề yêu thích';
    };
    setFavoriteState(Boolean(window.BWFlow?.read().savedCareers.some(item => item.name === job.name)));
    btn.addEventListener('click', async () => {
      modified = true;
      btn.disabled = true;
      btn.classList.toggle('pulsing');
      try {
        const saved = !btn.classList.contains('saved');
        if (saved) window.BWFlow?.addUnique('savedCareers', { id: job.name, name: job.name, group: job.group });
        else window.BWFlow?.removeSaved('savedCareers', job.name);
        setFavoriteState(saved);
        showFavToast(saved, 'local');
        if (window.BWAuth?.isSignedIn() && window.BWSync?.toggleFavorite) {
          const cloudSaved = await window.BWSync.isFavorited(job.name);
          if (cloudSaved !== saved) await window.BWSync.toggleFavorite(job);
        }
      } catch (e) {
        alert('Lỗi: ' + e.message);
      }
      btn.disabled = false;
      btn.classList.remove('pulsing');
    });
    if (window.BWAuth?.isSignedIn() && window.BWSync?.isFavorited) {
      try {
        const cloudSaved = await window.BWSync.isFavorited(job.name);
        if (!modified && btn.isConnected && cloudSaved) setFavoriteState(true);
      } catch (error) { console.warn('[career favorites] Cloud status unavailable; using local status.', error.message); }
    }
  }

  let listReturn = null;
  function bindListItemClicks() {
    document.querySelectorAll('.career-list-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.dataset.name;
        const job = state.jobs.find(j => j.name === name);
        if (job) {
          listReturn = { query: state.query, limit: listLimit };
          $('careerResult').scrollIntoView({ block: 'start' });
          $('careerSearch').value = name;
          handle(name);
        }
      });
    });
  }

  function showFavToast(saved, source) {
    const toast = document.createElement('div');
    toast.className = 'fav-toast ' + (saved ? 'add' : 'remove');
    toast.textContent = saved
      ? (source === 'cloud' ? 'Đã lưu vào tài khoản' : 'Đã lưu trên thiết bị này. Đăng nhập để đồng bộ.')
      : '💔 Đã bỏ lưu';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ─── EVENTS ───
  function bindEvents() {
    const input = $('careerSearch');
    if (!input) return;

    input.addEventListener('input', e => {
      const v = e.target.value.trim();
      state.query = v;
      persistFilters();
      if (!v) {
        state.query = '';
        $('careerSuggestions').classList.remove('show');
        input.setAttribute('aria-expanded', 'false');
        renderListResult(getFiltered());
        return;
      }
      state.query = v;
      renderListResult(getFiltered());
      renderSuggestions(getFiltered());
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && suggestionIndex >= 0) {
        e.preventDefault();
        const item = document.querySelectorAll('.career-sugg-item')[suggestionIndex];
        if (item) item.click();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (input.value.trim()) {
          handle(input.value.trim());
          $('careerSuggestions').classList.remove('show');
          input.setAttribute('aria-expanded', 'false');
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = [...document.querySelectorAll('.career-sugg-item')];
        if (!items.length) return;
        e.preventDefault();
        suggestionIndex = (suggestionIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((item, index) => {
          const active = index === suggestionIndex;
          item.classList.toggle('active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        input.setAttribute('aria-activedescendant', items[suggestionIndex].id);
      } else if (e.key === 'Escape') {
        $('careerSuggestions').classList.remove('show');
        input.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.career-search-box')) {
        $('careerSuggestions').classList.remove('show');
        input.setAttribute('aria-expanded', 'false');
      }
    });
  }

  async function load() {
    try {
      const res = await fetch('/assets/data/jobs.json', { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error('Failed to load');
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('Danh sách nghề không hợp lệ');
      const seen = new Set();
      state.jobs = rows.filter(job => {
        if (!job?.name?.trim() || !job?.desc?.trim()) return false;
        const identity = norm(job.name.trim());
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      });
      const params = new URLSearchParams(window.location.search);
      const previous = window.BWFlow?.read().careerFilters;
      let hollandCode = params.get('holland') || previous?.holland;
      if (!hollandCode) {
        hollandCode = window.BWFlow?.holland();
      }
      hollandCode = String(hollandCode || '').toUpperCase();
      if (/^[RIASEC]$/.test(hollandCode)) {
        state.activeHolland = hollandCode[0];
        $('hollandFilterLabel').textContent = `Đang lọc nhóm ${hollandCode} · ${HOLLAND_META[hollandCode].label}`;
      } else if (/^[RIASEC]{3}$/.test(hollandCode) && new Set(hollandCode).size === 3) {
        state.activeHolland = 'all';
        state.importedCode = hollandCode;
        $('hollandFilterLabel').textContent = `Mã của bạn: ${hollandCode} · Đang lọc nghề thuộc ${[...hollandCode].join(', ')}`;
        personalise(hollandCode);
      }
      const count = $('careerCount');
      if (count) count.textContent = `Cơ sở dữ liệu: ${state.jobs.length} nghề nghiệp phổ biến tại Việt Nam`;
      syncClearFilters();
      if (!state.jobs.length) {
        $('careerResult').innerHTML = '<p class="career-empty">Chưa có dữ liệu nghề nghiệp hợp lệ. Thử tải lại sau.</p>';
        return;
      }
      renderHollandFilter();
      renderListResult(getFiltered());
      // Auto-fill search if query string present
      const q = params.has('q') ? params.get('q') : params.has('holland') ? '' : previous?.query || '';
      if (q) {
        const input = $('careerSearch');
        if (input) {
          input.value = q;
          handle(q);
        }
      }
    } catch (e) {
      const count = $('careerCount');
      if (count) {
        count.textContent = 'Chưa tải được danh sách nghề. ';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = 'Thử lại';
        retry.addEventListener('click', () => { count.textContent = 'Đang tải danh sách nghề…'; load(); });
        count.appendChild(retry);
      }
      console.error(e);
    }
  }

  function init() {
    renderChips();
    bindEvents();
    load();
    const navToggle = $('navToggle');
    const navLinks = $('navLinks');
    navToggle?.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng');
    });
    window.CareersApp = { handle };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
