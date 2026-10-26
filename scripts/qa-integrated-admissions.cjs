const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright-core');
const root=path.resolve(__dirname,'..'), artifacts=path.join(root,'.cache','integrated-admissions');
fs.mkdirSync(artifacts,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  try {const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);} catch {res.writeHead(404).end();}
});
let browser,base; const report=[];
async function check(name,fn,width=390) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try {await page.goto(base+'/score-calculator.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#targetSchool').options.length>1);await page.locator('[name=admissionMethod][value=integrated]').check();const details=await fn(page,context);assert.deepEqual(errors,[]);report.push({name,status:'PASS',...details});}
  catch(e) {report.push({name,status:'FAIL',error:e.stack});await page.screenshot({path:path.join(artifacts,name+'-failure.png'),fullPage:true}).catch(()=>{});}
  finally {await context.close();console.log(name+': '+report.at(-1).status);}
}
async function iu(page) {await page.locator('#integratedSchool').selectOption('hcmiu');await page.locator('#integratedProgram').selectOption('7480201');}
async function scores(page) {for(const node of await page.locator('#integratedFields input[inputmode=decimal]:visible').all()) {const id=await node.getAttribute('id');await node.fill(id==='i_vact'?'900':id==='i_vactMath'?'240':'8');}if(await page.locator('#i_confirmed').count())await page.locator('#i_confirmed').check();}
async function run() {
  await check('eight-schools-selectable-scopes-and-honest-results',async page=>{
    const schools=await page.locator('#integratedSchool option').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean));
    assert.deepEqual(schools,['hcmut','uhs','hcmus','ussh','uit','uel','hcmiu','agu']);
    for(const id of schools) {
      await page.locator('#integratedSchool').selectOption(id);
      assert.match(await page.locator('#integratedPolicy a').first().getAttribute('href'),/^https:/);
      assert.ok(await page.locator('#integratedProgram option').count()>1);
      const value=id==='agu'?'7480201':id==='uel'?'401':await page.locator('#integratedProgram option').nth(1).getAttribute('value');
      await page.locator('#integratedProgram').selectOption(value);await scores(page);await page.locator('#calcBtn').click();
      if(['uhs','ussh','uit'].includes(id)) {assert.equal(await page.locator('#integratedAcademic').count(),0);assert.equal(await page.locator('#integratedTotal').count(),0);assert.match(await page.locator('#integratedResult').innerText(),/Chỉ quy đổi điểm thành phần/);}
      else if(['agu','uel'].includes(id)) {assert.equal(await page.locator('#integratedTotal').count(),0);assert.match(await page.locator('#integratedResult').innerText(),/Tham khảo/);}
      else assert.equal(await page.locator('#integratedTotal').count(),1);
    }
    return {schools:8,componentOnlySchools:3,provisionalBranches:2};
  });
  await check('iu-five-branches-and-visible-inputs',async page=>{
    await iu(page);
    for(const [cohort,exams,count,total] of [['current','both',13,'77.50/100'],['current','thpt',12,'73.20/100'],['previous','both',4,'77.66/100'],['previous','thpt',3,'73.36/100'],['previous','vact',1,'82.88/100']]) {
      await page.locator('#i_cohort').selectOption(cohort);await page.locator('#i_exams').selectOption(exams);
      assert.equal(await page.locator('#integratedFields input[inputmode=decimal]:visible').count(),count,cohort+'/'+exams);
      await scores(page);await page.locator('#calcBtn').click();
      assert.equal(await page.locator('#integratedTotal').innerText(),total);
      assert.match(await page.locator('#integratedResult').innerText(),/Đã xác minh, có thể tính.*kết quả theo dữ liệu bạn khai/s);
      assert.equal(await page.locator('#resultSummary').isVisible(),false);
    }
    await page.locator('#i_cohort').selectOption('current');await page.locator('#i_exams').selectOption('vact');await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').count(),0);
    assert.match(await page.locator('#integratedResult').innerText(),/cần điểm THPT 2026/);
    return {branches:5,missingThptBlocked:true};
  });
  await check('iu-programs-combinations-and-validation',async page=>{
    await iu(page); let cases=0;
    for(const program of ['7480201','7480101','7460108','7460112','7460201']) {
      await page.locator('#integratedProgram').selectOption(program);
      for(const combo of ['A00','A01','X06','X10','X26']) {
        await page.locator('#i_combo').selectOption(combo);await scores(page);await page.locator('#calcBtn').click();
        assert.equal(await page.locator('#integratedTotal').innerText(),'73.20/100'); cases++;
      }
    }
    for(const value of ['','-1','10.01','8.123','1e1','abc']) {
      await page.locator('#i_thpt_math').fill(value);await page.locator('#calcBtn').click();
      assert.match(await page.locator('#integratedResult').innerText(),/Kiểm tra dữ liệu/);
      assert.equal(await page.locator('#i_thpt_math').getAttribute('aria-invalid'),'true');
      assert.equal(await page.locator('#integratedTotal').count(),0);
    }
    return {programCombinationCases:cases,invalidValues:6};
  });
  await check('iu-bonus-priority-and-special-program-gates',async page=>{
    await iu(page);await scores(page);
    await page.locator('#i_bonus').selectOption('unverified');await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').count(),0);assert.match(await page.locator('#integratedResult').innerText(),/Không mặc định cộng 5/);
    await page.locator('#i_bonus').selectOption('none');await page.locator('#i_region').selectOption('KV1');await page.locator('#i_object').selectOption('UT1');await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').innerText(),'82.36/100');
    assert.equal(await page.locator('#integratedProgram option[value*="LK"]').count(),0);
    await page.locator('#i_confirmed').uncheck();await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').count(),0);
  });
  await check('branch-verification-transcript-certificates-and-149-gates',async page=>{
    await iu(page);await scores(page);
    assert.match(await page.locator('#integratedBranchPolicy').innerText(),/Đã xác minh, có thể tính/);
    for(const bonus of ['achievement','certificate','school149']) {
      await page.locator('#i_bonus').selectOption(bonus);
      assert.match(await page.locator('#integratedBranchPolicy').innerText(),/Có thông tin nhưng chưa đủ để tính/);
      await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').count(),0);
    }
    await page.locator('#i_bonus').selectOption('none');
    for(const exams of ['transcript','certificate']) {
      await page.locator('#i_exams').selectOption(exams);
      assert.equal(await page.locator('#integratedFields input[inputmode=decimal]').count(),0);
      await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').count(),0);
      assert.match(await page.locator('#integratedResult').innerText(),/Có thông tin nhưng chưa đủ để tính/);
    }
    await page.locator('#i_exams').selectOption('thpt');await scores(page);await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').innerText(),'73.20/100');
    assert.match(await page.locator('#integratedThresholds').innerText(),/Đạt ngưỡng số học/);
    for(const method of ['thpt','transcript','other','integrated']) {
      await page.locator(`[name=admissionMethod][value=${method}]`).check();
      assert.equal(await page.locator('#integratedCard').isVisible(),method==='integrated');
    }
    await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').innerText(),'73.20/100');
  });
  await check('hcmus-official-percentiles-and-separate-transcript-combination',async page=>{
    await page.locator('#integratedSchool').selectOption('hcmus');await page.locator('#integratedProgram').selectOption('7420101');
    for(const combo of ['B08','B00','X15','X16','B03','A02']) {
      await page.locator('#i_combo').selectOption(combo);await scores(page);await page.locator('#calcBtn').click();
      assert.equal(await page.locator('#integratedAcademic').innerText(),'80.00/100');assert.equal(await page.locator('#integratedTotal').innerText(),'80.00/100');
    }
    await page.locator('#i_exams').selectOption('both');await scores(page);await page.locator('#calcBtn').click();
    assert.match(await page.locator('#integratedResult').innerText(),/bách phân vị/);assert.equal(await page.locator('#integratedTotal').innerText(),'83.70/100');
    await page.locator('#i_hbCombo').selectOption('A02');assert.equal(await page.locator('#i_annual_phy_10').isVisible(),true);
    await scores(page);await page.locator('#i_vact').fill('1200');await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').count(),0);
  });
  await check('hcmut-weighted-math-and-exam-substitution',async page=>{
    await page.locator('#integratedSchool').selectOption('hcmut');await page.locator('#integratedProgram').selectOption('106');
    await page.locator('#i_exams').selectOption('both');await scores(page);await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').innerText(),'77.20/100');
    await page.locator('#i_vactMath').fill('301');await page.locator('#calcBtn').click();assert.match(await page.locator('#integratedResult').innerText(),/Kiểm tra dữ liệu/);
    await page.locator('#i_exams').selectOption('thpt');assert.equal(await page.locator('#i_vactMath').count(),0);await scores(page);await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').innerText(),'66.00/100');
    await page.locator('#i_exams').selectOption('vact');await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').count(),0);
    await page.locator('#i_exams').selectOption('both');await scores(page);await page.locator('#calcBtn').click();await page.locator('#integratedResult').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'hcmut-result-390.png')});
  });
  await check('uel-six-semester-inputs-and-provisional-branches',async page=>{
    await page.locator('#integratedSchool').selectOption('uel');await page.locator('#integratedProgram').selectOption('401');await page.locator('#i_exams').selectOption('both');
    assert.equal(await page.locator('[data-field^=semester_]').count(),18);assert.equal(await page.locator('[data-field^=annual_]').count(),0);
    await scores(page);await page.locator('#i_vact').fill('1100');await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').innerText(),'86.42/100');
    await page.locator('#i_semester_math_10_1').fill('');await page.locator('#calcBtn').click();assert.match(await page.locator('#integratedResult').innerText(),/Kiểm tra dữ liệu/);
    await scores(page);await page.locator('#i_exams').selectOption('thpt');await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedTotal').count(),0);assert.match(await page.locator('#integratedResult').innerText(),/dự kiến/);
  });
  await check('agu-law-teaching-and-aptitude-gates',async page=>{
    await page.locator('#integratedSchool').selectOption('agu');await page.locator('#integratedProgram').selectOption('7480201');await scores(page);await page.locator('#calcBtn').click();assert.equal(await page.locator('#integratedAcademic').innerText(),'80.00/100');assert.equal(await page.locator('#integratedTotal').count(),0);
    for(const program of ['7380101','7140209']) {await page.locator('#integratedProgram').selectOption(program);await page.locator('#i_exams').selectOption('vact');await page.locator('#calcBtn').click();assert.match(await page.locator('#integratedResult').innerText(),/bắt buộc.*THPT/);}
    await page.locator('#integratedProgram').selectOption('7140201');assert.equal(await page.locator('#integratedFields input').count(),0);assert.match(await page.locator('#integratedFields').innerText(),/năng khiếu/);
  });
  await check('drafts-are-isolated-per-school-and-semester-basis',async page=>{
    await page.locator('#integratedSchool').selectOption('uel');await page.locator('#integratedProgram').selectOption('401');await scores(page);await page.locator('#i_semester_math_10_1').fill('7.25');
    await page.locator('#integratedSchool').selectOption('hcmut');await page.locator('#integratedProgram').selectOption('106');await scores(page);await page.locator('#i_annual_math_10').fill('9.5');
    await page.locator('#integratedSchool').selectOption('uel');assert.equal(await page.locator('#i_semester_math_10_1').inputValue(),'7.25');await page.reload({waitUntil:'domcontentloaded'});await page.locator('#i_semester_math_10_1').waitFor();assert.equal(await page.locator('#i_semester_math_10_1').inputValue(),'7.25');
  });
  await check('draft-reload-method-switch-reset-and-deep-link',async(page,context)=>{
    await iu(page);await scores(page);await page.locator('#i_thpt_math').fill('8.25');
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#i_thpt_math').waitFor();
    assert.equal(await page.locator('[name=admissionMethod][value=integrated]').isChecked(),true);
    assert.equal(await page.locator('#i_thpt_math').inputValue(),'8.25');
    await page.locator('[name=admissionMethod][value=other]').check();
    assert.equal(await page.locator('#integratedCard').isVisible(),false);
    await page.locator('#sVact').fill('900');await page.locator('#calcBtn').click();assert.equal(await page.locator('#sumVact').innerText(),'900');
    await page.locator('[name=admissionMethod][value=integrated]').check();assert.equal(await page.locator('#i_thpt_math').inputValue(),'8.25');
    await page.locator('#resetBtn').click();await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('[name=admissionMethod][value=thpt]').isChecked(),true);
    assert.equal(await page.evaluate(()=>window.BWFlow.read().integratedScores),null);
    const fresh=await context.newPage();await fresh.goto(base+'/score-calculator.html?method=integrated&integratedSchool=hcmiu&integratedProgram=7480101');
    await fresh.locator('#i_thpt_math').waitFor();assert.equal(await fresh.locator('#integratedProgram').inputValue(),'7480101');await fresh.close();
  });
  await check('school-target-transfers-to-integrated',async page=>{
    await page.locator('[name=admissionMethod][value=thpt]').check();await page.locator('[name=targetMode][value=guided]').check();
    await page.locator('#targetSchool').selectOption('hcmus');await page.locator('#targetProgram').selectOption('0');
    await page.locator('[name=admissionMethod][value=integrated]').check();
    assert.equal(await page.locator('#integratedSchool').inputValue(),'hcmus');assert.equal(await page.locator('#integratedProgram').inputValue(),'7420101');
  });
  await check('integrated-config-survives-catalog-failure',async page=>{
    await page.route('**/assets/data/schools.json',route=>route.fulfill({status:503,body:'Unavailable'}));
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('#retryTarget').waitFor({state:'attached'});
    await iu(page);await scores(page);await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#integratedTotal').innerText(),'73.20/100');
    assert.equal(await page.locator('#integratedSchool option').count(),9);
    return {source:'Bundled verified configuration; failed catalog is not replaced with mock data'};
  });
  for(const width of [360,390,768,1366]) await check('responsive-'+width,async page=>{
    await iu(page);await scores(page);await page.locator('#calcBtn').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true);
    await page.locator('#integratedResult').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'result-'+width+'.png'),fullPage:false});
    await page.locator('#integratedCard').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'inputs-'+width+'.png'),fullPage:true});
    for(const id of ['hcmut','uhs','hcmus','ussh','uit','uel','agu']) {
      await page.locator('#integratedSchool').selectOption(id);const value=await page.locator('#integratedProgram option').nth(1).getAttribute('value');await page.locator('#integratedProgram').selectOption(value);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,id+' overflows at '+width);
      if(id==='uhs') {await page.locator('#integratedCard').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'uhs-form-'+width+'.png')});}
    }
    return {width};
  },width);
}
(async()=>{
  try {await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({channel:'msedge',headless:true});await run();}
  catch(e) {report.push({name:'runner',status:'FAIL',error:e.stack});}
  finally {await browser?.close();await new Promise(r=>server.close(r));const result={status:report.every(r=>r.status==='PASS')?'PASS':'FAIL',pass:report.filter(r=>r.status==='PASS').length,fail:report.filter(r=>r.status==='FAIL').length,report,artifacts};fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(result.fail)process.exitCode=1;}
})();
