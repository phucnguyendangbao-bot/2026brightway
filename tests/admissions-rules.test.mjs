import test from 'node:test';
import assert from 'node:assert/strict';
import { rawThreshold } from '../assets/js/admissions-rules.js';
import policy from '../assets/data/admissions-policy.js';

test('15-point boundary is inclusive and uses raw exam scores', () => {
  assert.equal(rawThreshold({ math: 5, phy: 5, che: 5 }, ['math','phy','che']).meets, true);
  assert.equal(rawThreshold({ math: 4.99, phy: 5, che: 5 }, ['math','phy','che']).meets, false);
});
test('Math + Literature + another exam can meet the threshold when the selected combo is below 15', () => {
  const result = rawThreshold({ math: 6, lit: 7, eng: 5, phy: 3, che: 3 }, ['math','phy','che']);
  assert.equal(result.best, 18);
  assert.equal(result.meets, true);
});
test('Missing, non-finite and out-of-range scores never establish the threshold', () => {
  for (const bad of [null, undefined, NaN, Infinity, 11, -1]) {
    assert.equal(rawThreshold({ math: 9, phy: 9, che: bad }, ['math','phy','che']).best, null);
  }
});
test('Every calendar event has a dated source; 2027 drafts never become dated admission events', () => {
  const ids = new Set(policy.documents.map(doc => doc.id));
  for (const event of policy.calendar_events) {
    assert.ok(ids.has(event.source_id));
    assert.equal(event.policy_year, 2026);
    assert.equal(event.status, 'official_2026');
    assert.ok(Number.isFinite(Date.parse(event.at)));
    assert.match(event.at, /\+07:00$/);
  }
  assert.equal(policy.calendar_events.some(event => event.policy_year === 2027), false);
  assert.equal(policy.documents.find(doc => doc.id === 'DUTHAO_09_2026').effective, null);
});
