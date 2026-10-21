import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonCells } from '../assets/js/school-comparison-model.js';
import { wishCsv, wishFromProgram, textKey } from '../assets/js/selection-model.js';
import { detailsForSchool } from '../assets/data/school-profile-details.js';
import { universityOpportunities } from '../assets/data/university-promotions.js';
import sourceRegistry from '../assets/data/school-admissions-sources.js';

const school={id:'fpt',name:'Đại học FPT',city:'Nhiều cơ sở',website:'https://daihoc.fpt.edu.vn',identity:{entity_kind:'university'}};
const details=detailsForSchool('fpt');
const source=sourceRegistry.universities.find(row=>row.school_id==='fpt');

test('saved school search handles uppercase Đ and unaccented Vietnamese consistently',()=>{
  assert.equal(textKey('ĐẠI HỌC CẦN THƠ'),textKey('dai hoc can tho'));
});

test('comparison keeps sourced annual programs, method and scale without ranking or guessing tuition',()=>{
  const cells=comparisonCells(school,details,source,{opportunities:universityOpportunities,now:Date.parse('2026-10-21')});
  assert.equal(cells.programs.programs.length,details.programs.length);
  assert.equal(cells.programs.source,details.programSource);
  assert.match(cells.scores.text,/18 – 21.*2026.*thang 30/);
  assert.equal(cells.scores.source,details.scoreSource);
  assert.equal(cells.admission.text,source.source_summary);
  assert.equal(cells.tuition.source,undefined);
  assert.match(cells.scholarship.links[0].label,/Tư liệu tham khảo, chưa xác nhận còn nhận hồ sơ/);
  assert.deepEqual(comparisonCells(school,details,source,{year:2027}).programs,{text:'Chưa có dữ liệu đã xác minh cho năm này.'});
});
test('comparison withholds secondary programs, unsourced prices, incompatible score scales and expired or paid scholarships',()=>{
  const unsafe={...details,programSourceStatus:'secondary',scoreScale:null,tuition:{year:2026,summary:'Không đủ nguồn',source:'javascript:alert(1)'}};
  const record=universityOpportunities[0];
  const cells=comparisonCells(school,unsafe,source,{now:Date.parse('2026-10-21'),opportunities:[{...record,funding:'sponsored'},{...record,reviewExpiresAt:'2026-10-01'}]});
  assert.equal(cells.programs.programs,undefined);
  assert.equal(cells.tuition.source,undefined);
  assert.doesNotMatch(cells.scores.text,/18 – 21/);
  assert.equal(cells.scholarship.links,undefined);
});
test('CSV preserves priorities, source years, program codes, campuses and spreadsheet-safe quoted values',()=>{
  const item=wishFromProgram(school,details,0,2027);
  const csv=wishCsv([{...item,schoolName:'=HYPERLINK("bad")',campus:'Cần Thơ, Việt Nam',track:'Tiếng "Anh"'}]);
  assert.equal(csv.charCodeAt(0),0xfeff);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"Cần Thơ, Việt Nam"'));
  assert.ok(csv.includes('"Tiếng ""Anh"""'));
  assert.ok(csv.includes('"7480201"'));
  assert.ok(csv.includes('"2027","2026"'));
  assert.ok(csv.includes(item.source));
  assert.match(csv,/chưa đăng ký nguyện vọng chính thức/);
  assert.equal(csv.split('\r\n').length,3);
});
