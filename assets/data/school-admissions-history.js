// Read-only archive. A source link is not certification of every program/formula.
// Keep this separate from schools.json (also used by scholarship features).
import { canonicalSchoolId } from './university-identities.js';

export const HISTORY_CHECKED_AT = '2026-10-15';
export const admissionsHistory = [
  {
    school_id: 'hcmut', admission_year: 2025, source_status: 'published_notice',
    title: 'Xét tuyển tổng hợp và điểm chuẩn 2025',
    summary: 'Điểm xét tuyển tổng hợp năm 2025 gồm điểm học lực, điểm cộng và điểm ưu tiên. Điểm học lực có cách tính riêng cho các nhóm đối tượng; không phải chỉ cộng điểm ba môn THPT.',
    note: 'Nguồn là thông báo công bố điểm chuẩn trên website Khoa Cơ khí của trường. Bảng điểm chuẩn cần đối chiếu đúng ngành và chương trình.',
    links: [{ label: 'Thông báo điểm chuẩn 2025', url: 'https://fme.hcmut.edu.vn/cong-bo-diem-chuan-cua-phuong-thuc-xet-tuyen-tong-hop-nam-2025.html' }]
  },
  {
    school_id: 'uit', admission_year: 2025, source_status: 'provisional_methods',
    title: 'Phương thức và điểm trúng tuyển 2025',
    summary: 'Trang phương thức 2025 giới thiệu tuyển thẳng/ưu tiên xét tuyển, xét kết quả ĐGNL ĐHQG-HCM và kết quả thi tốt nghiệp THPT. Chương trình liên kết có tiêu chí riêng.',
    note: 'Trang phương thức vẫn ghi “dự kiến”; không coi mọi chỉ tiêu trong đó là số cuối cùng. Thông báo điểm trúng tuyển ngày 22/08/2025 bên dưới chỉ dành cho phương thức thi THPT.',
    links: [
      { label: 'Phương thức 2025 (dự kiến)', url: 'https://tuyensinh.uit.edu.vn/2025-phuong-thuc-tuyen-sinh-nam-2025' },
      { label: 'Điểm trúng tuyển THPT 2025', url: 'https://tuyensinh.uit.edu.vn/node/4147' }
    ]
  },
  {
    school_id: 'fpt', admission_year: 2025, source_status: 'official_recap',
    title: 'Kết quả tuyển sinh 2025 trên trang FPT',
    summary: 'Phần tổng kết 2025 nêu các diện sử dụng kết quả thi THPT, học bạ/Schoolrank và đánh giá năng lực. Điều kiện của năm 2025 khác phương thức kết hợp thi THPT và học bạ lớp 12 của năm 2026.',
    note: 'Bài của FPT Cần Thơ đăng ngày 11/06/2026, có cả hai năm. Chỉ đọc mục “Điểm chuẩn Trường Đại học FPT Cần Thơ 2025 theo các phương thức” để tham khảo năm 2025; đối chiếu cơ sở và diện thí sinh.',
    links: [{ label: 'Tổng kết kết quả tuyển sinh 2025', url: 'https://daihoc.fpt.edu.vn/huong-nghiep/diem-chuan-dai-hoc-fpt-can-tho/' }]
  },
  {
    school_id: 'ueh', admission_year: 2025, source_status: 'published_notice',
    title: 'Tuyển sinh khóa 51 · năm 2025',
    summary: 'UEH công bố kết quả theo năm nhóm phương thức: tuyển thẳng; THPT nước ngoài/chứng chỉ quốc tế; kết quả học tập tốt; đánh giá năng lực kết hợp tiếng Anh; thi THPT kết hợp tiếng Anh.',
    note: 'Phải phân biệt chương trình đào tạo, mã KSA tại TP.HCM và KSV tại UEH Mekong. Điểm chuẩn trong thông báo thuộc khóa 51 năm 2025, không phải ngưỡng trúng tuyển năm sau.',
    links: [{ label: 'Thông báo điểm chuẩn khóa 51 (2025)', url: 'https://tuyensinh.ueh.edu.vn/bai-viet/ueh-cong-bo-diem-chuan-cac-phuong-thuc-xet-tuyen-khoa-51-dai-hoc-chinh-quy-nam-2025-va-doi-moi-quy-trinh-nhap-hoc-voi-hinh-thuc-truc-tuyen-hoan-toan/' }]
  },
  {
    school_id: 'ctu', admission_year: 2025, source_status: 'linked_document',
    title: 'Tài liệu tuyển sinh chính quy 2025',
    summary: 'Cổng tuyển sinh Cần Thơ có mục lưu trữ thông tin tuyển sinh 2025, dẫn tới tài liệu PDF riêng của năm này.',
    note: 'Đã kiểm tra liên kết PDF hoạt động và được cổng chính thức dẫn chiếu. Chưa nhập bảng ngành, chỉ tiêu hay điểm chuẩn từ tài liệu; cần đọc bản gốc để đối chiếu.',
    links: [
      { label: 'Thông tin tuyển sinh 2025 (PDF)', url: 'https://tuyensinh.ctu.edu.vn/images/upload/TTTS-DHCQ-2025.pdf' },
      { label: 'Cổng trường · mục lưu trữ các năm', url: 'https://tuyensinh.ctu.edu.vn/dai-hoc-chinh-quy' }
    ]
  },
  {
    school_id: 'hcmus', admission_year: 2025, source_status: 'published_notice',
    title: 'Phương thức và điểm chuẩn 2025',
    summary: 'Thông tin 2025 gồm tuyển thẳng/ưu tiên xét tuyển, kết quả thi THPT và ĐGNL ĐHQG-HCM. Diện chứng chỉ ngoại ngữ quốc tế kết hợp học tập THPT có thông báo điều kiện riêng.',
    note: 'Bảng điểm chuẩn chính thức được trường đăng theo từng phương thức. Xem đúng ngành/nhóm ngành và chương trình; không so trực tiếp điểm ở hai thang khác nhau.',
    links: [
      { label: 'Thông tin tuyển sinh 2025', url: 'https://tuyensinh.hcmus.edu.vn/2025-thong-tin-tuyen-sinh/' },
      { label: 'Điểm chuẩn các phương thức 2025', url: 'https://tuyensinh.hcmus.edu.vn/2025-diem-chuan-cac-phuong-thuc/' }
    ]
  },
  {
    school_id: 'sgu', admission_year: 2025, source_status: 'linked_document',
    title: 'Thông tin tuyển sinh chính quy 2025',
    summary: 'Trang thông báo chính thức của Đại học Sài Gòn, đăng ngày 14/06/2025, có tài liệu tuyển sinh chính quy 2025 đính kèm.',
    note: 'Chưa nhập bảng ngành, chỉ tiêu và công thức từ tài liệu đính kèm. Không dùng thông báo “dự kiến” trước đó thay cho tài liệu này.',
    links: [{ label: 'Thông báo và tài liệu tuyển sinh 2025', url: 'https://tuyensinh.sgu.edu.vn/index.php/tuyen-sinh/thong-tin-de-an-tuyen-sinh/nam-2025/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2025' }]
  }
].map(row => ({ ...row, checked_at: HISTORY_CHECKED_AT, use_for_calculation: false }));

export function historyForSchool(id, year = 2025) {
  // Never silently substitute a different year, school or branch.
  return admissionsHistory.find(row => row.school_id === canonicalSchoolId(id) && row.admission_year === Number(year)) || null;
}
