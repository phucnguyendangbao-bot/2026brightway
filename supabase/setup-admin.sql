-- ═══════════════════════════════════════════════════════
-- SETUP ADMIN MẶC ĐỊNH
-- Chạy 1 lần trong Supabase SQL Editor để tạo sẵn
-- các tài khoản giáo viên/admin với email + password
-- Bản bootstrap cũ đã được gỡ vì chứa mật khẩu mẫu và RPC thiếu kiểm tra quyền.
-- Với dự án hiện có, áp dụng migrations/002_secure_admin_access.sql.
-- Tạo admin đầu tiên trong Supabase Auth Dashboard rồi gán role bằng SQL Editor tin cậy.
-- ═══════════════════════════════════════════════════════

-- 1. Function tạo user có password + auto-confirm email
CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_input TEXT,
  password_input TEXT,
  full_name_input TEXT DEFAULT '',
  role_input TEXT DEFAULT 'student'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, auth
AS $$
DECLARE
  user_id UUID;
  display_name TEXT;
  hashed_pw TEXT;
  result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;
  IF email_input IS NULL OR email_input = '' THEN
    RAISE EXCEPTION 'Email không được để trống';
  END IF;
  IF password_input IS NULL OR length(password_input) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải ít nhất 6 ký tự';
  END IF;
  IF role_input NOT IN ('student', 'teacher', 'admin') THEN
    role_input := 'student';
  END IF;

  display_name := COALESCE(NULLIF(full_name_input, ''), split_part(email_input, '@', 1));
  hashed_pw := crypt(password_input, gen_salt('bf'));

  SELECT id INTO user_id FROM auth.users WHERE email = email_input;

  IF user_id IS NULL THEN
    user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id, 'authenticated', 'authenticated', email_input,
      hashed_pw, NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', display_name),
      NOW(), NOW(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users SET encrypted_password = hashed_pw, updated_at = NOW() WHERE id = user_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (user_id, display_name, role_input, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, updated_at = NOW();

  result := jsonb_build_object('user_id', user_id, 'email', email_input, 'full_name', display_name, 'role', role_input);
  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 2. Function reset password
CREATE OR REPLACE FUNCTION public.admin_set_password(user_id_input UUID, new_password_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, auth
AS $$
DECLARE
  hashed_pw TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;
  IF new_password_input IS NULL OR length(new_password_input) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải ít nhất 6 ký tự';
  END IF;
  hashed_pw := crypt(new_password_input, gen_salt('bf'));
  UPDATE auth.users SET encrypted_password = hashed_pw, updated_at = NOW() WHERE id = user_id_input;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy user'; END IF;
  RETURN jsonb_build_object('user_id', user_id_input, 'success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_password(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_password(UUID, TEXT) TO authenticated;

-- 3. Function list tất cả user (kể cả email từ auth.users)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id UUID, email TEXT, full_name TEXT, role TEXT, created_at TIMESTAMPTZ, last_sign_in_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::TEXT,
           COALESCE(p.full_name, '')::TEXT,
           COALESCE(p.role, 'student')::TEXT,
           u.created_at, u.last_sign_in_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 4. Trigger auto-create profile cho user mới (Google hoặc email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'student',  -- mặc định mọi user mới là student
    NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Không đưa email/mật khẩu mẫu vào file SQL. Sau khi có admin thật, màn hình
-- quản trị mới gọi các RPC trên với JWT của admin đã xác thực.
