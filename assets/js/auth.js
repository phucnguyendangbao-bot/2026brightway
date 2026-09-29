/* ════════════════════════════════════════════════════════
   AUTH — Google OAuth + Email/password
   Không có OTP. Đơn giản, chỉ 2 cách đăng nhập:
   1. Google (1 cú click)
   2. Email + password (admin cấp tài khoản sẵn)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const listeners = new Set();
  let _user = null;
  let _profile = null;
  let _initialized = false;

  // ─── Pub/Sub ───
  function notify(event) {
    listeners.forEach(fn => {
      try { fn(event, { user: _user, profile: _profile }); } catch (e) { console.error(e); }
    });
  }

  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  // ─── Auth state ───
  async function init() {
    if (_initialized) return;
    const sb = await window.getSupabase();
    _initialized = true;

    sb.auth.onAuthStateChange(async (event, session) => {
      _user = session?.user || null;
      _profile = null;
      if (_user) await fetchProfile();
      notify(event);
    });

    const { data: { session } } = await sb.auth.getSession();
    _user = session?.user || null;
    if (_user) await fetchProfile();
    notify('INIT');
  }

  async function fetchProfile() {
    if (!_user) return null;
    const sb = await window.getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', _user.id)
      .maybeSingle();
    if (error) {
      console.warn('[auth] fetchProfile:', error.message);
      return null;
    }
    _profile = data;
    return _profile;
  }

  // ─── Google OAuth ───
  async function signInWithGoogle(redirectTo = window.location.origin + '/index.html') {
    const sb = await window.getSupabase();
    return sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' }
      }
    });
  }

  // ─── Email/password ───
  async function signInWithEmail(email, password) {
    const sb = await window.getSupabase();
    return sb.auth.signInWithPassword({ email, password });
  }

  // ─── Admin: tạo user mới (chỉ admin dùng) ───
  async function adminCreateUser(email, password, fullName, role = 'student') {
    // Gọi RPC function để tạo user + profile
    const sb = await window.getSupabase();
    const { data: userId, error: rpcErr } = await sb.rpc('signin_with_email', {
      email_input: email
    });
    if (rpcErr) throw rpcErr;

    // Update profile
    const { error } = await sb.from('profiles').upsert({
      id: userId,
      full_name: fullName || email.split('@')[0],
      role
    });
    if (error) throw error;

    return userId;
  }

  // ─── Sign out ───
  async function signOut() {
    const sb = await window.getSupabase();
    return sb.auth.signOut();
  }

  // ─── Update profile ───
  async function updateProfile(patch) {
    if (!_user) throw new Error('Not signed in');
    const sb = await window.getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .update(patch)
      .eq('id', _user.id)
      .select()
      .single();
    if (error) throw error;
    _profile = data;
    notify('PROFILE_UPDATED');
    return _profile;
  }

  // ─── Helpers ───
  function getUser() { return _user; }
  function getProfile() { return _profile; }
  function isSignedIn() { return !!_user; }
  async function requireAuth() {
    if (!_user) throw new Error('Bạn cần đăng nhập để dùng tính năng này');
    return _user;
  }

  // ─── Expose ───
  window.BWAuth = {
    init,
    on,
    getUser,
    getProfile,
    isSignedIn,
    requireAuth,
    fetchProfile,
    signInWithGoogle,
    signInWithEmail,
    adminCreateUser,
    signOut,
    updateProfile
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();