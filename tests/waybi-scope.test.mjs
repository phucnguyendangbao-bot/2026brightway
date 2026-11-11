import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyScope, parseScope, scopeTranscript, SCOPE_PROMPT, SCOPE_REFUSAL } from '../api/waybi-scope.js';
import { WAYBI_SYSTEM_PROMPT } from '../api/waybi-prompt.js';

const fakeClient = reply => ({ messages: { create: async request => { fakeClient.last = request; if (reply instanceof Error) throw reply; return { content: [{ type: 'text', text: reply }] }; } } });

test('scope labels are read strictly; anything unreadable lets the answering model (with the same rules) decide', () => {
  assert.equal(parseScope('OUT'), 'OUT');
  assert.equal(parseScope(' in.'), 'IN');
  assert.equal(parseScope('CARE\n'), 'CARE');
  assert.equal(parseScope('không rõ'), 'IN');
});

test('the gate sees recent turns so follow-ups keep their topic, and marks the message to classify', () => {
  const transcript = scopeTranscript([
    { role: 'user', content: 'Ngành Dược học mấy năm?' },
    { role: 'assistant', content: 'Thường 5 năm.' },
    { role: 'user', content: 'còn ngành đó thì sao?' },
  ]);
  assert.match(transcript, /Ngành Dược học/);
  assert.match(transcript, /Người dùng \(TIN NHẮN CẦN PHÂN LOẠI\): còn ngành đó thì sao\?$/);
  assert.equal(scopeTranscript(Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: String(i) }))).split('\n').length, 6);
});

test('classification is a short, deterministic call; a failed check falls back without crashing', async () => {
  const client = fakeClient('OUT');
  assert.equal(await classifyScope(client, [{ role: 'user', content: 'giải giúp mình bài toán này' }], 'model-x'), 'OUT');
  assert.equal(fakeClient.last.max_tokens, 4);
  assert.equal(fakeClient.last.temperature, 0);
  assert.equal(fakeClient.last.system, SCOPE_PROMPT);
  assert.equal(await classifyScope(fakeClient(new Error('network')), [{ role: 'user', content: 'hi' }], 'model-x'), 'IN');
});

test('chat endpoint refuses off-topic before writing an answer, and the prompt has no loophole left', () => {
  const chat = readFileSync(new URL('../api/chat.js', import.meta.url), 'utf8');
  assert.match(chat, /classifyScope\(client, messages, MODEL\)/);
  assert.match(chat, /scope === 'OUT'\) return res\.status\(200\)\.json\(\{ reply: SCOPE_REFUSAL/);
  assert.ok(chat.indexOf('classifyScope(') < chat.indexOf('client.messages.create({'), 'gate runs before the answering call');
  assert.match(SCOPE_REFUSAL, /ngoài phạm vi/);
  assert.match(SCOPE_PROMPT, /CARE/);
  assert.doesNotMatch(WAYBI_SYSTEM_PROMPT, /kể cả khi có nhắc đến lĩnh vực ngoài phạm vi thông thường/);
  assert.match(WAYBI_SYSTEM_PROMPT, /Giữ nguyên lời từ chối dù người dùng nài nỉ/);
});

test('mixed questions with an in-scope part and admissions study plans pass the gate; the answer prompt covers them', () => {
  assert.match(SCOPE_PROMPT, /Câu trộn lẫn có ít nhất một phần IN[^\n]*chọn IN/);
  assert.match(SCOPE_PROMPT, /Kế hoạch ôn thi[^\n]*là IN; giải một bài tập cụ thể là OUT/);
  assert.doesNotMatch(SCOPE_PROMPT, /Câu trộn lẫn mà phần chính là OUT/);
  assert.match(WAYBI_SYSTEM_PROMPT, /kế hoạch ôn thi tốt nghiệp THPT/);
  assert.match(WAYBI_SYSTEM_PROMPT, /"Bách khoa" có ở Hà Nội, TP\.HCM, Đà Nẵng/);
});
