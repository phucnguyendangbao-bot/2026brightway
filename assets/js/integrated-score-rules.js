import { integratedSchool, integratedCombos } from '../data/integrated-admissions-2026.js';
import { parseScore } from './score-rules.js';
const pending = message => ({ status:'unsupported', message, rows:[], final:null });
export function integratedRequirements(config, data) {
  if (!config?.engine) return [];
  const previous = data.cohort === 'previous';
  const thpt = data.exams !== 'vact';
  const vact = data.exams !== 'thpt';
  const transcript = config.engine === 'hcmus-thpt-component' || !previous;
  return [ ...(thpt ? ['thpt'] : []), ...(vact ? ['vact'] : []), ...(transcript ? ['transcript'] : []) ];
}
export function calculateIntegrated(data) {
  const config = integratedSchool(data.schoolId);
  if (!config || data.year !== 2026) return pending('Chỉ hỗ trợ cấu hình đã đối chiếu năm 2026; không áp dụng cho 2027.');
  if (!config.engine) return pending(config.missing);
  const program = config.programs.find(item => item.programId === data.programId);
  if (!program || !program.combos.includes(data.combo)) return pending('Ngành/tổ hợp chưa nằm trong phạm vi đã xác minh. Không tính cho ngành đặc thù hoặc liên kết.');
  if (!['current','previous'].includes(data.cohort) || !['both','thpt','vact'].includes(data.exams)) return pending('Hãy chọn năm tốt nghiệp và các kỳ thi thực tế đã tham dự.');
  if (config.engine === 'hcmus-thpt-component' && data.exams !== 'thpt') return pending('Chưa kiểm định bảng bách phân vị V-ACT. Không chia điểm 1200 theo tỷ lệ hoặc kết luận nhánh tối ưu.');
  if (config.engine === 'iu-domestic' && data.cohort === 'current' && data.exams === 'vact') return pending('Diện tốt nghiệp 2026 cần điểm THPT 2026. Không thay bằng công thức dành cho người tốt nghiệp trước 2026.');
  if (config.engine === 'iu-domestic' && data.bonus !== 'none') return pending('Chưa xác minh hồ sơ điểm cộng. Không mặc định cộng 5 điểm cho 149 trường; IU quy định mức riêng và điều kiện riêng.');
  const required = integratedRequirements(config, data);
  const keys = integratedCombos[data.combo];
  const errors = [];
  function number(value, max, label) {
    const parsed = parseScore(typeof value === 'number' ? String(value) : value ?? '', max);
    if (parsed.error || parsed.value === null) { errors.push(`${label}: cần số từ 0 đến ${max}, tối đa 2 số thập phân.`); return 0; }
    return parsed.value;
  }
  let thpt = null, vact = null, transcript = null;
  const rows = [];
  if (required.includes('thpt')) {
    const raw = keys.reduce((sum,key) => sum + number(data.thpt?.[key],10,`THPT ${key}`),0);
    thpt = raw * 100/30;
    rows.push({ label:'THPT 2026', raw, scale:30, converted:thpt, weight:config.weights.thpt });
  }
  if (required.includes('vact')) {
    const raw = number(data.vact,1200,'V-ACT 2026');
    vact = raw * 100/1200;
    rows.push({ label:'V-ACT 2026', raw, scale:1200, converted:vact, weight:config.weights.vact });
  }
  if (required.includes('transcript')) {
    const raw = keys.reduce((sum,key) => sum + [10,11,12].reduce((s,grade) => s + number(data.annual?.[`${key}_${grade}`],10,`Học bạ ${key} lớp ${grade}`),0)/3,0);
    transcript = raw * 100/30;
    rows.push({ label:'Học bạ cả năm lớp 10–12 (cùng tổ hợp)', raw, scale:30, converted:transcript, weight:config.weights.transcript });
  }
  if (errors.length) return { status:'invalid', message:errors.join(' '), errors, rows:[], final:null };
  if (config.engine === 'hcmus-thpt-component') {
    const academic = config.weights.thpt * thpt + config.weights.transcript * transcript;
    return { status:'reference', message:'Thành phần học lực nhánh THPT, chưa cộng thưởng/ưu tiên, chưa đối chiếu ngưỡng ngành hoặc tìm tổ hợp tốt nhất. Không phải điểm xét tuyển cuối cùng.', academic, final:null, rows, scale:100, formula:'80% THPT + 20% học bạ (quy về 100)' };
  }
  const rules = config.substitutionRules;
  if (data.exams === 'thpt') { vact = rules.currentNoVact * thpt; rows.push({label:'V-ACT thay thế = 0,83 × THPT quy đổi', raw:null, scale:100, converted:vact, weight:config.weights.vact}); }
  if (data.cohort === 'previous') {
    if (data.exams === 'vact') {
      thpt = rules.previousNoThpt.thpt * vact;
      transcript = rules.previousNoThpt.transcript * vact;
      rows.push({label:'THPT thay thế = 1,2 × V-ACT quy đổi', raw:null, scale:100, converted:thpt, weight:config.weights.thpt});
    } else transcript = rules.previousBothTranscript * thpt;
    rows.push({label:data.exams === 'vact' ? 'Học bạ thay thế = 1,25 × V-ACT quy đổi' : 'Học bạ thay thế = 1,02 × THPT quy đổi', raw:null, scale:100, converted:transcript, weight:config.weights.transcript});
  }
  if ([thpt,vact,transcript].some(value => value > 100)) return pending('Thành phần thay thế vượt 100. Chưa xác minh quy tắc chặn trần trong trường hợp này; không tự cắt điểm.');
  const priorityRules = config.priorityRules;
  if (!Object.hasOwn(priorityRules.regions,data.region) || !Object.hasOwn(priorityRules.objects,data.object)) return pending('Chọn đúng khu vực và nhóm ưu tiên; không nhập điểm ưu tiên tự do.');
  if (!data.confirmed) return pending('Cần xác nhận phạm vi chương trình, năm thi và quyền hưởng ưu tiên trước khi tính.');
  const academic = thpt * config.weights.thpt + vact * config.weights.vact + transcript * config.weights.transcript;
  const basePriority = priorityRules.regions[data.region] + priorityRules.objects[data.object];
  const priority = academic >= priorityRules.threshold ? (100-academic)/priorityRules.divisor * basePriority : basePriority;
  return { status:'official', message:'Công thức chính thức trong phạm vi đã đối chiếu; dữ liệu hồ sơ/ưu tiên do bạn khai, chưa được trường xác nhận. Không đảm bảo đủ điều kiện hoặc trúng tuyển.', academic, bonus:0, basePriority, priority, final:academic+priority, scale:100, rows, formula:'40% THPT + 50% V-ACT + 10% học bạ + ưu tiên giảm dần' };
}
