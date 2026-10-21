/* ════════════════════════════════════════════════════════════════
   WAYBI — Linh vật + Chatbot của BrightWay Career
   - Mascot Waybi PNG dùng thống nhất trên toàn website
   - Nút chat nổi ở góc phải
   - Chat panel hỗ trợ theo ngữ cảnh trang
   - Lưu tên user vào localStorage
   - Auto-greet theo thời gian
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CHAT_ENDPOINT = '/api/chat';
  const MAX_HISTORY = 12;

  // ─── Contextual greeting theo trang ───
  function getContextGreeting() {
    const path = location.pathname.toLowerCase();
    if (path.includes('calendar')) return 'Bạn đang xem lịch tuyển sinh — cần mình giúp tìm mốc nào không?';
    if (path.includes('essay-review')) return 'Bạn đang tìm hướng dẫn chuẩn bị bài luận học bổng?';
    if (path.includes('score-calculator')) return 'Cần tính điểm xét tuyển hả? Mình hướng dẫn nè!';
    if (path.includes('careers')) return 'Bạn có thể tìm nghề, xem kỹ năng rồi chuyển sang tìm ngành và trường. Bạn muốn bắt đầu ở đâu?';
    if (path.includes('holland')) return 'Holland giúp bạn tìm hiểu sở thích nghề nghiệp. Kết quả là gợi ý để trải nghiệm thêm, không phải kết luận về năng lực.';
    if (path.includes('scholarship-roadmap')) return 'Bạn đang xem lộ trình apply nè — mốc nào cần mình giải thích thêm không?';
    if (path.includes('page2')) return 'Tìm ngành hoặc trường, lưu trường yêu thích và thêm chương trình từ hồ sơ trường vào nguyện vọng dự kiến. Mở Nguyện vọng của tôi để sắp xếp thứ tự.';
    if (path.includes('majors')) return 'Đang tìm ngành học phù hợp à?';
    if (path.includes('careers')) return 'Bạn muốn khám phá nghề nghiệp hả? Mình gợi ý nè!';
    if (path.includes('interview-prep')) return 'Chuẩn bị phỏng vấn học bổng à? Mình có tips nè!';
    if (path.includes('resources')) return 'Bạn đang tìm tài liệu tham khảo nè 📚';
    if (path.includes('profile')) return 'Bạn có thể xem trường yêu thích, sắp xếp nguyện vọng dự kiến và xuất danh sách ngay trên thiết bị này.';
    return null;
  }


  // ─── LocalStorage helpers ───
  const STORAGE_KEY = 'waybi_user';
  function getUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; }
  }
  function setUser(u) { window.BWFlow?.storage.set(STORAGE_KEY, JSON.stringify(u)); }

  // ─── Render ───
  const WAYBI_MASCOT = '<img src="assets/images/waybi/waybi-mascot-v2.png" alt="" aria-hidden="true">';

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
      #waybi-fab img { width: 100%; height: 100%; object-fit: contain; display: block; }
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
      #waybi-avatar img { width: 100%; height: 100%; object-fit: contain; display: block; }
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
        white-space: pre-wrap;
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
    <button id="waybi-fab" aria-label="Mở Trợ lý hướng nghiệp Waybi">
      ${WAYBI_MASCOT}
      <span id="waybi-badge" style="display:none">1</span>
      <span id="waybi-hint">Chào mình là Waybi! 👋</span>
    </button>

    <div id="waybi-panel" role="dialog" aria-label="Trợ lý hướng nghiệp Waybi">
      <div id="waybi-header">
        <div id="waybi-avatar">${WAYBI_MASCOT}</div>
        <div id="waybi-info">
          <div id="waybi-name">Trợ lý hướng nghiệp Waybi</div>
          <div id="waybi-status">BrightWay Career</div>
        </div>
        <button id="waybi-close" aria-label="Đóng">✕</button>
      </div>

      <div id="waybi-messages" role="log" aria-live="polite" aria-label="Tin nhắn Waybi"></div>

      <div id="waybi-suggest">
        <button class="waybi-chip" data-q="Học bổng nào phù hợp?">🎓 Học bổng</button>
        <button class="waybi-chip" data-q="Lộ trình apply">🗺️ Lộ trình</button>
        <button class="waybi-chip" data-q="Tính điểm học bạ">Tính điểm</button>
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
  let busy = false;
  const history = [];

  function addMessage(text, who, trustedHTML = false) {
    const msgs = document.getElementById('waybi-messages');
    const div = document.createElement('div');
    div.className = 'waybi-msg ' + who;
    if (trustedHTML) div.innerHTML = text;
    else div.textContent = text;
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

  async function send(text) {
    if (!text || !text.trim() || busy) return;
    busy = true;
    const sendBtn = document.getElementById('waybi-send');
    sendBtn.disabled = true;
    addMessage(text, 'user');
    history.push({ role: 'user', content: text });
    document.getElementById('waybi-input').value = '';
    showTyping();
    try {
      const response = await fetch(CHAT_ENDPOINT, {
        signal: AbortSignal.timeout(20000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-MAX_HISTORY),
          currentTab: location.pathname,
        }),
      });
      if (!response.ok) throw new Error('Chat unavailable');
      const data = await response.json();
      if (!data.reply || typeof data.reply !== 'string') throw new Error('Empty reply');
      hideTyping();
      addMessage(data.reply, 'bot');
      history.push({ role: 'assistant', content: data.reply });
    } catch (error) {
      hideTyping();
      history.pop();
      addMessage('Mình chưa kết nối được. Bạn thử gửi lại sau ít phút nhé.', 'bot');
      addMessage('<a href="page2.html?mode=major">Tra cứu ngành và trường</a> · <a href="score-calculator.html">Tính điểm gốc</a> · <a href="profile.html?tab=journey">Mở hồ sơ hướng nghiệp</a>', 'bot', true);
      console.error('[Waybi chat]', error);
    } finally {
      busy = false;
      sendBtn.disabled = false;
    }
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
    return `${timeOfDay}${name}! Mình là <b>Trợ lý hướng nghiệp Waybi</b> của BrightWay 👋✨${ctx ? '<br><br>' + ctx : ''}`;
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
        addMessage(getGreeting(), 'bot', true);
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
    // Trang chủ có chatbot Waybi kết nối backend riêng; không tạo thêm nút trùng lặp.
    if (document.getElementById('bwChatLauncher')) return;
    // inject styles
    document.head.insertAdjacentHTML('beforeend', styles);
    // inject HTML
    const wrap = document.createElement('div');
    wrap.innerHTML = buildHTML();
    document.body.appendChild(wrap);

    const contextQuestions = {
      'holland.html': ['Holland nói gì về sở thích và giới hạn của kết quả?', 'Tôi đã có mã Holland, nên làm gì tiếp?'],
      'careers-holland.html': ['Nghề nghiệp khác ngành đào tạo như thế nào?', 'Từ nghề yêu thích, tôi tìm ngành học ra sao?'],
      'page2.html': ['Tôi cần kiểm tra gì trong đề án tuyển sinh?', 'Làm sao tìm trường đào tạo ngành tôi thích?'],
      'score-calculator.html': ['Điểm gốc khác điểm xét tuyển như thế nào?', 'Chưa đủ công thức của trường thì làm gì?'],
      'profile.html': ['Tôi nên làm việc gì tiếp theo trong tuần này?', 'Dữ liệu hướng nghiệp được lưu ở đâu?']
    };
    const questions = contextQuestions[location.pathname.split('/').pop()];
    if (questions) document.getElementById('waybi-suggest').innerHTML = questions.map(question => `<button class="waybi-chip" data-q="${escapeHtml(question)}">${escapeHtml(question)}</button>`).join('');
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isOpen) { close(); document.getElementById('waybi-fab').focus(); }
    });

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
        addMessage(v, 'user');
        input.value = '';
        input.placeholder = 'Nhập câu hỏi...';
        input.dataset.mode = '';
        showTyping();
        setTimeout(() => {
          hideTyping();
          addMessage(`Rất vui được gặp bạn <b>${escapeHtml(name)}</b>! 🌟 Mình có thể giúp gì cho bạn?`, 'bot', true);
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
