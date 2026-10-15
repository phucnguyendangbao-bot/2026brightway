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
      `<span class="career-chip" data-name="${p}">${p}</span>`
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
            <button class="btn-fav" id="favBtn" data-name="${j.name}" title="Lưu nghề yêu thích">
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
        </div>
        <div class="career-info-grid">
          <div class="career-info-item">
            <div class="lbl">💰 Mức lương tham khảo</div>
            <div class="val career-salary">Chưa có dữ liệu xác minh</div>
            <p>Nguồn, năm, khoảng lương (VNĐ/tháng) và mức kinh nghiệm chưa được xác minh. Không coi đây là thu nhập bảo đảm.</p>
          </div>
          <div class="career-info-item">
            <div class="lbl">📈 Triển vọng nghề nghiệp</div>
            <div class="val">${escapeHtml(j.outlook)}</div>
            <p>Mô tả định hướng chưa có nguồn thị trường lao động và năm dữ liệu xác minh.</p>
          </div>
        </div>
      </div>
    `;
    window.BWFlow?.save({ career: { name: j.name, group: j.group } });
    history.replaceState(null, '', '?q=' + encodeURIComponent(j.name) + (state.importedCode ? '&holland=' + state.importedCode : ''));
    const next = document.createElement('div');
    r.appendChild(next);
    window.BWFlow?.nextStep(next, 'Tìm nơi học cho nghề bạn quan tâm', 'Đọc phần học vấn ở trên, rồi đối chiếu ngành đào tạo và phương thức tuyển sinh tại các trường.', [['Tra cứu trường', 'page2.html?career=' + encodeURIComponent(j.name)], ['Tài liệu & bài viết', 'resources.html']]);
  }

  function renderListResult(list) {
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
    // Init state
    try {
      const isFav = await window.BWSync?.isFavorited?.(job.name);
      if (isFav) btn.classList.add('saved');
    } catch {}
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.classList.toggle('pulsing');
      try {
        const { saved, source } = await window.BWSync.toggleFavorite(job);
        btn.classList.toggle('saved', saved);
        showFavToast(saved, source);
      } catch (e) {
        alert('Lỗi: ' + e.message);
      }
      btn.disabled = false;
      btn.classList.remove('pulsing');
    });
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
      if (!v) {
        state.query = '';
        $('careerSuggestions').classList.remove('show');
        input.setAttribute('aria-expanded', 'false');
        renderListResult(getFiltered());
        return;
      }
      state.query = v;
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
      let hollandCode = params.get('holland');
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
      const q = params.get('q') || (!hollandCode ? window.BWFlow?.read().career?.name : '');
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
