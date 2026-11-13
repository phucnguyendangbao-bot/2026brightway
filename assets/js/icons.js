/* BrightWay icons: one line-drawn set for the whole site.
   Pages and scripts still write emoji (🎓 📊 💡 …) in their copy; this turns each one into the
   matching line icon from the set below, including content that renders later. Every icon shares
   one grid (24×24), one stroke (1.75, round ends) and takes the colour of the text around it.
   Left alone: conversations with Waybi, article bodies, form fields and anything marked
   [data-no-icons]. Where an icon cannot be drawn (option text, titles, placeholders) the emoji is
   simply removed so the words read cleanly. */
(function () {
  'use strict';
  const P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.2 9.5"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17v.2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17v.2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M3 20h18"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    cap: '<path d="M12 4 22 9 12 14 2 9z"/><path d="M6 11.2v4.6c3.4 2.6 8.6 2.6 12 0v-4.6M22 9v5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5V20"/>',
    sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/><path d="M19 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z"/>',
    school: '<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    pencil: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3M4 20h16"/>',
    rocket: '<path d="M12 15.5 8.5 12C10 6.8 13.5 4 20 4c0 6.5-2.8 10-8 11.5z"/><path d="M8.5 12 5 11.5 7.5 8.5h4M12 15.5l.5 3.5 3-2.5v-4"/><path d="M6.5 17.5c-1 .5-2 2.5-2 2.5s2-1 2.5-2"/>',
    map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
    flask: '<path d="M9.5 3h5M10.5 3v6L5 19a1.4 1.4 0 0 0 1.2 2h11.6A1.4 1.4 0 0 0 19 19l-5.5-10V3"/><path d="M7.5 14.5h9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.2a6.5 6.5 0 0 1 4 5.8"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 13a8 8 0 0 0 14.3 4.6L20 15.5"/><path d="M4 4v4.5h4.5M20 20v-4.5h-4.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    bot: '<rect x="4.5" y="8" width="15" height="11" rx="3.5"/><path d="M12 4.5V8M9.5 13v1M14.5 13v1M2.5 12.5v2.5M21.5 12.5v2.5"/><circle cx="12" cy="4" r=".6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    chat: '<path d="M4 5.5h16v11H9l-5 4z"/>',
    news: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.6 1.6-2.6H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7.3 16.7 3.5 12 3.5z"/><circle cx="8" cy="11" r=".9"/><circle cx="11" cy="7.5" r=".9"/><circle cx="15.5" cy="8.5" r=".9"/>',
    clock: '<circle cx="12" cy="12.5" r="8.5"/><path d="M12 8v4.8l3 2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.6 3.9M16 6h3.5a3 3 0 0 1-3.6 3.9M12 13v4M8.5 20.5h7M9.5 17h5"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    ruler: '<rect x="2.6" y="8" width="18.8" height="8" rx="1.5" transform="rotate(-35 12 12)"/><path d="m8.2 9.8 1.4 2M10.9 7.9l1.4 2M13.6 6l1.4 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4.5-2 1.2a10.5 10.5 0 0 0 5.8 5.8l1.2-2 4.5 1.5v3A2 2 0 0 1 18.5 19.5 15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
    trash: '<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6 6.5l1 13.5h10l1-13.5M10 10.5v6M14 10.5v6"/>',
    layers: '<path d="M12 3.5 21 8l-9 4.5L3 8z"/><path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5"/>',
    wallet: '<rect x="3" y="6" width="18" height="13.5" rx="2.5"/><path d="M3 10h18M15.5 14.5h2"/>',
    briefcase: '<rect x="3" y="7" width="18" height="12.5" rx="2.5"/><path d="M9 7V5h6v2M3 12.5h18"/>',
    scale: '<path d="M12 4v16M7 20.5h10M5 7.5h14M12 4.5 5 7.5M12 4.5l7 3"/><path d="M5 7.5 2.5 13a2.5 2.5 0 0 0 5 0zM19 7.5 16.5 13a2.5 2.5 0 0 0 5 0z"/>',
    puzzle: '<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4z"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.2M12 11.5h.2M15.5 11.5h.2M8.5 15h.2M12 15h.2M15.5 15h.2M8.5 18h.2M12 18h.2"/>',
    send: '<path d="M4 12 20 4l-4 16-4-6.5z"/><path d="m12 13.5 8-9.5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4.5h11.5l-2 4 2 4H5"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
    dot: '<circle cx="12" cy="12" r="4.5" fill="currentColor"/>',
  };
  const MAP = {
    '🔍': 'search', '🔎': 'search', '✅': 'check', '☑️': 'check', '❌': 'x', '⚠️': 'alert', '⚠': 'alert', '❓': 'help',
    '🎤': 'mic', '💡': 'bulb', '📊': 'chart', '📈': 'trend', '🎓': 'cap', '📅': 'calendar', '🗓️': 'calendar',
    '📚': 'book', '📖': 'book', '📘': 'book', '📗': 'book', '📙': 'book', '📕': 'book',
    '✨': 'sparkle', '🌟': 'sparkle', '⭐': 'sparkle', '✳': 'sparkle', '✳️': 'sparkle', '✦': 'sparkle', '✧': 'sparkle', '🎉': 'sparkle',
    '🏫': 'school', '🏛️': 'school', '🏛': 'school', '🎯': 'target', '📝': 'pencil', '✍️': 'pencil', '✏️': 'pencil',
    '🚀': 'rocket', '🗺️': 'map', '🗺': 'map', '📍': 'pin', '📌': 'pin', '🔬': 'flask', '🔭': 'flask',
    '👤': 'user', '👨': 'user', '👩': 'user', '👧': 'user', '👥': 'users', '🤝': 'users',
    '📋': 'clipboard', '📄': 'clipboard', '📤': 'upload', '🔧': 'wrench', '🛠️': 'wrench', '🛠': 'wrench',
    '🔄': 'refresh', '🔁': 'refresh', '❤️': 'heart', '❤': 'heart', '💔': 'heart', '🤖': 'bot', '🧭': 'compass',
    '💬': 'chat', '📰': 'news', '🎨': 'palette', '⏰': 'clock', '⏱️': 'clock', '⏱': 'clock', '⏳': 'clock',
    '👁️': 'eye', '👁': 'eye', '🏆': 'trophy', '🏅': 'trophy', '👑': 'trophy', '💪': 'bolt', '📐': 'ruler', '📏': 'ruler',
    '🌐': 'globe', '🌍': 'globe', '🔐': 'lock', '✉️': 'mail', '✉': 'mail', '☎': 'phone', '☎️': 'phone', '📱': 'phone',
    '🗑️': 'trash', '🗑': 'trash', '🧱': 'layers', '▤': 'layers', '💰': 'wallet', '💼': 'briefcase', '⚖️': 'scale', '⚖': 'scale',
    '🧩': 'puzzle', '🧮': 'calc', '➤': 'send', '⬇️': 'download', '⬇': 'download', '🔴': 'dot', '🔵': 'dot', '👋': '',
  };
  // Longest keys first, so a pictograph with its variation selector is matched whole.
  const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Country flags are pairs of regional letters; any of them becomes the one line-drawn flag.
  const FIND = new RegExp(`(?:[\\u{1F1E6}-\\u{1F1FF}]{2}|${keys.map(escapeRe).join('|')})\\uFE0F?`, 'u');
  const FIND_ALL = new RegExp(FIND.source, 'gu');
  const SKIP = 'script, style, textarea, input, select, option, code, pre, svg, [contenteditable], [data-no-icons], [role="log"], #bwChatBody, .bw-chat-body, .waybi-messages, .w-messages, .chat-messages, .article-content, .post-content, .news-content, .news-detail-body';
  const DARK = '.glow-band, .glow-hero, .is-deep, .flow-footer-dark';
  const NS = 'http://www.w3.org/2000/svg';

  function icon(name) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', `bw-ico bw-ico-${name}`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = P[name] || '';
    return svg;
  }
  const lookup = match => /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(match) ? 'flag' : MAP[match] ?? MAP[match.replace(/️$/, '')] ?? MAP[match + '️'];

  function swapText(node) {
    const text = node.nodeValue;
    if (!FIND.test(text)) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    text.replace(FIND_ALL, (match, offset) => {
      let before = text.slice(last, offset);
      const name = lookup(match);
      if (name === '') before = before.replace(/\s+$/, ' ');
      if (before) frag.append(before);
      if (name) frag.append(icon(name));
      last = offset + match.length;
      return match;
    });
    let rest = text.slice(last);
    if (rest) frag.append(rest);
    node.replaceWith(frag);
    // An element that held only the emoji becomes an icon badge in the brand colour.
    if (!parent.textContent.trim() && parent.querySelector(':scope > .bw-ico')) parent.classList.add('bw-ico-badge');
  }
  const stripAttrs = ['title', 'placeholder', 'aria-label', 'alt'];
  function cleanAttributes(el) {
    for (const attr of stripAttrs) {
      const v = el.getAttribute?.(attr);
      if (v && FIND.test(v)) el.setAttribute(attr, v.replace(FIND_ALL, '').replace(/\s{2,}/g, ' ').trim());
    }
    if (el.tagName === 'OPTION' && FIND.test(el.textContent)) el.textContent = el.textContent.replace(FIND_ALL, '').replace(/\s{2,}/g, ' ').trim();
  }
  function process(root) {
    if (!root) return;
    if (root.nodeType === 3) { swapText(root); return; }
    if (root.nodeType !== 1) return;
    // Option text and attributes can only lose the emoji; everything else inside a skipped area stays as written.
    if (root.tagName === 'OPTION') { cleanAttributes(root); return; }
    root.querySelectorAll?.('option').forEach(cleanAttributes);
    if (root.closest(SKIP)) return;
    cleanAttributes(root);
    root.querySelectorAll('[title], [placeholder], [aria-label], [alt]').forEach(cleanAttributes);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => FIND.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    hits.forEach(swapText);
  }
  window.BWIcons = { icon, process, names: Object.keys(P) };

  function start() {
    process(document.body);
    let queue = new Set(), frame = 0;
    const flush = () => { frame = 0; const batch = queue; queue = new Set(); batch.forEach(n => n.isConnected && process(n)); };
    new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'characterData') queue.add(r.target);
        else r.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList?.contains('bw-ico')) return; queue.add(n); });
      }
      if (queue.size && !frame) frame = requestAnimationFrame(flush);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
