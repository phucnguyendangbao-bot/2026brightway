# BrightWay Careers — Design consistency

Giữ hệ BrightWay lavender, nền sáng, card mềm và header/footer dùng chung. Trang nghề, trường, tính điểm và Journey giữ bố cục riêng phù hợp nhiệm vụ. Audit đối chiếu typography, spacing, card, form và CTA qua ảnh 390/1366 trong `.cache/product-polish/after/`; mốc cũ tại `.cache/product-polish/before/`.

Đợt này sửa hai điểm cụ thể: disclosure “Giới thiệu trường, tài trợ & quyền riêng tư” có tương phản 4.2:1 được đổi sang màu đậm hơn, vùng chạm 44px; dashboard cá nhân hóa được tách khỏi form trong grid để các nút không bị che. Thay đổi được giới hạn trong CSS của hai khối và hành vi xuất hồ sơ.

Chuẩn tiếp tục áp dụng: text phụ đủ tương phản, mọi input có label, focus hiển thị, nút thao tác ít nhất 44px nếu có thể, card không lồng thêm chỉ để trang trí. Browser audit kiểm tra overflow và menu; axe kiểm tra một phần WCAG A/AA. Audit tự động không thay kiểm tra người dùng màn hình đọc và bàn phím trên CMS/auth thật.

Chưa chuẩn hóa toàn bộ token legacy: CSS các trang công cụ vẫn có nhiều giá trị border/radius riêng; gom token chỉ nên thực hiện sau visual regression route đầy đủ. Không đổi công thức tuyển sinh hay nguồn dữ liệu để phục vụ thiết kế.
