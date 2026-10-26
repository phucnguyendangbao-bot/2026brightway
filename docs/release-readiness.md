# BrightWay Careers — Release readiness

Trạng thái: **GO có điều kiện** cho đợt Product Refinement 2.0. Người dùng đã yêu cầu deploy rõ ràng trong lượt tiếp theo. Các gate chức năng và hồi quy đã PASS; cần xác minh production sau khi push. Không coi đây là chứng nhận hiệu năng 9.5/10.

Gate đã PASS: validate 28 trang, 116 unit tests, 18 route public browser audit tại 320–1920px và landscape, 11 cá nhân hóa, 8 Countdown, 10 tuyển sinh, 6 kịch bản CMS. Không sửa công thức tuyển sinh, schema lưu trữ hay dữ liệu tuyển sinh. File sửa: `assets/css/profile-redesign.css`, `assets/css/university-promotions.css`, `assets/js/personalization.js`, `majors.html`, `scripts/qa-personalization.cjs`, `scripts/qa-product-polish.cjs`, `scripts/qa-content-states.cjs` và bốn báo cáo này.

Giới hạn nghiệm thu: admin E2E thiếu tài khoản staging; không có script `build` hoặc `lint` trong `package.json` (website tĩnh, `validate` là gate cú pháp/link/asset). Kiểm tra production sau triển khai là bước bắt buộc của lần deploy này.

Lighthouse là đo lab local, không phải Core Web Vitals người dùng thật. Bốn trang chính đạt Accessibility và Best Practices 100 trong lần đo; Performance 49–77, LCP 4.11–11.27 s (FAIL mục tiêu 2.5 s), CLS 0–0.014. Benchmark máy biến động lớn; cần đo lại trong điều kiện kiểm soát. INP chỉ có thể kết luận khi có dữ liệu tương tác thật. Chưa tuyên bố đạt 9.5/10 hoặc đạt tất cả mục tiêu hiệu năng.

Rủi ro còn mở: LCP lab chưa đạt mục tiêu; trải nghiệm admin và cloud sync chưa được kiểm thử bằng tài khoản staging. Retry `majors.html` đã qua sau khi tăng timeout hữu hạn từ 10 lên 20 giây cho cold load SDK và dữ liệu thật. Cần đo production và bổ sung test staging có quyền tối thiểu.
