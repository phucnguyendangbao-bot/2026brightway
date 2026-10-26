import { PROFILE_VERSION, GROUPS, REGIONS, SUBJECTS, normalizePersonalization, profileErrors, recommend, wishReview, nextActions } from './personalization-model.js';
import { contextForQuestion } from './personalization-context.js';
import { buildUniversityCatalog } from '../data/university-identities.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let flow, data={jobs:[],schools:[]}, dataStatus='idle', loadPromise, panel, dashboard, lastSharing=false;
const read=()=>flow.read();
const preferences=()=>normalizePersonalization(read().personalization);
function savePreferences(value) {
  const previous=preferences();
  const next=normalizePersonalization({...value,version:PROFILE_VERSION});
  flow.save({personalization:next,...(!next.metricsConsent?{personalMetrics:null}:{})});
  if(!previous.waybiSharing && next.waybiSharing)window.dispatchEvent(new Event('bw:waybi-privacy-reset'));
  return next;
}
function options(items, selected) {return '<option value="">Bỏ qua</option>'+items.map(item=>`<option value="${esc(item)}" ${String(item)===String(selected)?'selected':''}>${esc(item)}</option>`).join('');}
function choices(name,values,selected) {return values.map(value=>`<label class="personal-choice"><input type="checkbox" name="${name}" value="${esc(value)}" ${selected.includes(value)?'checked':''}> ${esc(value)}</label>`).join('');}
function editor() {
  const p=preferences();
  panel=document.createElement('section'); panel.id='personal-profile'; panel.className='personal-section';
  panel.innerHTML=`<div class="personal-heading"><div><span class="flow-kicker">TÙY CHỌN · LƯU TRÊN THIẾT BỊ</span><h2>Cá nhân hóa hành trình</h2></div><a href="#my-choices">Xem nguyện vọng →</a></div>
    <p>Bạn có thể bỏ qua mọi câu hỏi. Hồ sơ không cần tên, số điện thoại hoặc tài khoản. Dữ liệu có thể mất khi xóa dữ liệu trình duyệt.</p>
    ${p.unsupported?'<p role="status">Phiên bản hồ sơ cá nhân hóa chưa được hỗ trợ. Gợi ý và chia sẻ đang tắt; lựa chọn cũ vẫn được giữ.</p>':''}
    <form id="personalProfileForm"><label class="personal-choice"><input id="personalEnabled" type="checkbox" ${p.enabled?'checked':''}> Bật gợi ý cá nhân hóa</label>
    <div class="personal-form-grid">
      <label>Khối lớp (tùy chọn)<select id="personalGrade">${options(['10','11','12','other'],p.grade).replace('>other<','>Đã tốt nghiệp / khác<')}</select></label>
      <label>Năm dự kiến xét tuyển (tùy chọn)<select id="personalYear">${options(Array.from({length:10},(_,i)=>2026+i),p.year)}</select></label>
      <label>Khu vực mong muốn (tùy chọn)<select id="personalRegion">${options(REGIONS,p.region)}</select></label>
      <label>Mức ưu tiên khu vực<select id="personalRegionMode"><option value="soft" ${p.regionMode==='soft'?'selected':''}>Sở thích, vẫn khám phá nơi khác</option><option value="required" ${p.regionMode==='required'?'selected':''}>Điều kiện bắt buộc tôi tự chọn</option></select></label>
      <label>Học phí từ (triệu đồng/năm, tùy chọn)<input id="personalBudgetMin" type="number" min="0" max="2000" step="0.1" inputmode="decimal" value="${p.budgetMin===null?'':p.budgetMin/1e6}" placeholder="Bỏ qua"></label>
      <label>Học phí đến (triệu đồng/năm, tùy chọn)<input id="personalBudgetMax" type="number" min="0" max="2000" step="0.1" inputmode="decimal" value="${p.budgetMax===null?'':p.budgetMax/1e6}" placeholder="Bỏ qua"></label>
      <label>Mức ưu tiên ngân sách<select id="personalBudgetMode"><option value="soft" ${p.budgetMode==='soft'?'selected':''}>Sở thích, vẫn xem lựa chọn khác</option><option value="required" ${p.budgetMode==='required'?'selected':''}>Điều kiện bắt buộc tôi tự chọn</option></select></label>
    </div>
    <details ${p.groups.length?'open':''}><summary>Nhóm lĩnh vực nghề quan tâm (tùy chọn)</summary><fieldset><legend>Bỏ chọn tất cả để bỏ qua</legend><div class="personal-checks">${choices('personalGroups',GROUPS,p.groups)}</div></fieldset><p>Đây là nhóm nghề trong thư viện, không phải tên ngành đào tạo. Chỉ nối với ngành khi có nguồn đối chiếu.</p></details>
    <details ${p.subjects.length?'open':''}><summary>Môn học thế mạnh (tùy chọn)</summary><fieldset><legend>Tự nhận xét, không dùng làm điều kiện trúng tuyển</legend><div class="personal-checks">${choices('personalSubjects',SUBJECTS,p.subjects)}</div></fieldset></details>
    <p id="personalExisting">Holland: ${esc(flow.holland()||'chưa có — có thể bỏ qua')}. Nghề, ngành, trường và nguyện vọng dùng lại danh sách đã lưu bên dưới.</p>
    <div class="personal-actions"><button type="submit">Lưu hồ sơ</button><button type="button" id="personalSkip">Bỏ qua tất cả</button><button type="button" id="personalExport">Xuất hồ sơ .json</button><button type="button" id="personalDelete">Xóa phần cá nhân hóa</button></div>
    <p id="personalProfileStatus" role="status" aria-live="polite"></p></form>
    <details class="personal-privacy"><summary>Chia sẻ với Waybi và thống kê tùy chọn</summary><p>Hồ sơ mới không tự gửi đến dịch vụ AI. Chỉ dữ liệu liên quan đến câu hỏi được gửi khi bạn bật chia sẻ. Tắt chia sẻ sẽ mở hội thoại mới; không thu hồi được dữ liệu đã gửi trước đó.</p>
    <label class="personal-choice"><input id="personalWaybi" type="checkbox" ${p.waybiSharing?'checked':''}> Cho phép Waybi gửi phần hồ sơ liên quan cùng câu hỏi đến dịch vụ AI</label>
    <label class="personal-choice"><input id="personalMetrics" type="checkbox" ${p.metricsConsent?'checked':''}> Ghi bộ đếm thao tác không định danh trên thiết bị này</label>
    <p>Thống kê mặc định tắt; không gửi bộ đếm ra ngoài. Tắt sẽ xóa bộ đếm.</p><p id="personalMetricsSummary"></p></details>`;
  document.querySelector('.flow-profile-details')?.before(panel);
  if(!panel.isConnected)document.querySelector('.flow-local-profile')?.prepend(panel);
  panel.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();
    const val=id=>panel.querySelector('#'+id).value;
    const selected=name=>[...panel.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value);
    const next={...preferences(),grade:val('personalGrade'),year:val('personalYear')?Number(val('personalYear')):null,region:val('personalRegion'),regionMode:val('personalRegionMode'),budgetMin:val('personalBudgetMin')===''?null:Number(val('personalBudgetMin'))*1e6,budgetMax:val('personalBudgetMax')===''?null:Number(val('personalBudgetMax'))*1e6,budgetMode:val('personalBudgetMode'),groups:selected('personalGroups'),subjects:selected('personalSubjects'),enabled:panel.querySelector('#personalEnabled').checked};
    const errors=profileErrors(next);
    if(errors.length){panel.querySelector('#personalProfileStatus').textContent=errors.join(' ');return;}
    savePreferences(next);
    panel.querySelector('#personalProfileStatus').textContent=flow.storageWarning?'Chưa lưu được trên thiết bị; hồ sơ chỉ giữ trong trang này.':next.enabled?'Đã lưu trên thiết bị. Gợi ý được giải thích ở Dành riêng cho bạn.':'Đã lưu trên thiết bị. Cá nhân hóa đang tắt.';
    if(next.enabled)loadData();
  });
  panel.querySelector('#personalEnabled').addEventListener('change',event=>{
    if(!event.target.checked)savePreferences({...preferences(),enabled:false,metricsConsent:false,waybiSharing:false});
  });
  panel.querySelector('#personalSkip').addEventListener('click',()=>{savePreferences({version:1});rebuildEditor('Đã bỏ qua các câu hỏi. Bạn vẫn dùng được mọi công cụ.');});
  panel.querySelector('#personalDelete').addEventListener('click',()=>{savePreferences({version:1});rebuildEditor('Đã xóa phần cá nhân hóa và tắt chia sẻ. Nghề, trường, nguyện vọng vẫn ở danh sách hiện có.');});
  panel.querySelector('#personalExport').addEventListener('click',()=>{
    const state=read();
    const exported={format:'brightway-personal-profile',version:1,personalization:preferences(),holland:flow.holland(),savedCareers:state.savedCareers,savedMajors:state.savedMajors,savedSchools:state.savedSchools,wishes:state.wishes||[],tasks:state.tasks||[]};
    const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='brightway-ho-so-huong-nghiep.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    panel.querySelector('#personalProfileStatus').textContent='Đã xuất hồ sơ trên thiết bị; không kèm tài khoản hoặc lịch sử chat.';
  });
  panel.querySelector('#personalWaybi').addEventListener('change',event=>{
    if(event.target.checked && !preferences().enabled){event.target.checked=false;panel.querySelector('#personalProfileStatus').textContent='Bật và lưu hồ sơ trước khi cho phép chia sẻ với Waybi.';return;}
    savePreferences({...preferences(),waybiSharing:event.target.checked});
  });
  panel.querySelector('#personalMetrics').addEventListener('change',event=>{
    const checked=event.target.checked;
    const protectedBrowser=navigator.globalPrivacyControl===true || navigator.doNotTrack==='1';
    if((!preferences().enabled || protectedBrowser) && checked){event.target.checked=false;return;}
    flow.save({personalMetrics:null});savePreferences({...preferences(),metricsConsent:checked});
  });
  refreshControls();
}
function rebuildEditor(message) {panel?.remove();editor();panel.querySelector('#personalProfileStatus').textContent=message;}
async function loadData() {
  if(loadPromise)return loadPromise;
  dataStatus='loading';renderDashboard();
  loadPromise=(async()=>{
    try {
      const results=await Promise.all(['jobs','schools'].map(async name=>{
        const response=await fetch(`/assets/data/${name}.json`,{signal:AbortSignal.timeout(8000)});
        if(!response.ok)throw Error('HTTP '+response.status);
        const rows=await response.json();if(!Array.isArray(rows) || !rows.length)throw Error('Danh mục rỗng');return rows;
      }));
      data={jobs:results[0].filter(x=>typeof x.name==='string' && Array.isArray(x.holland)),schools:buildUniversityCatalog(results[1]).schools};
      if(!data.jobs.length || !data.schools.length)throw Error('Danh mục thiếu dữ liệu');
      dataStatus='ready';
    } catch {dataStatus='error';}
    finally{loadPromise=null;renderDashboard();renderWishWarnings();}
  })();
  return loadPromise;
}
function schoolCard(item) {
  const reasons=item.reasons.length?item.reasons:['Lựa chọn trong thư viện để bạn khám phá thêm.'];
  return `<li><a href="page2.html?school=${encodeURIComponent(item.school.id)}">${esc(item.school.name)}</a><ul>${[...reasons,...item.unknown,...item.outside].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${item.programSource?`<a href="${esc(item.programSource)}" target="_blank" rel="noopener noreferrer">Nguồn đối chiếu ngành 2026 ↗</a>`:''}</li>`;
}
function renderDashboard() {
  if(!dashboard)return;
  const state=read(), p=preferences();
  const compact=location.pathname.endsWith('index.html') || location.pathname.endsWith('/');
  if(compact)document.querySelector('.flow-resume > .flow-journey')?.toggleAttribute('hidden',p.enabled);
  dashboard.hidden=!p.enabled;
  if(!p.enabled){dashboard.replaceChildren();return;}
  const actions=nextActions(state,flow.holland());
  dashboard.innerHTML=`<div class="personal-heading"><div><span class="flow-kicker">DỰA TRÊN LỰA CHỌN BẠN ĐÃ LƯU</span><h2>Dành riêng cho bạn</h2></div><a href="profile.html?tab=journey#personal-profile">Chỉnh hồ sơ →</a></div>
    <p>Holland: <strong>${esc(flow.holland()||'bỏ qua / chưa có')}</strong> · ${state.savedCareers.length} nghề · ${state.savedMajors.length} ngành · ${state.savedSchools.length} trường · ${(state.wishes||[]).length} nguyện vọng dự kiến.</p>
    <p>${flow.progress(state).filter(x=>x.complete).length}/5 bước đã có tiến độ. Bạn có thể bắt đầu ở bất kỳ bước nào.</p>
    <div class="personal-actions">${actions.slice(0,compact?2:5).map(x=>`<a href="${esc(x.href)}">${esc(x.text)} →</a>`).join('')}</div>
    ${compact?'<a class="personal-more" href="profile.html?tab=journey#personal-recommendations">Xem gợi ý và lý do lựa chọn →</a>':`<section id="personal-recommendations" aria-busy="${dataStatus==='loading'}"><h3>Gợi ý để khám phá</h3><p>Holland là sở thích, không phải đánh giá năng lực. Điều kiện bắt buộc do bạn chọn được tách khỏi sở thích; thiếu dữ liệu được ghi rõ. Mọi trường vẫn có trong thư viện.</p>${dataStatus==='ready'?recommendationHTML(state):dataStatus==='error'?'<p role="status">Chưa tải được dữ liệu gợi ý. Hồ sơ đã lưu vẫn được giữ.</p><button type="button" data-personal-retry>Thử tải lại gợi ý</button>':'<p role="status">Đang tải dữ liệu nghề và trường…</p>'}</section>`}`;
  dashboard.querySelector('[data-personal-retry]')?.addEventListener('click',loadData);
}
function recommendationHTML(state) {
  const result=recommend({state,holland:flow.holland(),...data});
  return `${result.notices.map(x=>`<p class="personal-note">${esc(x)}</p>`).join('')}
    <h4>Nghề đáng tìm hiểu</h4><ul class="personal-results">${result.careers.slice(0,4).map(({job,reasons})=>`<li><a href="careers-holland.html?q=${encodeURIComponent(job.name)}&holland=all">${esc(job.name)}</a><ul>${reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></li>`).join('')||'<li>Chưa có sở thích hoặc nghề đã lưu. Bạn có thể bỏ qua hồ sơ và khám phá toàn bộ nghề.</li>'}</ul>
    <h4>Trường đáng khám phá</h4><p>Ưu tiên số lý do khớp sở thích rõ ràng, rồi theo tên trường; không dùng điểm chuẩn hoặc tài trợ để sắp xếp. Danh sách này không xác nhận đủ điều kiện xét tuyển.</p>
    <ul class="personal-results">${result.schools.slice(0,4).map(schoolCard).join('')||'<li>Chưa có trường đủ dữ liệu để đối chiếu các điều kiện bắt buộc đã chọn.</li>'}</ul>
    <details><summary>Xem toàn bộ lựa chọn có thể khám phá (${result.schools.length})</summary><ul class="personal-results">${result.schools.map(schoolCard).join('')}</ul></details>
    <details><summary>Chưa đủ dữ liệu theo điều kiện bắt buộc (${result.unknown.length})</summary><p>Những trường này chưa bị kết luận là không phù hợp. Hãy xác minh thông tin còn thiếu.</p><ul class="personal-results">${result.unknown.map(schoolCard).join('')}</ul></details>
    <details><summary>Ngoài điều kiện bắt buộc bạn đã chọn (${result.outside.length})</summary><ul class="personal-results">${result.outside.map(schoolCard).join('')}</ul></details>
    <a href="page2.html?mode=school">Khám phá mọi trường trong thư viện →</a>`;
}
function renderWishWarnings() {
  const list=document.getElementById('myWishes');if(!list)return;
  let host=document.getElementById('personalWishReview');
  if(!host){host=document.createElement('details');host.id='personalWishReview';host.className='personal-section';list.after(host);}
  const warnings=wishReview(read(),data.schools);
  host.hidden=!warnings.length;
  host.innerHTML=`<summary>Những việc cần kiểm tra cho nguyện vọng (${warnings.length})</summary><p>Các nhắc nhở không thay đổi thứ tự lựa chọn của bạn.</p><ul>${warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
}
function chatControls() {
  for(const [panelId,inputWrap,inputId] of [['bwChatPanel','.bw-chat-input-wrap','bwChatInput'],['waybi-panel','#waybi-input-wrap','waybi-input']]) {
    const chat=document.getElementById(panelId);if(!chat || chat.querySelector('[data-personal-chat]'))continue;
    const host=document.createElement('div');host.className='personal-waybi';host.dataset.personalChat='';
    host.innerHTML='<label><input type="checkbox" data-waybi-profile> Chia sẻ hồ sơ liên quan với Waybi</label><details><summary>Dữ liệu gửi cùng câu hỏi</summary><p>Chỉ gửi đến dịch vụ AI sau khi bạn bật chia sẻ và gửi câu hỏi. Đổi lựa chọn sẽ mở hội thoại mới.</p><pre data-waybi-profile-preview>Không chia sẻ hồ sơ.</pre></details>';
    const target=chat.querySelector(inputWrap)||chat.querySelector('#'+inputId)?.parentElement;
    if(target)target.before(host);else chat.append(host);
    host.querySelector('input').addEventListener('change',event=>{
      if(event.target.checked && !preferences().enabled){event.target.checked=false;host.querySelector('pre').textContent='Bật và lưu hồ sơ tại Hành trình của tôi trước. Không chia sẻ.';return;}
      savePreferences({...preferences(),waybiSharing:event.target.checked});
      if(event.target.checked)loadData();
      update();
    });
    const update=()=>{host.querySelector('input').checked=preferences().waybiSharing;const context=contextForQuestion(document.getElementById(inputId)?.value||'',read(),{...data,holland:flow.holland()});host.querySelector('pre').textContent=context?JSON.stringify(context,null,2):preferences().waybiSharing?'Không có dữ liệu hồ sơ liên quan đến câu hỏi này.':'Không chia sẻ hồ sơ.';};
    document.getElementById(inputId)?.addEventListener('input',update);update();
  }
}
function refreshControls() {
  const p=preferences();
  if(lastSharing && !p.waybiSharing)window.dispatchEvent(new Event('bw:waybi-privacy-reset'));
  lastSharing=p.waybiSharing;
  for(const id of ['personalWaybi','personalMetrics']) {const input=document.getElementById(id);if(input)input.checked=id==='personalWaybi'?p.waybiSharing:p.metricsConsent;}
  document.querySelectorAll('[data-waybi-profile]').forEach(input=>{input.checked=p.waybiSharing;});
  if(!p.waybiSharing)document.querySelectorAll('[data-waybi-profile-preview]').forEach(node=>{node.textContent='Không chia sẻ hồ sơ.';});
  const metrics=document.getElementById('personalMetricsSummary');
  if(metrics)metrics.textContent=p.metricsConsent?'Bộ đếm trên thiết bị (không đại diện người dùng toàn hệ thống): '+JSON.stringify(read().personalMetrics||{}):'Chưa ghi thống kê. Chưa có dữ liệu người dùng thực để tính tỷ lệ hoàn thành toàn hệ thống.';
}
function recordMetric(key) {
  if(!preferences().metricsConsent || navigator.globalPrivacyControl===true || navigator.doNotTrack==='1')return;
  const allowed=['journeyStarted','hollandCompleted','careerViewed','schoolSaved','wishesAdded','actions'];if(!allowed.includes(key))return;
  const previous=read().personalMetrics||{}, counters={};
  for(const k of allowed)counters[k]=Number.isSafeInteger(previous[k]) && previous[k]>=0?previous[k]:0;
  counters[key]=Math.min(counters[key]+1,1e6);flow.save({personalMetrics:counters});
}
export function initPersonalization() {
  if(window.BWPersonalization || !window.BWFlow)return;
  flow=window.BWFlow;
  const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/css/personalization.css?v=20261021';document.head.append(css);
  window.BWPersonalization={context:question=>contextForQuestion(question,read(),{...data,holland:flow.holland()}),record:recordMetric};
  const page=location.pathname.split('/').pop()||'index.html';
  if(page==='profile.html')editor();
  if(['index.html','profile.html'].includes(page)) {
    dashboard=document.createElement('section');dashboard.id='personalDashboard';dashboard.className='personal-section';dashboard.hidden=true;
    if(page==='index.html')document.querySelector('.flow-resume')?.append(dashboard);
    else panel?.after(dashboard);
  }
  // New visitors still see the original introduction; the entry point is optional.
  if(page==='index.html') {
    const link=document.createElement('a');link.className='personal-start';link.href='profile.html?tab=journey#personal-profile';link.textContent='Tùy chỉnh hành trình theo sở thích của bạn →';
    document.querySelector('#hero-actions .home-waybi-shortcut')?.after(link);
    if(!link.isConnected)document.querySelector('.flow-resume')?.before(link);
  }
  let previous=read();
  window.addEventListener('bw:journey-change',event=>{
    const state=read();
    if(previous.personalization?.metricsConsent && !preferences().metricsConsent && state.personalMetrics){flow.save({personalMetrics:null});return;}
    const milestones=[];
    if(event.detail?.storageKey==='studentHollandV1') {
      try { const result=JSON.parse(flow.storage.get('studentHollandV1')); if(result?.completed===true && result.answered===42)milestones.push('hollandCompleted'); } catch { /* corrupt data is not a completion */ }
    }
    if((state.savedSchools||[]).length>(previous.savedSchools||[]).length)milestones.push('schoolSaved');
    if((state.wishes||[]).length>(previous.wishes||[]).length)milestones.push('wishesAdded');
    if(state.career?.name && state.career.name!==previous.career?.name)milestones.push('careerViewed');
    previous=state;
    refreshControls();renderDashboard();renderWishWarnings();
    milestones.forEach(recordMetric);
    if(preferences().enabled && dataStatus==='idle')loadData();
  });
  document.addEventListener('click',event=>{
    const action=event.target.closest('a,button');if(!action || action.closest('.personal-privacy'))return;
    if(action.matches('.home-journey-card'))recordMetric('journeyStarted');
    recordMetric('actions');
  });
  chatControls();refreshControls();renderDashboard();renderWishWarnings();
  window.addEventListener('bw:waybi-ready',chatControls);
  if(preferences().enabled || page==='profile.html')loadData();
  if(location.hash==='#personal-profile')panel?.scrollIntoView();
}
