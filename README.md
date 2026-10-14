# BrightWay Career

Website hướng nghiệp và tuyển sinh dành cho học sinh THPT.

- Trang chủ: `index.html`
- Khám phá nghề: `careers-holland.html`
- Trắc nghiệm: `holland.html`
- Tra cứu trường và điểm: `page2.html`, `score-calculator.html`
- Lịch và lộ trình: `calendar.html`, `scholarship-roadmap.html`
- Tài liệu và nguồn tuyển sinh: `resources.html`
- Waybi: `/api/chat`, cấu hình `ANTHROPIC_API_KEY` trên server Vercel.

Dữ liệu tuyển sinh được lưu theo năm, nguồn và trạng thái xác minh trong `assets/data/`. Nội dung chi tiết của trường cần đối chiếu đúng đề án và phụ lục. Các công thức đã kiểm định được kiểm tra bằng `node --test tests/*.test.mjs`.

Không lưu API key vào HTML, JavaScript frontend hoặc Git. Push nhánh `main` để Vercel triển khai dự án đã liên kết.
