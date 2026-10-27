# BrightWay Career — nghiệm thu nâng cấp cục bộ, 27/10/2026

Tại thời điểm nghiệm thu trước triển khai, đợt này mới sửa mã trong repository; **chưa chạy SQL trên Supabase**. [Báo cáo kiểm toán trước sửa](MASTER_AUDIT_BASELINE_2026-10-27.md) được lập trước các thay đổi. Commit nền để so sánh/khôi phục mã: `7ca9080`. Không thay dữ liệu tuyển sinh, công thức tính điểm, điểm chuẩn, học phí, tổ hợp hay hồ sơ người dùng. Triển khai website sau đó không tự áp dụng migration database.

## Kết quả theo tiêu chí

Không có cơ sở để chấm điểm 9+/10 cho toàn sản phẩm: chưa kiểm chứng DB production, từng dòng dữ liệu tuyển sinh và trải nghiệm người dùng thực. Bảng dưới dùng **điểm đo được** thay cho điểm cảm tính; “chưa chấm” là trạng thái đánh giá, không phải 0 điểm.

| Tiêu chí | Trước | Sau | Bằng chứng và giới hạn |
| --- | --- | --- | --- |
| UI/UX, điều hướng, accessibility | Chưa chấm /10; QA 18/18 PASS | Chưa chấm /10; QA 18/18 PASS | Playwright kiểm tra header/footer, mobile menu, overflow, lỗi console/asset và axe serious/critical ở trạng thái được duyệt; chưa có thử nghiệm người dùng hoặc đối chiếu WCAG 2.2 AA toàn bộ trạng thái. Không sửa header/bố cục khi không có lỗi được xác minh. |
| Dữ liệu tuyển sinh | Chưa chấm /10; 23/35 trường có bảng ngành | Chưa chấm /10; 23/35, dữ liệu gốc không đổi | 12 trường thiếu bảng, 176 dòng thiếu mã, 48 mã 2026 chưa đối chiếu; cần đề án trường đúng năm. |
| Phân loại ngành và tìm kiếm | Chưa chấm /10; kiểm thử hiện hữu PASS | Chưa chấm /10; hồi quy PASS | Thứ tự theo danh mục, xếp hạng mức khớp, tìm không dấu, nhóm/khu vực, trạng thái rỗng đã được kiểm thử; không có thay đổi danh mục trong đợt này. |
| Tính điểm | Chưa chấm /10; 10/10 kịch bản tuyển sinh | Chưa chấm /10; 10/10 và 17/17 tích hợp | 34 trường hợp tổ hợp và các nhánh riêng của 8 trường qua Playwright. Công thức không đổi; chưa kiểm chứng thêm quy định mới của từng trường. |
| Responsive | Chưa chấm /10; QA 18/18 | Chưa chấm /10; QA 18/18 | 8 độ rộng 320–1920px, ảnh ở 390 và 1366px; các luồng tính điểm còn được thử ở 360/390/768/1366px. |
| Hiệu suất | Lighthouse mobile: Home 6,0; Trường 6,2; Nghề 6,7; Hành trình 8,1 /10 | Home 6,0; Trường 6,3; Nghề 7,1; Hành trình 8,0 /10 | Một lần chạy lab mỗi giai đoạn; điểm nhiễu và không thay thế field data. Giảm byte tải nhưng LCP chưa giảm nhất quán. |
| Bảo mật | Chưa chấm /10; có P0 trong SQL nguồn | Chưa chấm /10; đã có bản vá và migration **chưa áp dụng** | Kiểm thử mã API và bất biến SQL PASS. Chưa chứng minh trạng thái quyền RPC hoặc trigger trên production; không được coi P0 production đã đóng. |

## Lỗi xác minh và thay đổi

| Ưu tiên | Phát hiện | Sửa trong repository | Trạng thái |
| --- | --- | --- | --- |
| P0 | Hai RPC `SECURITY DEFINER` tạo tài khoản/đổi mật khẩu được cấp `authenticated` nhưng không tự xác minh admin. | Thêm kiểm tra `auth.uid()`/vai trò trước ghi, thu hồi `PUBLIC`/`anon`, chuẩn bị migration thay thế hàm. | PASS mã; **BLOCKED production** cho đến khi xác minh schema, sao lưu và áp dụng migration. |
| P0 | Trigger bootstrap lấy vai trò từ metadata do người đăng ký cung cấp; RLS cho phép chủ hồ sơ UPDATE hàng của mình. | Tài khoản mới mặc định `student`; migration chặn thay đổi `profiles.role` trái quyền bằng trigger. Bootstrap `001_init` từ chối chạy lại nếu các bảng đích đã tồn tại. | PASS kiểm tra nguồn; **BLOCKED production**. |
| P0 | Script cũ cung cấp đăng nhập chỉ qua email và tạo session; file setup khác chứa mật khẩu mẫu. | Ngừng script email-only, migration thu hồi quyền gọi hai RPC cũ; bỏ thông tin đăng nhập mẫu khỏi file setup. | PASS mã; **BLOCKED production**. Nếu từng chạy script/mật khẩu mẫu, người vận hành cần kiểm tra và đổi mật khẩu liên quan. |
| P1 | API AI trả CORS `*` mặc định và không giới hạn kích thước JSON ở ranh giới handler. | Chỉ phản hồi CORS cho cùng origin hoặc `ALLOWED_ORIGIN` được cấu hình; chặn request lạ và payload >128 KB chat/>32 KB analyze. | PASS unit/handler tests. CORS không thay thế xác thực hay rate limit. |
| P1 | 48 logo raster trên card dùng ảnh gốc quá lớn; logo thương hiệu dùng PNG lớn hơn kích thước hiển thị. | Tạo WebP thumbnail, dùng ở card với fallback về ảnh gốc; dùng WebP 96px cho mark ở shell và kích thước ảnh cố định. | PASS asset, E2E và visual QA; tốc độ LCP còn cần xác minh. |
| P2 | QA E2E giả định thứ tự ngành FPT và đường dẫn PNG cũ. | Trỏ kiểm thử vào index ngành gốc và đường dẫn thumbnail thực tế. | PASS 17/17, giữ hành vi sản phẩm. |

Chưa xác nhận các SQL lỗi trên **đang chạy** ở production. Việc phát hiện đến từ mã nguồn; truy cập anon không đủ quyền kiểm tra metadata RPC. Không gọi RPC ghi để thử trên người dùng thật.

## Hiệu suất trước/sau

| Trang mobile lab | Score trước → sau | LCP trước → sau | CLS trước → sau | Tổng byte trước → sau |
| --- | --- | --- | --- | --- |
| Trang chủ | 0,60 → 0,60 | 10,46 → 10,54 s | 0,0001 → 0,0001 | 2,43 → 2,31 MB |
| Tra cứu trường | 0,62 → 0,63 | 6,82 → 8,07 s | 0,102 → 0,002 | 1,63 → 1,14 MB |
| Khám phá nghề | 0,67 → 0,71 | 4,52 → 5,11 s | 0,190 → 0,046 | 0,75 → 0,75 MB |
| Hành trình | 0,81 → 0,80 | 3,92 → 4,06 s | 0,044 → 0 | 0,89 → 0,89 MB |

48 thumbnail trường chiếm 236.942 byte thay cho 6.457.754 byte ảnh raster gốc (giảm 96,3% tổng asset tương ứng). Tải thực tế trang tra cứu trường trong một lần Lighthouse giảm 495.670 byte, khoảng 30,3%. Ảnh gốc vẫn tồn tại để dự phòng và dùng ở kích thước lớn. **Không kết luận cải thiện LCP:** mọi LCP sau đều nhỉnh hơn trước trong lần lab đơn lẻ; cần nhiều lượt đo cùng điều kiện và dữ liệu người dùng thật. CSS chưa dùng và tài nguyên khác tiếp tục là P2.

## Kiểm thử và hiện vật

| Cổng | Kết quả |
| --- | --- |
| `npm test` | **PASS 133/133**; thêm kiểm tra API/SQL và 48 thumbnail |
| `npm run validate` | **PASS** 28 trang, 541 liên kết/asset, 104 kiểm tra cú pháp |
| `npm run test:e2e` | **PASS 17/17**; Holland, trường/ngành, logo, nguyện vọng, lưu trạng thái, retry và mobile |
| `npm run test:e2e:training-taxonomy` | **PASS** xếp hạng, lọc, phân cấp, A–Z và chuyển sang tính điểm |
| `npm run test:e2e:admissions` | **PASS 10/10** |
| `npm run test:e2e:integrated` | **PASS 17/17** |
| `node scripts/qa-product-polish.cjs before/after` | **PASS 18/18** mỗi giai đoạn; 8 độ rộng; không ghi nhận lỗi console, asset thiếu hoặc lỗi axe serious/critical trong trạng thái đã thử |
| `git diff --check` | **PASS** |
| `build`, `lint`, `typecheck` | **BLOCKED:** repository không khai báo script; `validate` không phải typecheck |
| SQL migration trên bản sao DB và kiểm tra sau migration | **BLOCKED:** không có DB thử nghiệm/schema production có quyền quản trị trong môi trường hiện tại; chưa chạy SQL |
| API AI với upstream thật | **BLOCKED:** không gọi dịch vụ AI production trong kiểm thử; handler được kiểm tra bằng request giả lập |

Ảnh trước/sau ở `.cache/product-polish/before/` và `.cache/product-polish/after/` (cặp `index-html-390.png`, `page2-html-mode-school-1366.png`, `profile-html-tab-journey-390.png`, cùng các trang khác). JSON chi tiết ở `report.json` mỗi thư mục. Lighthouse JSON/HTML trước ở `.cache/master-audit/lighthouse-before/`, sau ở `.cache/quality-2026-10-21/lighthouse/`. Đây là hiện vật cục bộ, không nằm trong gói triển khai.

## Tệp trong đợt này

- Bảo mật API: `api/_request-guards.js`, `api/chat.js`, `api/analyze.js`, `tests/security-boundaries.test.mjs`.
- Bảo mật DB: `supabase/migrations/002_secure_admin_access.sql`, `supabase/migrations/001_init.sql`, `supabase/migrations/README.md`, `supabase/admin-functions.sql`, `supabase/setup-admin.sql`, `supabase/setup-email-only.sql`.
- Ảnh và shell: `scripts/generate-logo-thumbnails.py`, `assets/images/logos/thumbs/` (48 WebP), `assets/images/brand/brightway-mark-96.webp`, `assets/js/university-card.js`, `assets/js/flow.js`, `tests/image-assets.test.mjs`.
- QA/tài liệu: `scripts/qa-ux-e2e.cjs`, [audit ban đầu](MASTER_AUDIT_BASELINE_2026-10-27.md), tài liệu này.

## Dữ liệu, rollback và việc còn lại

- **Dữ liệu được chuẩn hóa trong đợt này:** không có dòng tuyển sinh hoặc hồ sơ người dùng nào được chỉnh. [Kiểm toán ngành 2026–2027](training-taxonomy-audit-2026-2027.md), [CSV lỗi](training-taxonomy-issues-2026-2027.csv) và [CSV 622 dòng](training-taxonomy-audit-2026.csv) giữ danh sách cần xác minh. Không tự suy đoán mã, trường, điểm hoặc phương thức.
- **Migration production:** sao lưu database trước, so schema thật với preflight trong `002_secure_admin_access.sql`, thử trên bản sao, kiểm tra caller thường/admin, trigger role, tạo hồ sơ, RPC email-only, rồi mới áp dụng có phê duyệt riêng. Script chạy trong transaction; lỗi sẽ rollback toàn bộ. Sau khi chạy, kiểm tra `EXECUTE` grants thực tế và kết quả tài khoản thật. **Không có bước nào trong chuỗi này đã được thực hiện ở production.**
- **Rollback mã:** dùng Git commit nền `7ca9080`; ảnh gốc vẫn giữ. **Rollback DB:** phục hồi snapshot hoặc phiên bản hàm/grant đã xuất trước khi migration; không chạy lại `001_init.sql` trên DB đang có dữ liệu.
- **Rủi ro còn lại:** trạng thái P0 production chưa biết; mật khẩu mẫu trong lịch sử Git nếu từng dùng cần xoay; rate limit đa instance phụ thuộc Upstash production; 12 trường thiếu bảng, 176 dòng thiếu mã, 48 mã 2026 chưa đối chiếu; 553 mục danh mục 2027 chưa so từng dòng với PDF ký số; LCP trang chủ và tra cứu trường còn cao trong lab. Ưu tiên tiếp theo là kiểm tra DB có quyền, đối chiếu từng đề án trường, rồi tối ưu tài nguyên render dựa trên đo nhiều lượt. Không triển khai chỉ để tăng điểm Lighthouse.
