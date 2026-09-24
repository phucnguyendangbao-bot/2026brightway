/**
 * Vercel Serverless Function: POST /api/analyze
 * ─────────────────────────────────────────────
 * Bảo mật:
 *  - Validate type, content, options (whitelist).
 *  - Không nhận `system` / `max_tokens` / `model` từ client.
 *  - max_tokens ép cứng theo type.
 *  - Rate limit theo IP (Upstash REST + in-memory fallback).
 *  - Lỗi trả message generic, log chi tiết phía server.
 */

import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, getClientIp } from './_ratelimit.js';
import { buildRequest, ALLOWED_TYPES, MAX_TOKENS_BY_TYPE } from './prompts.js';

export const config = {
  runtime: 'nodejs',
};

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/* ══ Validation helpers ══ */

function jsonError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length > 0) {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return null;
}

function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, message: 'Body không hợp lệ' };
  }
  const { type, content, options } = body;

  if (!ALLOWED_TYPES.includes(type)) {
    return { ok: false, status: 400, message: `type phải là một trong: ${ALLOWED_TYPES.join(', ')}` };
  }
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { ok: false, status: 400, message: 'content phải là chuỗi không rỗng' };
  }
  // Hard cap input để chặn DoS qua payload quá lớn
  const MAX_INPUT = 16000;
  if (content.length > MAX_INPUT) {
    return { ok: false, status: 400, message: `content vượt quá ${MAX_INPUT} ký tự` };
  }
  if (options !== undefined && (typeof options !== 'object' || Array.isArray(options) || options === null)) {
    return { ok: false, status: 400, message: 'options phải là object' };
  }
  return { ok: true, type, content, options: options || {} };
}

/* ══ Handler chính ══ */

export default async function handler(req, res) {
  // ── CORS ──
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // ── Anti-cache ──
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // ── Preflight ──
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  // ── Rate limit ──
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, { limit: 15, windowMs: 60_000 });
  res.setHeader('X-RateLimit-Limit', '15');
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.resetMs / 1000)));
  if (!rl.ok) {
    return jsonError(res, 429, 'rate_limited', 'Bạn gửi quá nhanh, thử lại sau ít giây.');
  }

  // ── Validate ──
  const body = readJsonBody(req);
  const v = validateRequest(body);
  if (!v.ok) {
    return jsonError(res, v.status, 'invalid_request', v.message);
  }

  // ── Build prompt từ server-side templates (KHÔNG dùng input của client) ──
  let request;
  try {
    request = buildRequest({ type: v.type, content: v.content, options: v.options });
  } catch (err) {
    return jsonError(res, err.status || 400, 'invalid_type', err.message);
  }

  // ── Gọi Anthropic ──
  try {
    const response = await client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.system,
      messages: [{ role: 'user', content: request.userMessage }],
    });

    const reply = (response.content || [])
      .filter(b => b && b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    if (!reply) {
      return jsonError(res, 502, 'empty_response', 'AI trả về rỗng');
    }

    return res.status(200).json({
      reply,
      type: v.type,
      max_tokens: request.maxTokens,
      usage: {
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens,
      },
    });
  } catch (err) {
    // Log chi tiết phía server, trả generic cho client
    console.error('[analyze error]', {
      type: v.type,
      ip,
      status: err?.status,
      message: err?.message,
    });
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return jsonError(res, status, 'upstream_error',
      status === 401 || status === 403
        ? 'Máy chủ chưa được cấu hình API key hợp lệ.'
        : 'Lỗi khi gọi AI, vui lòng thử lại.'
    );
  }
}
