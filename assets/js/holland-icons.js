/* BrightWay Holland icons: one line-drawn set for the six interest groups, used instead of emoji.
   24px grid, 1.8 stroke, round ends, drawn in currentColor so each group keeps its own colour. */
(function () {
  const wrap = (body, label) => `<svg class="bw-hicon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"${label ? ` data-label="${label}"` : ''}>${body}</svg>`;
  const ICONS = {
    // All groups: four tiles
    all: wrap('<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="3.25"/>'),
    // R Kỹ thuật: a wrench
    R: wrap('<path d="M14.8 4.1a4.7 4.7 0 0 0-5.5 6.2L4 15.6a2.1 2.1 0 1 0 3 3l5.3-5.3a4.7 4.7 0 0 0 6.2-5.5l-2.8 2.8-2.7-.5-.5-2.7z"/>', 'R'),
    // I Nghiên cứu: a lens looking closely
    I: wrap('<circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 5 5"/><path d="M8 9.2a3 3 0 0 1 2.4-1.9"/>', 'I'),
    // A Nghệ thuật: a brush stroke with a spark
    A: wrap('<path d="M14.5 4.5 19.5 9.5 11 18a3.5 3.5 0 0 1-5 0 3.5 3.5 0 0 1 0-5z"/><path d="M6 18c-1 .4-1.8 1.3-2 2.5 1.2-.2 2.1-1 2.5-2"/><path d="M18.5 3v2M17.5 4h2"/>', 'A'),
    // S Xã hội: two people side by side
    S: wrap('<circle cx="8.5" cy="8.5" r="3"/><path d="M3 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.2 14.6a4.6 4.6 0 0 1 5.8 4.4"/>', 'S'),
    // E Lãnh đạo: a flag on a summit
    E: wrap('<path d="M6 20.5V4"/><path d="M6 4.5h10.5l-2.2 3.7 2.2 3.8H6"/><path d="M3.5 20.5h6"/>', 'E'),
    // C Nghiệp vụ: an orderly chart on a sheet
    C: wrap('<rect x="4.5" y="3.5" width="15" height="17" rx="2.2"/><path d="M8.5 16v-2.5M12 16v-5.5M15.5 16V8.5"/>', 'C'),
  };
  window.BWHollandIcon = key => ICONS[key] || '';
})();
