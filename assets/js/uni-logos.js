/* ════════════════════════════════════════════════════════
   UNI LOGOS — Logo chính thức các trường ĐH Việt Nam
   Nguồn: Wikipedia Commons (CC license) + trang chủ trường
   Mỗi entry có:
     - code:       mã ngắn (BK, FPT, UIT, ...)
     - name:       tên đầy đủ tiếng Việt
     - logo:       URL ảnh logo (PNG/SVG, nền trong suốt)
     - fallback:   URL dự phòng nếu ảnh chính lỗi
   ════════════════════════════════════════════════════════ */

window.UNI_LOGOS = {
  // Miền Bắc
  'BK': {
    name: 'ĐH Bách Khoa Hà Nội',
    short: 'BK HN',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8e/Logo_HUST.png/200px-Logo_HUST.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'BK_HCM': {
    name: 'ĐH Bách Khoa TPHCM',
    short: 'BK TPHCM',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/85/Logo_HCMUT.png/200px-Logo_HCMUT.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  },
  'KHTN': {
    name: 'ĐH Khoa học Tự nhiên - ĐHQG Hà Nội',
    short: 'KHTN HN',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c6/Logo_HUS.png/200px-Logo_HUS.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'XHNV': {
    name: 'ĐH Khoa học Xã hội & Nhân văn - ĐHQG HN',
    short: 'XHNV HN',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/4/4f/Logo_USSH.png/200px-Logo_USSH.png',
    fallback: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=120&h=120&fit=crop'
  },
  'NEU': {
    name: 'ĐH Kinh tế Quốc dân',
    short: 'NEU',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/f/f0/Logo_NEU.png/200px-Logo_NEU.png',
    fallback: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=120&h=120&fit=crop'
  },
  'FTU': {
    name: 'ĐH Ngoại thương',
    short: 'FTU',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/d/d0/Logo_FTU.png/240px-FTU.png',
    fallback: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&h=120&fit=crop'
  },

  // TP.HCM
  'UIT': {
    name: 'ĐH CNTT - ĐHQG TPHCM',
    short: 'UIT',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/7/74/Logo_UIT.png/200px-Logo_UIT.png',
    fallback: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=120&h=120&fit=crop'
  },
  'UEH': {
    name: 'ĐH Kinh tế TPHCM',
    short: 'UEH',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9f/Logo_UEH.png/200px-Logo_UEH.png',
    fallback: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&h=120&fit=crop'
  },
  'FPT': {
    name: 'ĐH FPT',
    short: 'FPT',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a6/Logo_FPT_Education.png/220px-Logo_FPT_Education.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'FUNIX': {
    name: 'FUNiX (FPT)',
    short: 'FUNiX',
    logo: 'https://funix.edu.vn/wp-content/uploads/2021/05/logo-funix.png',
    fallback: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&h=120&fit=crop'
  },

  // Khác
  'VNU_HCM': {
    name: 'ĐHQG TPHCM',
    short: 'ĐHQG HCM',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/82/Logo_VNU-HCM.png/200px-Logo_VNU-HCM.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  },
  'VNU_HN': {
    name: 'ĐHQG Hà Nội',
    short: 'VNU',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/2/2a/Logo_VNU.png/200px-Logo_VNU.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  }
};

// Helper: tìm logo theo mã hoặc tên
window.UNILogo = function(codeOrName) {
  if (!codeOrName) return null;
  const upper = codeOrName.toUpperCase().trim();
  // Thử match theo code trước
  if (window.UNI_LOGOS[upper]) return window.UNI_LOGOS[upper];
  // Match theo tên (chứa chuỗi)
  for (const [code, info] of Object.entries(window.UNI_LOGOS)) {
    if (info.name.toLowerCase().includes(upper.toLowerCase()) ||
        code.toLowerCase() === upper.toLowerCase()) {
      return info;
    }
  }
  return null;
};

// Render ra thẻ img HTML (kèm fallback onerror)
window.UNILogoImg = function(codeOrName, options = {}) {
  const info = window.UNILogo(codeOrName);
  const size = options.size || 48;
  const cls = options.class || 'uni-logo-img';
  if (!info) {
    return `<div class="${cls}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,0.1);border-radius:8px;font-size:${size/2.5}px;">🎓</div>`;
  }
  return `<img src="${info.logo}" alt="${info.name}" class="${cls}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:8px;background:#fff;padding:2px;" onerror="this.onerror=null;this.src='${info.fallback}'" />`;
};