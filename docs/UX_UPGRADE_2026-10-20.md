# BrightWay Careers — kết quả nâng cấp 20/10/2026

## Phạm vi

Nâng cấp mã nguồn hiện có, giữ nguyên công nghệ HTML/CSS/JavaScript, API, secret, cấu hình production và các công thức tuyển sinh. Không thêm thư viện. Triển khai theo luồng: bắt đầu → hiểu mình → nghề/ngành → trường → đối chiếu điểm → kế hoạch hành động. Holland và từng công cụ vẫn có thể dùng độc lập.

## Các vấn đề đã sửa

- Holland tự chuyển nhóm câu sau khi chọn đáp án cuối nhóm; chuyển thành nút Tiếp tục do người dùng chủ động bấm.
- Đồng hồ Holland tự nộp bài ở phút thứ 7; giờ chỉ là mốc thời gian gợi ý, người dùng tiếp tục được.
- Bài làm chưa giữ nhóm câu đang mở; lưu ngay từng đáp án và vị trí, khôi phục khi tải lại và quay lại sửa.
- Đáp án Holland chưa có `aria-pressed`; bổ sung trạng thái cho trình đọc màn hình, bỏ phím Enter toàn cục có thể nộp ngoài ý muốn.
- Tiến trình từng coi việc chọn phương thức là hoàn thành tính điểm; chỉ đánh dấu sau khi tính hợp lệ.
- Xóa hành trình chưa xóa kết quả/bản nháp Holland; thao tác xóa nay bao gồm các dữ liệu hướng nghiệp cục bộ liên quan.
- Lỗi lưu localStorage trước đây bị bỏ qua; giờ có thông báo và bộ nhớ tạm cho trang hiện tại.
- Các lựa chọn nghề/ngành/trường chưa cùng xuất hiện trong hồ sơ; tích hợp và thêm bỏ lưu từng lựa chọn.
- Tìm kiếm ngành từng tự lưu mọi từ khóa thành ngành yêu thích; chỉ lưu khi người dùng bấm Lưu ngành.
- Bộ lọc nghề chưa giữ ổn định khi đổi nhóm hoặc tải lại; lưu bằng URL và hồ sơ. Bổ sung xóa toàn bộ bộ lọc nghề/trường.
- Trang chủ tràn ngang ở 320px do cột công cụ có chiều rộng tối thiểu 280px bên trong vùng hẹp hơn; sửa giới hạn cột theo chiều rộng thực tế.
- Nội dung trang chủ phụ thuộc hiệu ứng cuộn để hiện ra; nội dung giờ hiển thị sẵn.
- Nút Escape trong menu từng giành focus dù menu đang đóng; chỉ trả focus khi đóng menu đang mở.
- Waybi thiếu thời gian chờ và liên kết tra cứu khi API lỗi; bổ sung timeout và đường dẫn thủ công, Escape trả focus về nút chat.
- Escape nội dung tên nghề và truy vấn khi hiển thị dữ liệu tài khoản, thông báo toast dùng textContent.
- Loại bỏ khai báo devDependencies trùng trong package.json.

## UX/UI đã triển khai

- CTA chính “Bắt đầu hướng nghiệp”, CTA phụ tìm ngành/trường. Truy cập nhanh thu gọn trên điện thoại.
- Ba lợi ích, hành trình 5 bước, công cụ, tin tuyển sinh; giữ các nội dung Holland, Waybi, FAQ và dữ liệu hữu ích.
- Liên kết chọn trường ở lộ trình dẫn về cùng danh mục trường có nguồn, thay cho cửa sổ trường cũ có các mô tả chưa đủ nguồn/năm.
- Thanh tiến trình gọn, quay lại và tiếp tục trong các công cụ; có bỏ qua Holland.
- Chọn trường và ngành từ dữ liệu 2026 hiện có trước khi chọn loại điểm. Từ hồ sơ ngành có thể chuyển đúng trường/ngành sang công cụ tính điểm.
- Chỉ hiện ba môn tổ hợp theo loại điểm; bài thi riêng chọn một trong V-ACT/HSA/TSA. Phần FPT không xuất hiện khi đã chọn trường khác.
- Nêu rõ loại điểm đầu vào không đồng nghĩa trường/ngành chấp nhận phương thức; thiếu công thức thì chỉ hiển thị điểm gốc/thành phần có căn cứ.
- Hồ sơ hướng nghiệp cục bộ không cần tài khoản: Holland, nghề, ngành, trường, công thức/kết quả tính gần nhất, nhiệm vụ và trạng thái hoàn thành.
- Waybi có câu hỏi gợi ý theo trang, thông báo lỗi và các lối tra cứu thủ công.
- Đồng bộ card, form, focus, vùng chạm, thông báo, giao diện nhỏ và prefers-reduced-motion; giữ phong cách kính tím và mascot hiện có.
- Cập nhật phiên bản tài nguyên chung trên các trang để trình duyệt nhận bản mới.

## Kiểm chứng thực tế

| Lệnh / kiểm tra | Kết quả |
| --- | --- |
| `npm run validate` | PASS: 20 trang, 382 tham chiếu tệp/liên kết cục bộ, 63 kiểm tra cú pháp JS và script nhúng |
| `npm test` | PASS: 45 tests |
| `npm run test:e2e` | PASS: 10 nhóm kịch bản |
| Responsive | PASS: 36 lượt kiểm tra 6 trang × 320/360/390/768/1366/1920px; không tràn tài liệu ngang |
| Tính điểm hồi quy | A00 8+8+8=24, thiếu/sai điểm, HSA 151 bị từ chối, điểm 0 được chấp nhận; các unit test giữ biên và công thức hiện có |
| Lưu/khôi phục | Đáp án và nhóm câu Holland, bộ lọc có/không dấu, nghề/ngành/trường, mục tiêu tính điểm, nhiệm vụ; xóa dữ liệu |
| Tình huống lỗi mô phỏng | HTTP 503 và thử lại, trường thiếu ngành, API chat 503, bộ nhớ bị chặn, danh sách nghề rỗng, tải danh mục chậm 900ms |
| Nội dung nhập | Truy vấn HTML được hiển thị thành văn bản, không thành phần tử ảnh |

Dự án là website tĩnh và API Vercel, không có bước đóng gói frontend `build`. Kiểm tra cú pháp/tài nguyên dùng `npm run validate`; không gọi đó là một framework build.

Kết quả trình duyệt và ảnh kiểm chứng nằm tại `.cache/ux-e2e/`, gồm `report.json`, `after-home-1440.png`, `review-index-320.png`, `review-index-1366.png`, `profile-saved-390.png`, các trang tính điểm, tra cứu và logo. Đây là kết quả chạy trên trình duyệt Edge cục bộ.

## Những giới hạn còn lại

- Chưa có đủ công thức theo từng ngành/phương thức/cơ sở cho toàn bộ trường. Không tạo công thức hoặc kết luận đậu/rớt để lấp chỗ thiếu.
- API Waybi thành công phụ thuộc dịch vụ và khóa production. Kiểm tra tự động đợt này xác nhận xử lý lỗi API bằng mô phỏng; không chứng nhận độ chính xác của mọi câu trả lời LLM.
- Đồng bộ tài khoản Supabase thật không được kiểm thử bằng tài khoản người dùng trong đợt này; chức năng tài khoản giữ nguyên.
- Chưa có nghiên cứu với học sinh thực để chứng minh thời gian hiểu trong 5 giây, Lighthouse trên thiết bị thật hoặc chứng nhận WCAG toàn bộ website.
- Kiểm tra liên kết tự động xác nhận tệp và route cục bộ; không chứng nhận mọi URL tuyển sinh bên ngoài còn hoạt động hay nội dung mới nhất.

## Đánh giá trước/sau

Các số sau là đánh giá nội bộ theo tiêu chí của yêu cầu, không phải điểm từ người dùng hoặc một tổ chức độc lập. Mốc trước lấy từ mức ước lượng trong brief.

| Tiêu chí | Trước | Sau (ước lượng) | Căn cứ |
| --- | --- | --- | --- |
| UX | 6.5 | 8.8 | CTA rõ, 5 bước, bỏ qua, không tự chuyển câu, khôi phục dữ liệu và hồ sơ liên thông |
| Giao diện | 8.0 | 9.0 | Giữ nhận diện, thu gọn đầu trang mobile, nhất quán các thành phần, 36 kiểm tra bố cục |
| Tính năng | 8.5 | 9.0 | Chọn trường/ngành, chuyển mục tiêu, lưu lựa chọn, nhiệm vụ, xử lý lỗi; giữ công thức được kiểm thử |
| Tổng thể | khoảng 8.0 | khoảng 8.9 | Đủ tốt để phát hành; mục tiêu 9+ cần thêm kiểm chứng học sinh và độ phủ dữ liệu chính thức |

## Danh sách tệp

Thay đổi chức năng/giao diện:

- `index.html`, `holland.html`, `careers-holland.html`, `page2.html`, `score-calculator.html`, `profile.html`.
- `assets/js/flow.js`, `holland.js`, `home-holland.js`, `careers.js`, `page2.js`, `score-calculator.js`, `profile.js`, `waybi.js`.
- `assets/css/flow.css`, `home-journeys.css`, `page2.css`, `score-calculator.css`.
- `scripts/qa-ux-e2e.cjs`, `scripts/validate-site.mjs`, `package.json`, báo cáo này.

Chỉ cập nhật phiên bản tài nguyên dùng chung:

- `calendar.html`, `essay-review.html`, `interview-prep.html`, `login.html`, `major-detail.html`, `majors.html`, `news-detail.html`, `news.html`, `resources.html`, `scholarship-roadmap.html`, `waybi.html`.
