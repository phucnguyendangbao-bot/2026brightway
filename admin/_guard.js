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

    return `
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">🎓</div>
        <div class="sidebar-brand-text">BrightWay Admin</div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Tổng quan</div>
        <a class="sidebar-link ${activePage==='dashboard'?'active':''}" href="index.html">
          <span class="sidebar-link-icon">📊</span>
          <span>Dashboard</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Nội dung</div>
        <a class="sidebar-link ${activePage==='posts'?'active':''}" href="posts.html">
          <span class="sidebar-link-icon">📝</span>
          <span>Bài viết</span>
        </a>
        <a class="sidebar-link ${activePage==='majors'?'active':''}" href="majors.html">
          <span class="sidebar-link-icon">🎯</span>
          <span>Ngành nghề</span>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Công cụ</div>
        <a class="sidebar-link" href="../index.html" target="_blank">
          <span class="sidebar-link-icon">🌐</span>
          <span>Xem trang chủ</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">${initials}</div>
          <div>
            <div class="user-name">${escapeHtml(profile?.full_name || 'Admin')}</div>
            <div class="user-role">${roleLabel}</div>
          </div>
        </div>
        <button class="btn-logout" onclick="Admin.logout()">🚪 Đăng xuất</button>
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