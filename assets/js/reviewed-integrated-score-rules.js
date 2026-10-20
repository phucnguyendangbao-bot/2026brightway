import { integratedCombos } from '../data/integrated-admissions-2026.js?v=20261020-expanded';
import { hcmusVactToThpt } from '../data/hcmus-percentiles-2026.js';
import { parseScore } from './score-rules.js';
const stop = message => ({status:'unsupported',message,rows:[],academic:null,final:null});
export function reviewedRequirements(config,data) {
  if(!['both','thpt','vact'].includes(data.exams))return [];
  return [...(data.exams!=='vact'?['thpt']:[]),...(data.exams!=='thpt'?['vact']:[]),'transcript'];
}
function priority100(data,academic,roundPriority=false) {
  const regions={KV1:.75,KV2NT:.5,KV2:.25,KV3:0},objects={none:0,UT1:2,UT2:1};
  if(!Object.hasOwn(regions,data.region)||!Object.hasOwn(objects,data.object))return null;
  const base=(regions[data.region]+objects[data.object])*100/30;
  const priority=academic>=75?(100-academic)/25*base:base;
  return {basePriority:base,priority:roundPriority?Math.round((priority+Number.EPSILON)*100)/100:priority};
}
export function calculateReviewed(config,data,program) {
  if(['transcript','certificate'].includes(data.exams))return stop('Chỉ học bạ hoặc SAT/ACT/chứng chỉ: chưa đủ bộ quy tắc đã xác minh để tính nhánh này. Không thay điểm thiếu bằng 0.');
  if(!['current','previous'].includes(data.cohort)||!['both','thpt','vact'].includes(data.exams))return stop('Chọn đúng năm tốt nghiệp và các điểm thi năm 2026 thực tế bạn có.');
  if(program.unsupported)return stop(program.unsupported);
  if((config.schoolId==='hcmut'||program.requiresThpt)&&data.exams==='vact')return stop('Ngành/diện đã chọn bắt buộc có điểm THPT 2026; không thay thế bằng ĐGNL.');
  if(config.schoolId==='uel'&&data.cohort==='current'&&data.exams==='vact')return stop('Diện tốt nghiệp 2026 cần điểm thi THPT; không áp dụng nhánh chỉ V-ACT của thí sinh đã tốt nghiệp trước 2026.');
  const componentsOnly=config.verificationStatus==='components-only';
  if(!componentsOnly&&data.bonus!=='none')return stop('Điểm cộng/chứng chỉ/149 trường cần xác minh hồ sơ riêng. Không nhập điểm cộng tự do hoặc mặc định cộng 5 điểm.');
  const errors=[],requirements=reviewedRequirements(config,data),keys=integratedCombos[data.combo];
  const hbCombo=config.schoolId==='hcmus'?(data.hbCombo||data.combo):data.combo;
  if(!program.combos.includes(hbCombo))return stop('Tổ hợp học bạ chưa được đối chiếu cho ngành đã chọn.');
  const hbKeys=integratedCombos[hbCombo];
  function number(value,max,label){const parsed=parseScore(value,max);if(parsed.error||parsed.value===null){errors.push(`${label}: cần số từ 0 đến ${max}, tối đa 2 số thập phân.`);return 0;}return parsed.value;}
  const values={},averages={};let thpt=null,vact=null,hb=null,rawThpt=null,rawHb=null;
  if(requirements.includes('thpt')){for(const key of keys)values[key]=number(data.thpt?.[key],10,'THPT '+key);rawThpt=keys.reduce((s,k)=>s+values[k],0);thpt=rawThpt*100/30;}
  if(requirements.includes('vact'))vact=number(data.vact,1200,'V-ACT 2026')*100/1200;
  for(const key of hbKeys){
    averages[key]=config.schoolId==='uel'
      ? [10,11,12].reduce((s,g)=>s+[1,2].reduce((v,t)=>v+number(data.semester?.[`${key}_${g}_${t}`],10,`Học bạ ${key} lớp ${g} HK${t}`),0),0)/6
      : [10,11,12].reduce((s,g)=>s+number(data.annual?.[`${key}_${g}`],10,`Học bạ ${key} lớp ${g}`),0)/3;
  }
  rawHb=hbKeys.reduce((s,k)=>s+averages[k],0);hb=rawHb*100/30;
  let mathVact=null;
  if(config.schoolId==='hcmut'&&requirements.includes('vact'))mathVact=number(data.vactMath,300,'Thành phần Toán V-ACT');
  if(errors.length)return {status:'invalid',message:errors.join(' '),errors,rows:[],academic:null,final:null};
  if(config.schoolId==='agu'&&program.requiresThpt){
    if(rawThpt<20)return stop('Ngành Luật/sư phạm đã chọn cần tổng THPT gốc ít nhất 20/30 theo thông báo ngưỡng 2026; ưu tiên không thay thế điểm gốc.');
    if(program.programId==='7380101'&&Math.max(values.math??0,values.lit??0)<6)return stop('Ngành Luật AGU cần Toán hoặc Ngữ văn trong tổ hợp đạt tối thiểu 6/10.');
  }
  const row=(label,raw,scale,converted,weight)=>({label,raw,scale,converted,weight});
  let rows=[...(thpt===null?[]:[row('THPT 2026',rawThpt,30,thpt,config.weights?.thpt)]),...(vact===null?[]:[row('V-ACT 2026',Number(data.vact),1200,vact,config.weights?.vact)]),row(config.schoolId==='uel'?'Học bạ trung bình 6 học kỳ':'Học bạ trung bình cả năm 10–12',rawHb,30,hb,config.weights?.transcript)];
  if(componentsOnly)return {status:'reference',message:config.missing,academic:null,final:null,rows:rows.map(r=>({...r,weight:null})),scale:100,formula:'Chỉ quy đổi điểm thành phần; chưa tính điểm học lực/tổng hợp khi thiếu quy tắc quan trọng.'};
  let academic,formula,alternatives=[],reference=false;
  if(config.schoolId==='hcmut'){
    thpt=keys.reduce((s,k)=>s+values[k]*(k==='math'?2:1),0)/4*10;
    hb=hbKeys.reduce((s,k)=>s+averages[k]*(k==='math'?2:1),0)/4*10;
    if(data.exams==='both'){
      const total=Number(data.vact);
      if(mathVact>total||total-mathVact>900)return stop('Tổng V-ACT không khớp thành phần Toán (0–300) và phần còn lại (tối đa 900).');
      vact=(total+mathVact)/15;
    }else vact=thpt*.75;
    academic=thpt*.2+vact*.7+hb*.1;
    rows=[row('THPT · Toán x2 / tổng hệ số 4',null,100,thpt,.2),row(data.exams==='both'?'V-ACT · (tổng 1200 + Toán) / 15':'Năng lực thay thế = 0,75 × THPT quy đổi',data.exams==='both'?Number(data.vact)+mathVact:null,data.exams==='both'?1500:100,vact,.7),row('Học bạ · Toán x2 / tổng hệ số 4',null,100,hb,.1)];
    formula='70% năng lực + 20% THPT + 10% học bạ; Toán nhân hệ số 2';
  }else if(config.schoolId==='hcmus'){
    const candidates=[];
    if(thpt!==null)candidates.push({name:'THPT',exam:thpt,score:.8*thpt+.2*hb,raw:rawThpt,scale:30});
    if(vact!==null){const converted=hcmusVactToThpt(Number(data.vact));if(converted===null)return stop('V-ACT nằm ngoài các mốc 370–1139 của bảng HCMUS 2026 đã kiểm định. Không tự ngoại suy.');candidates.push({name:'V-ACT theo bách phân vị HCMUS',exam:converted*100/30,score:.8*converted*100/30+.2*hb,raw:Number(data.vact),scale:1200});}
    const best=candidates.reduce((a,b)=>a.score>=b.score?a:b);academic=best.score;
    alternatives=candidates.map(c=>`${c.name}: ${c.score.toFixed(2)}/100`);
    rows=[row('Nhánh được chọn: '+best.name,best.raw,best.scale,best.exam,.8),row('Học bạ · tổ hợp '+hbCombo,rawHb,30,hb,.2)];
    formula='Max(80% THPT + 20% HB, 80% V-ACT quy đổi bách phân vị + 20% HB)';
  }else if(config.schoolId==='uel'){
    const candidates=[];
    if(data.exams==='both')candidates.push({name:'Có cả THPT và V-ACT',t:thpt,v:vact,score:.55*vact+.35*thpt+.1*hb});
    if(thpt!==null)candidates.push({name:'Không V-ACT · α2026=1 theo lộ trình còn ghi dự kiến',t:thpt,v:thpt,score:.9*thpt+.1*hb,reference:true});
    if(thpt===null)candidates.push({name:'Thí sinh tự do chỉ V-ACT',t:vact,v:vact,score:.9*vact+.1*hb,reference:true});
    // Do not claim an officially optimal total when a competing substitution rule remains provisional.
    const best=candidates.reduce((a,b)=>a.score>=b.score?a:b);academic=best.score;reference=Boolean(best.reference);
    alternatives=candidates.map(c=>`${c.name}: ${c.score.toFixed(2)}/100`);
    rows=[row('THPT / thành phần thay thế',null,100,best.t,.35),row('V-ACT / thành phần thay thế',null,100,best.v,.55),row('Học bạ 6 học kỳ',rawHb,30,hb,.1)];
    formula='55% V-ACT + 35% THPT + 10% HB; so sánh phương án theo dữ liệu có';
  }else if(config.schoolId==='agu'){
    const best=Math.max(thpt??0,vact??0);academic=.8*best+.2*hb;reference=true;
    rows=[row('THPT / thay thế có lợi nhất với α2026=1 (dự kiến)',null,100,best,.4),row('ĐGNL / thay thế có lợi nhất với α2026=1 (dự kiến)',null,100,best,.4),row('Học bạ 3 năm',rawHb,30,hb,.2)];
    formula='40% THPT + 40% ĐGNL + 20% HB; thay thế theo α2026=1 còn ghi dự kiến';
  }else return stop('Chưa có bộ máy tính đã kiểm định cho cấu hình này.');
  if(reference)return {status:'reference',message:'Thành phần học lực tham khảo theo nhánh/hệ số thay thế còn ghi dự kiến. Không phải điểm xét tuyển cuối cùng. '+config.missing,academic,final:null,rows,scale:100,formula,alternatives};
  if(!data.confirmed)return stop('Cần xác nhận năm thi, tổ hợp tốt nhất, chương trình và điều kiện hồ sơ/ưu tiên theo nguồn trường.');
  const priority=priority100(data,academic,config.schoolId==='hcmut');
  if(!priority)return stop('Khu vực hoặc đối tượng ưu tiên không hợp lệ.');
  return {status:'official',message:'Công thức đã đối chiếu trong phạm vi hỗ trợ, không yêu cầu điểm cộng; hồ sơ và điều kiện đầu vào chưa được trường xác nhận. Không bảo đảm đủ điều kiện hoặc trúng tuyển.',academic,bonus:0,...priority,final:Math.min(100,academic+priority.priority),rows,scale:100,formula,alternatives};
}
