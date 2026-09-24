// cv-review.js — extracted từ cv-review.html (Phase 2 — kiến trúc)
// Loaded với <script type="module"> nên file chạy đúng 1 lần (module scope).
// Các hàm dùng bởi inline onclick tạm thời vẫn được gán lên window để không vỡ UI;
// sẽ migrate sang addEventListener ở commit riêng (xem todo onclick-replace).

// ── CV Input (textarea) ──
function updateCvCounter() {
  const ta = document.getElementById('cvInput');
  const counter = document.getElementById('cvCounter');
  if (!ta || !counter) return;
  const len = ta.value.length;
  counter.textContent = len.toLocaleString('vi-VN') + ' ký tự';
}

function toggleOpt(label) {
  label.classList.toggle('selected');
  label.querySelector('input').checked = label.classList.contains('selected');
}

function getSelectedOpts() {
  const cards = document.querySelectorAll('.opt-card');
  const selected = [];
  cards.forEach(c => { if (c.classList.contains('selected')) selected.push(c.querySelector('.opt-name').textContent); });
  return selected;
}

function setStepDone(step) {
  document.getElementById('step' + step + 'Num').className = 'step-num done';
  document.getElementById('step' + step + 'Label').className = 'step-label done';
  if (step < 3) document.getElementById('line' + step).classList.add('done');
}
function setStepActive(step) {
  document.getElementById('step' + step + 'Num').className = 'step-num active';
  document.getElementById('step' + step + 'Label').className = 'step-label active';
}

// ── Submit ──
async function submitCV() {
  const cv = document.getElementById('cvInput').value.trim();
  if (cv.length < 100) {
    alert('Vui lòng dán nội dung Portfolio/Bài luận dài ít nhất 100 ký tự để AI có thể phân tích chính xác.');
    return;
  }
  const opts = getSelectedOpts();
  if (opts.length === 0) {
    alert('Vui lòng chọn ít nhất một tiêu chí đánh giá.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  setStepDone(1); setStepDone(2); setStepActive(3);

  // Show result area with loading state
  document.getElementById('formArea').style.display = 'none';
  document.getElementById('resultArea').style.display = 'block';
  document.getElementById('resultBlocks').innerHTML = '<div class="skeleton" style="height:64px;margin-bottom:10px;"></div><div class="skeleton" style="height:64px;margin-bottom:10px;"></div><div class="skeleton" style="height:64px;"></div>';

  const cvTruncated = cv.slice(0, 1500); // giới hạn để tránh JSON bị cắt

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'portfolio',
        content: cvTruncated,
        options: { criteria: opts }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || 'Lỗi API: ' + response.status;
      throw new Error(msg);
    }
    // Backend đã chuẩn hoá: trả về { reply: <raw text JSON>, ... }
    const raw = (data.reply || '').replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);
    renderResult(result);

  } catch (e) {
    document.getElementById('resultBlocks').innerHTML = `
      <div style="text-align:center;padding:24px;color:#dc2626;font-size:.88rem;line-height:1.8;">
        ⚠️ <strong>Lỗi:</strong> ${e.message}
      </div>`;
    console.error('CV Review Error:', e);
  }

  btn.classList.remove('loading');
  btn.disabled = false;
  setStepDone(3);
}

// ── Render ──
function renderResult(r) {
  // Score ring
  const score = Math.min(100, Math.max(0, r.score || 0));
  document.getElementById('scoreValue').innerHTML = score + '<span>/ 100</span>';
  document.getElementById('scoreLevel').textContent = r.level || '';
  document.getElementById('scoreVerdict').textContent = r.verdict || '';

  // Animate ring
  const circ = 2 * Math.PI * 35; // ~219.9
  const offset = circ - (score / 100) * circ;
  setTimeout(() => {
    const el = document.getElementById('scoreCircle');
    el.style.strokeDashoffset = offset;
    // Color based on score
    const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
    el.style.stroke = color;
  }, 100);

  // Blocks
  const container = document.getElementById('resultBlocks');
  container.innerHTML = '';

  (r.blocks || []).forEach((b, i) => {
    const goodsHtml = (b.goods || []).map(g => `<li class="good">${g}</li>`).join('');
    const badsHtml = (b.bads || []).map(g => `<li class="bad">${g}</li>`).join('');
    const tipsHtml = (b.tips || []).map(g => `<li class="tip">${g}</li>`).join('');
    const rewriteHtml = b.rewrite ? `<div class="rewrite-box"><span class="rewrite-box-label">✏️ Gợi ý viết lại:</span>${b.rewrite}</div>` : '';

    const block = document.createElement('div');
    block.className = 'result-block';
    block.id = 'block' + i;
    block.innerHTML = `
      <div class="result-block-head" data-action="toggle-block" data-block-index="${i}">
        <span class="result-block-icon">${b.icon || '📝'}</span>
        <span class="result-block-title">${b.title || ''}</span>
        <span class="result-block-badge badge-${b.status || 'info'}">${b.badge || ''}</span>
        <svg class="result-block-arrow" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="result-block-body collapsed" id="body${i}">
        <ul class="result-list">
          ${goodsHtml}${badsHtml}${tipsHtml}
        </ul>
        ${rewriteHtml}
      </div>`;
    container.appendChild(block);

    // Auto-open first block and danger/warn blocks
    if (i === 0 || b.status === 'danger') {
      setTimeout(() => toggleBlock(i), 200 + i * 100);
    }
  });

  // Lưu vào lịch sử + cập nhật section tiến triển
  saveProgress(r);
  renderProgressSection();
}

function toggleBlock(i) {
  const block = document.getElementById('block' + i);
  const body = document.getElementById('body' + i);
  const isOpen = !body.classList.contains('collapsed');
  body.classList.toggle('collapsed', isOpen);
  block.classList.toggle('open', !isOpen);
}

function resetForm() {
  document.getElementById('formArea').style.display = 'block';
  document.getElementById('resultArea').style.display = 'none';
  // Clear CV input + counter
  const ta = document.getElementById('cvInput');
  if (ta) { ta.value = ''; }
  updateCvCounter();
  // Reset steps
  document.getElementById('step1Num').className = 'step-num active';
  document.getElementById('step1Label').className = 'step-label active';
  ['2','3'].forEach(s => {
    document.getElementById('step'+s+'Num').className = 'step-num';
    document.getElementById('step'+s+'Label').className = 'step-label';
  });
  document.getElementById('line1').classList.remove('done');
  document.getElementById('line2').classList.remove('done');
}

function copyResult() {
  let text = 'KẾT QUẢ PHÂN TÍCH PORTFOLIO HỌC BỔNG - BrightWay Scholars\n\n';
  text += 'Điểm: ' + document.getElementById('scoreValue').textContent + '\n';
  text += 'Đánh giá: ' + document.getElementById('scoreLevel').textContent + '\n';
  text += 'Nhận xét: ' + document.getElementById('scoreVerdict').textContent + '\n\n';

  document.querySelectorAll('.result-block').forEach(b => {
    const title = b.querySelector('.result-block-title')?.textContent || '';
    const badge = b.querySelector('.result-block-badge')?.textContent || '';
    text += `--- ${title} (${badge}) ---\n`;
    b.querySelectorAll('.result-list li').forEach(li => {
      text += '• ' + li.textContent.trim() + '\n';
    });
    const rw = b.querySelector('.rewrite-box');
    if (rw) text += '\n' + rw.textContent.trim() + '\n';
    text += '\n';
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✅ Đã sao chép!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

// ══════════════════════════════════════════════════
// ── PROGRESS HISTORY (localStorage) ──
// ══════════════════════════════════════════════════
const PROGRESS_KEY = 'brightway_cv_history_v1';
const MAX_HISTORY = 12; // giữ tối đa 12 lần gần nhất

const RUBRIC_AXES = [
  { key:'leadership',    label:'Leadership',      icon:'🧭' },
  { key:'impact',        label:'Impact',          icon:'🎯' },
  { key:'clarity',       label:'Clarity',         icon:'🧱' },
  { key:'storytelling',  label:'Storytelling',    icon:'📖' },
  { key:'scholarshipFit',label:'Scholarship Fit', icon:'🎓' },
];

function loadHistory() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProgress(result) {
  if (!result || typeof result.score !== 'number') return;
  const history = loadHistory();
  history.push({
    ts: Date.now(),
    score: result.score,
    level: result.level || '',
    verdict: result.verdict || '',
    rubric: result.rubric || null,
  });
  // chỉ giữ MAX_HISTORY lần gần nhất
  while (history.length > MAX_HISTORY) history.shift();
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(history)); } catch {}
}

function clearProgressHistory() {
  if (!confirm('Xóa toàn bộ lịch sử phân tích portfolio? Hành động này không hoàn tác được.')) return;
  try { localStorage.removeItem(PROGRESS_KEY); } catch {}
  renderProgressSection();
}

function barColor(v) {
  if (v >= 80) return 'green';
  if (v >= 65) return '';
  return 'amber';
}

function renderProgressSection() {
  const history = loadHistory();
  const empty = document.getElementById('progressEmpty');
  const wrap  = document.getElementById('progressWrap');

  if (history.length === 0) {
    empty.style.display = 'block';
    wrap.style.display  = 'none';
    return;
  }

  empty.style.display = 'none';
  wrap.style.display  = 'block';

  const latest = history[history.length - 1];
  const prev   = history.length >= 2 ? history[history.length - 2] : null;

  // ── Top: overall + so sánh ──
  document.getElementById('progOverallNum').textContent = latest.score;
  document.getElementById('progOverallLabel').textContent =
    'Lần thứ ' + history.length;

  document.getElementById('progTopTitle').textContent =
    'Portfolio của bạn ở mức "' + (latest.level || '—') + '"';
  document.getElementById('progTopDesc').textContent =
    latest.verdict || '';

  const badge = document.getElementById('progBadge');
  if (prev) {
    const delta = latest.score - prev.score;
    badge.style.display = 'inline-flex';
    if (delta > 0) {
      badge.className = 'sb-badge-good';
      badge.textContent = '↑ +' + delta + ' điểm so với lần trước';
    } else if (delta < 0) {
      badge.className = 'sb-badge-bad';
      badge.textContent = '↓ ' + delta + ' điểm so với lần trước';
    } else {
      badge.className = 'sb-badge-neutral';
      badge.textContent = '= Giữ nguyên điểm so với lần trước';
    }
  } else {
    badge.style.display = 'none';
  }

  // ── Rubric 5 trục + so sánh ──
  const rubricBox = document.getElementById('progRubricItems');
  rubricBox.innerHTML = '';
  if (latest.rubric) {
    RUBRIC_AXES.forEach(ax => {
      const v = latest.rubric[ax.key];
      if (typeof v !== 'number') return;
      const prevV = prev && prev.rubric ? prev.rubric[ax.key] : null;
      let deltaHtml = '';
      if (typeof prevV === 'number') {
        const d = v - prevV;
        if (d > 0) deltaHtml = `<span class="sb-delta up">▲${d}</span>`;
        else if (d < 0) deltaHtml = `<span class="sb-delta down">▼${Math.abs(d)}</span>`;
      }
      const row = document.createElement('div');
      row.className = 'sb-item';
      row.innerHTML = `
        <div class="sb-item-label"><span class="sb-icon">${ax.icon}</span> ${ax.label}</div>
        <div class="sb-bar"><div class="sb-bar-fill ${barColor(v)}" style="width:${v}%"></div></div>
        <div class="sb-item-num">${v}${deltaHtml}</div>`;
      rubricBox.appendChild(row);
    });
  }

  // ── Line chart ──
  const chartWrap = document.getElementById('progressChartWrap');
  if (history.length >= 2) {
    chartWrap.style.display = 'block';
    document.getElementById('progressCount').textContent = history.length + ' lần';
    drawLineChart(history);
  } else {
    chartWrap.style.display = 'none';
  }
}

function drawLineChart(history) {
  const W = 600, H = 200, PAD_L = 36, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const n = history.length;

  // Y axis: 0–100
  const yTicks = [0, 25, 50, 75, 100];
  const yToPx = v => PAD_T + innerH - (v / 100) * innerH;
  const xToPx = i => n === 1 ? PAD_L + innerW/2 : PAD_L + (i / (n - 1)) * innerW;

  // Grid + Y labels
  let gridSvg = '';
  yTicks.forEach(t => {
    const y = yToPx(t);
    gridSvg += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="rgba(99,102,241,0.08)" stroke-width="1"/>`;
    gridSvg += `<text x="${PAD_L - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#9ca3af" font-family="sans-serif">${t}</text>`;
  });

  // Path
  const points = history.map((h, i) => `${xToPx(i)},${yToPx(h.score)}`);
  const linePath = 'M' + points.join(' L');
  // Area dưới line
  const areaPath = linePath +
    ` L${xToPx(n-1)},${yToPx(0)} L${xToPx(0)},${yToPx(0)} Z`;

  // Dots + score labels + x labels
  let dotsSvg = '';
  history.forEach((h, i) => {
    const cx = xToPx(i), cy = yToPx(h.score);
    const color = h.score >= 80 ? '#059669' : h.score >= 65 ? '#6366f1' : '#d97706';
    dotsSvg += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    // Score label phía trên dot
    dotsSvg += `<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}" font-family="sans-serif">${h.score}</text>`;
    // X label: "Lần N" hoặc ngày
    const lbl = 'L' + (i + 1);
    dotsSvg += `<text x="${cx}" y="${H - 14}" text-anchor="middle" font-size="9" fill="#6b7280" font-family="sans-serif">${lbl}</text>`;
    // Date nhỏ phía dưới
    const d = new Date(h.ts);
    const dateStr = (d.getMonth()+1) + '/' + d.getDate();
    dotsSvg += `<text x="${cx}" y="${H - 3}" text-anchor="middle" font-size="8" fill="#9ca3af" font-family="sans-serif">${dateStr}</text>`;
  });

  const svg = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridSvg}
      <path d="${areaPath}" fill="url(#lineAreaGrad)"/>
      <path d="${linePath}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dotsSvg}
    </svg>`;
  document.getElementById('progressChart').innerHTML = svg;
}

// ── Event delegation thay cho inline onclick/oninput ──
//
// Khi bọc trong <script type="module">, các hàm không còn ở global scope nên
// inline onclick="toggleOpt(this)" không hoạt động. Thay vào đó:
//   1. HTML gắn data-action="..." (xem cv-review.html).
//   2. JS gắn một listener duy nhất ở document, route theo data-action.
//   3. Element động (result-block-head) được render kèm data-action.
function attachListeners() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    switch (action) {
      case 'toggle-opt':
        toggleOpt(target);
        break;
      case 'submit-cv':
        submitCV();
        break;
      case 'reset-form':
        resetForm();
        break;
      case 'copy-result':
        copyResult();
        break;
      case 'clear-progress':
        clearProgressHistory();
        break;
      case 'toggle-block': {
        const idx = target.getAttribute('data-block-index');
        if (idx != null) toggleBlock(parseInt(idx, 10));
        break;
      }
      default:
        // action không xác định → bỏ qua
        break;
    }
  });

  document.addEventListener('input', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'cv-input') {
      updateCvCounter();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    attachListeners();
    renderProgressSection();
  });
} else {
  attachListeners();
  renderProgressSection();
}
