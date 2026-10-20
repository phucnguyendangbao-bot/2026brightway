import { canonicalSchoolId } from './university-identities.js';
import { schoolProgramDetails } from './school-programs-2024-2026.js';

const fptProgramsUrl = 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/thong-tin-tuyen-sinh-nam-2026/';
const fptScoresUrl = 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/truong-dai-hoc-fpt-cong-bo-diem-chuan-nam-2026-tiep-tuc-nhan-ho-so-xet-tuyen-mot-so-nganh/';

export const schoolProfileDetails = {
  fpt: {
    year: 2026,
    programSource: fptProgramsUrl,
    scoreSource: fptScoresUrl,
    scoreScale: 30,
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

export const detailsForSchool = (id, year = 2026) => {
  const schoolId = canonicalSchoolId(id);
  const selectedYear = Number(year);
  if (selectedYear !== 2026) return null;
  const verifiedDetails = schoolProfileDetails[schoolId] || null;
  const programDetails = schoolProgramDetails[schoolId]?.[selectedYear] || null;
  if (!programDetails) return verifiedDetails;
  if (!verifiedDetails) return programDetails;
  return { ...programDetails, ...verifiedDetails, programs: verifiedDetails.programs || programDetails.programs };
};
