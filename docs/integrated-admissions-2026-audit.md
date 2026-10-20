# Xét tuyển tổng hợp ĐHQG-HCM 2026 — phạm vi triển khai và nghiệm thu

Đây là checkpoint trước đợt mở rộng. Phạm vi và kết quả mới nhất: [Báo cáo mở rộng cả 8 trường](integrated-expansion-20261020.md).

Rà soát: 20/10/2026. Bản nâng cấp cục bộ, không thay thế toàn bộ công cụ và không chứng nhận chất lượng 8.5/10. Không có thay đổi API, secret, cấu hình production, bảng điểm chuẩn hoặc danh mục trường gốc.

## Kết quả triển khai

- Thêm phương thức thứ tư, giữ ba phương thức hiện có và chế độ tính nhanh.
- Bộ chọn riêng có đúng 8 trường, giữ mã `hcmiu`, không tạo thêm mã `iu`. `uhs` và `agu` chỉ là cấu hình bộ chọn, không chèn bản ghi vào danh mục organic.
- Tách cấu hình quy định, lõi tính thuần và giao diện. `null` biểu thị chưa xác minh, không phải 0 hoặc một hệ số mặc định.
- Chỉ hiện đầu vào của nhánh đang chọn. Học bạ nhập điểm cả năm từng môn ở từng lớp 10, 11, 12; không đánh đồng với điểm học kỳ hoặc điểm trung bình toàn khóa.
- Giữ bản nháp riêng theo trường trên thiết bị, khôi phục sau reload, hỗ trợ liên kết sâu và chuyển mục tiêu từ hồ sơ trường. “Làm lại” xóa cả bản nháp và tham số liên quan.
- Bảng kết quả tách điểm gốc, thang điểm, quy đổi, trọng số, đóng góp, ưu tiên và nguồn. Không kết luận trúng tuyển.
- Không cho nhập điểm cộng tự do. Hồ sơ có điểm thưởng/chứng chỉ/149 trường bị chặn thay vì mặc định cộng 5 điểm.

## Trường nào tính được?

| Trường | Trạng thái thực tế | Giới hạn / phần còn thiếu |
| --- | --- | --- |
| IU (`hcmiu`) | Có công thức chính thức trong phạm vi giới hạn | 5 ngành trong nước: CNTT, KH máy tính, KH dữ liệu, Toán ứng dụng, Thống kê; 5 tổ hợp A00/A01/X06/X10/X26. Chỉ diện không yêu cầu điểm cộng; ưu tiên do người dùng khai và xác nhận đủ điều kiện. Chưa xác thực hồ sơ thực tế. |
| HCMUS | Tham khảo, chỉ thành phần học lực THPT | Sinh học và Công nghệ Sinh học; 6 tổ hợp theo phụ lục. 80% THPT + 20% học bạ, biểu diễn trên 100. Chưa cộng thưởng/ưu tiên, đối chiếu ngưỡng ngành, tìm tổ hợp tối ưu hoặc so sánh nhánh V-ACT. Không xuất điểm cuối cùng. |
| HCMUT | Chưa hỗ trợ tính | Đã đối chiếu 70/20/10, Toán x2 và thang 1500; chưa mã hóa đầy đủ cấu hình ngành/tổ hợp và hồ sơ điểm cộng. Không dùng trực tiếp tổng V-ACT 1200. |
| UHS | Chưa hỗ trợ tính | Thông báo 18/05 khác bài tháng 3; còn khoảng hệ số theo ngành, chưa xác minh bộ cố định cuối. |
| USSH | Chưa hỗ trợ tính | Có nhánh 45/45/10 và 90/10 trong thông báo tháng 7; chưa kiểm định hệ số quy đổi theo ngành/tổ hợp. |
| UIT | Chưa hỗ trợ tính | Chưa kiểm định đầy đủ PDF cập nhật tháng 7, bách phân vị và quy đổi chứng chỉ; không tự chép trọng số dự kiến thành quy định cuối. |
| UEL | Chưa hỗ trợ tính | Trang hệ số còn ghi “dự kiến”; phụ lục cuối, điều kiện ngành luật và ví dụ số học cần đối chiếu tiếp. Không dùng bảng 2027. |
| AGU | Chưa hỗ trợ tính | Khoảng hệ số không phải hệ số từng ngành. Không áp dụng 40/40/20 mặc định cho toàn trường; chưa xử lý đủ điều kiện sư phạm/luật và thay thế. |

Các nhãn trạng thái nói về căn cứ của phép tính, không phải xác nhận hồ sơ hay bảo đảm trúng tuyển. Với trường chưa hỗ trợ, không có số tổng giả định. Các ngành/chương trình ngoài danh sách hỗ trợ, liên kết/quốc tế, và trường hợp thành phần thay thế vượt 100 đều không được tự suy diễn.

### IU: các nhánh đã kiểm thử

Ký hiệu T/V/H là thành phần THPT/V-ACT/học bạ đã quy về 100. Trọng số tương ứng 0,4/0,5/0,1.

| Đối tượng / điểm thi 2026 | THPT | V-ACT | Học bạ |
| --- | --- | --- | --- |
| Tốt nghiệp 2026, cả hai kỳ thi | T | V | H |
| Tốt nghiệp 2026, chỉ THPT | T | 0,83T | H |
| Tốt nghiệp trước 2026, cả hai kỳ thi | T | V | 1,02T |
| Tốt nghiệp trước 2026, chỉ THPT | T | 0,83T | 1,02T |
| Tốt nghiệp trước 2026, chỉ V-ACT | 1,2V | V | 1,25V |

Nguồn IU quy định điểm cộng tối đa 10; diện 149 trường có mức và điều kiện riêng. Phần xác minh hồ sơ đó chưa được triển khai nên không cho cộng thủ công. Chỉ nhánh không yêu cầu điểm cộng được tính ưu tiên khu vực/đối tượng, giảm dần từ học lực 75/100. Không làm tròn trung gian; hiển thị 2 chữ số thập phân. Người tốt nghiệp 2026 chỉ có V-ACT bị chặn, không dùng nhánh của người tốt nghiệp trước 2026.

## Nguồn đã đối chiếu

Bài [VnExpress ngày 08/03/2026](https://vnexpress.net/cong-thuc-tinh-diem-xet-tuyen-tong-hop-cua-8-truong-thuoc-dai-hoc-quoc-gia-tp-hcm-2026-5047798.html) là nguồn khởi đầu, không phải bản cuối của mọi trường. Nội dung trường được đọc sau JavaScript, bao gồm accordion IU. Các phụ lục chưa kiểm định hoàn chỉnh được giữ trạng thái chưa hỗ trợ; không khẳng định đã thu thập đầy đủ mọi văn bản cuối cùng.

- [HCMUT — phương thức tổng hợp 2026](https://hcmut.edu.vn/tuyen-sinh/dai-hoc-chinh-quy/phuong-thuc-tuyen-sinh/xet-tuyen-tong-hop-2026).
- [UHS — thông tin 18/05/2026](https://www.uhsvnu.edu.vn/search/thong-tin-tuyen-sinh-nam-2026-18052026).
- [HCMUS — phương thức 2, cập nhật 10/07](https://tuyensinh.hcmus.edu.vn/2026-thong-bao-ve-phuong-thuc-xet-tuyen-2/), [phụ lục ngành/tổ hợp](https://tuyensinh.hcmus.edu.vn/wp-content/uploads/2026/06/2026_phuluc21.pdf), [ngưỡng đầu vào](https://tuyensinh.hcmus.edu.vn/2026-thong-bao-ve-nguong-dam-bao-chat-luong-phuong-thuc-2/).
- [USSH — thông báo ngưỡng 2026](https://www.hcmussh.edu.vn/bai-viet/thong-bao-nguong-dam-bao-chat-luong-dau-vao-nam-2026).
- [UIT — thông tin tuyển sinh 2026](https://tuyensinh.uit.edu.vn/2026-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026), có liên kết PDF tháng 7 trong cấu hình.
- [UEL — thông tin tuyển sinh](https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/), [ngưỡng đầu vào](https://uel.edu.vn/uel-cong-bo-nguong-bao-dam-chat-luong-dau-vao-dai-hoc-chinh-quy-nam-2026).
- [IU — thông tin tuyển sinh 2026](https://tuyensinh.hcmiu.edu.vn/tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-nam-2026/): dẫn Quyết định 428/QĐ-ĐHQT ngày 20/04/2026 trong nội dung; không lấy ngày tiêu đề trang làm ngày văn bản.
- [AGU — tuyển sinh](https://tuyensinh.agu.edu.vn/tuyen-sinh).

Ngày rà soát không được dùng thay ngày ban hành; `sourceDate: null` nếu chưa xác nhận. Dữ liệu nguồn nghiên cứu cục bộ nằm ở `.cache/admissions-research/`, không đưa nguyên văn bài báo vào dữ liệu production.

## Kiểm thử

| Lệnh | Kết quả |
| --- | --- |
| `npm test` | PASS 69/69, gồm 9 nhóm mới về cấu hình, nhánh tính, ưu tiên và fail-closed |
| `npm run validate` | PASS: 20 trang, 386 liên kết/tài nguyên, 71 kiểm tra cú pháp |
| `npm run test:e2e` | PASS 16/16 nhóm; 36 kiểm tra trang responsive |
| `npm run test:e2e:admissions` | PASS 10/10 nhóm; 34 cặp phương thức/tổ hợp cũ, 3 bài thi riêng, 4 hành trình đủ 42 câu Holland |
| `npm run test:e2e:integrated` | PASS 12/12 nhóm, 0 FAIL; báo cáo máy `.cache/integrated-admissions/report.json` |
| `npm run build` | Không cấu hình; exit 1: Missing script: build |
| `npm run lint` | Không cấu hình; exit 1: Missing script: lint |

Lượt Playwright tích hợp đầu: 10 PASS, 1 FAIL. Tìm ra HCMUS bị yêu cầu trường điểm cộng không tồn tại trên form thành phần học lực. Đã sửa bằng cách giới hạn điều kiện đó cho IU, thêm hồi quy unit và chạy lại. Lượt sau: 11 PASS, 0 FAIL. Suite cuối bổ sung kiểm tra danh mục trường HTTP 503 không làm hỏng cấu hình tích hợp tĩnh và ảnh kết quả theo viewport: 12 PASS, 0 FAIL.

Các kiểm thử tích hợp bao gồm 8 trường; 25 cặp ngành/tổ hợp IU; 5 nhánh có/thiếu kỳ thi; 6 đầu vào sai; 6 tổ hợp HCMUS; ưu tiên; chặn cộng điểm chưa xác minh; lưu/khôi phục/xóa bản nháp; liên kết sâu; chuyển phương thức; truyền mục tiêu; 360/390/768/1366 px. Các luồng mới không có page exception ở những lượt PASS.

Đối chiếu số học độc lập từ công thức nguồn; chưa có ví dụ số chính thức tương ứng đủ cả 5 nhánh IU để khẳng định đã đối chiếu từng nhánh với ví dụ của trường. Ví dụ UEL chưa được dùng làm oracle vì có sai lệch số học và trạng thái quy định chưa chốt trong dữ liệu đã kiểm định.

Đầu vào giả chỉ là dữ liệu kiểm thử số học. Catalog thành công lấy từ file thực của repository; bài kiểm tra lỗi 503 không thay dữ liệu thành công bằng mock. Chưa xác nhận đường trả lời thành công của Waybi production; suite hiện có kiểm tra fallback. Không chạy audit production cho các thay đổi chưa deploy.

## File thay đổi trong phần bổ sung này

- `assets/data/integrated-admissions-2026.js`: cấu hình 8 trường, provenance, giới hạn phạm vi, chương trình/tổ hợp đã đối chiếu.
- `assets/js/integrated-score-rules.js`: kiểm tra đầu vào, nhánh IU và thành phần HCMUS, khóa năm 2026, chặn quy tắc thiếu.
- `assets/js/integrated-calculator.js`: form động, lưu cục bộ, nguồn, bảng tính và trạng thái.
- `assets/js/score-calculator.js`: kết nối phương thức mới, giữ nguyên 3 nhánh cũ, reset và khôi phục.
- `score-calculator.html`, `assets/css/score-calculator.css`: lựa chọn thứ tư, giải thích phạm vi, kiểu form/bảng responsive và asset version.
- `tests/integrated-admissions.test.mjs`, `scripts/qa-integrated-admissions.cjs`, `package.json`: kiểm thử có thể chạy lại.
- Báo cáo này. Gói sửa năm/dữ liệu/hành trình trước đó được mô tả riêng ở `docs/qa-admissions-regression-20261020.md`.

## Ảnh và báo cáo máy

| Kích thước | Kết quả | Form |
| --- | --- | --- |
| 360 | [Ảnh](../.cache/integrated-admissions/result-360.png) | [Ảnh](../.cache/integrated-admissions/inputs-360.png) |
| 390 | [Ảnh](../.cache/integrated-admissions/result-390.png) | [Ảnh](../.cache/integrated-admissions/inputs-390.png) |
| 768 | [Ảnh](../.cache/integrated-admissions/result-768.png) | [Ảnh](../.cache/integrated-admissions/inputs-768.png) |
| 1366 | [Ảnh](../.cache/integrated-admissions/result-1366.png) | [Ảnh](../.cache/integrated-admissions/inputs-1366.png) |

[Báo cáo JSON cuối](../.cache/integrated-admissions/report.json), [lượt đầu có lỗi](../.cache/integrated-admissions/before-report.json). Ảnh/JSON ở `.cache` không được commit; tái tạo bằng script kiểm thử. Các ảnh hành trình/trang trường nằm trong báo cáo hồi quy trước.
