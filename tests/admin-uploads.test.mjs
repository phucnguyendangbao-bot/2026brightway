import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin forms provide direct image and document uploads', () => {
  const post = read('admin/post-edit.html');
  const resource = read('admin/resource-edit.html');
  const major = read('admin/major-edit.html');

  assert.match(post, /id="cover_upload"[^>]+accept="image\/jpeg,image\/png,image\/webp,image\/gif"/);
  assert.match(post, /id="inline_image_upload"/);
  assert.match(post, /id="inline_file_upload"[^>]+accept="\.pdf,\.doc,\.docx,\.xls,\.xlsx,\.ppt,\.pptx"/);
  assert.match(resource, /id="fileUpload"[^>]+accept="\.pdf,\.doc,\.docx,\.xls,\.xlsx,\.ppt,\.pptx"/);
  assert.match(resource, /id="imageUpload"[^>]+accept="image\/jpeg,image\/png,image\/webp,image\/gif"/);
  assert.match(major, /id="major_cover_upload"/);
});

test('upload service validates files and uses the configured public bucket', () => {
  const uploader = read('assets/js/admin-upload.js');
  const migration = read('supabase/create-cms-uploads-bucket.sql');

  assert.match(uploader, /const BUCKET = 'cms-uploads'/);
  assert.match(uploader, /Tệp vượt quá/);
  assert.match(uploader, /getPublicUrl\(path\)/);
  assert.match(migration, /INSERT INTO storage\.buckets/);
  assert.match(migration, /Staff upload CMS files/);
  assert.match(migration, /role IN \('admin', 'teacher'\)/);
});
