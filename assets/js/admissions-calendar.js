import policy from '../data/admissions-policy.js';
import { officialEvents, nextOfficialEvent } from './calendar-rules.js';

const categories = {
  thi: { color: '#ef4444', icon: '📝' },
  nop: { color: '#f59e0b', icon: '📤' },
  cbt: { color: '#3b82f6', icon: '📊' },
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selector = document.getElementById('calendarYear');
const format = date => new Date(date).toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

function selectedEvents() {
  return officialEvents(policy, selector.value);
}
function render() {
  const year = Number(selector.value);
  const events = selectedEvents();
  document.querySelector('.cal-tag').textContent = year === 2026
    ? 'Lịch tuyển sinh 2026 · Dữ liệu tham khảo'
    : 'Chuẩn bị tuyển sinh 2027';
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const byDate = {};
  events.forEach(event => (byDate[event.d] ||= []).push(event));
  document.getElementById('calendarYearNote').textContent = year === 2026
    ? 'Lịch chung 2026 đã đối chiếu Quyết định 3037 và Công văn 1257. Mốc riêng của trường cần xem thông báo trường. Các mốc đã qua được giữ để tra cứu.'
    : 'Chuẩn bị tuyển sinh 2027: chưa có lịch chính thức 2027 trong bộ nguồn đã kiểm tra. Theo dõi thông báo mới; dự thảo đang lấy ý kiến chưa được áp dụng.';
  for (const [hostId, mini] of [['grid', false], ['wbMiniGrid', true]]) {
    const host = document.getElementById(hostId);
    host.innerHTML = '';
    for (let month = 0; month < 12; month++) {
      const first = new Date(year, month, 1).getDay();
      const count = new Date(year, month + 1, 0).getDate();
      const isCurrent = today.startsWith(year + '-' + String(month + 1).padStart(2, '0'));
      let days = ('<div class="' + (mini ? 'wb-d' : 'cal-m-day') + ' empty"></div>').repeat(first);
      for (let day = 1; day <= count; day++) {
        const key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        const rows = byDate[key] || [];
        const category = rows.length ? categories[rows[0].cat] : null;
        const base = mini ? 'wb-d' : 'cal-m-day';
        const dow = new Date(year, month, day).getDay();
        const classes = base + (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '') +
          (key === today ? ' today' : '') + (rows.length ? mini ? ' has' : ' has-event' : '');
        const tip = rows.length ? '<div class="' + (mini ? 'wb-d-tip' : 'cal-m-tip') + '">' +
          rows.map(row => '<strong>' + escape(row.title) + '</strong><br>' + escape(row.sub)).join('<br>') + '</div>' : '';
        days += '<div class="' + classes + '"' + (category ? ' style="--ev-color:' + category.color + '"' : '') + '>' + day + tip + '</div>';
      }
      const card = document.createElement('div');
      card.className = mini ? 'wb-m' : 'cal-m';
      const head = mini ? 'wb-m-head' : 'cal-m-head';
      const weeks = mini ? '' : '<div class="cal-m-week">' + ['CN','T2','T3','T4','T5','T6','T7'].map(w => '<div>' + w + '</div>').join('') + '</div>';
      card.innerHTML = '<div class="' + head + '">' + (isCurrent ? '<span class="' + (mini ? 'wb-m-cur' : 'cal-m-current') + '">HIỆN TẠI</span>' : '') +
        'Tháng ' + (month + 1) + ' / ' + year + '</div>' + weeks + '<div class="' + (mini ? 'wb-m-body' : 'cal-m-body') + '">' + days + '</div>';
      host.appendChild(card);
    }
  }
  document.getElementById('calendarEventList').innerHTML = events.length
    ? '<h2>Mốc chính thức và nguồn đối chiếu · ' + year + '</h2>' + events.map(event =>
      '<article class="policy-event" data-event-date="' + event.d + '"><div><strong>' + escape(event.title) +
      '</strong><p><time datetime="' + event.at + '">' + format(event.at) + ' (giờ Việt Nam)</time> · ' +
      (new Date(event.at) < now ? 'Đã qua' : 'Sắp tới') + '</p><p>' + escape(event.sub) +
      '</p><p>Đã đối chiếu nguồn: ' + escape(event.verified_at) + ' · Chính thức ' + year + '</p></div><a href="' + event.source_url + '" target="_blank" rel="noopener noreferrer">Nguồn chính thức ↗</a></article>').join('')
    : '<h2>Chuẩn bị 2027</h2><p>Các mốc sẽ được bổ sung khi có văn bản chính thức.</p><a href="resources.html#policy-sources">Xem văn bản 2027 và trạng thái áp dụng →</a>';
  updateCountdown();
}
function updateCountdown() {
  const now = Date.now();
  const next = nextOfficialEvent(policy, selector.value, now);
  const timer = document.querySelector('.cal-countdown-timer');
  document.querySelector('.cal-countdown-label').textContent = next ? 'Sắp tới' : 'Trạng thái';
  timer.hidden = !next;
  timer.style.display = next ? '' : 'none';
  document.getElementById('cdTitle').textContent = next ? next.title : selector.value === '2026'
    ? 'Các mốc chung 2026 đã kết thúc' : 'Đang chờ lịch tuyển sinh 2027';
  document.getElementById('cdDate').textContent = next ? format(next.at) + ' (giờ Việt Nam)'
    : 'Chọn năm để tra cứu; mốc 2026 không được chuyển sang 2027.';
  if (!next) return;
  const delta = Date.parse(next.at) - now;
  for (const [id, value] of [
    ['cdDays', Math.floor(delta / 86400000)],
    ['cdHours', Math.floor(delta % 86400000 / 3600000)],
    ['cdMins', Math.floor(delta % 3600000 / 60000)],
  ]) document.getElementById(id).textContent = String(value).padStart(2, '0');
}
const requestedYear = new URLSearchParams(location.search).get('year');
selector.value = requestedYear === '2026' ? '2026' : '2027';
selector.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('year', selector.value);
  history.replaceState(null, '', url);
  render();
});
render();
setInterval(updateCountdown, 60000);
