/* ════════════════════════════════════════════════════════
   ADMIN QUICK — FAB button + modal đăng bài nhanh
   ════════════════════════════════════════════════════════
   Inject nút "✍️ Đăng bài" nổi vào góc phải dưới khi user là admin.
   Click → modal mở với markdown editor → đăng bài xong.

   Include script này SAU supabase-client.js + cms-service.js
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ============ STATE ============
  let currentProfile = null;
  let currentPage = null; // 'post' | 'major' | null
  let currentEditId = null;

  // ============ INIT ============
  async function init() {
    try {
      const sb = await window.getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'teacher'].includes(profile.role)) return;
      currentProfile = profile;

      detectCurrentPage();
      injectFAB();
      injectEditButton();
    } catch (err) {
      console.warn('[admin-quick]', err);
    }
  }

  function detectCurrentPage() {
    const path = location.pathname;
    if (path.includes('news-detail.html') || path.includes('news.html')) {
      currentPage = 'post';
      currentEditId = getPostIdFromURL();
    } else if (path.includes('major-detail.html') || path.includes('majors.html')) {
      currentPage = 'major';
      currentEditId = getMajorIdFromURL();
    }
  }

  function getPostIdFromURL() {
    const params = new URLSearchParams(location.search);
    return params.get('slug') || null;
  }

  function getMajorIdFromURL() {
    const params = new URLSearchParams(location.search);
    return params.get('slug') || null;
  }

  // ============ FAB ============
  function injectFAB() {
    if (document.getElementById('admin-quick-fab')) return;

    const fab = document.createElement('div');
    fab.id = 'admin-quick-fab';
    fab.className = 'admin-quick-fab';
    fab.innerHTML = `
      <button class="fab-main" onclick="AdminQuick.toggle()" title="Đăng bài nhanh">
        ✍️
      </button>
      <div class="fab-menu" id="fab-menu">
        <button onclick="AdminQuick.openPostModal()">
          <span>📝</span> Đăng bài viết
        </button>
        <button onclick="AdminQuick.openMajorModal()">
          <span>🎯</span> Thêm ngành
        </button>
        <button onclick="AdminQuick.openDashboard()">
          <span>⚙️</span> Quản trị đầy đủ
        </button>
      </div>
    `;
    document.body.appendChild(fab);
  }

  function injectEditButton() {
    if (!currentPage || !currentEditId) return;
    if (document.getElementById('admin-quick-edit')) return;

    const btn = document.createElement('a');
    btn.id = 'admin-quick-edit';
    btn.className = 'admin-quick-edit';
    btn.innerHTML = '✏️ Sửa nhanh';
    btn.href = '#';
    btn.onclick = e => {
      e.preventDefault();
      if (currentPage === 'post') openPostModal(currentEditId);
      else if (currentPage === 'major') openMajorModal(currentEditId);
    };
    document.body.appendChild(btn);
  }

  function toggle() {
    const menu = document.getElementById('fab-menu');
    const fab = document.querySelector('.fab-main');
    menu.classList.toggle('open');
    fab.classList.toggle('open');
  }

  // ============ MODAL POST ============
  async function openPostModal(postSlug = null) {
    let post = null;
    if (postSlug) {
      try {
        post = await window.CMS.getPostBySlug(postSlug);
      } catch (e) {
        post = null;
      }
    }

    const editing = !!post;
    const modal = createModal({
      title: editing ? '✏️ Sửa bài viết' : '✍️ Đăng bài viết mới',
      size: 'large',
      content: `
        <div class="aq-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tiêu đề <span class="required">*</span></label>
              <input type="text" id="aq-title" class="form-input" placeholder="VD: 10 ngành nghề hot 2026" value="${escapeAttr(post?.title || '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Slug</label>
              <input type="text" id="aq-slug" class="form-input" placeholder="tu-dong-tao" value="${escapeAttr(post?.slug || '')}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Danh mục</label>
              <select id="aq-category" class="form-select">
                <option value="chia_se" ${post?.category === 'chia_se' ? 'selected' : ''}>Chia sẻ</option>
                <option value="tu_van" ${post?.category === 'tu_van' ? 'selected' : ''}>Tư vấn</option>
                <option value="su_kien" ${post?.category === 'su_kien' ? 'selected' : ''}>Sự kiện</option>
                <option value="khoi_thpt" ${post?.category === 'khoi_thpt' ? 'selected' : ''}>Khối THPT</option>
                <option value="nganh_hoc" ${post?.category === 'nganh_hoc' ? 'selected' : ''}>Ngành học</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">URL ảnh bìa</label>
              <input type="url" id="aq-cover" class="form-input" placeholder="https://..." value="${escapeAttr(post?.cover_image || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tóm tắt</label>
            <textarea id="aq-summary" class="form-textarea" rows="2" placeholder="Mô tả ngắn...">${escapeAttr(post?.summary || '')}</textarea>
          </div>

          <div class="aq-editor">
            <div class="aq-pane">
              <div class="aq-pane-header">📝 Markdown</div>
              <textarea id="aq-content" placeholder="# Tiêu đề

Viết nội dung ở đây...">${escapeAttr(post?.content || '')}</textarea>
            </div>
            <div class="aq-pane">
              <div class="aq-pane-header">👁️ Xem trước</div>
              <div id="aq-preview" class="aq-preview"></div>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="AdminQuick.close()">Hủy</button>
        <button class="btn btn-secondary" onclick="AdminQuick.savePost('draft', '${postSlug || ''}')">💾 Lưu nháp</button>
        <button class="btn btn-primary" onclick="AdminQuick.savePost('published', '${postSlug || ''}')">🚀 Đăng bài</button>
      `
    });

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Setup listeners
    const contentEl = document.getElementById('aq-content');
    contentEl.addEventListener('input', updatePostPreview);

    const titleEl = document.getElementById('aq-title');
    const slugEl = document.getElementById('aq-slug');
    let slugTouched = slugEl.value.length > 0;
    slugEl.addEventListener('input', () => slugTouched = true);
    titleEl.addEventListener('input', () => {
      if (!slugTouched && !editing) slugEl.value = window.CMS.slugify(titleEl.value);
      updatePostPreview();
    });
    document.getElementById('aq-summary').addEventListener('input', updatePostPreview);

    updatePostPreview();
    setTimeout(() => titleEl.focus(), 100);
  }

  async function savePost(status, editSlug) {
    const title = document.getElementById('aq-title').value.trim();
    if (!title) {
      showToast('Vui lòng nhập tiêu đề', 'warn');
      return;
    }

    const slugInput = document.getElementById('aq-slug').value.trim() || window.CMS.slugify(title);
    const payload = {
      title,
      slug: slugInput,
      category: document.getElementById('aq-category').value,
      cover_image: document.getElementById('aq-cover').value.trim() || null,
      summary: document.getElementById('aq-summary').value.trim(),
      content: document.getElementById('aq-content').value,
      status
    };

    try {
      if (editSlug) {
        const sb = window.supabaseClient;
        const { data: post } = await sb.from('posts').select('id').eq('slug', editSlug).single();
        if (post) {
          await window.CMS.updatePost(post.id, payload);
        }
      } else {
        await window.CMS.createPost(payload);
      }
      showToast(editSlug ? 'Đã cập nhật bài viết' : 'Đã đăng bài thành công!', 'success');
      close();

      // Reload nếu đang ở trang liên quan
      setTimeout(() => {
        if (location.pathname.includes('news')) location.reload();
      }, 600);
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  function updatePostPreview() {
    const md = document.getElementById('aq-content')?.value || '';
    const preview = document.getElementById('aq-preview');
    if (!preview) return;
    if (!md.trim()) {
      preview.innerHTML = '<p style="color:var(--text-soft);">Bắt đầu viết để xem trước...</p>';
      return;
    }
    preview.innerHTML = renderMarkdown(md);
  }

  // ============ MODAL MAJOR ============
  async function openMajorModal(majorSlug = null) {
    let major = null;
    if (majorSlug) {
      try {
        major = await window.CMS.getMajorBySlug(majorSlug);
      } catch (e) {
        major = null;
      }
    }

    const editing = !!major;
    const modal = createModal({
      title: editing ? '✏️ Sửa ngành nghề' : '➕ Thêm ngành mới',
      size: 'large',
      content: `
        <div class="aq-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tên ngành (VI) <span class="required">*</span></label>
              <input type="text" id="aq-name-vi" class="form-input" value="${escapeAttr(major?.name_vi || '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Tên ngành (EN)</label>
              <input type="text" id="aq-name-en" class="form-input" value="${escapeAttr(major?.name_en || '')}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Slug</label>
              <input type="text" id="aq-major-slug" class="form-input" value="${escapeAttr(major?.slug || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Khối</label>
              <select id="aq-major-cat" class="form-select">
                <option value="khoi_A" ${major?.category === 'khoi_A' ? 'selected' : ''}>Khối A (Toán, Lý, Hóa)</option>
                <option value="khoi_B" ${major?.category === 'khoi_B' ? 'selected' : ''}>Khối B (Toán, Hóa, Sinh)</option>
                <option value="khoi_C" ${major?.category === 'khoi_C' ? 'selected' : ''}>Khối C (Văn, Sử, Địa)</option>
                <option value="khoi_D" ${major?.category === 'khoi_D' ? 'selected' : ''}>Khối D (Ngoại ngữ)</option>
                <option value="khoi_khac" ${major?.category === 'khoi_khac' ? 'selected' : ''}>Khối khác</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea id="aq-major-desc" class="form-textarea" rows="2">${escapeAttr(major?.description || '')}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cơ hội việc làm</label>
              <textarea id="aq-major-jobs" class="form-textarea" rows="2">${escapeAttr(major?.job_prospects || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Mức lương</label>
              <input type="text" id="aq-major-salary" class="form-input" value="${escapeAttr(major?.salary_range || '')}" placeholder="VD: 15-80 triệu/tháng">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Kỹ năng cần có</label>
            <textarea id="aq-major-skills" class="form-textarea" rows="2">${escapeAttr(major?.required_skills || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Top trường đào tạo (mỗi dòng 1 trường)</label>
            <textarea id="aq-major-unis" class="form-textarea" rows="5" placeholder="ĐH Bách Khoa Hà Nội&#10;ĐH CNTT - ĐHQG&#10;ĐH FPT">${escapeAttr((major?.top_universities || []).join('\n'))}</textarea>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="AdminQuick.close()">Hủy</button>
        <button class="btn btn-primary" onclick="AdminQuick.saveMajor('${majorSlug || ''}')">💾 Lưu ngành</button>
      `
    });

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const nameEl = document.getElementById('aq-name-vi');
    const slugEl = document.getElementById('aq-major-slug');
    let slugTouched = slugEl.value.length > 0;
    slugEl.addEventListener('input', () => slugTouched = true);
    nameEl.addEventListener('input', () => {
      if (!slugTouched && !editing) slugEl.value = window.CMS.slugify(nameEl.value);
    });

    setTimeout(() => nameEl.focus(), 100);
  }

  async function saveMajor(editSlug) {
    const name_vi = document.getElementById('aq-name-vi').value.trim();
    if (!name_vi) {
      showToast('Vui lòng nhập tên ngành', 'warn');
      return;
    }
    const slugInput = document.getElementById('aq-major-slug').value.trim() || window.CMS.slugify(name_vi);
    const universities = document.getElementById('aq-major-unis').value
      .split('\n').map(s => s.trim()).filter(Boolean);

    const payload = {
      name_vi,
      name_en: document.getElementById('aq-name-en').value.trim() || null,
      slug: slugInput,
      category: document.getElementById('aq-major-cat').value,
      description: document.getElementById('aq-major-desc').value.trim() || null,
      job_prospects: document.getElementById('aq-major-jobs').value.trim() || null,
      salary_range: document.getElementById('aq-major-salary').value.trim() || null,
      required_skills: document.getElementById('aq-major-skills').value.trim() || null,
      top_universities: universities
    };

    try {
      if (editSlug) {
        const sb = window.supabaseClient;
        const { data: m } = await sb.from('majors').select('id').eq('slug', editSlug).single();
        if (m) await window.CMS.updateMajor(m.id, payload);
      } else {
        await window.CMS.createMajor(payload);
      }
      showToast(editSlug ? 'Đã cập nhật ngành' : 'Đã thêm ngành thành công!', 'success');
      close();
      setTimeout(() => {
        if (location.pathname.includes('major')) location.reload();
      }, 600);
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  // ============ MODAL HELPER ============
  function createModal({ title, content, footer, size }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'aq-modal-backdrop';
    backdrop.onclick = e => {
      if (e.target === backdrop) close();
    };
    backdrop.innerHTML = `
      <div class="aq-modal ${size === 'large' ? 'aq-modal-large' : ''}">
        <div class="aq-modal-header">
          <div class="aq-modal-title">${title}</div>
          <button class="aq-modal-close" onclick="AdminQuick.close()">✕</button>
        </div>
        <div class="aq-modal-body">${content}</div>
        <div class="aq-modal-footer">${footer}</div>
      </div>
    `;
    return backdrop;
  }

  function close() {
    document.querySelector('.aq-modal-backdrop')?.remove();
    document.body.style.overflow = '';
    // Đóng FAB menu nếu đang mở
    document.getElementById('fab-menu')?.classList.remove('open');
    document.querySelector('.fab-main')?.classList.remove('open');
  }

  function openDashboard() {
    location.href = 'admin/index.html';
  }

  // ============ TOAST ============
  function showToast(msg, type = 'info') {
    let container = document.getElementById('aq-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'aq-toast-container';
      container.className = 'aq-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `aq-toast aq-toast-${type}`;
    const icon = {success:'✅', error:'❌', warn:'⚠️', info:'ℹ️'}[type];
    toast.innerHTML = `<strong>${icon}</strong> ${escapeHtml(msg)}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ============ HELPERS ============
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function renderMarkdown(md) {
    if (!md) return '';
    let html = escapeHtml(md);
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;">');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n?)+/gs, m => '<ul>' + m + '</ul>');
    html = html.split(/\n\n+/).map(p => {
      if (p.match(/^<(h\d|ul|ol|blockquote|img)/)) return p;
      return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
    return html;
  }

  // ============ EXPORT ============
  window.AdminQuick = {
    init, toggle,
    openPostModal, savePost,
    openMajorModal, saveMajor,
    openDashboard, close,
    showToast
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();