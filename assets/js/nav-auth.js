/* ════════════════════════════════════════════════════════
   NAV-AUTH — Đăng nhập/Avatar widget cho navbar
   Inject vào navbar của mọi trang (hỗ trợ nhiều layout)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Tìm container nav phù hợp — ưu tiên #navLinks, fallback các pattern khác
  function findNavContainer() {
    if (document.getElementById('navLinks')) {
      const links = document.getElementById('navLinks');
      return { container: links, mode: 'append' };
    }
    // BrightWay Scholars pages
    const lpNavLinks = document.querySelector('.lp-nav-links');
    if (lpNavLinks) return { container: lpNavLinks, mode: 'append' };
    // page2 / cv-review — nav có nhiều thành phần, append 1 div riêng
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
    slot.innerHTML = '<a href="login.html" id="navAuthBtn" class="btn-nav-login">Đăng nhập</a>';
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
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 12px 4px 4px;
        border-radius: 999px;
        background: var(--surface-2);
        border: 1.5px solid var(--border-soft);
        transition: all .15s;
      }
      .nav-user-menu:hover { box-shadow: var(--shadow-soft); }
      .nav-avatar {
        width: 32px; height: 32px;
        border-radius: 50%;
        background: var(--grad);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 800;
        font-size: 13px;
        font-family: 'Quicksand', sans-serif;
        flex-shrink: 0;
      }
      .nav-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .nav-user-name {
        font-size: 13px; font-weight: 700;
        color: var(--text-mid);
        max-width: 110px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .nav-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 200px;
        background: var(--surface);
        border: 1.5px solid var(--border-soft);
        border-radius: 14px;
        box-shadow: var(--shadow);
        padding: 6px;
        display: none;
        z-index: 200;
      }
      .nav-dropdown.show { display: block; animation: fadeIn .15s ease; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      .nav-dropdown a, .nav-dropdown button {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        border-radius: 10px;
        background: transparent;
        border: none;
        color: var(--text);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
      }
      .nav-dropdown a:hover, .nav-dropdown button:hover { background: rgba(99,102,241,0.10); }
      .nav-dropdown .divider {
        height: 1px;
        background: var(--border-soft);
        margin: 4px 0;
      }
      .nav-dropdown .danger { color: #ef4444; }
      .nav-dropdown .danger:hover { background: rgba(239,68,68,0.10); }
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
      slot.innerHTML = '<a href="login.html" id="navAuthBtn" class="btn-nav-login">Đăng nhập</a>';
      return;
    }

    // Chỉ hiện nút "Vào trang quản lý" khi role là admin hoặc teacher
    const role = profile?.role || user.user_metadata?.role || 'student';
    const isStaff = role === 'admin' || role === 'teacher';

    const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const initials = (name[0] || 'U').toUpperCase();
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;

    const avatar = avatarUrl
      ? `<img src="${avatarUrl}" alt="" onerror="this.outerHTML='<span>${initials}</span>'" />`
      : `<span>${initials}</span>`;

    slot.innerHTML = `
      <div class="nav-user-menu" id="navUserMenu">
        <div class="nav-avatar">${avatar}</div>
        <span class="nav-user-name">${name}</span>
        <div class="nav-dropdown" id="navDropdown">
          <a href="profile.html">👤 Tài khoản của tôi</a>
          <a href="profile.html?tab=favorites">❤️ Nghề yêu thích</a>
          <a href="profile.html?tab=history">🔍 Lịch sử tra cứu</a>
          <a href="profile.html?tab=essays">✍️ Bài luận</a>
          <div class="divider"></div>
          ${isStaff ? `
            <a href="admin/index.html" style="background:rgba(99,102,241,0.08);color:var(--accent);font-weight:800;">
              ⚙️ Vào trang quản lý
            </a>
            <div class="divider"></div>
          ` : ''}
          <button class="danger" id="navLogoutBtn">🚪 Đăng xuất</button>
        </div>
      </div>
    `;

    const menu = $('navUserMenu');
    const dropdown = $('navDropdown');
    menu.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));

    $('navLogoutBtn').addEventListener('click', async () => {
      if (!confirm('Đăng xuất khỏi tài khoản?')) return;
      await window.BWAuth.signOut();
      window.location.reload();
    });
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
