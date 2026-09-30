/* ════════════════════════════════════════════════════════
   RESOURCES PAGE — load data + render
   Ưu tiên: Supabase. Fallback: file RESOURCES cứng bên dưới
   ════════════════════════════════════════════════════════ */

const FALLBACK_RESOURCES = [
  {
    title: 'CS50 — Khoa học Máy tính từ Harvard',
    category: 'Khóa học', provider: 'Coursera (Harvard)',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=240&fit=crop',
    description: 'Khoá học nhập môn CNTT nổi tiếng nhất thế giới.',
    url: 'https://www.coursera.org/learn/cs50-introduction-computer-science',
    tags: ['CNTT','Lập trình','Miễn phí'], is_free: true, level: 'Cơ bản'
  }
  /* Dữ liệu mặc định — khi Supabase hoạt động sẽ tự động lấy từ database */
];

/* Hàm render — không phụ thuộc cấu trúc */
function renderResourceCard(r) {
  const isFree = r.is_free !== false
    ? '<span class="res-badge res-badge-free">Miễn phí</span>'
    : '<span class="res-badge res-badge-paid">Trả phí</span>';
  const level = r.level ? `<span class="res-level">${r.level}</span>` : '';
  const tags = (r.tags || []).slice(0, 3).map(t => `<span class="res-tag">#${t}</span>`).join('');
  const safeTitle = (r.title || '').replace(/"/g, '&quot;');
  const safeUrl = (r.url || '#').replace(/"/g, '&quot;');

  return `
    <article class="res-card" data-category="${r.category}" data-id="${r.id || ''}">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="res-thumb">
        <img src="${r.image}" alt="${safeTitle}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x240/eef0ff/6675e3?text=Resource'" />
        <span class="res-cat">${r.category}</span>
        ${isFree}
      </a>
      <div class="res-body">
        <h3 class="res-title"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${r.title}</a></h3>
        <p class="res-provider">📚 ${r.provider || ''}</p>
        <p class="res-desc">${r.description || ''}</p>
        <div class="res-tags">${tags}</div>
        <div class="res-foot">
          ${level}
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="res-btn">
            TÌM HIỂU THÊM →
          </a>
        </div>
      </div>
    </article>`;
}

/* Hàm load data từ Supabase — được gọi từ resources.html */
async function loadResources() {
  // Ưu tiên Supabase
  if (window.CMS && typeof CMS.listResources === 'function') {
    try {
      const data = await CMS.listResources({ onlyPublished: true });
      if (data && data.length) return data;
    } catch (e) {
      console.warn('Supabase load failed, dùng fallback:', e);
    }
  }
  return FALLBACK_RESOURCES;
}