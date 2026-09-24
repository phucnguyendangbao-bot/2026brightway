/**
 * Shared rate limit helper for Vercel Serverless Functions.
 * ────────────────────────────────────────────────────────────
 * - Ưu tiên 1: Upstash Redis REST API (chạy được trên serverless,
 *   không cần kết nối TCP dài hạn).
 * - Ưu tiên 2: in-memory Map fallback khi env Upstash chưa được cấu hình.
 *   Lưu ý: serverless có thể đông cứng/khởi động lại instance bất cứ lúc nào,
 *   nên chỉ dùng để giảm thiểu abuse, không dùng để chặn tuyệt đối.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

if (!USE_UPSTASH) {
  console.warn(
    '[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN chưa cấu hình — đang dùng in-memory Map. ' +
    'Trên Vercel mỗi invocation có thể chạy ở instance khác nhau, rate limit sẽ không chính xác. ' +
    'Khuyến nghị: tạo database Upstash miễn phí và set env vars.'
  );
}

/* ══ Upstash REST implementation ══ */

async function upstashIncr(key, windowSec) {
  // Dùng pipeline INCR + EXPIRE để đếm và set TTL trong 1 round-trip.
  const url = UPSTASH_URL.replace(/\/$/, '');
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSec, 'NX'],
    ]),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upstash ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  // Pipeline trả về mảng kết quả theo thứ tự
  const count = Number(json?.[0]?.result ?? 0);
  return count;
}

async function upstashCheck(ip, limit, windowMs) {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const key = `rl:${ip}:${Math.floor(Date.now() / windowMs)}`;
  try {
    const count = await upstashIncr(key, windowSec);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      resetMs: windowMs,
      source: 'upstash',
    };
  } catch (err) {
    console.error('[ratelimit] Upstash lỗi, fallback in-memory:', err.message);
    return memoryCheck(ip, limit, windowMs);
  }
}

/* ══ In-memory fallback ══ */

const memoryStore = new Map();

function memoryGc() {
  if (memoryStore.size <= 500) return;
  const now = Date.now();
  for (const [key, val] of memoryStore) {
    if (val.resetAt < now) memoryStore.delete(key);
  }
}

function memoryCheck(ip, limit, windowMs) {
  const now = Date.now();
  memoryGc();
  const entry = memoryStore.get(ip);
  if (!entry || entry.resetAt < now) {
    memoryStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetMs: windowMs, source: 'memory' };
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetMs: Math.max(0, entry.resetAt - now),
    source: 'memory',
  };
}

/* ══ Public API ══ */

/**
 * @param {string} ip - Client IP (đã strip proxy headers).
 * @param {{limit?: number, windowMs?: number}} [opts]
 * @returns {Promise<{ok: boolean, remaining: number, resetMs: number, source: 'upstash'|'memory'}>}
 */
export async function checkRateLimit(ip, opts = {}) {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 15;
  const windowMs = Number.isFinite(opts.windowMs) ? opts.windowMs : 60_000;

  if (!ip) ip = 'unknown';
  return USE_UPSTASH
    ? upstashCheck(ip, limit, windowMs)
    : memoryCheck(ip, limit, windowMs);
}

/**
 * Extract client IP từ request headers (ưu tiên x-forwarded-for của Vercel).
 */
export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return String(xff[0]).split(',')[0].trim();
  }
  const real = req.headers?.['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real;
  return req.socket?.remoteAddress || 'unknown';
}
