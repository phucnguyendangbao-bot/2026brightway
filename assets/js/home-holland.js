/* A quick route, not another quiz. Does not mark an imported result as tested. */
(function () {
  'use strict';
  const toggle = document.getElementById('homeImportToggle');
  const panel = document.getElementById('homeImportPanel');
  const input = document.getElementById('homeHollandCode');
  const form = document.getElementById('homeImportForm');
  if (!toggle || !panel || !form || !input) return;
  const code = window.BWFlow?.holland();
  if (code) {
    input.value = code;
    const saved = document.getElementById('homeHollandSaved');
    saved.hidden = false;
    saved.textContent = `Mã đã lưu trên thiết bị: ${code} · `;
    const link = document.createElement('a');
    link.href = 'careers-holland.html?holland=' + encodeURIComponent(code);
    link.textContent = 'Xem nghề theo mã này →';
    saved.appendChild(link);
  }
  toggle.addEventListener('click', event => {
    event.preventDefault();
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) input.focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim().toUpperCase();
    const error = document.getElementById('homeHollandError');
    if (!/^[RIASEC]{3}$/.test(value) || new Set(value).size !== 3) {
      error.textContent = 'Mã cần có đúng 3 chữ khác nhau trong R, I, A, S, E, C. Ví dụ: ISA.';
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    error.hidden = true;
    try { localStorage.setItem('studentHollandImportedV1', JSON.stringify({ code: value, savedAt: Date.now() })); } catch { /* Navigation works even without storage. */ }
    location.assign('careers-holland.html?holland=' + encodeURIComponent(value));
  });
})();
