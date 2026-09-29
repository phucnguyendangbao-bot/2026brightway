/* ════════════════════════════════════════════════════════
   ADMIN LINK — tự thêm nút "Quản trị" vào nav khi user là admin
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  async function addAdminLink() {
    try {
      const sb = await window.getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const { data: profile } = await sb
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'teacher'].includes(profile.role)) return;

      // Tìm nav
      const navLinks = document.querySelector('.nav-links, nav .links, header .menu, .navbar-nav, .nav-menu');
      if (!navLinks) return;

      // Check xem đã có link admin chưa
      if (navLinks.querySelector('[data-admin-link]')) return;

      const link = document.createElement('a');
      link.href = 'admin/index.html';
      link.setAttribute('data-admin-link', 'true');
      link.textContent = '⚙️ Quản trị';
      link.style.cssText = 'padding:8px 14px;border-radius:10px;font-weight:600;color:var(--accent);background:rgba(99,102,241,0.1);';
      navLinks.appendChild(link);
    } catch (err) {
      console.warn('[admin-link]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAdminLink);
  } else {
    addAdminLink();
  }
})();