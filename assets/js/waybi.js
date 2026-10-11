/* ════════════════════════════════════════════════════════════════
   WAYBI — Linh vật + Chatbot của BrightWay Scholars
   - SVG mascot (chú chim/máy tính nhỏ hình giọt nước, màu chủ đạo)
   - Nút chat nổi ở góc phải
   - Chat panel hỗ trợ theo ngữ cảnh trang
   - Lưu tên user vào localStorage
   - Auto-greet theo thời gian
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── Knowledge base — trả lời theo keyword ───
  const KB = [
    {
      keys: ['học bổng', 'hoc bong', 'scholarship', 'học bổng nào', 'loại học bổng'],
      reply: 'BrightWay có nhiều loại học bổng trong mục <b>"Tra cứu trường"</b> → filter theo "Có học bổng". Phổ biến: Chevening (Anh), Fulbright (Mỹ), MEXT (Nhật), DAAD (Đức), AAS (Úc). Bạn quan tâm nước nào để mình gợi ý cụ thể hơn nha!'
    },
    {
      keys: ['lộ trình', 'lo trinh', 'roadmap', 'chuẩn bị', 'bắt đầu', 'bắt đầu từ đâu'],
      reply: 'Bạn nên xem trang <b>📅 Lộ trình apply học bổng</b> nhé! Tóm tắt: <br>• <b>12-18 tháng trước</b>: xây GPA + hoạt động<br>• <b>6-12 tháng</b>: thi IELTS/SAT + chốt trường<br>• <b>3-6 tháng</b>: viết essay + xin thư giới thiệu<br>• <b>1-2 tháng</b>: nộp hồ sơ'
    },
    {
      keys: ['cv', 'resume', 'sơ yếu', 'sơ yếu lý lịch'],
      reply: 'BrightWay có công cụ <b>"Sửa CV với AI"</b> miễn phí — bạn upload CV, AI sẽ gợi ý chỉnh sửa theo chuẩn quốc tế. Truy cập: cv-review.html'
    },
    {
      keys: ['essay', 'bài luận', 'personal statement', 'motivation letter'],
      reply: 'Một số tip viết essay: <br>• Bắt đầu bằng <b>câu chuyện cụ thể</b>, không viết chung chung<br>• Tránh liệt kê thành tích khô khan<br>• Thể hiện <b>đam mê + mục tiêu rõ ràng</b><br>• Đọc to nhiều lần để kiểm tra flow<br><br>Công cụ <b>Sửa Essay AI</b> cũng có ở essay-review.html nhé!'
    },
    {
      keys: ['ielts', 'toefl', 'tiếng anh', 'ngoại ngữ', 'chứng chỉ'],
      reply: 'Hầu hết học bổng yêu cầu <b>IELTS 6.5+</b> hoặc TOEFL 80+. Một số chương trình cần SAT/GRE. Nên thi trước deadline 6-9 tháng để có điểm tốt nhất và kịp thi lại nếu cần.'
    },
    {
      keys: ['deadline', 'hạn nộp', 'khi nào nộp', 'thời hạn'],
      reply: 'Mỗi học bổng có deadline khác nhau. Xem trang <b>📅 Lịch</b> để thấy tất cả mốc thời gian trong năm 2026 nhé!'
    },
    {
      keys: ['holland', ['trắc nghiệm', 'tính cách', 'nghề nghiệp', 'nghề phù hợp', 'holland code'],
      reply: 'Trắc nghiệm Holland giúp bạn tìm nhóm ngành nghề phù hợp với tính cách (RIA, IAS, ESA…). Vào <b>holland.html</b> để làm bài test miễn phí nha!'
    },
    {
      keys: ['tính điểm', 'tinh diem', 'điểm xét tuyển', 'score'],
      reply: 'Có công cụ <b>🧮 Tính điểm xét tuyển</b> tại score-calculator.html — nhập điểm 3 môn, chọn tổ hợp, sẽ tính ngay cho bạn.'
    },
    {
      keys: ['đăng nhập', 'dang nhap', 'tài khoản', 'login', 'đăng ký'],
      reply: 'Bạn đăng nhập bằng <b>Google</b> 1 cú click, hoặc email + mật khẩu. Tài khoản giúp lưu CV, lưu trường yêu thích và xem lịch sử.'
    },
    {
      keys: ['chào', 'hi', 'hello', 'hey', 'xin chào', 'chao'],
      reply: 'Chào bạn! 👋 Mình là <b>Waybi</b> — trợ lý ảo của BrightWay. Mình có thể giúp gì cho bạn hôm nay?'
    },
    {
      keys: ['cảm ơn', 'cam on', 'thanks', 'thank you', 'tuyệt', 'hay'],
      reply: 'Không có gì đâu bạn! 😊 Chúc bạn apply thành công nhé. Nhớ quay lại nếu cần hỗ trợ thêm nha!'
    },
    {
      keys: ['giờ', 'mấy giờ', 'thời gian'],
      reply: () => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        return `Bây giờ là <b>${h}:${m}</b> 🌟. Bạn đang làm gì vậy, mình giúp được không?`;
      }
    },
    {
      keys: ['tên', 'ten', 'bạn là ai', 'bạn tên gì', 'who are you'],
      reply: 'Mình là <b>Waybi</b> — linh vật và trợ lý ảo của <b>BrightWay Scholars</b> ✨. Mình giúp bạn tra cứu học bổng, viết CV, lên lộ trình apply và trả lời mọi thắc mắc về du học.'
    },
    {
      keys: ['tạm biệt', 'bye', 'goodbye', 'bai'],
      reply: 'Tạm biệt bạn! 👋 Chúc bạn một ngày tốt lành. Mình luôn ở đây khi cần nha!'
    },
  ];

  // ─── Contextual greeting theo trang ───
  function getContextGreeting() {
    const path = location.pathname.toLowerCase();
    if (path.includes('calendar')) return 'Bạn đang xem lịch 2026 nè 📅 — cần mình giúp tìm mốc nào không?';
    if (path.includes('cv-review')) return 'Bạn muốn sửa CV à? Upload lên đi, mình sẽ gợi ý!';
    if (path.includes('essay-review')) return 'Essay đâu, đưa mình xem giúp nào ✍️';
    if (path.includes('score-calculator')) return 'Cần tính điểm xét tuyển hả? Mình hướng dẫn nè!';
    if (path.includes('holland')) return 'Holland test giúp bạn tìm nghề hợp tính cách đó! 🎯';
    if (path.includes('scholarship-roadmap')) return 'Bạn đang xem lộ trình apply nè — mốc nào cần mình giải thích thêm không?';
    if (path.includes('page2')) return 'Đang tra cứu trường hả? Có thể lọc theo học bổng, ngành, khu vực…';
    if (path.includes('majors')) return 'Đang tìm ngành học phù hợp à?';
    if (path.includes('careers')) return 'Bạn muốn khám phá nghề nghiệp hả? Mình gợi ý nè!';
    if (path.includes('interview-prep')) return 'Chuẩn bị phỏng vấn học bổng à? Mình có tips nè!';
    if (path.includes('resources')) return 'Bạn đang tìm tài liệu tham khảo nè 📚';
    if (path.includes('profile')) return 'Bạn đang xem hồ sơ cá nhân hả?';
    return null;
  }

  // ─── Auto-reply ───
  function getReply(text) {
    const t = text.toLowerCase().trim();
    for (const item of KB) {
      for (const k of item.keys) {
        if (t.includes(k.toLowerCase())) {
          return typeof item.reply === 'function' ? item.reply() : item.reply;
        }
      }
    }
    // fallback
    const fallbacks = [
      'Câu này mình chưa rõ lắm 😅 Bạn có thể hỏi về: học bổng, lộ trình, CV, essay, IELTS, deadline, Holland test, hoặc công cụ tính điểm nha!',
      'Mình chưa hiểu ý bạn 🤔 Bạn thử hỏi "học bổng nào phù hợp?" hoặc "viết CV thế nào?" xem sao.',
      'Hmm, mình chưa có thông tin này. Bạn có thể liên hệ admin qua email support@brightway.vn để được hỗ trợ chi tiết hơn nhé!',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // ─── LocalStorage helpers ───
  const STORAGE_KEY = 'waybi_user';
  function getUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; }
  }
  function setUser(u) { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }

  // ─── Render ───
  const WAIBI_SVG = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wb-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6b8eff"/>
          <stop offset="100%" stop-color="#a78bfa"/>
        </linearGradient>
      </defs>
      <!-- body -->
      <path d="M32 6 C 18 6, 8 18, 8 32 C 8 46, 18 56, 32 56 C 46 56, 56 46, 56 32 C 56 18, 46 6, 32 6 Z" fill="url(#wb-body)"/>
      <!-- shine -->
      <ellipse cx="22" cy="20" rx="6" ry="9" fill="white" opacity="0.25"/>
      <!-- face: eyes -->
      <circle cx="24" cy="30" r="3" fill="#fff"/>
      <circle cx="40" cy="30" r="3" fill="#fff"/>
      <circle cx="24" cy="31" r="1.5" fill="#1a1a3e"/>
      <circle cx="40" cy="31" r="1.5" fill="#1a1a3e"/>
      <circle cx="25" cy="30" r="0.6" fill="#fff"/>
      <circle cx="41" cy="30" r="0.6" fill="#fff"/>
      <!-- mouth -->
      <path d="M27 40 Q 32 44 37 40" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- cheeks -->
      <circle cx="18" cy="38" r="2.5" fill="#fda4af" opacity="0.6"/>
      <circle cx="46" cy="38" r="2.5" fill="#fda4af" opacity="0.6"/>
      <!-- graduation cap -->
      <rect x="20" y="14" width="24" height="3" fill="#1a1a3e"/>
      <rect x="22" y="12" width="20" height="3" fill="#1a1a3e" rx="1"/>
      <line x1="42" y1="13" x2="44" y2="20" stroke="#fcd34d" stroke-width="1.5"/>
      <circle cx="44" cy="21" r="1.8" fill="#fcd34d"/>
    </svg>
  `;

  const styles = `
    <style id="waybi-styles">
      #waybi-fab {
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        width: 60px; height: 60px; border-radius: 50%;
        background: #fff; border: none; cursor: pointer;
        box-shadow: 0 6px 24px rgba(99,102,241,0.35);
        display: flex; align-items: center; justify-content: center;
        transition: transform .25s, box-shadow .25s;
        padding: 0; overflow: visible;
      }
      #waybi-fab:hover { transform: scale(1.08) rotate(-5deg); box-shadow: 0 10px 32px rgba(99,102,241,0.45); }
      #waybi-fab svg { width: 100%; height: 100%; }
      #waybi-badge {
        position: absolute; top: -4px; right: -4px;
        background: #ef4444; color: #fff;
        width: 20px; height: 20px; border-radius: 50%;
        font-size: 11px; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid #fff;
        animation: waybi-pulse 1.5s ease-in-out infinite;
      }
      @keyframes waybi-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      /* tooltip nổi lên khi hover fab */
      #waybi-hint {
        position: absolute; right: 70px; top: 50%; transform: translateY(-50%);
        background: #1a1a3e; color: #fff; font-size: 13px; font-weight: 600;
        padding: 8px 14px; border-radius: 14px 14px 4px 14px;
        white-space: nowrap; opacity: 0; pointer-events: none;
        transition: opacity .25s, transform .25s;
        box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      }
      #waybi-fab:hover #waybi-hint { opacity: 1; transform: translateY(-50%) translateX(-4px); }

      #waybi-panel {
        position: fixed; bottom: 96px; right: 20px; z-index: 9998;
        width: 360px; max-width: calc(100vw - 32px);
        height: 520px; max-height: calc(100vh - 120px);
        background: #fff; border-radius: 20px;
        box-shadow: 0 20px 60px rgba(99,102,241,0.3);
        display: none; flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(99,102,241,0.15);
        animation: waybi-slide-up .3s ease-out;
      }
      #waybi-panel.open { display: flex; }
      @keyframes waybi-slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #waybi-header {
        background: linear-gradient(135deg, #6b8eff 0%, #8b6bff 100%);
        color: #fff; padding: 14px 16px;
        display: flex; align-items: center; gap: 12px;
        position: relative;
      }
      #waybi-avatar {
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(255,255,255,0.95);
        padding: 4px; flex-shrink: 0;
      }
      #waybi-avatar svg { width: 100%; height: 100%; }
      #waybi-info { flex: 1; min-width: 0; }
      #waybi-name { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 1rem; }
      #waybi-status {
        font-size: 11px; opacity: .9;
        display: flex; align-items: center; gap: 4px;
      }
      #waybi-status::before {
        content: ''; width: 7px; height: 7px; border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 0 2px rgba(52,211,153,0.3);
      }
      #waybi-close {
        background: rgba(255,255,255,0.2); border: none; color: #fff;
        width: 30px; height: 30px; border-radius: 50%;
        cursor: pointer; font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        transition: background .15s;
      }
      #waybi-close:hover { background: rgba(255,255,255,0.35); }

      #waybi-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        background: linear-gradient(180deg, #f8f9ff 0%, #fff 100%);
        display: flex; flex-direction: column; gap: 10px;
      }
      #waybi-messages::-webkit-scrollbar { width: 5px; }
      #waybi-messages::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 999px; }

      .waybi-msg {
        max-width: 80%; padding: 9px 13px; border-radius: 16px;
        font-size: 13.5px; line-height: 1.5;
        word-wrap: break-word; animation: waybi-fade-in .3s ease-out;
      }
      @keyframes waybi-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .waybi-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #6b8eff 0%, #8b6bff 100%);
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .waybi-msg.bot {
        align-self: flex-start;
        background: #fff;
        color: #1a1a3e;
        border: 1px solid rgba(99,102,241,0.12);
        border-bottom-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(99,102,241,0.06);
      }
      .waybi-msg.bot b { color: #6366f1; }

      .waybi-typing {
        align-self: flex-start;
        background: #fff; border: 1px solid rgba(99,102,241,0.12);
        padding: 10px 14px; border-radius: 16px;
        border-bottom-left-radius: 4px;
        display: flex; gap: 4px;
      }
      .waybi-typing span {
        width: 7px; height: 7px; border-radius: 50%;
        background: #a78bfa;
        animation: waybi-typing 1.2s ease-in-out infinite;
      }
      .waybi-typing span:nth-child(2) { animation-delay: .2s; }
      .waybi-typing span:nth-child(3) { animation-delay: .4s; }
      @keyframes waybi-typing {
        0%, 60%, 100% { transform: translateY(0); opacity: .4; }
        30% { transform: translateY(-5px); opacity: 1; }
      }

      #waybi-suggest {
        display: flex; gap: 6px; flex-wrap: wrap;
        padding: 0 16px 10px;
        background: linear-gradient(180deg, #f8f9ff 0%, #fff 100%);
      }
      .waybi-chip {
        background: #fff;
        border: 1.5px solid rgba(99,102,241,0.25);
        color: #6366f1; font-size: 12px; font-weight: 600;
        padding: 6px 12px; border-radius: 999px;
        cursor: pointer; transition: all .15s;
        font-family: inherit;
      }
      .waybi-chip:hover {
        background: linear-gradient(135deg, #6b8eff 0%, #8b6bff 100%);
        color: #fff; border-color: transparent;
        transform: translateY(-1px);
      }

      #waybi-input-wrap {
        padding: 12px;
        background: #fff;
        border-top: 1px solid rgba(99,102,241,0.1);
        display: flex; gap: 8px; align-items: center;
      }
      #waybi-input {
        flex: 1; border: 1.5px solid rgba(99,102,241,0.2);
        background: #f8f9ff;
        padding: 10px 14px; border-radius: 999px;
        font-size: 13.5px; font-family: inherit; color: #1a1a3e;
        outline: none; transition: border-color .15s;
      }
      #waybi-input:focus { border-color: #6366f1; }
      #waybi-send {
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg, #6b8eff 0%, #8b6bff 100%);
        color: #fff; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; transition: transform .15s;
      }
      #waybi-send:hover { transform: scale(1.1); }
      #waybi-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }

      @media (max-width: 480px) {
        #waybi-panel {
          bottom: 90px; right: 12px; left: 12px;
          width: auto; max-width: none;
        }
        #waybi-fab { bottom: 16px; right: 16px; }
      }
    </style>
  `;

  // ─── HTML structure ───
  function buildHTML() {
    return `
    <button id="waybi-fab" aria-label="Mở chat với Waybi">
      ${WAIBI_SVG}
      <span id="waybi-badge" style="display:none">1</span>
      <span id="waybi-hint">Chào mình là Waybi! 👋</span>
    </button>

    <div id="waybi-panel" role="dialog" aria-label="Chat với Waybi">
      <div id="waybi-header">
        <div id="waybi-avatar">${WAIBI_SVG}</div>
        <div id="waybi-info">
          <div id="waybi-name">Waybi ✨</div>
          <div id="waybi-status">Đang hoạt động</div>
        </div>
        <button id="waybi-close" aria-label="Đóng">✕</button>
      </div>

      <div id="waybi-messages"></div>

      <div id="waybi-suggest">
        <button class="waybi-chip" data-q="Học bổng nào phù hợp?">🎓 Học bổng</button>
        <button class="waybi-chip" data-q="Lộ trình apply">🗺️ Lộ trình</button>
        <button class="waybi-chip" data-q="Sửa CV">✍️ Sửa CV</button>
        <button class="waybi-chip" data-q="Holland test">🎯 Holland</button>
        <button class="waybi-chip" data-q="Bạn là ai?">❓ Bạn là ai?</button>
      </div>

      <div id="waybi-input-wrap">
        <input id="waybi-input" type="text" placeholder="Nhập câu hỏi..." autocomplete="off"/>
        <button id="waybi-send" aria-label="Gửi">➤</button>
      </div>
    </div>
    `;
  }

  // ─── Chat logic ───
  let isOpen = false;
  let greeted = false;

  function addMessage(text, who) {
    const msgs = document.getElementById('waybi-messages');
    const div = document.createElement('div');
    div.className = 'waybi-msg ' + who;
    div.innerHTML = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('waybi-messages');
    const t = document.createElement('div');
    t.className = 'waybi-typing';
    t.id = 'waybi-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById('waybi-typing');
    if (t) t.remove();
  }

  function send(text) {
    if (!text || !text.trim()) return;
    addMessage(escapeHtml(text), 'user');
    document.getElementById('waybi-input').value = '';
    showTyping();
    const delay = 500 + Math.random() * 600;
    setTimeout(() => {
      hideTyping();
      const reply = getReply(text);
      addMessage(reply, 'bot');
    }, delay);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function getGreeting() {
    const u = getUser();
    const hour = new Date().getHours();
    let timeOfDay = 'Chào bạn';
    if (hour < 11) timeOfDay = 'Chào buổi sáng';
    else if (hour < 14) timeOfDay = 'Chào buổi trưa';
    else if (hour < 18) timeOfDay = 'Chào buổi chiều';
    else timeOfDay = 'Chào buổi tối';

    const name = u && u.name ? ` <b>${escapeHtml(u.name)}</b>` : '';
    const ctx = getContextGreeting();
    return `${timeOfDay}${name}! Mình là <b>Waybi</b> — trợ lý ảo của BrightWay 👋✨${ctx ? '<br><br>' + ctx : ''}`;
  }

  function askName() {
    addMessage('Mình chưa biết tên bạn đó! Bạn tên gì để mình gọi cho thân thiện hơn nha?', 'bot');
    const input = document.getElementById('waybi-input');
    input.placeholder = 'Nhập tên của bạn...';
    input.dataset.mode = 'askname';
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    document.getElementById('waybi-panel').classList.add('open');
    document.getElementById('waybi-badge').style.display = 'none';
    document.getElementById('waybi-hint').style.display = 'none';
    if (!greeted) {
      greeted = true;
      setTimeout(() => {
        addMessage(getGreeting(), 'bot');
        const u = getUser();
        if (!u || !u.name) {
          setTimeout(askName, 800);
        }
      }, 200);
    }
    setTimeout(() => document.getElementById('waybi-input').focus(), 300);
  }

  function close() {
    isOpen = false;
    document.getElementById('waybi-panel').classList.remove('open');
  }

  function toggle() { isOpen ? close() : open(); }

  function init() {
    // inject styles
    document.head.insertAdjacentHTML('beforeend', styles);
    // inject HTML
    const wrap = document.createElement('div');
    wrap.innerHTML = buildHTML();
    document.body.appendChild(wrap);

    // bind events
    document.getElementById('waybi-fab').addEventListener('click', toggle);
    document.getElementById('waybi-close').addEventListener('click', close);

    const input = document.getElementById('waybi-input');
    const sendBtn = document.getElementById('waybi-send');
    const handleSend = () => {
      const v = input.value.trim();
      if (!v) return;
      if (input.dataset.mode === 'askname') {
        const name = v.split(/\s+/)[0].slice(0, 20);
        setUser({ name, ts: Date.now() });
        addMessage(escapeHtml(v), 'user');
        input.value = '';
        input.placeholder = 'Nhập câu hỏi...';
        input.dataset.mode = '';
        showTyping();
        setTimeout(() => {
          hideTyping();
          addMessage(`Rất vui được gặp bạn <b>${escapeHtml(name)}</b>! 🌟 Mình có thể giúp gì cho bạn?`, 'bot');
        }, 600);
        return;
      }
      send(v);
    };
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
    });

    // chips
    document.querySelectorAll('.waybi-chip').forEach(c => {
      c.addEventListener('click', () => send(c.dataset.q));
    });

    // show badge hint
    setTimeout(() => {
      if (!isOpen) {
        const b = document.getElementById('waybi-badge');
        if (b) b.style.display = 'flex';
      }
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
