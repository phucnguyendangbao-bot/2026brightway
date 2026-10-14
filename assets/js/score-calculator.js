// Công cụ 2026: chỉ tính những thành phần có công thức và đủ dữ liệu đầu vào.
// Không dùng cutoffScores của schools.json: dữ liệu đó không có ngành/năm/nguồn.
const COMBO_SUBJECTS = {
  A00: ['math', 'phy', 'che'], A01: ['math', 'phy', 'eng'],
  A02: ['math', 'phy', 'bio'], B00: ['math', 'che', 'bio'],
  C00: ['lit', 'his', 'geo'], C01: ['lit', 'math', 'phy'],
  C02: ['lit', 'math', 'che'], C03: ['lit', 'math', 'his'],
  C04: ['lit', 'math', 'geo'], D01: ['lit', 'math', 'eng'],
  D07: ['math', 'che', 'eng'], D08: ['math', 'bio', 'eng'],
  D09: ['math', 'his', 'eng'], D10: ['math', 'geo', 'eng'],
  D11: ['lit', 'phy', 'eng'],
};
const SUBJECTS = {
  math: ['sMath', 'Toán'], lit: ['sLit', 'Văn'], eng: ['sEng', 'Anh'],
  phy: ['sPhy', 'Lý'], che: ['sChe', 'Hóa'], bio: ['sBio', 'Sinh'],
  his: ['sHis', 'Sử'], geo: ['sGeo', 'Địa'],
};
const TRANSCRIPT_SUBJECTS = {
  math: ['hMath', 'Toán'], lit: ['hLit', 'Văn'], eng: ['hEng', 'Anh'],
  phy: ['hPhy', 'Lý'], che: ['hChe', 'Hóa'], bio: ['hBio', 'Sinh'],
  his: ['hHis', 'Sử'], geo: ['hGeo', 'Địa'],
};
const EXAMS = [
  { input: 'sVact', output: 'sumVact', max: 1200 },
  { input: 'sHsa', output: 'sumHsa', max: 150 },
  { input: 'sTsa', output: 'sumTsa', max: 100 },
];

const ADMISSIONS_2026 = [
  {
    id: 'fpt', name: 'Đại học FPT', short: 'FPTU',
    url: 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/thong-tin-tuyen-sinh-nam-2026/',
    type: 'fpt',
    note: 'ĐXT = (tổng điểm thi 3 môn + 3 × điểm TB cả năm lớp 12)/2 + điểm khuyến khích + điểm ưu tiên. Chỉ tổ hợp Axx/Cxx; Cxx không dùng cho CNTT và Khoa học máy tính. Người thi tốt nghiệp 2026 cần tổng 3 môn ≥15. Điểm hiển thị chưa cộng ưu tiên/khuyến khích và chưa xét ngành Luật.',
  },
  {
    id: 'ctu', name: 'Đại học Cần Thơ', short: 'CTU',
    url: 'https://tuyensinh.ctu.edu.vn/phuong-thuc-xet-tuyen/938-phuong-thuc-2.html',
    type: 'ctu',
    note: 'Phương thức 2: tổng 3 môn thi không nhân hệ số, cộng điểm ưu tiên. Trường chọn tổ hợp có điểm xét tuyển cao nhất; phải kiểm tra tổ hợp/ngưỡng đầu vào của ngành. Học bạ và V-SAT cần quy đổi riêng từng môn theo bảng 2026.',
    extraUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/1142-quy-ta-c-quy-doi-diem-trong-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.html',
    extraLabel: 'Quy tắc quy đổi',
  },
  {
    id: 'ueh', name: 'Đại học Kinh tế TP.HCM (UEH)', short: 'UEH',
    url: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026/',
    note: 'Phương thức tích hợp thang 100: điểm thi đã quy đổi × 60% + điểm trung bình các năm THPT × 40% + điểm cộng/ưu tiên. Cần đủ học bạ 3 năm và quy đổi kỳ thi theo UEH; không thể suy ra từ tổng 3 môn thi.',
  },
  {
    id: 'ump', name: 'Đại học Y Dược TP.HCM', short: 'UMP',
    url: 'https://ump.edu.vn/tuyen-sinh-dao-tao/dai-hoc/tuyen-sinh/10140/thong-tin-tuyen-sinh-dai-hoc-he-chinh-quy-nam-2026',
    note: 'Điểm xét tuyển phụ thuộc ngành, tổ hợp, điều kiện ngưỡng đầu vào và diện xét tuyển. Cần chọn ngành và kiểm tra thông báo chính thức trước khi đối chiếu điểm.',
  },
  {
    id: 'hcmue', name: 'Đại học Sư phạm TP.HCM', short: 'HCMUE',
    url: 'https://tuyensinh.hcmue.edu.vn/',
    note: 'Điểm trúng tuyển công bố theo tổ hợp gốc; tổ hợp khác có độ lệch riêng. Một số ngành dùng môn năng khiếu hoặc ĐGNL chuyên biệt. Tổng điểm 3 môn chưa phải điểm xét tuyển cuối cùng.',
  },
  {
    id: 'ftu', name: 'Đại học Ngoại thương', short: 'FTU',
    url: 'https://ftu.edu.vn/tuyensinh/dai-hoc-chinh-quy/ftu-th%C3%B4ng-tin-tuy%E1%BB%83n-sinh-chung/thong-tin-tuyen-sinh-chung-nam-2026',
    note: 'Có nhiều phương thức và bảng quy đổi tương đương 2026; học bạ chỉ dành cho nhóm đủ điều kiện riêng. Cần chọn phương thức, cơ sở và chương trình để tính điểm.',
  },
  {
    id: 'hcmus', name: 'Đại học Khoa học Tự nhiên – ĐHQG-HCM', short: 'HCMUS',
    url: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/',
    type: 'hcmus',
    note: 'Phương thức 2 tích hợp điểm thi THPT hoặc V-ACT với học bạ lớp 10–12 theo ngành. Thí sinh thi tốt nghiệp 2026 cần tổ hợp xét tuyển ≥15 hoặc Toán + Văn + một môn khác ≥15 (điểm gốc); nhiều ngành có điều kiện bổ sung.',
  },
  {
    id: 'uit', name: 'Đại học Công nghệ Thông tin – ĐHQG-HCM', short: 'UIT',
    url: 'https://tuyensinh.uit.edu.vn/',
    note: 'Cần xác định ngành, tổ hợp và phương thức 2026; các diện tích hợp/ĐGNL có quy tắc riêng. Không dùng phép chia tỷ lệ điểm V-ACT để ước tính điểm xét tuyển.',
  },
  {
    id: 'sgu', name: 'Đại học Sài Gòn', short: 'SGU',
    url: 'https://tuyensinh.sgu.edu.vn/index.php/tuyen-sinh/thong-tin-de-an-tuyen-sinh/nam-2026/thong-tin-tuyen-sinh-nam-2026-chinh-thuc',
    note: 'Đề án và các phụ lục tách riêng ngành, tổ hợp, quy đổi chứng chỉ và điểm cộng. Cần chọn đúng ngành/phương thức, đặc biệt với V-SAT hoặc môn năng khiếu.',
  },
];

function readBounded(id, max) {
  const input = document.getElementById(id);
  const raw = input.value.trim();
  if (raw === '') return { value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > max) {
    return { error: `${input.closest('label').querySelector('span').textContent}: nhập từ 0 đến ${max}.` };
  }
  return { value };
}

function calculate() {
  const combo = document.getElementById('comboSelect').value;
  const selected = COMBO_SUBJECTS[combo];
  const values = {};
  const errors = [];
  const missing = [];
  const transcriptValues = {};
  const transcriptMissing = [];
  for (const key of selected) {
    const result = readBounded(SUBJECTS[key][0], 10);
    if (result.error) errors.push(result.error);
    else if (result.value === null) missing.push(SUBJECTS[key][1]);
    else values[key] = result.value;
    const transcriptResult = readBounded(TRANSCRIPT_SUBJECTS[key][0], 10);
    if (transcriptResult.error) errors.push(transcriptResult.error);
    else if (transcriptResult.value === null) transcriptMissing.push(TRANSCRIPT_SUBJECTS[key][1]);
    else transcriptValues[key] = transcriptResult.value;
  }
  const grade12 = readBounded('sGrade12', 10);
  if (grade12.error) errors.push(grade12.error);
  const exams = {};
  for (const exam of EXAMS) {
    const result = readBounded(exam.input, exam.max);
    if (result.error) errors.push(result.error);
    exams[exam.input] = result.value;
  }
  const hasExam = missing.length === 0;
  const hasTranscript = transcriptMissing.length === 0;
  const startedExam = missing.length < selected.length;
  const startedTranscript = transcriptMissing.length < selected.length;
  if (startedExam && !hasExam) errors.push(`Điểm thi còn thiếu: ${missing.join(', ')}.`);
  if (startedTranscript && !hasTranscript) errors.push(`Điểm học bạ còn thiếu: ${transcriptMissing.join(', ')}.`);
  if (!startedExam && !startedTranscript) errors.push('Hãy nhập đủ 3 môn điểm thi THPT hoặc điểm học bạ.');
  if (errors.length) {
    showError(errors.join(' '));
    document.getElementById('resultSchools').hidden = true;
    document.getElementById('resultSummary').hidden = true;
    return;
  }
  clearError();
  const raw = hasExam ? selected.reduce((sum, key) => sum + values[key], 0) : null;
  const transcriptRaw = hasTranscript ? selected.reduce((sum, key) => sum + transcriptValues[key], 0) : null;
  document.getElementById('sumCombo').textContent = raw === null ? '—' : raw.toFixed(2);
  document.getElementById('sumTranscript').textContent = transcriptRaw === null ? '—' : transcriptRaw.toFixed(2);
  for (const exam of EXAMS) {
    const element = document.getElementById(exam.output);
    element.textContent = exams[exam.input] === null ? '—' : String(exams[exam.input]);
    element.classList.toggle('empty', exams[exam.input] === null);
  }
  document.getElementById('resultSummary').hidden = false;
  document.getElementById('resultSchools').hidden = false;
  document.getElementById('resultEmpty').hidden = true;
  renderSchools({ combo, raw, transcriptRaw, values, transcriptValues, grade12: grade12.value });
  const host = document.getElementById('scoreNextStep');
  host.hidden = false;
  window.BWFlow?.nextStep(host, 'Lập kế hoạch cho hồ sơ của bạn', 'Đối chiếu đề án trường, ghi lại các mốc tuyển sinh và chuẩn bị tài liệu cần thiết.', [['Lịch tuyển sinh', 'calendar.html'], ['Tài liệu & bài viết', 'resources.html'], ['Hồ sơ của tôi', 'profile.html']]);
}

function schoolOutcome(school, result) {
  if (school.type === 'fpt') {
    if (!/^[AC]/.test(result.combo)) return 'Tổ hợp đã chọn không thuộc Axx/Cxx trong đề án FPT 2026.';
    if (result.raw === null) return 'FPT cần điểm thi THPT của 3 môn trong tổ hợp để áp dụng công thức kết hợp này.';
    if (result.grade12 === null) return 'Nhập thêm điểm trung bình cả năm lớp 12 để tính điểm kết hợp.';
    const combined = (result.raw + result.grade12 * 3) / 2;
    return `Điểm kết hợp: <strong>${combined.toFixed(2)}/30</strong> (chưa cộng ưu tiên/khuyến khích). ${result.raw < 15 ? 'Tổng 3 môn thi chưa đạt điều kiện 15 điểm dành cho thí sinh thi tốt nghiệp 2026.' : 'Tổng 3 môn thi đạt mức 15 điểm tối thiểu; chưa phải kết luận trúng tuyển.'}`;
  }
  if (school.type === 'ctu') {
    const parts = [];
    if (result.raw !== null) parts.push(`Điểm thi: <strong>${result.raw.toFixed(2)}/30</strong>`);
    if (result.transcriptRaw !== null) parts.push(`Học bạ tổ hợp: <strong>${result.transcriptRaw.toFixed(2)}/30</strong>`);
    return `${parts.join(' · ')}. Điểm học bạ còn phải đối chiếu số học kỳ và quy tắc quy đổi theo ngành; chỉ áp dụng nếu ngành chấp nhận tổ hợp ${result.combo}.`;
  }
  if (school.type === 'hcmus') {
    if (result.raw === null) return `Điểm học bạ tổ hợp hiện có: <strong>${result.transcriptRaw.toFixed(2)}/30</strong>. Cần đủ dữ liệu lớp 10–12 và điều kiện ngành để tính phương thức tích hợp.`;
    return result.raw >= 15
      ? 'Tổng điểm tổ hợp đã chọn ≥15; vẫn cần xác nhận tổ hợp được ngành chấp nhận, điểm học bạ 3 năm và các điều kiện khác.'
      : 'Tổng tổ hợp <15; có thể vẫn đạt điều kiện 15 điểm qua Toán + Văn + một môn khác. Cần kiểm tra đầy đủ dữ liệu.';
  }
  return 'Chưa đủ dữ liệu để tính điểm xét tuyển theo đề án này.';
}

function schoolHeadline(school, result) {
  if (school.type === 'fpt') {
    if (!/^[AC]/.test(result.combo)) return 'Tổ hợp không áp dụng';
    if (result.raw === null) return 'Cần điểm thi THPT';
    return result.grade12 === null
      ? 'Cần điểm lớp 12'
      : `${((result.raw + result.grade12 * 3) / 2).toFixed(2)} / 30`;
  }
  if (school.type === 'ctu') {
    if (result.raw !== null) return `${result.raw.toFixed(2)} / 30 điểm thi`;
    if (result.transcriptRaw !== null) return `${result.transcriptRaw.toFixed(2)} / 30 học bạ`;
  }
  return 'Cần thêm dữ liệu';
}

function renderSchools(result) {
  const filter = document.getElementById('schoolFilter').value.trim().toLocaleLowerCase('vi');
  const schools = ADMISSIONS_2026.filter(school => school.name.toLocaleLowerCase('vi').includes(filter) || school.short.toLowerCase().includes(filter));
  document.getElementById('schoolList').innerHTML = schools.length
    ? schools.map(school => `
      <details class="school-row ${school.type === 'fpt' || school.type === 'ctu' ? 'school-row-calculated' : ''}" ${school.type === 'fpt' && /^[AC]/.test(result.combo) ? 'open' : ''}>
        <summary class="school-row-summary">
          <span class="school-row-logo">${school.short}</span>
          <span class="school-row-name">${school.name}</span>
          <span class="school-row-status">${schoolHeadline(school, result)}</span>
          <span class="school-row-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="school-row-detail">
          <p class="school-outcome">${schoolOutcome(school, result)}</p>
          <p class="school-method-note">${school.note}</p>
          <div class="school-source-links">
            <a href="${school.url}" target="_blank" rel="noopener noreferrer">Xem đề án 2026 ↗</a>
            ${school.extraUrl ? `<a href="${school.extraUrl}" target="_blank" rel="noopener noreferrer">${school.extraLabel} ↗</a>` : ''}
          </div>
        </div>
      </details>
    `).join('')
    : '<p class="calc-field-note">Không có trường nào trong 9 trường theo từ khóa này.</p>';
}

function showError(message) {
  const error = document.getElementById('calcError');
  error.textContent = message;
  error.hidden = false;
  document.getElementById('resultEmpty').hidden = false;
}

function clearError() {
  const error = document.getElementById('calcError');
  error.textContent = '';
  error.hidden = true;
}

function resetAll() {
  window.BWFlow?.save({ scores: null });
  document.getElementById('scoreNextStep').hidden = true;
  document.querySelectorAll('.score-input input, .dgnl-input input').forEach(input => {
    input.value = '';
    input.classList.remove('has-value');
  });
  document.getElementById('comboSelect').value = 'A00';
  updateComboUI();
  document.getElementById('schoolFilter').value = '';
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('resultEmpty').hidden = false;
  clearError();
}

function updateComboUI() {
  const combo = document.getElementById('comboSelect').value;
  const active = COMBO_SUBJECTS[combo];
  document.getElementById('comboHint').textContent =
    `${combo} · Cần nhập ${active.map(key => SUBJECTS[key][1]).join(', ')}`;
  document.getElementById('transcriptHint').textContent =
    `${combo} · Điểm trung bình học bạ ${active.map(key => TRANSCRIPT_SUBJECTS[key][1]).join(', ')}`;
  document.querySelectorAll('.score-input').forEach(label => {
    const inputId = label.querySelector('input').id;
    label.classList.toggle('score-input-active', active.some(key => SUBJECTS[key][0] === inputId || TRANSCRIPT_SUBJECTS[key][0] === inputId));
  });
}

document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('resetBtn').addEventListener('click', resetAll);
document.getElementById('comboSelect').addEventListener('change', updateComboUI);
document.getElementById('schoolFilter').addEventListener('input', () => {
  if (!document.getElementById('resultSchools').hidden) calculate();
});
document.querySelectorAll('.score-input input, .dgnl-input input').forEach(input => {
  input.addEventListener('input', () => input.classList.toggle('has-value', input.value.trim() !== ''));
});
updateComboUI();

// Keep a draft when the visitor checks a school or returns from another page.
const scoreNext = document.createElement('div');
scoreNext.id = 'scoreNextStep';
scoreNext.hidden = true;
document.querySelector('.calc-result-panel').appendChild(scoreNext);
const scoreInputs = [...document.querySelectorAll('.score-input input, .dgnl-input input')];
const draft = window.BWFlow?.read().scores;
if (draft) {
  if (COMBO_SUBJECTS[draft.combo]) document.getElementById('comboSelect').value = draft.combo;
  scoreInputs.forEach(input => {
    input.value = typeof draft.values?.[input.id] === 'string' ? draft.values[input.id] : '';
    input.classList.toggle('has-value', input.value !== '');
  });
  updateComboUI();
}
function saveScoreDraft() {
  window.BWFlow?.save({ scores: { combo: document.getElementById('comboSelect').value, values: Object.fromEntries(scoreInputs.map(input => [input.id, input.value])) } });
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('resultEmpty').hidden = false;
  scoreNext.hidden = true;
  clearError();
}
scoreInputs.forEach(input => input.addEventListener('input', saveScoreDraft));
document.getElementById('comboSelect').addEventListener('change', saveScoreDraft);
const schoolId = new URLSearchParams(location.search).get('school');
const chosenSchool = ADMISSIONS_2026.find(school => school.id === schoolId);
if (chosenSchool) document.getElementById('schoolFilter').value = chosenSchool.short;
if (schoolId || draft) {
  const note = document.createElement('p');
  note.className = 'flow-status';
  note.textContent = chosenSchool
    ? 'Đang xem cách tính tại ' + chosenSchool.name + '. Xóa bộ lọc để xem các trường khác.'
    : schoolId ? 'Công cụ hiện đối chiếu 9 trường. Trường bạn chọn có thể chưa được hỗ trợ; hãy xem đề án chính thức của trường.'
    : 'Đã khôi phục điểm bạn nhập trên thiết bị này. Nhấn Xem kết quả để tính lại.';
  document.querySelector('.calc-hero-inner').appendChild(note);
}
