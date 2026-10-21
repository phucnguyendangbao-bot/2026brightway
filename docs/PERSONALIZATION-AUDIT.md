# BrightWay — cá nhân hóa hành trình (2026-10-21)

## Hiện trạng trước khi mở rộng

| Thành phần | Cơ chế đã có, tiếp tục tái sử dụng |
| --- | --- |
| Hồ sơ trên thiết bị | `BWFlow`, khóa `bwJourneyV2`, chuyển tiếp từ `bwJourneyV1`; bộ nhớ tạm khi localStorage bị chặn |
| Holland | `studentHollandV1`, `studentHollandImportedV1`, bộ đếm riêng; chỉ đọc kết quả đủ 42 câu hoặc mã nhập hợp lệ |
| Nghề / ngành | `savedCareers`, `savedMajors`, nghề vừa xem và bộ lọc trong cùng hành trình; dữ liệu `jobs.json` |
| Trường | `savedSchools`, chuẩn hóa định danh và cơ sở bằng `selection-model.js` / `university-identities.js` |
| Nguyện vọng | `wishes`, mã ngành, phân loại, cơ sở, năm dự kiến, năm và URL nguồn; sắp xếp / xuất đã có |
| Việc cần làm | `tasks`, trạng thái hoàn thành; không tạo danh sách song song |
| Nguồn đào tạo | `detailsForSchool`, danh sách ngành 2026; `relatedMajorNames` yêu cầu nguồn học vấn và tên ngành khớp danh mục |
| Waybi | Chat trang chủ và widget dùng chung cùng `/api/chat`; trước đợt này chưa gửi hồ sơ cục bộ |

Không thay đổi cơ sở dữ liệu tuyển sinh, công thức, API, secret hoặc cấu hình production.

## Phần triển khai

1. Thêm `personalization` phiên bản 1 vào cùng `bwJourneyV2`: bật/tắt, lớp/năm, nhóm nghề, khu vực, ngân sách theo năm, môn tự nhận xét, lựa chọn chia sẻ và thống kê. Tất cả thông tin có thể bỏ qua. Schema lạ bị tắt gợi ý/chia sẻ và có thông báo; dữ liệu nguồn được giữ cho đến khi người dùng chủ động sửa.
2. Editor tùy chọn trong Hành trình, xuất JSON không kèm tài khoản/lịch sử chat, xóa riêng cá nhân hóa, và tiếp tục dùng nút xóa toàn bộ hành trình có xác nhận. Trạng thái bị chặn lưu không báo thành công giả.
3. Bộ gợi ý dùng sở thích Holland, nhóm nghề, nghề/ngành/trường đã lưu, đối chiếu ngành có nguồn và địa điểm. Điều kiện bắt buộc khác sở thích mềm. Trường chưa đủ dữ liệu và trường ngoài điều kiện được giữ trong hai nhóm riêng; tất cả vẫn truy cập được ở thư viện.
4. Mỗi gợi ý nêu lý do và thông tin cần xác minh. Xếp theo số lý do có bằng chứng rồi theo tên, không công bố phần trăm, năng lực hoặc khả năng trúng tuyển. Không có đầu vào tài trợ hoặc điểm chuẩn trong thứ tự gợi ý.
5. Dashboard gọn trên trang chủ chỉ khi bật cá nhân hóa; thay khối tiếp tục hành trình thông thường để tránh lặp. Người mới vẫn có ba lối bắt đầu và trang giới thiệu chung. Bản đầy đủ trong Hành trình hiển thị tiến độ, số lựa chọn, việc chưa làm, nghề và trường để khám phá.
6. Nhắc nguồn/năm, dữ liệu trùng, xung đột năm với hồ sơ và thông tin ngân sách trong danh sách nguyện vọng. Không tự đổi thứ tự.
7. Checkbox chia sẻ Waybi mặc định tắt, có ở hồ sơ và cả hai widget. Chỉ tạo context theo câu hỏi hiện tại, giới hạn danh mục trường/nghề thực và ngành có nguồn; không gửi điểm, tên, số điện thoại, task hoặc toàn bộ hồ sơ. Tắt chia sẻ làm mới hội thoại cục bộ và bỏ qua phản hồi đang chờ của hội thoại cũ. Không thu hồi được dữ liệu đã gửi trước khi tắt.
8. Bộ đếm thử nghiệm tùy chọn chỉ lưu số thao tác/mốc trong cùng hành trình, không lưu truy vấn, định danh hoặc gửi ra dịch vụ. Tắt sẽ xóa bộ đếm; tôn trọng DNT/GPC. Đây là số đếm trên một thiết bị, chưa phải tỷ lệ chuyển đổi người dùng toàn hệ thống.

## Giới hạn dữ liệu và cách diễn giải

- Hiện không có học phí theo năm dạng số có nguồn trong `detailsForSchool`. Không phân tích các ước lượng học phí tự do trong `schools.json`. Ngân sách do đó hiển thị “chưa đủ dữ liệu”; khi là điều kiện bắt buộc, trường nằm trong nhóm cần xác minh chứ không được xác nhận đạt ngân sách.
- Nhánh so sánh học phí hỗ trợ nguồn HTTPS, năm tương ứng và khoảng `annualMinVnd` / `annualMaxVnd` theo VND/năm. Chỉ dùng khi nguồn đã được nhập, đối chiếu và đáp ứng schema này; không có dữ liệu giả đưa vào production. Các trường hợp có số trong unit tests là fixture kiểm thử.
- Nhiều trường có nhiều cơ sở. Chọn địa phương bắt buộc không chứng minh ngành có mở tại đúng cơ sở; trường đó được đánh dấu cần xác minh.
- Dữ liệu ngành có nguồn hiện tại là 2026; hồ sơ dự kiến 2027+ không biến các nguồn này thành quy định tương lai.
- Môn học thế mạnh là tự nhận xét, không tự suy ra năng lực hoặc tính điều kiện tuyển sinh.
- Chưa có người dùng thực hay hệ thống tổng hợp funnel. Chưa thể công bố tỷ lệ bắt đầu, hoàn thành, lưu trường hoặc hoàn thiện nguyện vọng cho toàn nền tảng. Bộ đếm và số bước trong kịch bản QA không thay thế nghiên cứu người dùng.
- Việc xóa cục bộ không xóa dữ liệu của tài khoản đã đồng bộ từ trước hoặc dữ liệu đã chủ động gửi đến nhà cung cấp AI. Không tự gửi phần hồ sơ cá nhân hóa mới vào đồng bộ tài khoản.

## Kiểm thử

Các tệp thay đổi:

- `assets/js/flow.js`: tái sử dụng kho lưu và khởi tạo cá nhân hóa; thông báo cập nhật Holland; xóa cả hội thoại cục bộ khi xóa hành trình.
- `assets/js/personalization-model.js`: schema, giải thích gợi ý, phân loại điều kiện và nhắc nguyện vọng.
- `assets/js/personalization-context.js`: context tối thiểu theo câu hỏi và lựa chọn chia sẻ.
- `assets/js/personalization.js`, `assets/css/personalization.css`: hồ sơ, dashboard, điều khiển quyền riêng tư, retry và bộ đếm local.
- `assets/js/waybi.js`, `index.html`: nối context có đồng ý, làm mới hội thoại và bỏ phản hồi cũ khi tắt.
- `scripts/qa-personalization.cjs`, `tests/personalization.test.mjs`, `package.json`: unit / E2E và lệnh kiểm thử mới.
- `scripts/qa-quality.cjs`: định vị textbox theo vai trò/tên để không nhầm checkbox chia sẻ mới với ô nhập câu hỏi.
- `docs/PERSONALIZATION-AUDIT.md`: audit và giới hạn nghiệm thu.

Kết quả kiểm thử: 100/100 unit tests; 11/11 kịch bản Playwright cá nhân hóa; 8/8 kịch bản Playwright hồi quy. Validate PASS cho 20 trang, 393 liên kết/tài nguyên và 84 kiểm tra cú pháp. Diff check theo CRLF PASS. Màn hình 360/390/768/1366px không tràn ngang trong kịch bản cá nhân hóa; bộ hồi quy kiểm tra thêm 1920px.

- `npm test`: unit tests hiện có và mới cho schema, ngân sách/năm, khu vực bắt buộc/mềm, trường thiếu dữ liệu, thứ tự độc lập tài trợ, nguyện vọng và tối thiểu hóa context.
- `npm run validate`: liên kết, tài nguyên local và cú pháp JavaScript.
- `npm run test:e2e:personalization`: thao tác Playwright trên dữ liệu thực trong repository: người mới/bỏ qua; hồ sơ một phần/reload/export; làm đủ 42 câu Holland; khu vực/ngân sách/nhập sai; lưu trường/nguyện vọng/đổi thứ tự; chia sẻ Waybi ở hai widget; lỗi/empty/retry; schema lỗi và storage bị chặn; xóa/tắt/thống kê; 360/390/768/1366px.
- Báo cáo chạy gần nhất: `.cache/personalization-qa/report.json`. Ảnh nằm cùng thư mục. Các ảnh `*-failure.png` từ vòng sửa trước không phải trạng thái cuối; xem report gần nhất.
- Giao tiếp Waybi được kiểm thử bằng chặn `/api/chat` và kiểm tra payload; không gọi mô hình bên ngoài, không xác nhận chất lượng trả lời AI live.
- `npm run test:e2e:quality`: hồi quy các chức năng so sánh, nguyện vọng, retry Waybi, tải module, responsive và accessibility đã có.
- Repository chưa khai báo `build` hoặc `lint`; không báo hai bước này là PASS. Không tự thêm một build giả cho dự án HTML/JS tĩnh.

Chưa deploy production. Không gán điểm chất lượng 9/10 khi chưa có đánh giá từ người dùng thực.
