import { canonicalSchoolId } from './university-identities.js';

const fptProgramsUrl = 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/thong-tin-tuyen-sinh-nam-2026/';
const fptScoresUrl = 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/truong-dai-hoc-fpt-cong-bo-diem-chuan-nam-2026-tiep-tuc-nhan-ho-so-xet-tuyen-mot-so-nganh/';

export const schoolProfileDetails = {
  fpt: {
    year: 2026,
    programSource: fptProgramsUrl,
    scoreSource: fptScoresUrl,
    scoreMethod: 'Xét tuyển kết hợp điểm thi tốt nghiệp THPT và kết quả học tập lớp 12 · thang 30',
    programs: [
      { code: '7480201', name: 'Công nghệ thông tin', score: 18 },
      { code: '7480101', name: 'Khoa học máy tính', score: 21 },
      { code: '7340101', name: 'Quản trị kinh doanh', score: 18 },
      { code: '7320106', name: 'Công nghệ truyền thông', score: 18 },
      { code: '7380101', name: 'Luật', score: 18 },
      { code: '7220201', name: 'Ngôn ngữ Anh', score: 18 },
      { code: '7220210', name: 'Ngôn ngữ Hàn Quốc', score: 18 },
      { code: '7220204', name: 'Ngôn ngữ Trung Quốc', score: 18 },
    ],
  },
  uit: {
    year: 2026,
    scoreSource: 'https://tuyensinh.uit.edu.vn/2026-thong-bao-diem-trung-tuyen-theo-phuong-thuc-xet-tuyen-tong-hop',
  },
  hcmus: {
    year: 2026,
    scoreSource: 'https://tuyensinh.hcmus.edu.vn/2026-diem-chuan/',
  },
};

export const historicalSchoolDetails = {
  fpt: {
    2024: {
      year: 2024,
      score: '21',
      scoreMethod: 'Kết quả thi tốt nghiệp THPT 2024 · Toán + 2 môn cao điểm nhất + điểm ưu tiên · thang 30',
      scoreSource: 'https://daihoc.fpt.edu.vn/tin-tuc-chung-2/truong-dai-hoc-fpt-thong-bao-diem-chuan-xet-tuyen-theo-diem-thi-thpt-2024/',
      admissionSource: 'https://daihoc.fpt.edu.vn/wp-content/uploads/2024/06/DE-AN-TUYEN-SINH-2024.pdf',
    },
    2025: {
      year: 2025,
      score: '18,5',
      scoreMethod: 'Kết quả thi tốt nghiệp THPT 2025 · Toán + 2 môn bất kỳ + điểm ưu tiên · thang 30',
      scoreNote: 'Thí sinh thế hệ 1 có ngưỡng 17 điểm theo thông báo; học bạ/Schoolrank và đánh giá năng lực có điều kiện riêng.',
      scoreSource: 'https://daihoc.fpt.edu.vn/tin-noi-bat-muc-tin-tuc/truong-dai-hoc-fpt-cong-bo-ket-qua-tuyen-sinh-2025/',
    },
  },
  hcmut: {
    2024: {
      year: 2024,
      score: '55,38–84,16/90',
      scoreMethod: 'Khoảng điểm theo phương thức xét tuyển tổng hợp 2024, không phải điểm thi THPT thang 30',
      scoreNote: 'Đây là khoảng điểm toàn trường, không phải điểm của từng ngành. Xem thông báo gốc để đối chiếu chương trình.',
      scoreSource: 'https://fme.hcmut.edu.vn/cong-bo-diem-chuan-cua-phuong-thuc-xet-tuyen-tong-hop-nam-2024.html',
    },
  },
  uit: {
    2024: {
      year: 2024,
      admissionSource: 'https://tuyensinh.uit.edu.vn/2024-phuong-thuc-tuyen-sinh-nam-2024',
    },
  },
  hcmus: {
    2024: {
      year: 2024,
      scoreSource: 'https://tuyensinh.hcmus.edu.vn/thong-bao-ket-qua-trung-tuyen-chinh-thuc-vao-dai-hoc-he-chinh-quy-nam-2024/',
    },
  },
  ueh: {
    2024: {
      year: 2024,
      scoreSource: 'https://tuyensinh.ueh.edu.vn/bai-viet/ueh-cong-bo-diem-chuan-cac-phuong-thuc-xet-tuyen-dai-hoc-chinh-quy-2024-ke-hoach-nhap-hoc-va-chuong-trinh-hoc-bong-tin-dung-hoc-tap/',
    },
  },
  ctu: {
    2024: {
      year: 2024,
      admissionSource: 'https://tuyensinh.ctu.edu.vn/images/upload/DATS2024_TCT.pdf',
    },
  },
};

export const detailsForSchool = (id, year = 2026) => {
  const schoolId = canonicalSchoolId(id);
  return Number(year) === 2026 ? schoolProfileDetails[schoolId] || null
    : historicalSchoolDetails[schoolId]?.[Number(year)] || null;
};
