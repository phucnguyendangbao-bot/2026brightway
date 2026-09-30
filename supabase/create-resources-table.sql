-- ════════════════════════════════════════════════════════
-- BẢNG RESOURCES — Tài liệu tham khảo & Khóa học
-- Chạy trong Supabase Dashboard > SQL Editor > New query
-- ════════════════════════════════════════════════════════

-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.resources (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Khóa học',  -- Khóa học / Tài liệu / Video / Công cụ / Tổ chức
  provider    TEXT,
  image       TEXT,
  description TEXT,
  url         TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  is_free     BOOLEAN DEFAULT true,
  level       TEXT DEFAULT 'Mọi cấp độ',
  is_published BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id)
);

-- 2. Index cho search
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_published ON public.resources(is_published);

-- 3. Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Mọi người đọc được các bản published
DROP POLICY IF EXISTS "Public read published resources" ON public.resources;
CREATE POLICY "Public read published resources"
  ON public.resources FOR SELECT
  USING (is_published = true);

-- Admin/teacher được CRUD
DROP POLICY IF EXISTS "Admin/teacher manage resources" ON public.resources;
CREATE POLICY "Admin/teacher manage resources"
  ON public.resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'teacher')
    )
  );

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resources_updated ON public.resources;
CREATE TRIGGER trg_resources_updated
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Seed data (10 tài liệu mẫu ban đầu)
-- Lưu ý: is_free dùng TRUE/FALSE (boolean), KHÔNG dùng 1/0
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

('Trí tuệ nhân tạo & ML — FPT AI', 'Khóa học', 'FPT Software',
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
 'Tài liệu & workshop miễn phí về tài chính, ngân hàng số từ MB Bank.',
 'https://www.mbbank.com.vn/',
 ARRAY['Tài chính','Ngân hàng','Miễn phí'], TRUE, 'Mọi cấp độ', 5),

('Y khoa & Sức khoẻ — Khan Academy', 'Video', 'Khan Academy',
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

('Bộ Giáo dục & Đào tạo', 'Tổ chức', 'Bộ GD&ĐT',
 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=240&fit=crop&q=80',
 'Cổng thông tin Bộ GD&ĐT — quy chế tuyển sinh, tài liệu hướng nghiệp.',
 'https://moet.gov.vn/',
 ARRAY['Giáo dục','Tuyển sinh','Việt Nam'], TRUE, 'Mọi cấp độ', 9),

('Kênh YouTube Giáo dục VN', 'Video', 'YouTube',
 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=240&fit=crop&q=80',
 'Tổng hợp các kênh YouTube giáo dục uy tín – Thầy Vũ, Thầy Hiếu, 2K...',
 'https://www.youtube.com/results?search_query=luy%E1%BB%87n+thi+THPT+2026',
 ARRAY['Video','Tiếng Việt','Miễn phí'], TRUE, 'Mọi cấp độ', 10);

-- ════════════════════════════════════════════════════════
-- Xong! Refresh bảng resources trong Supabase.
-- ════════════════════════════════════════════════════════
