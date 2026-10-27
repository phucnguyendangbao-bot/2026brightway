-- Non-destructive security repair for projects that used the legacy admin scripts.
-- Run only in the trusted Supabase SQL Editor after taking a database snapshot.
-- Changes function bodies/EXECUTE grants and adds a role guard; no user rows are deleted.
-- Production deployment of the static website does NOT apply this migration.

BEGIN;

DO $$
DECLARE missing_column TEXT;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Expected public.profiles; inspect the live schema before applying';
  END IF;
  SELECT required.name INTO missing_column
  FROM unnest(ARRAY['id', 'role', 'full_name', 'avatar_url', 'created_at', 'updated_at']) AS required(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = required.name
  ) LIMIT 1;
  IF missing_column IS NOT NULL THEN
    RAISE EXCEPTION 'Expected public.profiles.%: inspect the live schema before applying', missing_column;
  END IF;
END $$;

-- RLS limits rows, not columns. Block a normal user from changing their own role.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN RETURN NEW; END IF;

  -- Trusted service operations and SQL Editor maintenance may assign roles.
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL AND session_user IN ('postgres', 'supabase_admin')
     AND COALESCE(current_setting('request.jwt.claim.role', true), '') = '' THEN RETURN NEW; END IF;

  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: profile role is protected' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Ignore client-controlled raw_user_meta_data.role when new users sign up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
    'student', NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- These functions still support the existing admin UI, but every call now
-- checks the authenticated caller before touching auth.users or profiles.
CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_input TEXT, password_input TEXT,
  full_name_input TEXT DEFAULT '', role_input TEXT DEFAULT 'student'
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
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501'; END IF;
  IF email_input IS NULL OR email_input = '' THEN RAISE EXCEPTION 'Email không được để trống'; END IF;
  IF password_input IS NULL OR length(password_input) < 6 THEN RAISE EXCEPTION 'Mật khẩu phải ít nhất 6 ký tự'; END IF;
  IF role_input NOT IN ('student', 'teacher', 'admin') THEN role_input := 'student'; END IF;

  display_name := COALESCE(NULLIF(full_name_input, ''), split_part(email_input, '@', 1));
  hashed_pw := crypt(password_input, gen_salt('bf'));
  SELECT id INTO user_id FROM auth.users WHERE email = email_input;
  IF user_id IS NULL THEN
    user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated',
      email_input, hashed_pw, NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', display_name), NOW(), NOW(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users SET encrypted_password = hashed_pw, updated_at = NOW() WHERE id = user_id;
  END IF;
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (user_id, display_name, role_input, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role, updated_at = NOW();
  RETURN jsonb_build_object('user_id', user_id, 'email', email_input,
    'full_name', display_name, 'role', role_input);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_password(user_id_input UUID, new_password_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501'; END IF;
  IF new_password_input IS NULL OR length(new_password_input) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải ít nhất 6 ký tự';
  END IF;
  UPDATE auth.users SET encrypted_password = crypt(new_password_input, gen_salt('bf')),
    updated_at = NOW() WHERE id = user_id_input;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy user'; END IF;
  RETURN jsonb_build_object('user_id', user_id_input, 'success', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_password(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_password(UUID, TEXT) TO authenticated;

-- The existing list RPC has an admin guard, but should not be public to anon.
DO $$ BEGIN
  IF to_regprocedure('public.admin_list_users()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon';
  END IF;
  IF to_regprocedure('public.signin_with_email(text)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.signin_with_email(text) FROM PUBLIC, anon, authenticated';
  END IF;
  IF to_regprocedure('public.create_session_for_email(text)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.create_session_for_email(text) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

COMMIT;
