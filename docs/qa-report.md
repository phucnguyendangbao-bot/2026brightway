# BrightWay Careers — QA report

Ngày: 2026-10-23. Môi trường: Windows, Node 24, Playwright với Microsoft Edge headless, server HTTP local và dữ liệu repository. Bộ test browser dùng context riêng và không gọi mô hình Waybi thật.

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| `npm run validate` | PASS | 28 trang được validate, 541 liên kết/asset, 97 syntax checks, 0 issue tại lần chạy đầu đợt này |
| `npm test` | PASS | 116/116 unit tests; có boundary điểm, Countdown, CMS timeout/retry, schema dữ liệu |
| `npm run audit:product` | PASS | 18/18 route công khai; 8 viewport từ 320–1920 và landscape 768×432, shell, keyboard, asset, axe |
| `npm run test:e2e:personalization` | PASS | 11/11 sau sửa chồng lớp; lưu/F5/xuất JSON/Holland, lỗi mạng, dữ liệu hỏng, Waybi |
| `npm run test:e2e:countdown` | PASS | 8/8; tạo/sửa/xóa, lưu sau tải lại, empty và lịch Việt Nam |
| `npm run test:e2e:admissions` | PASS | 10/10, gồm 34 ca tổ hợp, input lỗi, nguồn 503 và phục hồi |
| `npm run test:e2e:content` | PASS | 6/6, gồm retry sau khi SDK lỗi và tải dữ liệu CMS thật |

Kịch bản CMS ban đầu FAIL vì cold load SDK cộng với truy vấn danh sách ngành vượt timeout 10 giây. `majors.html` nay dùng timeout hữu hạn 20 giây; chạy lại 6/6 PASS với dữ liệu CMS thật. Không dùng dữ liệu giả để coi như pass.

Lighthouse 13.5.0, Edge headless, mobile simulated throttling, một lần đo/server local mỗi trang:

| Route | Performance | Accessibility | Best Practices | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| `index.html` | 49 | 100 | 100 | 11.27 s | 0.014 |
| `page2.html` | 53 | 100 | 100 | 6.31 s | 0 |
| `careers-holland.html` | 76 | 100 | 100 | 4.59 s | 0 |
| `profile.html?tab=journey` | 77 | 100 | 100 | 4.11 s | 0 |

LCP cả bốn route đều FAIL mục tiêu tham khảo ≤2.5 s. Benchmark máy trong phép đo biến động lớn (526–3860), nên cần đo lại trong điều kiện cố định và trên production trước khi quy nguyên nhân. CLS trong lần đo đạt ≤0.1. TBT không thay cho INP; chưa có INP người dùng thực. Chi tiết gốc tại `.cache/quality-2026-10-21/lighthouse/summary.json`.

Ảnh browser: `.cache/product-polish/after/`, `.cache/personalization-qa/`, `.cache/countdown-qa/`, `.cache/admissions-regression/`. Đối chiếu với `.cache/product-polish/before/` trong cùng máy. Ảnh admin và kiểm thử tài khoản thật còn BLOCKED vì thiếu tài khoản staging.

Checklist thao tác đã có bằng chứng: điều hướng mobile/Escape; Holland 42 câu; nghề và trường; lưu trường/nguyện vọng và reload; Countdown; bốn phương thức tính điểm; dữ liệu sai; retry dữ liệu; Waybi qua request interception; localStorage hỏng. Chưa có bằng chứng đầy đủ cho mọi trạng thái hover/tooltip/toast trên mọi route, hoặc INP thực tế.
