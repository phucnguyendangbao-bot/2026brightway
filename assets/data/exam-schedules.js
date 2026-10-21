export const EXAM_CATALOG = [
  { id:'thpt', name:'Tốt nghiệp THPT', sourceURL:'https://vqa.moet.gov.vn/vi/news/tin-tuc-su-kien/bo-gddt-huong-dan-thuc-hien-nhiem-vu-quan-ly-chat-luong-nam-hoc-2026-2027-294.html' },
  { id:'v-act', name:'Đánh giá năng lực ĐHQG TP.HCM (V-ACT)', sourceURL:'https://cetqa.vnuhcm.edu.vn/' },
  { id:'hsa', name:'Đánh giá năng lực ĐHQG Hà Nội (HSA)', sourceURL:'https://www.hsa.edu.vn/' },
  { id:'tsa', name:'Đánh giá tư duy Bách khoa Hà Nội (TSA)', sourceURL:'https://tsa.hust.edu.vn/' },
  { id:'ielts', name:'IELTS', sourceURL:'https://www.britishcouncil.vn/thi/ielts/le-phi-dia-diem' },
  { id:'toeic', name:'TOEIC', sourceURL:'https://iigvietnam.com/' },
  { id:'sat', name:'SAT', sourceURL:'https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print' },
  { id:'goethe-osd', name:'Goethe/ÖSD', sourceURL:'https://www.goethe.de/ins/vn/vi/spr/prf.html' },
  { id:'other', name:'Kỳ thi khác', sourceURL:'' },
];

// Only schedules whose date was visible on an organiser's official page at the
// verification date are listed. Absence here means "unannounced", not a guess.
export const OFFICIAL_EXAM_SCHEDULES = [
  { examId:'sat', examName:'SAT', year:2026, sessionId:'sat-2026-11-07', sessionName:'SAT Weekend · 07/11/2026', date:'2026-11-07', timezone:'Asia/Ho_Chi_Minh', sourceURL:'https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print', sourceDate:'2026-10-21', status:'official' },
  { examId:'sat', examName:'SAT', year:2026, sessionId:'sat-2026-12-05', sessionName:'SAT Weekend · 05/12/2026', date:'2026-12-05', timezone:'Asia/Ho_Chi_Minh', sourceURL:'https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print', sourceDate:'2026-10-21', status:'official' },
  { examId:'sat', examName:'SAT', year:2027, sessionId:'sat-2027-03-06', sessionName:'SAT Weekend · 06/03/2027', date:'2027-03-06', timezone:'Asia/Ho_Chi_Minh', sourceURL:'https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print', sourceDate:'2026-10-21', status:'official' },
  { examId:'sat', examName:'SAT', year:2027, sessionId:'sat-2027-05-01', sessionName:'SAT Weekend · 01/05/2027', date:'2027-05-01', timezone:'Asia/Ho_Chi_Minh', sourceURL:'https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print', sourceDate:'2026-10-21', status:'official' },
  { examId:'sat', examName:'SAT', year:2027, sessionId:'sat-2027-06-05', sessionName:'SAT Weekend · 05/06/2027', date:'2027-06-05', timezone:'Asia/Ho_Chi_Minh', sourceURL:'https://satsuite.collegeboard.org/sat/dates-deadlines?decorator=print', sourceDate:'2026-10-21', status:'official' },
];

// These records mean only that no dated 2027 session was present in BrightWay's
// verified source set on sourceDate. They intentionally carry no guessed date.
export const UNANNOUNCED_EXAM_SCHEDULES = EXAM_CATALOG.filter(row => !['sat','other'].includes(row.id)).map(row => ({
  examId:row.id,
  examName:row.name,
  year:2027,
  sessionId:`${row.id}-2027-unannounced`,
  sessionName:'Chưa có lịch chính thức trong dữ liệu đã đối chiếu',
  date:'',
  timezone:'Asia/Ho_Chi_Minh',
  sourceURL:row.sourceURL,
  sourceDate:'2026-10-21',
  status:'unannounced',
}));

export const EXAM_SCHEDULES = [...OFFICIAL_EXAM_SCHEDULES, ...UNANNOUNCED_EXAM_SCHEDULES];

export function schedulesFor(examId) {
  return OFFICIAL_EXAM_SCHEDULES.filter(row => row.examId === examId);
}

export function scheduleRecordsFor(examId) {
  return EXAM_SCHEDULES.filter(row => row.examId === examId);
}
