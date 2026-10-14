# Kho thông tin tuyển sinh năm trước

Rà soát: 2026-10-15. Phạm vi: trang tra cứu trường (`page2.html`), không thay đổi dữ liệu học bổng hoặc công cụ tính điểm.

## Hiển thị

Mỗi hồ sơ có hai nút năm 2026 và 2025. Mặc định giữ 2026; chọn 2025 ẩn nội dung 2026 của hồ sơ đó. Lựa chọn được giữ khi lọc trường trong cùng lần mở trang. Liên kết `page2.html?admission_year=2025#hcmut` mở trực tiếp kho 2025.

Kho 2025 không dùng để tính điểm hoặc kết luận đỗ/trượt. Điểm chuẩn/học phí chi tiết theo ngành chưa được nhập. Trường không có nguồn hiển thị trạng thái thiếu dữ liệu, không lấy bản 2026 thay thế.

## Nguồn và giới hạn

| Trường | Nguồn 2025 | Phạm vi đã đọc/kiểm tra |
| --- | --- | --- |
| HCMUT | [Thông báo điểm chuẩn xét tuyển tổng hợp](https://fme.hcmut.edu.vn/cong-bo-diem-chuan-cua-phuong-thuc-xet-tuyen-tong-hop-nam-2025.html) | Đọc thông báo tại Khoa Cơ khí: ba thành phần điểm; chưa chép bảng điểm chuẩn. Link công thức 2025 từ bài hiện chuyển 404 nên không đưa link đó vào UI. |
| UIT | [Phương thức](https://tuyensinh.uit.edu.vn/2025-phuong-thuc-tuyen-sinh-nam-2025), [điểm trúng tuyển THPT](https://tuyensinh.uit.edu.vn/node/4147) | Trang phương thức vẫn có nhãn dự kiến, phải giữ cảnh báo; điểm THPT là thông báo ngày 22/08/2025, không phải tất cả phương thức. |
| FPT | [Bài tổng kết trên website trường](https://daihoc.fpt.edu.vn/huong-nghiep/diem-chuan-dai-hoc-fpt-can-tho/) | Đọc riêng mục kết quả 2025. Bài đăng 11/06/2026 chứa hai năm; không lấy công thức 2026 cho năm 2025. |
| UEH | [Điểm chuẩn khóa 51](https://tuyensinh.ueh.edu.vn/bai-viet/ueh-cong-bo-diem-chuan-cac-phuong-thuc-xet-tuyen-khoa-51-dai-hoc-chinh-quy-nam-2025-va-doi-moi-quy-trinh-nhap-hoc-voi-hinh-thuc-truc-tuyen-hoan-toan/) | Web reader timeout; HTTP fetch trực tiếp trả 200, đã đọc tóm tắt 5 phương thức và phân biệt KSA/KSV. Chưa nhập bảng ngành. |
| CTU | [PDF 2025](https://tuyensinh.ctu.edu.vn/images/upload/TTTS-DHCQ-2025.pdf), [cổng chính thức](https://tuyensinh.ctu.edu.vn/dai-hoc-chinh-quy) | Trích đúng liên kết 2025 ở mục lưu trữ của cổng; PDF trả 200 với kiểu application/pdf. Chưa trích nội dung PDF hay chứng nhận công thức. |
| HCMUS | [Thông tin 2025](https://tuyensinh.hcmus.edu.vn/2025-thong-tin-tuyen-sinh/), [điểm chuẩn](https://tuyensinh.hcmus.edu.vn/2025-diem-chuan-cac-phuong-thuc/) | Đọc phương thức và thông báo điểm chuẩn. Các bảng điểm nằm trong ảnh, chưa nhập số theo ngành. |
| SGU | [Thông báo chính quy 2025](https://tuyensinh.sgu.edu.vn/index.php/tuyen-sinh/thong-tin-de-an-tuyen-sinh/nam-2025/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2025) | Đọc tiêu đề, ngày 14/06/2025 và sự hiện diện tài liệu đính kèm; chưa trích nội dung tài liệu. |

30 hồ sơ còn lại chưa được bổ sung nguồn 2025 trong đợt này. Không ngụ ý đã xác minh đầy đủ đề án của cả 37 hồ sơ.

## Kiểm thử

Kiểm thử đơn vị: năm/alias/nguồn chính thức, không fallback sai năm, trạng thái thiếu dữ liệu và giới hạn nguồn. Kiểm thử trình duyệt: đổi năm, ẩn nội dung khác năm, giữ lựa chọn qua tìm kiếm, thao tác bàn phím, mở trực tiếp bằng URL và trường chưa có bản lưu trữ; ba kích thước 1440, 768, 390 px.

Kết quả local: `node --test` đạt 19/19; `scripts/qa-upgrade-browser.cjs` đạt 30/30 kịch bản (bao gồm hồi quy các trang khác và trạng thái tải lỗi). Đã xem ảnh hồ sơ HCMUT ở desktop và mobile; nội dung và các nút không bị cắt.
