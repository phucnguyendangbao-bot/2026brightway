/* ════════════════════════════════════════════════════════
   UNI LOGO SVG — Render SVG inline brand cho các trường
   Dùng khi logo Wikipedia lỗi / không tải được
   Mỗi entry có màu brand chính thức + initials + short name
   ════════════════════════════════════════════════════════ */

window.UNI_BRAND_COLORS = {
  // Miền Bắc
  'BK':     { primary: '#c8102e', secondary: '#ffc72c', name: 'HUST' }, // Đỏ + vàng - BK HN
  'BK_HCM': { primary: '#1e3a8a', secondary: '#3b82f6', name: 'HCMUT' }, // Xanh dương
  'KHTN':   { primary: '#15803d', secondary: '#84cc16', name: 'HUS' },
  'HCMUS':  { primary: '#16a34a', secondary: '#84cc16', name: 'HCMUS' },
  'XHNV':   { primary: '#7c3aed', secondary: '#c084fc', name: 'USSH' },
  'USSH':   { primary: '#7c2d12', secondary: '#fbbf24', name: 'USSH' },
  'NEU':    { primary: '#1e3a8a', secondary: '#f59e0b', name: 'NEU' },
  'FTU':    { primary: '#0ea5e9', secondary: '#06b6d4', name: 'FTU' },

  // TP.HCM
  'UIT':    { primary: '#2f6bff', secondary: '#0000fd', name: 'UIT' }, // RGB theo uit.edu.vn
  'UEH':    { primary: '#0f766e', secondary: '#f59e0b', name: 'UEH' },
  'FPT':    { primary: '#f97316', secondary: '#fb923c', name: 'FPT' },
  'FUNIX':  { primary: '#f97316', secondary: '#fb923c', name: 'FUNiX' },
  'TDTU':   { primary: '#dc2626', secondary: '#facc15', name: 'TDTU' },
  'NTTU':   { primary: '#0e7490', secondary: '#22d3ee', name: 'NTTU' },
  'HCMIU':  { primary: '#1e40af', secondary: '#3b82f6', name: 'IU' },
  'NLU':    { primary: '#16a34a', secondary: '#22c55e', name: 'NLU' },
  'HUFI':   { primary: '#f59e0b', secondary: '#fde68a', name: 'HUFI' },
  'HUB':    { primary: '#1d4ed8', secondary: '#60a5fa', name: 'HUB' },
  'HCMUE':  { primary: '#0f172a', secondary: '#f97316', name: 'HCMUE' },
  'VLU':    { primary: '#e11d48', secondary: '#fb7185', name: 'VLU' },
  'PNTU':   { primary: '#be123c', secondary: '#fda4af', name: 'PNT' },
  'UMP':    { primary: '#0c4a6e', secondary: '#0ea5e9', name: 'UMP' },
  'CTUMP':  { primary: '#0891b2', secondary: '#67e8f9', name: 'CTUMP' },

  // Miền Trung
  'CTU':    { primary: '#059669', secondary: '#10b981', name: 'CTU' },
  'DTHU':   { primary: '#16a34a', secondary: '#86efac', name: 'DThU' },
  'DUT':    { primary: '#0f766e', secondary: '#5eead4', name: 'DUT' },
  'DUE':    { primary: '#0e7490', secondary: '#22d3ee', name: 'DUE' },
  'DTU':    { primary: '#b91c1c', secondary: '#fb923c', name: 'DTU' },
  'NTU':    { primary: '#0369a1', secondary: '#38bdf8', name: 'NTU' },
  'QNU':    { primary: '#0369a1', secondary: '#06b6d4', name: 'QNU' },
  'DAU':    { primary: '#4338ca', secondary: '#a5b4fc', name: 'DAU' },
  'HUAF':   { primary: '#15803d', secondary: '#22c55e', name: 'HUAF' },
  'HUSC':   { primary: '#1e40af', secondary: '#3b82f6', name: 'HUSC' },
  'HUCFL':  { primary: '#7c2d12', secondary: '#fbbf24', name: 'HUCFL' },
  'HUEMEDU':{ primary: '#be123c', secondary: '#fb7185', name: 'HMU' },
  'PXU':    { primary: '#9a3412', secondary: '#fbbf24', name: 'PXU' },
  'VKU':    { primary: '#1e3a8a', secondary: '#dc2626', name: 'VKU' },
  'RMIT':   { primary: '#000054', secondary: '#e60028', name: 'RMIT' },

  // Khác
  'VNU_HCM':{ primary: '#0f4c81', secondary: '#dc2626', name: 'VNU HCM' },
  'VNU_HN': { primary: '#003e80', secondary: '#dc2626', name: 'VNU HN' }
};

// Render SVG inline với gradient + initials (render offline, luôn hoạt động)
window.UNILogoSvg = function(codeOrName, options = {}) {
  const info = window.UNILogo(codeOrName);
  const size = options.size || 48;
  const brandKey = info ? (Object.keys(window.UNI_LOGOS).find(k => window.UNI_LOGOS[k] === info) || null) : null;
  const brand = (brandKey && window.UNI_BRAND_COLORS[brandKey]) || null;

  const fallback = brand || { primary: '#6366f1', secondary: '#a78bfa', name: (codeOrName || '?').slice(0, 3).toUpperCase() };
  const id = 'ug_' + Math.random().toString(36).slice(2, 8);
  const text = brand ? brand.name : fallback.name;

  // Initials cho chính giữa - ưu tiên lấy ký tự đầu của các từ ngắn (HUST, UEH, HCMUT)
  let initials;
  if (text.includes(' ') || text.length <= 5) {
    // Ngắn gọn: lấy 2-3 ký tự đầu của từ đầu tiên, hoặc toàn bộ nếu <= 4 ký tự
    const first = text.split(/\s+/)[0];
    if (text.length <= 4) {
      initials = text.toUpperCase();
    } else {
      initials = first.slice(0, 4).toUpperCase();
    }
  } else {
    // Dài: lấy chữ cái đầu của 2-3 từ
    initials = text.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  }
  if (!initials) initials = '?';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${info ? info.name : text}">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${fallback.primary}"/>
        <stop offset="100%" stop-color="${fallback.secondary}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="18" fill="url(#${id})"/>
    <text x="50" y="50" font-family="'Nunito','Be Vietnam Pro',sans-serif" font-weight="900"
          font-size="${initials.length > 3 ? 26 : (initials.length > 2 ? 30 : 38)}" text-anchor="middle" dominant-baseline="central"
          fill="#fff" letter-spacing="-0.5">${initials}</text>
  </svg>`;
};

// Render fallback badge với gradient + initials (dùng cho <img> onerror)
window.UNILogoBadge = function(codeOrName, options = {}) {
  const size = options.size || 48;
  const cls = options.class || 'uni-badge-fallback';
  return `<div class="${cls}" style="width:${size}px;height:${size}px;">${window.UNILogoSvg(codeOrName, { size })}</div>`;
};