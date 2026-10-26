# BrightWay Careers — Product audit 2.0

Ngày kiểm tra: 2026-10-23. Mã nguồn: repository local sau commit `2e3ff36`, trước phát hành đợt này. Dữ liệu kiểm thử được tạo trong browser context riêng; không xóa dữ liệu người dùng.

## Kiểm kê

Repository có 29 file HTML (gồm fragment `_home_content.html` và `assets/js/admin-quick-include.html`), 26 CSS và 120 file JS/CJS/MJS; cấu trúc liên kết và cú pháp được `npm run validate` kiểm tra. Dữ liệu chính gồm catalog nghề/trường, nguồn tuyển sinh và trạng thái hành trình lưu cục bộ. Các trang có dữ liệu CMS hoặc tài khoản phụ thuộc dịch vụ bên ngoài.

| Nhóm route | Trạng thái | Phạm vi kiểm tra |
| --- | --- | --- |
| `index.html`, `careers-holland.html`, `holland.html`, `page2.html`, `score-calculator.html` | PASS | Browser audit, responsive, header/footer, asset, bàn phím, axe; các luồng nghề/trường/điểm trong suite chức năng |
| `profile.html?tab=journey`, `profile.html?tab=account` | PASS | Browser audit; cá nhân hóa 11 kịch bản, Countdown 8 kịch bản |
| `calendar.html`, `resources.html`, `news.html`, `news-detail.html`, `majors.html`, `major-detail.html` | PASS trong browser audit | Shell, responsive, JS, asset, keyboard, accessibility; CMS retry 6/6 PASS sau sửa timeout |
| `scholarship-roadmap.html`, `essay-review.html`, `interview-prep.html`, `login.html`, `waybi.html` | PASS trong browser audit | Shell, responsive, JS, asset, keyboard, accessibility |
| `careers.html`, fragment `_home_content.html` | Kiểm kê/validate | `careers.html` chuyển sang `careers-holland.html` và giữ query/hash; fragment không phải trang độc lập. Chưa có kịch bản visual riêng. |
| `admin.html`, `admin/index.html`, `admin/users.html`, `admin/resources.html`, `admin/resource-edit.html`, `admin/posts.html`, `admin/post-edit.html`, `admin/majors.html`, `admin/major-edit.html` | BLOCKED cho E2E quản trị | Không có tài khoản quản trị kiểm thử; không ghi CMS thật. Local links/syntax vẫn được validate. |

## Lỗi đã xác minh

| Ưu tiên | Tái hiện | Ảnh hưởng | Trạng thái |
| --- | --- | --- | --- |
| P1 | Mở `profile.html?tab=journey`, bật và lưu cá nhân hóa, sau đó click “Lưu hồ sơ”, “Xuất hồ sơ” hoặc mục quyền riêng tư. Khối `#personalDashboard` nằm cùng grid cell với form và chặn click. | Không chỉnh/xuất hồ sơ ổn định khi có gợi ý cá nhân. | FIXED: định vị `#personal-profile` và `#personalDashboard` vào hàng riêng; 11/11 kịch bản cá nhân hóa PASS. |
| P2 | Mở `page2.html?mode=school`; axe báo `color-contrast` tại `.university-transparency > summary` (4.2:1, yêu cầu 4.5:1 với text nhỏ). | Người đọc khó thấy disclosure. | FIXED: màu chữ đậm hơn và touch target 44px; browser audit sau sửa PASS. |
| P2 | Test export tạo promise chờ download rồi click riêng; khi click bị chặn, promise từ chối ngoài handler và chấm dứt suite trước khi có báo cáo đầy đủ. | Giấu nguyên nhân thật của lỗi giao diện. | FIXED: chờ download và click bằng `Promise.all`; anchor được gắn tạm vào DOM để lệnh tải ổn định. |
| P2 | `npm run test:e2e:content`, kịch bản `sdk-failure-retry-majors`: sau giả lập lỗi SDK, cold load cộng truy vấn CMS vượt timeout 10 giây. | Thử lại không khôi phục dù SDK đã tải thành công. | FIXED: timeout hữu hạn 20 giây ở danh sách ngành; 6/6 kịch bản PASS với CMS thật. |

Không phát hiện P0 trong các luồng đã chạy. Không suy rộng kết quả này tới admin, tài khoản cloud thật hoặc mọi tổ hợp thiết bị.

## Ảnh và giới hạn

Ảnh trước có trong `.cache/product-polish/before/`, ảnh sau trong `.cache/product-polish/after/`; tên file gồm route và viewport 390/1366. Đây là artifact local, không commit. Ảnh trước thuộc audit trước đó nên chỉ dùng làm mốc thị giác, không coi là phép đo pixel cùng phiên bản. Browser audit chụp các trang công khai ở 390 và 1366; các kích thước khác được kiểm tra overflow. Kiểm tra thủ công đã xem trang trường và Journey sau redesign.

Các đề xuất tiếp theo: chạy tài khoản admin thử nghiệm trên staging, theo dõi độ trễ CMS production, rà nội dung lặp ở trang chủ qua phỏng vấn người dùng trước khi cắt nội dung.
