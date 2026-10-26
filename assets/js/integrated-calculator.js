import { integratedSchools, integratedSchool, integratedCombos, integratedSubjects } from '../data/integrated-admissions-2026.js?v=20261020-expanded';
import { calculateIntegrated, integratedRequirements } from './integrated-score-rules.js?v=20261020-expanded';
import { parseScore } from './score-rules.js';
import { detailsForSchool } from '../data/school-profile-details.js';
import { integratedVerification } from './integrated-verification.js';
import { integratedThresholds } from './integrated-thresholds.js';
import { sortedPrograms } from './training-taxonomy.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusText = { official:'Công thức đã đối chiếu · kết quả theo dữ liệu bạn khai', reference:'Tham khảo · không phải điểm xét tuyển cuối cùng', unsupported:'Chưa hỗ trợ tính nhánh này', invalid:'Kiểm tra dữ liệu đầu vào' };
export function createIntegratedCalculator() {
  const host = document.createElement('section');
  host.className = 'calc-card integrated-card'; host.id = 'integratedCard'; host.hidden = true;
  host.innerHTML = `<h2 class="calc-section-title">Trường & ngành · Xét tuyển tổng hợp 2026</h2>
    <p class="calc-field-note">Chỉ áp dụng quy định 2026. Chương trình chưa xác minh sẽ không xuất điểm. Không dùng quy định này cho 2027.</p>
    <label for="integratedSchool">Trường thuộc ĐHQG-HCM</label><select id="integratedSchool"><option value="">Chọn trường</option>${integratedSchools.map(s=>`<option value="${s.schoolId}">${esc(s.name)}</option>`).join('')}</select>
    <label for="integratedProgram">Ngành / chương trình trong phạm vi đã đối chiếu</label><select id="integratedProgram" disabled><option value="">Chọn trường trước</option></select>
    <div id="integratedPolicy" role="status"></div><div id="integratedBranchPolicy" role="status"></div><div id="integratedFields"></div>`;
  document.querySelector('.calc-method-card').after(host);
  const result = document.createElement('section');
  result.id = 'integratedResult'; result.className = 'result-summary integrated-result'; result.hidden = true;
  result.setAttribute('aria-live','polite');
  document.querySelector('.calc-result-panel').prepend(result);
  const schoolSelect = host.querySelector('#integratedSchool');
  const programSelect = host.querySelector('#integratedProgram');
  const fields = host.querySelector('#integratedFields');
  const saved = window.BWFlow?.read().integratedScores;
  let drafts = saved?.drafts && typeof saved.drafts === 'object' ? saved.drafts : {};
  let currentSchool = '';
  const active = () => document.querySelector('input[name="admissionMethod"]:checked')?.value === 'integrated';
  function current() {
    const values = Object.fromEntries([...fields.querySelectorAll('[data-field]')].map(input=>[input.dataset.field,input.type==='checkbox'?input.checked:input.value]));
    const annual = { ...drafts[currentSchool]?.annual }, thpt = { ...drafts[currentSchool]?.thpt }, semester = {...drafts[currentSchool]?.semester};
    for (const [key,value] of Object.entries(values)) {
      if (key.startsWith('annual_')) annual[key.slice(7)] = value;
      if (key.startsWith('thpt_')) thpt[key.slice(5)] = value;
      if (key.startsWith('semester_')) semester[key.slice(9)] = value;
    }
    return { ...drafts[currentSchool], ...values, year:2026, schoolId:currentSchool, programId:programSelect.value, thpt, annual, semester };
  }
  function save() {
    if (currentSchool) drafts[currentSchool] = current();
    window.BWFlow?.save({ integratedScores:{ schoolId:currentSchool, drafts } });
    if (active()) {
      const url = new URL(location.href);
      url.searchParams.set('method','integrated');
      for (const [key,value] of [['integratedSchool',currentSchool],['integratedProgram',programSelect.value]]) {
        if (value) url.searchParams.set(key,value); else url.searchParams.delete(key);
      }
      history.replaceState(null,'',url);
    }
  }
  function invalidate() { result.hidden = true; if (active()) document.getElementById('resultEmpty').hidden = false; }
  function options(items, chosen) { return items.map(([value,label])=>`<option value="${value}"${value===chosen?' selected':''}>${esc(label)}</option>`).join(''); }
  function select(id,label,items,data) { return `<label for="i_${id}">${esc(label)}</label><select id="i_${id}" data-field="${id}">${options(items,data[id])}</select>`; }
  function numeric(id,label,max,value) { return `<label class="integrated-input" for="i_${id}"><span>${esc(label)}</span><input id="i_${id}" data-field="${id}" type="text" inputmode="decimal" autocomplete="off" placeholder="0–${max}" value="${esc(value)}" aria-invalid="false"></label>`; }
  function renderFields() {
    const config = integratedSchool(currentSchool);
    const program = config?.programs.find(p=>p.programId===programSelect.value);
    fields.innerHTML = '';
    host.querySelector('#integratedBranchPolicy').innerHTML='';
    if (!config?.engine || !program) return;
    const data = { cohort:'current', exams:'thpt', region:'KV3', object:'none', bonus:'none', ...drafts[currentSchool] };
    if (!program.combos.includes(data.combo)) data.combo = program.combos[0];
    const verification=integratedVerification({...data,schoolId:currentSchool,programId:program.programId,year:2026});
    host.querySelector('#integratedBranchPolicy').innerHTML=`<p><strong>${esc(verification.label)}</strong> · ${esc(program.name)}</p><p class="calc-field-note">${esc(verification.reason)}</p>`;
    if (program.unsupported) { fields.innerHTML='<p class="calc-field-note">'+esc(program.unsupported)+'</p>'; return; }
    const comboOptions=program.combos.map(c=>[c,(c.includes('-')?'':c+' · ')+integratedCombos[c].map(k=>integratedSubjects[k]).join(', ')]);
    let html = select('combo','Tổ hợp điểm thi đang tính',comboOptions,data);
    if (config.schoolId==='hcmus') {
      if (!program.combos.includes(data.hbCombo)) data.hbCombo=data.combo;
      html+=select('hbCombo','Tổ hợp học bạ tốt nhất (có thể khác tổ hợp thi)',comboOptions,data);
    }
    html += select('cohort','Năm tốt nghiệp THPT',[['current','Năm 2026'],['previous','Trước năm 2026']],data);
    html += select('exams','Điểm thi năm 2026 bạn có',[['thpt','Chỉ có THPT 2026'],['both','Có cả THPT và V-ACT 2026'],['vact','Chỉ có V-ACT 2026'],['transcript','Chỉ có học bạ — chưa hỗ trợ'],['certificate','SAT/ACT/chứng chỉ thay điểm — cần xác minh']],data);
    const blocked = !['thpt','both','vact'].includes(data.exams) || (config.schoolId==='hcmut'||program.requiresThpt)&&data.exams==='vact' || ['hcmiu','uel'].includes(config.schoolId)&&data.cohort==='current'&&data.exams==='vact';
    if (blocked) html += '<p class="calc-field-note">Nhánh này chưa hỗ trợ tính: cần đối chiếu kỳ thi, bảng quy đổi hoặc điều kiện tốt nghiệp tương ứng. Nhấn Tính điểm để xem lý do.</p>';
    if (!blocked) {
      const required = integratedRequirements(config,data);
      const keys = integratedCombos[data.combo];
      const hbKeys=integratedCombos[config.schoolId==='hcmus'?data.hbCombo:data.combo];
      if (required.includes('thpt')) html += '<h3>Điểm gốc THPT 2026 · thang 10 mỗi môn</h3><div class="integrated-grid">'+keys.map(k=>numeric('thpt_'+k,integratedSubjects[k],10,data.thpt?.[k])).join('')+'</div>';
      if (required.includes('vact')) html += numeric('vact','Tổng V-ACT 2026 gốc, thang 1200',1200,data.vact);
      if (required.includes('vact')&&config.schoolId==='hcmut') html+=numeric('vactMath','Điểm thành phần Toán V-ACT (0–300), để nhân Toán x2',300,data.vactMath);
      if (required.includes('transcript')) html += config.schoolId==='uel'
        ? '<h3>Học bạ · đủ 6 học kỳ từng môn</h3><p class="calc-field-note">Nhập điểm trung bình môn mỗi học kỳ lớp 10, 11, 12; không mặc định điểm cả năm tương đương trung bình 6 học kỳ.</p><div class="integrated-grid">'+hbKeys.flatMap(k=>[10,11,12].flatMap(g=>[1,2].map(t=>numeric(`semester_${k}_${g}_${t}`,`${integratedSubjects[k]} · lớp ${g} HK${t}`,10,data.semester?.[`${k}_${g}_${t}`])))).join('')+'</div>'
        : '<h3>Học bạ · điểm cả năm từng môn</h3><p class="calc-field-note">Nhập riêng lớp 10, 11, 12; công cụ lấy trung bình 3 năm rồi cộng 3 môn. Không dùng điểm một học kỳ hoặc trung bình tất cả môn.'+(config.schoolId==='hcmut'?' Toán được nhân 2, chia tổng hệ số 4.':'')+'</p><div class="integrated-grid">'+hbKeys.flatMap(k=>[10,11,12].map(g=>numeric(`annual_${k}_${g}`,`${integratedSubjects[k]} · lớp ${g}`,10,data.annual?.[`${k}_${g}`]))).join('')+'</div>';
      if (config.verificationStatus !== 'components-only') {
        html += select('bonus','Điểm cộng / chứng chỉ / danh sách 149 trường',[['none','Không yêu cầu điểm cộng'],['achievement','Có thành tích — cần xác minh'],['certificate','Có chứng chỉ — cần xác minh'],['school149','Thuộc danh sách 149 trường — cần xác minh'],['unverified','Hồ sơ khác — cần xác minh']],data);
        html += '<p class="calc-field-note">Không nhập điểm cộng tự do. Diện có điểm cộng cần kiểm tra danh sách, thời gian học, học lực và chống cộng trùng; công cụ chưa hỗ trợ xác nhận hồ sơ này.</p>';
        html += select('region','Khu vực ưu tiên theo hồ sơ tuyển sinh (không phải nơi đang ở)',[['KV3','KV3'],['KV2','KV2'],['KV2NT','KV2 nông thôn'],['KV1','KV1']],data);
        html += select('object','Đối tượng ưu tiên đã đủ điều kiện',[['none','Không có'],['UT1','UT1'],['UT2','UT2']],data);
        html += `<label class="transcript-confirm"><input id="i_confirmed" data-field="confirmed" type="checkbox"${data.confirmed?' checked':''}><span>Tôi dùng điểm thi 2026, học bạ đúng yêu cầu, đã chọn tổ hợp tốt nhất trong các tổ hợp được hỗ trợ và đối chiếu điều kiện hồ sơ/ưu tiên trong nguồn trường. Chỉ tính chương trình trong nước đã ghi rõ, không dùng cho liên kết, chuyển tiếp hoặc chứng chỉ thay điểm.</span></label>`;
      }
    }
    fields.innerHTML = html;
  }
  function renderSchool(restoreProgram = '') {
    currentSchool = schoolSelect.value;
    const config = integratedSchool(currentSchool);
    programSelect.innerHTML = '<option value="">'+(config?.programs.length?'Chọn ngành / chương trình':config?'Chưa xác minh đủ cấu hình theo ngành':'Chọn trường trước')+'</option>'+sortedPrograms((config?.programs || []).map(p=>({...p,code:p.programId}))).map(({program:p})=>`<option value="${p.programId}">${p.programId} · ${esc(p.name)}</option>`).join('');
    programSelect.disabled = !config?.programs.length;
    if (config?.programs.some(p=>p.programId===restoreProgram)) programSelect.value = restoreProgram;
    host.querySelector('#integratedPolicy').innerHTML = config ? `<p><strong>${config.verificationStatus==='verified-scope'?'Có công thức chính thức trong phạm vi giới hạn':config.verificationStatus==='components-only'?'Chỉ quy đổi thành phần · chưa xuất điểm tổng hợp':'Tham khảo · chưa xuất điểm cuối cùng'}</strong></p><p>${esc(config.missing)}</p><p class="calc-field-note">Năm 2026 · Rà soát ${config.checkedAt}. ${config.sourceDate?'Mốc văn bản: '+config.sourceDate+'. ':'Chưa xác nhận ngày ban hành đầy đủ. '}${esc(config.sourceDateNote || '')}</p><a href="${esc(config.sourceUrl)}" target="_blank" rel="noopener noreferrer">Nguồn chính thức ↗</a>${(config.extraSources || []).map(s=>` · <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}` : '<p>Chọn trường để xem dữ liệu và phạm vi hỗ trợ.</p>';
    renderFields(); invalidate();
  }
  schoolSelect.addEventListener('change',()=>{ save(); renderSchool(drafts[schoolSelect.value]?.programId); save(); });
  programSelect.addEventListener('change',()=>{ if(currentSchool) drafts[currentSchool]={...drafts[currentSchool],programId:programSelect.value}; renderFields(); save(); invalidate(); });
  fields.addEventListener('input',()=>{ save(); invalidate(); });
  fields.addEventListener('change',event=>{ save(); if(['combo','hbCombo','cohort','exams','bonus'].includes(event.target.dataset.field)) renderFields(); invalidate(); });
  const params = new URLSearchParams(location.search);
  const requested = params.get('integratedSchool') || params.get('school');
  schoolSelect.value = integratedSchool(requested)?.schoolId || (integratedSchool(saved?.schoolId)?.schoolId ?? '');
  renderSchool(params.get('integratedProgram') || drafts[schoolSelect.value]?.programId);
  return {
    update(enabled) {
      const entering = enabled && host.hidden;
      host.hidden = !enabled;
      if (!enabled) {
        result.hidden = true;
        const url = new URL(location.href);
        for (const key of ['method','integratedSchool','integratedProgram']) url.searchParams.delete(key);
        history.replaceState(null,'',url);
      }
      if (entering) {
        const targetId = document.getElementById('targetSchool').value;
        if (!currentSchool && integratedSchool(targetId)) {
          const targetProgram = detailsForSchool(targetId)?.programs?.[document.getElementById('targetProgram').value];
          schoolSelect.value=targetId; renderSchool(drafts[targetId]?.programId || targetProgram?.code);
        }
        save();
      }
    },
    calculate() {
      save();
      const data = current();
      const outcome = calculateIntegrated(data);
      fields.querySelectorAll('input[inputmode="decimal"]').forEach(input=>input.setAttribute('aria-invalid',String(Boolean(parseScore(input.value,input.dataset.field==='vact'?1200:input.dataset.field==='vactMath'?300:10).error || !input.value.trim()))));
      const config = integratedSchool(currentSchool);
      const program = config?.programs.find(p=>p.programId===data.programId);
      const f = n => n.toFixed(2);
      const verification=integratedVerification(data,outcome);
      result.innerHTML = `<h2>${esc(verification.label)}</h2><p>${esc(statusText[outcome.status])}</p><p>${esc(config?.name || 'Chưa chọn trường')}${program?' · '+esc(program.name):''} · Tuyển sinh 2026</p><p>${esc(outcome.message)}</p>`;
      if (outcome.rows.length) result.innerHTML += `<p>${esc(outcome.formula)}</p><p class="calc-field-note">Vuốt hoặc cuộn ngang bảng để xem trọng số và điểm đóng góp nếu màn hình nhỏ.</p><div class="integrated-table-wrap" tabindex="0" role="region" aria-label="Bảng thành phần điểm, cuộn ngang nếu cần"><table><thead><tr><th scope="col">Thành phần</th><th scope="col">Điểm gốc</th><th scope="col">Quy về 100</th><th scope="col">Trọng số</th><th scope="col">Đóng góp</th></tr></thead><tbody>${outcome.rows.map(r=>`<tr><th scope="row">${esc(r.label)}</th><td>${r.raw===null?'Quy đổi / thay thế':f(r.raw)+'/'+r.scale}</td><td>${f(r.converted)}</td><td>${r.weight==null?'Chưa áp dụng':r.weight*100+'%'}</td><td>${r.weight==null?'—':f(r.converted*r.weight)}</td></tr>`).join('')}</tbody></table></div>${Number.isFinite(outcome.academic)?`<p>Học lực: <strong id="integratedAcademic">${f(outcome.academic)}/100</strong></p>`:''}`;
      if (outcome.alternatives?.length) result.innerHTML+='<p>Đối chiếu phương án: '+outcome.alternatives.map(esc).join(' · ')+'</p>';
      if (outcome.final !== null) result.innerHTML += `<p>Điểm cộng: 0 (không yêu cầu) · Ưu tiên gốc: ${f(outcome.basePriority)} · Ưu tiên sau giảm: ${f(outcome.priority)}</p><p>Điểm tổng hợp theo dữ liệu khai: <strong id="integratedTotal">${f(outcome.final)}/100</strong></p><p>${currentSchool==='hcmiu'&&outcome.final<50?'Dưới ngưỡng tổng hợp 50/100 được nguồn IU công bố.':'Chưa xác nhận đủ điều kiện hồ sơ/ngưỡng đầu vào của ngành.'} Không phải kết quả trúng tuyển.</p>`;
      const thresholds=integratedThresholds({...data,thptKeys:integratedCombos[data.combo]},outcome);
      if(thresholds.length) result.innerHTML+='<div id="integratedThresholds"><h3>Đối chiếu ngưỡng đã có căn cứ</h3>'+thresholds.map(c=>`<p>${c.met===null?'Chưa kết luận':c.met?'Đạt ngưỡng số học':'Chưa đạt ngưỡng số học'} · ${esc(c.label)}${c.met===null?'':`: ${f(c.value)}/${c.scale}, tối thiểu ${c.minimum}/${c.scale}`}.</p>`).join('')+'<p class="calc-field-note">Chỉ đối chiếu các ngưỡng ghi trên, không phải điểm chuẩn hoặc xác nhận đủ mọi điều kiện hồ sơ/ngành.</p></div>';
      if (config) result.innerHTML += `<p><a href="${esc(config.sourceUrl)}" target="_blank" rel="noopener noreferrer">Đối chiếu văn bản chính thức ↗</a>${(config.extraSources||[]).map(s=>` · <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')} · Năm 2026 · Rà soát ${config.checkedAt}${config.sourceDate?' · Mốc văn bản '+config.sourceDate:''}</p>`;
      result.hidden = false;
      document.getElementById('resultEmpty').hidden = true;
      result.scrollIntoView({block:'start',behavior:'instant'});
      if (outcome.status==='invalid') fields.querySelector('[aria-invalid="true"]')?.focus({preventScroll:true});
    },
    reset() { drafts={}; currentSchool=''; schoolSelect.value=''; renderSchool(); window.BWFlow?.save({integratedScores:null}); },
    invalidate,
  };
}
