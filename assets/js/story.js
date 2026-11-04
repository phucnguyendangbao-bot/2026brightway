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

/* ---------- The road ---------- */
function initRail() {
  const svg = story?.querySelector('.story-rail');
  if (!svg) return;
  const trail = svg.querySelector('.story-rail-trail');
  const road = svg.querySelector('.story-rail-road');
  const markers = [...story.querySelectorAll('.chapter-marker')];
  let stops = [];   // { y, length } for each marker
  let total = 0;
  let ticking = false;

  function layout() {
    const box = story.getBoundingClientRect();
    const first = document.getElementById('chuong-1');
    if (!first || !markers.length) return;
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const points = markers.map(m => { const r = m.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }; });
    const startY = Math.max(0, first.getBoundingClientRect().top - box.top - 72);
    const sway = box.width < 700 ? 8 : 28;
    let d = `M${points[0].x} ${startY}`;
    const segments = [`M${points[0].x} ${startY} L${points[0].x} ${points[0].y}`];
    d += ` L${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], dir = i % 2 ? 1 : -1, mid = (b.y - a.y) / 3;
      const seg = ` C${a.x + sway * dir} ${a.y + mid} ${b.x + sway * dir} ${b.y - mid} ${b.x} ${b.y}`;
      d += seg;
      segments.push(`M${a.x} ${a.y}${seg}`);
    }
    trail.setAttribute('d', d);
    road.setAttribute('d', d);
    // Measure each segment once so scroll updates are a lookup, not geometry.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(probe);
    let length = 0;
    stops = segments.map((seg, i) => { probe.setAttribute('d', seg); length += probe.getTotalLength(); return { y: points[i].y, length }; });
    stops.unshift({ y: startY, length: 0 });
    probe.remove();
    total = length;
    road.style.strokeDasharray = `${total} ${total}`;
    update();
  }

  function lengthAt(y) {
    if (y <= stops[0].y) return 0;
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1], b = stops[i];
      if (y <= b.y) return a.length + (b.length - a.length) * ((y - a.y) / (b.y - a.y || 1));
    }
    return total;
  }

  function savedLength() {
    // Without scroll-linked motion the road shows how far this visitor has actually come.
    const steps = flow()?.progress() || [];
    const done = steps.filter(step => step.complete).length;
    return done ? stops[Math.min(done, stops.length - 1)].length : 0;
  }

  function update() {
    ticking = false;
    if (!stops.length) return;
    const top = story.getBoundingClientRect().top;
    const reach = reduced.matches ? savedLength() : lengthAt(innerHeight * 0.6 - top);
    road.style.strokeDashoffset = String(total - reach);
    markers.forEach((marker, i) => marker.classList.toggle('is-reached', reach >= stops[i + 1].length - 1));
  }

  addEventListener('scroll', () => { if (!ticking && !reduced.matches) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  reduced.addEventListener?.('change', update);
  if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(layout)).observe(story);
  else addEventListener('resize', layout);
  addEventListener('load', layout);
  layout();
  return { refresh: update };
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
    chapter.querySelector('.chapter-marker')?.classList.toggle('is-done', step.complete);
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
  document.querySelector('.home-journey-picker')?.classList.add('is-returning');
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-chapter-toggle]');
  if (!toggle) return;
  const chapter = toggle.closest('.story-chapter');
  setOpen(chapter, toggle.getAttribute('aria-expanded') !== 'true');
  rail?.refresh();
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

/* ---------- Start ---------- */
let rail;
function start() {
  rail = initRail();
  renderProgress({ fold: true });
  personalizeWaybi();
  addEventListener('bw:journey-change', () => { renderProgress(); personalizeWaybi(); rail?.refresh(); });
}
if (story) {
  if (flow()) start(); else addEventListener('DOMContentLoaded', start, { once: true });
}
