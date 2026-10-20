import { featuredUniversityIds, universityShowcaseImages, universityPartners, universityCampaigns, universityOpportunities } from '../data/university-promotions.js';
import { buildUniversityCatalog } from '../data/university-identities.js';
import sourceRegistry from '../data/school-admissions-sources.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { relevantPrograms, officialUniversityUrl, eligibleOpportunity, verifiedSponsorship, selectSponsoredCampaigns, selectEditorialOpportunities } from './university-promotion-rules.js';
import { universityCardHTML, renderUniversityLogo, escapeUniversity as escape } from './university-card.js';
import { promotionMetrics } from './university-promotion-metrics.js';

const profile = school => ({ ...school, programs:detailsForSchool(school.id)?.programs || [] });
const observers = new Map();
const consultationRecords = new Map();
let consultationDialog;

export function cleanupPromotionHosts(root) {
  for (const [host, cleanup] of observers) {
    if (host === root || root.contains(host)) { cleanup(); observers.delete(host); }
  }
}

function metricsInput(card, action) {
  return { schoolId:card.dataset.school, contentId:card.dataset.content, placement:card.dataset.placement, action };
}

function wireCards(host, schools, records = []) {
  observers.get(host)?.();
  const timers = new Map();
  const cards = [...host.querySelectorAll('[data-promotion-card]')];
  cards.forEach(card => {
    const school = schools.find(item => item.id === card.dataset.school);
    if (school) renderUniversityLogo(card.querySelector('[data-university-logo]'), school);
  });
  records.forEach(record => {
    const school = schools.find(item => item.id === record.schoolId);
    if (record.kind === 'consultation' && school) consultationRecords.set(record.id, {record, school});
  });
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      clearTimeout(timers.get(entry.target));
      if (promotionMetrics.consent && entry.intersectionRatio >= .5 && document.visibilityState === 'visible') {
        timers.set(entry.target, setTimeout(() => {
          if (document.visibilityState === 'visible') promotionMetrics.record(metricsInput(entry.target, 'impression'));
        }, 1000));
      }
    });
  }, {threshold:[0,.5]}) : null;
  const refresh = () => {
    observer?.disconnect(); timers.forEach(clearTimeout); timers.clear();
    if (promotionMetrics.consent && document.visibilityState === 'visible') cards.forEach(card => observer?.observe(card));
  };
  const click = event => {
    const consultation = event.target.closest('[data-open-university-consultation]');
    if (consultation) { openConsultation(consultation.dataset.openUniversityConsultation, consultation.closest('[data-promotion-card]')); return; }
    const action = event.target.closest('[data-promotion-action]');
    if (action) promotionMetrics.record(metricsInput(action.closest('[data-promotion-card]'), 'click'));
  };
  host.addEventListener('click', click);
  document.addEventListener('bw:promotion-consent', refresh);
  document.addEventListener('visibilitychange', refresh);
  observers.set(host, () => {
    observer?.disconnect(); timers.forEach(clearTimeout);
    host.removeEventListener('click', click);
    document.removeEventListener('bw:promotion-consent', refresh);
    document.removeEventListener('visibilitychange', refresh);
  });
  refresh();
}

export function promotionPrivacyHTML() {
  return `<details class="university-transparency"><summary>Giới thiệu trường, tài trợ & quyền riêng tư</summary>
    <p>Trường nổi bật là lựa chọn biên tập, không phải xếp hạng hay quan hệ đối tác. Nếu có vị trí trả phí đã xác minh, từng thẻ sẽ ghi “Được tài trợ”. Tài trợ không tác động kết quả Holland, điểm xét tuyển, tiêu chí phù hợp hoặc thứ tự tra cứu tự nhiên.</p>
    <p>Không có biểu mẫu thu thông tin liên hệ tại đây. Chỉ khi chủ động tiếp tục, bạn mới sang kênh của trường; BrightWay không gửi tên, số điện thoại, email, điểm hay mã Holland.</p>
    <label><input type="checkbox" data-promotion-consent> Cho phép đếm lượt xem/bấm không định danh trong bộ nhớ của trang này.</label>
    <p data-promotion-consent-status role="status">Mặc định tắt. Chưa gửi thống kê cho trường hoặc đối tác. Bỏ chọn sẽ xóa bộ đếm; tải lại trang cần chọn lại. Tín hiệu không theo dõi của trình duyệt được tôn trọng.</p></details>`;
}

export function bindPromotionPrivacy(host) {
  const checkbox = host.querySelector('[data-promotion-consent]');
  if (!checkbox) return;
  const protectedBrowser = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  checkbox.disabled = protectedBrowser;
  checkbox.checked = promotionMetrics.consent;
  if (protectedBrowser) host.querySelector('[data-promotion-consent-status]').textContent = 'Trình duyệt đang yêu cầu không theo dõi. Bộ đếm bị tắt; bạn vẫn dùng được mọi liên kết.';
  checkbox.addEventListener('change', () => {
    checkbox.checked = promotionMetrics.setConsent(checkbox.checked);
    host.querySelector('[data-promotion-consent-status]').textContent = checkbox.checked
      ? 'Đã bật bộ đếm không định danh cho trang này; chưa gửi ra ngoài. Không ghi từ khóa, hồ sơ, điểm hay thông tin liên hệ.'
      : 'Đã tắt và xóa bộ đếm. Mọi liên kết vẫn hoạt động.';
    document.dispatchEvent(new Event('bw:promotion-consent'));
  });
}

function openConsultation(id, card) {
  const item = consultationRecords.get(id);
  if (!item || !eligibleOpportunity(item.record, item.school)) return;
  if (item.record.funding === 'sponsored' && !verifiedSponsorship(item.record, universityPartners)) return;
  const url = officialUniversityUrl(item.record.consultationUrl, item.school);
  if (!url) return;
  if (!consultationDialog) {
    consultationDialog = document.createElement('dialog');
    consultationDialog.className = 'university-consultation-dialog';
    consultationDialog.setAttribute('aria-labelledby', 'universityConsultationTitle');
    document.body.appendChild(consultationDialog);
  }
  consultationDialog.innerHTML = `<h2 id="universityConsultationTitle">Kết nối với ${escape(item.school.name)}</h2><p>Bạn sắp mở <strong>${escape(new URL(url).hostname)}</strong>. Nếu tự điền thông tin tại đó, trường sẽ xử lý theo chính sách riêng; hãy đọc chính sách trước khi gửi. BrightWay không điền sẵn hoặc chuyển dữ liệu liên hệ của bạn.</p><p>Mở kênh tư vấn không đồng nghĩa đăng ký đã hoàn tất.</p><label><input type="checkbox" data-consultation-confirm> Tôi chủ động mở kênh của trường và hiểu thông tin trên.</label><div class="university-card-actions"><button type="button" data-consultation-cancel>Ở lại BrightWay</button><a href="${escape(url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-consultation-continue hidden>Tiếp tục trên website trường ↗</a></div>`;
  const confirm = consultationDialog.querySelector('[data-consultation-confirm]');
  const link = consultationDialog.querySelector('[data-consultation-continue]');
  confirm.addEventListener('change', () => { link.hidden = !confirm.checked; });
  consultationDialog.querySelector('[data-consultation-cancel]').addEventListener('click', () => consultationDialog.close());
  link.addEventListener('click', event => {
    if (!confirm.checked) { event.preventDefault(); return; }
    promotionMetrics.record(metricsInput(card, 'consultation_interest'));
    consultationDialog.close();
  });
  consultationDialog.showModal();
}

function renderGroup(host, schools, records, placement) {
  host.innerHTML = records.map(record => {
    const school = schools.find(item => item.id === record.schoolId);
    return universityCardHTML(school, { placement, campaign:record });
  }).join('');
  wireCards(host, schools, records);
}

export function renderContextualUniversityPromotions(host, catalog, {mode, query, region} = {}) {
  if (!host) return;
  const schools = catalog.map(profile);
  const relevant = mode === 'major' && query?.trim() ? schools.filter(school => (!region || school.city === region) && relevantPrograms(school, query).length) : [];
  const sponsored = relevant.length ? selectSponsoredCampaigns(universityCampaigns, universityPartners, schools, {placement:'major_context', query, region}) : [];
  const editorial = relevant.slice(0,2);
  host.hidden = !editorial.length && !sponsored.length;
  if (host.hidden) { observers.get(host)?.(); host.replaceChildren(); return; }
  host.innerHTML = `<header class="university-discovery-heading"><div><span class="university-eyebrow">KHÁM PHÁ THEO NGÀNH</span><h2>Cơ hội liên quan đến ngành bạn đang tìm</h2><p>Giới thiệu theo tên ngành có trong dữ liệu 2026, không phải điểm phù hợp cá nhân. Kết quả tự nhiên bên dưới không thay đổi theo tài trợ.</p></div></header><div class="university-context-grid">${editorial.map(school => universityCardHTML(school, {placement:'major_context', programs:relevantPrograms(school, query)})).join('')}${sponsored.map(record => universityCardHTML(schools.find(school => school.id === record.schoolId), {placement:'major_context', campaign:record, programs:relevantPrograms(schools.find(school => school.id === record.schoolId), query)})).join('')}</div>`;
  wireCards(host, schools, sponsored);
}

export function renderSchoolOpportunities(host, school) {
  const schools = [profile(school)];
  const records = [...selectEditorialOpportunities(universityOpportunities, schools), ...selectSponsoredCampaigns(universityCampaigns, universityPartners, schools, {placement:'school_profile'})];
  host.innerHTML = records.length ? '<div class="university-opportunity-grid"></div>' : '<p>Chưa có thông tin học bổng, sự kiện hoặc kênh tư vấn đã đối chiếu trong khu giới thiệu này. Không có thông tin không đồng nghĩa trường không có hoạt động; xem website chính thức của trường.</p>';
  if (records.length) renderGroup(host.querySelector('.university-opportunity-grid'), schools, records, 'school_profile');
}

async function initUniversityDiscovery() {
  const host = document.getElementById('university-discovery');
  if (!host) return;
  const status = host.querySelector('[data-university-discovery-status]');
  const retry = host.querySelector('[data-university-discovery-retry]');
  retry.hidden = true;
  try {
    const response = await fetch('/assets/data/schools.json', {signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const schools = buildUniversityCatalog(await response.json(), sourceRegistry.universities).schools.map(profile);
    const featured = featuredUniversityIds.map(id => schools.find(school => school.id === id)).filter(Boolean);
    const featuredHost = host.querySelector('[data-featured-universities]');
    featuredHost.innerHTML = featured.map(school => universityCardHTML(school, {image:universityShowcaseImages[school.id], programs:school.programs})).join('');
    wireCards(featuredHost, schools);
    const paid = selectSponsoredCampaigns(universityCampaigns, universityPartners, schools, {placement:'home_featured'});
    const paidHost = host.querySelector('[data-sponsored-universities]');
    paidHost.hidden = !paid.length;
    renderGroup(paidHost, schools, paid, 'home_featured');
    const opportunities = selectEditorialOpportunities(universityOpportunities, schools).slice(0,3);
    renderGroup(host.querySelector('[data-university-opportunities]'), schools, opportunities, 'home_opportunity');
    status.textContent = 'Lựa chọn biên tập để khám phá, không phải bảng xếp hạng hay danh sách đối tác. Học bổng và tuyển sinh cũ được ghi rõ là tư liệu.';
  } catch (error) {
    status.textContent = 'Chưa tải được khu giới thiệu trường. Bạn vẫn có thể mở thư viện trường; hãy thử tải lại khu này.';
    retry.hidden = false;
    console.warn('[university discovery]', error.message);
  }
  retry.onclick = initUniversityDiscovery;
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-university-privacy]').forEach(host => { host.innerHTML = promotionPrivacyHTML(); bindPromotionPrivacy(host); });
  initUniversityDiscovery();
}
