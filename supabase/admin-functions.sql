-- ═══════════════════════════════════════════════════════
-- ADMIN PANEL: Tạo tài khoản cho giáo viên
-- Chạy SQL này trong Supabase SQL Editor để có function
-- mà admin dùng để tạo tài khoản không cần verify email
-- ═══════════════════════════════════════════════════════

-- Function: tạo user mới (email đã verify sẵn, không cần OTP)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_input TEXT,
  full_name_input TEXT,
  role_input TEXT DEFAULT 'student'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  display_name TEXT;
  result JSONB;
BEGIN
  -- Lấy phần trước @ làm tên hiển thị mặc định
  display_name := COALESCE(NULLIF(full_name_input, ''), split_part(email_input, '@', 1));

  -- Validate role
  IF role_input NOT IN ('student', 'teacher', 'admin') THEN
    role_input := 'student';
  END IF;

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
      crypt('bw-' || user_id::text, gen_salt('bf')),
      NOW(),  -- email đã verified sẵn!
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', display_name),
      NOW(), NOW(), '', '', '', ''
    );
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

-- Grant quyền gọi cho authenticated (chỉ admin mới có quyền)
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT) TO authenticated;

-- Policy: chỉ admin được gọi function này
CREATE OR REPLACE FUNCTION public.check_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_admin() TO authenticated;