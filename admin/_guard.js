/* ════════════════════════════════════════════════════════
   ADMIN GUARD — kiểm tra role + auth + helpers chung
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ============ AUTH GUARD ============
  async function requireAdmin() {
    try {
      await window.getSupabase();
      const sb = window.supabaseClient;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        location.href = '../login.html?redirect=' + encodeURIComponent(location.pathname);
        return null;
      }
      const { data: profile, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile || !['admin', 'teacher'].includes(profile.role)) {
        await sb.auth.signOut();
        showToast('Bạn không có quyền truy cập trang quản trị', 'error');
        setTimeout(() => location.href = '../index.html', 1500);
        return null;
      }
      return profile;
    } catch (err) {
      console.error(err);
      showToast('Lỗi xác thực: ' + err.message, 'error');
      return null;
    }
  }

  async function logout() {
    if (!confirm('Đăng xuất khỏi trang quản trị?')) return;
    const sb = window.supabaseClient;
    await sb.auth.signOut();
    location.href = '../index.html';
  }

  // ============ SIDEBAR ============
  function buildSidebar(activePage, profile) {
    const initials = (profile?.full_name || 'A').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    const roleLabel = profile?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên';
    const avatar = profile?.role === 'admin'
      ? '<img src="../assets/images/brand/pdp-admin-avatar.png?v=20261020" alt="Avatar PDP dành cho quản trị viên">'
      : escapeHtml(initials);
    const icon = path => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;

    return `
      <div class="sidebar-hero" style="margin:-16px -16px 16px;padding:20px 16px;border-radius:0;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="width:32px;height:32px;border-radius:6px;background:var(--bw-tint);color:var(--accent);display:flex;align-items:center;justify-content:center;">${icon('M4 19V5h6v14M14 19V5h6v14M4 12h6m4 0h6')}</div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:16px;">BrightWay Admin</div>
        </div>
        <div style="font-size:12px;color:var(--text-soft);line-height:1.5;margin-bottom:10px;">Quản trị nội dung & tài khoản</div>
        <a href="../index.html" style="display:flex;align-items:center;gap:6px;padding:7px 0;color:var(--accent);font-weight:600;font-size:12px;text-decoration:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span>Về trang chủ</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Tổng quan</div>
        <a class="sidebar-link ${activePage==='dashboard'?'active':''}" href="index.html">
          <span class="sidebar-link-icon">${icon('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z')}</span>
          <span>Tổng quan</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Nội dung</div>
        <a class="sidebar-link ${['posts','resources'].includes(activePage)?'active':''}" href="posts.html">
          <span class="sidebar-link-icon">${icon('M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8')}</span>
          <span>Nội dung</span>
        </a>
        <a class="sidebar-link ${activePage==='majors'?'active':''}" href="majors.html">
          <span class="sidebar-link-icon">${icon('M3 7h18v13H3zM8 7V4h8v3M3 12h18M10 12v3h4v-3')}</span>
          <span>Ngành nghề</span>
        </a>
        <a class="sidebar-link ${activePage==='uploads'?'active':''}" href="resource-edit.html">
          <span class="sidebar-link-icon">${icon('M12 16V4M7 9l5-5 5 5M5 20h14')}</span>
          <span>Tải ảnh & tệp</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Quản lý</div>
        <a class="sidebar-link ${activePage==='users'?'active':''}" href="users.html">
          <span class="sidebar-link-icon">${icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 3a4 4 0 0 1 0 8')}</span>
          <span>Tài khoản</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Công cụ</div>
        <a class="sidebar-link" href="../index.html" target="_blank">
          <span class="sidebar-link-icon">${icon('M3 10l9-7 9 7v11h-6v-7H9v7H3z')}</span>
          <span>Xem trang chủ</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar ${profile?.role === 'admin' ? 'is-admin' : ''}">${avatar}</div>
          <div>
            <div class="user-name">${escapeHtml(profile?.full_name || 'Admin')}</div>
            <div class="user-role">${roleLabel}</div>
          </div>
        </div>
        <button class="btn-logout" onclick="Admin.logout()">Đăng xuất</button>
      </div>
    `;
  }

  // ============ TOAST ============
  function showToast(msg, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = {success:'✅', error:'❌', warn:'⚠️', info:'ℹ️'}[type] || 'ℹ️';
    toast.innerHTML = `<strong>${icon} ${escapeHtml(msg)}</strong>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ============ CONFIRM MODAL ============
  function confirmAction(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal">
          <div class="modal-title">${escapeHtml(title)}</div>
          <div class="modal-desc">${escapeHtml(message)}</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" data-act="cancel">Hủy</button>
            <button class="btn btn-danger" data-act="ok">Xác nhận</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop || e.target.dataset.act === 'cancel') {
          backdrop.remove();
          resolve(false);
        } else if (e.target.dataset.act === 'ok') {
          backdrop.remove();
          resolve(true);
        }
      });
    });
  }

  // ============ HELPERS ============
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
      day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
  }

  function statusBadge(status) {
    const map = {
      published: '<span class="badge badge-success">Đã đăng</span>',
      draft: '<span class="badge badge-warn">Nháp</span>',
      archived: '<span class="badge badge-danger">Đã ẩn</span>'
    };
    return map[status] || status;
  }

  function categoryBadge(cat) {
    const map = {
      chia_se: ['#6366f1', 'Chia sẻ'],
      tu_van: ['#10b981', 'Tư vấn'],
      su_kien: ['#f59e0b', 'Sự kiện'],
      khoi_thpt: ['#8b5cf6', 'Khối THPT'],
      nganh_hoc: ['#ec4899', 'Ngành học'],
      khoi_A: ['#ef4444', 'Khối A'],
      khoi_B: ['#10b981', 'Khối B'],
      khoi_C: ['#f59e0b', 'Khối C'],
      khoi_D: ['#8b5cf6', 'Khối D']
    };
    const [color, label] = map[cat] || ['#6b7280', cat];
    return `<span class="badge" style="background:${color}22;color:${color}">${label}</span>`;
  }

  // ============ MOBILE TOGGLE ============
  function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
  }

  // ============ EXPORT ============
  window.Admin = {
    requireAdmin, logout,
    buildSidebar,
    showToast, confirmAction,
    escapeHtml, formatDate,
    statusBadge, categoryBadge,
    toggleSidebar
  };
})();
