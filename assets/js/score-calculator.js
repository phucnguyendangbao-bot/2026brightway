// Công cụ 2026: chỉ tính những thành phần có công thức và đủ dữ liệu đầu vào.
// Không dùng cutoffScores của schools.json: dữ liệu đó không có ngành/năm/nguồn.
import { rawThresholdText } from './admissions-rules.js';
import sourceRegistry from '../data/school-admissions-sources.js';
import { COMBO_SUBJECTS, parseScore, fptComponent, fptCombinationAllowed } from './score-rules.js';
import { canonicalSchoolId, buildUniversityCatalog } from '../data/university-identities.js';
import { detailsForSchool } from '../data/school-profile-details.js';
const escapeTarget = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let targetSchools = [];
let targetRevision = 0;
const SUBJECTS = {
  math: ['sMath', 'Toán'], lit: ['sLit', 'Ngữ văn'], eng: ['sEng', 'Tiếng Anh'],
  phy: ['sPhy', 'Vật lý'], che: ['sChe', 'Hóa học'], bio: ['sBio', 'Sinh học'],
  his: ['sHis', 'Lịch sử'], geo: ['sGeo', 'Địa lý'],
  civic: ['sCivic', 'Giáo dục KT&PL'], informatics: ['sInformatics', 'Tin học'],
};
const TRANSCRIPT_SUBJECTS = {
  math: ['hMath', 'Toán'], lit: ['hLit', 'Ngữ văn'], eng: ['hEng', 'Tiếng Anh'],
  phy: ['hPhy', 'Vật lý'], che: ['hChe', 'Hóa học'], bio: ['hBio', 'Sinh học'],
  his: ['hHis', 'Lịch sử'], geo: ['hGeo', 'Địa lý'],
  civic: ['hCivic', 'Giáo dục KT&PL'], informatics: ['hInformatics', 'Tin học'],
};
const EXAMS = [
  { input: 'sVact', output: 'sumVact', max: 1200 },
  { input: 'sHsa', output: 'sumHsa', max: 150 },
  { input: 'sTsa', output: 'sumTsa', max: 100 },
];

function getTargetSelection() {
  const guided = document.querySelector('input[name="targetMode"]:checked')?.value === 'guided';
  const schoolId = guided ? document.getElementById('targetSchool').value : '';
  const programIndex = guided ? document.getElementById('targetProgram').value : '';
  const school = targetSchools.find(item => item.id === schoolId) || null;
  const program = programIndex !== '' ? detailsForSchool(schoolId)?.programs?.[programIndex] || null : null;
  return { guided, schoolId, programIndex, school, program };
}

const ADMISSIONS_2026 = [
  {
    id: 'fpt', name: 'Đại học FPT', short: 'FPTU',
    url: 'https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/thong-bao-tuyen-sinh-truong-dai-hoc-fpt-he-dai-hoc-chinh-quy-nam-2026/',
    type: 'fpt',
    extraUrl: 'https://daihoc.fpt.edu.vn/tin-tuc/truong-dai-hoc-fpt-cong-bo-diem-san-xet-tuyen-he-dai-hoc-chinh-quy-nam-2026/',
    extraLabel: 'Thông báo điểm sàn 01/07/2026',
    note: 'ĐXT = (tổng điểm thi 3 môn + 3 × điểm TB cả năm lớp 12)/2 + điểm khuyến khích + điểm ưu tiên. FPT định nghĩa Axx là Toán + hai môn bất kỳ; Cxx là Ngữ văn + hai môn bất kỳ, không dùng cho CNTT/Khoa học máy tính. Đối chiếu theo các môn, không chỉ theo chữ đầu mã tổ hợp. Thí sinh thi tốt nghiệp 2026 cần tổng tổ hợp từ 15 điểm. Chưa cộng ưu tiên/khuyến khích; ngành Luật còn có điều kiện riêng.',
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
    note: 'Phương thức tích hợp có công thức, hệ số môn và quy đổi theo chương trình. Chưa có bộ dữ liệu phụ lục theo ngành đã kiểm định để áp dụng trọng số; không suy ra điểm xét tuyển UEH từ tổng 3 môn thi.',
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
    url: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods',
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
  const parsed = input.validity.badInput ? { error:'format' } : parseScore(input.value, max);
  input.setAttribute('aria-invalid', String(Boolean(parsed.error)));
  const existing = input.closest('label')?.querySelector('.calc-input-error');
  if (existing) existing.remove();
  if (parsed.error) {
    const message = `Nhập số từ 0 đến ${max}, tối đa 2 chữ số thập phân.`;
    input.closest('label')?.insertAdjacentHTML('beforeend', `<small class="calc-input-error">${message}</small>`);
    return { error: `${input.closest('label').querySelector('span').textContent}: ${message}` };
  }
  return parsed;
}

function calculate() {
  const method = document.querySelector('input[name="admissionMethod"]:checked')?.value || 'thpt';
  const combo = document.getElementById('comboSelect').value;
  const selected = COMBO_SUBJECTS[combo];
  if (!selected) { showError('Tổ hợp không hợp lệ. Hãy chọn lại.'); return; }
  const target = getTargetSelection();
  if (target.guided && !target.schoolId) { showError('Hãy chọn trường trước khi đối chiếu theo trường và ngành. Bạn có thể chọn “Tính nhanh” nếu chưa có mục tiêu.'); return; }
  if (target.guided && !document.getElementById('targetProgram').disabled && !target.program) { showError('Hãy chọn ngành hoặc chương trình đào tạo trước khi nhập kết quả đối chiếu.'); return; }
  const values = {};
  const errors = [];
  const missing = [];
  const transcriptValues = {};
  const transcriptMissing = [];
  for (const key of selected) {
    if (method === 'thpt') {
      const result = readBounded(SUBJECTS[key][0], 10);
      if (result.error) errors.push(result.error);
      else if (result.value === null) missing.push(SUBJECTS[key][1]);
      else values[key] = result.value;
    }
    if (method === 'transcript') {
      const transcriptResult = readBounded(TRANSCRIPT_SUBJECTS[key][0], 10);
      if (transcriptResult.error) errors.push(transcriptResult.error);
      else if (transcriptResult.value === null) transcriptMissing.push(TRANSCRIPT_SUBJECTS[key][1]);
      else transcriptValues[key] = transcriptResult.value;
    }
  }
  const grade12 = method === 'thpt' && !document.getElementById('fptCard').hidden ? readBounded('sGrade12', 10) : { value: null };
  if (grade12.error) errors.push(grade12.error);
  const exams = {};
  for (const exam of EXAMS) {
    if (method !== 'other' || exam.input !== document.getElementById('examType').value) {
      exams[exam.input] = null;
      continue;
    }
    const result = readBounded(exam.input, exam.max);
    if (result.error) errors.push(result.error);
    exams[exam.input] = result.value;
  }
  const hasExam = method === 'thpt' && missing.length === 0;
  const hasTranscript = method === 'transcript' && transcriptMissing.length === 0;
  const startedExam = method === 'thpt' && missing.length < selected.length;
  const startedTranscript = method === 'transcript' && transcriptMissing.length < selected.length;
  const transcriptConfirmed = document.getElementById('transcriptConfirmed').checked;
  if (method === 'thpt' && !hasExam) errors.push(`Điểm thi còn thiếu: ${missing.join(', ')}.`);
  if (method === 'transcript' && !hasTranscript) errors.push(`Điểm học bạ còn thiếu: ${transcriptMissing.join(', ')}.`);
  if (method === 'other' && !Object.values(exams).some(value => value !== null)) errors.push('Hãy nhập ít nhất một điểm V-ACT, HSA hoặc TSA.');
  if (errors.length) {
    showError(errors.join(' '));
    document.getElementById('resultSchools').hidden = true;
    document.getElementById('resultSummary').hidden = true;
    document.getElementById('scoreNextStep').hidden = true;
    return;
  }
  clearError();
  const warning = document.getElementById('calcWarning');
  warning.hidden = !(startedTranscript && !transcriptConfirmed);
  warning.textContent = warning.hidden ? '' : 'Kết quả học bạ bên dưới chỉ là tổng điểm gốc. Bạn chưa xác nhận cách tổng hợp điểm lớp 10–12, nên không dùng tổng này để kết luận đủ điều kiện xét tuyển.';
  const raw = hasExam ? selected.reduce((sum, key) => sum + values[key], 0) : null;
  const transcriptRaw = hasTranscript ? selected.reduce((sum, key) => sum + transcriptValues[key], 0) : null;
  document.getElementById('sumCombo').textContent = raw === null ? '—' : raw.toFixed(2);
  document.getElementById('sumTranscript').textContent = transcriptRaw === null ? '—' : transcriptRaw.toFixed(2);
  document.getElementById('transcriptSummary').classList.toggle('summary-item-warning', transcriptRaw !== null && !transcriptConfirmed);
  for (const exam of EXAMS) {
    const element = document.getElementById(exam.output);
    element.textContent = exams[exam.input] === null ? '—' : String(exams[exam.input]);
    element.classList.toggle('empty', exams[exam.input] === null);
  }
  document.getElementById('resultSummary').hidden = false;
  document.getElementById('resultSchools').hidden = false;
  document.getElementById('resultEmpty').hidden = true;
  const methodLabels = { thpt: 'Điểm thi tốt nghiệp THPT', transcript: 'Học bạ', other: 'Bài thi riêng' };
  document.getElementById('resultTarget').textContent = target.guided
    ? `${target.school?.name || target.schoolId}${target.program ? ' · ' + target.program.name : ' · chưa có danh sách ngành 2026 đã đối chiếu'}`
    : 'Tính nhanh · chưa chọn trường';
  document.getElementById('resultMethod').textContent = methodLabels[method];
  document.getElementById('resultFormula').textContent = method === 'thpt'
    ? `${combo}: ${selected.map(key => `${SUBJECTS[key][1]} ${values[key].toFixed(2)}`).join(' + ')} = ${raw.toFixed(2)}`
    : method === 'transcript'
      ? `${combo}: ${selected.map(key => `${TRANSCRIPT_SUBJECTS[key][1]} ${transcriptValues[key].toFixed(2)}`).join(' + ')} = ${transcriptRaw.toFixed(2)}`
      : 'Giữ nguyên điểm gốc của từng kỳ thi; không tự quy đổi khi chưa có công thức theo ngành và trường.';
  const selectedExam = EXAMS.find(exam => exam.input === document.getElementById('examType').value);
  document.querySelectorAll('[data-summary-method]').forEach(item => {
    item.hidden = item.dataset.summaryMethod !== method || (method === 'other' && !item.querySelector('#' + selectedExam.output));
  });
  const programCode = target.schoolId === 'fpt' && target.programIndex !== ''
    ? detailsForSchool('fpt')?.programs?.[target.programIndex]?.code || '' : '';
  renderSchools({ combo, programCode, keys: selected, raw, transcriptRaw, transcriptConfirmed, values, transcriptValues, grade12: grade12.value });
  const savedSummary = method === 'other'
    ? EXAMS.filter(exam => exams[exam.input] !== null).map(exam => `${({sVact:'V-ACT',sHsa:'HSA',sTsa:'TSA'})[exam.input]}: ${exams[exam.input]}/${exam.max} (điểm gốc)`).join(' · ')
    : document.getElementById('resultFormula').textContent;
  window.BWFlow?.save({ admissions: { method, combo, completedAt: Date.now() }, target: { mode: target.guided ? 'guided' : 'quick', school: target.schoolId, program: target.programIndex, name: target.program?.name || '' }, scores: { combo, method, target: target.guided ? { school: target.schoolId, program: target.programIndex, name: target.program?.name || '' } : null, transcriptConfirmed, examType: document.getElementById('examType').value, summary: savedSummary, completedAt: Date.now(), values: Object.fromEntries(scoreInputs.map(input => [input.id, input.value])) } });
  const host = document.getElementById('scoreNextStep');
  host.hidden = false;
  window.BWFlow?.nextStep(host, 'Lập kế hoạch cho hồ sơ của bạn', 'Đối chiếu đề án trường, ghi lại các mốc tuyển sinh và chuẩn bị tài liệu cần thiết.', [['Lịch tuyển sinh', 'calendar.html'], ['Tài liệu & bài viết', 'resources.html'], ['Hồ sơ của tôi', 'profile.html']]);
}

function schoolOutcome(school, result) {
  if (school.type === 'fpt') {
    if (!fptCombinationAllowed(result.combo, result.programCode)) return 'Tổ hợp đã chọn không có Toán nên không áp dụng cho ngành Công nghệ thông tin/Khoa học máy tính theo thông báo FPT 2026. Hãy chọn tổ hợp có Toán; không dùng kết quả này cho ngành đã chọn.';
    if (result.raw === null) return 'FPT cần điểm thi THPT của 3 môn trong tổ hợp để áp dụng công thức kết hợp này.';
    if (result.grade12 === null) return 'Nhập thêm điểm trung bình cả năm lớp 12 để tính điểm kết hợp.';
    const combined = fptComponent(result);
    const fptCondition = result.raw < 15
      ? 'Tổng tổ hợp đã chọn dưới 15; chưa đạt điều kiện riêng trong thông báo FPT dành cho thí sinh thi tốt nghiệp 2026. Đối chiếu diện và ngoại lệ với trường.'
      : 'Tổng tổ hợp đã chọn đạt mức 15; vẫn cần kiểm tra ngành, cơ sở, đối tượng và điều kiện riêng.';
    if (combined === null) return fptCondition + ' Không hiển thị điểm áp dụng FPT khi chưa đạt điều kiện đã kiểm tra.';
    return `Thành phần điểm kết hợp: <strong>${combined.toFixed(2)}/30</strong> (chưa cộng ưu tiên/khuyến khích, chưa xác nhận toàn bộ điều kiện ngành). ${fptCondition} Thông báo 01/07/2026 công bố điểm sàn xét tuyển 18; chương trình Cử nhân tài năng Khoa học máy tính là 21. Đây không phải ngưỡng điểm thi gốc 15. Công cụ chưa tính ĐXT đầy đủ để kết luận đạt sàn.`;
  }
  if (school.type === 'ctu') {
    const parts = [];
    if (result.raw !== null) parts.push(`Tổng điểm thi gốc: <strong>${result.raw.toFixed(2)}/30</strong>`);
    if (result.transcriptRaw !== null) parts.push(`Tổng học bạ gốc: <strong>${result.transcriptRaw.toFixed(2)}/30</strong>`);
    if (!parts.length) return 'Chưa có công thức quy đổi bài thi riêng cho ngành đã chọn. Điểm gốc của kỳ thi không được thay cho điểm thi THPT hoặc học bạ.';
    return `${parts.join(' · ')}. Học bạ còn phải quy đổi theo từng môn và ngành; chỉ áp dụng nếu ngành chấp nhận tổ hợp ${result.combo}. ${result.raw !== null ? rawThresholdText(result) : 'Tổng học bạ không được dùng để đánh giá ngưỡng điểm thi THPT.'}`;
  }
  if (school.type === 'hcmus') {
    if (result.raw === null && result.transcriptRaw === null) return 'Phương thức bài thi riêng cần công thức quy đổi theo ngành của trường. Công cụ chỉ hiển thị điểm gốc, không tự quy đổi khi chưa đủ dữ liệu.';
    if (result.raw === null) return `Điểm học bạ tổ hợp hiện có: <strong>${result.transcriptRaw.toFixed(2)}/30</strong>. Cần đủ dữ liệu lớp 10–12 và điều kiện ngành để tính phương thức tích hợp.`;
    return rawThresholdText(result);
  }
  return 'Chưa đủ dữ liệu để tính điểm xét tuyển theo đề án này.';
}

function schoolHeadline(school, result) {
  if (school.type === 'fpt') {
    if (!fptCombinationAllowed(result.combo, result.programCode)) return 'Tổ hợp không áp dụng cho ngành';
    if (result.raw === null) return 'Cần điểm thi THPT';
    if (result.raw < 15) return 'Tổng tổ hợp dưới 15';
    return result.grade12 === null
      ? 'Cần điểm lớp 12'
      : `${fptComponent(result).toFixed(2)} / 30 · thành phần`;
  }
  if (school.type === 'ctu') {
    if (result.raw !== null) return `${result.raw.toFixed(2)} / 30 điểm thi`;
    if (result.transcriptRaw !== null) return `${result.transcriptRaw.toFixed(2)} / 30 học bạ gốc`;
  }
  return 'Cần thêm dữ liệu';
}

function renderSchools(result) {
  const filter = document.getElementById('schoolFilter').value.trim().toLocaleLowerCase('vi');
  const targetSelection = getTargetSelection();
  const target = targetSelection.schoolId;
  const schools = ADMISSIONS_2026.filter(school => (!target || school.id === target) && (school.name.toLocaleLowerCase('vi').includes(filter) || school.short.toLowerCase().includes(filter)));
  document.getElementById('resultSchoolsTitle').textContent = targetSelection.guided
    ? `Đối chiếu nguồn của ${targetSelection.school?.name || 'trường đã chọn'}`
    : 'Đối chiếu nguồn của 9 trường';
  document.getElementById('schoolList').innerHTML = schools.length
    ? schools.map(school => `
      <details class="school-row ${school.type === 'fpt' || school.type === 'ctu' ? 'school-row-calculated' : ''}" ${school.type === 'fpt' ? 'open' : ''}>
        <summary class="school-row-summary">
          <span class="school-row-logo">${school.short}</span>
          <span class="school-row-name">${school.name}</span>
          <span class="school-row-status">${schoolHeadline(school, result)}</span>
          <span class="school-row-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="school-row-detail">
          <p class="school-outcome">${schoolOutcome(school, result)}</p>
          <p class="school-method-note">${school.note}</p>
          ${renderSourceVersion(school.id)}
          <div class="school-source-links">
            <a href="${school.url}" target="_blank" rel="noopener noreferrer">Xem đề án 2026 ↗</a>
            ${school.extraUrl ? `<a href="${school.extraUrl}" target="_blank" rel="noopener noreferrer">${school.extraLabel} ↗</a>` : ''}
          </div>
        </div>
      </details>
    `).join('')
    : '<p class="calc-field-note">Chưa đủ dữ liệu công thức cho lựa chọn này. Tổng điểm gốc không phải điểm xét tuyển của ngành. Xem nguồn chính thức ở phần chọn trường.</p>';
}

function renderSourceVersion(id) {
  const source = sourceRegistry.universities.find(row => row.school_id === id);
  if (!source) return '';
  return `<p class="calc-field-note">Chỉ áp dụng dữ liệu 2026. Rà soát công cụ: 2026-10-15. Nguồn trong kho được kiểm tra: ${source.checked_at}. ${source.formula_version ? 'Phiên bản thành phần: ' + source.formula_version + '.' : 'Công thức theo ngành đang chờ xác minh.'} Không áp dụng tự động cho 2027. Điểm gốc, thành phần đang tính và điểm chuẩn theo ngành/năm là ba loại dữ liệu khác nhau.</p><a href="${source.source_url}" target="_blank" rel="noopener noreferrer">Bản nguồn đang đối chiếu ↗</a>`;
}

function showError(message) {
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('scoreNextStep').hidden = true;
  const error = document.getElementById('calcError');
  document.getElementById('calcWarning').hidden = true;
  error.textContent = message;
  error.hidden = false;
  document.getElementById('resultEmpty').hidden = false;
}

function clearError() {
  const error = document.getElementById('calcError');
  error.textContent = '';
  error.hidden = true;
}

function clearWarning() {
  const warning = document.getElementById('calcWarning');
  warning.textContent = '';
  warning.hidden = true;
  document.getElementById('transcriptSummary').classList.remove('summary-item-warning');
}

function resetAll() {
  targetRevision++;
  const url = new URL(location.href);
  url.searchParams.delete('school');
  url.searchParams.delete('program');
  history.replaceState(null, '', url);
  window.BWFlow?.save({ scores: null, admissions: null, target: null });
  document.getElementById('scoreNextStep').hidden = true;
  document.querySelectorAll('.score-input input, .dgnl-input input').forEach(input => {
    input.value = '';
    input.classList.remove('has-value');
    input.removeAttribute('aria-invalid');
  });
  document.querySelectorAll('.calc-input-error').forEach(node => node.remove());
  document.getElementById('examType').value = 'sVact';
  updateExamType();
  document.getElementById('fptCard').open = false;
  document.querySelector('.calc-hero-inner .flow-status')?.remove();
  document.getElementById('comboSelect').value = 'A00';
  document.querySelector('input[name="targetMode"][value="quick"]').checked = true;
  document.getElementById('targetSchool').value = '';
  updateTargetProgram();
  updateTargetModeUI();
  document.querySelector('input[name="admissionMethod"][value="thpt"]').checked = true;
  document.getElementById('transcriptConfirmed').checked = false;
  updateComboUI();
  document.getElementById('schoolFilter').value = '';
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('resultEmpty').hidden = false;
  clearError();
  clearWarning();
  updateMethodUI();
}

function updateMethodUI() {
  const method = document.querySelector('input[name="admissionMethod"]:checked')?.value || 'thpt';
  const target = getTargetSelection();
  document.getElementById('comboCard').hidden = method === 'other';
  document.getElementById('examCard').hidden = method !== 'thpt';
  document.getElementById('transcriptCard').hidden = method !== 'transcript';
  document.getElementById('fptCard').hidden = method !== 'thpt' || Boolean(target.schoolId && target.schoolId !== 'fpt');
  document.getElementById('otherExamCard').hidden = method !== 'other';
  document.getElementById('calcBtn').firstChild.textContent = method === 'other' ? 'Đối chiếu điểm ' : 'Tính điểm ';
  window.BWFlow?.save({ admissions: { ...(window.BWFlow?.read().admissions || {}), method } });
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
    const isActive = active.some(key => SUBJECTS[key][0] === inputId || TRANSCRIPT_SUBJECTS[key][0] === inputId);
    label.hidden = !isActive;
    label.classList.toggle('score-input-active', isActive);
  });
}

document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('resetBtn').addEventListener('click', resetAll);
document.getElementById('editScoreBtn').addEventListener('click', () => {
  document.querySelector('.calc-input-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const method = document.querySelector('input[name="admissionMethod"]:checked')?.value || 'thpt';
  const target = method === 'other' ? '#otherExamCard input' : method === 'transcript' ? '#transcriptCard input:not([type="checkbox"])' : '#examCard input';
  [...document.querySelectorAll(target)].find(input => input.getClientRects().length > 0)?.focus();
});
document.getElementById('comboSelect').addEventListener('change', updateComboUI);
document.querySelectorAll('input[name="admissionMethod"]').forEach(input => input.addEventListener('change', updateMethodUI));
document.getElementById('schoolFilter').addEventListener('input', () => {
  if (!document.getElementById('resultSchools').hidden) calculate();
});
document.querySelectorAll('.score-input input, .dgnl-input input').forEach(input => {
  input.addEventListener('input', () => input.classList.toggle('has-value', input.value.trim() !== ''));
});
updateComboUI();
updateMethodUI();

// Keep a draft when the visitor checks a school or returns from another page.
const scoreNext = document.createElement('div');
scoreNext.id = 'scoreNextStep';
scoreNext.hidden = true;
document.querySelector('.calc-result-panel').appendChild(scoreNext);
const scoreInputs = [...document.querySelectorAll('.score-input input, .dgnl-input input')];
const draft = window.BWFlow?.read().scores;
if (draft) {
  if (['sVact','sHsa','sTsa'].includes(draft.examType)) document.getElementById('examType').value = draft.examType;
  if (['thpt', 'transcript', 'other'].includes(draft.method)) document.querySelector(`input[name="admissionMethod"][value="${draft.method}"]`).checked = true;
  if (COMBO_SUBJECTS[draft.combo]) document.getElementById('comboSelect').value = draft.combo;
  document.getElementById('transcriptConfirmed').checked = draft.transcriptConfirmed === true;
  scoreInputs.forEach(input => {
    input.value = typeof draft.values?.[input.id] === 'string' ? draft.values[input.id] : '';
    input.classList.toggle('has-value', input.value !== '');
  });
  updateComboUI();
  updateMethodUI();
}
function saveScoreDraft() {
  const method = document.querySelector('input[name="admissionMethod"]:checked')?.value || 'thpt';
  window.BWFlow?.save({ admissions: { method }, scores: { combo: document.getElementById('comboSelect').value, method, examType: document.getElementById('examType').value, transcriptConfirmed: document.getElementById('transcriptConfirmed').checked, values: Object.fromEntries(scoreInputs.map(input => [input.id, input.value])) } });
  document.getElementById('resultSummary').hidden = true;
  document.getElementById('resultSchools').hidden = true;
  document.getElementById('resultEmpty').hidden = false;
  scoreNext.hidden = true;
  clearError();
  clearWarning();
}
scoreInputs.forEach(input => input.addEventListener('input', saveScoreDraft));
document.getElementById('comboSelect').addEventListener('change', saveScoreDraft);
document.getElementById('transcriptConfirmed').addEventListener('change', saveScoreDraft);
document.querySelectorAll('input[name="admissionMethod"]').forEach(input => input.addEventListener('change', saveScoreDraft));
const schoolId = canonicalSchoolId(new URLSearchParams(location.search).get('school'));
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

function updateExamType() {
  document.querySelectorAll('#otherExamCard .dgnl-input').forEach(label => {
    label.hidden = label.querySelector('input').id !== document.getElementById('examType').value;
  });
}
document.getElementById('examType').addEventListener('change', () => { updateExamType(); saveScoreDraft(); });
updateExamType();

function updateTargetProgram(restore = '') {
  const id = document.getElementById('targetSchool').value;
  const select = document.getElementById('targetProgram');
  const programs = detailsForSchool(id)?.programs || [];
  select.innerHTML = '<option value="">' + (programs.length ? 'Chọn ngành / chương trình' : id ? 'Chưa có danh sách ngành đã đối chiếu' : 'Chọn trường trước') + '</option>' + programs.map((program, index) => `<option value="${index}">${escapeTarget(program.code)} · ${escapeTarget(program.name)}${program.track ? ' · ' + escapeTarget(program.track) : ''}</option>`).join('');
  select.disabled = !programs.length;
  if (programs[restore]) select.value = restore;
  updateTargetStatus();
  updateMethodUI();
}
function updateTargetStatus() {
  const target = getTargetSelection();
  const { schoolId: id, school, programIndex, program } = target;
  const details = detailsForSchool(id);
  const source = sourceRegistry.universities.find(item => item.school_id === id);
  const sourceUrl = source?.source_url || details?.admissionSource || school?.website;
  document.getElementById('targetStatus').innerHTML = !target.guided
    ? 'Chế độ tính nhanh: chỉ tính điểm gốc từ dữ liệu bạn nhập, chưa đối chiếu ngành hoặc dự đoán trúng tuyển.'
    : school
    ? `${escapeTarget(school.name)}${program ? ' · ' + escapeTarget(program.name) : ''}. Dữ liệu 2026. ${source?.checked_at ? 'Nguồn được rà soát: ' + escapeTarget(source.checked_at) + '. ' : 'Chưa có ngày xác minh quy định. '}Chưa xác nhận đầy đủ công thức cho từng ngành/phương thức; kết quả chỉ là điểm gốc hoặc thành phần được ghi rõ.${/^https:\/\//.test(sourceUrl || '') ? ` <a href="${escapeTarget(sourceUrl)}" target="_blank" rel="noopener noreferrer">Đọc nguồn chính thức ↗</a>` : ''}`
    : 'Hãy chọn trường. Nếu trường chưa có danh sách ngành 2026 được đối chiếu, công cụ sẽ ghi rõ giới hạn dữ liệu.';
  window.BWFlow?.save({ target: { mode: target.guided ? 'guided' : 'quick', school: id, program: programIndex, name: program?.name || '' } });
}
function updateTargetModeUI() {
  const target = getTargetSelection();
  document.getElementById('targetSelectors').hidden = !target.guided;
  updateTargetStatus();
  updateMethodUI();
}
function targetChanged() {
  targetRevision++;
  document.getElementById('schoolFilter').value = '';
  const target = getTargetSelection();
  const url = new URL(location.href);
  if (target.schoolId) url.searchParams.set('school', target.schoolId); else url.searchParams.delete('school');
  if (target.programIndex !== '') url.searchParams.set('program', target.programIndex); else url.searchParams.delete('program');
  history.replaceState(null, '', url);
  document.querySelector('.calc-hero-inner .flow-status')?.remove();
}
async function loadTargetSchools() {
  const retry = document.getElementById('retryTarget');
  const revision = targetRevision;
  const params = new URLSearchParams(location.search);
  const saved = window.BWFlow?.read().target;
  const requested = canonicalSchoolId(params.get('school')) || saved?.school;
  retry.hidden = true;
  retry.disabled = true;
  document.getElementById('targetCard').setAttribute('aria-busy', 'true');
  document.getElementById('targetStatus').textContent = 'Đang tải danh sách trường… Bạn vẫn có thể tính nhanh.';
  try {
    const response = await fetch('/assets/data/schools.json', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('School data unavailable');
    targetSchools = buildUniversityCatalog(await response.json()).schools.filter(school => school.identity.entity_kind === 'university');
    if (!targetSchools.length) throw new Error('Chưa có hồ sơ trường hợp lệ trong dữ liệu tải về');
    const select = document.getElementById('targetSchool');
    const currentSchool = select.value;
    const currentProgram = document.getElementById('targetProgram').value;
    select.innerHTML = '<option value="">Chọn trường</option>' + targetSchools.map(school => `<option value="${escapeTarget(school.id)}">${escapeTarget(school.name)}</option>`).join('');
    const unchanged = revision === targetRevision;
    if (unchanged) {
      const guided = Boolean(params.get('school') || (saved?.mode !== 'quick' && requested));
      document.querySelector(`input[name="targetMode"][value="${guided ? 'guided' : 'quick'}"]`).checked = true;
    }
    const restoreSchool = unchanged ? requested : currentSchool;
    if (targetSchools.some(school => school.id === restoreSchool)) select.value = restoreSchool;
    updateTargetProgram(unchanged ? params.get('program') ?? (saved?.school === requested ? saved.program : '') : currentProgram);
    updateTargetModeUI();
  } catch (error) {
    document.getElementById('targetStatus').textContent = 'Chưa tải được trường/ngành. Bạn vẫn có thể tính điểm gốc, hoặc thử tải lại.';
    retry.hidden = false;
    console.warn('[score target]', error.message);
  } finally {
    retry.disabled = false;
    document.getElementById('targetCard').setAttribute('aria-busy', 'false');
  }
}
document.getElementById('retryTarget').addEventListener('click', loadTargetSchools);
document.querySelectorAll('input[name="targetMode"]').forEach(input => input.addEventListener('change', () => { targetChanged(); updateTargetModeUI(); saveScoreDraft(); }));
document.getElementById('targetSchool').addEventListener('change', () => { updateTargetProgram(); targetChanged(); saveScoreDraft(); });
document.getElementById('targetProgram').addEventListener('change', () => { updateTargetStatus(); targetChanged(); saveScoreDraft(); });
loadTargetSchools();
