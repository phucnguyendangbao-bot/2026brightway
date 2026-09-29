-- ═══════════════════════════════════════════════════════
-- EMAIL ONLY LOGIN SETUP
-- Tạo function RPC để auto-signup user bằng email
-- (không cần password, không cần email verification)
-- ═══════════════════════════════════════════════════════

-- 1. Function: tạo user mới nếu chưa tồn tại (chỉ cần email)
CREATE OR REPLACE FUNCTION public.signin_with_email(email_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  display_name TEXT;
BEGIN
  -- Lấy phần trước @ làm tên hiển thị mặc định
  display_name := split_part(email_input, '@', 1);

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
      crypt('bw-no-pwd-' || user_id::text, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', display_name),
      NOW(), NOW(), '', '', '', ''
    );

    -- Tự tạo profile
    INSERT INTO public.profiles (id, full_name, role, created_at)
    VALUES (user_id, display_name, 'student', NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Đảm bảo có profile
    INSERT INTO public.profiles (id, full_name, role, created_at)
    VALUES (user_id, display_name, 'student', NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN user_id;
END;
$$;

-- 2. Grant quyền gọi function cho anon role
GRANT EXECUTE ON FUNCTION public.signin_with_email(TEXT) TO anon, authenticated;

-- 3. Function: tạo session token trực tiếp cho user (bypass email)
-- Trả về access_token + refresh_token format JSON
CREATE OR REPLACE FUNCTION public.create_session_for_email(email_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  session_token TEXT;
  refresh_token TEXT;
  expires_at TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Tạo user nếu chưa có
  user_id := public.signin_with_email(email_input);

  -- Tạo session
  session_token := encode(gen_random_bytes(32), 'hex');
  refresh_token := encode(gen_random_bytes(32), 'hex');
  expires_at := NOW() + INTERVAL '1 hour';

  -- Insert vào auth.sessions (Supabase internal table)
  INSERT INTO auth.sessions (
    id, user_id, created_at, updated_at,
    factor_id, aal, not_after, refreshed_at, user_agent, ip,
    oauth_client_id, oauth_token_id
  )
  VALUES (
    session_token, user_id, NOW(), NOW(),
    NULL, 'aal1', expires_at, NOW(), 'email-only-login', '0.0.0.0',
    NULL, NULL
  )
  ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

  result := jsonb_build_object(
    'access_token', session_token,
    'refresh_token', refresh_token,
    'user_id', user_id,
    'expires_at', expires_at
  );
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_session_for_email(TEXT) TO anon, authenticated;

-- 4. Auto-promote email đặc biệt thành admin
-- (chạy 1 lần sau khi setup)
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin@brightway.vn',
    'teacher@brightway.vn',
    'phucnguyendangbao@gmail.com'  -- Email của thầy/cô
  ];
  admin_email TEXT;
  admin_id UUID;
BEGIN
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    -- Tạo user nếu chưa có
    admin_id := public.signin_with_email(admin_email);
    -- Promote lên admin
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = admin_id;
  END LOOP;
END;
$$;