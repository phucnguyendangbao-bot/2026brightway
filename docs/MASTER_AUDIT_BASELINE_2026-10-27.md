# BrightWay Career — báo cáo kiểm toán ban đầu, 27/10/2026

Đây là ảnh chụp **trước khi sửa trong đợt nâng cấp này**. Điểm Lighthouse là một lần đo lab trên máy cục bộ với giả lập mobile; không phải dữ liệu người dùng thật hay cam kết tốc độ production. Không gán điểm 9+/10 từ các phép đo này.

## Phạm vi và luồng dữ liệu

- Website tĩnh 28 trang HTML, CSS/JavaScript thuần; hai Vercel Function chính (`api/chat.js`, `api/analyze.js`); Supabase Auth/CMS; dữ liệu trường, ngành, nghề và quy tắc tuyển sinh trong `assets/data/`.
- Trường và ngành: `schools.json` → `university-identities.js` → `school-profile-details.js`/`school-programs-2024-2026.js` → `training-taxonomy.js` → trang tra cứu, so sánh và công cụ tính điểm. Dữ liệu CMS `public.majors` là chủ đề biên tập, không phải bảng chương trình tuyển sinh.
- Hồ sơ/ưu tiên/nguyện vọng: `flow.js` và `selections.js` giữ dữ liệu trên thiết bị; Auth/CMS Supabase là luồng riêng. Không thực hiện migration hoặc ghi production trong audit.
- [Kiểm toán ngành 2026–2027](training-taxonomy-audit-2026-2027.md) đã kiểm kê 35 hồ sơ đại học, 622 dòng chương trình ở 23 trường, 12 trường thiếu bảng, 176 dòng thiếu mã và 48 mã chưa đối chiếu. Các mục này tiếp tục cần nguồn trường trước khi được xác nhận.

## Phát hiện theo ưu tiên

| Mức | Phát hiện có thể tái hiện từ mã nguồn | Ảnh hưởng | Hướng xử lý |
| --- | --- | --- | --- |
| P0 | `supabase/admin-functions.sql` và `supabase/setup-admin.sql`: `admin_create_user` và `admin_set_password` là `SECURITY DEFINER`, được cấp `EXECUTE` cho `authenticated` nhưng không kiểm tra vai trò admin trong hàm. | Nếu các script đã chạy ở DB, tài khoản bất kỳ có thể gọi RPC quản trị. Chưa xác minh quyền thực tế trên production. | Thêm kiểm tra vai trò trong hàm, khóa quyền `PUBLIC`/`anon`, kiểm thử SQL và chuẩn bị migration không xóa dữ liệu. |
| P0 | `supabase/migrations/001_init.sql`: trigger `handle_new_user` lấy `role` từ `raw_user_meta_data`; policy `profiles` cho phép chủ bản ghi `UPDATE` toàn hàng. | Nếu schema tương ứng đang chạy, người dùng có thể tự nâng vai trò. Schema production chưa được kiểm chứng. | Mặc định `student` trong trigger; giới hạn quyền cập nhật các cột hồ sơ, khóa `role` bằng trigger hoặc quyền cột. |
| P0 | `supabase/setup-email-only.sql` chứa RPC đăng nhập chỉ bằng email được cấp cho `anon`; `supabase/setup-admin.sql` chứa mật khẩu mẫu có thể dùng khi setup. | Rủi ro chiếm tài khoản nếu script cũ từng được áp dụng; chưa xác minh RPC hoặc mật khẩu còn hiệu lực. | Vô hiệu hóa đường cũ trong bản setup/migration; người vận hành kiểm tra DB và xoay mật khẩu nếu đã dùng script. |
| P1 | Lighthouse mobile lab: trang chủ 0,60/LCP 10,46 s; tra cứu trường 0,62/LCP 6,82 s; khám phá nghề 0,67/LCP 4,52 s, CLS 0,190; Hành trình 0,81/LCP 3,92 s. | Tải chậm trên thiết bị/mạng yếu; điểm đo một lượt có nhiễu. | Chọn tối ưu ảnh và tài nguyên chặn render có đo trước/sau; không đổi nội dung. |
| P1 | `api/chat.js` và `api/analyze.js` mặc định CORS `*`; `_ratelimit.js` dùng bộ đếm theo instance nếu thiếu Upstash. | Có thể tăng mức lạm dụng API AI; tình trạng Upstash production chưa biết. | Giới hạn origin và payload, xác minh cấu hình giới hạn dùng trên production. |
| P1 | 176 dòng chương trình thiếu mã, 48 mã chưa đối chiếu và 12 trường thiếu bảng. | Chưa thể khẳng định đầy đủ và chính xác ngành tuyển sinh. | Giữ nhãn cần xác minh; chỉ cập nhật khi có đề án chính thức đúng năm, trường và cơ sở. |
| P2 | Giao diện đã có nhiều lớp CSS theo đợt; Lighthouse báo khoảng 164 KiB CSS chưa dùng trên trang chủ và 56 KiB trên trang tra cứu trường trong lần đo. | Tăng tải và khó bảo trì. | Dọn theo khu vực đã kiểm thử, tránh thay đổi nhận diện và header đang ổn định. |

**Lưu ý:** Mức P0 nêu rủi ro từ SQL trong repository, chưa khẳng định cấu hình đó đã được triển khai trên Supabase production. Endpoint metadata công khai của Supabase không cho phép xác nhận quyền RPC bằng khóa anon; không gọi các RPC có tác dụng ghi để thử.

## Baseline kiểm thử và đo lường

| Kiểm tra | Trước sửa |
| --- | --- |
| `npm test` | PASS 128/128 |
| `npm run validate` | PASS 28 trang, 541 liên kết/asset, 103 kiểm tra cú pháp |
| `node scripts/qa-product-polish.cjs before` | PASS 18/18 trang ở 320–1920 px, không có lỗi JavaScript/local asset; axe WCAG 2/2.1 AA không có lỗi serious/critical trong trạng thái được kiểm tra |
| Lighthouse mobile lab | Home 0,60; Trường 0,62; Nghề 0,67; Hành trình 0,81 |
| `build`, `lint`, `typecheck` | BLOCKED: repository không định nghĩa các script này; `validate` chỉ kiểm tra cú pháp/liên kết, không thay thế typecheck |

Ảnh baseline và JSON audit ở `.cache/product-polish/before/`; bản sao Lighthouse JSON/HTML ở `.cache/master-audit/lighthouse-before/`. Các thư mục cache nội bộ không được đưa lên production. Phương án rollback mã nguồn là commit Git trước đợt này; chưa có lý do migration dữ liệu tuyển sinh.
