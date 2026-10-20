import { integratedSchool } from '../data/integrated-admissions-2026.js?v=20261020-expanded';

export const verificationLabels = {
  verified:'Đã xác minh, có thể tính',
  partial:'Có thông tin nhưng chưa đủ để tính',
  unverified:'Chưa xác minh',
};

// Resolve the selected program AND branch. A school-wide badge cannot authorize
// a different cohort, certificate, special program, bonus or substitution rule.
export function integratedVerification(data, outcome) {
  const config=integratedSchool(data.schoolId);
  const program=config?.programs.find(p=>p.programId===data.programId);
  const state=(level,reason)=>({level,label:verificationLabels[level],reason});
  if(!config||data.year!==2026||!program) return state('unverified','Chọn ngành/chương trình đã đối chiếu cho năm 2026.');
  if(program.unsupported) return state('partial',program.unsupported);
  if(!program.combos.includes(data.combo)) return state('unverified','Tổ hợp này chưa được đối chiếu cho ngành đã chọn.');
  if(!['current','previous'].includes(data.cohort)) return state('unverified','Chưa xác minh đối tượng này.');
  if(!['both','thpt','vact'].includes(data.exams)) return state('partial','Chỉ học bạ hoặc SAT/ACT/chứng chỉ chưa có bộ quy tắc áp dụng đầy đủ trong công cụ; không thay điểm thiếu bằng 0.');
  if(data.bonus&&data.bonus!=='none') return state('partial','Cần xác minh loại thành tích/chứng chỉ, hồ sơ 149 trường và chống cộng trùng; chưa xuất điểm cuối.');
  if((config.schoolId==='hcmut'||program.requiresThpt)&&data.exams==='vact') return state('partial','Phạm vi ngành/diện đã chọn bắt buộc có THPT 2026.');
  if(['hcmiu','uel'].includes(config.schoolId)&&data.cohort==='current'&&data.exams==='vact') return state('partial','Không dùng nhánh chỉ V-ACT của người tốt nghiệp trước 2026 cho thí sinh tốt nghiệp 2026.');
  if(config.verificationStatus==='components-only'||config.schoolId==='agu') return state('partial',config.missing);
  if(config.schoolId==='uel'&&(data.exams!=='both'||outcome?.status==='reference')) return state('partial',config.missing);
  if(outcome&&outcome.status==='unsupported') return state('partial',outcome.message);
  return state('verified',config.schoolId==='uel'&&!outcome
    ? 'Nhánh đủ hai kỳ thi có trọng số đã xác minh. Nếu nhánh thay thế dự kiến cho điểm cao hơn, kết quả sẽ bị giữ ở trạng thái chưa đủ để tính điểm cuối.'
    : 'Chỉ trong ngành, tổ hợp, đối tượng và diện không yêu cầu điểm cộng đã chọn. Không xác nhận hồ sơ hoặc trúng tuyển.');
}
