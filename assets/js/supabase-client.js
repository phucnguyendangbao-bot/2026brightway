/* ════════════════════════════════════════════════════════
   SUPABASE CLIENT — singleton + config
   ════════════════════════════════════════════════════════
   ⚠️ SUPABASE_URL và SUPABASE_ANON_KEY cần được thay bằng
   giá trị thật từ Supabase Dashboard > Project Settings > API
   Hoặc set window.SUPABASE_CONFIG trước khi load script này.
   ════════════════════════════════════════════════════════ */

window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
  // ⬇️ CẤU HÌNH ĐÚNG CHO PROJECT CỦA BẠN
  url: 'https://nybtwbkkbiqedqqxqcc.supabase.co',
  anonKey: 'PASTE-YOUR-ANON-KEY-HERE'   // <-- Thay bằng anon key từ Supabase Dashboard > Project Settings > API
};

(function () {
  'use strict';

  const cfg = window.SUPABASE_CONFIG;

  // Validate config
  if (!cfg.url || cfg.url.includes('YOUR-PROJECT')) {
    console.warn(
      '%c[Supabase] ⚠️ Chưa cấu hình. Mở assets/js/supabase-client.js và thay URL + ANON_KEY.',
      'color:#f59e0b;font-weight:bold'
    );
  }

  // Load Supabase SDK từ CDN
  function loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve(window.supabase);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('Failed to load Supabase SDK'));
      document.head.appendChild(s);
    });
  }

  let _client = null;
  let _promise = null;

  async function init() {
    if (_client) return _client;
    if (_promise) return _promise;
    _promise = (async () => {
      const supabase = await loadSDK();
      _client = supabase.createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'bw-auth'
        }
      });
      window.supabaseClient = _client;
      window.dispatchEvent(new CustomEvent('supabase-ready'));
      return _client;
    })();
    return _promise;
  }

  // Auto-init khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.getSupabase = init;
})();
