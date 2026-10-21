# Kiểm tra hoàn thiện BrightWay — 21/10/2026

## Phạm vi

Kiểm tra repository tại commit gốc `8b05574` bằng Edge headless qua Playwright, chạy frontend trên HTTP localhost. Các thao tác thành công dùng danh mục trường, ngành và nghề trong repository. Không thay đổi file tính điểm, công thức, dữ liệu tuyển sinh, API hoặc cấu hình production. Bản sửa được commit và triển khai sau khi hoàn tất các kiểm thử bên dưới.

Đã có sẵn các chức năng sau, không xây lại: `savedSchools` và `wishes` trong `bwJourneyV2`, quản lý tại `profile.html?tab=journey#my-choices`, so sánh 2–3 trường tại `page2.html`, đối chiếu nghề/ngành tại `career-pathways.js`. Danh sách nguyện vọng giữ trường, chương trình, mã khi có, thứ tự, năm dự kiến, năm dữ liệu và liên kết nguồn.

## Lỗi đã tái hiện và sửa

Các lỗi dưới đây được phân loại P2 trong phạm vi kiểm thử này.

### 1. Bộ lọc khu vực giữ giá trị ngầm sau khi xóa trường

- Tái hiện: lưu Đại học Cần Thơ và Đại học Bách khoa – ĐHQG TP.HCM → mở Nguyện vọng của tôi → lọc Cần Thơ → bỏ lưu Đại học Cần Thơ.
- Trước sửa: dropdown hiển thị “Tất cả khu vực”, nhưng danh sách báo `0/1 trường đã lưu` và ẩn trường Bách khoa còn lại.
- Sau sửa: kiểm tra các khu vực còn tồn tại, xóa bộ lọc không còn hợp lệ và hiển thị đúng trường còn lại.
- Bằng chứng: [ảnh lỗi](../.cache/completion-2026-10-21/before/01-favorite-filter-removal-failure.png), [ảnh sau sửa](../.cache/completion-2026-10-21/after/favorites-filter-recovered.png).

### 2. Mất focus bàn phím khi chuyển nguyện vọng đến đầu danh sách

- Tái hiện: thêm hai ngành FPT từ hồ sơ trường → mở danh sách nguyện vọng → focus nút tăng ưu tiên của dòng thứ hai → nhấn Enter.
- Trước sửa: dòng được chuyển đúng, nhưng focus mất do nút tăng ưu tiên ở vị trí đầu bị disabled và DOM vừa được render lại.
- Sau sửa: giữ focus trên nút còn khả dụng của chính nguyện vọng vừa di chuyển; tải lại giữ nguyên thứ tự.
- Bằng chứng: assertion `Keyboard focus must stay with the moved wish` trong [báo cáo trước sửa](../.cache/completion-2026-10-21/before/report.json), [ảnh trước sửa](../.cache/completion-2026-10-21/before/04-wishes-keyboard-priority-failure.png), [ảnh thứ tự được khôi phục](../.cache/completion-2026-10-21/after/wishes-reordered.png). Ảnh tĩnh không chứng minh focus DOM; assertion Playwright kiểm tra `document.activeElement`.

### 3. Form chưa phản ánh trạng thái tải trong khoảng chờ module tra cứu

- Tái hiện: mở `page2.html?mode=major` khi mã module chưa tải xong; kiểm tra ngay sau `DOMContentLoaded`.
- Trước sửa: `#mainContent` chưa có `aria-busy`, form chưa bị khóa dù chưa có dữ liệu để xử lý thao tác. Việc này có thể xuất hiện theo thời gian tải module.
- Sau sửa: HTML khởi đầu có `aria-busy="true"` và các bộ lọc disabled; mã hiện có mở lại khi tải thành công. Khi module lỗi, loader kết thúc busy và hiển thị nút Thử lại hoạt động.
- Bằng chứng: [ảnh trạng thái trước sửa](../.cache/completion-2026-10-21/before/05-school-slow-offline-retry-empty-failure.png), [loading](../.cache/completion-2026-10-21/after/school-loading.png), [lỗi mạng module](../.cache/completion-2026-10-21/after/school-module-offline.png). Assertion kiểm tra thuộc tính DOM và khả năng tương tác.

### 4. Tên chatbot chưa thống nhất

- Tái hiện: mở chatbot trang chủ và trang tra cứu; tiêu đề, nhãn truy cập và phần giới thiệu lần lượt dùng “Waybi”, “Trợ lý hướng nghiệp”, “trợ lý định hướng”.
- Sau sửa: tên đầy đủ “Trợ lý hướng nghiệp Waybi” xuất hiện trong header/nhãn dialog và các phần giới thiệu liên quan. Giữ nhãn thao tác ngắn như “Hỏi Waybi”.
- Bằng chứng: [ảnh trước sửa](../.cache/completion-2026-10-21/before/07-waybi-name-and-mobile-controls-failure.png), [trang tra cứu 390px](../.cache/completion-2026-10-21/after/waybi-page2-390.png), [trang chủ 390px](../.cache/completion-2026-10-21/after/waybi-index-390.png).

### 5. Tên trường và nút bỏ so sánh dính nhau, vùng chạm nhỏ

- Tái hiện: chọn ba trường để so sánh → xem ở 360px. Header đặt tên trường và nút “Bỏ trường” sát nhau trên một dòng, nút có vùng chạm thấp hơn 44px.
- Sau sửa: tách tên/nút thành hai dòng; nút đạt tối thiểu 44×44px. Bảng vẫn cuộn ngang trong khung, không làm tràn toàn trang.
- Bằng chứng: [ảnh trước sửa](../.cache/completion-2026-10-21/before/compare-360-cramped.png), [ảnh sau sửa](../.cache/completion-2026-10-21/after/compare-360.png).

## Ma trận nghiệm thu

| Chức năng | Trạng thái | Bằng chứng kiểm thử |
|---|---|---|
| Lưu/bỏ lưu trường, tìm và lọc | PASS | Lưu từ thẻ/hồ sơ; lọc trường yêu thích và khu vực; xóa trường cuối khu vực; tìm không dấu; tải lại; alias không tạo bản ghi trùng |
| So sánh 2–3 trường | PASS | Mở bảng với hai trường; thêm trường thứ ba; không nhận trường thứ tư; tải lại; tìm kiếm không xóa so sánh; bỏ từng trường, xóa toàn bộ; chạm nút ở 360px |
| Nguyện vọng riêng | PASS | Thêm ba ngành có nguồn; mã ngành và năm dữ liệu; năm dự kiến 2027 dùng nguồn 2026 được ghi rõ; chống trùng; đổi thứ tự; xóa; khôi phục; xuất và đọc lại file `.txt` |
| Nghề → ngành → trường → quay lại | PASS | Bác sĩ đa khoa → Y khoa → trường đào tạo; bộ lọc ngành đúng; quay lại nghề và từ khóa. Unit test giữ quy tắc không tự suy diễn ngành khi thiếu nguồn |
| Tên Waybi và giao diện chat | PASS | Mở/đóng bằng thao tác thật trên năm trang; tên dialog/header; không tràn; tiêu đề không đè nút đóng; menu dẫn tới nguyện vọng |
| Loading, empty, retry, lỗi mạng | PASS | Chặn rồi giải phóng request; HTTP 503; ngắt kết nối danh mục/module; thử lại thành công; empty search và dữ liệu rỗng kết thúc loading; phục hồi bằng dữ liệu thật |
| Responsive | PASS | 360, 390, 768, 1366px; bảng so sánh cuộn nội bộ; chatbot nằm trong viewport; suite hồi quy còn có 320 và 1920px |
| Menu, link và hành trình cũ | PASS | Bộ hồi quy gồm Holland 42 câu, lưu/khôi phục, tra cứu, nguyện vọng, menu tài khoản, nguồn dữ liệu và cô lập nội dung tài trợ |
| Build | BLOCKED | `npm run build`: `Missing script: "build"`. Dự án hiện phục vụ HTML/CSS/JS trực tiếp; không thêm một build giả để ghi PASS |
| Câu trả lời từ dịch vụ AI thật | BLOCKED | Môi trường HTTP tĩnh không chạy `/api/chat` với backend/provider. Đã kiểm tra giao diện và fallback khi API lỗi; chưa chứng nhận chất lượng phản hồi AI thật |

Thử lỗi mạng và empty data chỉ là interception trong context kiểm thử biệt lập. Không có bản ghi trường/ngành giả được thêm vào dữ liệu sản phẩm. Kiểm thử thành công sau retry sử dụng lại file thật của repository.

## Lệnh kiểm thử

| Lệnh | Kết quả cuối |
|---|---|
| `npm test` | PASS 90/90; FAIL 0 |
| `npm run validate` | PASS: 20 trang, 393 liên kết/asset, 80 kiểm tra cú pháp, 0 issue |
| `npm run test:e2e` | PASS 17/17 kịch bản; FAIL 0 |
| `npm run test:e2e:completion` | PASS 9/9 kịch bản; FAIL 0; kiểm tra thêm lỗi bộ lọc/focus, bảng so sánh, loading/mạng/retry, chatbot/menu và dữ liệu rỗng |
| `npm run build` | BLOCKED: không có script `build`; lệnh kết thúc exit 1 |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS |

Tổng Playwright: 26/26 kịch bản PASS, 0 FAIL. Bộ kiểm thử bổ sung trước sửa ghi nhận 3 PASS / 4 FAIL; một lỗi hiển thị bảng so sánh được phát hiện thêm khi xem ảnh và có assertion về vùng chạm sau sửa. Một lần chạy đầu có timeout chờ sự kiện `load` do tài nguyên phụ; đã đổi điều kiện điều hướng sang `DOMContentLoaded` và chờ dữ liệu render thực tế, rồi tái hiện lại trước khi sửa sản phẩm. Không tính timeout đó là lỗi chức năng.

Báo cáo máy: [hồi quy hiện có](../.cache/ux-e2e/report.json), [kiểm thử bổ sung trước sửa](../.cache/completion-2026-10-21/before/report.json), [kiểm thử bổ sung sau sửa](../.cache/completion-2026-10-21/after/report.json). Ảnh trước/sau ở `.cache/completion-2026-10-21/`; ảnh nguyện vọng và các trang theo kích thước từ suite hiện có ở `.cache/ux-e2e/`.

## File thay đổi

- `assets/js/selections.js`: xóa bộ lọc khu vực không còn tồn tại; khôi phục focus khi sắp thứ tự.
- `page2.html`, `assets/js/page2-loader.js`: trạng thái tải ngay từ HTML và kết thúc busy khi module lỗi.
- `assets/css/page2.css`: header và vùng chạm nút bỏ so sánh.
- `assets/js/waybi.js`, `assets/js/waybi-presence.js`, `index.html`, `waybi.html`: thống nhất tên chatbot.
- `scripts/qa-completion.cjs`, `package.json`: thêm lệnh `npm run test:e2e:completion` và các kịch bản hồi quy cho đợt này.
- Báo cáo này.

## Giới hạn

Kết quả chứng minh các luồng đã chạy trong môi trường kiểm thử, không phải chứng nhận điểm chất lượng 9/10. Hai mục BLOCKED ở trên không được ghi là PASS. Không thực hiện deploy trong đợt kiểm tra này.
