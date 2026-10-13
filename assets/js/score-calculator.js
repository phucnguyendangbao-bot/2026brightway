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
  const combo = document.querySelector('input[name="combo"]:checked').value;
  const selected = COMBO_SUBJECTS[combo];
  const values = {};
  const errors = [];
  const missing = [];
  for (const key of selected) {
    const result = readBounded(SUBJECTS[key][0], 10);
    if (result.error) errors.push(result.error);
    else if (result.value === null) missing.push(SUBJECTS[key][1]);
    else values[key] = result.value;
  }
  const grade12 = readBounded('sGrade12', 10);
  if (grade12.error) errors.push(grade12.error);
  const exams = {};
  for (const exam of EXAMS) {
    const result = readBounded(exam.input, exam.max);
    if (result.error) errors.push(result.error);
    exams[exam.input] = result.value;
  }
  if (errors.length || missing.length) {
    showError(errors.concat(missing.length ? `Thiếu điểm thi: ${missing.join(', ')}.` : []).join(' '));
    document.getElementById('resultSchools').hidden = true;
    document.getElementById('resultSummary').hidden = true;
    return;
  }
  clearError();
  const raw = selected.reduce((sum, key) => sum + values[key], 0);
  document.getElementById('sumCombo').textContent = raw.toFixed(2);
  for (const exam of EXAMS) {
    const element = document.getElementById(exam.output);
    element.textContent = exams[exam.input] === null ? '—' : String(exams[exam.input]);
    element.classList.toggle('empty', exams[exam.input] === null);
  }
  document.getElementById('resultSummary').hidden = false;
  document.getElementById('resultSchools').hidden = false;
  document.getElementById('resultEmpty').hidden = true;
  renderSchools({ combo, raw, values, grade12: grade12.value });
}

function schoolOutcome(school, result) {
  if (school.type === 'fpt') {
    if (!/^[AC]/.test(result.combo)) return 'Tổ hợp đã chọn không thuộc Axx/Cxx trong đề án FPT 2026.';
    if (result.grade12 === null) return 'Nhập thêm điểm trung bình cả năm lớp 12 để tính điểm kết hợp.';
    const combined = (result.raw + result.grade12 * 3) / 2;
    return `Điểm kết hợp: <strong>${combined.toFixed(2)}/30</strong> (chưa cộng ưu tiên/khuyến khích). ${result.raw < 15 ? 'Tổng 3 môn thi chưa đạt điều kiện 15 điểm dành cho thí sinh thi tốt nghiệp 2026.' : 'Tổng 3 môn thi đạt mức 15 điểm tối thiểu; chưa phải kết luận trúng tuyển.'}`;
  }
  if (school.type === 'ctu') {
    return `Phương thức điểm thi: <strong>${result.raw.toFixed(2)}/30</strong> trước điểm ưu tiên. Chỉ áp dụng nếu ngành chấp nhận tổ hợp ${result.combo}.`;
  }
  if (school.type === 'hcmus') {
    return result.raw >= 15
      ? 'Tổng điểm tổ hợp đã chọn ≥15; vẫn cần xác nhận tổ hợp được ngành chấp nhận, điểm học bạ 3 năm và các điều kiện khác.'
      : 'Tổng tổ hợp <15; có thể vẫn đạt điều kiện 15 điểm qua Toán + Văn + một môn khác. Cần kiểm tra đầy đủ dữ liệu.';
  }
  return 'Chưa đủ dữ liệu để tính điểm xét tuyển theo đề án này.';
}

function renderSchools(result) {
  const filter = document.getElementById('schoolFilter').value.trim().toLocaleLowerCase('vi');
  const schools = ADMISSIONS_2026.filter(school => school.name.toLocaleLowerCase('vi').includes(filter) || school.short.toLowerCase().includes(filter));
  document.getElementById('schoolList').innerHTML = schools.length
    ? schools.map(school => `
      <article class="school-row grade-unknown">
        <div class="school-row-logo">${school.short}</div>
        <div class="school-row-body">
          <div class="school-row-name">${school.name}</div>
          <p class="school-outcome">${schoolOutcome(school, result)}</p>
          <p class="school-method-note">${school.note}</p>
          <div class="school-source-links">
            <a href="${school.url}" target="_blank" rel="noopener noreferrer">Đề án/nguồn 2026 ↗</a>
            ${school.extraUrl ? `<a href="${school.extraUrl}" target="_blank" rel="noopener noreferrer">${school.extraLabel} ↗</a>` : ''}
          </div>
        </div>
      </article>
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
  document.querySelectorAll('.score-input input, .dgnl-input input').forEach(input => {
    input.value = '';
    input.classList.remove('has-value');
  });
  document.querySelector('input[name="combo"][value="A00"]').checked = true;
  document.getElementById('schoolFilter').value = '';
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('resultEmpty').hidden = false;
  clearError();
}

document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('resetBtn').addEventListener('click', resetAll);
document.getElementById('schoolFilter').addEventListener('input', () => {
  if (!document.getElementById('resultSchools').hidden) calculate();
});
document.querySelectorAll('.score-input input, .dgnl-input input').forEach(input => {
  input.addEventListener('input', () => input.classList.toggle('has-value', input.value.trim() !== ''));
});
