/* BrightWay Admin — uploads ảnh và tài liệu lên Supabase Storage. */
(function () {
  'use strict';

  const BUCKET = 'cms-uploads';
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

  function safeName(name) {
    const dot = name.lastIndexOf('.');
    const extension = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, '') : '';
    const base = (dot >= 0 ? name.slice(0, dot) : name)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 60) || 'tep';
    return base + extension;
  }

  function validate(file, kind) {
    if (!file) throw new Error('Chưa chọn tệp');
    const image = kind === 'image';
    const allowed = image ? IMAGE_TYPES : DOCUMENT_TYPES;
    const extensions = image ? IMAGE_EXTENSIONS : DOCUMENT_EXTENSIONS;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const maxBytes = (image ? 8 : 25) * 1024 * 1024;
    if (!allowed.includes(file.type) && !extensions.includes(extension)) {
      throw new Error(image ? 'Chỉ nhận JPG, PNG, WEBP hoặc GIF' : 'Chỉ nhận PDF, Word, Excel hoặc PowerPoint');
    }
    if (file.size > maxBytes) {
      throw new Error(`Tệp vượt quá ${image ? 8 : 25} MB`);
    }
  }

  async function upload(file, kind = 'image', onProgress) {
    validate(file, kind);
    const sb = await window.getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

    onProgress?.('Đang tải lên…');
    const folder = kind === 'image' ? 'images' : 'documents';
    const path = `${user.id}/${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false
    });
    if (error) {
      if (/bucket not found/i.test(error.message || '')) {
        throw new Error('Kho tệp chưa được cấu hình. Hãy chạy supabase/create-cms-uploads-bucket.sql');
      }
      throw error;
    }

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Không lấy được đường dẫn tệp');
    onProgress?.('Đã tải lên');
    return { url: data.publicUrl, path, name: file.name, size: file.size, type: file.type };
  }

  function bind(options) {
    const input = document.querySelector(options.input);
    const target = document.querySelector(options.target);
    const status = document.querySelector(options.status);
    const button = document.querySelector(options.button);
    if (!input || !target) return;

    const setStatus = (message, state = '') => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      input.disabled = true;
      if (button) button.disabled = true;
      setStatus('Đang tải lên…', 'loading');
      try {
        const result = await upload(file, options.kind, message => setStatus(message, 'loading'));
        target.value = result.url;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        setStatus(`✓ ${result.name}`, 'success');
        options.onUploaded?.(result);
        window.Admin?.showToast('Tải tệp lên thành công', 'success');
      } catch (error) {
        setStatus(error.message, 'error');
        window.Admin?.showToast('Không thể tải lên: ' + error.message, 'error');
      } finally {
        input.disabled = false;
        if (button) button.disabled = false;
        input.value = '';
      }
    });
  }

  window.AdminUpload = { BUCKET, upload, bind, validate };
})();
