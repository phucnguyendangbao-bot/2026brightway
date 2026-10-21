import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTDOWN_VERSION, parseCalendarDate, calendarDateInTimezone, calendarDayDifference, countdownLabel, normalizeCountdownItem, normalizeCountdowns, milestoneProgress, timeProgress, viewState, nextCountdown, shouldRemind, exportCountdowns } from '../assets/js/countdown-model.js';
import { EXAM_CATALOG, EXAM_SCHEDULES, OFFICIAL_EXAM_SCHEDULES, UNANNOUNCED_EXAM_SCHEDULES, schedulesFor, scheduleRecordsFor } from '../assets/data/exam-schedules.js';

const base = (patch = {}) => ({
  id:'goal-1', kind:'personal', name:'Hoàn thành 20 đề Toán', targetDate:'2027-01-15', timezone:'Asia/Ho_Chi_Minh', description:'', goalType:'study', status:'active', milestones:[], reminderDays:[30,7,1], pinned:false, scheduleStatus:'tentative', sourceURL:'', sourceDate:'', createdAt:'2026-10-21T00:00:00.000Z', updatedAt:'2026-10-21T00:00:00.000Z', ...patch,
});

test('calendar dates validate leap years and invalid input', () => {
  assert.equal(parseCalendarDate('2028-02-29')?.day, 29);
  assert.equal(parseCalendarDate('2027-02-29'), null);
  assert.equal(parseCalendarDate('2027-13-01'), null);
  assert.equal(parseCalendarDate('21/10/2026'), null);
});

test('day difference uses the calendar date in Asia/Ho_Chi_Minh', () => {
  const justAfterMidnightVietnam = new Date('2026-10-20T17:01:00.000Z');
  assert.equal(calendarDateInTimezone(justAfterMidnightVietnam)?.value, '2026-10-21');
  assert.equal(calendarDayDifference('2026-10-21', justAfterMidnightVietnam), 0);
  assert.equal(calendarDayDifference('2026-10-22', justAfterMidnightVietnam), 1);
  assert.equal(calendarDayDifference('2026-10-20', justAfterMidnightVietnam), -1);
});

test('calendar difference crosses year boundaries without negative display', () => {
  const now = new Date('2026-12-31T10:00:00.000Z');
  assert.equal(calendarDayDifference('2027-01-01', now), 1);
  assert.equal(countdownLabel(0), 'Hôm nay');
  assert.equal(countdownLabel(-4), 'Đã qua 4 ngày');
  assert.doesNotMatch(countdownLabel(-4), /-4/);
});

test('normalization rejects corrupt official records and strips duplicates', () => {
  assert.equal(normalizeCountdownItem(base({ scheduleStatus:'official' })), null);
  const official = base({ id:'official', kind:'exam', examId:'sat', sessionId:'sat-2027-03-06', name:'SAT', targetDate:'2027-03-06', scheduleStatus:'official', sourceURL:'https://example.edu/sat', sourceDate:'2026-10-21' });
  const result = normalizeCountdowns({ version:COUNTDOWN_VERSION, items:[official, { ...official, id:'duplicate' }, null, { name:'bad', targetDate:'not-a-date' }] });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].sourceURL, 'https://example.edu/sat');
  assert.deepEqual(normalizeCountdowns({ version:99, items:[official] }).items, []);
});

test('only the first saved target remains pinned', () => {
  const result = normalizeCountdowns({ version:COUNTDOWN_VERSION, items:[base({ id:'a', pinned:true }), base({ id:'b', name:'IELTS', targetDate:'2027-02-01', pinned:true })] });
  assert.deepEqual(result.items.map(item => item.pinned), [true, false]);
});

test('milestone and time progress remain separately labelled values', () => {
  const item = base({ targetDate:'2026-10-31', milestones:[{ id:'a', title:'Học từ vựng', done:true }, { id:'b', title:'Thi thử', done:false }] });
  assert.deepEqual(milestoneProgress(item), { completed:1, total:2, percent:50 });
  assert.deepEqual(timeProgress(item, new Date('2026-10-26T05:00:00.000Z')), { elapsed:5, total:10, percent:50 });
});

test('view filters today as upcoming and past targets as overdue', () => {
  const now = new Date('2026-10-21T05:00:00.000Z');
  assert.equal(viewState(base({ targetDate:'2026-10-21' }), now), 'upcoming');
  assert.equal(viewState(base({ targetDate:'2026-10-20' }), now), 'overdue');
  assert.equal(viewState(base({ status:'completed' }), now), 'completed');
});

test('pinned target wins the home widget and reminders are exact opt-ins', () => {
  const now = new Date('2026-10-21T05:00:00.000Z');
  const near = base({ id:'near', targetDate:'2026-10-22' });
  const pinned = base({ id:'pin', name:'SAT', targetDate:'2026-11-07', pinned:true, reminderDays:[30,14,7,3,1] });
  assert.equal(nextCountdown([near,pinned], now)?.id, 'pin');
  assert.equal(shouldRemind(near, now), true);
  assert.equal(shouldRemind(pinned, now), false);
});

test('official schedules use organiser sources and support separate sessions', () => {
  assert.ok(EXAM_CATALOG.some(row => row.id === 'thpt'));
  assert.ok(EXAM_CATALOG.some(row => row.id === 'goethe-osd'));
  assert.equal(schedulesFor('sat').length, 5);
  assert.equal(new Set(schedulesFor('sat').map(row => row.sessionId)).size, 5);
  for (const row of OFFICIAL_EXAM_SCHEDULES) {
    assert.equal(row.status, 'official');
    assert.ok(parseCalendarDate(row.date));
    assert.ok(parseCalendarDate(row.sourceDate));
    assert.match(row.sourceURL, /^https:\/\//);
    assert.equal(row.timezone, 'Asia/Ho_Chi_Minh');
  }
  assert.equal(schedulesFor('thpt').length, 0, 'không được tự tạo lịch THPT 2027');
  assert.equal(scheduleRecordsFor('thpt')[0].status, 'unannounced');
  assert.equal(scheduleRecordsFor('thpt')[0].date, '');
  assert.ok(UNANNOUNCED_EXAM_SCHEDULES.every(row => row.year === 2027 && row.status === 'unannounced' && row.date === '' && /^https:\/\//.test(row.sourceURL)));
  assert.equal(EXAM_SCHEDULES.length, OFFICIAL_EXAM_SCHEDULES.length + UNANNOUNCED_EXAM_SCHEDULES.length);
});

test('export includes only countdown schema and keeps local profile separate', () => {
  const exported = exportCountdowns({ version:COUNTDOWN_VERSION, items:[base()] });
  assert.equal(exported.format, 'brightway-countdowns');
  assert.equal(exported.version, 1);
  assert.equal(exported.items.length, 1);
  assert.equal('savedSchools' in exported, false);
  assert.equal('holland' in exported, false);
});
