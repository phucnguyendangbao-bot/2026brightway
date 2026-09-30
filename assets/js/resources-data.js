/* ════════════════════════════════════════════════════════
   RESOURCES DATA – Tài liệu tham khảo & Khóa học bên ngoài
   ════════════════════════════════════════════════════════
   Mỗi resource là 1 card có:
     - id          : mã định danh
     - title       : tiêu đề tài liệu / khoá học
     - category    : nhóm (Khoá học / Tài liệu / Video / Công cụ / Tổ chức)
     - provider    : nơi cung cấp (Coursera, FPT, FUNiX, ...)
     - image       : ảnh đại diện (URL tuyệt đối hoặc /images/xxx.png)
     - description : mô tả ngắn 1-2 câu
     - url         : link ngoài (mở tab mới)
     - tags        : tag để filter
     - isFree      : true = miễn phí, false = trả phí
     - level       : Cơ bản / Nâng cao / Mọi cấp độ
   ════════════════════════════════════════════════════════ */

const RESOURCES = [
  // ── KHỐI NGÀNH KỸ THUẬT ────────────────────────────────
  {
    id: 'r-coursera-cs',
    title: 'CS50 — Khoa học Máy tính từ Harvard',
    category: 'Khóa học',
    provider: 'Coursera (Harvard)',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=240&fit=crop',
    description: 'Khoá học nhập môn CNTT nổi tiếng nhất thế giới. Miễn phí, có chứng chỉ, phù hợp người mới bắt đầu.',
    url: 'https://www.coursera.org/learn/cs50-introduction-computer-science',
    tags: ['CNTT', 'Lập trình', 'Miễn phí'],
    isFree: true,
    level: 'Cơ bản'
  },
  {
    id: 'r-funix-iot',
    title: 'Lập trình IoT cơ bản — FUNiX',
    category: 'Khóa học',
    provider: 'FUNiX (FPT)',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop',
    description: 'Khoá học IoT online của FPT, có mentor hướng dẫn 1-1, cấp chứng chỉ hoàn thành.',
    url: 'https://funix.edu.vn/',
    tags: ['CNTT', 'IoT', 'Tiếng Việt'],
    isFree: false,
    level: 'Cơ bản'
  },
  {
    id: 'r-fpt-ai',
    title: 'Trí tuệ nhân tạo & Machine Learning — FPT AI',
    category: 'Khóa học',
    provider: 'FPT Software',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=240&fit=crop',
    description: 'Chương trình đào tạo AI/ML thực chiến tại FPT. Học qua dự án, có cơ hội thực tập.',
    url: 'https://fpt.ai/',
    tags: ['AI', 'CNTT', 'Thực chiến'],
    isFree: false,
    level: 'Nâng cao'
  },

  // ── KHỐI NGÀNH KINH TẾ ─────────────────────────────────
  {
    id: 'r-coursera-finance',
    title: 'Tài chính cho mọi người — Wharton',
    category: 'Khóa học',
    provider: 'Coursera (Wharton)',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=240&fit=crop',
    description: 'Hiểu nền tảng tài chính, đầu tư, quản lý rủi ro từ trường kinh doanh hàng đầu Mỹ.',
    url: 'https://www.coursera.org/specializations/wharton-business-foundations',
    tags: ['Kinh tế', 'Tài chính', 'Quốc tế'],
    isFree: true,
    level: 'Cơ bản'
  },
  {
    id: 'r-mbbank-academy',
    title: 'MB Bank Academy — Học viện ngân hàng số',
    category: 'Tổ chức',
    provider: 'MB Bank',
    image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=240&fit=crop',
    description: 'Tài liệu & workshop miễn phí về tài chính, ngân hàng số, fintech từ MB Bank.',
    url: 'https://www.mbbank.com.vn/',
    tags: ['Tài chính', 'Ngân hàng', 'Miễn phí'],
    isFree: true,
    level: 'Mọi cấp độ'
  },

  // ── KHỐI NGÀNH Y ───────────────────────────────────────
  {
    id: 'r-khan-med',
    title: 'Y khoa & Sức khoẻ — Khan Academy',
    category: 'Video',
    provider: 'Khan Academy',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=240&fit=crop',
    description: 'Video bài giảng Y khoa miễn phí, minh hoạ sinh động, dễ hiểu bằng tiếng Anh.',
    url: 'https://www.khanacademy.org/science/health-and-medicine',
    tags: ['Y khoa', 'Tiếng Anh', 'Miễn phí'],
    isFree: true,
    level: 'Cơ bản'
  },
  {
    id: 'r-who',
    title: 'Tổ chức Y tế Thế giới — WHO',
    category: 'Tổ chức',
    provider: 'WHO',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=240&fit=crop',
    description: 'Nguồn thông tin y tế, sức khoẻ uy tín nhất thế giới từ WHO. Đáng tin cậy #1.',
    url: 'https://www.who.int/',
    tags: ['Y khoa', 'Sức khoẻ', 'Quốc tế'],
    isFree: true,
    level: 'Mọi cấp độ'
  },

  // ── TÀI LIỆU HƯỚNG NGHIỆP ─────────────────────────────
  {
    id: 'r-bo-y-te',
    title: 'Bộ Y tế Việt Nam',
    category: 'Tổ chức',
    provider: 'Bộ Y tế VN',
    image: 'https://images.unsplash.com/photo-1584467735867-4297ae2ebcdc?w=400&h=240&fit=crop',
    description: 'Cổng thông tin Bộ Y tế Việt Nam — chính sách, tin tức, tài liệu chính thống.',
    url: 'https://moh.gov.vn/',
    tags: ['Y tế', 'Việt Nam', 'Chính thống'],
    isFree: true,
    level: 'Mọi cấp độ'
  },
  {
    id: 'r-moet',
    title: 'Bộ Giáo dục & Đào tạo',
    category: 'Tổ chức',
    provider: 'Bộ GD&ĐT',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=240&fit=crop',
    description: 'Cổng thông tin Bộ GD&ĐT — quy chế tuyển sinh, tài liệu hướng nghiệp, đề thi minh hoạ.',
    url: 'https://moet.gov.vn/',
    tags: ['Giáo dục', 'Tuyển sinh', 'Việt Nam'],
    isFree: true,
    level: 'Mọi cấp độ'
  },

  // ── CÔNG CỤ HỌC TẬP ──────────────────────────────────
  {
    id: 'r-coccoc',
    title: 'Cốc Cốc — Tra cứu nhanh',
    category: 'Công cụ',
    provider: 'Cốc Cốc',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop',
    description: 'Trình duyệt & công cụ tìm kiếm tiếng Việt, tra cứu thông tin nhanh chóng.',
    url: 'https://coccoc.com/',
    tags: ['Công cụ', 'Tiếng Việt', 'Miễn phí'],
    isFree: true,
    level: 'Mọi cấp độ'
  },
  {
    id: 'r-youtube-edu',
    title: 'Kênh YouTube Giáo dục VN',
    category: 'Video',
    provider: 'YouTube',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=240&fit=crop',
    description: 'Tổng hợp các kênh YouTube giáo dục uy tín: Thầy Vũ, Thầy Hiếu, 2K, ...',
    url: 'https://www.youtube.com/results?search_query=luyện+thi+THPT+2026',
    tags: ['Video', 'Tiếng Việt', 'Miễn phí'],
    isFree: true,
    level: 'Mọi cấp độ'
  }
];

/* Hàm render resource ra HTML — gọi từ resources.html */
function renderResourceCard(r) {
  const isFree = r.isFree
    ? '<span class="res-badge res-badge-free">Miễn phí</span>'
    : '<span class="res-badge res-badge-paid">Trả phí</span>';
  const level = r.level ? `<span class="res-level">${r.level}</span>` : '';
  const tags = (r.tags || []).slice(0, 3).map(t => `<span class="res-tag">#${t}</span>`).join('');
  const safeTitle = (r.title || '').replace(/"/g, '&quot;');
  const safeUrl = (r.url || '#').replace(/"/g, '&quot;');

  return `
    <article class="res-card" data-category="${r.category}" data-id="${r.id}">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="res-thumb">
        <img src="${r.image}" alt="${safeTitle}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x240/eef0ff/6675e3?text=Resource'" />
        <span class="res-cat">${r.category}</span>
        ${isFree}
      </a>
      <div class="res-body">
        <h3 class="res-title"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${r.title}</a></h3>
        <p class="res-provider">📚 ${r.provider}</p>
        <p class="res-desc">${r.description}</p>
        <div class="res-tags">${tags}</div>
        <div class="res-foot">
          ${level}
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="res-btn">
            TÌM HIỂU THÊM →
          </a>
        </div>
      </div>
    </article>
  `;
}
