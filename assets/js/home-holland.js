/* Three ordered choices form a Holland code. This is not another quiz. */
(function () {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-holland-code]')];
  const status = document.getElementById('homeHollandSelection');
  const submit = document.getElementById('homeHollandSubmit');
  const clear = document.getElementById('homeHollandClear');
  const slots = [...document.querySelectorAll('[data-holland-slot]')];
  if (buttons.length !== 6 || !status || !submit || !clear) return;

  const savedCode = window.BWFlow?.holland() || '';
  const selected = /^[RIASEC]{3}$/.test(savedCode) && new Set(savedCode).size === 3 ? savedCode.split('') : [];

  function render() {
    buttons.forEach(button => {
      const rank = selected.indexOf(button.dataset.hollandCode);
      const active = rank !== -1;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('small').textContent = active ? String(rank + 1) : '';
    });
    const complete = selected.length === 3;
    const code = selected.join('');
    status.textContent = selected.length
      ? `Đã chọn: ${selected.join(' → ')} (${selected.length}/3)${complete ? ` · Mã ${code}` : ''}`
      : 'Chưa chọn nhóm nào · cần chọn 3 nhóm';
    submit.disabled = !complete;
    clear.hidden = selected.length === 0;
    slots.forEach((slot, rank) => {
      const letter = selected[rank] || '';
      if (slot.textContent === letter) return;
      slot.textContent = letter;
      slot.classList.toggle('is-filled', Boolean(letter));
      if (letter) { slot.classList.remove('is-new'); void slot.offsetWidth; slot.classList.add('is-new'); }
    });
    // Chapter 2 listens so the story continues from the code being built.
    document.dispatchEvent(new CustomEvent('bw:holland-pick', { detail: { code: complete ? code : '' } }));
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    const code = button.dataset.hollandCode;
    const index = selected.indexOf(code);
    if (index !== -1) selected.splice(index, 1);
    else if (selected.length < 3) selected.push(code);
    render();
  }));

  clear.addEventListener('click', () => {
    selected.length = 0;
    render();
    buttons[0].focus();
  });

  submit.addEventListener('click', () => {
    if (selected.length !== 3) return;
    const code = selected.join('');
    window.BWFlow?.storage.set('studentHollandImportedV1', JSON.stringify({ code, savedAt: Date.now() }));
    location.assign('careers-holland.html?holland=' + encodeURIComponent(code));
  });

  render();
})();
