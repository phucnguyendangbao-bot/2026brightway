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
    R: { label: 'Thực tế', emoji: '🔧', color: '#f59e0b', desc: 'Làm việc với tay, máy móc.' },
    I: { label: 'Nghiên cứu', emoji: '🔬', color: '#6366f1', desc: 'Phân tích, khám phá, giải quyết vấn đề.' },
    A: { label: 'Nghệ thuật', emoji: '🎨', color: '#ec4899', desc: 'Sáng tạo, biểu đạt phong phú.' },
    S: { label: 'Xã hội', emoji: '🤝', color: '#10b981', desc: 'Giao tiếp, giúp đỡ mọi người.' },
    E: { label: 'Lãnh đạo', emoji: '🚀', color: '#f97316', desc: 'Kinh doanh, thuyết phục, dẫn dắt.' },
    C: { label: 'Quy củ', emoji: '📊', color: '#3b82f6', desc: 'Trật tự, chi tiết, dữ liệu.' }
  };

  const DATA_URL = 'assets/data/jobs.json';

  const state = {
    jobs: [],
    query: '',
    activeHolland: 'all',
    activeTab: 'search'
  };

  const $ = id => document.getElementById(id);

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
      const matchH = h === 'all' || (j.holland || []).includes(h);
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
    wrap.innerHTML = Object.entries(HOLLAND_META).map(([k, m]) => `
      <button class="holland-chip ${k === state.activeHolland ? 'active' : ''}"
              data-code="${k}"
              style="--c:${m.color}">
        <span class="emoji">${m.emoji}</span>
        <span class="label">${m.label}</span>
      </button>
    `).join('');
    wrap.querySelectorAll('.holland-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeHolland = btn.dataset.code;
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
    if (!list.length) { box.classList.remove('show'); return; }
    box.innerHTML = list.slice(0, 8).map(j => {
      const hollandBadge = (j.holland || []).map(c => {
        const m = HOLLAND_META[c];
        return `<span class="badge-h" style="background:${m.color}22;border-color:${m.color};color:${m.color}">${m.emoji}</span>`;
      }).join('');
      return `
        <div class="career-sugg-item" data-name="${j.name}">
          <div class="career-sugg-name">${j.name}</div>
          <div class="career-sugg-meta">
            ${j.en} · ${j.group} · Mã ${j.code}
            ${hollandBadge ? `<span class="career-sugg-holland">${hollandBadge}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    box.classList.add('show');
    box.querySelectorAll('.career-sugg-item').forEach(el => {
      el.addEventListener('click', () => {
        $('careerSearch').value = el.dataset.name;
        handle(el.dataset.name);
        box.classList.remove('show');
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
            <div class="career-code">ISCO ${j.code} · ${j.group}</div>
            <button class="btn-fav" id="favBtn" data-name="${j.name}" title="Lưu nghề yêu thích">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span class="fav-label">Lưu</span>
            </button>
          </div>
          <div class="career-title">${j.name}</div>
          <div class="career-en">${j.en}</div>
          ${hollandTags ? `<div class="career-holland-row">${hollandTags}</div>` : ''}
        </div>
        <div class="career-section">
          <div class="career-label">📝 Mô tả nghề</div>
          <div class="career-body">${j.desc}</div>
        </div>
        <div class="career-section">
          <div class="career-label">🎯 Kỹ năng yêu cầu</div>
          <div class="career-body">
            <ul>${(j.skills || []).map(s => `<li>${s}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="career-section">
          <div class="career-label">🎓 Học vấn & Con đường học tập</div>
          <div class="career-body">${j.edu}</div>
        </div>
        <div class="career-info-grid">
          <div class="career-info-item">
            <div class="lbl">💰 Mức lương tham khảo</div>
            <div class="val career-salary">${j.salary}</div>
          </div>
          <div class="career-info-item">
            <div class="lbl">📈 Triển vọng nghề nghiệp</div>
            <div class="val">${j.outlook}</div>
          </div>
        </div>
      </div>
    `;
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
            <div class="career-list-item" data-name="${j.name}">
              <div class="career-list-name">${j.name}</div>
              <div class="career-list-meta">${j.en} · ${j.group}</div>
              <div class="career-list-holland">${hollandTags}</div>
            </div>
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
      bindListItemClicks();
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
      if (!window.BWAuth?.isSignedIn?.() && !confirm('Cần đăng nhập để đồng bộ nghề yêu thích giữa các thiết bị. Tiếp tục lưu local?')) {
        window.location.href = 'login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }
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
      ? (source === 'cloud' ? '❤️ Đã lưu vào cloud' : '❤️ Đã lưu (local)')
      : '💔 Đã bỏ lưu';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ─── TABS ───
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.career-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
      if (el.dataset.tab === tab) el.setAttribute('aria-selected', 'true');
      else el.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.career-panel').forEach(el => {
      el.classList.toggle('active', el.dataset.panel === tab);
    });
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
        renderListResult(getFiltered());
        return;
      }
      renderSuggestions(getFiltered());
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (input.value.trim()) {
          handle(input.value.trim());
          $('careerSuggestions').classList.remove('show');
        }
      } else if (e.key === 'Escape') {
        $('careerSuggestions').classList.remove('show');
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.career-search-box')) {
        $('careerSuggestions').classList.remove('show');
      }
    });
  }

  async function load() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('Failed to load');
      state.jobs = await res.json();
      const count = $('careerCount');
      if (count) count.textContent = `📚 Cơ sở dữ liệu: ${state.jobs.length} nghề nghiệp phổ biến tại Việt Nam`;
      renderHollandFilter();
      renderListResult(getFiltered());
      // Auto-fill search if query string present
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        const input = $('careerSearch');
        if (input) {
          input.value = q;
          handle(q);
        }
      }
    } catch (e) {
      const count = $('careerCount');
      if (count) count.textContent = '⚠️ Không tải được dữ liệu nghề. Vui lòng tải lại trang.';
      console.error(e);
    }
  }

  function init() {
    renderChips();
    bindEvents();
    load();
    document.querySelectorAll('.career-tab').forEach(el => {
      el.addEventListener('click', () => switchTab(el.dataset.tab));
    });
    window.CareersApp = { switchTab, handle };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
