# BrightWay Product Polish & Final QA — 22/10/2026

## Kết luận và phạm vi

Đã sửa các lỗi xác minh được trong giao diện, trạng thái mạng, điều hướng và hiển thị lịch. Hero premium được giữ nguyên về bố cục, nội dung và hình ảnh gốc. Không đổi schema/localStorage, API, secret, cấu hình production, dữ liệu tuyển sinh chuẩn hoặc các engine tính điểm.

Bản sửa đang ở repository local, **chưa deploy**. Bản production được xác nhận trước đợt này là `f2b5366`. Kết quả dưới đây là kiểm thử local trừ các truy vấn đọc CMS công khai được nêu rõ. Không đánh đồng trang tải được với tính năng đã vượt kiểm thử.

## 1. Kiểm kê

- Kiểm kê 29 tệp HTML: 17 trang người dùng, 1 redirect cũ, 9 trang quản trị và 2 partial/include.
- 22 stylesheet. Inventory máy đọc liệt kê đầy đủ JavaScript, assets và đường dẫn trong `.cache/product-polish/after/inventory.json`.
- Shell người dùng dùng chung `assets/js/flow.js`, `assets/css/flow.css`, `assets/css/brightway-theme.css`.
- Quản trị giữ shell riêng và auth guard; không ép navbar học sinh vào vùng quản trị.
- Partial `_home_content.html` và `assets/js/admin-quick-include.html` không được tính là trang độc lập.
- URL `careers.html` chuyển hướng sang `careers-holland.html` và giữ query/hash; không đổi route cũ.

## 2. Bảng audit trang

UI/Navigation/Responsive là kết quả quét browser sau sửa. Cột Functionality nêu mức kiểm tra thật, không suy diễn từ ba cột giao diện. Ma trận: 360, 390, 768, 1024, 1366, 1440, 1920px; screenshot toàn trang tại 390/1366px.

| Trang | UI | Navigation | Responsive | Functionality | Issues / giới hạn |
|---|---|---|---|---|---|
| `index.html` | PASS | PASS | PASS | PASS — CTA, carousel, nguyện vọng, Waybi, trạng thái người mới/có dữ liệu | Đã sửa tải ảnh ẩn và ảnh quá lớn; Lighthouse vẫn cần theo dõi |
| `careers-holland.html` | PASS | PASS | PASS | PASS — tìm kiếm, Holland filter, nghề → ngành → trường, retry | Không thêm quan hệ ngành/nghề chưa có nguồn |
| `holland.html` | PASS | PASS | PASS | PASS — hoàn thành 42 câu, khôi phục nháp/kết quả, nhập mã | Holland vẫn dùng độc lập |
| `page2.html` | PASS | PASS | PASS | PASS — lọc, lưu/xóa trường, so sánh 2–3 trường, thêm nguyện vọng, lỗi mạng | Thông tin thiếu vẫn ghi rõ |
| `score-calculator.html` | PASS | PASS | PASS | PASS — 34 tổ hợp, đổi phương thức, validation, nháp, luồng tổng hợp 8 trường | Chỉ sửa stylesheet/link asset; không sửa engine |
| `profile.html?tab=journey` | PASS | PASS | PASS | PASS — hồ sơ local, Holland, trường/nguyện vọng, tác vụ, Countdown, F5 | Thêm landmark main; không cần đăng nhập |
| `profile.html?tab=account` | PASS | PASS | PASS | PASS — tab đúng và trạng thái chưa đăng nhập | BLOCKED: đồng bộ tài khoản thật sau đăng nhập |
| `calendar.html` | PASS | PASS | PASS | PASS — nguồn/năm, trạng thái 2027, điều hướng lịch/kế hoạch | Đã sửa tương phản ngày/nhãn |
| `resources.html` | PASS | PASS | PASS | PASS — render bộ tin và nguồn, filter theo model/unit test, link nội bộ | Không kiểm tra thủ công từng website trường bên ngoài |
| `news.html` | PASS | PASS | PASS | PASS — CMS thật, empty, SDK lỗi/retry; card đã hỗ trợ Enter | Bài CMS có thể thay đổi theo thời điểm |
| `news-detail.html` | PASS | PASS | PASS | PASS — thiếu slug, lỗi SDK, retry truy vấn thật | Không tạo bài giả để lấp trạng thái thiếu |
| `majors.html` | PASS | PASS | PASS | PASS — CMS thật, filter, mở ngành bằng bàn phím, retry | NEU dùng ký hiệu viết tắt có nhãn rõ vì thiếu logo local |
| `major-detail.html` | PASS | PASS | PASS | PASS — mở ngành thật, thiếu slug, retry | Không nâng dữ liệu CMS thành dữ liệu tuyển sinh đã xác minh |
| `scholarship-roadmap.html` | PASS | PASS | PASS | PASS — nội dung, link, điều hướng, dùng nguồn cũ nguyên trạng | Đã sửa tương phản link |
| `essay-review.html` | PASS | PASS | PASS | PASS — shell/hiển thị và điều hướng | BLOCKED: gọi dịch vụ AI thật |
| `interview-prep.html` | PASS | PASS | PASS | PASS — nội dung mẫu, điều hướng; trạng thái active tab được kiểm tra hiển thị | Đã sửa tương phản nút tab |
| `login.html` | PASS | PASS | PASS | PASS — form, nhãn, shell, trạng thái chưa đăng nhập | BLOCKED: OAuth/đăng nhập thật |
| `waybi.html` | PASS | PASS | PASS | PASS — launcher/panel, lịch đọc nguồn chuẩn và số mốc khớp | BLOCKED: chất lượng trả lời backend AI thật |

9 trang quản trị đã được kiểm kê mã nguồn/đường dẫn/asset: `admin.html`, `admin/index.html`, `admin/posts.html`, `admin/post-edit.html`, `admin/majors.html`, `admin/major-edit.html`, `admin/resources.html`, `admin/resource-edit.html`, `admin/users.html`. Luồng sau đăng nhập và thao tác ghi quản trị: **BLOCKED**, không có phiên quản trị QA; không tạo/sửa/xóa nội dung production để kiểm tra.

## 3. Lỗi xác minh và thay đổi

| Mức | Vấn đề trước sửa / cách tái hiện | Sửa và bằng chứng sau |
|---|---|---|
| P1 | `majors.html`/`news.html` await SDK ngoài vùng catch; chặn CDN có thể để spinner hoặc rejection. Detail không có nút retry; truy vấn chậm không có deadline chung | `BWContent.load`: deadline 10 giây, aria-busy, lỗi dễ hiểu, nút retry gọi lại request; 4 trang vượt kiểm thử SDK lỗi → retry → CMS thật |
| P1 | `waybi.html` giữ mảng ngày 2026 riêng, không có nguồn, trong khi calendar đã dùng bộ nguồn chuẩn. Ví dụ mã cũ gán V-ACT 15/03 và tốt nghiệp đầu tháng 7 | Bỏ mảng ngày gán sẵn; `officialEvents(policy, 2026)` đọc nguyên bộ nguồn hiện có. UI nêu rõ tham khảo 2026. Regression đối chiếu số ngày được đánh dấu với nguồn |
| P2 | Kết quả CMS cũ có thể trả về sau kết quả filter mới và ghi đè giao diện | Token theo request/host; unit tests xác nhận phản hồi cũ và phản hồi sau timeout không thay UI mới |
| P2 | 5 trạng thái trang có tổng 315 node không đạt tương phản qua axe: tính điểm, lịch, học bổng, phỏng vấn, Waybi | Dùng `--bw-brand-text`, token trạng thái, nền sự kiện tối hơn. Sau sửa: 0 violation serious/critical trong quét 18 trạng thái |
| P2 | `majors.html` tải `/assets/images/logos/neu.png` không tồn tại; bị 404 rồi mới fallback | Bỏ path lỗi; hiển thị NEU dưới dạng ký hiệu viết tắt, nói rõ chưa có logo đã đối chiếu; giữ nguyên logo các trường khác |
| P2 | Card bài viết chỉ có onclick, không mở được bằng Enter | Thêm role/link, tabindex và handler bàn phím; slug được encode, dữ liệu hiển thị được escape |
| P2 | Menu mobile không đóng khi bấm ngoài, giữ trạng thái mở khi qua desktop rồi quay lại | Đóng ngoài navbar và khi qua breakpoint desktop; Playwright thao tác thật, thêm hồi quy |
| P2 | Fade dùng visibility cho 7 ảnh ẩn làm trình duyệt tải cả ảnh lazy lúc mở trang | Ảnh không active dùng display:none; ảnh active có fade ngắn. Test kiểm tra request và kích thước frame sau chuyển ảnh |
| P2 | Ảnh mascot 1254px ~875KB phục vụ icon 40–80px; ảnh trường lớn | Resize/compress từ ảnh gốc thành WebP 192/512px và 640/1280px. srcset/sizes tính cả crop-cover; giữ file gốc làm fallback |
| P2 | Validator chỉ quét HTML root, bỏ srcset/CSS URL và inline module | Mở rộng sang admin, srcset, CSS URL và inline ES module; 28 HTML, 535 target nội bộ, 97 kiểm tra cú pháp |
| P2 | Hồ sơ thiếu main landmark trong Lighthouse | Đổi section wrapper thành main, giữ class/DOM con và logic cũ |

Không phát hiện P0. Các P1 đã xác minh nêu trên đã được sửa. Đây là kết luận trong phạm vi kiểm thử đã mô tả; không khẳng định phần backend/auth bị BLOCKED đã đạt.

## 4. Design tokens và shared components

- Giữ namespace `--bw-*` hiện có. Thêm success/warning/error và nền nhẹ tương ứng, có biến thể dark.
- Giữ brand gradient tím; dùng `--bw-brand-text` khi chữ tím nhỏ cần tương phản cao hơn.
- Hệ chữ: Be Vietnam Pro + Quicksand được bundle, có dấu tiếng Việt; h1–h4/type-title dùng cùng thang token. Các trang legacy còn rule riêng theo ngữ cảnh.
- Spacing: token 4/8/12/16/24/32/48px. Radius: 10/16/24px và pill 999px. Surface/overlay shadow dùng token cũ.
- Form nguồn, tháng kế hoạch, nút thứ cấp và trạng thái lỗi dùng token chung; sửa alias surface thiếu định nghĩa sang `--bw-paper`.
- Shared components: `flow` navbar/footer/stepbar, `BWContent` loading/retry, university card, Countdown, Waybi launcher/panel.
- Không tạo schema dữ liệu mới. Các key `bwJourneyV2`, Holland, nháp điểm, favorites và so sánh giữ cơ chế hiện có.

## 5. Kết quả automated QA

| Lệnh / phạm vi | PASS | FAIL | BLOCKED / ghi chú |
|---|---:|---:|---|
| `npm test` | 116 | 0 | Có 5 unit mới cho deadline/retry/race |
| `npm run validate` | 28 HTML, 535 target, 97 syntax | 0 | Gồm admin, srcset, CSS URL, inline module |
| `npm run audit:product` | 18 trạng thái | 0 | 126 kiểm tra viewport; 36 ảnh toàn trang |
| `npm run test:e2e:ui-system` | 8 | 0 | 17 route × 7 kích thước, keyboard/menu/footer/Waybi/storage |
| `npm run test:e2e` | 17 | 0 | Thao tác thật, Holland/nghề/trường/điểm, lỗi mạng, XSS, lưu/khôi phục |
| `npm run test:e2e:completion` | 9 | 0 | Favorites, so sánh, nguyện vọng, slow/offline/retry/empty |
| `npm run test:e2e:quality` | 8 | 0 | Keyboard, CSV, Waybi error/retry, accessibility |
| `npm run test:e2e:personalization` | 11 | 0 | 42 câu Holland, state cũ/corrupt/denied storage, consent |
| `npm run test:e2e:countdown` | 8 | 0 | Tạo/sửa/xóa/pin, hôm nay/quá hạn, F5, home sync |
| `npm run test:e2e:admissions` | 10 | 0 | 34 tổ hợp, validation, phương thức, 42 câu + journey responsive |
| `npm run test:e2e:integrated` | 17 | 0 | 8 trường, input theo chương trình/phương thức, nguồn, nháp |
| `npm run test:e2e:content` | 6 | 0 | CMS thật; chỉ inject lỗi SDK/network, không thay dữ liệu thành công |
| `npm run qa:fonts` | 6 trang + 93 tệp static ở lần chạy | 0 | Font local, không gọi Google Fonts |
| Hero focused browser QA | 4 viewport | 0 | CTA/card, 8 ảnh, prev/next/dots/autoplay, không overflow/layout shift |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS | 0 | Tôn trọng CRLF trên Windows |
| `npm run build` | — | — | BLOCKED: package.json không có build script |
| `npm run lint` | — | — | BLOCKED: package.json không có lint script; syntax check riêng vẫn PASS |

Không cộng các suite thành một chỉ số chất lượng vì có vùng bao phủ chồng lặp. Những test lỗi mạng có interception để tạo lỗi; dữ liệu trường/ngành thành công của luồng chính vẫn lấy từ repository. Suite CMS mới khôi phục bằng phản hồi CMS thật. Waybi backend trong các regression hiện hữu được intercept theo contract, không gửi prompt thật đến mô hình.

## 6. Hiệu năng và ảnh tối ưu

Giữ ảnh gốc và nội dung ảnh. Chỉ resize/compress, quality WebP 86, alphaQuality 95:

| Asset | Trước | Bản tối ưu |
|---|---:|---:|
| Mascot cho launcher | 874.721 byte | 9.412 byte, 192px |
| Mascot lớn | 874.721 byte | 32.238 byte, 512px |
| FPT hero | 298.698 byte | 40.346 byte / 104.282 byte, 640/1280px |
| Cần Thơ | 1.319.419 byte | 56.602 / 194.174 byte |
| Tôn Đức Thắng | 2.302.714 byte | 47.754 / 163.374 byte |

Lighthouse mobile chạy local với mô phỏng throttling, một lần mỗi route ở mỗi mốc; không phải dữ liệu field/p75, TBT không phải INP. Benchmark máy và CMS/CDN thay đổi giữa lần đo nên không suy diễn toàn bộ chênh lệch điểm là do patch. Kết quả chi tiết cuối được ghi trong bảng Lighthouse bổ sung dưới đây và `.cache/quality-2026-10-21/lighthouse/`.

| Trang | Performance trước → sau | Accessibility trước → sau | LCP trước → sau | CLS sau | TBT sau |
|---|---:|---:|---:|---:|---:|
| Trang chủ | 56 → 60 | 100 → 100 | 49,06s → 10,47s | 0,00013 | 27ms |
| Khám phá trường | 64 → 65 | 100 → 100 | 5,88s → 5,45s | 0,12041 | 1ms |
| Khám phá nghề | 66 → 73 | 100 → 100 | 9,16s → 3,92s | 0,19506 | 0ms |
| Hành trình | 79 → 71 | 98 → 100 | 4,44s → 6,03s | 0 | 0ms |

Best Practices sau sửa: 100/100 cả bốn trang. Lần đo cuối: 22/10/2026, 05:21–05:22 UTC; Lighthouse 13.5.0. **Hiệu năng mobile chưa đạt mức mong muốn**, và điểm trang Hành trình giảm trong lần đo này. Không công bố cải thiện hiệu năng đồng đều; cần nhiều lần đo ổn định và profiling riêng trước khi kết luận nguyên nhân. Bản baseline đầu có tải QA khác chạy đồng thời nên so sánh điểm/LCP chỉ có giá trị tham khảo. Dung lượng các file tối ưu và test ngăn tải ảnh ẩn là bằng chứng trực tiếp, không phụ thuộc điểm Lighthouse.

Baseline được lưu riêng tại `.cache/product-polish/lighthouse-before/`; kết quả cuối tại `.cache/quality-2026-10-21/lighthouse/summary.json` và HTML/JSON từng trang.

## 7. Ảnh và bằng chứng

- Toàn trang trước sửa: `.cache/product-polish/before/*-390.png`, `*-1366.png`.
- Toàn trang sau sửa: `.cache/product-polish/after/*-390.png`, `*-1366.png`; bao gồm 17 trang và hai trạng thái profile.
- Lỗi trước sửa: `before/report.json` có target HTML và contrast ratio từng node, kèm ảnh từng trang; `content-states/*-offline.png` là ảnh lỗi mạng được xử lý sau sửa.
- Hero sau tối ưu cuối: `.cache/hero-premium/after/hero-360.png`, `hero-390.png`, `hero-768.png`, `hero-1366.png`.
- Hồi quy luồng xét tuyển: `.cache/admissions-regression/` và `.cache/integrated-admissions/`.
- Báo cáo mới có thể chạy lại bằng `npm run audit:product` và `npm run test:e2e:content`.
- Visual QA là ảnh đối chiếu và kiểm tra bounding box/overflow, **không phải** pixel-diff CI đã phê duyệt. Các ảnh chứa nội dung CMS thật có thể khác theo thời điểm.

## 8. Đánh giá UX/UI trước và sau

Không tự chấm 9/10. Dùng tiêu chí có bằng chứng:

| Tiêu chí | Trước | Sau | Căn cứ |
|---|---|---|---|
| Shell và điều hướng | Cùng shell, thiếu đóng menu ngoài/breakpoint | PASS trong phạm vi quét | 17 route, 7 kích thước; 8 scenario UI |
| Accessibility trang mở rộng | 5 trang có lỗi serious contrast | 0 serious/critical trong 18 trạng thái | axe WCAG 2 A/AA, 2.1 AA; không phải chứng nhận toàn diện |
| Độ hoàn thiện khi mất mạng | 4 trang CMS có khoảng trống recovery | Có trạng thái lỗi, retry và deadline | 6 browser cases + 5 unit cases |
| Nhất quán lịch | Waybi có bản sao ngày gán sẵn | Một bộ nguồn được dùng lại | Đối chiếu số mốc, giữ nguyên policy |
| Ảnh và tải ban đầu | Mascot nặng, carousel tải ảnh ẩn | Lazy theo ảnh active, responsive WebP | Kiểm tra request + dung lượng asset |
| Reliability dữ liệu local | Baseline đã qua nhiều regression | Các suite state/F5 vẫn PASS | Không đổi schema; test migration/corrupt/blocked storage vẫn chạy |
| Performance mobile | Lighthouse 56/64/66/79 theo thứ tự home/trường/nghề/journey | 60/65/73/71; chưa đạt kỳ vọng | Lab một lần/route, điều kiện không hoàn toàn đồng nhất; không dùng làm chứng nhận chất lượng |

## 9. Giới hạn và vấn đề còn lại

- Build/lint pipeline chưa được cấu hình. Không gắn nhãn syntax validator thành build/lint để che trạng thái này.
- Hiệu năng mobile vẫn có chi phí CSS/HTML legacy và truy vấn/script bên ngoài. Không rewrite toàn trang hoặc gộp CSS không cần thiết trong đợt polish.
- Hiệu năng là hạng mục còn cần xử lý, không đánh dấu PASS toàn diện. Chưa có nhiều lần đo kiểm soát để kết luận sự giảm điểm ở Hành trình là regression thực hay biến động môi trường.
- Không có phiên người dùng/quản trị QA để kiểm tra OAuth, cloud sync và thao tác ghi quản trị thật. Trạng thái local không đăng nhập đã kiểm tra.
- Chưa đánh giá câu trả lời của Waybi backend thật; loading/error/retry/UI và contract đã được kiểm tra.
- Chưa HEAD/click thủ công mọi URL nguồn bên ngoài; 535 đường dẫn/tài nguyên nội bộ đã được xác minh tồn tại, các nguồn tuyển sinh chuẩn không bị thay đổi.
- Chưa deploy. Cần lệnh phát hành riêng; production chưa chứa patch này.

## 10. Hoàn tác

Các thay đổi tách khỏi dữ liệu/engine và không migration key. Có thể hoàn tác patch UI/recovery mà không xóa dữ liệu local. File ảnh gốc vẫn còn nguyên; WebP chỉ là biến thể tối ưu. Không xóa tài khoản, lựa chọn, nguyện vọng hoặc mục tiêu người dùng.

## 11. Danh sách file thay đổi

65 file: 42 file hiện hữu và 23 file mới (gồm 18 biến thể ảnh). Danh sách dưới đây không bao gồm artefact QA trong `.cache/` được Git ignore.

### HTML có thay đổi ngoài cache key

`index.html`, `calendar.html`, `waybi.html`, `profile.html`, `majors.html`, `major-detail.html`, `news.html`, `news-detail.html`.

### HTML chỉ cập nhật cache key của asset dùng chung

`admin.html`, `admin/index.html`, `admin/major-edit.html`, `admin/majors.html`, `admin/post-edit.html`, `admin/posts.html`, `admin/resource-edit.html`, `admin/users.html`, `careers-holland.html`, `careers.html`, `essay-review.html`, `holland.html`, `interview-prep.html`, `login.html`, `page2.html`, `resources.html`, `scholarship-roadmap.html`, `score-calculator.html`.

### CSS

`assets/css/brightway-theme.css`, `assets/css/flow.css`, `assets/css/home-journeys.css`, `assets/css/admissions-policy.css`, `assets/css/study-plan.css`.

### JavaScript giao diện

`assets/js/content-state.js` (mới), `assets/js/flow.js`, `assets/js/uni-logos.js`, `assets/js/university-card.js`, `assets/js/admissions-home.js`, `assets/js/resources-data.js`, `assets/js/waybi.js`, `assets/js/waybi-presence.js`.

### Kiểm thử, cấu hình lệnh và tài liệu

`package.json`, `scripts/qa-product-polish.cjs` (mới), `scripts/qa-content-states.cjs` (mới), `scripts/qa-ui-system.cjs`, `scripts/validate-site.mjs`, `tests/content-state.test.mjs` (mới), `tests/site-structure.test.mjs`, `docs/PRODUCT_POLISH_QA_2026-10-22.md` (mới).

### 18 ảnh mới từ ảnh gốc

```text
assets/images/waybi/waybi-ui-192.webp
assets/images/waybi/waybi-ui-512.webp
assets/images/hero/01-fpt-can-tho-640.webp
assets/images/hero/01-fpt-can-tho-1280.webp
assets/images/hero/02-ctu-640.webp
assets/images/hero/02-ctu-1280.webp
assets/images/hero/03-ueh-640.webp
assets/images/hero/03-ueh-1280.webp
assets/images/hero/06-vlu-640.webp
assets/images/hero/06-vlu-1280.webp
assets/images/hero/11-hcmus-640.webp
assets/images/hero/11-hcmus-1280.webp
assets/images/hero/14-rmit-640.webp
assets/images/hero/14-rmit-1280.webp
assets/images/hero/16-uit-campus-640.webp
assets/images/hero/16-uit-campus-1280.webp
assets/images/hero/17-tdtu-campus-640.webp
assets/images/hero/17-tdtu-campus-1280.webp
```

Ảnh chụp và báo cáo `.cache/` là artefact local, chưa phải artefact CI lâu dài. Cần lưu kèm nếu chuyển checkout hoặc muốn giữ bằng chứng ngoài máy này.
