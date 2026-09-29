-- ═══════════════════════════════════════════════════════
-- ADMIN FUNCTIONS — Tạo tài khoản có password (không OTP)
-- Chạy SQL này trong Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Function: tạo user mới với password
CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_input TEXT,
  password_input TEXT,
  full_name_input TEXT DEFAULT '',
  role_input TEXT DEFAULT 'student'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  display_name TEXT;
  hashed_pw TEXT;
  result JSONB;
BEGIN
  -- Validate
  IF email_input IS NULL OR email_input = '' THEN
    RAISE EXCEPTION 'Email không được để trống';
  END IF;

  IF password_input IS NULL OR length(password_input) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải ít nhất 6 ký tự';
  END IF;

  -- Validate role
  IF role_input NOT IN ('student', 'teacher', 'admin') THEN
    role_input := 'student';
  END IF;

  -- Lấy phần trước @ làm tên hiển thị mặc định
  display_name := COALESCE(NULLIF(full_name_input, ''), split_part(email_input, '@', 1));

  -- Hash password
  hashed_pw := crypt(password_input, gen_salt('bf'));

  -- Check user đã tồn tại chưa
  SELECT id INTO user_id FROM auth.users WHERE email = email_input;

  -- Nếu chưa có thì tạo mới
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
      hashed_pw,
      NOW(),  -- email đã verified sẵn
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', display_name),
      NOW(), NOW(), '', '', '', ''
    );
  ELSE
    -- User đã có → update password
    UPDATE auth.users SET
      encrypted_password = hashed_pw,
      updated_at = NOW()
    WHERE id = user_id;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (user_id, display_name, role_input, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

  result := jsonb_build_object(
    'user_id', user_id,
    'email', email_input,
    'full_name', display_name,
    'role', role_input
  );
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 2. Function: đổi mật khẩu cho user (admin)
CREATE OR REPLACE FUNCTION public.admin_set_password(
  user_id_input UUID,
  new_password_input TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hashed_pw TEXT;
  result JSONB;
BEGIN
  IF new_password_input IS NULL OR length(new_password_input) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải ít nhất 6 ký tự';
  END IF;

  hashed_pw := crypt(new_password_input, gen_salt('bf'));

  UPDATE auth.users SET
    encrypted_password = hashed_pw,
    updated_at = NOW()
  WHERE id = user_id_input;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy user';
  END IF;

  result := jsonb_build_object(
    'user_id', user_id_input,
    'success', true
  );
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_password(UUID, TEXT) TO authenticated;

-- 3. Function: lấy danh sách tất cả user (cho admin)
-- Cần vì auth.users không thể query trực tiếp từ client
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Chỉ admin mới được gọi
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    COALESCE(p.full_name, '')::TEXT,
    COALESCE(p.role, 'student')::TEXT,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 4. (Optional) Auto-tạo profile trigger khi có user mới qua auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();