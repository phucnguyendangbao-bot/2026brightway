# Rà soát thông tin và tính năng — 20/10/2026

## Phạm vi và nguyên tắc

Tập trung tính đúng của thông tin hiển thị, công thức có căn cứ và thao tác thực tế; không tiếp tục trang trí giao diện trong đợt này. Sửa lỗi đã tái hiện, phân biệt dữ liệu thiếu với thông tin trường chưa công bố, không tự tạo điểm chuẩn/công thức hoặc kết luận đậu/rớt.

Đây là một đợt kiểm tra có phạm vi, không phải chứng nhận toàn bộ dữ liệu website chính xác và cập nhật. Bộ dữ liệu có 614 dòng ngành/chương trình nhập từ bảng tính, 8 dòng FPT riêng và 102 nghề; chưa đối chiếu thủ công toàn bộ từng dòng với nguồn gốc.

## Lỗi thông tin đã sửa

| Vấn đề | Sửa và giới hạn |
| --- | --- |
| FPT kiểm tra tổ hợp chỉ bằng chữ đầu A/C | Kiểm tra môn theo định nghĩa trong thông báo trường: tổ hợp có Toán; tổ hợp có Ngữ văn không áp dụng CNTT/Khoa học máy tính nếu không có Toán. Truyền mã ngành đã chọn vào phép kiểm tra. Chỉ tính thành phần kết hợp, chưa đủ để kết luận trúng tuyển. |
| Điểm chuẩn NTU có hệ số nhưng thiếu thang điểm | Ghi rõ thang 40 và môn nhân hệ số trong các tổ hợp trích T2VA/TVA2/TV2A. Không so trực tiếp với tổng ba môn thang 30. |
| Mã ngành chưa được nhập bị ghi “Chưa công bố” | Đổi thành “Chưa đối chiếu mã”; không suy diễn trạng thái công bố của trường. |
| Danh mục HUIT/HUB từ nguồn thứ cấp được trình bày như danh mục trường xác nhận | Gắn nhãn nguồn thứ cấp, bỏ màu trạng thái xác nhận. |
| Danh mục RMIT hiện hành bị hiểu là toàn bộ ngành mở tuyển 2026 | Ghi rõ danh mục hiện hành; phải kiểm tra kỳ nhập học và cơ sở. |
| Số dòng đã nhập bị hiểu là tổng số ngành của trường | Ghi “Đã nhập … ngành/CT”, giữ chú thích phạm vi trích. |
| Đại học Huế dùng nhận diện trường Y Dược thành viên | Dùng mã HUEUNI, bỏ logo Y Dược khỏi bản ghi hệ thống Đại học Huế. |
| Lộ trình bác sĩ dùng thời gian thực hành cũ và thuật ngữ chứng chỉ | Sửa theo nguồn Chính phủ, dùng giấy phép hành nghề; ghi ngày đối chiếu và cảnh báo quy định tương lai có thể thay đổi. |
| Một số nghề sức khỏe/luật mô tả bằng cấp như điều kiện đủ hành nghề | Bổ sung phân biệt văn bằng, thực hành, giấy phép/bổ nhiệm; 10 hồ sơ sức khỏe/luật có liên kết nguồn chính thức và ngày đối chiếu. Không trình bày đây là danh sách điều kiện đầy đủ. |
| Pilot có mức học phí/thời gian chung chưa có nguồn; bootcamp bị cam kết đủ vào nghề; TESOL/CELTA/PMP bị xem như điều kiện chung | Bỏ các cam kết không có căn cứ, hướng người dùng đến chương trình/vị trí cụ thể. |
| Trang ngành CMS cũ hiển thị lương/triển vọng thiếu nguồn và gọi trường là “hàng đầu” | Ngừng xuất bản các số liệu thiếu nguồn/năm; danh sách trường được ghi là gợi ý biên tập, không phải xếp hạng hoặc xác nhận đang tuyển ngành. Dữ liệu gốc không bị xóa. |

## Lỗi tính năng đã sửa

- CTU: không áp dụng ngưỡng điểm thi THPT cho tổng học bạ; bài thi riêng không có công thức được báo thiếu quy đổi, không trả câu kết quả rời rạc.
- Hồ sơ: giữ cả giá trị và thang điểm HSA/V-ACT/TSA, thay vì chỉ lưu mô tả chung không có điểm.
- Liên kết trường đã lưu: `?school=...` mở đúng cửa sổ chi tiết trường.
- URL hash bị mã hóa lỗi: không làm dừng trang tra cứu.
- Nghề đã lưu trên cloud nhưng chưa lưu cục bộ: bấm đầu tiên thực hiện bỏ lưu đúng ý định. Trạng thái nút, nhãn và `aria-pressed` đồng nhất; kết quả đọc cloud đến muộn không ghi đè thao tác mới.
- Liên kết nguồn trong công cụ điểm: ưu tiên nguồn trường, không gọi trang tra cứu thứ cấp là nguồn chính thức.
- Trang ngành CMS: bỏ JavaScript điều hướng nhúng trong dữ liệu slug; dùng sự kiện click/Enter và mã hóa URL. Escape nhãn, tên trường và fallback logo để nội dung HTML từ CMS không được thực thi.
- Cập nhật phiên bản tài nguyên cho ba trang công cụ chính.

## Đối chiếu nguồn

Các nguồn sau đã được đọc trong đợt rà soát; việc đọc một trang không xác nhận mọi phương thức hoặc mọi cơ sở của trường:

- [Thông báo FPT 10/04/2026](https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/thong-bao-tuyen-sinh-truong-dai-hoc-fpt-he-dai-hoc-chinh-quy-nam-2026/): định nghĩa tổ hợp và công thức kết hợp.
- [Điểm chuẩn FPT 2026](https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/truong-dai-hoc-fpt-cong-bo-diem-chuan-nam-2026-tiep-tuc-nhan-ho-so-xet-tuyen-mot-so-nganh/): 8 dòng điểm đang hiển thị khớp thông báo, phân biệt điểm chuẩn với điểm sàn.
- [Điểm trúng tuyển NTU 2026](https://tuyensinh.ntu.edu.vn/thong-bao/diem-chuan-trung-tuyen-2026): 53 dòng mã/tổ hợp/điểm lưu khớp cột tổ hợp đã trích; bảng tổ hợp có hệ số 2. Không xác nhận điểm ở mọi tổ hợp còn lại.
- [Thông báo DUT](https://dut.udn.vn/TrangNCKH/Thongbao/id/12208): hai giá trị 27 và 27,1 của chương trình tài năng khớp nội dung; chưa nhập đủ công thức để quy đổi.
- [Phương thức 2 CTU](https://tuyensinh.ctu.edu.vn/phuong-thuc-xet-tuyen/938-phuong-thuc-2.html): tách điểm thi gốc với học bạ/bài thi cần quy đổi.
- [Cổng Đại học Huế](https://hueuni.edu.vn/portal/vi/): phân biệt hệ thống với trường Y Dược thành viên.
- [Thời gian thực hành theo Nghị định 96/2023](https://baochinhphu.vn/quy-dinh-thoi-gian-thuc-hanh-de-cap-giay-phep-hanh-nghe-kham-chua-benh-102240112172836879.htm), [toàn văn nghị định](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-kham-benh-chua-benh-119240115115947657.htm), [quy trình cấp phép](https://xaydungchinhsach.chinhphu.vn/quy-trinh-cap-giay-phep-hanh-nghe-kham-chua-benh-doi-voi-bac-sy-y-sy-dieu-duong-119240113091129676.htm), [hồ sơ cấp mới cập nhật 2026](https://xaydungchinhsach.chinhphu.vn/quy-dinh-ho-so-trinh-tu-thu-tuc-cap-moi-giay-phep-hanh-nghe-kham-benh-chua-benh-119260501081456071.htm): đối chiếu thuật ngữ và phân biệt bằng tốt nghiệp với quyền hành nghề.
- [Thông tư 10/2021/TT-BTP](https://vbpl.moj.gov.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=151695), [những điểm mới Luật Công chứng 2024](https://xaydungchinhsach.chinhphu.vn/nhung-diem-moi-cua-luat-cong-chung-nam-2024-119241224213628373.htm): phân biệt tập sự/kiểm tra, cấp chứng chỉ và bổ nhiệm.

## Kiểm thử

- `npm test`: 48 tests; gồm biên điểm, công thức FPT, điều kiện ngành, thang điểm, phân loại nguồn, nguồn của 10 lộ trình hành nghề.
- `npm run validate`: 20 trang HTML, 382 tham chiếu cục bộ, 63 kiểm tra cú pháp JavaScript/script nhúng.
- `npm run test:e2e`: 12 nhóm kịch bản trên Edge; trong đó 36 lượt kiểm tra bố cục ở 6 kích thước màn hình.
- Kịch bản mới: FPT C00 bị từ chối cho CNTT nhưng dùng được cho Quản trị kinh doanh; D01 có Toán dùng được cho CNTT; CTU phân biệt học bạ/bài thi riêng; HSA lưu 100/150; nguồn thứ cấp và thang NTU; mã hash lỗi; cửa sổ trường; nguồn bác sĩ; bỏ lưu cloud bằng mô phỏng.
- Kịch bản CMS dùng dữ liệu giả lập chứa HTML và slug có dấu nháy: không thực thi HTML, không hiện số lương/việc làm không nguồn, điều hướng Enter giữ nguyên slug. Không ghi dữ liệu CMS thật.
- Báo cáo trình duyệt: `.cache/ux-e2e/report.json`. Website tĩnh không có bước frontend build riêng.

## Giới hạn còn lại

- Chưa xác minh toàn bộ 614 dòng nhập, toàn bộ 102 nghề, mọi URL ngoài hoặc mọi kỳ nhập học. Dữ liệu thiếu được ghi rõ thay vì suy diễn.
- Chưa có đủ công thức theo từng ngành, cơ sở và phương thức cho mọi trường. Công cụ không dự đoán đậu/rớt.
- Đồng bộ tài khoản được kiểm tra bằng mô phỏng, chưa kiểm thử với tài khoản thật. Luồng API chat lỗi đã kiểm tra, không chứng nhận mọi câu trả lời AI đúng.
- Không thử giao dịch quản trị hoặc ghi dữ liệu lên tài khoản/dịch vụ thật trong kiểm thử.
