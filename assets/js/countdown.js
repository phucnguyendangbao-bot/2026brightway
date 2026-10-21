import { COUNTDOWN_VERSION, DEFAULT_TIMEZONE, REMINDER_OPTIONS, normalizeCountdowns, normalizeCountdownItem, calendarDayDifference, countdownLabel, milestoneProgress, timeProgress, viewState, nextCountdown, shouldRemind, exportCountdowns } from './countdown-model.js';
import { EXAM_CATALOG, schedulesFor } from '../data/exam-schedules.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const vietnameseDate = value => {
  const parts = String(value || '').split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
};
const uid = () => globalThis.crypto?.randomUUID?.() || `countdown-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
let flow, manager, widget, filter = 'upcoming', editingId = '';

function data() { return normalizeCountdowns(flow.read().countdowns); }
function store(next) { return flow.save({ countdowns: normalizeCountdowns(next) }); }
function updateItems(items) { store({ version: COUNTDOWN_VERSION, items }); }
function sourceBadge(item) {
  if (item.scheduleStatus === 'official') return '<span class="countdown-badge is-official">Lịch chính thức</span>';
  if (item.scheduleStatus === 'changed') return '<span class="countdown-badge is-changed">Lịch đã cập nhật</span>';
  return '<span class="countdown-badge is-tentative">Mốc dự kiến của bạn</span>';
}
function reminderText(item, now = new Date()) {
  const days = calendarDayDifference(item.targetDate, now, item.timezone);
  if (!Number.isInteger(days) || item.status !== 'active') return '';
  if (shouldRemind(item, now)) return `<strong class="countdown-alert">Đã đến mốc nhắc ${days === 0 ? 'hôm nay' : `${days} ngày trước hạn`}.</strong>`;
  return '';
}
function progressHTML(item, compact = false) {
  const milestone = milestoneProgress(item);
  if (milestone) return `<div class="countdown-progress"><div><span>Mốc hoàn thành</span><strong>${milestone.completed}/${milestone.total}</strong></div><progress max="100" value="${milestone.percent}" aria-label="Đã hoàn thành ${milestone.completed} trên ${milestone.total} mốc"></progress></div>`;
  const time = timeProgress(item);
  if (compact && time) return `<div class="countdown-progress"><div><span>Thời gian từ lúc tạo đến hạn</span><strong>${time.percent}%</strong></div><progress max="100" value="${time.percent}" aria-label="${time.percent}% thời gian từ lúc tạo đến hạn đã trôi qua"></progress></div>`;
  return '';
}
function itemCard(item, compact = false) {
  const days = calendarDayDifference(item.targetDate, new Date(), item.timezone);
  const state = viewState(item);
  const statusText = item.status === 'paused' ? 'Đang tạm dừng' : state === 'completed' ? 'Đã hoàn thành' : countdownLabel(days);
  return `<article class="countdown-card ${item.pinned ? 'is-pinned' : ''} ${state === 'overdue' ? 'is-overdue' : ''}" data-countdown-id="${esc(item.id)}">
    <div class="countdown-card-heading"><div>${sourceBadge(item)}${item.pinned ? '<span class="countdown-badge">Đã ghim</span>' : ''}<h3>${esc(item.name)}</h3></div><strong class="countdown-days">${esc(statusText)}</strong></div>
    <p class="countdown-date">${vietnameseDate(item.targetDate)} · ${esc(item.timezone)}</p>
    ${item.description && !compact ? `<p>${esc(item.description)}</p>` : ''}${reminderText(item)}${progressHTML(item, compact)}
    ${item.sourceURL ? `<p class="countdown-source"><a href="${esc(item.sourceURL)}" target="_blank" rel="noopener noreferrer">Nguồn chính thức ↗</a>${item.sourceDate ? ` · kiểm tra ${vietnameseDate(item.sourceDate)}` : ''}</p>` : ''}
    ${compact ? '' : `<div class="countdown-card-actions"><button type="button" data-countdown-action="edit">Sửa</button><button type="button" data-countdown-action="${item.status === 'paused' ? 'resume' : 'pause'}">${item.status === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}</button><button type="button" data-countdown-action="${item.status === 'completed' ? 'reopen' : 'complete'}">${item.status === 'completed' ? 'Mở lại' : 'Hoàn thành'}</button><button type="button" data-countdown-action="pin">${item.pinned ? 'Bỏ ghim' : 'Ghim trang chủ'}</button><button type="button" data-countdown-action="delete" class="is-danger">Xóa</button></div>`}
  </article>`;
}

function renderWidget() {
  if (!widget) return;
  const item = nextCountdown(data().items);
  widget.innerHTML = `<div class="countdown-widget-heading"><div><span class="flow-kicker">BRIGHTWAY COUNTDOWN</span><h2 id="countdownWidgetTitle">Mục tiêu sắp tới</h2></div><a href="profile.html?tab=journey#countdowns">Xem tất cả →</a></div>${item ? itemCard(item, true) : '<div class="countdown-empty"><p>Chưa có mốc nào trên thiết bị này.</p><a href="profile.html?tab=journey#countdowns">Tạo mục tiêu đầu tiên →</a></div>'}`;
}

function filteredItems() {
  const items = data().items;
  return items.filter(item => filter === 'all' || viewState(item) === filter).sort((a, b) => a.targetDate.localeCompare(b.targetDate));
}
function renderList() {
  if (!manager) return;
  const list = manager.querySelector('#countdownList');
  const items = filteredItems();
  list.innerHTML = items.length ? items.map(item => itemCard(item)).join('') : '<div class="countdown-empty" role="status">Không có mục tiêu trong bộ lọc này.</div>';
  manager.querySelectorAll('[data-countdown-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.countdownFilter === filter)));
  mountMilestoneChecks();
}
function suggestions() {
  const state = flow.read(), profile = state.personalization || {};
  const rows = [];
  if (profile.grade === '12') rows.push({ kind:'exam', examId:'thpt', name:'Kỳ thi tốt nghiệp THPT' });
  const vnuIds = new Set(['hcmut','hcmus','uit','uel','ussh','hcmue','uhs','iuh']);
  if ((state.savedSchools || []).some(school => vnuIds.has(school.id))) rows.push({ kind:'exam', examId:'v-act', name:'Theo dõi kỳ thi V-ACT' });
  if ((state.wishes || []).length) rows.push({ kind:'personal', name:'Rà soát hồ sơ cho nguyện vọng đã lưu' });
  return rows;
}
function suggestionHTML() {
  const rows = suggestions();
  return rows.length ? `<aside class="countdown-suggestions"><h3>Gợi ý từ hành trình đã lưu</h3><p>Chỉ là gợi ý; BrightWay không tự thêm mục tiêu.</p><div>${rows.map((row, index) => `<button type="button" data-countdown-suggestion="${index}">${esc(row.name)} →</button>`).join('')}</div></aside>` : '';
}
function formHTML() {
  return `<details class="countdown-editor" id="countdownEditor"><summary>Tạo mục tiêu hoặc kỳ thi</summary><form id="countdownForm">
    <input type="hidden" id="countdownEditId">
    <div class="countdown-form-grid"><label>Nhóm mục tiêu<select id="countdownKind"><option value="personal">Mục tiêu cá nhân</option><option value="exam">Kỳ thi</option></select></label>
    <label data-personal-field>Loại mục tiêu<select id="countdownGoalType"><option value="other">Mục tiêu khác</option><option value="language-score">Điểm ngoại ngữ</option><option value="study-volume">Khối lượng ôn tập</option><option value="study-abroad">Hồ sơ du học</option><option value="scholarship">Hồ sơ học bổng</option><option value="course">Hoàn thành khóa học</option></select></label>
    <label data-exam-field hidden>Kỳ thi<select id="countdownExam">${EXAM_CATALOG.map(row => `<option value="${esc(row.id)}">${esc(row.name)}</option>`).join('')}</select></label>
    <label data-exam-field hidden>Đợt thi chính thức<select id="countdownSession"><option value="">Chưa chọn / chưa có lịch chính thức</option></select></label>
    <label>Tên mục tiêu<input id="countdownName" required maxlength="140" placeholder="Ví dụ: Đạt IELTS 6.5"></label>
    <label>Ngày mục tiêu<input id="countdownDate" type="date" required></label>
    <label>Trạng thái<select id="countdownStatus"><option value="active">Đang chuẩn bị</option><option value="paused">Tạm dừng</option><option value="completed">Đã hoàn thành</option></select></label></div>
    <p id="countdownScheduleNote" class="countdown-note" role="status">Mốc tự đặt được ghi rõ là dự kiến.</p>
    <label>Mô tả (tùy chọn)<textarea id="countdownDescription" maxlength="500" rows="3"></textarea></label>
    <label>Các mốc nhỏ (tùy chọn, mỗi dòng một mốc)<textarea id="countdownMilestones" maxlength="1200" rows="5" placeholder="Đánh giá đầu vào&#10;Hoàn thành giai đoạn từ vựng&#10;Thi thử"></textarea></label>
    <fieldset><legend>Nhắc khi mở BrightWay</legend><div class="countdown-reminders">${REMINDER_OPTIONS.map(day => `<label><input type="checkbox" name="countdownReminder" value="${day}"> ${day} ngày trước hạn</label>`).join('')}</div></fieldset>
    <label class="countdown-check"><input type="checkbox" id="countdownPinned"> Ghim mục tiêu này lên trang chủ</label>
    <div class="countdown-form-actions"><button type="submit" class="is-primary">Lưu mục tiêu</button><button type="button" id="countdownCancel" hidden>Hủy sửa</button></div><p id="countdownFormStatus" role="status" aria-live="polite"></p>
  </form></details>`;
}
function managerHTML() {
  return `<div class="countdown-heading"><div><span class="flow-kicker">LƯU TRÊN THIẾT BỊ NÀY</span><h2 id="countdownManagerTitle">BrightWay Countdown</h2><p>Đếm ngược đến tương lai theo ngày lịch Việt Nam. Không có thông báo khi website đã đóng.</p></div><span class="countdown-icon" aria-hidden="true">⏳</span></div>${suggestionHTML()}${formHTML()}
    <div class="countdown-toolbar" aria-label="Lọc mục tiêu">${[['upcoming','Sắp tới'],['completed','Đã hoàn thành'],['overdue','Quá hạn'],['all','Tất cả']].map(([value,label]) => `<button type="button" data-countdown-filter="${value}" aria-pressed="${value === filter}">${label}</button>`).join('')}</div>
    <div id="countdownList" class="countdown-list"></div>
    <div class="countdown-data-actions"><button type="button" id="countdownExport">Xuất countdown .json</button><button type="button" id="countdownDeleteAll" class="is-danger">Xóa toàn bộ countdown</button></div>
    <details class="countdown-privacy"><summary>Nguồn lịch và quyền riêng tư</summary><p>Chỉ lịch có ngày, năm và nguồn đơn vị tổ chức mới được gắn “Lịch chính thức”. Mốc bạn tự nhập luôn được ghi là dự kiến. Dữ liệu countdown lưu trong hồ sơ cục bộ hiện có; không cần tài khoản và không gửi ra ngoài.</p></details>`;
}

function setScheduleOptions(examId) {
  const select = manager.querySelector('#countdownSession');
  const rows = schedulesFor(examId);
  select.innerHTML = '<option value="">Chưa chọn / chưa có lịch chính thức</option>' + rows.map(row => `<option value="${esc(row.sessionId)}">${esc(row.sessionName)}</option>`).join('');
  const catalog = EXAM_CATALOG.find(row => row.id === examId);
  manager.querySelector('#countdownScheduleNote').innerHTML = rows.length ? `Có ${rows.length} đợt đã đối chiếu. Chọn đúng đợt hoặc tự đặt mốc dự kiến. <a href="${esc(catalog?.sourceURL)}" target="_blank" rel="noopener noreferrer">Kiểm tra nguồn ↗</a>` : `Chưa có lịch chính thức trong dữ liệu đã đối chiếu. Nếu tự chọn ngày, mục tiêu sẽ được ghi là “Dự kiến”.${catalog?.sourceURL ? ` <a href="${esc(catalog.sourceURL)}" target="_blank" rel="noopener noreferrer">Trang đơn vị tổ chức ↗</a>` : ''}`;
}
function toggleExamFields() {
  const exam = manager.querySelector('#countdownKind').value === 'exam';
  manager.querySelectorAll('[data-exam-field]').forEach(node => { node.hidden = !exam; });
  manager.querySelectorAll('[data-personal-field]').forEach(node => { node.hidden = exam; });
  if (exam) setScheduleOptions(manager.querySelector('#countdownExam').value);
  else manager.querySelector('#countdownScheduleNote').textContent = 'Mốc tự đặt được ghi rõ là dự kiến.';
}
function resetForm(message = '') {
  editingId = '';
  const form = manager.querySelector('#countdownForm'); form.reset();
  manager.querySelector('#countdownEditId').value = '';
  manager.querySelector('#countdownCancel').hidden = true;
  manager.querySelector('#countdownFormStatus').textContent = message;
  toggleExamFields();
}
function populateForm(item) {
  editingId = item.id;
  manager.querySelector('#countdownEditor').open = true;
  manager.querySelector('#countdownEditId').value = item.id;
  manager.querySelector('#countdownKind').value = item.kind;
  manager.querySelector('#countdownExam').value = item.examId || 'other';
  manager.querySelector('#countdownGoalType').value = item.kind === 'personal' ? item.goalType : 'other';
  toggleExamFields();
  manager.querySelector('#countdownSession').value = item.sessionId || '';
  manager.querySelector('#countdownName').value = item.name;
  manager.querySelector('#countdownDate').value = item.targetDate;
  manager.querySelector('#countdownStatus').value = item.status;
  manager.querySelector('#countdownDescription').value = item.description;
  manager.querySelector('#countdownMilestones').value = item.milestones.map(row => row.title).join('\n');
  manager.querySelectorAll('[name="countdownReminder"]').forEach(input => { input.checked = item.reminderDays.includes(Number(input.value)); });
  manager.querySelector('#countdownPinned').checked = item.pinned;
  manager.querySelector('#countdownCancel').hidden = false;
  manager.querySelector('#countdownName').focus();
}
function buildItem(form) {
  const existing = data().items.find(item => item.id === editingId);
  const now = new Date().toISOString();
  const kind = manager.querySelector('#countdownKind').value;
  const examId = kind === 'exam' ? manager.querySelector('#countdownExam').value : '';
  const sessionId = kind === 'exam' ? manager.querySelector('#countdownSession').value : '';
  const official = schedulesFor(examId).find(row => row.sessionId === sessionId);
  const targetDate = manager.querySelector('#countdownDate').value;
  const stillOfficial = official && official.date === targetDate;
  const milestoneTitles = manager.querySelector('#countdownMilestones').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const oldMilestones = new Map((existing?.milestones || []).map(row => [row.title.toLowerCase(), row]));
  return normalizeCountdownItem({
    ...existing, id: existing?.id || uid(), kind, examId, sessionId: stillOfficial ? official.sessionId : '',
    name: manager.querySelector('#countdownName').value, targetDate, timezone: DEFAULT_TIMEZONE,
    description: manager.querySelector('#countdownDescription').value, goalType: kind === 'exam' ? examId : manager.querySelector('#countdownGoalType').value,
    status: manager.querySelector('#countdownStatus').value,
    milestones: milestoneTitles.map((title, index) => ({ id: oldMilestones.get(title.toLowerCase())?.id || `${existing?.id || 'new'}-milestone-${index + 1}`, title, done: oldMilestones.get(title.toLowerCase())?.done === true })),
    reminderDays: [...manager.querySelectorAll('[name="countdownReminder"]:checked')].map(input => Number(input.value)),
    pinned: manager.querySelector('#countdownPinned').checked,
    scheduleStatus: stillOfficial ? official.status : 'tentative', sourceURL: stillOfficial ? official.sourceURL : '', sourceDate: stillOfficial ? official.sourceDate : '',
    createdAt: existing?.createdAt || now, updatedAt: now,
  });
}
function saveForm(event) {
  event.preventDefault();
  const item = buildItem(event.currentTarget);
  if (!item) { manager.querySelector('#countdownFormStatus').textContent = 'Ngày hoặc tên mục tiêu chưa hợp lệ.'; return; }
  const current = data().items;
  const duplicate = current.find(row => row.id !== item.id && row.kind === item.kind && row.examId === item.examId && row.sessionId === item.sessionId && row.name.toLowerCase() === item.name.toLowerCase() && row.targetDate === item.targetDate);
  if (duplicate) { manager.querySelector('#countdownFormStatus').textContent = 'Mục tiêu này đã có trong danh sách.'; return; }
  let next = current.map(row => item.pinned ? { ...row, pinned:false } : row);
  next = next.some(row => row.id === item.id) ? next.map(row => row.id === item.id ? item : row) : [...next, item];
  updateItems(next); resetForm('Đã lưu countdown trên thiết bị.'); renderAll();
}
function action(event) {
  const button = event.target.closest('[data-countdown-action]'); if (!button) return;
  const id = button.closest('[data-countdown-id]')?.dataset.countdownId;
  const current = data().items, item = current.find(row => row.id === id); if (!item) return;
  const name = button.dataset.countdownAction;
  if (name === 'edit') return populateForm(item);
  if (name === 'delete') { if (confirm(`Xóa mục tiêu “${item.name}”?`)) updateItems(current.filter(row => row.id !== id)); else return; }
  if (name === 'pin') updateItems(current.map(row => ({ ...row, pinned: row.id === id ? !item.pinned : false, updatedAt: row.id === id ? new Date().toISOString() : row.updatedAt })));
  if (['pause','resume','complete','reopen'].includes(name)) {
    const status = { pause:'paused', resume:'active', complete:'completed', reopen:'active' }[name];
    updateItems(current.map(row => row.id === id ? { ...row, status, updatedAt:new Date().toISOString() } : row));
  }
  renderAll();
}
function toggleMilestone(event) {
  const input = event.target.closest('[data-countdown-milestone]'); if (!input) return;
  const card = input.closest('[data-countdown-id]'), id = card?.dataset.countdownId;
  const current = data().items;
  updateItems(current.map(item => item.id === id ? { ...item, milestones:item.milestones.map(row => row.id === input.dataset.countdownMilestone ? { ...row, done:input.checked } : row), updatedAt:new Date().toISOString() } : item));
  renderAll();
}
function renderAll() { renderWidget(); renderList(); }
function bindManager() {
  manager.querySelector('#countdownForm').addEventListener('submit', saveForm);
  manager.querySelector('#countdownKind').addEventListener('change', toggleExamFields);
  manager.querySelector('#countdownExam').addEventListener('change', event => setScheduleOptions(event.target.value));
  manager.querySelector('#countdownSession').addEventListener('change', event => {
    const row = schedulesFor(manager.querySelector('#countdownExam').value).find(item => item.sessionId === event.target.value);
    if (row) { manager.querySelector('#countdownDate').value = row.date; manager.querySelector('#countdownName').value = `${row.examName} · ${row.sessionName.replace(/^SAT Weekend · /, '')}`; }
  });
  manager.querySelector('#countdownCancel').addEventListener('click', () => resetForm('Đã hủy chỉnh sửa.'));
  manager.querySelector('.countdown-toolbar').addEventListener('click', event => { const button = event.target.closest('[data-countdown-filter]'); if (button) { filter = button.dataset.countdownFilter; renderList(); } });
  manager.querySelector('#countdownList').addEventListener('click', action);
  manager.querySelector('#countdownList').addEventListener('change', toggleMilestone);
  manager.querySelector('.countdown-suggestions')?.addEventListener('click', event => {
    const button = event.target.closest('[data-countdown-suggestion]'); if (!button) return;
    const row = suggestions()[Number(button.dataset.countdownSuggestion)]; if (!row) return;
    resetForm(); manager.querySelector('#countdownEditor').open = true; manager.querySelector('#countdownKind').value = row.kind; toggleExamFields();
    if (row.examId) { manager.querySelector('#countdownExam').value = row.examId; setScheduleOptions(row.examId); }
    manager.querySelector('#countdownName').value = row.name; manager.querySelector('#countdownDate').focus();
  });
  manager.querySelector('#countdownExport').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportCountdowns(data()), null, 2)], { type:'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'brightway-countdown.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  manager.querySelector('#countdownDeleteAll').addEventListener('click', () => { if (confirm('Xóa toàn bộ countdown trên thiết bị? Holland, trường và nguyện vọng sẽ được giữ nguyên.')) { store({ version:COUNTDOWN_VERSION, items:[] }); resetForm('Đã xóa toàn bộ countdown.'); renderAll(); } });
  toggleExamFields();
}
function mountMilestoneChecks() {
  if (!manager) return;
  for (const card of manager.querySelectorAll('[data-countdown-id]')) {
    const item = data().items.find(row => row.id === card.dataset.countdownId);
    if (!item?.milestones.length || card.querySelector('.countdown-milestones')) continue;
    const list = document.createElement('ul'); list.className = 'countdown-milestones';
    list.innerHTML = item.milestones.map(row => `<li><label><input type="checkbox" data-countdown-milestone="${esc(row.id)}" ${row.done ? 'checked' : ''}> ${esc(row.title)}</label></li>`).join('');
    card.querySelector('.countdown-card-actions')?.before(list);
  }
}
export function initCountdown() {
  if (window.BWCountdown || !window.BWFlow) return;
  flow = window.BWFlow;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/css/countdown.css?v=20261021'; document.head.append(css);
  window.BWCountdown = { read:data, days:calendarDayDifference };
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html') {
    widget = document.createElement('section'); widget.id = 'countdownWidget'; widget.className = 'countdown-widget'; widget.setAttribute('aria-labelledby', 'countdownWidgetTitle');
    const resume = document.querySelector('.flow-resume'); if (resume) resume.after(widget); else document.querySelector('#hero-actions')?.after(widget);
  }
  if (page === 'profile.html') {
    manager = document.createElement('section'); manager.id = 'countdowns'; manager.className = 'countdown-manager'; manager.setAttribute('aria-labelledby', 'countdownManagerTitle'); manager.innerHTML = managerHTML();
    const details = document.querySelector('.flow-profile-details'); if (details) details.after(manager); else document.querySelector('.flow-local-profile')?.append(manager);
    bindManager();
  }
  renderAll();
  window.addEventListener('bw:journey-change', renderAll);
  let dayTimer;
  const scheduleRefresh = () => {
    clearTimeout(dayTimer);
    const now = new Date(), tomorrow = new Date(now); tomorrow.setHours(24, 0, 1, 0);
    dayTimer = setTimeout(() => { renderAll(); scheduleRefresh(); }, Math.min(tomorrow - now, 2147483647));
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderAll(); scheduleRefresh(); } });
  window.addEventListener('focus', renderAll); scheduleRefresh();
  if (location.hash === '#countdowns') manager?.scrollIntoView();
}
