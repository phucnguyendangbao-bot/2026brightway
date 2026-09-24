/* ════════════════════════════════════════════════════════
   HOLLAND RIASEC — Test tính cách nghề nghiệp
   Tối ưu: 5 câu/trang, timer 7 phút, jump nhanh, debounce save
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── 6 nhóm Holland ───
  const TYPES = {
    R: { name: 'Thực tế (Realistic)', emoji: '🔧', color: '#f59e0b',
      desc: 'Bạn thích làm việc với tay, máy móc, dụng cụ và vật thể cụ thể. Bạn thực tế, kiên trì và có tư duy kỹ thuật.',
      majors: ['Kỹ thuật cơ khí', 'Điện – Điện tử', 'Xây dựng', 'Nông nghiệp', 'Kiến trúc', 'Lâm nghiệp', 'Hàng không'] },
    I: { name: 'Nghiên cứu (Investigative)', emoji: '🔬', color: '#6366f1',
      desc: 'Bạn thích phân tích, khám phá và giải quyết vấn đề phức tạp. Bạn tò mò, logic và độc lập trong tư duy.',
      majors: ['Khoa học máy tính', 'Toán học', 'Vật lý', 'Hóa học', 'Y khoa', 'Sinh học', 'Dược học', 'Công nghệ AI'] },
    A: { name: 'Nghệ thuật (Artistic)', emoji: '🎨', color: '#ec4899',
      desc: 'Bạn sáng tạo, biểu đạt phong phú và thích tự do. Bạn giỏi nghệ thuật, âm nhạc, viết lách hoặc thiết kế.',
      majors: ['Thiết kế đồ họa', 'Kiến trúc nội thất', 'Âm nhạc', 'Điện ảnh', 'Truyền thông sáng tạo', 'Mỹ thuật', 'Viết sáng tác'] },
    S: { name: 'Xã hội (Social)', emoji: '🤝', color: '#10b981',
      desc: 'Bạn yêu thích giao tiếp, giúp đỡ và làm việc với mọi người. Bạn đồng cảm, kiên nhẫn và có khả năng lãnh đạo nhóm.',
      majors: ['Sư phạm', 'Tâm lý học', 'Công tác xã hội', 'Y tế cộng đồng', 'Nhân sự (HR)', 'Ngoại giao', 'Xã hội học'] },
    E: { name: 'Lãnh đạo (Enterprising)', emoji: '🚀', color: '#f97316',
      desc: 'Bạn có tư duy kinh doanh, thuyết phục và muốn dẫn dắt. Bạn tự tin, năng động và thích cạnh tranh.',
      majors: ['Quản trị kinh doanh', 'Marketing', 'Luật', 'Tài chính – Ngân hàng', 'Kinh tế', 'Khởi nghiệp', 'Quan hệ công chúng'] },
    C: { name: 'Quy củ (Conventional)', emoji: '📊', color: '#3b82f6',
      desc: 'Bạn thích trật tự, chi tiết và làm việc với dữ liệu, con số. Bạn đáng tin cậy, cẩn thận và làm theo quy trình.',
      majors: ['Kế toán – Kiểm toán', 'Hệ thống thông tin', 'Thống kê', 'Tài chính', 'Hành chính văn phòng', 'Logistics', 'Ngân hàng'] }
  };

  // ─── 42 câu hỏi ───
  const QUESTIONS = [
    { t:'R', q:'Tôi thích sửa chữa hoặc lắp ráp đồ vật bằng tay.' },
    { t:'R', q:'Tôi thích làm việc ngoài trời hơn là trong văn phòng.' },
    { t:'R', q:'Tôi thích sử dụng các công cụ, máy móc trong công việc.' },
    { t:'R', q:'Tôi giỏi các môn kỹ thuật hoặc thủ công.' },
    { t:'R', q:'Tôi thích tạo ra sản phẩm vật chất hơn là ý tưởng trừu tượng.' },
    { t:'R', q:'Tôi thích các bài tập thể chất và hoạt động ngoài trời.' },
    { t:'R', q:'Tôi có khả năng định hướng không gian và đọc bản vẽ kỹ thuật.' },
    { t:'I', q:'Tôi thích giải những bài toán khó và câu đố logic.' },
    { t:'I', q:'Tôi tò mò về cách mọi thứ hoạt động trong khoa học.' },
    { t:'I', q:'Tôi thích đọc sách khoa học, nghiên cứu hơn là đọc tiểu thuyết.' },
    { t:'I', q:'Tôi thích phân tích dữ liệu để tìm ra quy luật.' },
    { t:'I', q:'Tôi thích làm thí nghiệm và kiểm chứng giả thuyết.' },
    { t:'I', q:'Tôi thường đặt câu hỏi "Tại sao?" và tìm hiểu sâu vấn đề.' },
    { t:'I', q:'Tôi thích làm việc một mình với sách và tài liệu nghiên cứu.' },
    { t:'A', q:'Tôi thích vẽ, chụp ảnh hoặc tạo ra các tác phẩm nghệ thuật.' },
    { t:'A', q:'Tôi có khả năng âm nhạc hoặc biểu diễn nghệ thuật.' },
    { t:'A', q:'Tôi thích viết sáng tác, thơ, truyện hoặc kịch bản.' },
    { t:'A', q:'Tôi thích làm việc trong môi trường tự do, không có quy tắc cứng nhắc.' },
    { t:'A', q:'Tôi thường nghĩ ra những ý tưởng độc đáo, khác biệt.' },
    { t:'A', q:'Tôi thích thiết kế, trang trí không gian hoặc tạo ra thứ mang tính thẩm mỹ.' },
    { t:'A', q:'Tôi biểu đạt cảm xúc qua nghệ thuật hoặc sáng tạo.' },
    { t:'S', q:'Tôi thích giảng dạy hoặc hướng dẫn người khác học điều gì đó.' },
    { t:'S', q:'Tôi thường là người lắng nghe và an ủi bạn bè khi họ gặp khó khăn.' },
    { t:'S', q:'Tôi thích làm việc nhóm và cảm thấy năng lượng khi giao tiếp.' },
    { t:'S', q:'Tôi muốn cống hiến để giúp đỡ cộng đồng hoặc xã hội.' },
    { t:'S', q:'Tôi dễ dàng hiểu cảm xúc và quan điểm của người khác.' },
    { t:'S', q:'Tôi thích tổ chức các hoạt động tập thể, sự kiện nhóm.' },
    { t:'S', q:'Tôi giỏi giải quyết mâu thuẫn và kết nối mọi người.' },
    { t:'E', q:'Tôi thích dẫn dắt và ra quyết định cho nhóm.' },
    { t:'E', q:'Tôi tự tin thuyết trình và bảo vệ ý kiến trước đám đông.' },
    { t:'E', q:'Tôi thích cạnh tranh và luôn muốn đứng đầu.' },
    { t:'E', q:'Tôi có khả năng thuyết phục người khác đồng ý với mình.' },
    { t:'E', q:'Tôi hay nảy ra ý tưởng kinh doanh và muốn thực hiện chúng.' },
    { t:'E', q:'Tôi thích đàm phán, mặc cả hoặc bán hàng.' },
    { t:'E', q:'Tôi tự tin đối mặt với rủi ro khi có cơ hội lớn.' },
    { t:'C', q:'Tôi thích làm việc theo danh sách và kế hoạch rõ ràng.' },
    { t:'C', q:'Tôi chú ý đến từng chi tiết nhỏ và không thích sai sót.' },
    { t:'C', q:'Tôi giỏi quản lý hồ sơ, tài liệu và số liệu.' },
    { t:'C', q:'Tôi thích làm việc trong môi trường có quy trình ổn định.' },
    { t:'C', q:'Tôi thích toán, kế toán hoặc phân tích số liệu.' },
    { t:'C', q:'Tôi thích tuân thủ quy tắc và hướng dẫn được đặt ra.' },
    { t:'C', q:'Tôi cảm thấy thoải mái với công việc lặp lại nhưng chính xác.' }
  ];

  // ─── Constants ───
  const STORAGE_KEY = 'studentHollandV1';
  const TIMER_KEY = 'studentHollandTimer';
  const PER_PAGE = 5;          // 5 câu/trang → gọn, vẫn thấy tiến độ
  const TIMER_SECONDS = 7 * 60; // 7 phút

  // ─── State ───
  const state = {
    page: 0,
    answers: {},
    timerSec: TIMER_SECONDS,
    timerInterval: null,
    saveTimer: null,
    startTime: Date.now()
  };

  // ─── Helpers ───
  const $ = id => document.getElementById(id);

  function getAnsweredCount() {
    return Object.keys(state.answers).length;
  }

  function getPageStart() {
    return state.page * PER_PAGE;
  }

  function getPageEnd() {
    return Math.min(getPageStart() + PER_PAGE, QUESTIONS.length);
  }

  function formatTimer(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ─── localStorage (debounced) ───
  function saveToStorage() {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      try {
        const arr = QUESTIONS.map((_, i) => state.answers[i] ?? null);
        const answered = arr.filter(v => v !== null).length;
        const rawScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        QUESTIONS.forEach((q, i) => {
          if (arr[i] !== null) { rawScores[q.t] += arr[i]; counts[q.t] += 1; }
        });
        const norm = {};
        Object.keys(rawScores).forEach(t => {
          const max = (counts[t] || 1) * 5;
          norm[t] = max ? Math.round(rawScores[t] / max * 100) : 0;
        });
        const ranked = Object.keys(norm).sort((a, b) => norm[b] - norm[a]);
        const code = answered >= 18 ? ranked.slice(0, 3).join('') : '';
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          answers: arr,
          scores: norm,
          code,
          answered,
          savedAt: Date.now(),
          source: 'holland'
        }));
        localStorage.setItem(TIMER_KEY, JSON.stringify({
          remaining: state.timerSec,
          updatedAt: Date.now()
        }));
      } catch (e) { /* ignore */ }
    }, 200);
  }

  function loadFromStorage() {
    try {
      // Load answers
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.answers) && data.answers.length === QUESTIONS.length) {
          data.answers.forEach((v, i) => { if (v !== null) state.answers[i] = v; });
        }
      }
      // Load timer (resume nếu còn thời gian)
      const tRaw = localStorage.getItem(TIMER_KEY);
      if (tRaw) {
        const t = JSON.parse(tRaw);
        if (t && typeof t.remaining === 'number' && t.remaining > 0 && t.remaining <= TIMER_SECONDS + 5) {
          state.timerSec = t.remaining;
        }
      }
    } catch (e) { /* ignore */ }
  }

  // ─── Render ───
  function renderTypesIntro() {
    const grid = $('typesGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(TYPES).map(([k, t]) => `
      <div class="type-card" style="border-top: 4px solid ${t.color};">
        <span class="emoji">${t.emoji}</span>
        <div class="code">${k}</div>
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
      </div>
    `).join('');
  }

  function renderJumpBar() {
    const totalPages = Math.ceil(QUESTIONS.length / PER_PAGE);
    const bar = $('jumpBar');
    if (!bar) return;
    bar.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const start = i * PER_PAGE;
      const end = Math.min(start + PER_PAGE, QUESTIONS.length);
      const allAnswered = Array.from({ length: end - start }, (_, j) => state.answers[start + j] !== undefined).every(Boolean);
      const cls = allAnswered ? 'jump-btn done' : 'jump-btn';
      const isCurrent = i === state.page ? ' current' : '';
      return `<button class="${cls}${isCurrent}" onclick="HollandApp.goToPage(${i})">${start + 1}–${end}</button>`;
    }).join('');
  }

  function renderPage() {
    const start = getPageStart();
    const end = getPageEnd();
    const wrap = $('qList');
    if (!wrap) return;

    wrap.innerHTML = '';
    for (let i = start; i < end; i++) {
      const q = QUESTIONS[i];
      const val = state.answers[i];
      const card = document.createElement('div');
      card.className = 'q-card';
      card.innerHTML = `
        <div class="q-num">CÂU ${i + 1} <span class="q-type-badge" style="background:${TYPES[q.t].color}22;border-color:${TYPES[q.t].color};color:${TYPES[q.t].color}">${TYPES[q.t].emoji} ${TYPES[q.t].name.split(' ')[0]}</span></div>
        <div class="q-text">${q.q}</div>
        <div class="q-scale">
          <span class="q-scale-lbl">Không đúng</span>
          <div class="q-scale-btns">
            ${[1, 2, 3, 4, 5].map(n => `<button class="q-btn${val === n ? ' selected' : ''}" data-idx="${i}" data-val="${n}" aria-label="Chọn ${n}">${n}</button>`).join('')}
          </div>
          <span class="q-scale-lbl right">Rất đúng</span>
        </div>
      `;
      wrap.appendChild(card);
    }

    // Gắn event cho tất cả nút 1-5
    wrap.querySelectorAll('.q-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(btn.dataset.idx);
        const val = parseInt(btn.dataset.val);
        hollandAnswer(idx, val);
      });
    });

    updateProgress();
    renderJumpBar();

    // Auto-focus & scroll
    const firstUnanswered = Array.from({ length: end - start }, (_, j) => start + j).find(i => state.answers[i] === undefined);
    if (firstUnanswered !== undefined && window.innerWidth > 720) {
      const btn = wrap.querySelector(`.q-btn[data-idx="${firstUnanswered}"][data-val="3"]`);
      btn && setTimeout(() => btn.focus({ preventScroll: true }), 100);
    }
    $('quizSection') && $('quizSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateProgress() {
    const answered = getAnsweredCount();
    const pct = Math.round(answered / QUESTIONS.length * 100);
    const fill = $('qProgressFill');
    const pctEl = $('qProgressPct');
    const txt = $('qProgressText');
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (txt) txt.textContent = `${answered}/${QUESTIONS.length} câu`;
    // Nav
    const lastPage = Math.ceil(QUESTIONS.length / PER_PAGE) - 1;
    $('btnPrev').disabled = state.page === 0;
    $('btnNext').style.display = state.page < lastPage ? '' : 'none';
    $('btnFinish').style.display = state.page === lastPage ? '' : 'none';
  }

  // ─── Timer ───
  function startTimer() {
    if (state.timerInterval) return;
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.timerSec--;
      updateTimerDisplay();
      if (state.timerSec <= 0) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        hollandSubmit(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = $('qTimer');
    if (!el) return;
    el.textContent = formatTimer(state.timerSec);
    el.classList.toggle('warning', state.timerSec <= 60);
    el.classList.toggle('danger', state.timerSec <= 20);
  }

  // ─── Actions ───
  function hollandAnswer(idx, val) {
    state.answers[idx] = val;
    // Update visual trong DOM (chỉ nút của câu idx)
    document.querySelectorAll(`.q-btn[data-idx="${idx}"]`).forEach(b => {
      b.classList.toggle('selected', parseInt(b.dataset.val) === val);
    });
    updateProgress();
    saveToStorage();

    // Auto-next nếu đã trả lời hết câu cuối trang
    const end = getPageEnd();
    const allDone = Array.from({ length: end - getPageStart() }, (_, j) => state.answers[getPageStart() + j] !== undefined).every(Boolean);
    if (allDone) {
      const lastPage = Math.ceil(QUESTIONS.length / PER_PAGE) - 1;
      if (state.page < lastPage) {
        setTimeout(() => hollandNav(1), 250);
      }
    }
  }

  function hollandNav(dir) {
    const lastPage = Math.ceil(QUESTIONS.length / PER_PAGE) - 1;
    state.page = Math.max(0, Math.min(lastPage, state.page + dir));
    renderPage();
  }

  function goToPage(p) {
    state.page = p;
    renderPage();
  }

  function hollandSubmit(autoFromTimer = false) {
    const unanswered = QUESTIONS.map((q, i) => state.answers[i] === undefined ? i + 1 : null).filter(Boolean);
    if (unanswered.length > 0 && !autoFromTimer) {
      if (!confirm(`Bạn còn ${unanswered.length} câu chưa trả lời. Vẫn xem kết quả?`)) return;
    }
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }

    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUESTIONS.forEach((q, i) => { scores[q.t] += (state.answers[i] || 0); });
    const maxScore = QUESTIONS.filter(q => q.t === Object.keys(scores)[0]).length * 5; // dynamic
    // Use real max per type
    const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUESTIONS.forEach(q => counts[q.t]++);
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topType] = sorted[0];
    const info = TYPES[topType];
    const top3 = sorted.slice(0, 3).map(([k]) => k);

    $('rEmoji').textContent = info.emoji;
    $('rType').textContent = info.name;
    $('rCode').textContent = top3.join(' – ');
    $('rDesc').textContent = info.desc;

    const barColors = { R: '#f59e0b', I: '#6366f1', A: '#ec4899', S: '#10b981', E: '#f97316', C: '#3b82f6' };
    $('rBars').innerHTML = sorted.map(([k, v]) => {
      const max = counts[k] * 5;
      return `
        <div class="bar-row">
          <div class="bar-lbl">${TYPES[k].emoji} ${TYPES[k].name.split(' ')[0]}</div>
          <div class="bar-track"><div class="bar-fill" style="background:${barColors[k]}" data-pct="${Math.round(v / max * 100)}"></div></div>
          <div class="bar-val">${v}/${max}</div>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      document.querySelectorAll('.bar-fill').forEach(el => {
        el.style.width = el.dataset.pct + '%';
      });
    }, 100);

    const top2 = sorted.slice(0, 2).map(([k]) => k);
    const allMajors = [...new Set([...TYPES[top2[0]].majors, ...TYPES[top2[1]].majors])];
    $('rMajors').innerHTML = `
      <h3>📚 Ngành học phù hợp với bạn</h3>
      <div class="majors-tags">${allMajors.map(m => `<span class="majors-tag">${m}</span>`).join('')}</div>
    `;

    $('quizCard').style.display = 'none';
    $('jumpBarWrap').style.display = 'none';
    $('resultCard').classList.add('show');

    setTimeout(() => {
      $('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    saveToStorage();
    if (autoFromTimer) {
      // Tạo toast thông báo
      const t = document.createElement('div');
      t.className = 'bw-toast';
      t.textContent = '⏰ Hết giờ! Hệ thống tự động nộp bài.';
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('show'), 50);
      setTimeout(() => t.remove(), 3000);
    }
  }

  function hollandReset() {
    Object.keys(state.answers).forEach(k => delete state.answers[k]);
    state.page = 0;
    state.timerSec = TIMER_SECONDS;
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(TIMER_KEY); } catch (e) {}
    if (!state.timerInterval) startTimer();
    $('quizCard').style.display = '';
    $('jumpBarWrap').style.display = '';
    $('resultCard').classList.remove('show');
    renderPage();
  }

  // ─── Expose to window ───
  window.HollandApp = {
    goToPage,
    hollandAnswer,
    hollandNav,
    hollandSubmit: () => hollandSubmit(false),
    hollandReset
  };

  // ─── Init ───
  function init() {
    loadFromStorage();
    renderTypesIntro();
    renderPage();
    startTimer();
  }

  // ─── Keyboard shortcuts ───
  document.addEventListener('keydown', (e) => {
    if ($('resultCard').classList.contains('show')) return;
    if (e.key >= '1' && e.key <= '5') {
      const idx = getPageStart() + 0; // apply cho câu đầu trang hiện tại
      // Tìm câu chưa trả lời đầu tiên trong trang
      const end = getPageEnd();
      for (let i = getPageStart(); i < end; i++) {
        if (state.answers[i] === undefined) {
          window.HollandApp.hollandAnswer(i, parseInt(e.key));
          break;
        }
      }
    } else if (e.key === 'ArrowRight') {
      window.HollandApp.hollandNav(1);
    } else if (e.key === 'ArrowLeft') {
      window.HollandApp.hollandNav(-1);
    } else if (e.key === 'Enter' && state.page === Math.ceil(QUESTIONS.length / PER_PAGE) - 1) {
      window.HollandApp.hollandSubmit();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
