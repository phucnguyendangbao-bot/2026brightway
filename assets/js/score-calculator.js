// score-calculator.js
// Tính điểm tổng hợp + gợi ý trường phù hợp

const COMBO_SUBJECTS = {
  A00: ['math', 'phy', 'che'],
  A01: ['math', 'phy', 'eng'],
  A02: ['math', 'phy', 'bio'],
  B00: ['math', 'che', 'bio'],
  C00: ['lit', 'his', 'geo'],
  C01: ['lit', 'math', 'his'],
  C02: ['lit', 'math', 'geo'],
  C03: ['lit', 'math', 'civ'],
  D01: ['lit', 'math', 'eng'],
  D07: ['math', 'che', 'eng'],
  D08: ['math', 'bio', 'eng'],
  D09: ['math', 'his', 'eng'],
  D10: ['math', 'geo', 'eng'],
  D11: ['lit', 'phy', 'eng'],
};

const SUBJECT_LABELS = {
  math: 'Toán',
  lit: 'Văn',
  eng: 'Anh',
  phy: 'Lý',
  che: 'Hóa',
  bio: 'Sinh',
  his: 'Sử',
  geo: 'Địa',
  civ: 'GDCD',
};

const SUBJECT_INPUT_IDS = {
  math: 'sMath',
  lit: 'sLit',
  eng: 'sEng',
  phy: 'sPhy',
  che: 'sChe',
  bio: 'sBio',
  his: 'sHis',
  geo: 'sGeo',
  civ: 'sCiv',
};

// Điểm chuẩn tham khảo 2024-2025 theo tổ hợp (một số trường phổ biến)
// Cập nhật theo thông tin công bố; dùng để so sánh
const BENCHMARK_SCORES = {
  // THPTQG thang 30
  thptqg: {
    hcmut: { A00: 26.0, A01: 25.5, B00: 25.0, D07: 25.5 },
    uit: { A00: 24.0, A01: 24.5, D01: 24.0, D07: 23.5 },
    hcmus: { A00: 25.5, B00: 25.0, D07: 24.5 },
    ueh: { A00: 24.5, A01: 24.0, C00: 25.5, D01: 25.0 },
    ftu: { A00: 26.5, A01: 26.0, D01: 26.5, D07: 26.0 },
    vlu: { A00: 22.0, C00: 23.0, D01: 22.5, D07: 21.5 },
    hub: { A00: 24.0, A01: 24.5, D01: 24.5, D07: 24.0 },
    hcmue: { A00: 23.0, C00: 24.0, D01: 23.5 },
    ctu: { A00: 22.5, A01: 22.0, B00: 22.0, D01: 22.5 },
    tdtu: { A00: 24.0, D01: 24.0, D07: 23.5 },
    nlu: { A00: 21.5, B00: 21.0, D07: 21.5 },
    fpt: { A00: 22.0, D01: 22.5, D07: 21.5 },
    dut: { A00: 24.5, A01: 24.0, D07: 24.0 },
    due: { A00: 23.5, A01: 23.0, D01: 23.5, D07: 23.0 },
    huemed: { B00: 26.5, A02: 26.0 },
    pnt: { B00: 26.0, A02: 25.5 },
    duytan: { A00: 22.0, D01: 22.5, D07: 21.5 },
    uel: { A00: 23.5, C00: 24.0, D01: 24.0, D07: 23.5 },
    ussh: { C00: 25.0, D01: 25.5, D02: 25.0 },
    hue_uni: { A00: 21.0, C00: 21.5, D01: 21.5 },
    huaf: { A00: 20.5, B00: 20.0, D07: 20.5 },
    husc: { A00: 21.0, A01: 20.5, C00: 21.5 },
    hucfl: { C00: 22.0, C03: 21.5, D01: 22.0 },
    qnu: { A00: 20.0, C00: 21.0, D01: 20.5 },
    ntu: { A00: 20.0, B00: 19.5, D07: 20.0 },
    vku: { A00: 22.0, A01: 22.5, D01: 22.0, D07: 21.5 },
    dnu: { A00: 21.5, C00: 22.0, D01: 22.0, D07: 21.0 },
    sgu: { A00: 22.0, C00: 23.0, D01: 22.5, D07: 22.0 },
    hcmiu: { A00: 23.0, D01: 23.5, D07: 22.5 },
    hufi: { A00: 21.0, D01: 21.5, D07: 20.5 },
    khtn_hcm: { A00: 24.0, B00: 24.0, D07: 23.5 },
    nttu: { A00: 20.0, A01: 20.5, D01: 20.5, D07: 20.0 },
  },
  // V-ACT thang 30 (quy đổi từ 1500)
  vact: {
    hcmut: 27.0, uit: 25.0, hcmus: 26.0, ueh: 25.0,
    ftu: 27.5, vlu: 22.5, hub: 24.5, tdtu: 24.5,
    fpt: 23.0, nlu: 21.5, hcmiu: 23.0, hufi: 21.0,
    duytan: 22.0, due: 23.5, uel: 24.0, sgu: 22.0,
    vku: 22.5, dnu: 22.0, hue_uni: 21.0,
  },
  // HSA thang 30 (quy đổi từ 1500)
  hsa: {
    ussh: 26.0, ftu: 27.5, vlu: 22.5, due: 23.5,
    hue_uni: 21.5, huaf: 20.5, husc: 21.0, hucfl: 22.0,
    qnu: 20.5, ntu: 20.0, vku: 22.5, dnu: 22.0,
  },
  // TSA thang 30
  tsa: { dut: 26.0, vlu: 23.0 },
  // V-SAT thang 30
  vsat: { ctu: 23.0, hub: 24.5, sgu: 22.0, ueh: 25.0, duytan: 22.0 },
  // H-SCA thang 30
  hsca: { hcmue: 24.0, hufi: 21.0 },
};

let SCHOOLS = [];

async function loadSchools() {
  try {
    const res = await fetch('assets/data/schools.json', { cache: 'no-store' });
    const data = await res.json();
    SCHOOLS = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('loadSchools failed', err);
    SCHOOLS = [];
  }
}

function readScore(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return isNaN(v) || v < 0 ? 0 : Math.min(v, 10);
}

function readInput(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return isNaN(v) || v < 0 ? 0 : v;
}

function getSelectedCombo() {
  const checked = document.querySelector('input[name="combo"]:checked');
  return checked ? checked.value : 'A00';
}

function calcComboScore(combo) {
  const subjects = COMBO_SUBJECTS[combo] || [];
  const scores = subjects.map(s => readScore(SUBJECT_INPUT_IDS[s]));
  if (scores.some(s => s === 0)) {
    return { score: 0, missing: subjects.filter((s, i) => scores[i] === 0).map(s => SUBJECT_LABELS[s]) };
  }
  return { score: scores.reduce((a, b) => a + b, 0), missing: [] };
}

// Quy đổi điểm ĐGNL về thang 30
function normalizeDgnl(value, max) {
  if (!value || value <= 0) return 0;
  return (value / max) * 30;
}

function calcAll() {
  const combo = getSelectedCombo();
  const comboResult = calcComboScore(combo);

  const vact = readInput('sVact');
  const hsa = readInput('sHsa');
  const tsa = readInput('sTsa');
  const vsat = readInput('sVsat');
  const hsca = readInput('sHsca');

  const vact30 = normalizeDgnl(vact, 1500);
  const hsa30 = normalizeDgnl(hsa, 1500);
  const tsa30 = normalizeDgnl(tsa, 100);
  const vsat30 = normalizeDgnl(vsat, 100);
  const hsca30 = normalizeDgnl(hsca, 100);

  // Render summary
  document.getElementById('sumCombo').textContent = comboResult.score > 0 ? comboResult.score.toFixed(2) : '—';
  document.getElementById('sumCombo').classList.toggle('empty', comboResult.score === 0);
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    el.textContent = val > 0 ? val.toFixed(2) : '—';
    el.classList.toggle('empty', val === 0);
  };
  setEl('sumVact', vact30);
  setEl('sumHsa', hsa30);
  setEl('sumTsa', tsa30);
  setEl('sumVsat', vsat30);
  setEl('sumHsca', hsca30);

  document.getElementById('resultSummary').hidden = false;
  document.getElementById('resultEmpty').hidden = true;

  if (comboResult.missing.length > 0) {
    document.getElementById('resultSchools').hidden = true;
    document.getElementById('resultSummary').insertAdjacentHTML('beforeend',
      `<div class="result-tip" style="margin-top:14px;color:#b45309;">⚠ Vui lòng nhập đầy đủ điểm 3 môn: <strong>${comboResult.missing.join(', ')}</strong> để xem gợi ý trường.</div>`
    );
    return;
  }

  // So sánh với benchmark
  const results = [];
  const thptqg = BENCHMARK_SCORES.thptqg;
  Object.entries(thptqg).forEach(([schoolId, scores]) => {
    const bench = scores[combo];
    if (!bench) return;
    const school = SCHOOLS.find(s => s.id === schoolId || s.id === schoolId.replace('_', '-'));
    if (!school) return;

    const diff = comboResult.score - bench;
    let grade, badge, badgeClass;
    if (diff >= 2) { grade = 'good'; badge = 'Rất khả thi'; badgeClass = 'good'; }
    else if (diff >= 0) { grade = 'mid'; badge = 'Cạnh tranh'; badgeClass = 'mid'; }
    else if (diff >= -1.5) { grade = 'low'; badge = 'Khó trúng'; badgeClass = 'low'; }
    else { grade = 'low'; badge = 'Rất khó'; badgeClass = 'low'; }

    results.push({
      school,
      userScore: comboResult.score,
      benchScore: bench,
      diff,
      grade,
      badge,
      badgeClass,
    });
  });

  // Sắp xếp theo diff giảm dần
  results.sort((a, b) => b.diff - a.diff);

  // Render
  const listEl = document.getElementById('schoolList');
  listEl.innerHTML = results.map(r => {
    const logoHtml = (window.UNILogoImg && r.school.short)
      ? window.UNILogoImg(r.school.short, { size: 36 })
      : `<span>${r.school.logoFallback || '🏫'}</span>`;
    return `
      <div class="school-row grade-${r.grade}">
        <div class="school-row-logo">${logoHtml}</div>
        <div class="school-row-body">
          <div class="school-row-name">${r.school.name}</div>
          <div class="school-row-meta">
            <span>📍 ${r.school.city}</span>
            <span>•</span>
            <span>📊 Chuẩn ${combo}: ${r.benchScore}</span>
          </div>
        </div>
        <div class="school-row-score">
          <div class="label">Điểm của bạn</div>
          <div class="value">${r.userScore.toFixed(2)}</div>
        </div>
        <div class="school-row-badge ${r.badgeClass}">
          ${r.badge} ${r.diff >= 0 ? '+' : ''}${r.diff.toFixed(1)}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('resultSchools').hidden = false;

  // Lưu lịch sử vào localStorage
  try {
    const history = JSON.parse(localStorage.getItem('score-calc-history') || '[]');
    history.unshift({
      ts: Date.now(),
      combo,
      comboScore: comboResult.score,
      vact, hsa, tsa, vsat, hsca,
    });
    localStorage.setItem('score-calc-history', JSON.stringify(history.slice(0, 10)));
  } catch (e) { /* ignore */ }
}

function resetAll() {
  ['sMath','sLit','sEng','sPhy','sChe','sBio','sHis','sGeo','sCiv',
   'sVact','sHsa','sTsa','sVsat','sHsca'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('has-value'); }
  });
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('resultEmpty').hidden = false;
}

function attachListeners() {
  document.getElementById('calcBtn').addEventListener('click', calcAll);
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  // Highlight input khi có giá trị
  document.querySelectorAll('.score-input input, .dgnl-input input').forEach(inp => {
    inp.addEventListener('input', () => {
      inp.classList.toggle('has-value', inp.value.trim() !== '');
    });
  });

  // Filter trường (tùy chọn mở rộng)
  document.getElementById('schoolFilter').addEventListener('input', (e) => {
    // Có thể mở rộng: filter kết quả gợi ý theo tên
  });
}

(async function init() {
  await loadSchools();
  attachListeners();
})();
