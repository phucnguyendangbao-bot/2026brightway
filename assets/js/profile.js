/* ════════════════════════════════════════════════════════
   PROFILE PAGE — Logic
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const fmtDate = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  };

  // ─── Auth-aware render ───
  function renderAuthState() {
    const user = window.BWAuth.getUser();
    const profile = window.BWAuth.getProfile();

    if (!user) {
      $('notSignedIn').hidden = false;
      $('profileContent').hidden = true;
      return;
    }

    $('notSignedIn').hidden = true;
    $('profileContent').hidden = false;

    // Header
    const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    $('profileName').textContent = name;
    $('profileEmail').textContent = user.email || '';
    $('profileInitials').textContent = (name[0] || 'U').toUpperCase();

    const provider = profile?.provider || user.app_metadata?.provider || 'email';
    $('profileProvider').textContent = provider === 'google' ? '🔵 Google' : provider === 'phone' ? '📱 Phone' : '✉️ Email';

    const grade = profile?.grade || '';
    const region = profile?.region || '';
    const meta = [grade, region].filter(Boolean).join(' · ');
    $('profileMeta').textContent = meta || 'Hoàn thiện hồ sơ để nhận gợi ý tốt hơn';

    // Form
    if (profile) {
      $('iName').value = profile.full_name || '';
      $('iGrade').value = profile.grade || '';
      $('iRegion').value = profile.region || '';
      $('iTarget').value = profile.target_score || '';
      $('iHolland').value = profile.holland_code || '';
    }
  }

  // ─── Tabs ───
  function switchTab(tab) {
    document.querySelectorAll('.profile-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.profile-panel').forEach(el => {
      el.classList.toggle('active', el.dataset.panel === tab);
    });
    if (tab === 'favorites') loadFavorites();
    else if (tab === 'history') loadHistory();
    else if (tab === 'essays') loadEssays();
  }

  document.querySelectorAll('.profile-tab').forEach(el => {
    el.addEventListener('click', () => switchTab(el.dataset.tab));
  });

  // ─── Profile form ───
  $('profileForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const status = $('profileStatus');
    try {
      const update = {
        full_name: $('iName').value.trim(),
        grade: $('iGrade').value || null,
        region: $('iRegion').value || null,
        target_score: parseFloat($('iTarget').value) || null,
        holland_code: $('iHolland').value.trim().toUpperCase() || null
      };
      status.hidden = false;
      status.className = 'auth-status show info';
      status.textContent = '🔄 Đang lưu...';
      await window.BWAuth.updateProfile(update);
      status.className = 'auth-status show success';
      status.textContent = '✅ Đã lưu thay đổi!';
      setTimeout(() => { status.hidden = true; }, 2500);
      renderAuthState();
    } catch (e) {
      status.className = 'auth-status show error';
      status.textContent = '❌ Lỗi: ' + e.message;
    }
  });

  // ─── Logout ───
  $('logoutBtn')?.addEventListener('click', async () => {
    if (!confirm('Đăng xuất khỏi tài khoản?')) return;
    try {
      await window.BWAuth.signOut();
      window.location.href = 'login.html';
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  });

  // ─── Load favorites ───
  async function loadFavorites() {
    const box = $('favoritesList');
    box.innerHTML = '<p class="empty-msg">Đang tải...</p>';
    try {
      const items = await window.BWSync.listFavorites();
      if (!items.length) {
        box.innerHTML = '<div class="empty-msg"><div style="font-size:48px;">💔</div><h3>Chưa có nghề yêu thích</h3><p>Hãy vào <a href="careers-holland.html">Tra cứu nghề</a> và nhấn ❤️ để lưu nghề bạn thích.</p></div>';
        return;
      }
      box.innerHTML = '<h3 style="margin-bottom:14px;">❤️ ' + items.length + ' nghề đã lưu</h3>' +
        '<div class="list-grid">' + items.map(item => {
          const j = item.job_data || item;
          return `
            <div class="list-card">
              <div class="list-card-name">${j.name || j.job_name}</div>
              <div class="list-card-meta">${j.en || ''} · ${j.group || ''} ${j.code ? '· Mã ' + j.code : ''}</div>
              <div class="list-card-foot">
                <span class="list-card-date">${fmtDate(item.created_at)}</span>
                <button class="btn-link" data-name="${j.name || j.job_name}">Bỏ lưu</button>
              </div>
            </div>
          `;
        }).join('') + '</div>';
      box.querySelectorAll('[data-name]').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('Bỏ lưu nghề này?')) return;
          await window.BWSync.toggleFavorite({ name: b.dataset.name });
          loadFavorites();
        });
      });
    } catch (e) {
      box.innerHTML = '<p class="empty-msg">❌ Lỗi: ' + e.message + '</p>';
    }
  }

  // ─── Load history ───
  async function loadHistory() {
    const box = $('historyList');
    box.innerHTML = '<p class="empty-msg">Đang tải...</p>';
    try {
      const items = await window.BWSync.listHistory(50);
      if (!items.length) {
        box.innerHTML = '<div class="empty-msg"><div style="font-size:48px;">🔍</div><h3>Chưa có lịch sử tìm kiếm</h3><p>Lịch sử tra cứu sẽ tự động được lưu khi bạn dùng <a href="careers-holland.html">Tra cứu nghề</a>.</p></div>';
        return;
      }
      box.innerHTML = '<h3 style="margin-bottom:14px;">🔍 ' + items.length + ' lượt tra cứu gần đây</h3>' +
        '<div class="list-stack">' + items.map(h => {
          const hFilter = h.filter_holland;
          const meta = h.results_count + ' kết quả' + (hFilter && hFilter !== 'all' ? ' · Lọc: ' + hFilter : '');
          return `
            <a class="list-row" href="careers-holland.html?q=${encodeURIComponent(h.query || '')}">
              <span class="list-row-icon">🔍</span>
              <div class="list-row-body">
                <div class="list-row-name">${h.query || '(trống)'}</div>
                <div class="list-row-meta">${meta}</div>
              </div>
              <span class="list-row-date">${fmtDate(h.created_at)}</span>
            </a>
          `;
        }).join('') + '</div>';
    } catch (e) {
      box.innerHTML = '<p class="empty-msg">❌ Lỗi: ' + e.message + '</p>';
    }
  }

  // ─── Load essays ───
  async function loadEssays() {
    const box = $('essaysList');
    box.innerHTML = '<p class="empty-msg">Đang tải...</p>';
    try {
      const items = await window.BWSync.listEssays();
      if (!items.length) {
        box.innerHTML = '<div class="empty-msg"><div style="font-size:48px;">✍️</div><h3>Chưa có bài luận nào</h3><p>Tạo bài luận mới tại <a href="essay-review.html">Bài luận mẫu</a>.</p></div>';
        return;
      }
      box.innerHTML = '<h3 style="margin-bottom:14px;">✍️ ' + items.length + ' bài luận</h3>' +
        '<div class="list-stack">' + items.map(e => `
          <div class="list-row essay-row">
            <span class="list-row-icon">📝</span>
            <div class="list-row-body">
              <div class="list-row-name">${e.title || '(không tiêu đề)'}</div>
              <div class="list-row-meta">${e.word_count || 0} từ · ${e.is_draft ? '📝 Bản nháp' : '✅ Đã lưu'}</div>
            </div>
            <span class="list-row-date">${fmtDate(e.updated_at || e.created_at)}</span>
            <button class="btn-link btn-delete" data-id="${e.id}">🗑️</button>
          </div>
        `).join('') + '</div>';
      box.querySelectorAll('.btn-delete').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('Xóa bài luận này?')) return;
          await window.BWSync.deleteEssay(b.dataset.id);
          loadEssays();
        });
      });
    } catch (e) {
      box.innerHTML = '<p class="empty-msg">❌ Lỗi: ' + e.message + '</p>';
    }
  }

  // ─── Init ───
  window.BWAuth.on((event, { user, profile }) => {
    if (event === 'SIGNED_IN' || event === 'INIT') {
      renderAuthState();
      if (user) {
        // sync local data on first sign-in
        if (event === 'SIGNED_IN') {
          window.BWSync.syncLocalToCloud().catch(() => {});
        }
      }
    } else if (event === 'SIGNED_OUT') {
      window.location.href = 'login.html';
    }
  });

  // Initial load
  if (window.BWAuth.isSignedIn()) {
    renderAuthState();
  }
})();
