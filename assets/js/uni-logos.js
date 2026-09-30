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
    aliases: ['HUST', 'ĐH Bách khoa Hà Nội', 'Bách khoa Hà Nội'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8e/Logo_HUST.png/200px-Logo_HUST.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'BK_HCM': {
    name: 'ĐH Bách Khoa TPHCM',
    short: 'HCMUT',
    aliases: ['HCMUT', 'ĐH Bách khoa TP', 'Bách khoa TP.HCM', 'Đại học Bách khoa ĐHQG TP.HCM', 'Đại học Bách khoa Đà Nẵng'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/85/Logo_HCMUT.png/200px-Logo_HCMUT.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  },
  'KHTN': {
    name: 'ĐH Khoa học Tự nhiên - ĐHQG Hà Nội',
    short: 'KHTN HN',
    aliases: ['HUS', 'ĐH KHTN Hà Nội'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c6/Logo_HUS.png/200px-Logo_HUS.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'HCMUS': {
    name: 'ĐH Khoa học Tự nhiên - ĐHQG TPHCM',
    short: 'HCMUS',
    aliases: ['ĐH KHTN TP.HCM', 'Đại học Khoa học Tự nhiên ĐHQG TPHCM', 'Khoa học Tự nhiên ĐHQG TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/5/5c/HCMUS_logo.png/200px-HCMUS_logo.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'XHNV': {
    name: 'ĐH Khoa học Xã hội & Nhân văn - ĐHQG HN',
    short: 'USSH',
    aliases: ['ĐH KHXH&NV HN', 'KHXH NV HN'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/4/4f/Logo_USSH.png/200px-Logo_USSH.png',
    fallback: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=120&h=120&fit=crop'
  },
  'USSH': {
    name: 'ĐH KHXH & NV – ĐHQG TP.HCM',
    short: 'USSH HCM',
    aliases: ['ĐH KHXH & NV TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/4/4f/Logo_USSH.png/200px-Logo_USSH.png',
    fallback: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=120&h=120&fit=crop'
  },
  'NEU': {
    name: 'ĐH Kinh tế Quốc dân',
    short: 'NEU',
    aliases: ['KTQD'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/f/f0/Logo_NEU.png/200px-Logo_NEU.png',
    fallback: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=120&h=120&fit=crop'
  },
  'FTU': {
    name: 'ĐH Ngoại thương',
    short: 'FTU',
    aliases: ['ĐH Ngoại thương – Cơ sở II TP.HCM', 'Ngoại thương'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/d/d0/Logo_FTU.png/240px-FTU.png',
    fallback: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&h=120&fit=crop'
  },

  // TP.HCM
  'UIT': {
    name: 'ĐH CNTT - ĐHQG TPHCM',
    short: 'UIT',
    aliases: ['ĐH Công nghệ Thông tin – ĐHQG TP.HCM', 'ĐH CNTT TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/7/74/Logo_UIT.png/200px-Logo_UIT.png',
    fallback: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=120&h=120&fit=crop'
  },
  'UEH': {
    name: 'ĐH Kinh tế TPHCM',
    short: 'UEH',
    aliases: ['ĐH Kinh tế TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9f/Logo_UEH.png/200px-Logo_UEH.png',
    fallback: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&h=120&fit=crop'
  },
  'FPT': {
    name: 'ĐH FPT',
    short: 'FPT',
    aliases: ['FPTU', 'ĐH FPT'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a6/Logo_FPT_Education.png/220px-Logo_FPT_Education.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'FUNIX': {
    name: 'FUNiX (FPT)',
    short: 'FUNiX',
    aliases: [],
    logo: 'https://funix.edu.vn/wp-content/uploads/2021/05/logo-funix.png',
    fallback: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&h=120&fit=crop'
  },
  'TDTU': {
    name: 'ĐH Tôn Đức Thắng',
    short: 'TDTU',
    aliases: ['Tôn Đức Thắng'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c4/Logo-TDTU.png/200px-Logo-TDTU.png',
    fallback: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=120&h=120&fit=crop'
  },
  'NTTU': {
    name: 'ĐH Nguyễn Tất Thành',
    short: 'NTTU',
    aliases: ['Nguyễn Tất Thành'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8e/Logo_NTTU.png/200px-Logo_NTTU.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'HCMIU': {
    name: 'ĐH Quốc tế - ĐHQG TPHCM',
    short: 'HCMIU',
    aliases: ['ĐH Quốc tế TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/5/55/HCMIU_logo.png/200px-HCMIU_logo.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'NLU': {
    name: 'ĐH Nông Lâm TPHCM',
    short: 'NLU',
    aliases: ['HCMUAF', 'Nông Lâm TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/4/49/HCMUAF_logo.png/200px-HCMUAF_logo.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'HUFI': {
    name: 'ĐH Công nghiệp Thực phẩm TPHCM',
    short: 'HUFI',
    aliases: ['ĐH Công nghiệp Thực phẩm TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/2/2a/HUFI_logo.png/200px-HUFI_logo.png',
    fallback: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=120&h=120&fit=crop'
  },
  'HUB': {
    name: 'ĐH Ngân hàng TPHCM',
    short: 'HUB',
    aliases: ['ĐH Ngân hàng TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/1/1a/HUB_logo.png/200px-HUB_logo.png',
    fallback: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=120&h=120&fit=crop'
  },
  'HCMUE': {
    name: 'ĐH Sư phạm TPHCM',
    short: 'HCMUE',
    aliases: ['ĐH Sư phạm TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9a/HCMUE_logo.png/200px-HCMUE_logo.png',
    fallback: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=120&h=120&fit=crop'
  },
  'VLU': {
    name: 'ĐH Văn Lang',
    short: 'VLU',
    aliases: ['Văn Lang'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/3/3a/Logo_VLU.png/200px-Logo_VLU.png',
    fallback: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&h=120&fit=crop'
  },
  'PNTU': {
    name: 'ĐH Y khoa Phạm Ngọc Thạch',
    short: 'PNTU',
    aliases: ['Phạm Ngọc Thạch', 'PNT'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/d/d8/Logo_PNT.png/200px-Logo_PNT.png',
    fallback: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=120&h=120&fit=crop'
  },
  'UMP': {
    name: 'ĐH Y Dược TPHCM',
    short: 'UMP',
    aliases: ['Y Dược TP.HCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9f/Logo_UMP.png/200px-Logo_UMP.png',
    fallback: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=120&h=120&fit=crop'
  },
  'CTUMP': {
    name: 'ĐH Y Dược Cần Thơ',
    short: 'CTUMP',
    aliases: ['Y Dược Cần Thơ'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/7/7e/CTUMP_logo.png/200px-CTUMP_logo.png',
    fallback: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=120&h=120&fit=crop'
  },

  // Miền Trung
  'CTU': {
    name: 'ĐH Cần Thơ',
    short: 'CTU',
    aliases: ['ĐH Cần Thơ'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/0/0e/Logo_CTU.png/200px-Logo_CTU.png',
    fallback: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&h=120&fit=crop'
  },
  'DTHU': {
    name: 'ĐH Đồng Tháp',
    short: 'DThU',
    aliases: ['Đồng Tháp'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a1/Logo_DThU.png/200px-Logo_DThU.png',
    fallback: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&h=120&fit=crop'
  },
  'DUT': {
    name: 'ĐH Bách khoa - ĐH Đà Nẵng',
    short: 'DUT',
    aliases: ['ĐH Bách khoa Đà Nẵng', 'Đại học Bách khoa Đại học Đà Nẵng', 'Bách khoa Đại học Đà Nẵng'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/3/3a/DUT_Logo.png/200px-DUT_Logo.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  },
  'DUE': {
    name: 'ĐH Kinh tế - ĐH Đà Nẵng',
    short: 'DUE',
    aliases: ['ĐH Kinh tế Đà Nẵng', 'Đại học Kinh tế Đại học Đà Nẵng', 'Kinh tế Đại học Đà Nẵng'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a2/DUE_logo.png/200px-DUE_logo.png',
    fallback: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&h=120&fit=crop'
  },
  'DTU': {
    name: 'ĐH Duy Tân',
    short: 'DTU',
    aliases: ['Duy Tân'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/b/b1/DTU_Logo.png/200px-DTU_Logo.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'NTU': {
    name: 'ĐH Nha Trang',
    short: 'NTU',
    aliases: ['Nha Trang'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8a/NTU_logo.png/200px-NTU_logo.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'QNU': {
    name: 'ĐH Quy Nhơn',
    short: 'QNU',
    aliases: ['Quy Nhơn'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/d/d3/QNU_logo.png/200px-QNU_logo.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'DAU': {
    name: 'ĐH Đông Á',
    short: 'DAU',
    aliases: ['Đông Á'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c5/DAU_logo.png/200px-DAU_logo.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'HUAF': {
    name: 'ĐH Nông Lâm - ĐH Huế',
    short: 'HUAF',
    aliases: ['Nông Lâm Huế', 'Đại học Nông Lâm Đại học Huế', 'Nông Lâm Đại học Huế'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9a/HUAF_logo.png/200px-HUAF_logo.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'HUSC': {
    name: 'ĐH Khoa học - ĐH Huế',
    short: 'HUSC',
    aliases: ['Khoa học Huế', 'Đại học Khoa học Đại học Huế', 'Khoa học Đại học Huế'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/b/b3/HUSC_logo.png/200px-HUSC_logo.png',
    fallback: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=120&h=120&fit=crop'
  },
  'HUCFL': {
    name: 'ĐH KHXH & NV - ĐH Huế',
    short: 'HUCFL',
    aliases: ['KHXH NV Huế', 'Đại học KHXH NV Đại học Huế', 'KHXH NV Đại học Huế'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c7/HUCFL_logo.png/200px-HUCFL_logo.png',
    fallback: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=120&h=120&fit=crop'
  },
  'HUEMEDU': {
    name: 'ĐH Y Dược - ĐH Huế',
    short: 'HuemedU',
    aliases: ['Y Dược Huế', 'Đại học Y Dược Đại học Huế', 'Y Dược Đại học Huế'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/d/d8/HUEMED_logo.png/200px-HUEMED_logo.png',
    fallback: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=120&h=120&fit=crop'
  },
  'PXU': {
    name: 'ĐH Phú Xuân',
    short: 'PXU',
    aliases: ['Phú Xuân'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a4/PXU_logo.png/200px-PXU_logo.png',
    fallback: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&h=120&fit=crop'
  },
  'VKU': {
    name: 'ĐH CNTT TT&TT Việt - Hàn',
    short: 'VKU',
    aliases: ['VKU', 'Việt Hàn', 'ĐH CNTT TT&TT Việt Hàn', 'ĐH Công nghệ TT&TT Việt Hàn'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c2/VKU_logo.png/200px-VKU_logo.png',
    fallback: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=120&h=120&fit=crop'
  },
  'RMIT': {
    name: 'RMIT University Vietnam',
    short: 'RMIT',
    aliases: [],
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/RMIT_University_logo.svg/240px-RMIT_University_logo.svg.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  },

  // Khác
  'VNU_HCM': {
    name: 'ĐHQG TPHCM',
    short: 'ĐHQG HCM',
    aliases: ['ĐHQG TP.HCM', 'ĐHQG TPHCM', 'Đại học Quốc gia TP.HCM', 'Đại học Quốc gia TPHCM'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/82/Logo_VNU-HCM.png/200px-Logo_VNU-HCM.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  },
  'VNU_HN': {
    name: 'ĐHQG Hà Nội',
    short: 'VNU',
    aliases: ['ĐHQG HN', 'ĐHQG Hà Nội', 'Đại học Quốc gia Hà Nội'],
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/2/2a/Logo_VNU.png/200px-Logo_VNU.png',
    fallback: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=120&h=120&fit=crop'
  }
};

// Helper: tìm logo theo mã, short, alias, hoặc tên (match mềm)
// So sánh sau khi loại bỏ dấu gạch ngang/khoảng trắng/dấu Việt
window.UNILogo = function(codeOrName) {
  if (!codeOrName) return null;

  const normalize = (s) => String(s || '')
    .toLowerCase()
    .replace(/[–—\-]/g, ' ')   // gạch ngang, em-dash, en-dash → space
    .replace(/[^a-z0-9à-ỹ\s]/gi, '') // bỏ ký tự đặc biệt
    .replace(/\s+/g, ' ')
    .trim();

  const needle = normalize(codeOrName);
  if (!needle) return null;

  // 1. Match theo code (exact)
  const upper = String(codeOrName).toUpperCase().trim();
  if (window.UNI_LOGOS[upper]) return window.UNI_LOGOS[upper];

  // Tính điểm match cho mỗi entry
  const candidates = [];
  for (const [code, info] of Object.entries(window.UNI_LOGOS)) {
    let score = 0;
    // Match code exact
    if (code.toUpperCase() === upper) score = Math.max(score, 1000);
    // Match short exact (normalized)
    const shortNorm = normalize(info.short);
    if (shortNorm === needle) score = Math.max(score, 900);
    // Match name exact
    const nameNorm = normalize(info.name);
    if (nameNorm === needle) score = Math.max(score, 800);
    // Match alias exact
    if (Array.isArray(info.aliases)) {
      for (const a of info.aliases) {
        const aNorm = normalize(a);
        if (aNorm === needle) score = Math.max(score, 700);
      }
    }
    // Substring match — ưu tiên chuỗi match dài hơn
    if (needle.length >= 4) {
      if (nameNorm.includes(needle)) score = Math.max(score, needle.length * 10);
      if (shortNorm.includes(needle)) score = Math.max(score, needle.length * 12);
      if (Array.isArray(info.aliases)) {
        for (const a of info.aliases) {
          const aNorm = normalize(a);
          if (aNorm.length > 2 && aNorm.includes(needle)) {
            score = Math.max(score, aNorm.length * 8);
          }
          // Đảo ngược: alias là tập con của needle
          if (aNorm.length >= 4 && needle.includes(aNorm)) {
            score = Math.max(score, aNorm.length * 6);
          }
        }
      }
      // Đảo lại: needle chứa short/alias (VD: 'ĐH Bách khoa ĐHQG TP.HCM' chứa 'bách khoa')
      if (shortNorm.length >= 4 && needle.includes(shortNorm)) {
        score = Math.max(score, shortNorm.length * 5);
      }
      // Đảo lại: needle chứa name
      if (nameNorm.length >= 4 && needle.includes(nameNorm)) {
        score = Math.max(score, nameNorm.length * 4);
      }
    }
    if (score > 0) candidates.push({ info, score });
  }

  if (candidates.length === 0) return null;

  // Trả về entry có score cao nhất
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].info;
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

// Render card đầy đủ: logo + tên trường + nhãn code (kiểu UEH)
window.UNILogoCard = function(codeOrName, options = {}) {
  const info = window.UNILogo(codeOrName);
  const size = options.size || 56;
  if (!info) {
    return `
      <div class="uni-card uni-card-unknown">
        <div class="uni-card-logo" style="background:linear-gradient(135deg,#6366f1,#a78bfa);">${(codeOrName||'?').slice(0,2).toUpperCase()}</div>
        <div class="uni-card-text">
          <div class="uni-card-name">${codeOrName || 'Trường khác'}</div>
        </div>
      </div>`;
  }
  return `
    <div class="uni-card">
      <img src="${info.logo}" alt="${info.name}" class="uni-card-logo"
           onerror="this.onerror=null;this.src='${info.fallback}'" />
      <div class="uni-card-text">
        <div class="uni-card-name">${info.name}</div>
        <span class="uni-card-badge">${info.short}</span>
      </div>
    </div>`;
};