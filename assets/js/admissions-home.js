/* Published admission stories can lead the homepage; verified school notices remain a fallback. */
(function () {
  'use strict';
  const grid = document.getElementById('admissionsHighlights');
  if (!grid || !window.CMS) return;
  const original = [...grid.children].map(card => card.outerHTML);
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const admissions = /tuyển sinh|xét tuyển|điểm chuẩn|nguyện vọng|nhập học|học bổng|tổ hợp/i;
  const placeholder = '/assets/images/waybi/waybi-ui-192.webp';
  function cover(value) {
    if (!value) return placeholder;
    try { const url = new URL(value, location.href); return /^https?:$/.test(url.protocol) ? url.href : placeholder; }
    catch { return placeholder; }
  }
  function card(post) {
    const href = 'news-detail.html?slug=' + encodeURIComponent(post.slug);
    const date = post.published_at ? new Date(post.published_at) : null;
    const label = (Number(post.views_count) || 0) > 0 ? 'Được quan tâm' : 'Bài tuyển sinh';
    const image = cover(post.cover_image);
    return `<article class="admissions-news-card">
      <a class="admissions-news-photo ${image === placeholder ? 'admissions-news-placeholder' : ''}" href="${href}" tabindex="-1" aria-hidden="true"><img src="${escape(image)}" alt="" width="700" height="438" loading="lazy" onerror="this.onerror=null;this.parentNode.classList.add('admissions-news-placeholder');this.src='${placeholder}'"><span class="admissions-news-badge">${label}</span></a>
      <div class="admissions-news-body"><span class="admissions-news-school">BrightWay${!date || Number.isNaN(date.getTime()) ? '' : ' · ' + date.toLocaleDateString('vi-VN')}</span>
        <h3><a href="${href}">${escape(post.title)}</a></h3><p>${escape(post.summary)}</p>
        <div class="admissions-news-links"><a href="${href}">Đọc bài viết →</a><a href="page2.html">Tra cứu trường →</a></div>
      </div>
    </article>`;
  }
  async function load() {
    let timer;
    try {
      const posts = await Promise.race([
        CMS.listPublishedPosts({limit:100}),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Timeout')), 8000); })
      ]);
      const cutoff = Date.now() - 180 * 86400000;
      const relevant = posts.filter(p => {
        const published = Date.parse(p.published_at || p.created_at);
        return p.slug && p.status === 'published' && published >= cutoff && published <= Date.now() && admissions.test([p.title,p.summary].join(' '));
      })
        .sort((a,b) => (Number(b.views_count)||0) - (Number(a.views_count)||0) || new Date(b.published_at) - new Date(a.published_at))
        .slice(0,2);
      if (relevant.length) grid.innerHTML = [...relevant.map(card), ...original].slice(0,3).join('');
    } catch { /* School notices are visible even if the CMS is unavailable. */ }
    finally { clearTimeout(timer); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
