# BrightWay Countdown — báo cáo triển khai và QA

Ngày kiểm tra: 2026-10-21 (Asia/Ho_Chi_Minh)

## Phạm vi đã triển khai

- Widget gọn “Mục tiêu sắp tới” trên trang chủ, có mục tiêu ghim, số ngày, ngày đích và tiến độ được ghi nhãn rõ.
- Khu vực quản lý `#countdowns` trong “Hành trình của tôi”: tạo, sửa thời hạn, xóa, tạm dừng, tiếp tục, hoàn thành, mở lại và ghim.
- Hai nhóm dữ liệu: kỳ thi và mục tiêu cá nhân; có nhiều đợt thi bằng `sessionId` riêng.
- Mốc nhỏ có checkbox và tiến độ theo số mốc hoàn thành. Tiến độ thời gian, nếu hiển thị ở widget, được ghi riêng là thời gian từ lúc tạo đến hạn.
- Bộ lọc sắp tới, đã hoàn thành, quá hạn và tất cả.
- Nhắc 30/14/7/3/1 ngày chỉ khi người dùng mở BrightWay; không tuyên bố gửi thông báo khi website đóng.
- Schema `countdowns.version = 1` nằm trong `bwJourneyV2`; không tạo localStorage key song song và không ghi đè Holland, nghề, trường, nguyện vọng hay điểm.
- Xử lý bản ghi lỗi, bản ghi trùng, ID ổn định, ngày tạo/cập nhật, một mục tiêu ghim, xuất JSON và xóa riêng countdown.
- Cập nhật khi mở trang, tab hoạt động lại, cửa sổ focus và sau khi sang ngày mới; không dùng animation chạy liên tục.

## Lịch thi và nguồn

- SAT Weekend có 5 đợt đã đối chiếu: 07/11/2026, 05/12/2026, 06/03/2027, 01/05/2027, 05/06/2027. Nguồn: https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print, kiểm tra 2026-10-21.
- THPT, V-ACT, HSA, TSA, IELTS, TOEIC và Goethe/ÖSD năm 2027 được lưu trạng thái `unannounced`, không có ngày. Giao diện hiển thị “Chưa có lịch chính thức trong dữ liệu đã đối chiếu” và chỉ cho tạo mốc dự kiến.
- Dữ liệu dự kiến do người dùng nhập không mang URL nguồn và không được gắn nhãn chính thức.
- Mô hình hỗ trợ `official`, `tentative`, `unannounced`, `changed`; bản ghi `official/changed` thiếu nguồn HTTPS hoặc ngày nguồn hợp lệ bị loại.

## Logic ngày

- Mặc định `Asia/Ho_Chi_Minh`.
- So sánh ordinal ngày lịch sau khi giải quyết ngày hiện tại trong múi giờ, không chia chênh lệch hai thời điểm thực cho 86.400.000.
- Đã kiểm tra ngày hiện tại, ngày quá hạn, chuyển năm, 29/2 hợp lệ và ngày không hợp lệ.
- Không hiển thị số âm; dùng “Hôm nay”, “Còn N ngày”, “Đã qua N ngày”.

## Kết quả kiểm thử

| Hạng mục | Kết quả |
|---|---:|
| Unit tests toàn repository | PASS 110/110 |
| Playwright Countdown | PASS 8/8 |
| Playwright quality regression | PASS 8/8 |
| Playwright personalization regression | PASS 11/11 |
| Playwright lựa chọn/nguyện vọng | PASS 9/9 |
| Validate HTML/link/JS | PASS — 20 trang, 393 link/asset, 87 syntax checks |
| Responsive | PASS — 360, 390, 768, 1366 px |
| Keyboard + prefers-reduced-motion | PASS |
| `npm run build` | BLOCKED — repository không có script `build` |
| `npm run lint` | BLOCKED — repository không có script `lint` |

Artifact Playwright: `.cache/countdown-qa/` (không đưa vào deploy).

## Tệp thay đổi

- `assets/js/countdown-model.js`
- `assets/js/countdown.js`
- `assets/data/exam-schedules.js`
- `assets/css/countdown.css`
- `assets/js/flow.js`
- `index.html`
- `profile.html`
- `tests/countdown.test.mjs`
- `scripts/qa-countdown.cjs`
- `package.json`
- `docs/COUNTDOWN_QA_2026-10-21.md`

## Giới hạn có chủ ý

- Không có backend/service worker nên không gửi nhắc khi website đóng.
- Không tự thu thập lịch thi và không suy đoán ngày 2027.
- Lịch IELTS/TOEIC/chứng chỉ ngoại ngữ phụ thuộc địa điểm và suất còn trống; người dùng phải kiểm tra ở đơn vị tổ chức trước khi đăng ký.
- Không kết luận người dùng chắc chắn đạt mục tiêu hoặc trúng tuyển.
- Không sửa công thức hay dữ liệu của công cụ tính điểm.
- Chưa deploy production; cần lệnh deploy riêng của người dùng.
