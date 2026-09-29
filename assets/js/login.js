/* ════════════════════════════════════════════════════════
   LOGIN PAGE — Google OAuth + Email Magic Link
   - Google: 1 cú click → vào thẳng
   - Email: nhập email → nhận link qua email → click → vào
   - KHÔNG có OTP, KHÔNG có password
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const status = $('authStatus');

  function showStatus(msg, type = 'info') {
    if (!status) return;
    status.textContent = msg;
    status.className = 'auth-status show ' + type;
    status.hidden = false;
    if (type === 'success') setTimeout(hideStatus, 3000);
  }
  function hideStatus() {
    if (!status) return;
    status.hidden = true;
    status.className = 'auth-status';
  }

  // ─── Google ───
  const googleBtn = $('googleSignInBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        googleBtn.disabled = true;
        showStatus('🔄 Đang chuyển sang Google...', 'info');
        const { error } = await window.BWAuth.signInWithGoogle();
        if (error) throw error;
      } catch (e) {
        showStatus('❌ Lỗi: ' + e.message, 'error');
        googleBtn.disabled = false;
      }
    });
  }

  // ─── Email Magic Link ───
  const emailForm = $('emailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('emailOnly').value.trim();
      if (!email) return;

      const submitBtn = $('emailSubmit');
      try {
        submitBtn.disabled = true;
        showStatus('📧 Đang gửi link đăng nhập...', 'info');

        // Gọi RPC để tạo user (nếu chưa có) + gửi magic link
        // signInWithOtp với shouldCreateUser=true sẽ auto tạo user nếu chưa tồn tại
        const sb = await window.getSupabase();
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + '/index.html',
            shouldCreateUser: true
          }
        });

        if (error) throw error;

        showStatus('✅ Đã gửi link tới ' + email + '. Mở email và click link để vào.', 'success');
      } catch (e) {
        let msg = e.message;
        if (msg.includes('rate limit')) msg = 'Gửi quá nhiều. Vui lòng đợi 1 phút.';
        if (msg.includes('invalid email')) msg = 'Email không hợp lệ';
        showStatus('❌ ' + msg, 'error');
        submitBtn.disabled = false;
      }
    });
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const ret = params.get('return') || 'index.html';
    window.location.href = ret;
  }

  // ─── Auto-redirect if already signed in ───
  window.BWAuth.on(event => {
    if ((event === 'SIGNED_IN' || event === 'INIT') && window.BWAuth.isSignedIn()) {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('force') && event === 'SIGNED_IN') {
        setTimeout(() => redirectAfterLogin(), 600);
      }
    }
  });
})();