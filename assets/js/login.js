/* ════════════════════════════════════════════════════════
   LOGIN PAGE — Google OAuth + Email/Password
   - Google: 1 cú click → vào thẳng
   - Email: nhập email + password → vào thẳng
   - KHÔNG có OTP
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

  // ─── Email + Password ───
  const emailForm = $('emailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('emailOnly').value.trim();
      const password = $('emailPassword').value;
      if (!email || !password) return;

      const submitBtn = $('emailSubmit');
      try {
        submitBtn.disabled = true;
        showStatus('🔄 Đang đăng nhập...', 'info');

        const { error } = await window.BWAuth.signInWithEmail(email, password);
        if (error) throw error;

        showStatus('✅ Đăng nhập thành công!', 'success');
        setTimeout(() => redirectAfterLogin(), 800);
      } catch (e) {
        let msg = e.message;
        if (msg.includes('Invalid login')) msg = 'Email hoặc mật khẩu không đúng';
        if (msg.includes('Email not confirmed')) msg = 'Email chưa xác nhận — liên hệ admin';
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