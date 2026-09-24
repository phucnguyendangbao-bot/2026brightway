/* ════════════════════════════════════════════════════════
   LOGIN PAGE — Logic cho Google OAuth + Email + OTP
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const status = $('authStatus');
  let isSignupMode = false;

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

  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
      const active = t.dataset.tab === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.auth-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.panel === tab);
    });
    hideStatus();
  }

  function setSignupMode(signup) {
    isSignupMode = signup;
    const nameField = $('nameField');
    const submit = $('passwordSubmit');
    if (nameField) nameField.hidden = !signup;
    if (submit) submit.textContent = signup ? 'Tạo tài khoản' : 'Đăng nhập';
    const link = $('toggleSignup');
    if (link) link.textContent = signup ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký';
  }

  // ─── Tab handling ───
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });
  document.querySelectorAll('[data-switch]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      switchTab(el.dataset.switch);
      setSignupMode(true);
    });
  });
  const toggleSignup = $('toggleSignup');
  if (toggleSignup) {
    toggleSignup.addEventListener('click', e => {
      e.preventDefault();
      setSignupMode(!isSignupMode);
    });
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

  // ─── Password ───
  const pwdForm = $('passwordForm');
  if (pwdForm) {
    pwdForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('pEmail').value.trim();
      const password = $('pPassword').value;
      const name = $('pName')?.value?.trim() || '';
      if (!email || !password) return;
      try {
        showStatus('🔄 Đang xử lý...', 'info');
        let result;
        if (isSignupMode) {
          if (!name) {
            showStatus('❌ Vui lòng nhập họ tên', 'error');
            return;
          }
          result = await window.BWAuth.signUpWithEmail(email, password, name);
          if (result.error) throw result.error;
          showStatus('✅ Đăng ký thành công! Kiểm tra email để xác nhận (hoặc đăng nhập ngay).', 'success');
        } else {
          result = await window.BWAuth.signInWithEmail(email, password);
          if (result.error) throw result.error;
          showStatus('✅ Đăng nhập thành công! Đang chuyển trang...', 'success');
          setTimeout(() => redirectAfterLogin(), 800);
        }
      } catch (e) {
        let msg = e.message;
        if (msg.includes('Invalid login')) msg = 'Email hoặc mật khẩu không đúng';
        if (msg.includes('already registered')) msg = 'Email đã đăng ký — thử đăng nhập';
        if (msg.includes('Password should be')) msg = 'Mật khẩu phải ít nhất 8 ký tự';
        showStatus('❌ ' + msg, 'error');
      }
    });
  }

  // ─── OTP ───
  let otpEmail = '';
  const otpForm = $('otpForm');
  if (otpForm) {
    otpForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('otpEmail').value.trim();
      if (!email) return;
      try {
        $('otpSendBtn').disabled = true;
        showStatus('📧 Đang gửi mã OTP...', 'info');
        const { error } = await window.BWAuth.signInWithOTP(email);
        if (error) throw error;
        otpEmail = email;
        $('otpStep2').hidden = false;
        $('otpSendBtn').hidden = true;
        $('otpEmail').disabled = true;
        showStatus('✅ Mã OTP đã được gửi tới ' + email, 'success');
        $('otpCode').focus();
      } catch (e) {
        showStatus('❌ Lỗi: ' + e.message, 'error');
        $('otpSendBtn').disabled = false;
      }
    });

    const verifyBtn = $('otpVerifyBtn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        const code = $('otpCode').value.trim();
        if (!code || code.length !== 6) {
          showStatus('❌ Vui lòng nhập đủ 6 số', 'error');
          return;
        }
        try {
          verifyBtn.disabled = true;
          showStatus('🔄 Đang xác thực...', 'info');
          const { error } = await window.BWAuth.verifyOTP(otpEmail, code);
          if (error) throw error;
          showStatus('✅ Xác thực thành công!', 'success');
          setTimeout(() => redirectAfterLogin(), 800);
        } catch (e) {
          showStatus('❌ Mã không đúng hoặc đã hết hạn', 'error');
          verifyBtn.disabled = false;
        }
      });
    }

    const resendBtn = $('otpResendBtn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        try {
          showStatus('📧 Đang gửi lại...', 'info');
          const { error } = await window.BWAuth.signInWithOTP(otpEmail);
          if (error) throw error;
          showStatus('✅ Đã gửi lại mã mới', 'success');
        } catch (e) {
          showStatus('❌ ' + e.message, 'error');
        }
      });
    }
  }

  function redirectAfterLogin() {
    // If user came from a page, return there
    const params = new URLSearchParams(window.location.search);
    const ret = params.get('return') || 'careers-holland.html';
    window.location.href = ret;
  }

  // ─── Auto-redirect if already signed in ───
  window.BWAuth.on(event => {
    if ((event === 'SIGNED_IN' || event === 'INIT') && window.BWAuth.isSignedIn()) {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('force')) {
        // Just signed in via OAuth callback — redirect
        if (event === 'SIGNED_IN') {
          setTimeout(() => redirectAfterLogin(), 600);
        }
      }
    }
  });
})();
