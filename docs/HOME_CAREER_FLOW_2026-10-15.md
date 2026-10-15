# Điều chỉnh trang chủ và tách trang tra cứu nghề

- Slogan chính: “Đi để lối thành đường của bạn”.
- CTA chính: “Tra cứu nghề”, mở danh sách nghề với bộ lọc tất cả; CTA trường đi đúng trang trường.
- Waybi: có nút hỏi ngay trong Hero và banner ngay sau Hero (sau khối tiếp tục hành trình nếu đã có dữ liệu). Không nhân đôi banner.
- Trả khung Holland ở trang chủ: 6 nhóm R/I/A/S/E/C dẫn tới bộ lọc nghề tương ứng, bài test dẫn tới `holland.html`.
- “Tôi đã làm test Holland rồi” mở ô nhập mã ngay trên trang chủ. Kiểm tra 1–3 chữ RIASEC không trùng, lưu cùng khóa với trang Holland và điều hướng theo mã. Nếu tắt JavaScript, liên kết vẫn mở trang nhập kết quả Holland riêng.
- Trang `careers-holland.html` chỉ còn tra cứu nghề/bộ lọc; không còn tab test, panel test hoặc script mini-test. Giữ URL cũ để không làm hỏng liên kết đang dùng.
- Giữ nguyên bài Holland 42 câu, dữ liệu tính điểm, dữ liệu tuyển sinh và học bổng.
- Bỏ thứ tự CSS cũ để thứ tự nhìn thấy và thứ tự bàn phím thống nhất với DOM: Hero → tiếp tục hành trình (nếu có) → Waybi → chọn Holland → tin tuyển sinh → quy trình chính.

Kiểm thử đơn vị: `node --test`, 21/21 đạt. Bộ kiểm thử trình duyệt đạt 30/30 kịch bản, có bổ sung mở/đóng Waybi, mã sai/đúng, nhóm Holland, lựa chọn đã lưu và sự vắng mặt của tab quiz ở trang nghề, tại 1440/768/390 px. Không ghi nhận lỗi JavaScript hoặc tràn ngang; đã xem ảnh chụp trang chủ desktop.

Trạng thái: thay đổi local, chưa push hoặc triển khai production. Quyền push/deploy đang chờ xác nhận từ lượt trước; yêu cầu điều chỉnh giao diện này không tự mở rộng thành quyền triển khai.
