/* Homepage story: the road that draws as you scroll, the five chapters, and the returning-visitor view.
   Motion here only shows progress or answers a tap; everything still reads with motion or JS off. */
const story = document.querySelector('[data-story]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const flow = () => window.BWFlow;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const tzMonth = () => Number(new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Ho_Chi_Minh', month:'numeric' }).format(new Date()));

if (navigator.connection?.saveData || (navigator.hardwareConcurrency || 8) <= 4) document.documentElement.classList.add('bw-lite');

const today = document.querySelector('[data-today]');
if (today) today.textContent = new Intl.DateTimeFormat('vi-VN', { timeZone:'Asia/Ho_Chi_Minh', month:'long', year:'numeric' }).format(new Date()).replace(/^./, c => c.toUpperCase()) + ' · năm lớp 12';

function whenNear(el, fn, margin = '600px') {
  if (!el) return;
  if (!('IntersectionObserver' in window)) return fn();
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
}

/* ---------- "Chương tiếp": a small cap travels the path at the foot of each chapter ----------
   Ahead of it the path is dotted (lối), behind it the line is solid (đường). Positions are cached, so a
   scroll frame only moves one composited element and shortens one small dash. */
function initTravellers() {
  const feet = [...document.querySelectorAll('[data-chapter-next]')];
  if (!feet.length) return { refresh() {} };
  const items = feet.map(foot => ({
    foot, chapter: foot.closest('.story-chapter'),
    traveller: foot.querySelector('.ks-traveller'), behind: foot.querySelector('.ks-wave-behind'),
    wave: foot.querySelector('.ks-wave'), samples: [], top: 0, height: 1, width: 0, waveH: 0, total: 1, shown: -1,
  }));
  const active = new Set();
  let ticking = false;

  function measure() {
    for (const it of items) {
      const r = it.chapter.getBoundingClientRect();
      it.top = r.top + scrollY; it.height = Math.max(1, r.height);
      const w = it.wave.getBoundingClientRect();
      it.width = w.width; it.waveH = w.height;
      it.total = it.behind.getTotalLength();
      it.behind.style.strokeDasharray = `${it.total} ${it.total}`;
      it.samples = Array.from({ length: 41 }, (_, i) => it.behind.getPointAtLength(it.total * i / 40));
      it.shown = -1;
    }
    update(true);
  }

  function progressOf(it) {
    if (reduced.matches) return it.chapter.classList.contains('is-done') ? 1 : 0;
    return Math.max(0, Math.min(1, (scrollY + innerHeight * 0.85 - it.top) / it.height));
  }

  function place(it, p) {
    const k = Math.round(p * 400) / 400;
    if (k === it.shown) return;
    it.shown = k;
    const pt = it.samples[Math.round(k * 40)] || { x: 0, y: 20 };
    const x = pt.x / 1000 * it.width, y = pt.y / 40 * it.waveH;
    it.traveller.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -78%)`;
    it.behind.style.strokeDashoffset = String(it.total * (1 - k));
  }

  function update(all) {
    ticking = false;
    for (const it of (all ? items : active)) place(it, progressOf(it));
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const it = items.find(x => x.chapter === e.target);
      if (e.isIntersecting) active.add(it); else { active.delete(it); if (it) place(it, progressOf(it)); }
    }), { rootMargin: '200px 0px' });
    items.forEach(it => io.observe(it.chapter));
  } else items.forEach(it => active.add(it));

  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => update(false)); } }, { passive: true });
  reduced.addEventListener?.('change', () => update(true));
  let pending = 0;
  const remeasure = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(measure); };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(story);
  addEventListener('load', remeasure);
  measure();
  return { refresh: () => update(true) };
}

/* ---------- Card rows that slide sideways, with a progress line and arrows ---------- */
function initRails() {
  for (const list of document.querySelectorAll('[data-ks-rail]')) {
    const controls = document.createElement('div');
    controls.className = 'ks-rail-controls';
    controls.innerHTML = '<span class="ks-rail-progress" aria-hidden="true"><i></i></span><button type="button" class="ks-rail-btn" data-dir="-1" aria-label="Xem thẻ trước">←</button><button type="button" class="ks-rail-btn" data-dir="1" aria-label="Xem thẻ tiếp">→</button>';
    list.after(controls);
    const bar = controls.querySelector('i');
    const [prev, next] = controls.querySelectorAll('button');
    let frame = 0;
    const sync = () => {
      frame = 0;
      const max = list.scrollWidth - list.clientWidth;
      controls.hidden = max < 4;
      const p = max > 0 ? list.scrollLeft / max : 1;
      const view = list.scrollWidth ? list.clientWidth / list.scrollWidth : 1;
      bar.style.transform = `translateX(${(p * (1 - view) * 100).toFixed(2)}%) scaleX(${view.toFixed(3)})`;
      prev.disabled = list.scrollLeft < 4;
      next.disabled = list.scrollLeft > max - 4;
    };
    list.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(sync); }, { passive: true });
    controls.addEventListener('click', e => {
      const b = e.target.closest('[data-dir]');
      if (b) list.scrollBy({ left: Number(b.dataset.dir) * list.clientWidth * 0.85, behavior: reduced.matches ? 'auto' : 'smooth' });
    });
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(list);
    new MutationObserver(sync).observe(list, { childList: true });
    sync();
  }
}

/* ---------- Line drawings draw themselves once, when their chapter arrives ---------- */
function initArt() {
  const arts = [...document.querySelectorAll('.ks-art')];
  if (!arts.length || reduced.matches || !('IntersectionObserver' in window)) return;
  arts.forEach(svg => { svg.querySelectorAll('path, circle, rect').forEach(el => el.setAttribute('pathLength', '1')); svg.classList.add('is-waiting'); });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-drawn'); e.target.classList.remove('is-waiting'); io.unobserve(e.target);
  }), { threshold: 0.4 });
  arts.forEach(svg => io.observe(svg));
}

/* ---------- Returning visitor: hero resume + finished chapters fold to one line ---------- */
function chapterFor(stepIndex) { return document.querySelector(`.story-chapter[data-step="${stepIndex}"]`); }

function goTo(chapter) {
  if (!chapter) return;
  setOpen(chapter, true);
  chapter.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  const title = chapter.querySelector('.chapter-title');
  title?.setAttribute('tabindex', '-1');
  title?.focus({ preventScroll: true });
}

function setOpen(chapter, open) {
  const toggle = chapter.querySelector('[data-chapter-toggle]');
  const body = chapter.querySelector('.chapter-body');
  if (!toggle || !body || toggle.hidden) return;
  body.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Thu gọn' : 'Xem lại';
  chapter.classList.toggle('is-folded', !open);
}

function renderProgress({ fold } = {}) {
  const steps = flow()?.progress();
  if (!steps) return;
  const doneCount = steps.filter(step => step.complete).length;
  steps.forEach((step, i) => {
    const chapter = chapterFor(i);
    if (!chapter) return;
    const note = chapter.querySelector('[data-chapter-done]');
    const toggle = chapter.querySelector('[data-chapter-toggle]');
    chapter.classList.toggle('is-done', step.complete);
    const toc = document.querySelector(`[data-toc-step="${i}"]`);
    if (toc) {
      toc.classList.toggle('is-done', step.complete);
      const status = toc.querySelector('[data-toc-status]');
      if (status) { status.dataset.base ??= status.textContent; status.textContent = step.complete ? `Đã xong · ${step.detail}` : status.dataset.base; }
    }
    if (note) { note.hidden = !step.complete; note.textContent = step.complete ? `Đã xong: ${step.detail}` : ''; }
    if (toggle) toggle.hidden = !step.complete;
    if (toggle && !fold) toggle.textContent = toggle.getAttribute('aria-expanded') === 'true' ? 'Thu gọn' : 'Xem lại';
    if (fold && step.complete) setOpen(chapter, false);
  });

  const resume = document.querySelector('[data-story-resume]');
  if (!resume) return;
  if (!doneCount) { resume.hidden = true; return; }
  const nextIndex = steps.findIndex(step => !step.complete);
  const all = nextIndex === -1;
  const target = all ? 4 : nextIndex;
  resume.hidden = false;
  resume.innerHTML = `<p class="story-resume-title">Chào bạn quay lại. Bạn đã đi được ${doneCount}/5 bước.</p>
    <ol class="story-resume-dots" aria-hidden="true">${steps.map(s => `<li class="${s.complete ? 'is-done' : ''}"></li>`).join('')}</ol>
    <button type="button" class="story-resume-go" data-resume-step="${target}">${all ? 'Xem lại kế hoạch hành động' : `Tiếp tục chương ${target + 1}: ${escape(steps[target].label)}`}</button>`;
  resume.querySelector('[data-resume-step]').addEventListener('click', () => goTo(chapterFor(target)));
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-chapter-toggle]');
  if (!toggle) return;
  const chapter = toggle.closest('.story-chapter');
  setOpen(chapter, toggle.getAttribute('aria-expanded') !== 'true');
  travellers?.refresh();
});

/* ---------- Chapter 2: three careers for the code ---------- */
let jobs;
async function loadJobs() {
  if (!jobs) jobs = fetch('/assets/data/jobs.json', { signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  return jobs;
}

function rankJobs(list, code) {
  const weight = [3, 2, 1];
  return list.map((job, order) => {
    const letters = Array.isArray(job.holland) ? job.holland : [];
    const score = [...code].reduce((sum, letter, rank) => { const pos = letters.indexOf(letter); return pos === -1 ? sum : sum + weight[rank] * weight[pos]; }, 0);
    return { job, score, order };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 3).map(x => x.job);
}

const careerHost = document.querySelector('[data-career-picks]');
const careerLead = document.querySelector('[data-career-lead]');
const careerAll = document.querySelector('[data-career-all]');
let shownCode = null;

function careerSkeleton() { careerHost.innerHTML = '<span class="bw-skeleton career-skeleton" aria-hidden="true"></span>'.repeat(3); }

async function showCareers(code) {
  if (!careerHost || code === shownCode) return;
  shownCode = code;
  if (!code) {
    careerHost.innerHTML = '';
    careerLead.textContent = 'Chọn 3 nhóm ở chương 1, BrightWay sẽ gợi ý 3 nghề gần nhất với mã của bạn trong 102 nghề.';
    careerAll.href = 'careers-holland.html?holland=all';
    careerAll.textContent = 'Xem cả 102 nghề';
    return;
  }
  careerLead.innerHTML = `Mã của bạn là <strong class="career-code">${escape(code)}</strong>. Đây là 3 nghề gần nhất trong 102 nghề.`;
  careerAll.href = 'careers-holland.html?holland=' + encodeURIComponent(code);
  careerAll.textContent = `Xem tất cả nghề hợp với mã ${code}`;
  careerSkeleton();
  try {
    const picks = rankJobs(await loadJobs(), code);
    if (shownCode !== code) return;
    careerHost.innerHTML = picks.map((job, i) => {
      const desc = String(job.desc || '').split('. ')[0];
      return `<a class="career-pick" style="--i:${i}" href="careers-holland.html?holland=${encodeURIComponent(code)}&q=${encodeURIComponent(job.name)}">
        <span class="career-pick-letters" aria-label="Nhóm Holland ${escape((job.holland || []).join(', '))}">${(job.holland || []).map(l => `<b class="${code.includes(l) ? 'is-match' : ''}">${escape(l)}</b>`).join('')}</span>
        <strong>${escape(job.name)}</strong>
        <span>${escape(desc.length > 120 ? desc.slice(0, 117) + '…' : desc)}</span>
      </a>`;
    }).join('') || '<p class="career-empty">Chưa có nghề khớp mã này. Mở danh sách 102 nghề để lọc theo từng nhóm.</p>';
  } catch {
    careerHost.innerHTML = '<p class="career-empty">Chưa tải được danh sách nghề. Kiểm tra kết nối rồi mở danh sách đầy đủ bên dưới.</p>';
  }
}

if (careerHost) {
  // The latest finished pick wins over the saved code; nothing loads until the chapter is close.
  let wanted = null, near = false;
  const show = () => { if (near) showCareers(wanted ?? (flow()?.holland() || '')); };
  whenNear(careerHost.closest('.story-chapter'), () => { near = true; show(); }); // the empty list itself has no box to observe
  document.addEventListener('bw:holland-pick', event => {
    if (!event.detail?.code) return;
    wanted = event.detail.code;
    show();
  });
}

/* ---------- Chapter 4: three subjects, one total ---------- */
const mini = document.querySelector('[data-mini-score]');
if (mini) {
  const number = mini.querySelector('[data-mini-number]');
  const note = mini.querySelector('[data-mini-note]');
  const inputs = [...mini.querySelectorAll('input[type="number"]')];
  const baseNote = note.textContent;
  let shown = 0, frame = 0;

  mini.querySelector('[data-mini-combo]').addEventListener('change', event => {
    event.target.value.split(',').forEach((name, i) => { mini.querySelector(`[data-mini-subject="${i}"]`).textContent = name; });
  });

  function countTo(target) {
    cancelAnimationFrame(frame);
    const from = shown, start = performance.now(), duration = reduced.matches ? 0 : 400;
    const step = now => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      shown = from + (target - from) * (1 - Math.pow(1 - t, 3));
      number.textContent = shown.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
      if (t < 1) frame = requestAnimationFrame(step); else { shown = target; number.textContent = target.toLocaleString('vi-VN', { maximumFractionDigits: 2 }); }
    };
    frame = requestAnimationFrame(step);
  }

  mini.addEventListener('input', () => {
    let total = 0, filled = 0, invalid = false;
    inputs.forEach(input => {
      const raw = input.value.trim().replace(',', '.');
      const value = Number(raw);
      const bad = raw !== '' && (!Number.isFinite(value) || value < 0 || value > 10);
      input.setAttribute('aria-invalid', String(bad));
      invalid ||= bad;
      if (raw !== '' && !bad) { total += value; filled++; }
    });
    note.textContent = invalid ? 'Mỗi môn nhập từ 0 đến 10.' : baseNote;
    countTo(Math.round(total * 100) / 100);
  });
  mini.addEventListener('submit', event => event.preventDefault());
}

/* ---------- Chapter 5: what this month asks of you ---------- */
const strip = document.querySelector('[data-month-strip]');
const monthCard = document.querySelector('[data-month-card]');
if (strip && monthCard) {
  const order = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
  const now = tzMonth();
  let plan = null;
  let selected = now;

  strip.innerHTML = order.map(m => `<button type="button" data-month="${m}" class="${m === now ? 'is-now' : ''} ${order.indexOf(m) < order.indexOf(now) ? 'is-past' : ''}" aria-pressed="${m === selected}">T${m}${m === now ? '<span class="month-now-dot" aria-hidden="true"></span><span class="bw-visually-hidden"> (tháng này)</span>' : ''}</button>`).join('');
  const current = strip.querySelector('.is-now');
  if (current) strip.scrollLeft = current.offsetLeft - strip.clientWidth / 2 + current.offsetWidth / 2;

  function renderMonth() {
    strip.querySelectorAll('[data-month]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.month) === selected)));
    if (!plan) return;
    const item = plan.find(p => p.month === selected);
    monthCard.classList.remove('is-new'); void monthCard.offsetWidth; monthCard.classList.add('is-new');
    monthCard.innerHTML = item
      ? `<p class="month-card-label">${selected === now ? 'Tháng này' : 'Tháng ' + selected} · ${escape(item.label)}</p><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p>`
      : '<p>Chưa có gợi ý cho tháng này. Mở lịch lớp 12 để xem đủ 12 tháng.</p>';
  }

  strip.addEventListener('click', event => {
    const button = event.target.closest('[data-month]');
    if (!button) return;
    selected = Number(button.dataset.month);
    renderMonth();
  });

  whenNear(monthCard, async () => {
    try {
      const html = await fetch('/calendar.html', { signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); });
      const doc = new DOMParser().parseFromString(html, 'text/html');
      plan = [...doc.querySelectorAll('.study-plan-month')].map(d => ({
        month: Number((d.querySelector('.study-plan-number')?.textContent || '').replace(/\D/g, '')),
        label: d.querySelector('summary span:last-child')?.textContent.trim() || '',
        title: d.querySelector('h3')?.textContent.trim() || '',
        text: d.querySelector('div p')?.textContent.trim() || '',
      })).filter(p => p.month);
      renderMonth();
    } catch {
      monthCard.innerHTML = '<p>Chưa tải được gợi ý theo tháng. Mở lịch lớp 12 bên dưới để xem trực tiếp.</p>';
    }
  });
}

/* ---------- Waybi speaks to where you are ---------- */
function personalizeWaybi() {
  const code = flow()?.holland();
  const line = document.querySelector('[data-waybi-line="1"]');
  if (code && line) line.textContent = `Mã của bạn là ${code}. Muốn mình giải thích từng chữ và nghề nào hợp nhất không?`;
}

/* ---------- The glowing opening: see-through nav, this year's months, the saved Holland code ---------- */
function initGlowHero() {
  const hero = document.querySelector('.glow-hero');
  if (!hero) return;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => document.body.classList.toggle('bw-nav-glass', e.isIntersecting), { rootMargin: '-72px 0px 0px 0px', threshold: 0 }).observe(hero);
  }
  const months = hero.querySelector('[data-glow-months]');
  if (months) {
    const order = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8], now = tzMonth();
    months.innerHTML = order.map(m => `<li class="${m === now ? 'is-now' : order.indexOf(m) < order.indexOf(now) ? 'is-past' : ''}"${m === now ? ' aria-current="date"' : ''}>T${m}</li>`).join('');
    const link = hero.querySelector('[data-glow-month]');
    if (link) link.textContent = `Tháng ${now}: xem việc cần làm`;
  }
  const paint = () => {
    const code = flow()?.holland() || '';
    hero.querySelectorAll('.glow-chip').forEach(chip => chip.classList.toggle('is-picked', code.includes(chip.firstChild.textContent.trim())));
    const foot = hero.querySelector('[data-glow-holland]');
    if (foot) foot.textContent = code ? `Mã của bạn: ${code}. Xem nghề hợp với mã ở chương 2` : 'Chọn 3 nhóm giống bạn nhất ở chương 1';
  };
  paint();
  addEventListener('bw:journey-change', paint);
  document.addEventListener('bw:holland-pick', paint);
}

/* ---------- Start ---------- */
let travellers;
function start() {
  renderProgress({ fold: true });
  initGlowHero();
  travellers = initTravellers();
  initRails();
  initArt();
  personalizeWaybi();
  addEventListener('bw:journey-change', () => { renderProgress(); personalizeWaybi(); travellers?.refresh(); });
}
if (story) {
  if (flow()) start(); else addEventListener('DOMContentLoaded', start, { once: true });
}
