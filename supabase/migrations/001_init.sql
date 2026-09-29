-- ============================================
-- MIGRATION: Web hướng nghiệp trường THPT
-- Created: 2026-09-29
-- ============================================

-- Drop functions cũ nếu tồn tại (tránh conflict)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher_or_admin() CASCADE;
DROP FUNCTION IF EXISTS public.increment_post_views() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- 1. BẢNG PROFILES (extends auth.users)
-- DROP nếu đã tồn tại (để reset)
DROP TABLE IF EXISTS public.post_tags CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.majors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'teacher', 'admin')),
  school TEXT,
  subject TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. BẢNG POSTS (bài viết hướng nghiệp)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,                              -- markdown
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'chia_se'
    CHECK (category IN ('khoi_thpt', 'tu_van', 'su_kien', 'chia_se', 'nganh_hoc')),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho query thường gặp
CREATE INDEX IF NOT EXISTS idx_posts_status_published ON public.posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

-- 3. BẢNG MAJORS (danh mục ngành nghề)
CREATE TABLE public.majors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_vi TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL                       -- khoi_A, khoi_B, khoi_C, khoi_D
    CHECK (category IN ('khoi_A', 'khoi_B', 'khoi_C', 'khoi_D', 'khoi_khac')),
  description TEXT,                            -- mô tả ngắn
  job_prospects TEXT,                          -- cơ hội việc làm
  salary_range TEXT,                           -- mức lương (text)
  top_universities JSONB DEFAULT '[]',         -- top trường ĐH (json array)
  required_skills TEXT,                        -- kỹ năng cần có
  cover_image TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho danh mục ngành
CREATE INDEX IF NOT EXISTS idx_majors_category ON public.majors(category);
CREATE INDEX IF NOT EXISTS idx_majors_slug ON public.majors(slug);

-- 4. BẢNG TAGS
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_tags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Bật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
-- Ai cũng xem profile (public)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- User tự update profile mình
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger tạo profile khi đăng ký user mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger cũ nếu có
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tạo trigger mới
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== POSTS ==========
-- Public xem bài đã published
CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Admin/Teacher tạo bài
CREATE POLICY "Admins and teachers can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Admin hoặc tác giả sửa
CREATE POLICY "Authors and admins can update posts"
  ON public.posts FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin xoá
CREATE POLICY "Admins can delete posts"
  ON public.posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========== MAJORS ==========
-- Public xem tất cả majors
CREATE POLICY "Majors are viewable by everyone"
  ON public.majors FOR SELECT
  USING (true);

-- Chỉ admin mới tạo/sửa/xoá
CREATE POLICY "Admins can manage majors"
  ON public.majors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========== TAGS ==========
CREATE POLICY "Tags are viewable by everyone"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON public.tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage post_tags"
  ON public.post_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SAMPLE DATA (chạy 1 lần để test)
-- ============================================

-- 10 ngành nghề phổ biến theo khối
INSERT INTO public.majors (slug, name_vi, name_en, category, description, job_prospects, salary_range, top_universities) VALUES
('cntt', 'Công nghệ thông tin', 'Information Technology', 'khoi_A',
 'Ngành liên quan đến phát triển phần mềm, hệ thống máy tính và quản lý dữ liệu.',
 'Lập trình viên, kỹ sư phần mềm, chuyên gia AI, quản trị hệ thống, cybersecurity.',
 '15-80 triệu VNĐ/tháng',
 '["ĐH Bách Khoa Hà Nội", "ĐH CNTT - ĐHQG TP.HCM", "ĐH FPT", "ĐH Khoa học Tự nhiên - ĐHQG"]'::jsonb),

('kinh_te', 'Kinh tế', 'Economics', 'khoi_A',
 'Nghiên cứu các nguyên lý kinh tế, thị trường, tài chính và quản trị doanh nghiệp.',
 'Chuyên viên tài chính, phân tích kinh tế, quản lý dự án, tư vấn đầu tư.',
 '12-60 triệu VNĐ/tháng',
 '["ĐH Kinh tế Quốc dân", "ĐH Ngoại thương", "ĐH Kinh tế - Tài chính TP.HCM", "ĐH Harvard (Mỹ)"]'::jsonb),

('y_khoa', 'Y khoa', 'Medicine', 'khoi_B',
 'Đào tạo bác sĩ đa khoa, chuyên khoa và các chuyên ngành y tế.',
 'Bác sĩ, chuyên gia y tế, nghiên cứu sinh, giảng viên y khoa.',
 '20-100+ triệu VNĐ/tháng',
 '["ĐH Y Hà Nội", "ĐH Y Dược TP.HCM", "ĐH Y khoa Phạm Ngọc Thạch"]'::jsonb),

('su_pham', 'Sư phạm', 'Education', 'khoi_C',
 'Đào tạo giáo viên các cấp học, chuyên ngành sư phạm.',
 'Giáo viên, giảng viên đại học, chuyên viên giáo dục, tư vấn học tập.',
 '8-25 triệu VNĐ/tháng',
 '["ĐH Sư phạm Hà Nội", "ĐH Sư phạm TP.HCM", "ĐH Vinh"]'::jsonb),

('nhan_van', 'Ngữ văn', 'Literature', 'khoi_C',
 'Nghiên cứu văn học, ngôn ngữ và văn hoá Việt Nam.',
 'Giáo viên Ngữ văn, biên tập viên, nhà văn, chuyên viên truyền thông.',
 '8-30 triệu VNĐ/tháng',
 '["ĐH Sư phạm Hà Nội", "ĐH KHXH&NV - ĐHQG TP.HCM", "ĐH Văn hoá Hà Nội"]'::jsonb),

('kien_truc', 'Kiến trúc', 'Architecture', 'khoi_A',
 'Thiết kế công trình, không gian và cảnh quan đô thị.',
 'Kiến trúc sư, thiết kế nội thất, quy hoạch đô thị.',
 '15-70 triệu VNĐ/tháng',
 '["ĐH Kiến trúc Hà Nội", "ĐH Kiến trúc TP.HCM", "ĐH Xây dựng"]'::jsonb),

('luat', 'Luật', 'Law', 'khoi_C',
 'Đào tạo luật sư, chuyên viên pháp lý, thẩm phán, công chứng viên.',
 'Luật sư, thẩm phán, chuyên viên pháp lý doanh nghiệp, công chứng viên.',
 '12-80 triệu VNĐ/tháng',
 '["ĐH Luật Hà Nội", "ĐH Luật TP.HCM", "ĐH Kinh tế - Luật - ĐHQG TP.HCM"]'::jsonb),

('ky_thuat', 'Kỹ thuật', 'Engineering', 'khoi_A',
 'Các ngành kỹ thuật: điện, cơ khí, xây dựng, công nghiệp.',
 'Kỹ sư thiết kế, vận hành nhà máy, quản lý dự án kỹ thuật.',
 '12-60 triệu VNĐ/tháng',
 '["ĐH Bách Khoa Hà Nội", "ĐH Bách Khoa - ĐHQG TP.HCM", "ĐH Xây dựng"]'::jsonb),

('truyen_thong', 'Truyền thông', 'Communications', 'khoi_C',
 'Báo chí, marketing, quan hệ công chúng, truyền thông đa phương tiện.',
 'Phóng viên, biên tập viên, chuyên viên marketing, PR, content creator.',
 '10-50 triệu VNĐ/tháng',
 '["ĐH KHXH&NV", "HV Báo chí & Tuyên truyền", "ĐH FPT"]'::jsonb),

('du_lich', 'Du lịch - Khách sạn', 'Tourism & Hospitality', 'khoi_D',
 'Quản lý khách sạn, hướng dẫn viên du lịch, sự kiện, dịch vụ lữ hành.',
 'Quản lý khách sạn, hướng dẫn viên, chuyên viên sự kiện, đầu bếp.',
 '8-40 triệu VNĐ/tháng',
 '["ĐH Hutech", "ĐH Văn Lang", "ĐH Khoa học Xã hội & Nhân văn"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Helper function: check admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Trigger tăng views_count
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_post_views()
RETURNS TRIGGER AS $$
BEGIN
  NEW.views_count := OLD.views_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_majors_updated_at ON public.majors;
CREATE TRIGGER trg_majors_updated_at
  BEFORE UPDATE ON public.majors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
