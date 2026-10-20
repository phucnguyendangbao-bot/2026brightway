/* ════════════════════════════════════════════════════════
   NAV-AUTH — Đăng nhập/Avatar widget cho navbar
   Inject vào navbar của mọi trang (hỗ trợ nhiều layout)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ADMIN_AVATAR_URL = 'assets/images/brand/pdp-admin-avatar.png?v=20261020';
  let menuEvents = null;

  // Tìm container nav phù hợp — ưu tiên #navLinks, fallback các pattern khác
  function findNavContainer() {
    if (document.getElementById('navLinks')) {
      const links = document.getElementById('navLinks');
      return { container: links, mode: 'append' };
    }
    // BrightWay Career pages
    const lpNavLinks = document.querySelector('.lp-nav-links');
    if (lpNavLinks) return { container: lpNavLinks, mode: 'append' };
    // Trang tra cứu — nav có nhiều thành phần, append 1 div riêng
    const navInner = document.querySelector('.nav-inner, .p2-nav-inner');
    if (navInner) return { container: navInner, mode: 'append-sibling' };
    return null;
  }

  function ensureNavSlot() {
    const found = findNavContainer();
    if (!found) return null;
    const { container, mode } = found;
    // Nếu đã có slot thì return
    const existing = document.getElementById('navAuthSlot');
    if (existing) return existing;
    const slot = document.createElement('div');
    slot.id = 'navAuthSlot';
    slot.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:8px;';
    slot.innerHTML = '<a href="login.html?return=' + encodeURIComponent(location.pathname + location.search + location.hash) + '" id="navAuthBtn" class="btn-nav-login">Đăng nhập</a>';
    if (mode === 'append') {
      container.appendChild(slot);
    } else {
      // append-sibling: tạo wrapper riêng, chèn sau container
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;';
      wrap.appendChild(slot);
      container.parentNode.insertBefore(wrap, container.nextSibling);
    }
    return slot;
  }

  function style() {
    if (document.getElementById('navAuthStyle')) return;
    const s = document.createElement('style');
    s.id = 'navAuthStyle';
    s.textContent = `
      .btn-nav-login {
        background: var(--grad-btn);
        color: #fff !important;
        padding: 8px 18px !important;
        border-radius: 999px !important;
        font-weight: 800 !important;
        box-shadow: 0 3px 10px rgba(99,102,241,0.30);
        text-decoration: none;
        transition: all .2s;
        white-space: nowrap;
      }
      .btn-nav-login:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(99,102,241,0.42); }
      .nav-user-menu {
        position: relative;
        display: block;
      }
      .nav-user-trigger {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 4px 10px 4px 4px;
        border: 1px solid rgba(99, 102, 241, .16);
        border-radius: 999px;
        background: rgba(255, 255, 255, .72);
        color: var(--text, #24234a);
        box-shadow: 0 6px 20px rgba(62, 55, 128, .08), inset 0 1px 0 rgba(255, 255, 255, .85);
        backdrop-filter: blur(16px) saturate(145%);
        -webkit-backdrop-filter: blur(16px) saturate(145%);
        cursor: pointer;
        font-family: inherit;
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;
      }
      .nav-user-trigger:hover,
      .nav-user-trigger[aria-expanded="true"] {
        transform: translateY(-1px);
        border-color: rgba(99, 102, 241, .34);
        background: rgba(255, 255, 255, .9);
        box-shadow: 0 10px 28px rgba(62, 55, 128, .14), inset 0 1px 0 #fff;
      }
      .nav-user-trigger:focus-visible {
        outline: 3px solid rgba(99, 102, 241, .22);
        outline-offset: 3px;
      }
      .nav-avatar {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7567f8, #4f46e5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 800;
        font-size: 13px;
        font-family: 'Quicksand', sans-serif;
        flex-shrink: 0;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, .92);
        box-shadow: 0 0 0 1px rgba(99, 102, 241, .18), 0 3px 10px rgba(79, 70, 229, .18);
      }
      .nav-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .nav-user-name {
        display: block;
        max-width: 156px;
        overflow: hidden;
        color: var(--text, #24234a);
        font-size: 13px;
        font-weight: 800;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .nav-user-chevron {
        width: 16px;
        height: 16px;
        color: #7772a8;
        flex: 0 0 auto;
        transition: transform .2s ease;
      }
      .nav-user-trigger[aria-expanded="true"] .nav-user-chevron {
        transform: rotate(180deg);
      }
      .nav-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        width: min(308px, calc(100vw - 24px));
        padding: 9px;
        display: grid;
        gap: 3px;
        visibility: hidden;
        opacity: 0;
        transform: translateY(-8px) scale(.98);
        transform-origin: top right;
        pointer-events: none;
        z-index: 1200;
        overflow: hidden;
        background: rgba(255, 255, 255, .88);
        border: 1px solid rgba(255, 255, 255, .78);
        border-radius: 22px;
        box-shadow: 0 24px 70px rgba(43, 38, 102, .2), 0 4px 16px rgba(79, 70, 229, .08), inset 0 1px 0 #fff;
        backdrop-filter: blur(24px) saturate(155%);
        -webkit-backdrop-filter: blur(24px) saturate(155%);
        transition: opacity .18s ease, transform .18s ease, visibility .18s;
      }
      .nav-dropdown::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          radial-gradient(circle at 92% 4%, rgba(129, 140, 248, .16), transparent 38%),
          linear-gradient(145deg, rgba(255, 255, 255, .7), rgba(246, 247, 255, .42));
        pointer-events: none;
      }
      .nav-dropdown.show {
        visibility: visible;
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .nav-dropdown-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px 10px;
      }
      .nav-dropdown-eyebrow {
        color: #7772a8;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .09em;
        text-transform: uppercase;
      }
      .nav-role-badge {
        padding: 4px 8px;
        border: 1px solid rgba(99, 102, 241, .12);
        border-radius: 999px;
        background: rgba(99, 102, 241, .08);
        color: #554bd7;
        font-size: 10px;
        font-weight: 900;
      }
      .nav-dropdown a, .nav-dropdown button {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 52px;
        padding: 8px 10px;
        border-radius: 14px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--text, #24234a);
        text-decoration: none;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: transform .16s ease, background .16s ease, border-color .16s ease, box-shadow .16s ease;
      }
      .nav-dropdown a:hover, .nav-dropdown button:hover,
      .nav-dropdown a:focus-visible, .nav-dropdown button:focus-visible {
        transform: translateX(2px);
        border-color: rgba(99, 102, 241, .11);
        outline: none;
        background: rgba(255, 255, 255, .7);
        box-shadow: 0 7px 18px rgba(79, 70, 229, .08);
      }
      .nav-menu-icon {
        display: grid;
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
        place-items: center;
        border-radius: 11px;
        background: rgba(99, 102, 241, .1);
        color: #5b50db;
      }
      .nav-menu-icon svg { width: 17px; height: 17px; }
      .nav-menu-copy { min-width: 0; }
      .nav-menu-title {
        display: block;
        color: inherit;
        font-size: 13px;
        font-weight: 850;
        line-height: 1.25;
      }
      .nav-menu-note {
        display: block;
        margin-top: 2px;
        color: #7772a8;
        font-size: 10px;
        font-weight: 650;
        line-height: 1.25;
      }
      .nav-dropdown .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, .18), transparent);
        margin: 5px 4px;
      }
      .nav-dropdown .staff-link {
        background: linear-gradient(135deg, rgba(99, 102, 241, .11), rgba(139, 92, 246, .08));
        border-color: rgba(99, 102, 241, .12);
        color: #5146d6;
      }
      .nav-dropdown .staff-link .nav-menu-icon {
        background: linear-gradient(135deg, #6d5dfc, #8b5cf6);
        color: #fff;
        box-shadow: 0 6px 15px rgba(109, 93, 252, .25);
      }
      .nav-dropdown .danger { color: #d94646; }
      .nav-dropdown .danger .nav-menu-icon { background: rgba(239, 68, 68, .09); color: #e04747; }
      .nav-dropdown .danger:hover { border-color: rgba(239, 68, 68, .1); background: rgba(255, 246, 246, .82); }
      @media (max-width: 720px) {
        .nav-user-trigger { gap: 6px; padding-right: 7px; }
        .nav-user-name { display: none; }
        .nav-user-chevron { width: 14px; height: 14px; }
        .nav-dropdown { right: -4px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .nav-user-trigger, .nav-user-chevron, .nav-dropdown,
        .nav-dropdown a, .nav-dropdown button { transition: none !important; }
      }
    `;
    document.head.appendChild(s);
  }

  function render() {
    const slot = ensureNavSlot();
    if (!slot) return;
    style();

    const user = window.BWAuth?.getUser();
    const profile = window.BWAuth?.getProfile();

    if (!user) {
      slot.innerHTML = '<a href="login.html?return=' + encodeURIComponent(location.pathname + location.search + location.hash) + '" id="navAuthBtn" class="btn-nav-login">Đăng nhập</a>';
      return;
    }

    // Chỉ hiện nút "Vào trang quản lý" khi role là admin hoặc teacher
    const role = profile?.role || user.user_metadata?.role || 'student';
    const isStaff = role === 'admin' || role === 'teacher';

    const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const initials = (name[0] || 'U').toUpperCase();
    const avatarUrl = role === 'admin'
      ? ADMIN_AVATAR_URL
      : profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const safeName = escapeHTML(name);
    const roleLabel = role === 'admin' ? 'Quản trị viên' : role === 'teacher' ? 'Giáo viên' : 'Học sinh';

    slot.innerHTML = `
      <div class="nav-user-menu" id="navUserMenu">
        <button class="nav-user-trigger" id="navUserTrigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="navDropdown">
          <span class="nav-avatar" id="navUserAvatar" aria-hidden="true"><span>${escapeHTML(initials)}</span></span>
          <span class="nav-user-name">${safeName}</span>
          <svg class="nav-user-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav-dropdown" id="navDropdown" role="menu" aria-label="Menu tài khoản">
          <div class="nav-dropdown-head">
            <span class="nav-dropdown-eyebrow">Không gian của bạn</span>
            <span class="nav-role-badge">${roleLabel}</span>
          </div>
          ${menuLink('profile.html', 'user', 'Tài khoản của tôi', 'Hồ sơ và cài đặt')}
          ${menuLink('profile.html?tab=favorites', 'heart', 'Nghề yêu thích', 'Danh sách nghề đã lưu')}
          ${menuLink('profile.html?tab=history', 'search', 'Lịch sử tra cứu', 'Xem hoạt động gần đây')}
          <div class="divider"></div>
          ${isStaff ? `
            ${menuLink('admin/index.html', 'settings', 'Vào trang quản lý', 'Nội dung và dữ liệu', 'staff-link')}
            <div class="divider"></div>
          ` : ''}
          <button class="danger" id="navLogoutBtn" type="button" role="menuitem">
            <span class="nav-menu-icon">${icon('logout')}</span>
            <span class="nav-menu-copy"><span class="nav-menu-title">Đăng xuất</span><span class="nav-menu-note">Kết thúc phiên hiện tại</span></span>
          </button>
        </div>
      </div>
    `;

    const avatar = $('navUserAvatar');
    const safeAvatar = safeAvatarURL(avatarUrl);
    if (safeAvatar) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = safeAvatar;
      img.addEventListener('error', () => {
        avatar.innerHTML = `<span>${escapeHTML(initials)}</span>`;
      }, { once: true });
      avatar.replaceChildren(img);
    }

    menuEvents?.abort();
    menuEvents = new AbortController();
    const eventOptions = { signal: menuEvents.signal };
    const trigger = $('navUserTrigger');
    const dropdown = $('navDropdown');
    const setOpen = (open) => {
      dropdown.classList.toggle('show', open);
      trigger.setAttribute('aria-expanded', String(open));
    };
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(!dropdown.classList.contains('show'));
    }, eventOptions);
    dropdown.addEventListener('click', e => e.stopPropagation(), eventOptions);
    document.addEventListener('click', () => setOpen(false), eventOptions);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !dropdown.classList.contains('show')) return;
      setOpen(false);
      trigger.focus();
    }, eventOptions);

    $('navLogoutBtn').addEventListener('click', async () => {
      if (!confirm('Đăng xuất khỏi tài khoản?')) return;
      await window.BWAuth.signOut();
      window.location.reload();
    }, eventOptions);
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function safeAvatarURL(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function icon(name) {
    const paths = {
      user: '<path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
      logout: '<path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>'
    };
    return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.user}</svg>`;
  }

  function menuLink(href, iconName, title, note, className = '') {
    return `<a href="${href}" class="${className}" role="menuitem">
      <span class="nav-menu-icon">${icon(iconName)}</span>
      <span class="nav-menu-copy"><span class="nav-menu-title">${title}</span><span class="nav-menu-note">${note}</span></span>
    </a>`;
  }

  function init() {
    // Wait for BWAuth ready
    function waitAuth() {
      if (window.BWAuth) {
        window.BWAuth.on((event) => {
          if (['INIT', 'SIGNED_IN', 'SIGNED_OUT', 'PROFILE_UPDATED'].includes(event)) {
            render();
          }
        });
        render();
      } else {
        setTimeout(waitAuth, 100);
      }
    }
    waitAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expose helper
  function $(id) { return document.getElementById(id); }
})();
