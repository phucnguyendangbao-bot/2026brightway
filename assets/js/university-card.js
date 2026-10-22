import { officialUniversityUrl } from './university-promotion-rules.js';
export const escapeUniversity = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeAsset = path => typeof path === 'string' && /^assets\/images\/[a-zA-Z0-9/_-]+\.(?:png|jpg|jpeg|webp|svg)$/.test(path) ? path : '';

export function universityIdentityHTML(school, { logoId, titleTag = 'h3', interactive = false } = {}) {
  const tag = titleTag === 'h2' ? 'h2' : 'h3';
  const logo = interactive
    ? `<button type="button" class="school-icon" id="${escapeUniversity(logoId)}" data-university-logo="${escapeUniversity(school.id)}" data-action="open-school" data-school-id="${escapeUniversity(school.id)}" aria-label="Xem ngành, điểm chuẩn và đề án tuyển sinh của ${escapeUniversity(school.name)}"></button>`
    : `<span class="school-icon" data-university-logo="${escapeUniversity(school.id)}"></span>`;
  return `<div class="school-card-top">${logo}<div class="school-card-identity"><span class="school-card-kicker">${escapeUniversity(school.short || 'ĐẠI HỌC')} · ${escapeUniversity(school.city)}</span><${tag} class="school-name">${escapeUniversity(school.name)}</${tag}></div></div>`;
}

export function renderUniversityLogo(host, school, size = 60) {
  if (!host) return;
  host.replaceChildren();
  const registry = window.UNILogo?.(school.short || school.name);
  const sources = [safeAsset(school.logoUrl), safeAsset(registry?.logoLocal)].filter(Boolean);
  const fallback = () => {
    const badge = document.createElement('span');
    badge.className = 'school-icon-fallback';
    badge.textContent = school.short || school.name.slice(0, 2);
    host.replaceChildren(badge);
  };
  if (!sources.length) { fallback(); return; }
  const image = document.createElement('img');
  image.alt = ''; image.loading = 'lazy'; image.width = size; image.height = size;
  let index = 0;
  image.onerror = () => { index++; if (index < sources.length) image.src = sources[index]; else fallback(); };
  image.src = sources[0]; host.appendChild(image);
}

export function universityCardHTML(school, { image, programs = [], placement = 'home_featured', campaign = null } = {}) {
  const sponsored = campaign?.funding === 'sponsored';
  const contentId = campaign?.id || `featured-${school.id}`;
  const source = officialUniversityUrl(campaign?.sourceUrl || school.official_source || school.website, school);
  const cover = safeAsset(image);
  const responsiveCover = ['assets/images/hero/01-fpt-can-tho.jpg','assets/images/hero/16-uit-campus.png','assets/images/hero/17-tdtu-campus.png'].includes(cover)
    ? cover.replace(/\.(?:jpg|png)$/, '') : '';
  const responsiveAttributes = responsiveCover ? ` srcset="${responsiveCover}-640.webp 640w, ${responsiveCover}-1280.webp 1280w" sizes="(max-width:600px) calc(100vw - 32px), (max-width:1000px) 50vw, 440px"` : '';
  return `<article class="university-card ${sponsored ? 'university-card-sponsored' : ''}" data-promotion-card data-school="${escapeUniversity(school.id)}" data-content="${escapeUniversity(contentId)}" data-placement="${escapeUniversity(placement)}">
    ${cover ? `<a class="university-card-cover" href="page2.html?school=${encodeURIComponent(school.id)}" data-promotion-action="click" aria-label="Khám phá ${escapeUniversity(school.name)}"><img src="${cover}"${responsiveAttributes} alt="${escapeUniversity(school.id === 'fpt' ? 'Không gian học tập FPT từ bộ ảnh hiện có' : 'Khuôn viên ' + school.name)}" loading="lazy" decoding="async" width="700" height="438"></a>` : ''}
    <div class="university-card-body"><span class="university-placement-label ${sponsored ? 'is-sponsored' : ''}">${sponsored ? 'Được tài trợ' : 'Biên tập giới thiệu · Không tài trợ'}</span>
    ${universityIdentityHTML(school)}
    ${campaign ? `<h4>${escapeUniversity(campaign.title)}</h4><p>${escapeUniversity(campaign.description)}</p>` : '<p>Khám phá chương trình đào tạo, nguồn tuyển sinh và những điều cần đối chiếu trước khi chọn trường.</p>'}
    ${campaign ? `<p class="university-source-meta">${escapeUniversity(({scholarship:'Học bổng',admissions:'Tuyển sinh',event:'Sự kiện',consultation:'Tư vấn'})[campaign.kind])} · ${campaign.availability === 'reference' ? 'Tư liệu đã công bố · không xác nhận còn mở' : campaign.kind === 'event' ? 'Thời gian: ' + escapeUniversity(campaign.eventAt) : 'Kiểm tra điều kiện tại trường'}<br>Đối chiếu nguồn: ${escapeUniversity(campaign.verifiedAt)}</p>` : '<p class="university-source-meta">Một số ngành trong dữ liệu 2026; không phải bảng xếp hạng hoặc kết luận phù hợp.</p>'}
    ${programs.length ? `<ul class="university-program-preview" aria-label="${placement === 'major_context' ? 'Ngành khớp từ khóa' : 'Một số ngành trong dữ liệu 2026'}">${programs.slice(0,3).map(program => `<li>${escapeUniversity(program.name)}</li>`).join('')}</ul>` : ''}
    <div class="university-card-actions"><a href="page2.html?school=${encodeURIComponent(school.id)}" data-promotion-action="click">Xem hồ sơ →</a>${source ? `<a href="${escapeUniversity(source)}" target="_blank" rel="noopener noreferrer${sponsored ? ' sponsored' : ''}" referrerpolicy="no-referrer" data-promotion-action="click">Nguồn trường ↗</a>` : ''}${campaign?.kind === 'consultation' ? `<button type="button" data-open-university-consultation="${escapeUniversity(campaign.id)}">Xem kênh tư vấn ↗</button>` : ''}</div></div></article>`;
}
