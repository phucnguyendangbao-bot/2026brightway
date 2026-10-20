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
    all: { label: 'Tất cả', emoji: '🌐', color: '#6366f1', desc: 'Mọi nhóm' },
    R: { label: 'Kỹ thuật', emoji: '🔧', color: '#f59e0b', desc: 'Làm việc với tay, máy móc.' },
    I: { label: 'Nghiên cứu', emoji: '🔬', color: '#6366f1', desc: 'Phân tích, khám phá, giải quyết vấn đề.' },
    A: { label: 'Nghệ thuật', emoji: '🎨', color: '#ec4899', desc: 'Sáng tạo, biểu đạt phong phú.' },
    S: { label: 'Xã hội', emoji: '🤝', color: '#10b981', desc: 'Giao tiếp, giúp đỡ mọi người.' },
    E: { label: 'Lãnh đạo', emoji: '🚀', color: '#f97316', desc: 'Kinh doanh, thuyết phục, dẫn dắt.' },
    C: { label: 'Nghiệp vụ', emoji: '📊', color: '#3b82f6', desc: 'Trật tự, chi tiết, dữ liệu.' }
  };

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
    return state.jobs.filter(j => {
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
  }

  function search(q) {
    state.query = q;
    return getFiltered();
  }

  function persistFilters() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    params.set('holland', state.importedCode || state.activeHolland);
    history.replaceState(null, '', '?' + params.toString());
    window.BWFlow?.save({ careerFilters: { query: state.query, holland: state.importedCode || state.activeHolland } });
    $('careerCount').textContent = `${getFiltered().length} kết quả / ${state.jobs.length} nghề · Nhóm Holland là gợi ý sở thích`;
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
        <span class="emoji">${m.emoji}</span>
        <span class="label">${m.label}</span>
        ${rank ? `<span class="rank" aria-label="Ưu tiên ${rank}">${rank}</span>` : ''}
      </button>
    `;
    }).join('');
    wrap.querySelectorAll('.holland-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeHolland = btn.dataset.code;
        state.importedCode = '';
        persistFilters();
        $('hollandFilterLabel').textContent = '🧭 Lọc theo nhóm Holland:';
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
        return `<span class="badge-h" aria-hidden="true" style="background:${m.color}22;border-color:${m.color};color:${m.color}">${m.emoji}</span>`;
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

  function renderJob(j) {
    const r = $('careerResult');
    const hollandTags = (j.holland || []).map(c => {
      const m = HOLLAND_META[c];
      return `<span class="job-holland-tag" style="background:${m.color}1a;border:1.5px solid ${m.color};color:${m.color}">${m.emoji} ${m.label}</span>`;
    }).join('');

    r.innerHTML = `
      <div class="career-result">
        <div class="career-result-hd">
          <div class="career-result-top">
          <div class="career-code">Mã trong dữ liệu: ${escapeHtml(j.code)} · ${escapeHtml(j.group)} (chưa đối chiếu chuẩn mã nghề)</div>
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
        <div class="career-section">
          <div class="career-label">📝 Mô tả nghề</div>
          <div class="career-body">${escapeHtml(j.desc)}</div>
        </div>
        <div class="career-section">
          <div class="career-label">🎯 Kỹ năng yêu cầu</div>
          <div class="career-body">
            <ul>${(j.skills || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="career-section">
          <div class="career-label">🎓 Học vấn & Con đường học tập</div>
          <div class="career-body">${escapeHtml(j.edu)}</div>
          <p class="career-education-note">Lộ trình định hướng, không phải danh sách đầy đủ điều kiện tuyển dụng hoặc cấp phép. Hãy kiểm tra chương trình và quy định tại thời điểm đăng ký.</p>
          ${/^https:\/\//.test(j.eduSource || '') ? `<p class="career-education-source"><a href="${escapeHtml(j.eduSource)}" target="_blank" rel="noopener noreferrer">Nguồn yêu cầu hành nghề ↗</a> · Đối chiếu ${escapeHtml(j.eduReviewedAt)}</p>` : ''}
        </div>
        <div class="career-info-grid career-market-grid">
          <div class="career-info-item career-market-empty" role="note">
            <div class="lbl">📊 Dữ liệu thị trường lao động</div>
            <div class="val career-salary">Chưa có dữ liệu đã đối chiếu</div>
            <p>BrightWay chưa hiển thị mức lương hoặc nhận định triển vọng cho nghề này vì dữ liệu chưa có đủ nguồn, năm khảo sát, đơn vị tiền và mức kinh nghiệm. Hãy đối chiếu thêm báo cáo tuyển dụng hiện hành trước khi quyết định.</p>
          </div>
        </div>
      </div>
    `;
    window.BWFlow?.save({ career: { name: j.name, group: j.group } });
    persistFilters();
    const next = document.createElement('div');
    r.appendChild(next);
    window.BWFlow?.nextStep(next, 'Tìm nơi học cho nghề bạn quan tâm', 'Đọc phần học vấn ở trên, rồi đối chiếu ngành đào tạo và phương thức tuyển sinh tại các trường.', [['Tra cứu trường', 'page2.html?career=' + encodeURIComponent(j.name)], ['Tài liệu & bài viết', 'resources.html']]);
    const pathways = document.createElement('section');
    pathways.className = 'career-pathways';
    pathways.setAttribute('aria-label', 'Ngành đào tạo đã đối chiếu');
    pathways.textContent = 'Đang đối chiếu ngành đào tạo từ nguồn hiện có…';
    next.before(pathways);
    import('./career-pathways.js').then(({ relatedMajorNames }) => {
      if (!pathways.isConnected) return;
      const majors = relatedMajorNames(j);
      pathways.innerHTML = '<h2>Ngành đào tạo liên quan</h2>' + (majors.length
        ? '<p>Tên ngành xuất hiện trong lộ trình học vấn có nguồn ở trên và trong danh mục trường năm 2026. Đây là hướng tìm hiểu, không phải kết luận nghề và ngành là một.</p><div class="flow-actions">' + majors.map(name => {
          const params = new URLSearchParams({ mode:'major', q:name, career:j.name, careerReturn:location.pathname + location.search });
          return `<a href="page2.html?${escapeHtml(params.toString())}">${escapeHtml(name)} · Tìm trường →</a>`;
        }).join('') + '</div>'
        : '<p>Chưa có đối chiếu đủ nguồn giữa nghề này và danh mục ngành. Bạn có thể mở tra cứu trường để tự tìm ngành quan tâm.</p>');
    }).catch(() => { if (pathways.isConnected) pathways.textContent = 'Chưa tải được dữ liệu đối chiếu ngành. Bạn vẫn có thể dùng liên kết Tra cứu trường bên dưới.'; });
  }

  function renderListResult(list) {
    $('careerCount').textContent = `${list.length} kết quả / ${state.jobs.length} nghề`;
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
        ${list.slice(0, 20).map(j => {
          const hollandTags = (j.holland || []).map(c => {
            const m = HOLLAND_META[c];
            return `<span class="job-holland-tag sm" style="background:${m.color}1a;border:1px solid ${m.color};color:${m.color}">${m.emoji}</span>`;
          }).join('');
          return `
            <button class="career-list-item" type="button" data-name="${escapeHtml(j.name)}">
              <div class="career-list-name">${escapeHtml(j.name)}</div>
              <div class="career-list-meta">${escapeHtml(j.en)} · ${escapeHtml(j.group)}</div>
              <div class="career-list-holland">${hollandTags}</div>
            </button>
          `;
        }).join('')}
        ${list.length > 20 ? `<div class="career-list-more">+ ${list.length - 20} nghề khác. Hãy nhập tên cụ thể để xem chi tiết.</div>` : ''}
      </div>
    `;
    bindListItemClicks();
  }

  function handle(q) {
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

  function bindListItemClicks() {
    document.querySelectorAll('.career-list-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.dataset.name;
        const job = state.jobs.find(j => j.name === name);
        if (job) {
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
      }
      const count = $('careerCount');
      if (count) count.textContent = `📚 Cơ sở dữ liệu: ${state.jobs.length} nghề nghiệp phổ biến tại Việt Nam`;
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
