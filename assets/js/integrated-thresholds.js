// Numerical checks only, not an admission/eligibility decision. Use unrounded
// values and the source's named basis (academic score vs. total vs. raw exam).
export function integratedThresholds(data,outcome) {
  const checks=[];
  const add=(label,value,minimum,scale)=>checks.push({label,value,minimum,scale,met:value>=minimum});
  if(outcome.final==null)return checks;
  if(['hcmut','hcmiu'].includes(data.schoolId))add('Ngưỡng tổng hợp tối thiểu',outcome.final,50,100);
  if(data.schoolId==='uel') {
    add('Ngưỡng học lực KV3, trước ưu tiên',outcome.academic,60,100);
    // Only the selected combination, never unrelated saved subjects.
    if(data.exams!=='vact'&&data.thptKeys?.length===3)add('Tổng THPT gốc, chưa cộng ưu tiên',data.thptKeys.reduce((s,k)=>s+Number(data.thpt[k]),0),15,30);
  }
  if(data.schoolId==='hcmus') {
    const floor={7420101:17,7420201:19}[data.programId];
    if(floor)add('Ngưỡng tổng hợp của ngành (quy về thang 30)',outcome.final*30/100,floor,30);
    if(data.cohort==='current') {
      const raw=data.exams!=='vact'&&data.thptKeys?.length===3?data.thptKeys.reduce((s,k)=>s+Number(data.thpt[k]),0):null;
      if(raw!==null&&raw>=15)add('Điều kiện tổng THPT gốc của tổ hợp',raw,15,30);
      else checks.push({label:'Điều kiện THPT gốc ≥15/30: chưa đủ dữ liệu để xét cả phương án Toán + Văn + môn khác; cần đối chiếu Mục 1–2 thông báo ngưỡng.',met:null});
    }
  }
  return checks;
}
