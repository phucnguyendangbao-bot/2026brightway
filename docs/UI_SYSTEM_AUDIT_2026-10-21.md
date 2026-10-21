# BrightWay UI system audit — 2026-10-21

## Phạm vi và kết luận

Đợt này chuẩn hóa shell, token và các primitive dùng chung mà không viết lại các tính năng đang hoạt động. Không thay đổi công thức, dữ liệu hoặc logic của công cụ tính điểm; không đổi URL công khai. Baseline đã deploy ở commit `a50eb84`; các điều chỉnh active state/touch target mới nhất đang ở local và chưa deploy.

- 17/17 trang người dùng dùng cùng header, menu mobile, footer và lớp hành trình từ `assets/js/flow.js`.
- `admin.html` giữ shell quản trị riêng; `careers.html` là trang chuyển hướng; `_home_content.html` là partial, không phải route độc lập.
- Trang chủ giữ hero lớn. Các trang công cụ giữ page header riêng theo ngữ cảnh thay vì ép thành một mẫu giống hệt.
- Menu chính còn 5 mục: Trang chủ, Khám phá nghề, Khám phá trường, Tính điểm, Hành trình của tôi.
- Holland, nguyện vọng, Countdown, lịch Lớp 12, tin tuyển sinh và lộ trình học bổng nằm trong menu Công cụ.

## Kiểm kê route

| Nhóm | Route |
| --- | --- |
| Trang chủ | `index.html` |
| Nghề và Holland | `careers-holland.html`, `holland.html`, `majors.html`, `major-detail.html` |
| Trường và xét tuyển | `page2.html`, `score-calculator.html` |
| Hành trình cá nhân | `profile.html`, `calendar.html` |
| Nội dung hỗ trợ | `resources.html`, `news.html`, `news-detail.html`, `scholarship-roadmap.html`, `essay-review.html`, `interview-prep.html` |
| Tài khoản và trợ lý | `login.html`, `waybi.html` |
| Shell riêng / không phải route người dùng | `admin.html`, `careers.html`, `_home_content.html` |

## Xác nhận header/footer

| Phạm vi | Header | Footer | Ghi chú |
| --- | --- | --- | --- |
| 17 route người dùng | PASS — một `.flow-nav` | PASS — một `.flow-footer` | Kiểm tra runtime bằng Playwright |
| `admin.html` | Shell quản trị riêng | Shell quản trị riêng | Không trộn điều hướng học sinh vào quản trị |
| `careers.html` | N/A | N/A | Route redirect được bảo toàn |
| `_home_content.html` | N/A | N/A | Partial, không phải trang độc lập |

## Thành phần dùng chung

### Header

- Được dựng một lần bởi `assets/js/flow.js`, thay thế các biến thể navbar cũ tại runtime.
- Logo, khoảng cách, sticky state, active state, menu desktop/mobile và hỗ trợ Escape thống nhất.
- Search bar, theme toggle, chế độ chữ lớn và auth slot hiện có được giữ lại khi shell được chuẩn hóa.
- `aria-controls`, `aria-expanded`, `aria-current` và focus-visible được kiểm tra bằng thao tác Playwright thật.
- Các trang chỉ thuộc menu phụ hiển thị active state ngay trên nút “Công cụ”; trang Holland tiếp tục ưu tiên active “Khám phá nghề”.
- Menu, menu phụ và liên kết footer dùng touch target tối thiểu 44px.

### Footer

- Một footer chung được tạo hoặc thay thế trên 17 trang người dùng.
- Bổ sung footer cho sáu trang trước đây thiếu footer: essay review, interview prep, major detail, majors, news detail và news.
- Có liên kết hành trình, liên hệ và cảnh báo kiểm tra nguồn tuyển sinh chính thức.

### Token và primitive

`assets/css/brightway-theme.css` hiện có token chuẩn cho spacing, type scale, radius, shadow, container, focus ring, transition và các primitive:

- container và surface card;
- button primary/secondary/tertiary;
- field/select;
- badge;
- empty/loading/error/toast.

Token `--bw-target-min: 44px` bảo đảm kích thước chạm tối thiểu nhất quán cho điều hướng.

Các selector cũ tiếp tục hoạt động để tránh một đợt rewrite rủi ro. Những trang được sửa tiếp theo có thể chuyển dần sang `.bw-ui-*` mà không tạo thêm hệ token.

### Waybi

- Tên hiển thị thống nhất: “Trợ lý hướng nghiệp Waybi”.
- Dùng chung launcher/panel trên các trang; trang chủ giữ launcher tích hợp sẵn và không tạo FAB trùng.
- Context cá nhân vẫn phải qua consent; bài test chỉ kiểm tra contract được intercept, không gửi dữ liệu đến mô hình bên ngoài.
- Sửa màu tên Waybi từ `#6366f1` sang `#5548cf`, nâng tương phản chữ trên nền trắng qua ngưỡng WCAG AA.

## Luồng dữ liệu cá nhân

- `bwJourneyV2` là record chuẩn cho trường/ngành/nghề đã lưu, nguyện vọng, tác vụ, hồ sơ tùy chọn và Countdown.
- Countdown nằm trong `bwJourneyV2.countdowns`; không tạo localStorage key hành trình thứ hai.
- `bwJourneyV1` và `bw_favorites` chỉ được đọc như dữ liệu legacy rồi normalize sang schema v2 khi lưu tiếp.
- Holland giữ `studentHollandV1`/`studentHollandImportedV1` vì có trạng thái 42 câu riêng, nhưng được đọc qua `BWFlow` và phát sự kiện chung.
- `bw-school-compare-2026`, auth và theme là state chức năng riêng, không phải bản sao hồ sơ hành trình.
- Khi localStorage bị chặn/corrupt, hệ thống fail-safe sang memory và hiển thị cảnh báo; không làm mất trang.

## Kiểm thử

| Suite | Kết quả |
| --- | --- |
| `npm run validate` | PASS — 20 pages, 393 local links/assets, 87 syntax checks |
| `npm test` | PASS — 110/110 |
| `npm run test:e2e:ui-system` | PASS — 7/7; 17 route; 360/390/768/1024/1366/1920 |
| `npm run test:e2e` | PASS — 17/17 scenario; gồm Holland → nghề/ngành → trường, lưu dữ liệu và responsive |
| `npm run test:e2e:completion` | PASS — 9/9 |
| `npm run test:e2e:quality` | PASS — 8/8; accessibility nghiêm trọng 0 |
| `npm run test:e2e:personalization` | PASS — 11/11 |
| `npm run test:e2e:countdown` | PASS — 8/8 |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS |
| `npm run build` | BLOCKED — repository không khai báo script `build` |
| `npm run lint` | BLOCKED — repository không khai báo script `lint` |

Các lỗi được test phát hiện và đã sửa trước khi chốt:

1. Regression test còn kỳ vọng nhãn navbar cũ “Tìm ngành & trường”. Test được cập nhật theo nhãn chuẩn “Khám phá trường”.
2. Chữ đậm tên Waybi đạt 4,46:1, thiếu ngưỡng 4,5:1. Màu được làm đậm và accessibility suite đã PASS lại.
3. Nút menu mobile và menu phụ chỉ cao 40–42px. Đã nâng lên tối thiểu 44px và thêm regression đo bounding box thật.
4. Trang phụ có mục con active nhưng nút “Công cụ” không hiện active state. Đã liên kết trạng thái nhóm mà không tạo double-active trên Holland.

## File trọng tâm đã sửa

- `assets/js/flow.js`: header, active state, menu phụ, footer, storage facade và hành trình chung.
- `assets/css/brightway-theme.css`: token và primitive dùng chung.
- `assets/css/flow.css`: shell responsive, touch target, journey và footer.
- `assets/js/waybi.js`: UI/trạng thái trợ lý và sửa tương phản.
- `assets/js/countdown-model.js`, `assets/js/countdown.js`, `assets/css/countdown.css`: Countdown chung.
- `scripts/qa-ui-system.cjs`, `scripts/qa-countdown.cjs` và các regression script hiện hữu.
- 19 trang HTML dùng cache key và stylesheet chung; không đổi route.

## Ảnh đối chiếu

Ảnh chỉ là artifact kiểm thử local, không đưa lên production:

- Trước: `.cache/ui-system-qa/before/`
- Sau: `.cache/ui-system-qa/after/`
- Trang chủ: `home-390.png`, `home-1366.png`
- Tra cứu trường: `schools-390.png`, `schools-1366.png`
- Hành trình: `journey-390.png`, `journey-1366.png`
- Báo cáo máy đọc: `.cache/ui-system-qa/after/report.json`

## Lỗi còn lại và mức độ

- **P0:** Không có lỗi đã xác minh.
- **P1:** Không có lỗi đã xác minh trong luồng chính.
- **P2 / BLOCKED:** Chưa có pipeline build/lint trong `package.json`; validation hiện dựa vào syntax validation, unit test và Playwright.
- **P2:** Các trang legacy còn CSS nội tuyến và stylesheet chuyên biệt. Chúng đã dùng chung shell/token nhưng chưa chuyển cơ học toàn bộ sang primitive để tránh thay đổi diện rộng ngoài phạm vi.
- **Chưa xác minh:** Kiểm thử Waybi backend dùng request interception; chưa gọi live external model trong môi trường QA.
- **Trạng thái phát hành:** Baseline `a50eb84` đang trên production. Patch active state/touch target hiện tại chưa deploy; cần lệnh deploy riêng.

## Rủi ro và hoàn tác

- Rủi ro chính nằm ở CSS specificity của các trang legacy; 17 route được kiểm tra ở sáu breakpoint để giảm rủi ro này.
- Dữ liệu cá nhân được normalize khi đọc; không xóa key legacy trong migration thông thường.
- Patch mới chỉ chạm shell UI và test, không chạm admissions engine. Có thể hoàn tác riêng patch sau `a50eb84` mà không làm mất dữ liệu người dùng.
- Artifact `.cache/` chỉ dùng local và không được deploy.
