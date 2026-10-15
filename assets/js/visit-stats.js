(function () {
  'use strict';

  const today = new Date();
  const dayKey = today.toISOString().slice(0, 10);
  const monthKey = dayKey.slice(0, 7);
  const storageKey = 'brightway-visit-stats';
  const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
  state.total = Number(state.total) || 0;
  state.days = state.days || {};
  state.months = state.months || {};
  state.total += 1;
  state.days[dayKey] = (Number(state.days[dayKey]) || 0) + 1;
  state.months[monthKey] = (Number(state.months[monthKey]) || 0) + 1;
  localStorage.setItem(storageKey, JSON.stringify(state));

  const set = (selector, value) => document.querySelectorAll(selector).forEach((element) => {
    element.textContent = Number(value).toLocaleString('vi-VN');
  });
  set('[data-visit-total]', state.total);
  set('[data-visit-today]', state.days[dayKey]);
  set('[data-visit-month]', state.months[monthKey]);
})();
