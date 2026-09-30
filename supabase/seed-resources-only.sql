-- ════════════════════════════════════════════════════════
-- QUICK FIX — Chạy nếu bảng đã tồn tại nhưng chưa có data
-- Chỉ cần chạy phần INSERT thôi
-- ════════════════════════════════════════════════════════

INSERT INTO public.resources (title, category, provider, image, description, url, tags, is_free, level, display_order) VALUES
('CS50 — Khoa học Máy tính từ Harvard', 'Khóa học', 'Coursera (Harvard)',
 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=240&fit=crop&q=80',
 'Khoá học nhập môn CNTT nổi tiếng nhất thế giới. Miễn phí, có chứng chỉ.',
 'https://www.coursera.org/learn/cs50-introduction-computer-science',
 ARRAY['CNTT','Lập trình','Miễn phí'], TRUE, 'Cơ bản', 1),

('Lập trình IoT cơ bản — FUNiX', 'Khóa học', 'FUNiX (FPT)',
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop&q=80',
 'Khoá học IoT online của FPT, mentor hướng dẫn 1-1, cấp chứng chỉ.',
 'https://funix.edu.vn/',
 ARRAY['CNTT','IoT','Tiếng Việt'], FALSE, 'Cơ bản', 2),

('Trí tuệ nhân tạo và AI — FPT AI', 'Khóa học', 'FPT Software',
 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=240&fit=crop&q=80',
 'Chương trình đào tạo AI/ML thực chiến tại FPT. Học qua dự án.',
 'https://fpt.ai/',
 ARRAY['AI','CNTT','Thực chiến'], FALSE, 'Nâng cao', 3),

('Tài chính cho mọi người — Wharton', 'Khóa học', 'Coursera (Wharton)',
 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=240&fit=crop&q=80',
 'Hiểu nền tảng tài chính, đầu tư, quản lý rủi ro từ trường kinh doanh hàng đầu Mỹ.',
 'https://www.coursera.org/specializations/wharton-business-foundations',
 ARRAY['Kinh tế','Tài chính','Quốc tế'], TRUE, 'Cơ bản', 4),

('MB Bank Academy', 'Tổ chức', 'MB Bank',
 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=240&fit=crop&q=80',
 'Tài liệu và workshop miễn phí về tài chính, ngân hàng số từ MB Bank.',
 'https://www.mbbank.com.vn/',
 ARRAY['Tài chính','Ngân hàng','Miễn phí'], TRUE, 'Mọi cấp độ', 5),

('Y khoa và Sức khoẻ — Khan Academy', 'Video', 'Khan Academy',
 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=240&fit=crop&q=80',
 'Video bài giảng Y khoa miễn phí, minh hoạ sinh động.',
 'https://www.khanacademy.org/science/health-and-medicine',
 ARRAY['Y khoa','Tiếng Anh','Miễn phí'], TRUE, 'Cơ bản', 6),

('WHO — Tổ chức Y tế Thế giới', 'Tổ chức', 'WHO',
 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=240&fit=crop&q=80',
 'Nguồn thông tin y tế, sức khoẻ uy tín nhất thế giới.',
 'https://www.who.int/',
 ARRAY['Y khoa','Sức khoẻ','Quốc tế'], TRUE, 'Mọi cấp độ', 7),

('Bộ Y tế Việt Nam', 'Tổ chức', 'Bộ Y tế VN',
 'https://images.unsplash.com/photo-1584467735867-4297ae2ebcdc?w=400&h=240&fit=crop&q=80',
 'Cổng thông tin Bộ Y tế VN — chính sách, tài liệu chính thống.',
 'https://moh.gov.vn/',
 ARRAY['Y tế','Việt Nam','Chính thống'], TRUE, 'Mọi cấp độ', 8),

('Bộ Giáo dục và Đào tạo', 'Tổ chức', 'Bộ GD&ĐT',
 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=240&fit=crop&q=80',
 'Cổng thông tin Bộ GD&ĐT — quy chế tuyển sinh, tài liệu hướng nghiệp.',
 'https://moet.gov.vn/',
 ARRAY['Giáo dục','Tuyển sinh','Việt Nam'], TRUE, 'Mọi cấp độ', 9),

('Kênh YouTube Giáo dục VN', 'Video', 'YouTube',
 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=240&fit=crop&q=80',
 'Tổng hợp các kênh YouTube giáo dục uy tín — Thầy Vũ, Thầy Hiếu, 2K...',
 'https://www.youtube.com/results?search_query=luy%E1%BB%87n+thi+THPT+2026',
 ARRAY['Video','Tiếng Việt','Miễn phí'], TRUE, 'Mọi cấp độ', 10)
ON CONFLICT DO NOTHING;
-- Nếu muốn chạy lại sạch sẽ, dùng câu này thay:
-- TRUNCATE public.resources RESTART IDENTITY;
-- rồi chạy lại INSERT ở trên.

-- ════════════════════════════════════════════════════════
-- Xong!
-- ════════════════════════════════════════════════════════