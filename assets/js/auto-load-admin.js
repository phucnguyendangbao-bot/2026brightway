/* ════════════════════════════════════════════════════════
   AUTO-LOAD Admin Quick — chèn 1 dòng này vào <head>:
   <script src="assets/js/auto-load-admin.js"></script>
   Tự động load CSS + JS admin-quick khi trang load.
   ════════════════════════════════════════════════════════ */

(function () {
  // Load CSS
  if (!document.querySelector('link[href*="admin-quick.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('./css/admin-quick.css', document.currentScript?.src || location.href).href;
    document.head.appendChild(css);
  }

  // Load JS admin-quick
  if (!document.querySelector('script[data-admin-quick]')) {
    const s = document.createElement('script');
    s.src = new URL('./admin-quick.js', document.currentScript?.src || location.href).href;
    s.setAttribute('data-admin-quick', 'true');
    document.head.appendChild(s);
  }
})();