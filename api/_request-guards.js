// Browser requests to the public AI endpoints belong to the site that served
// them. Exact ALLOWED_ORIGIN values may enable a separately hosted frontend.
export function allowedBrowserOrigin(req, configured = process.env.ALLOWED_ORIGIN || '') {
  const raw = req.headers?.origin;
  if (!raw) return { allowed: true, origin: '' }; // non-browser client
  try {
    const parsed = new URL(raw);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.origin !== raw) return { allowed: false, origin: '' };
    const host = String(req.headers?.host || '').toLowerCase();
    const local = /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host);
    const sameHost = parsed.host.toLowerCase() === host && (parsed.protocol === 'https:' || local);
    const listed = configured.split(/[\s,]+/).filter(value => value && value !== '*');
    return { allowed: sameHost || listed.includes(parsed.origin), origin: parsed.origin };
  } catch { return { allowed: false, origin: '' }; }
}

export function setApiCors(req, res, configured) {
  const decision = allowedBrowserOrigin(req, configured);
  res.setHeader('Vary', 'Origin');
  if (decision.allowed && decision.origin) res.setHeader('Access-Control-Allow-Origin', decision.origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return decision.allowed;
}

export function bodyTooLarge(req, limitBytes) {
  const declared = Number(req.headers?.['content-length']);
  if (Number.isFinite(declared) && declared > limitBytes) return true;
  if (typeof req.body === 'string') return Buffer.byteLength(req.body, 'utf8') > limitBytes;
  if (req.body && typeof req.body === 'object') {
    try { return Buffer.byteLength(JSON.stringify(req.body), 'utf8') > limitBytes; }
    catch { return true; }
  }
  return false;
}
