export const COUNTDOWN_VERSION = 1;
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const REMINDER_OPTIONS = [30, 14, 7, 3, 1];
export const ITEM_STATUSES = ['active', 'paused', 'completed'];
export const SCHEDULE_STATUSES = ['official', 'tentative', 'unannounced', 'changed'];

const DAY_MS = 86400000;
const cleanText = (value, max = 180) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const cleanUrl = value => /^https:\/\//i.test(value || '') ? String(value) : '';

export function parseCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return { year, month, day, value: `${match[1]}-${match[2]}-${match[3]}` };
}

export function calendarDateInTimezone(now = new Date(), timeZone = DEFAULT_TIMEZONE) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const record = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    return parseCalendarDate(`${record.year}-${record.month}-${record.day}`);
  } catch {
    return null;
  }
}

function calendarOrdinal(date) {
  return Math.trunc(Date.UTC(date.year, date.month - 1, date.day) / DAY_MS);
}

// Compare calendar dates after resolving "today" in the selected timezone. This
// deliberately does not divide elapsed instants, so DST and local-midnight
// offsets cannot turn a same-day target into the wrong day count.
export function calendarDayDifference(targetDate, now = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const target = parseCalendarDate(targetDate);
  const today = calendarDateInTimezone(now, timeZone);
  if (!target || !today) return null;
  return calendarOrdinal(target) - calendarOrdinal(today);
}

export function countdownLabel(days) {
  if (!Number.isInteger(days)) return 'Ngày không hợp lệ';
  if (days === 0) return 'Hôm nay';
  if (days > 0) return `Còn ${days} ngày`;
  return `Đã qua ${Math.abs(days)} ngày`;
}

function safeDate(value) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

function normalizeMilestones(rows) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const title = cleanText(row?.title, 120);
    if (!title) return null;
    const id = cleanText(row?.id, 80) || `milestone-${index + 1}-${title.toLowerCase()}`;
    if (seen.has(id)) return null;
    seen.add(id);
    return { id, title, done: row?.done === true };
  }).filter(Boolean).slice(0, 30);
}

export function normalizeCountdownItem(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const name = cleanText(raw.name, 140);
  const targetDate = parseCalendarDate(raw.targetDate)?.value || '';
  if (!name || !targetDate) return null;
  const kind = raw.kind === 'exam' ? 'exam' : 'personal';
  const status = ITEM_STATUSES.includes(raw.status) ? raw.status : 'active';
  const scheduleStatus = SCHEDULE_STATUSES.includes(raw.scheduleStatus) ? raw.scheduleStatus : 'tentative';
  const sourceURL = cleanUrl(raw.sourceURL);
  const official = scheduleStatus === 'official' || scheduleStatus === 'changed';
  if (official && (!sourceURL || !parseCalendarDate(raw.sourceDate))) return null;
  const reminders = [...new Set((Array.isArray(raw.reminderDays) ? raw.reminderDays : []).map(Number).filter(value => REMINDER_OPTIONS.includes(value)))].sort((a, b) => b - a);
  const createdAt = safeDate(raw.createdAt) || new Date(0).toISOString();
  const updatedAt = safeDate(raw.updatedAt) || createdAt;
  return {
    id: cleanText(raw.id, 100) || `countdown-${index + 1}-${targetDate}-${name.toLowerCase()}`,
    kind,
    examId: kind === 'exam' ? cleanText(raw.examId, 80) : '',
    sessionId: kind === 'exam' ? cleanText(raw.sessionId, 100) : '',
    name,
    targetDate,
    timezone: raw.timezone === DEFAULT_TIMEZONE ? DEFAULT_TIMEZONE : DEFAULT_TIMEZONE,
    description: cleanText(raw.description, 500),
    goalType: cleanText(raw.goalType, 80) || (kind === 'exam' ? 'exam' : 'other'),
    status,
    milestones: normalizeMilestones(raw.milestones),
    reminderDays: reminders,
    pinned: raw.pinned === true,
    scheduleStatus,
    sourceURL,
    sourceDate: parseCalendarDate(raw.sourceDate)?.value || '',
    createdAt,
    updatedAt,
  };
}

export function normalizeCountdowns(raw) {
  const source = raw && typeof raw === 'object' && Number(raw.version) === COUNTDOWN_VERSION ? raw : {};
  const seenIds = new Set(), seenRecords = new Set();
  const items = (Array.isArray(source.items) ? source.items : []).map(normalizeCountdownItem).filter(item => {
    if (!item || seenIds.has(item.id)) return false;
    const fingerprint = [item.kind, item.examId, item.sessionId, item.name.toLowerCase(), item.targetDate].join('|');
    if (seenRecords.has(fingerprint)) return false;
    seenIds.add(item.id); seenRecords.add(fingerprint); return true;
  });
  // At most one card is pinned. Preserve the first pinned record deterministically.
  let pinnedSeen = false;
  for (const item of items) {
    if (item.pinned && !pinnedSeen) pinnedSeen = true;
    else if (item.pinned) item.pinned = false;
  }
  return { version: COUNTDOWN_VERSION, items };
}

export function milestoneProgress(item) {
  const milestones = normalizeMilestones(item?.milestones);
  if (!milestones.length) return null;
  const completed = milestones.filter(row => row.done).length;
  return { completed, total: milestones.length, percent: Math.round(completed * 100 / milestones.length) };
}

export function timeProgress(item, now = new Date()) {
  const start = parseCalendarDate(String(item?.createdAt || '').slice(0, 10));
  const target = parseCalendarDate(item?.targetDate);
  const today = calendarDateInTimezone(now, item?.timezone || DEFAULT_TIMEZONE);
  if (!start || !target || !today) return null;
  const total = calendarOrdinal(target) - calendarOrdinal(start);
  const elapsed = calendarOrdinal(today) - calendarOrdinal(start);
  if (total <= 0 || elapsed < 0) return null;
  return { elapsed: Math.min(elapsed, total), total, percent: Math.max(0, Math.min(100, Math.round(elapsed * 100 / total))) };
}

export function viewState(item, now = new Date()) {
  if (item?.status === 'completed') return 'completed';
  const days = calendarDayDifference(item?.targetDate, now, item?.timezone || DEFAULT_TIMEZONE);
  if (days === null) return 'invalid';
  if (days < 0) return 'overdue';
  return 'upcoming';
}

export function nextCountdown(items, now = new Date()) {
  const normalized = normalizeCountdowns({ version: COUNTDOWN_VERSION, items }).items;
  const available = normalized.filter(item => item.status !== 'completed' && calendarDayDifference(item.targetDate, now, item.timezone) !== null);
  const pinned = available.find(item => item.pinned);
  if (pinned) return pinned;
  return available.sort((a, b) => {
    const aDays = calendarDayDifference(a.targetDate, now, a.timezone);
    const bDays = calendarDayDifference(b.targetDate, now, b.timezone);
    const aFuture = aDays >= 0 ? 0 : 1, bFuture = bDays >= 0 ? 0 : 1;
    return aFuture - bFuture || Math.abs(aDays) - Math.abs(bDays) || a.name.localeCompare(b.name, 'vi');
  })[0] || null;
}

export function shouldRemind(item, now = new Date()) {
  if (!item || item.status !== 'active') return false;
  const days = calendarDayDifference(item.targetDate, now, item.timezone);
  return Number.isInteger(days) && days >= 0 && item.reminderDays.includes(days);
}

export function exportCountdowns(raw) {
  return { format: 'brightway-countdowns', exportedAt: new Date().toISOString(), ...normalizeCountdowns(raw) };
}
