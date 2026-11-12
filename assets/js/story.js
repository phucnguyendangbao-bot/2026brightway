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
  // The travelled part of the line is revealed by sliding two nested layers (no stroke redraw per frame).
  for (const it of items) {
    const box = document.createElement('div');
    box.className = 'ks-wave-box';
    it.wave.before(box);
    box.append(it.wave);
    const reveal = document.createElement('div');
    reveal.className = 'ks-wave-reveal';
    const inner = document.createElement('div');
    inner.className = 'ks-wave-reveal-inner';
    const solid = it.wave.cloneNode(false);
    solid.append(it.behind);
    inner.append(solid);
    reveal.append(inner);
    box.append(reveal);
    it.reveal = reveal; it.revealInner = inner;
  }
  const active = new Set();
  let ticking = false;

  function measure() {
    for (const it of items) {
      const r = it.chapter.getBoundingClientRect();
      it.top = r.top + scrollY; it.height = Math.max(1, r.height);
      const w = it.wave.getBoundingClientRect();
      it.width = w.width; it.waveH = w.height;
      it.total = it.behind.getTotalLength();
      it.samples = Array.from({ length: 41 }, (_, i) => it.behind.getPointAtLength(it.total * i / 40));
      it.shown = -1;
    }
    update(true);
  }

  // Read the scroll position and window height once per frame and hand them in: reading them again
  // between style writes would make the browser lay the page out once per chapter.
  let still = reduced.matches, vh = innerHeight;
  reduced.addEventListener?.('change', () => { still = reduced.matches; });
  addEventListener('resize', () => { vh = innerHeight; }, { passive: true });
  function progressOf(it, sy = scrollY) {
    if (still) return it.chapter.classList.contains('is-done') ? 1 : 0;
    return Math.max(0, Math.min(1, (sy + vh * 0.85 - it.top) / it.height));
  }

  function place(it, p) {
    const k = Math.round(p * 400) / 400;
    if (k === it.shown) return;
    it.shown = k;
    const pt = it.samples[Math.round(k * 40)] || { x: 0, y: 20 };
    const x = pt.x / 1000 * it.width, y = pt.y / 40 * it.waveH;
    it.traveller.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -78%)`;
    const hidden = (1 - Math.min(1, pt.x / 1000)) * 100;
    it.reveal.style.transform = `translate3d(${(-hidden).toFixed(2)}%, 0, 0)`;
    it.revealInner.style.transform = `translate3d(${hidden.toFixed(2)}%, 0, 0)`;
  }

  function update(all) {
    ticking = false;
    const sy = scrollY;
    for (const it of (all ? items : active)) place(it, progressOf(it, sy));
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
  // Re-measure only when the story really changes size (not on every observer tick).
  let lastSize = '';
  if ('ResizeObserver' in window) new ResizeObserver(entries => {
    const box = entries[0].contentRect, size = `${Math.round(box.width)}x${Math.round(box.height)}`;
    if (size !== lastSize) { lastSize = size; remeasure(); }
  }).observe(story);
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

function goTo(chapter, origin) {
  if (!chapter) return;
  setOpen(chapter, true);
  const land = () => {
    const title = chapter.querySelector('.chapter-title, h2');
    title?.setAttribute('tabindex', '-1');
    title?.focus({ preventScroll: true });
  };
  if (origin && !reduced.matches && portal(origin, () => { chapter.scrollIntoView({ behavior: 'auto', block: 'start' }); land(); arrive(chapter); })) return;
  chapter.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  land();
}

/* ---------- Start transition: light spreads out from the pressed button, the page moves underneath, then clears ---------- */
let portalBusy = false;
function portal(origin, jump) {
  if (portalBusy || !origin?.getBoundingClientRect || !Element.prototype.animate) return false;
  portalBusy = true;
  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
  const veil = document.createElement('div');
  veil.className = 'bw-portal';
  veil.setAttribute('aria-hidden', 'true');
  Object.assign(veil.style, { left: `${cx - radius}px`, top: `${cy - radius}px`, width: `${radius * 2}px`, height: `${radius * 2}px` });
  document.body.append(veil);
  const grow = veil.animate([{ transform: 'scale(0.02)', opacity: 0.9 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' });
  grow.finished.then(() => {
    jump();
    return veil.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.15)' }], { duration: 480, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'forwards' }).finished;
  }).catch(() => jump()).finally(() => { veil.remove(); portalBusy = false; });
  return true;
}
function arrive(section) {
  if (!Element.prototype.animate) return;
  const parts = [...section.querySelectorAll(':scope .ks-kicker, :scope .chapter-title, :scope .ks-intro, :scope .chapter-done, :scope h2')].slice(0, 4);
  parts.forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 120 + i * 90, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' }));
}

// The opening's start button, the table of contents and the side thread use the same transition.
document.addEventListener('click', event => {
  const link = event.target.closest('a.glow-cta[href^="#"], .ks-toc a.home-journey-card[href^="#"], .bw-rail a[href^="#"]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  if (target.classList.contains('story-chapter')) goTo(target, link);
  else if (reduced.matches || !portal(link, () => { target.scrollIntoView({ behavior: 'auto', block: 'start' }); arrive(target); })) target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', link.getAttribute('href'));
});

function setOpen(chapter, open) {
  const toggle = chapter.querySelector('[data-chapter-toggle]');
  const body = chapter.querySelector('.chapter-body');
  if (!toggle || !body || toggle.hidden) return;
  body.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Thu gọn' : 'Xem lại';
  chapter.classList.toggle('is-folded', !open);
}

/* ---------- What you already chose, shown plainly at the top of a finished chapter ---------- */
const HOLLAND_NAMES = { R: 'Kỹ thuật', I: 'Nghiên cứu', A: 'Nghệ thuật', S: 'Xã hội', E: 'Lãnh đạo', C: 'Nghiệp vụ' };
let schoolCatalog = null;
async function loadSchoolCatalog() {
  if (schoolCatalog) return schoolCatalog;
  try {
    const rows = await fetch('/assets/data/schools.json').then(r => r.ok ? r.json() : []);
    schoolCatalog = new Map((Array.isArray(rows) ? rows : []).map(row => [row.id, row]));
  } catch { schoolCatalog = new Map(); }
  renderProgress();
  return schoolCatalog;
}
const doneLink = (href, label, primary = false) => `<a class="done-action${primary ? ' is-primary' : ''}" href="${escape(href)}">${escape(label)}</a>`;
function doneCard(i, step) {
  const state = flow()?.read() || {};
  const head = title => `<p class="done-head"><span class="done-check" aria-hidden="true">✓</span><span class="done-badge">Đã xong</span>${escape(title)}</p>`;
  if (i === 0) {
    const code = flow()?.holland() || '';
    return head('Mã Holland của bạn') + `<ul class="done-chips">${[...code].map(c => `<li><b>${escape(c)}</b>${escape(HOLLAND_NAMES[c] || '')}</li>`).join('')}</ul>
      <div class="done-actions">${doneLink(`careers-holland.html?holland=${encodeURIComponent(code)}`, 'Xem nghề hợp mã →', true)}${doneLink('holland.html', 'Làm lại trắc nghiệm')}</div>`;
  }
  if (i === 1) {
    const names = [...new Set([state.career?.name, ...(state.savedCareers || []).map(item => item.name)].filter(Boolean))].slice(0, 4);
    return head('Nghề bạn đang quan tâm') + `<ul class="done-chips">${names.map(name => `<li><a href="careers-holland.html?q=${encodeURIComponent(name)}">${escape(name)}</a></li>`).join('')}</ul>
      <div class="done-actions">${doneLink('careers-holland.html', 'Khám phá thêm nghề')}</div>`;
  }
  if (i === 2) {
    const saved = (state.savedSchools || []).filter(item => item?.id);
    if (!schoolCatalog) loadSchoolCatalog();
    const card = item => {
      const info = schoolCatalog?.get(item.id) || {};
      const logo = /^assets\//.test(info.logoUrl || '') ? `<img src="/${escape(info.logoUrl)}" alt="" width="40" height="40" loading="lazy">` : `<span class="done-school-mono" aria-hidden="true">${escape((info.short || item.name || '?').slice(0, 4))}</span>`;
      return `<li><a class="done-school" href="page2.html?school=${encodeURIComponent(item.id)}">${logo}<span><strong>${escape(item.name || info.name || item.id)}</strong><small>${escape(item.city || info.city || '')}${item.city || info.city ? ' · ' : ''}Xem hồ sơ trường →</small></span></a></li>`;
    };
    return head(`Bạn đã lưu ${saved.length} trường`) + `<ul class="done-schools">${saved.slice(0, 6).map(card).join('')}</ul>
      ${saved.length > 6 ? `<p class="done-more">và ${saved.length - 6} trường khác trong danh sách của bạn.</p>` : ''}
      <p class="done-next">Bước tiếp: so sánh các trường đã lưu, rồi xếp thứ tự nguyện vọng.</p>
      <div class="done-actions">${doneLink('profile.html?tab=journey#my-choices', 'Xếp nguyện vọng →', true)}${doneLink('page2.html', saved.length > 1 ? 'So sánh trường đã lưu' : 'Tìm thêm trường')}</div>`;
  }
  if (i === 3) {
    return head('Kết quả tính điểm của bạn') + `<p class="done-text">${escape(state.scores?.summary || step.detail)}</p>
      <div class="done-actions">${doneLink('score-calculator.html', 'Mở lại kết quả →', true)}</div>`;
  }
  const tasks = state.tasks || [];
  return head('Kế hoạch hành động') + `<p class="done-text">${tasks.length ? `Đã xong ${tasks.filter(task => task.done).length}/${tasks.length} việc bạn tự đặt ra.` : escape(step.detail)}</p>
    <div class="done-actions">${doneLink('profile.html?tab=journey#action-plan', 'Xem kế hoạch →', true)}</div>`;
}

let resumeIntroPlayed = false;
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
    if (note) { note.hidden = !step.complete; note.innerHTML = step.complete ? doneCard(i, step) : ''; }
    if (toggle) toggle.hidden = !step.complete;
    if (toggle && !fold) toggle.textContent = toggle.getAttribute('aria-expanded') === 'true' ? 'Thu gọn' : 'Xem lại';
    if (fold && step.complete) setOpen(chapter, false);
  });

  // The opening's start button follows the journey: its orbit lights finished chapters, and once
  // something is done it becomes the one way to carry on (the welcome card then needs no button).
  const cta = document.querySelector('[data-cta]');
  if (cta) {
    const nextAt = steps.findIndex(step => !step.complete);
    cta.querySelectorAll('.cta-orbit i').forEach((dot, i) => {
      dot.classList.toggle('is-done', !!steps[i]?.complete);
      dot.classList.toggle('is-next', doneCount > 0 && i === nextAt);
    });
    const label = cta.querySelector('[data-cta-label]'), sub = cta.querySelector('[data-cta-sub]');
    if (!doneCount) { cta.setAttribute('href', '#muc-luc'); label.textContent = 'Bắt đầu'; sub.textContent = 'Hành trình 5\u00a0chương'; }
    else if (nextAt === -1) { cta.setAttribute('href', '#chuong-5'); label.textContent = 'Xem lại'; sub.textContent = 'Kế hoạch của bạn'; }
    else { cta.setAttribute('href', `#chuong-${nextAt + 1}`); label.textContent = 'Tiếp tục'; sub.textContent = `Chương\u00a0${nextAt + 1} · ${steps[nextAt].label.replace(/ /g, '\u00a0')}`; }
  }

  const resume = document.querySelector('[data-story-resume]');
  if (!resume) return;
  if (!doneCount) { resume.hidden = true; return; }
  const nextIndex = steps.findIndex(step => !step.complete);
  const all = nextIndex === -1;
  const target = all ? 4 : nextIndex;
  resume.hidden = false;
  // The first time a returning reader lands, the card plays a short welcome; later re-renders stay still.
  const intro = !resumeIntroPlayed && !reduced.matches;
  resumeIntroPlayed = true;
  resume.classList.toggle('is-intro', intro);
  resume.innerHTML = `<p class="story-resume-title"><span class="resume-hello">Chào bạn quay lại.</span> <span class="resume-progress">Bạn đã đi được <b data-resume-count>${intro ? 0 : doneCount}</b>/5 bước.</span></p>
    <ol class="story-resume-dots" aria-hidden="true">${steps.map((s, i) => `<li class="${s.complete ? 'is-done' : ''}" style="--d:${i}"></li>`).join('')}</ol>
    <button type="button" class="story-resume-go" data-resume-step="${target}">${all ? 'Xem lại kế hoạch hành động' : `Tiếp tục chương ${target + 1}: ${escape(steps[target].label)}`}</button>`;
  resume.querySelector('[data-resume-step]').addEventListener('click', event => goTo(chapterFor(target), event.currentTarget));
  if (cta) resume.querySelector('[data-resume-step]').hidden = true;
  if (intro) {
    const counter = resume.querySelector('[data-resume-count]');
    for (let n = 1; n <= doneCount; n++) setTimeout(() => { if (counter.isConnected) counter.textContent = n; }, 850 + n * 150);
    setTimeout(() => resume.classList.remove('is-intro'), 2600);
  }
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
    new IntersectionObserver(([e]) => { document.body.classList.toggle('bw-nav-glass', e.isIntersecting); setTimeout(() => document.body.classList.add('bw-nav-ready'), 400); }, { rootMargin: '-72px 0px 0px 0px', threshold: 0 }).observe(hero);
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
