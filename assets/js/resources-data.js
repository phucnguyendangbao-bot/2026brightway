/* Shared public library: external resources and published articles. */
const FALLBACK_RESOURCES = [{
  title: 'CS50 — Nhập môn khoa học máy tính', category: 'Khóa học',
  provider: 'Harvard OpenCourseWare', image: '/assets/images/waybi/waybi-ui-192.webp',
  description: 'Bài giảng và bài tập nhập môn khoa học máy tính. Chứng chỉ xác minh có thể tính phí riêng.',
  url: 'https://cs50.harvard.edu/x/', tags: ['CNTT', 'Lập trình'], is_free: true, level: 'Cơ bản'
}];
function resourceEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function resourceUrl(value) {
  try {
    const url = new URL(value, location.href);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '#';
  } catch { return '#'; }
}
function renderResourceCard(r) {
  const article = r.kind === 'post';
  const url = article ? 'news-detail.html?slug=' + encodeURIComponent(r.slug) : resourceUrl(r.url);
  const external = article ? '' : 'target="_blank" rel="noopener noreferrer"';
  const image = resourceEscape(resourceUrl(r.image || '/assets/images/waybi/waybi-ui-192.webp'));
  const badge = article ? '<span class="res-badge res-badge-free">Bài viết</span>'
    : r.is_free === true ? '<span class="res-badge res-badge-free">Miễn phí</span>'
    : r.is_free === false ? '<span class="res-badge res-badge-paid">Trả phí</span>' : '';
  return `<article class="res-card" data-category="${resourceEscape(r.category)}">
    <a href="${resourceEscape(url)}" ${external} class="res-thumb">
      <img src="${image}" alt="${resourceEscape(r.title)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/waybi/waybi-ui-192.webp'">
      <span class="res-cat">${resourceEscape(r.category)}</span>${badge}
    </a>
    <div class="res-body">
      <h3 class="res-title"><a href="${resourceEscape(url)}" ${external}>${resourceEscape(r.title)}</a></h3>
      <p class="res-provider">${resourceEscape(r.provider)}</p>
      <p class="res-desc">${resourceEscape(r.description)}</p>
      <div class="res-tags">${(r.tags || []).slice(0,3).map(t => `<span class="res-tag">#${resourceEscape(t)}</span>`).join('')}</div>
      <div class="res-foot"><span class="res-level">${resourceEscape(r.level)}</span><a href="${resourceEscape(url)}" ${external} class="res-btn">${article ? 'Đọc bài viết' : 'Xem nguồn'} →</a></div>
    </div>
  </article>`;
}
async function libraryRequest(request) {
  let timer;
  try {
    return await Promise.race([
      request(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Quá thời gian chờ')), 8000); })
    ]);
  } finally { clearTimeout(timer); }
}
async function loadResources() {
  return libraryRequest(() => CMS.listResources({ onlyPublished:true }));
}
async function loadLibraryPosts() {
  const rows = await libraryRequest(() => CMS.listPublishedPosts({ limit:100 }));
  return rows.map(p => ({ ...p, kind:'post', category:'Bài viết', description:p.summary,
    provider:CMS.categoryLabel(p.category), image:p.cover_image, tags:[], level:CMS.formatDate(p.published_at) }));
}
