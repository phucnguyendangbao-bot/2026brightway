-- Kho ảnh và tài liệu cho BrightWay Admin.
-- Chạy một lần trong Supabase Dashboard > SQL Editor.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cms-uploads',
  'cms-uploads',
  TRUE,
  26214400,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read CMS uploads" ON storage.objects;
CREATE POLICY "Public read CMS uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-uploads');

DROP POLICY IF EXISTS "Staff upload CMS files" ON storage.objects;
CREATE POLICY "Staff upload CMS files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cms-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Staff update own CMS files" ON storage.objects;
CREATE POLICY "Staff update own CMS files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cms-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'cms-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Staff delete own CMS files" ON storage.objects;
CREATE POLICY "Staff delete own CMS files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cms-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
