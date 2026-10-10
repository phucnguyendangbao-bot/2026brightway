// score-calculator.js
// Tính điểm tổng hợp + gợi ý trường phù hợp dựa trên cutoffScores trong schools.json

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
  math: 'Toán', lit: 'Văn', eng: 'Anh', phy: 'Lý', che: 'Hóa',
  bio: 'Sinh', his: 'Sử', geo: 'Địa', civ: 'GDCD',
};

const SUBJECT_INPUT_IDS = {
  math: 'sMath', lit: 'sLit', eng: 'sEng', phy: 'sPhy', che: 'sChe',
  bio: 'sBio', his: 'sHis', geo: 'sGeo', civ: 'sCiv',
};

// Hệ số DGNL theo từng trường (phụ thuộc đề án)
const DGNL_FIELDS = {
  vact: { label: 'V-ACT', max: 1500, source: 'ĐHQG-HCM' },
  hsa:  { label: 'HSA',   max: 1500, source: 'ĐHQG-HN' },
  tsa:  { label: 'TSA',   max: 100,  source: 'ĐHBK-HN' },
  vsat: { label: 'V-SAT', max: 100,  source: 'ĐH Cần Thơ' },
  hsca: { label: 'H-SCA', max: 100,  source: 'ĐHSP TPHCM' },
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
    return {
      score: 0,
      missing: subjects.filter((s, i) => scores[i] === 0).map(s => SUBJECT_LABELS[s]),
    };
  }
  return { score: scores.reduce((a, b) => a + b, 0), missing: [] };
}

function getDgnlValues() {
  return {
    vact: readInput('sVact'),
    hsa:  readInput('sHsa'),
    tsa:  readInput('sTsa'),
    vsat: readInput('sVsat'),
    hsca: readInput('sHsca'),
  };
}

// Tính điểm người dùng cho từng phương thức dựa trên đề án trường
function calcUserScoreByMethod(school, combo, comboScore, dgnl) {
  const results = [];
  const cutoff = school.cutoffScores || {};

  // 1. THPTQG
  const thptqg = cutoff.thptqg;
  if (thptqg && thptqg[combo] != null) {
    results.push({
      method: 'thptqg',
      methodLabel: '🎯 Xét điểm thi THPT',
      userScore: comboScore,
      benchScore: thptqg[combo],
      userScoreLabel: comboScore.toFixed(2),
      benchScoreLabel: thptqg[combo].toFixed(2),
      unit: '/30',
    });
  }

  // 2. Học bạ
  const hocba = cutoff.hocba;
  if (hocba && hocba[combo] != null) {
    // Ước lượng điểm học bạ: giả định thí sinh học đều ≈ điểm thi - 0.5
    const estimatedHb = comboScore > 0 ? Math.max(0, comboScore - 0.5) : 0;
    results.push({
      method: 'hocba',
      methodLabel: '📚 Xét học bạ THPT',
      userScore: estimatedHb,
      benchScore: hocba[combo],
      userScoreLabel: estimatedHb > 0 ? `~${estimatedHb.toFixed(2)} (ước lượng)` : '—',
      benchScoreLabel: hocba[combo].toFixed(2),
      unit: '/30',
      estimated: true,
    });
  }

  // 3. ĐGNL
  const dgnlCutoff = cutoff.dgnl;
  if (dgnlCutoff) {
    Object.entries(dgnlCutoff).forEach(([key, bench]) => {
      if (bench == null) return;
      const userVal = dgnl[key] || 0;
      const meta = DGNL_FIELDS[key];
      if (!meta) return;
      results.push({
        method: `dgnl-${key}`,
        methodLabel: `📊 ${meta.label} (${meta.source})`,
        userScore: userVal,
        benchScore: bench,
        userScoreLabel: userVal > 0 ? userVal.toFixed(1) : '—',
        benchScoreLabel: bench.toFixed(0),
        unit: `/${meta.max}`,
        needDgnl: userVal === 0,
      });
    });
  }

  // 4. TSA (nếu trường có trong cutoff, có thể đã nằm trong dgnl)
  if (cutoff.tsa != null) {
    const tsaVal = dgnl.tsa || 0;
    results.push({
      method: 'tsa',
      methodLabel: '🧪 TSA (ĐHBK-HN)',
      userScore: tsaVal,
      benchScore: cutoff.tsa,
      userScoreLabel: tsaVal > 0 ? tsaVal.toFixed(1) : '—',
      benchScoreLabel: cutoff.tsa.toFixed(0),
      unit: '/100',
      needDgnl: tsaVal === 0,
    });
  }

  return results;
}

function gradeResult(diff) {
  if (diff >= 2) return { grade: 'good', badge: 'Rất khả thi', cls: 'good' };
  if (diff >= 0) return { grade: 'mid', badge: 'Cạnh tranh', cls: 'mid' };
  if (diff >= -1.5) return { grade: 'low', badge: 'Khó trúng', cls: 'low' };
  return { grade: 'low', badge: 'Rất khó', cls: 'low' };
}

function calcAll() {
  const combo = getSelectedCombo();
  const comboResult = calcComboScore(combo);
  const dgnl = getDgnlValues();

  // Summary
  document.getElementById('sumCombo').textContent = comboResult.score > 0 ? comboResult.score.toFixed(2) : '—';
  document.getElementById('sumCombo').classList.toggle('empty', comboResult.score === 0);
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    el.textContent = val > 0 ? val.toFixed(2) : '—';
    el.classList.toggle('empty', val === 0);
  };
  setEl('sumVact', dgnl.vact > 0 ? (dgnl.vact / 1500) * 30 : 0);
  setEl('sumHsa',  dgnl.hsa  > 0 ? (dgnl.hsa  / 1500) * 30 : 0);
  setEl('sumTsa',  dgnl.tsa  > 0 ? (dgnl.tsa  / 100)  * 30 : 0);
  setEl('sumVsat', dgnl.vsat > 0 ? (dgnl.vsat / 100)  * 30 : 0);
  setEl('sumHsca', dgnl.hsca > 0 ? (dgnl.hsca / 100)  * 30 : 0);

  document.getElementById('resultSummary').hidden = false;
  document.getElementById('resultEmpty').hidden = true;

  // Xóa cảnh báo cũ
  const oldWarn = document.querySelector('.result-tip.warn');
  if (oldWarn) oldWarn.remove();

  if (comboResult.missing.length > 0) {
    document.getElementById('resultSchools').hidden = true;
    document.getElementById('resultSummary').insertAdjacentHTML('beforeend',
      `<div class="result-tip warn" style="margin-top:14px;color:#b45309;">⚠ Vui lòng nhập đầy đủ điểm 3 môn: <strong>${comboResult.missing.join(', ')}</strong> để xem gợi ý trường.</div>`
    );
    return;
  }

  // Tính kết quả cho từng trường
  const results = [];
  SCHOOLS.forEach(school => {
    if (!school.cutoffScores) return;
    const methodResults = calcUserScoreByMethod(school, combo, comboResult.score, dgnl);
    if (methodResults.length === 0) return;

    // Tìm kết quả tốt nhất theo từng phương thức
    methodResults.forEach(mr => {
      if (mr.needDgnl) return; // Bỏ qua nếu chưa nhập điểm
      const diff = mr.userScore - mr.benchScore;
      const gr = gradeResult(diff);
      results.push({
        school,
        method: mr,
        diff,
        grade: gr.grade,
        badge: gr.badge,
        cls: gr.cls,
      });
    });
  });

  // Sắp xếp theo diff giảm dần
  results.sort((a, b) => b.diff - a.diff);

  // Render
  const listEl = document.getElementById('schoolList');
  if (results.length === 0) {
    listEl.innerHTML = '<div class="result-empty"><p>Không tìm thấy dữ liệu điểm chuẩn cho tổ hợp này.</p></div>';
  } else {
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
              <span>${r.method.methodLabel}</span>
              ${r.method.estimated ? '<span>•</span><span style="color:#b45309;">(ước lượng)</span>' : ''}
            </div>
          </div>
          <div class="school-row-score">
            <div class="label">Điểm bạn / Chuẩn</div>
            <div class="value">${r.method.userScoreLabel} / ${r.method.benchScoreLabel}</div>
          </div>
          <div class="school-row-badge ${r.cls}">
            ${r.badge} ${r.diff >= 0 ? '+' : ''}${r.diff.toFixed(1)}
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('resultSchools').hidden = false;

  // Lưu lịch sử
  try {
    const history = JSON.parse(localStorage.getItem('score-calc-history') || '[]');
    history.unshift({
      ts: Date.now(),
      combo,
      comboScore: comboResult.score,
      dgnl,
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
  const warn = document.querySelector('.result-tip.warn');
  if (warn) warn.remove();
}

function attachListeners() {
  document.getElementById('calcBtn').addEventListener('click', calcAll);
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  document.querySelectorAll('.score-input input, .dgnl-input input').forEach(inp => {
    inp.addEventListener('input', () => {
      inp.classList.toggle('has-value', inp.value.trim() !== '');
    });
  });
}

(async function init() {
  await loadSchools();
  attachListeners();
})();
