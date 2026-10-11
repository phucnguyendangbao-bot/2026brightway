/* ════════════════════════════════════════════════════════════════
   WAYBI PRESENCE — Mascot xuất hiện ở nhiều vị trí
   - 1. Floating mini Waybi trang trí (góc khác)
   - 2. Welcome banner đầu trang (tự chèn sau nav)
   - 3. About section mascot
   - 4. Empty state mascot
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SVG = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wb-body-${Date.now()}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6b8eff"/>
          <stop offset="100%" stop-color="#a78bfa"/>
        </linearGradient>
      </defs>
      <path d="M32 6 C 18 6, 8 18, 8 32 C 8 46, 18 56, 32 56 C 46 56, 56 46, 56 32 C 56 18, 46 6, 32 6 Z" fill="url(#wb-body-${Date.now()})"/>
      <ellipse cx="22" cy="20" rx="6" ry="9" fill="white" opacity="0.25"/>
      <circle cx="24" cy="30" r="3" fill="#fff"/>
      <circle cx="40" cy="30" r="3" fill="#fff"/>
      <circle cx="24" cy="31" r="1.5" fill="#1a1a3e"/>
      <circle cx="40" cy="31" r="1.5" fill="#1a1a3e"/>
      <circle cx="25" cy="30" r="0.6" fill="#fff"/>
      <circle cx="41" cy="30" r="0.6" fill="#fff"/>
      <path d="M27 40 Q 32 44 37 40" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="18" cy="38" r="2.5" fill="#fda4af" opacity="0.6"/>
      <circle cx="46" cy="38" r="2.5" fill="#fda4af" opacity="0.6"/>
      <rect x="20" y="14" width="24" height="3" fill="#1a1a3e"/>
      <rect x="22" y="12" width="20" height="3" fill="#1a1a3e" rx="1"/>
      <line x1="42" y1="13" x2="44" y2="20" stroke="#fcd34d" stroke-width="1.5"/>
      <circle cx="44" cy="21" r="1.8" fill="#fcd34d"/>
    </svg>
  `;

  // SVG cache - một id duy nhất cho mỗi lần render để tránh conflict
  function makeSVG(gradId) {
    return `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6b8eff"/>
          <stop offset="100%" stop-color="#a78bfa"/>
        </linearGradient>
      </defs>
      <path d="M32 6 C 18 6, 8 18, 8 32 C 8 46, 18 56, 32 56 C 46 56, 56 46, 56 32 C 56 18, 46 6, 32 6 Z" fill="url(#${gradId})"/>
      <ellipse cx="22" cy="20" rx="6" ry="9" fill="white" opacity="0.25"/>
      <circle cx="24" cy="30" r="3" fill="#fff"/>
      <circle cx="40" cy="30" r="3" fill="#fff"/>
      <circle cx="24" cy="31" r="1.5" fill="#1a1a3e"/>
      <circle cx="40" cy="31" r="1.5" fill="#1a1a3e"/>
      <circle cx="25" cy="30" r="0.6" fill="#fff"/>
      <circle cx="41" cy="30" r="0.6" fill="#fff"/>
      <path d="M27 40 Q 32 44 37 40" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="18" cy="38" r="2.5" fill="#fda4af" opacity="0.6"/>
      <circle cx="46" cy="38" r="2.5" fill="#fda4af" opacity="0.6"/>
      <rect x="20" y="14" width="24" height="3" fill="#1a1a3e"/>
      <rect x="22" y="12" width="20" height="3" fill="#1a1a3e" rx="1"/>
      <line x1="42" y1="13" x2="44" y2="20" stroke="#fcd34d" stroke-width="1.5"/>
      <circle cx="44" cy="21" r="1.8" fill="#fcd34d"/>
    </svg>`;
  }

  const styles = `
    <style id="waybi-presence-styles">
      /* ═══ 1. FLOATING LEFT WAYBI (góc trái dưới) ═══ */
      #waybi-left {
        position: fixed; bottom: 20px; left: 20px; z-index: 9990;
        width: 48px; height: 48px;
        background: #fff; border-radius: 50%;
        box-shadow: 0 4px 16px rgba(99,102,241,0.25);
        display: flex; align-items: center; justify-content: center;
        padding: 4px;
        animation: waybi-float 3s ease-in-out infinite;
        cursor: pointer;
        transition: transform .25s;
      }
      #waybi-left:hover { transform: scale(1.1) rotate(8deg); }
      #waybi-left svg { width: 100%; height: 100%; }
      @keyframes waybi-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      #waybi-left:hover { animation: none; }

      /* ═══ 2. WELCOME BANNER đầu trang ═══ */
      #waybi-banner {
        max-width: 1100px; margin: 18px auto 0; padding: 0 24px;
        position: relative; z-index: 1;
      }
      .waybi-banner-card {
        background: linear-gradient(135deg, #6b8eff 0%, #8b6bff 50%, #a78bfa 100%);
        border-radius: 18px;
        padding: 18px 22px;
        display: flex; align-items: center; gap: 18px;
        color: #fff;
        box-shadow: 0 8px 28px rgba(99,102,241,0.28);
        position: relative;
        overflow: hidden;
      }
      .waybi-banner-card::before {
        content: ''; position: absolute; top: -50%; right: -10%;
        width: 250px; height: 250px;
        background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%);
        border-radius: 50%;
        pointer-events: none;
      }
      .waybi-banner-card::after {
        content: ''; position: absolute; bottom: -40%; left: 30%;
        width: 180px; height: 180px;
        background: radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%);
        border-radius: 50%;
        pointer-events: none;
      }
      .waybi-banner-mascot {
        width: 72px; height: 72px; flex-shrink: 0;
        background: rgba(255,255,255,0.95);
        border-radius: 50%;
        padding: 6px;
        animation: waybi-bob 2.5s ease-in-out infinite;
        z-index: 1;
        box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      }
      .waybi-banner-mascot svg { width: 100%; height: 100%; }
      @keyframes waybi-bob {
        0%, 100% { transform: translateY(0) rotate(-3deg); }
        50% { transform: translateY(-4px) rotate(3deg); }
      }
      .waybi-banner-text { flex: 1; min-width: 0; z-index: 1; }
      .waybi-banner-text h3 {
        font-family: 'Nunito', sans-serif; font-weight: 900;
        font-size: 1.05rem; margin: 0 0 4px;
        text-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
      .waybi-banner-text p {
        font-size: 0.82rem; opacity: 0.95; margin: 0; line-height: 1.5;
      }
      .waybi-banner-cta {
        background: #fff; color: #6366f1;
        font-weight: 800; font-size: 0.78rem;
        padding: 8px 16px; border-radius: 999px;
        text-decoration: none; white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform .2s, box-shadow .2s;
        z-index: 1;
        border: none; cursor: pointer;
        font-family: inherit;
      }
      .waybi-banner-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
      .waybi-banner-close {
        position: absolute; top: 8px; right: 10px;
        background: rgba(255,255,255,0.2); border: none; color: #fff;
        width: 24px; height: 24px; border-radius: 50%;
        cursor: pointer; font-size: 12px;
        display: flex; align-items: center; justify-content: center;
        z-index: 2;
        transition: background .15s;
      }
      .waybi-banner-close:hover { background: rgba(255,255,255,0.4); }
      @media(max-width: 600px) {
        .waybi-banner-card { padding: 14px 16px; gap: 12px; }
        .waybi-banner-mascot { width: 56px; height: 56px; }
        .waybi-banner-text h3 { font-size: 0.92rem; }
        .waybi-banner-text p { font-size: 0.74rem; }
        .waybi-banner-cta { font-size: 0.72rem; padding: 6px 12px; }
      }

      /* ═══ 3. WAYBI TAG inline (dùng trong heading) ═══ */
      .waybi-tag {
        display: inline-flex; align-items: center; gap: 6px;
        background: linear-gradient(135deg, rgba(107,142,255,0.12), rgba(167,139,250,0.12));
        border: 1.5px solid rgba(99,102,241,0.25);
        color: var(--accent);
        font-family: 'Nunito', sans-serif;
        font-weight: 800; font-size: 0.72rem;
        padding: 4px 12px 4px 6px;
        border-radius: 999px;
        text-transform: uppercase; letter-spacing: 0.04em;
      }
      .waybi-tag-avatar {
        width: 20px; height: 20px; flex-shrink: 0;
      }
      .waybi-tag-avatar svg { width: 100%; height: 100%; }

      /* ═══ 4. EMPTY STATE — Waybi bảo chưa có data ═══ */
      .waybi-empty {
        text-align: center; padding: 36px 20px;
        background: linear-gradient(180deg, rgba(107,142,255,0.04), rgba(167,139,250,0.04));
        border-radius: 16px;
        border: 1.5px dashed rgba(99,102,241,0.25);
        max-width: 480px; margin: 20px auto;
      }
      .waybi-empty-mascot {
        width: 100px; height: 100px; margin: 0 auto 12px;
        animation: waybi-bob 2.5s ease-in-out infinite;
      }
      .waybi-empty h4 {
        font-family: 'Nunito', sans-serif; font-weight: 800;
        font-size: 1rem; color: var(--text-dark, #1a1a3e);
        margin: 0 0 6px;
      }
      .waybi-empty p {
        font-size: 0.84rem; color: var(--text-soft, #6b7aaa);
        margin: 0 0 14px;
      }
    </style>
  `;

  // Lời chào theo trang
  const GREETINGS = {
    'index.html': { h: 'Xin chào! Mình là Waybi 👋', p: 'Mình sẽ giúp bạn tìm học bổng, viết CV, lên lộ trình du học. Cứ hỏi mình nhé!' },
    'calendar.html': { h: 'Đây là Lịch tuyển sinh 2026 📅', p: 'Tất cả mốc thi, nộp hồ sơ, công bố điểm chuẩn theo tháng. Click ngày để xem chi tiết!' },
    'scholarship-roadmap.html': { h: 'Lộ trình apply 12 tháng 🗺️', p: 'Mỗi tháng có những việc cần làm. Click vào lịch ở dưới để xem chi tiết từng mốc nhé!' },
    'cv-review.html': { h: 'Mình giúp bạn sửa CV ✍️', p: 'Upload CV lên, AI sẽ gợi ý chỉnh sửa theo chuẩn quốc tế.' },
    'essay-review.html': { h: 'Cùng nhau viết Essay nhé! ✨', p: 'Đưa mình đọc bản nháp, mình sẽ gợi ý chỉnh sửa.' },
    'holland.html': { h: 'Tìm nghề hợp với bạn 🎯', p: 'Làm trắc nghiệm Holland để biết mình hợp với nhóm ngành nào nha!' },
    'score-calculator.html': { h: 'Tính điểm xét tuyển 🧮', p: 'Nhập điểm 3 môn + chọn tổ hợp, mình tính ngay cho!' },
    'careers.html': { h: 'Khám phá nghề nghiệp 💼', p: 'Tìm hiểu các ngành nghề hot theo nhóm Holland.' },
    'majors.html': { h: 'Tìm ngành học phù hợp 📚', p: 'Browse qua hàng trăm ngành học phổ biến ở Việt Nam.' },
    'page2.html': { h: 'Tra cứu trường ĐH 🏫', p: 'Có thể lọc theo khu vực, học bổng, ngành nổi bật.' },
    'interview-prep.html': { h: 'Chuẩn bị phỏng vấn học bổng 🎤', p: 'Mình có tips và câu hỏi thường gặp.' },
    'resources.html': { h: 'Tài liệu tham khảo 📖', p: 'Sách, khóa học, video hữu ích cho hành trình apply.' },
    'profile.html': { h: 'Hồ sơ cá nhân 👤', p: 'Cập nhật thông tin để Waybi gợi ý phù hợp hơn.' },
    'news.html': { h: 'Tin tức học bổng mới nhất 📰', p: 'Cập nhật học bổng mới mỗi ngày.' },
  };
  const DEFAULT = { h: 'Xin chào! Mình là Waybi 👋', p: 'Mình sẽ giúp bạn trong hành trình apply học bổng. Bấm vào icon chat để nói chuyện với mình nhé!' };

  function getGreeting() {
    const path = location.pathname.toLowerCase();
    for (const k in GREETINGS) {
      if (path.endsWith(k) || path.includes(k.replace('.html', ''))) return GREETINGS[k];
    }
    return DEFAULT;
  }

  // Tag inline Waybi
  function makeWaybiTag(text) {
    return `<span class="waybi-tag"><span class="waybi-tag-avatar">${makeSVG('wb-tag-' + Math.random().toString(36).slice(2, 7))}</span>${text || 'Waybi'}</span>`;
  }
  // expose cho các trang dùng
  window.waybiTag = makeWaybiTag;

  // Empty state template
  window.waybiEmpty = function(title, msg) {
    return `<div class="waybi-empty">
      <div class="waybi-empty-mascot">${makeSVG('wb-empty-' + Math.random().toString(36).slice(2, 7))}</div>
      <h4>${title || 'Chưa có dữ liệu'}</h4>
      <p>${msg || 'Mình chưa tìm thấy gì để hiển thị. Bạn thử lại sau nhé!'}</p>
    </div>`;
  };

  function init() {
    // Inject styles
    document.head.insertAdjacentHTML('beforeend', styles);

    const path = location.pathname.toLowerCase();
    const isLogin = path.includes('login') || path.includes('admin');
    const isCalendar = path.includes('calendar');
    const isRoadmap = path.includes('scholarship-roadmap');

    // Bỏ qua banner + left mascot ở trang login/admin (giữ chat nổi)
    if (!isLogin) {
      // 1. Left floating Waybi
      const leftMascot = document.createElement('div');
      leftMascot.id = 'waybi-left';
      leftMascot.title = 'Chào bạn! 👋';
      leftMascot.innerHTML = makeSVG('wb-left-' + Date.now());
      // Click mở chat
      leftMascot.addEventListener('click', () => {
        const fab = document.getElementById('waybi-fab');
        if (fab) fab.click();
      });
      document.body.appendChild(leftMascot);

      // 2. Welcome banner dưới nav (chỉ ở trang index)
      if (path.endsWith('/') || path.endsWith('index.html') || path === '/' || path === '') {
        // chèn sau nav
        const nav = document.querySelector('.lp-nav') || document.querySelector('nav');
        if (nav) {
          const greet = getGreeting();
          const banner = document.createElement('div');
          banner.id = 'waybi-banner';
          banner.innerHTML = `
            <div class="waybi-banner-card">
              <button class="waybi-banner-close" aria-label="Đóng">✕</button>
              <div class="waybi-banner-mascot">${makeSVG('wb-banner-' + Date.now())}</div>
              <div class="waybi-banner-text">
                <h3>${greet.h}</h3>
                <p>${greet.p}</p>
              </div>
              <button class="waybi-banner-cta" id="waybi-banner-cta">💬 Chat ngay</button>
            </div>
          `;
          nav.parentNode.insertBefore(banner, nav.nextSibling);
          banner.querySelector('.waybi-banner-close').addEventListener('click', () => {
            banner.style.transition = 'opacity .3s, max-height .3s, margin .3s, padding .3s';
            banner.style.opacity = '0';
            banner.style.maxHeight = '0';
            banner.style.overflow = 'hidden';
            banner.style.padding = '0';
            banner.style.margin = '0';
            setTimeout(() => banner.remove(), 300);
            sessionStorage.setItem('waybi-banner-closed', '1');
          });
          banner.querySelector('#waybi-banner-cta').addEventListener('click', () => {
            const fab = document.getElementById('waybi-fab');
            if (fab) fab.click();
          });
          // Auto-hide nếu user đã đóng trong session này
          if (sessionStorage.getItem('waybi-banner-closed') === '1') {
            banner.remove();
          }
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
