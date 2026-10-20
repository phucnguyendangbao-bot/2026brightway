# Chọn trường và nguyện vọng — kiểm thử ngày 20/10/2026

## Phạm vi và hiện trạng

- `BWFlow` lưu `savedSchools`, `savedMajors`, `savedCareers`, bộ lọc và hành trình vào `bwJourneyV2`; đăng nhập là tùy chọn.
- Trang chủ còn bộ chọn trường cũ dùng `bw_schools_selected`, nhưng nút mở không còn tồn tại. Không tạo thêm bộ chọn trùng lặp.
- Danh sách trường dùng `schools.json` + định danh chuẩn; ngành theo năm dùng `school-profile-details.js`. Dữ liệu gốc giữ nguyên.
- Tra cứu đã có tìm tên/ngành không dấu, khu vực, hồ sơ trường và bảng so sánh 2–3 trường. Tái sử dụng các chức năng này.
- Trước thay đổi chưa có danh sách nguyện vọng gồm trường + chương trình + thứ tự + năm + nguồn; quản lý trường đã lưu chưa có tìm/lọc riêng.

## Kết quả triển khai

- Lưu/bỏ lưu trực tiếp trên thẻ trường, lọc chỉ trường yêu thích, tìm theo tên/ngành và khu vực trong phạm vi trường đã lưu.
- Khu vực `profile.html?tab=journey#my-choices` nằm đầu trang: tìm/lọc/bỏ lưu từng trường; truy cập so sánh hiện có; nguyện vọng dự kiến với thứ tự, mã khi có trong nguồn, năm dự kiến, năm dữ liệu và liên kết nguồn.
- Thêm chương trình từ hồ sơ trường, đổi ưu tiên bằng nút lên/xuống, xóa từng nguyện vọng, tải lại để khôi phục, xuất UTF-8 `.txt` kèm nguồn và năm.
- Chống trùng theo định danh trường chuẩn và theo trường/chương trình/mã/nhánh/cơ sở/năm nguyện vọng. Giữ chương trình khác nhau thành lựa chọn riêng.
- Nhập lựa chọn từ bộ chọn cũ khi mã khớp được với danh mục hiện tại; FPT/FPT2 gộp thành cùng trường. Lưu các mã đã nhập để không tự thêm lại sau khi người dùng bỏ lưu. Giữ nguyên bản gốc và mã chưa xác minh.
- Năm dự kiến 2027 sử dụng nguồn 2026 được ghi rõ là tham khảo, chưa xác nhận mở tuyển 2027. Không đặt giới hạn số nguyện vọng dựa trên quy định năm khác.
- Danh mục nguồn thứ cấp hoặc chưa xác nhận kỳ tuyển sinh không tạo nguyện vọng theo năm; vẫn xem và lưu ngành quan tâm được.
- Nối nghề sang ngành khi tên ngành xuất hiện trong lộ trình học vấn có nguồn và có trong danh mục trường chính thức theo năm; có đường quay lại đúng nghề/bộ lọc. Các nghề thiếu căn cứ không tự suy ra ngành.
- Trang chủ giữ ba lối bắt đầu, thêm truy cập nguyện vọng và gợi ý theo số trường/nguyện vọng đã lưu; bỏ khối lợi ích lặp lại.
- Navbar có liên kết nguyện vọng; Waybi có tên “Trợ lý hướng nghiệp”, liên kết công cụ và hướng dẫn về danh sách dự kiến. Prompt không cho phép tạo trường/mã ngành/thông tin tuyển sinh khi thiếu nguồn.
- Mobile: launcher Waybi ở trong luồng trang quản lý trường/nguyện vọng, không nổi đè nút sắp xếp/xóa; bảng so sánh giữ cuộn ngang trong khung.
- Lỗi tải danh mục có thử lại; lỗi tải module trường/ngành có thông báo và thử lại bằng tải trang. Lựa chọn đã lưu không bị xóa khi lỗi.

## Kiểm thử

| Lệnh | Kết quả |
|---|---|
| `npm test` | PASS 90/90, FAIL 0, gồm 9 test mới về lựa chọn/nguyện vọng/đối chiếu nghề |
| `npm run validate` | PASS: 20 trang, 393 liên kết/asset, 80 kiểm tra cú pháp |
| `npm run test:e2e` | PASS 17/17 kịch bản, FAIL 0 |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS; giữ nguyên CRLF của `waybi.html` |
| `npm run build` | Không chạy được: repository chưa khai báo script `build` |
| `npm run lint` | Không chạy được: repository chưa khai báo script `lint` |

Kịch bản Playwright mới dùng dữ liệu thật trong repository: nghề bác sĩ → ngành Y khoa → trường → quay lại nghề; lưu FPT/HCMUT; thêm ba ngành FPT; ngăn trùng khi tải lại và truy cập alias; lọc trường yêu thích; sắp xếp/xóa/khôi phục; xuất và đọc lại file tải xuống; bỏ lưu trường không xóa nguyện vọng; nguồn 2026/năm dự kiến 2027; lỗi HTTP 503 của danh mục và module ngành rồi thử lại; gợi ý trang chủ.

Kiểm tra luồng mới tại 360, 390, 768, 1366px. Suite hồi quy còn kiểm tra 320 và 1920px, Holland 42 câu, điều hướng/lưu trạng thái, tính điểm hiện có, nguồn dữ liệu, quảng bá/tài trợ, consent, trạng thái chậm/rỗng/lỗi và menu tài khoản.

Lỗi 503 và request module bị hủy trong kịch bản lỗi được chủ động tạo bằng Playwright, khớp đúng URL và trạng thái kỳ vọng; dữ liệu thành công luôn lấy từ repository, không dùng mock thay dữ liệu chính thức.

Ảnh và báo cáo máy: `.cache/ux-e2e/report.json`, `wishes-360.png`, `wishes-390.png`, `wishes-768.png`, `wishes-1366.png`, `choices-schools-390.png` và các ảnh hồi quy hiện có.

## File thay đổi

- `assets/js/selection-model.js` (mới): định danh, nhập dữ liệu cũ, chống trùng, thêm/di chuyển/xuất nguyện vọng.
- `assets/js/selections.js` (mới): danh sách cục bộ, tìm/lọc, thao tác nguyện vọng, tóm tắt trang chủ.
- `assets/js/career-pathways.js` (mới): đối chiếu nghề/ngành có nguồn.
- `assets/js/page2-loader.js` (mới): trạng thái lỗi khi module danh mục không tải.
- `assets/css/selections.css` (mới): giao diện/responsive quản lý lựa chọn.
- `assets/js/page2.js`, `page2.html`: lưu/lọc trường, thêm nguyện vọng, năm dự kiến, thử lại module, đường quay về nghề.
- `assets/js/careers.js`, `careers-holland.html`: đường ngành có căn cứ và giữ trạng thái quay lại.
- `assets/js/flow.js`: navigation, truy cập nguyện vọng, vị trí hồ sơ và reset dữ liệu so sánh.
- `index.html`, `profile.html`: điểm truy cập, khu quản lý lựa chọn, asset mới.
- `assets/js/waybi.js`, `assets/js/waybi-presence.js`, `waybi.html`, `api/waybi-prompt.js`: tên gọi/hướng dẫn và giới hạn thông tin theo nguồn.
- `tests/selection-model.test.mjs` (mới), `scripts/qa-ux-e2e.cjs`: unit và kiểm thử hành trình/responsive/hồi quy.
- Báo cáo này.

## Giới hạn còn lại

- Chưa có build/lint script; không ghi hai bước này là PASS.
- Waybi đã kiểm tra giao diện và tình huống API lỗi; chưa kiểm tra chất lượng câu trả lời của dịch vụ AI thật trong môi trường local.
- Dữ liệu tuyển sinh mới cho 2027 chưa được bổ sung; nghề thiếu lộ trình có nguồn chưa có liên kết ngành tự động.
- Các mã lựa chọn cũ không khớp danh mục hiện tại được giữ trong storage gốc, không tự gán trường.
- Không có lỗi tái hiện chưa xử lý trong các luồng đã kiểm thử. Kết quả không phải chứng nhận điểm UX 8.5–9/10.
- Chưa commit, push hoặc deploy. Không sửa file/công thức/dữ liệu của công cụ tính điểm.
