// Public, curated content boundary. Never put contracts, student data or secrets here.
// Editorial inclusion is NOT a partnership, ranking or paid placement.
export const featuredUniversityIds = ['fpt', 'uit', 'tdtu'];
export const universityShowcaseImages = {
  fpt: 'assets/images/hero/01-fpt-can-tho.jpg',
  uit: 'assets/images/hero/16-uit-campus.png',
  tdtu: 'assets/images/hero/17-tdtu-campus.png',
};

// Intentionally empty: no verified commercial relationships have been supplied.
// Future partner management must publish reviewed, time-bounded records, not bids.
export const universityPartners = [];
export const universityCampaigns = [];

export const universityOpportunities = [
  {
    id: 'fpt-scholarship-2026', schoolId: 'fpt', kind: 'scholarship',
    funding: 'editorial', status: 'verified', availability: 'reference',
    title: 'Học bổng Nguyễn Văn Đạo 2026',
    description: 'Tìm hiểu hướng dẫn hồ sơ và điều kiện từ trường. Tư liệu năm 2026, không xác nhận còn nhận hồ sơ.',
    publishedAt: '2026-02-02', verifiedAt: '2026-10-20',
    sourceUrl: 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/huong-dan-nop-ho-so-dang-ky-chuong-trinh-tim-kiem-nhan-tai-ky-nguyen-so-viet-nam-2026/',
  },
  {
    id: 'ueh-admissions-2026', schoolId: 'ueh', kind: 'admissions',
    funding: 'editorial', status: 'verified', availability: 'reference',
    title: 'Tìm hiểu tuyển sinh chính quy UEH 2026',
    description: 'Đọc thông tin Khóa 52 và yêu cầu theo chương trình. Tư liệu năm 2026, không phải thông báo đang mở đăng ký.',
    publishedAt: '2026-04-28', verifiedAt: '2026-10-20',
    sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026/',
  },
  {
    id: 'fpt-consultation', schoolId: 'fpt', kind: 'consultation',
    funding: 'editorial', status: 'verified', availability: 'contact',
    title: 'Trao đổi trực tiếp với bộ phận tuyển sinh FPT',
    description: 'Xem kênh liên hệ của trường để hỏi về chương trình, cơ sở và kỳ tuyển sinh bạn quan tâm.',
    verifiedAt: '2026-10-20', reviewExpiresAt: '2026-11-20T00:00:00+07:00',
    sourceUrl: 'https://daihoc.fpt.edu.vn/lien-he/',
    consultationUrl: 'https://daihoc.fpt.edu.vn/lien-he/',
  },
];
