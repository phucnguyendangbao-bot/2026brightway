/* BrightWay cinema: the opening film, the rising sparks in every dark opening, chapter titles that
   rise word by word, the thread that ties the homepage chapters together, and a page-leave cue.
   Pure decoration: every piece checks for reduced motion and weak devices, and the page is complete
   without it. Pairs with assets/css/cinema.css. */
(function () {
  'use strict';
  const root = document.documentElement;
  const motionOK = matchMedia('(prefers-reduced-motion: no-preference)');
  const finePointer = matchMedia('(pointer: fine)');
  const lite = !!(navigator.connection?.saveData || (navigator.hardwareConcurrency || 8) <= 4);
  if (lite) root.classList.add('bw-lite');
  const isHome = !!document.getElementById('hero-actions');
  const session = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* private mode: replay is fine */ } },
  };

  /* ---------- Words: wrap each word in a mask so it can rise on its own ---------- */
  function splitWords(el) {
    if (!el || el.dataset.cineSplit) return 0;
    el.dataset.cineSplit = '1';
    let index = 0;
    const walk = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          if (parts.every(p => !p.trim())) continue;
          const frag = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            if (!part.trim()) { frag.append(document.createTextNode(part)); continue; }
            const outer = document.createElement('span');
            outer.className = 'cine-word';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--w', String(index++));
            outer.append(inner);
            frag.append(outer);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      }
    };
    walk(el);
    return index;
  }

  /* ---------- Numbers count up to their value ---------- */
  function countUp(el, delay, duration) {
    const target = Number(String(el.textContent).trim());
    if (!Number.isFinite(target) || target <= 0 || !motionOK.matches) return;
    el.classList.add('cine-count');
    el.style.minWidth = `${String(target).length}ch`;
    el.textContent = '0';
    const start = performance.now() + delay;
    const ease = t => 1 - Math.pow(1 - t, 4);
    const tick = now => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      el.textContent = String(Math.round(target * ease(t)));
      if (t < 1) requestAnimationFrame(tick); else el.style.minWidth = '';
    };
    requestAnimationFrame(tick);
  }

  /* ---------- The homepage opening ---------- */
  function playOpening() {
    const hero = document.getElementById('hero-actions');
    const h1 = hero.querySelector('.bw-hero-h1');
    const playing = root.classList.contains('bw-cine') && motionOK.matches;
    if (playing) splitWords(h1);
    root.classList.remove('bw-cine-wait');
    if (!playing) { root.classList.remove('bw-cine', 'bw-cine-quick'); return; }
    const quick = root.classList.contains('bw-cine-quick');
    session.set('bwOpeningSeen', '1');

    // Figures beside the button count up as they slide in.
    const numberDelay = quick ? 100 : 1300, numberTime = quick ? 600 : 1400;
    hero.querySelectorAll('.glow-stats dt > a').forEach(a => {
      if (a.querySelector('[data-catalog-count]')) return;
      countUp(a, numberDelay, numberTime);
    });
    const catalog = hero.querySelector('[data-catalog-count]');
    if (catalog) {
      const started = performance.now();
      const once = () => {
        const text = catalog.textContent.trim();
        if (!/^\d+$/.test(text)) return false;
        const left = Math.max(0, numberDelay - (performance.now() - started));
        countUp(catalog, left, numberTime);
        return true;
      };
      if (!once()) {
        const watch = new MutationObserver(() => { if (once()) watch.disconnect(); });
        watch.observe(catalog, { childList: true, characterData: true, subtree: true });
        setTimeout(() => watch.disconnect(), 6000);
      }
    }

    // The film ends on its own, or as soon as the reader starts to scroll or type.
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      root.classList.remove('bw-cine', 'bw-cine-quick');
      removeEventListener('scroll', onScroll);
      removeEventListener('keydown', end);
    };
    const onScroll = () => { if (scrollY > 40) end(); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('keydown', end);
    setTimeout(end, quick ? 1300 : 3600);
  }

  /* ---------- Rising sparks: light drifting up out of the dark ---------- */
  function sparks(host, { origin = 0.78, density = 1 } = {}) {
    if (!host || host.querySelector(':scope > .bw-sparks') || lite || !motionOK.matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'bw-sparks';
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) { canvas.remove(); return; }

    // One soft dot, painted once and stamped many times (cheaper than shadows or gradients per spark).
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const s = sprite.getContext('2d');
    const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,226,212,.9)');
    g.addColorStop(0.45, 'rgba(252,115,77,.35)');
    g.addColorStop(1, 'rgba(252,115,77,0)');
    s.fillStyle = g; s.fillRect(0, 0, 64, 64);

    const dpr = Math.min(1.5, devicePixelRatio || 1);
    let w = 0, h = 0, list = [], running = false, visible = false, last = 0, frame = 0;
    let px = 0, py = 0, tx = 0, ty = 0;
    const rand = (a, b) => a + Math.random() * (b - a);
    const gauss = () => (Math.random() + Math.random() + Math.random()) / 3;
    const spawn = (p, fresh) => {
      // Most sparks rise from the warm light low in the middle; a few wander anywhere.
      const wide = Math.random() < 0.3;
      p.x = wide ? Math.random() * w : w * (0.5 + (gauss() - 0.5) * 1.1);
      p.y = fresh ? Math.random() * h : h * (wide ? rand(0.6, 1.05) : origin + rand(-0.05, 0.22));
      p.r = rand(0.6, 2.4) * (Math.random() < 0.08 ? 2.2 : 1);
      p.vy = rand(10, 34);
      p.vx = rand(-4, 4);
      p.phase = Math.random() * Math.PI * 2;
      p.sway = rand(6, 20);
      p.life = 0;
      p.max = rand(5, 11);
      p.z = rand(0.4, 1.2);                 // depth: near sparks are bigger, faster and follow the pointer more
      return p;
    };
    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.max(22, Math.min(95, (w * h) / 15000)) * density);
      while (list.length < n) list.push(spawn({}, true));
      list.length = n;
    };
    const draw = now => {
      frame = 0;
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      // Scrolling down sends the sparks streaming up faster, as if you were moving through them.
      const boost = 1 + Math.min(3, Math.max(0, scrollY) / 260);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const near = [];
      for (const p of list) {
        p.life += dt;
        p.y -= p.vy * p.z * boost * dt;
        p.x += p.vx * dt;
        const k = p.life / p.max;
        if (k >= 1 || p.y < -20) { spawn(p, false); continue; }
        const fade = Math.min(1, k * 5) * Math.min(1, (1 - k) * 2.5) * Math.min(1, p.y / (h * 0.25));
        const x = p.x + Math.sin(p.phase + p.life * 1.3) * p.sway + px * p.z * 22;
        const y = p.y + py * p.z * 14;
        const size = p.r * 7 * p.z;
        ctx.globalAlpha = Math.max(0, fade * (0.55 + 0.45 * Math.sin(p.phase + p.life * 3)));
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
        if (fade > 0.45 && p.z > 0.8) near.push(x, y, fade);
      }
      // Close sparks join up for a moment: the way forming between points of light.
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 0.6;
      for (let i = 0; i < near.length; i += 3) {
        for (let j = i + 3; j < near.length; j += 3) {
          const dx = near[i] - near[j], dy = near[i + 1] - near[j + 1];
          const d2 = dx * dx + dy * dy;
          if (d2 > 7200) continue;
          ctx.globalAlpha = (1 - d2 / 7200) * 0.22 * Math.min(near[i + 2], near[j + 2]);
          ctx.strokeStyle = '#ffd2bf';
          ctx.beginPath(); ctx.moveTo(near[i], near[i + 1]); ctx.lineTo(near[j], near[j + 1]); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      const should = visible && !document.hidden && motionOK.matches;
      if (should && !running) { running = true; last = 0; frame = requestAnimationFrame(draw); }
      if (!should && running) { running = false; cancelAnimationFrame(frame); frame = 0; }
    };
    resize();
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { visible = e[0].isIntersecting; sync(); }).observe(host);
    else { visible = true; sync(); }
    if ('ResizeObserver' in window) {
      let pending = 0;
      new ResizeObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(resize); }).observe(host);
    }
    document.addEventListener('visibilitychange', sync);
    motionOK.addEventListener?.('change', sync);
    if (finePointer.matches) {
      host.addEventListener('pointermove', e => {
        const r = host.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      }, { passive: true });
      host.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    }
    requestAnimationFrame(() => canvas.classList.add('is-on'));
  }

  /* ---------- The opening sky leans toward the pointer (desktop) ---------- */
  function skyParallax(hero) {
    if (!finePointer.matches || !motionOK.matches || lite) return;
    const layers = [[hero.querySelector('.glow-cone'), 26, 10], [hero.querySelector('.glow-beams'), -14, -4]].filter(([el]) => el);
    let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
    const step = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      for (const [el, mx, my] of layers) el.style.translate = `${(x * mx).toFixed(1)}px ${(y * my).toFixed(1)}px`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!frame) frame = requestAnimationFrame(step);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!frame) frame = requestAnimationFrame(step); });
  }

  /* ---------- Chapter titles rise word by word as they arrive ---------- */
  function chapterTitles() {
    if (!motionOK.matches || !('IntersectionObserver' in window)) return;
    const titles = [...document.querySelectorAll('#home-view .story-chapter .chapter-title, #homeJourneyTitle')];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.remove('is-waiting');
      e.target.classList.add('is-playing');
    }), { threshold: 0.6, rootMargin: '0px 0px -8% 0px' });
    for (const title of titles) {
      const r = title.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) continue;   // already on screen: leave it be
      splitWords(title);
      title.classList.add('cine-split', 'is-waiting');
      io.observe(title);
    }
  }

  /* ---------- The thread: one line down the side that ties the chapters together ---------- */
  function thread() {
    const story = document.querySelector('[data-story]');
    const hero = document.getElementById('hero-actions');
    const chapters = [...document.querySelectorAll('#home-view .story-chapter[id]')];
    if (!story || !hero || chapters.length < 2) return;
    const tocNames = [...document.querySelectorAll('.ks-toc-list .home-journey-card strong')].map(s => s.textContent.trim());
    const nav = document.createElement('nav');
    nav.className = 'bw-rail';
    nav.setAttribute('aria-label', 'Các chương của hành trình');
    nav.innerHTML = `<span class="bw-rail-track" aria-hidden="true"></span><span class="bw-rail-fill" aria-hidden="true"></span>
      <span class="bw-rail-head" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 3 22 8 12 13 2 8z"/><path d="M6 10.5v4.5c3.5 2.6 8.5 2.6 12 0v-4.5"/></svg></span>
      <ol>${chapters.map((ch, i) => {
        const last = i === chapters.length - 1 && !ch.dataset.step;
        const label = last ? 'Kết' : `${String(i + 1).padStart(2, '0')}`;
        const name = last ? 'Con đường của bạn' : (tocNames[i] || ch.querySelector('.chapter-title')?.textContent.trim() || '');
        return `<li><a href="#${ch.id}"><span class="bw-rail-label"><b>${label}</b>${name.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)}</span></a></li>`;
      }).join('')}</ol>`;
    document.body.append(nav);
    const items = [...nav.querySelectorAll('li')];
    const head = nav.querySelector('.bw-rail-head');
    let tops = [], heroBottom = 0, storyBottom = 0, railSpan = 0, ticking = false, shown = false, current = -1;
    const docTop = el => el.getBoundingClientRect().top + scrollY;
    const measure = () => {
      tops = chapters.map(docTop);
      heroBottom = docTop(hero) + hero.offsetHeight;
      storyBottom = docTop(story) + story.offsetHeight;
      const ol = nav.querySelector('ol');
      railSpan = Math.max(0, ol.clientHeight - 22);
      update();
    };
    const update = () => {
      ticking = false;
      const eye = scrollY + innerHeight * 0.45;
      const show = scrollY + innerHeight * 0.35 > heroBottom && eye < storyBottom;
      if (show !== shown) { shown = show; nav.classList.toggle('is-shown', show); }
      let i = 0;
      while (i < tops.length - 1 && eye >= tops[i + 1]) i++;
      const span = (tops[i + 1] ?? storyBottom) - tops[i];
      const frac = Math.max(0, Math.min(1, (eye - tops[i]) / Math.max(1, span)));
      const p = eye < tops[0] ? 0 : Math.min(1, (i + (i < tops.length - 1 ? frac : 0)) / (tops.length - 1));
      nav.style.setProperty('--rail-p', p.toFixed(4));
      head.style.setProperty('--rail-y', `${(p * railSpan).toFixed(1)}px`);
      const at = eye < tops[0] ? -1 : i;
      if (at !== current) {
        current = at;
        items.forEach((li, k) => { li.classList.toggle('is-current', k === at); li.classList.toggle('is-passed', k < at); });
        items.forEach((li, k) => li.querySelector('a').toggleAttribute('aria-current', k === at));
      }
      items.forEach((li, k) => li.classList.toggle('is-done', chapters[k].classList.contains('is-done')));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    let pending = 0;
    const remeasure = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(measure); };
    if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(story);
    addEventListener('resize', remeasure);
    addEventListener('load', remeasure);
    measure();
  }

  /* ---------- The light falls out of the opening into the page ---------- */
  function drop(hero) {
    if (hero.querySelector('.cine-drop')) return;
    const line = document.createElement('span');
    line.className = 'cine-drop';
    line.setAttribute('aria-hidden', 'true');
    hero.append(line);
    // The button's slow breath rests while the opening is off screen.
    const cta = hero.querySelector('.glow-cta');
    if (cta && 'IntersectionObserver' in window) new IntersectionObserver(e => cta.classList.toggle('is-paused', !e[0].isIntersecting)).observe(hero);
  }

  /* ---------- Leaving the page: answer the click at once ---------- */
  function leaving() {
    document.addEventListener('click', e => {
      const a = e.target.closest?.('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      root.classList.add('bw-leaving');
    });
    addEventListener('pageshow', () => root.classList.remove('bw-leaving'));
  }

  function start() {
    if (isHome) {
      const hero = document.getElementById('hero-actions');
      playOpening();
      sparks(hero.querySelector('.glow-sky'), { origin: 0.72, density: 1 });
      skyParallax(hero);
      drop(hero);
      chapterTitles();
      thread();
    } else {
      // Other pages: the shared navigation marks the dark opening a moment after load.
      let tries = 0;
      const look = () => {
        const band = document.querySelector('.glow-band');
        if (band) { band.classList.add('has-sparks'); sparks(band, { origin: 0.95, density: 0.7 }); return; }
        if (++tries < 40) setTimeout(look, 75);
      };
      look();
    }
    leaving();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
