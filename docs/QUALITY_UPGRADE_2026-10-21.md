# BrightWay Careers — audit và nâng cấp chất lượng, 21/10/2026

## Phạm vi và kết luận

Thực hiện trên repository tại HEAD gốc `21b11e6`. Chưa commit, push hoặc deploy đợt nâng cấp này. Không đổi file tính điểm, công thức, dữ liệu tuyển sinh, API hoặc secret. Website công khai vẫn là bản đã triển khai trước đó; ảnh và kiểm thử sau sửa trong báo cáo là bản localhost.

Các luồng chức năng đã kiểm thử thành công. Chưa đủ bằng chứng công bố đạt 9/10: hiệu năng mobile lab còn điểm cần cải thiện; chưa có dữ liệu INP/LCP/CLS p75 của người dùng thật, kiểm tra trình đọc màn hình thủ công hoặc đánh giá chất lượng tư vấn AI thực tế.

## Audit hiện trạng

- Trang chủ đã có ba lối bắt đầu, hero, 8 ảnh campus, khu trường nổi bật, nguồn tin tuyển sinh, roadmap và bộ công cụ. Giữ nguyên các khu vực và nhận diện này.
- Holland 42 câu và nhập mã độc lập đã có; không xây bài kiểm tra khác và không bắt buộc làm Holland.
- `assets/js/flow.js` quản lý `bwJourneyV2`, chuyển trạng thái giữa các trang, tiến độ, dữ liệu nhập và xóa dữ liệu cục bộ.
- `selection-model.js`/`selections.js` đã quản lý trường yêu thích và nguyện vọng riêng, chống trùng, thứ tự, xóa, khôi phục và xuất TXT. Bổ sung CSV vào tính năng hiện hữu.
- `page2.js` đã tìm theo trường/ngành, lọc khu vực/trường yêu thích, mở hồ sơ và so sánh 2–3 trường. Trước sửa bảng chỉ có số lượng ngành và thông báo có nguồn.
- `career-pathways.js` chỉ nối tên ngành xuất hiện trong lộ trình học vấn có nguồn với danh mục ngành chính thức hiện có. Giữ nguyên dữ liệu và điều kiện đối chiếu.
- Waybi có hai giao diện (trang chủ và widget dùng chung), ngữ cảnh trang, gợi ý câu hỏi, liên kết công cụ và timeout API 20 giây. Hai giao diện đều thiếu thao tác thử gửi lại trực tiếp.

## Lỗi và khoảng trống đã xử lý

Không phát hiện lỗi P0 trong phạm vi đã kiểm thử.

| Mức | Vấn đề, cách tái hiện | Kết quả |
|---|---|---|
| P1 | Giữ request module tra cứu ở trạng thái pending; trước đây chỉ có catch khi import bị từ chối | Sau 8 giây kết thúc busy và hiện Thử lại; tải lại khôi phục danh mục và chế độ tìm |
| P1, hồi quy trong đợt sửa | Cho nguồn quảng bá trả HTTP 503; import tĩnh dữ liệu học bổng mới làm module tra cứu không tải | Đã sửa thành import động độc lập; regression `15-promotion-retry-and-privacy-signals` PASS, tra cứu FPT vẫn hoạt động |
| P2 | Dùng Space để chọn So sánh; DOM render lại làm mất focus | Giữ focus tại checkbox của trường vừa chọn; xử lý tương tự nút Lưu trường |
| P2 | Lưu Đại học Cần Thơ rồi tìm `dai hoc can tho` trong trường yêu thích | Chuẩn hóa chữ Đ hoa trước khi bỏ dấu; tìm có/không dấu khớp nhau |
| P2 | Gửi Waybi khi API trả 503 trên trang chủ hoặc profile | Có Thử gửi lại, busy và liên kết công cụ; gửi lại không nhân đôi câu hỏi hoặc lịch sử thất bại |
| P2 | Axe phát hiện màu nút Menu, nhãn/CTA trường, trạng thái Holland và liên kết chat thiếu tương phản | Điều chỉnh các màu cụ thể trong bảng màu tím; axe sau sửa không còn violation trên các bề mặt đã quét |
| Khoảng trống UX | Chọn hai trường nhưng không xem được ngành, học bổng, phương thức, điểm chuẩn hoặc website ngay trong bảng | Bảng 7 tiêu chí, nguồn theo từng ô, danh mục ngành có thể mở, mở đúng tab hồ sơ từ bảng |
| Khoảng trống UX | Cần mở danh sách nguyện vọng trong bảng tính | CSV UTF-8 BOM, ưu tiên, mã, phân loại/cơ sở, năm dự kiến/năm nguồn, URL và cảnh báo chưa đăng ký chính thức; giữ TXT |

## Thay đổi giao diện và dữ liệu trình bày

- So sánh chỉ dùng danh mục theo năm có nguồn chính thức. Danh mục thứ cấp/hiện hành chưa xác nhận theo năm không trở thành ngành tuyển sinh đã xác minh.
- Học phí chỉ xuất hiện khi đủ năm, mô tả và nguồn HTTPS. Thiếu dữ liệu được ghi rõ, không dùng giá cũ lấp chỗ trống.
- Điểm chuẩn giữ riêng năm, phương thức và thang điểm. Chỉ tính khoảng min/max để trình bày các điểm chuẩn đã có cùng nguồn/phương thức/thang; không đổi công thức xét tuyển và không chấm điểm chất lượng trường.
- Học bổng trong bảng chỉ lấy tư liệu biên tập qua điều kiện xác minh hiện có. Tư liệu 2026 được ghi rõ chưa xác nhận còn nhận hồ sơ; quảng cáo không tham gia so sánh hoặc xếp hạng.
- Bổ sung thử tải lại đối chiếu ngành khi module liên quan lỗi; giữ liên kết tra cứu độc lập và trạng thái nghề khi tải lại.
- Hero ưu tiên ảnh đầu; các ảnh/tư liệu dưới màn hình đầu dùng lazy loading. Ảnh slide ẩn không chiếm tải ban đầu; giữ đầy đủ ảnh gốc.
- Carousel mặc định do người dùng điều khiển; có nút bật/tắt tự chuyển ảnh, giữ nút trước/sau, chấm chọn và vuốt. Tôn trọng giảm chuyển động qua kiểm tra hiện có.
- Phục vụ font Be Vietnam Pro và Quicksand hiện có từ `assets/fonts`, giữ giấy phép SIL OFL và danh sách nguồn. Font dùng `font-display: optional`; lần đầu có thể dùng font dự phòng nếu font chưa sẵn sàng.
- Dành chỗ cho phần nguyện vọng trong lúc mở dữ liệu cục bộ để giảm dịch chuyển bố cục. Sửa mô tả CTA trang chủ từ “Tìm hiểu” thành “Xem hồ sơ” đúng với giao diện đang có; không xóa khối quảng bá hoặc công cụ.

## Kết quả kiểm thử

| Phạm vi | Kết quả | Bằng chứng |
|---|---|---|
| Unit, gồm điều kiện nguồn/năm, CSV và chữ Đ | PASS 94/94 | `npm test`; `tests/quality-upgrade.test.mjs` bổ sung 4 bài |
| HTML, liên kết nội bộ và cú pháp | PASS | `npm run validate`: 20 trang, 393 liên kết/tài nguyên, 81 kiểm tra cú pháp |
| Hồi quy toàn hệ thống | PASS 17/17 | `.cache/ux-e2e/report.json` |
| Trường yêu thích, 2–3 trường, thứ tự nguyện vọng, lỗi dữ liệu | PASS 9/9 | `.cache/completion-2026-10-21/after/report.json` |
| So sánh có nguồn, bàn phím, CSV tải thật, Waybi thử lại, pending/retry, chữ Đ, carousel và responsive/axe | PASS 8/8 | `.cache/quality-2026-10-21/after/report.json` |
| Holland → nghề → ngành có nguồn → trường → nguyện vọng, quay lại/khôi phục | PASS | Regression `02-holland-flow`, `08-persistence-and-back-navigation`, `17-school-choices-and-wishes` |
| Viewport yêu cầu | PASS | 360, 390, 768, 1366, 1920px; 25 tổ hợp trang/viewport trong bộ mới và bộ hồi quy bổ sung |
| Accessibility tự động | PASS trong phạm vi quét | Axe WCAG 2 A/AA và 2.1 AA: 0 violation trên 5 trang ở 390px và 2 cửa sổ chat; không thay thế đánh giá thủ công |
| Liên kết nguồn lấy mẫu | PASS HTTP 9/9 | `.cache/quality-2026-10-21/source-links.json`; 9 URL FPT, CTU, HCMUT và UEH trả 200. HTTP 200 không tự chứng minh nội dung hoặc toàn bộ dữ liệu đúng |
| Build | BLOCKED | Đã chạy `npm run build`: không có script `build` trong package.json; website dùng HTML/JS tĩnh |
| Lint | BLOCKED | Đã chạy `npm run lint`: không có script `lint`; validate cú pháp không được gọi là lint |
| Chất lượng trả lời AI live | BLOCKED/chưa đánh giá | UI lỗi/thử lại dùng Playwright route 503 và reply kiểm soát. Không gọi AI trả phí hoặc thay cấu hình API |

Bộ QA trước sửa ghi nhận 5 FAIL theo tiêu chí mới: thiếu nội dung so sánh, mất focus, chưa có CSV và hai giao diện thiếu thử lại. Ba mục thiếu tính năng được ghi nhận là khoảng trống, không coi là lỗi P0. Trong hồi quy có một assertion cũ đếm 5 hàng; đã cập nhật thành 7 hàng và kiểm tra chính xác nhãn từng tiêu chí. Một lần điều hướng timeout được đổi sang chờ DOMContentLoaded, vẫn bắt buộc URL đúng và có ảnh khi lỗi; không chờ các tài nguyên bên ngoài không liên quan hoàn tất mới xác nhận điều hướng.

## Lighthouse và Core Web Vitals

Lighthouse 13.5.0 chạy Edge headless trên máy hiện tại, HTTP localhost, mobile và simulated throttling. Mỗi trang một mẫu trong lần đo cuối, không chạy cùng các bộ Playwright khác. Không coi kết quả là dữ liệu production hoặc p75. TBT không phải INP. Báo cáo HTML/JSON đầy đủ tại `.cache/quality-2026-10-21/lighthouse/`; số đo ban đầu tại `before/lighthouse-summary.json`.

Lần đo cuối hoàn tất lúc 00:54–00:55 UTC ngày 21/10/2026:

| Trang | Performance / 100 | Accessibility / 100 | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|
| Trang chủ | 60 | 97 | 17,334 giây | 0,044 | 0 ms |
| Tra cứu trường | 70 | 100 | 4,298 giây | 0,148 | 2,5 ms |
| Khám phá nghề | 68 | 100 | 8,718 giây | 0 | 0 ms |
| Hồ sơ/hành trình | 85 | 98 | 3,917 giây | 0 | 0 ms |

Best Practices: 100/100 trên cả bốn trang. Không có runtimeError trong các báo cáo Lighthouse. Các điểm accessibility Lighthouse khác axe ở trên vì phạm vi, viewport, dữ liệu trạng thái và bộ quy tắc khác nhau; không gọi chúng là chứng nhận WCAG toàn website.

**FAIL so với ngưỡng tham khảo trong mẫu lab:** LCP cả bốn trang còn trên 2,5 giây; CLS trang trường 0,148 còn trên 0,1. Cần đợt tối ưu tiếp theo cho tài nguyên ảnh, công việc tải/khởi tạo và bố cục nội dung sinh động. Không đổi dữ liệu tuyển sinh để giảm công việc hiển thị. CLS trang hồ sơ giảm trong các mẫu sau khi dành chỗ loading, nhưng số đo đơn lẻ không chứng minh p75 production. Dữ liệu LCP/CLS p75 và INP field hiện BLOCKED/chưa có; không dùng TBT thay INP.

## Bằng chứng trước/sau

- Bảng cũ: [trước](../.cache/quality-2026-10-21/before/comparison.png), [sau](../.cache/quality-2026-10-21/after/comparison.png).
- Mất focus: `before/report.json`, scenario 02 và assertion trên `document.activeElement`; ảnh không chứng minh được focus sau thao tác.
- Waybi shared lỗi: [trước](../.cache/quality-2026-10-21/before/waybi-shared-error.png), [sau](../.cache/quality-2026-10-21/after/waybi-shared-error.png).
- Waybi trang chủ lỗi: [trước](../.cache/quality-2026-10-21/before/waybi-home-error.png), [sau](../.cache/quality-2026-10-21/after/waybi-home-error.png).
- Bảng so sánh mobile: [360px](../.cache/quality-2026-10-21/after/comparison-360.png), [390px](../.cache/quality-2026-10-21/after/comparison-390.png).
- [Module bị treo và nút phục hồi](../.cache/quality-2026-10-21/after/module-stalled-recovery.png).
- CSV thực tải xuống: `after/brightway-nguyen-vong.csv`; các trường hợp dấu phẩy, dấu nháy và tiền tố công thức được kiểm thử unit.
- Trạng thái loading/empty/offline: `.cache/completion-2026-10-21/after/`.
- Axe trước sửa trang chủ: `before/axe-index.json`; các báo cáo sau: `after/axe-*.json`.

Ảnh và JSON trong `.cache` là bằng chứng cục bộ không đưa vào Git. Ảnh element bảng sau sửa ẩn navbar dính riêng lúc chụp để bảng không bị che; trình duyệt thật vẫn giữ navbar.

## File sửa

- Logic: `assets/js/page2.js`, `page2-loader.js`, `school-comparison-model.js` (mới), `careers.js`, `selection-model.js`, `selections.js`, `waybi.js`.
- Giao diện: `index.html`, `page2.html`, `profile.html`, `careers-holland.html`, `holland.html`.
- CSS: `assets/css/brightway-theme.css`, `careers.css`, `flow.css`, `holland.css`, `home-journeys.css`, `page2.css`, `selections.css`, `university-promotions.css`.
- Font: `assets/fonts/brightway-fonts.css`, 18 WOFF2, `bevietnampro-OFL.txt`, `quicksand-OFL.txt`, `SOURCES.json`.
- QA: `scripts/qa-quality.cjs`, `scripts/qa-lighthouse.cjs`, `scripts/vendor-brightway-fonts.mjs`, `tests/quality-upgrade.test.mjs`; cập nhật `scripts/qa-ux-e2e.cjs`, `package.json` và báo cáo này.

Để chạy kiểm tra mở rộng: `npm run test:e2e:quality`. Axe và Lighthouse được cài tạm bằng `npm install --no-save --package-lock=false --ignore-scripts --prefix .cache/qa-tools lighthouse @axe-core/playwright`; không thay dependency production/package-lock. Nếu thiếu axe, báo cáo ghi rõ BLOCKED cho phần accessibility. Tạo lại font nếu cần bằng `node scripts/vendor-brightway-fonts.mjs`.

## Đánh giá theo tiêu chí và phần còn lại

| Tiêu chí | Trạng thái có bằng chứng |
|---|---|
| Hành trình và lưu/khôi phục | PASS trong các tình huống Playwright đã nêu |
| Chọn trường, so sánh, nguyện vọng | PASS; thêm nguồn theo ô và xuất CSV |
| Responsive và thao tác | PASS các viewport đã nêu; focus thao tác chọn được kiểm tra riêng |
| Dữ liệu và quảng bá minh bạch | PASS điều kiện năm/nguồn, paid isolation và mẫu URL; chưa rà soát nội dung mọi nguồn bên ngoài |
| Waybi UI | PASS waiting/error/retry/context pathname; chất lượng phản hồi live chưa đánh giá |
| Accessibility | PASS tự động trên mẫu; còn cần kiểm tra trình đọc màn hình và khả năng nhận biết nội dung bằng người dùng thật |
| Hiệu năng | Đã đo; còn cần tối ưu để đạt các ngưỡng tham khảo trên thiết bị/mạng phù hợp |
| Production và dữ liệu người dùng thật | Chưa triển khai thay đổi này; chưa có CWV field/INP để kết luận |

Không tự chấm điểm tổng 9/10. Các dữ liệu học phí/học bổng/ngành thiếu vẫn giữ trạng thái chưa xác minh; các đối chiếu nghề không có nguồn vẫn để người dùng tra cứu độc lập.
