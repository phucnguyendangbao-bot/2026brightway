/* ════════════════════════════════════════════════════════
   THEME — Dark/Light mode toggle, persistent via localStorage
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'bw-theme';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;

  function getSystemPref() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY) || getSystemPref();
    } catch { return 'light'; }
  }

  function apply(theme, animate) {
    root.setAttribute('data-theme', theme);
    root.dataset.theme = theme;
    const btn = $('themeToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.title = theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối';
      if (animate) {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 400);
      }
    }
  }

  function toggle() {
    const cur = root.dataset.theme || getStored();
    const next = cur === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    apply(next, true);
  }

  function init() {
    // Apply stored or system pref BEFORE page renders
    apply(getStored(), false);

    const btn = $('themeToggle');
    if (btn) btn.addEventListener('click', toggle);

    // Keyboard shortcut: Shift+D
    document.addEventListener('keydown', e => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !e.target.matches('input,textarea')) {
        e.preventDefault();
        toggle();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
