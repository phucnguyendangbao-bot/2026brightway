// page2.js — extracted từ page2.html (Phase 2 — kiến trúc)
// Loaded với <script type="module"> nên file chạy đúng 1 lần.
// Các hàm dùng bởi inline onclick/oninput tạm thời vẫn được gán lên window
// để không vỡ UI; sẽ migrate sang addEventListener ở commit riêng.

/* ═══════════════════════════════════════
   SCHOLARSHIP DATA
   Load từ assets/data/schools.json (Phase 4 — cập nhật từ docx + logo thật)
   ════════════════════════════════════════ */
let SCHOOLS = [];
let SCHOOLS_LOAD_ERROR = null;

async function loadSchoolsData() {
  try {
    const res = await fetch('assets/data/schools.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    SCHOOLS = Array.isArray(data) ? data : [];
    return SCHOOLS;
  } catch (err) {
    console.error('[loadSchoolsData] failed:', err);
    SCHOOLS_LOAD_ERROR = err.message;
    SCHOOLS = [];
    return [];
  }
}
const __PENDING_SCHOOLS__ = [
  {
    id: "hcmut-oisp",
    name: "Đại học Bách khoa – ĐHQG TP.HCM (OISP)",
    short: "HCMUT OISP",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/hcmut.edu.vn",
    logoFallback: "🏛️",
    website: "https://oisp.hcmut.edu.vn/scholarships",
    scholarships: [
      {
        title: "Học bổng khuyến khích học tập theo kỳ",
        target: "Sinh viên đang học tại trường",
        requirements: "Đạt kết quả học tập tốt trong kỳ/năm học, không vi phạm kỷ luật",
        timeline: "Xét theo kỳ học",
        note: "Tỷ lệ và mức học bổng thay đổi theo năm"
      },
      {
        title: "Học bổng IELTS / Ngoại ngữ",
        target: "Sinh viên chưng trình OISP, tiên tiến",
        requirements: "Đạt điểm IELTS hoặc chứng chỉ ngoại ngữ quốc tế theo mức quy định",
        timeline: "Theo thông báo từng đợt",
        note: "Mức thưởng phụ thuộc vào band score đạt được"
      },
      {
        title: "Học bổng thủ khoa đầu vào",
        target: "Thí sinh trúng tuyển điểm cao nhất ngành",
        requirements: "Thủ khoa hoặc top điểm cao nhất theo phương thức xét tuyển",
        timeline: "Xét khi nhập học",
        note: "Nên kiểm tra mục học bổng/tài chính của từng chương trình (chuẩn, tiên tiến, OISP)"
      }
    ]
  },
  {
    id: "uit",
    name: "Đại học Công nghệ Thông tin – ĐHQG TP.HCM",
    short: "UIT",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/uit.edu.vn",
    logoFallback: "💻",
    website: "https://www.uit.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng tuyển sinh đầu vào", target: "Thí sinh trúng tuyển với điểm số xuất sắc", requirements: "Đạt mốc điểm theo quy định của trường (THPT, ĐGNL, hoặc xét học bạ)", timeline: "Xét khi nhập học năm nhất", note: "" },
      { title: "Học bổng thủ khoa", target: "Thủ khoa từng phương thức xét tuyển", requirements: "Điểm cao nhất trong số thí sinh trúng tuyển", timeline: "Năm nhất", note: "" },
      { title: "UIT Advance Scholarship", target: "Sinh viên chương trình tiên tiến", requirements: "Theo tiêu chí riêng của chương trình Advance, thường yêu cầu tiếng Anh tốt", timeline: "Theo thông báo", note: "" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA kỳ trước đạt loại giỏi trở lên", timeline: "Xét theo kỳ", note: "" },
      { title: "UIT Global – Học bổng quốc tế", target: "Sinh viên tham gia chương trình trao đổi, hợp tác quốc tế", requirements: "IELTS hoặc chứng chỉ tiếng Anh tương đương, GPA tốt", timeline: "Theo đợt mở đăng ký", note: "Một số học bổng xét theo thành tích sau khi nhập học" }
    ]
  },
  {
    id: "fpt",
    name: "Đại học FPT",
    short: "FPTU",
    city: "TP.HCM / Hà Nội / Đà Nẵng / Cần Thơ",
    logoUrl: "https://logo.clearbit.com/daihoc.fpt.edu.vn",
    logoFallback: "🎯",
    website: "https://fpt.edu.vn/scholarship",
    scholarships: [
      { title: "Học bổng tài năng (50–100% học phí)", target: "Thí sinh có thành tích xuất sắc, giải quốc gia/quốc tế", requirements: "Giải HSG cấp quốc gia/quốc tế, hoặc đạt điểm thi đầu vào FPT rất cao", timeline: "Xét khi nộp hồ sơ nhập học", note: "" },
      { title: "Học bổng ưu tiên lĩnh vực", target: "Thí sinh đăng ký ngành ưu tiên của FPT trong năm", requirements: "Theo chính sách từng năm, có thể yêu cầu điểm IELTS hoặc portfolio", timeline: "Theo đợt tuyển sinh", note: "" },
      { title: "Học bổng 30–50% từ kỳ thi học bổng riêng", target: "Thí sinh thi học bổng do FPT tổ chức", requirements: "Đăng ký và dự thi kỳ thi học bổng FPT, đạt kết quả theo mốc", timeline: "Nhiều đợt trong năm", note: "Điều kiện học bổng thay đổi theo đợt tuyển sinh" }
    ]
  },
  {
    id: "ueh",
    name: "Đại học Kinh tế TP.HCM",
    short: "UEH",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/ueh.edu.vn",
    logoFallback: "📊",
    website: "https://www.ueh.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng tân sinh viên theo thành tích đầu vào", target: "Thí sinh trúng tuyển điểm cao", requirements: "Điểm THPT hoặc ĐGNL đạt mốc theo quy định từng năm", timeline: "Xét khi nhập học", note: "" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA kỳ trước đạt loại giỏi, xuất sắc", timeline: "Xét theo kỳ/năm", note: "" },
      { title: "Học bổng doanh nghiệp", target: "Sinh viên có hoàn cảnh hoặc thành tích nổi bật", requirements: "Theo tiêu chí từng nhà tài trợ", timeline: "Theo thông báo", note: "Điểm và học bổng thay đổi theo đề án từng năm" }
    ]
  },
  {
    id: "ftu",
    name: "Đại học Ngoại thương – Cơ sở II TP.HCM",
    short: "FTU2",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/ftu.edu.vn",
    logoFallback: "🌍",
    website: "https://ftu.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng đầu vào / thành tích cao", target: "Thủ khoa hoặc thí sinh điểm rất cao", requirements: "Điểm THPT ≥ 25 (tham khảo) hoặc ĐGNL ≥ 900", timeline: "Xét khi nhập học", note: "" },
      { title: "Học bổng chương trình quốc tế (GENIE, v.v.)", target: "Sinh viên chương trình quốc tế", requirements: "IELTS ≥ 6.5, GPA tốt, bài luận + phỏng vấn (tùy chương trình)", timeline: "Theo đề án từng năm", note: "" },
      { title: "Học bổng nghiên cứu, ngoại khóa", target: "Sinh viên có hoạt động nghiên cứu / lãnh đạo nổi bật", requirements: "Hồ sơ hoạt động, giấy xác nhận", timeline: "Theo thông báo", note: "Nên xem kỹ đề án tuyển sinh và học bổng chương trình cụ thể" }
    ]
  },
  {
    id: "vlu",
    name: "Đại học Văn Lang",
    short: "VLU",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/vlu.edu.vn",
    logoFallback: "🎨",
    website: "https://www.vanlanguni.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng tuyển sinh theo điểm đầu vào", target: "Thí sinh trúng tuyển với mốc điểm cao", requirements: "Theo bảng mốc điểm của trường (THPT, học bạ, ĐGNL)", timeline: "Xét khi nhập học", note: "Nhiều mức học bổng theo từng mốc điểm" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA tốt, không vi phạm kỷ luật", timeline: "Xét theo kỳ", note: "" },
      { title: "Học bổng tài năng / hoạt động", target: "Sinh viên có thành tích nghệ thuật, thể thao, hoạt động xã hội", requirements: "Hồ sơ minh chứng, portfolio (nếu ngành thiết kế/truyền thông)", timeline: "Theo thông báo", note: "" }
    ]
  },
  {
    id: "pnt",
    name: "Đại học Y khoa Phạm Ngọc Thạch",
    short: "PNTU",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/pnt.edu.vn",
    logoFallback: "🩺",
    website: "https://pnt.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "Kết quả học tập xuất sắc trong kỳ/năm", timeline: "Xét theo kỳ/năm", note: "" },
      { title: "Học bổng tân sinh viên", target: "Tân sinh viên điểm đầu vào cao (tùy năm)", requirements: "Điểm THPT B00 ≥ 24.5 (tham khảo), hạnh kiểm tốt", timeline: "Năm nhất", note: "" },
      { title: "Quỹ hỗ trợ sinh viên", target: "Sinh viên khó khăn, có thành tích tốt", requirements: "Hồ sơ hoàn cảnh + kết quả học tập", timeline: "Theo thông báo đầu năm học", note: "Theo dõi thông báo học bổng đầu năm học" }
    ]
  },
  {
    id: "ctump",
    name: "Đại học Y Dược Cần Thơ",
    short: "CTUMP",
    city: "Cần Thơ",
    logoUrl: "https://logo.clearbit.com/ctump.edu.vn",
    logoFallback: "💊",
    website: "https://ctump.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng theo thành tích học tập", target: "Sinh viên có GPA xuất sắc", requirements: "GPA kỳ trước đạt loại giỏi, xuất sắc", timeline: "Xét theo kỳ", note: "" },
      { title: "Hỗ trợ theo hoàn cảnh, quỹ sinh viên", target: "Sinh viên khó khăn", requirements: "Hồ sơ hoàn cảnh + hạnh kiểm tốt", timeline: "Theo từng đợt", note: "" },
      { title: "Học bổng khuyến khích học kỳ", target: "Sinh viên đang theo học", requirements: "Thành tích tốt, không vi phạm kỷ luật", timeline: "Xét theo kỳ", note: "Một số học bổng công bố theo từng đợt" }
    ]
  },
  {
    id: "ump",
    name: "Đại học Y Dược TP.HCM",
    short: "UMP",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/ump.edu.vn",
    logoFallback: "⚕️",
    website: "https://ump.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng khuyến khích học tập theo học kỳ/năm", target: "Sinh viên đang theo học", requirements: "Kết quả học tập xuất sắc, hạnh kiểm tốt", timeline: "Xét theo kỳ/năm", note: "" },
      { title: "Học bổng cho sinh viên thành tích cao", target: "Sinh viên có thành tích đặc biệt trong nghiên cứu, học thuật", requirements: "Bài nghiên cứu, giải thưởng, thành tích nổi bật", timeline: "Theo thông báo", note: "" },
      { title: "Học bổng hỗ trợ từ quỹ/trợ cấp", target: "Sinh viên có hoàn cảnh khó khăn", requirements: "Hồ sơ hoàn cảnh + kết quả học tập đạt yêu cầu", timeline: "Theo từng đợt", note: "Ngành Y thường có mức cạnh tranh rất cao" }
    ]
  },
  {
    id: "ussh",
    name: "Đại học KHXH & NV – ĐHQG TP.HCM",
    short: "USSH",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/hcmussh.edu.vn",
    logoFallback: "📣",
    scholarships: [
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA đạt loại giỏi, xuất sắc", timeline: "Xét theo kỳ", note: "" },
      { title: "Học bổng tài trợ doanh nghiệp / cựu sinh viên", target: "Sinh viên có hoàn cảnh hoặc thành tích nổi bật", requirements: "Theo tiêu chí từng nhà tài trợ", timeline: "Theo thông báo", note: "" },
      { title: "Học bổng theo thành tích đầu vào (tùy khoa/chương trình)", target: "Tân sinh viên điểm cao", requirements: "Điểm THPT hoặc ĐGNL vượt mốc, có hoạt động/portfolio truyền thông (lợi thế)", timeline: "Năm nhất", note: "Ngành truyền thông có thể ưu tiên hồ sơ hoạt động nổi bật" }
    ]
  },
  {
    id: "rmit",
    name: "RMIT University Vietnam",
    short: "RMIT",
    city: "TP.HCM / Hà Nội",
    logoUrl: "https://logo.clearbit.com/rmit.edu.vn",
    logoFallback: "🌐",
    website: "https://www.rmit.edu.vn/study-at-rmit/scholarships",
    scholarships: [
      { title: "Opportunity Scholarship", target: "Thí sinh có hoàn cảnh khó khăn và thành tích tốt", requirements: "Hồ sơ hoàn cảnh, GPA ≥ 8.5, IELTS ≥ 6.5, bài luận + phỏng vấn", timeline: "Có deadline cụ thể (thường đầu năm)", note: "" },
      { title: "Academic Merit / Achievement Scholarships", target: "Thí sinh có thành tích học thuật xuất sắc", requirements: "GPA tốt, chứng chỉ tiếng Anh, hoạt động ngoại khóa nổi bật", timeline: "Theo đợt tuyển sinh", note: "" },
      { title: "Scholarships có hồ sơ riêng và deadline cụ thể", target: "Tùy loại học bổng", requirements: "Tùy loại – thường bao gồm bài luận cá nhân, phỏng vấn", timeline: "Xem website RMIT", note: "Nên chuẩn bị hồ sơ sớm vì có deadline. Học phí cao, học bổng cạnh tranh" }
    ]
  },
  {
    id: "hub",
    name: "Đại học Ngân hàng TP.HCM",
    short: "HUB",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/hub.edu.vn",
    logoFallback: "🏦",
    website: "https://scc.hub.edu.vn/ho-tro-nguoi-hoc/hoc-bong",
    scholarships: [
      { title: "Học bổng tuyển sinh đầu vào", target: "Tân sinh viên điểm cao", requirements: "Điểm THPT, ĐGNL hoặc học bạ đạt mốc theo quy định", timeline: "Năm nhất", note: "" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA đạt loại giỏi, xuất sắc", timeline: "Xét theo kỳ", note: "" },
      { title: "Học bổng tài trợ từ ngân hàng/doanh nghiệp", target: "Sinh viên có hoàn cảnh, thành tích nổi bật", requirements: "Theo tiêu chí từng nhà tài trợ", timeline: "Theo thông báo", note: "Có thể có nhiều đợt xét học bổng tân sinh viên" }
    ]
  },
  {
    id: "hcmue",
    name: "Đại học Sư phạm TP.HCM",
    short: "HCMUE",
    city: "TP.HCM",
    logoUrl: "https://logo.clearbit.com/hcmue.edu.vn",
    logoFallback: "📘",
    website: "https://hcmue.edu.vn/vi/hoc-bong",
    scholarships: [
      { title: "Miễn/giảm học phí theo chính sách ngành sư phạm", target: "Sinh viên ngành sư phạm", requirements: "Đăng ký ngành sư phạm, cam kết theo chính sách nhà nước", timeline: "Suốt thời gian học", note: "Cần đọc kỹ chính sách hỗ trợ và nghĩa vụ sau tốt nghiệp" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "Kết quả học tập tốt, hạnh kiểm tốt", timeline: "Xét theo kỳ", note: "" },
      { title: "Học bổng hỗ trợ sinh viên sư phạm", target: "Sinh viên có hoàn cảnh đặc biệt", requirements: "Hồ sơ hoàn cảnh + kết quả học tập", timeline: "Theo thông báo", note: "" }
    ]
  },
  {
    id: "ctu",
    name: "Đại học Cần Thơ",
    short: "CTU",
    city: "Cần Thơ",
    logoUrl: "https://logo.clearbit.com/ctu.edu.vn",
    logoFallback: "🌾",
    website: "https://www.ctu.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng tân sinh viên / thành tích đầu vào", target: "Tân sinh viên điểm cao", requirements: "Điểm THPT hoặc học bạ vượt mốc quy định", timeline: "Năm nhất", note: "" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA tốt, không vi phạm kỷ luật", timeline: "Xét theo kỳ", note: "" },
      { title: "Chính sách hỗ trợ cho một số ngành sư phạm", target: "Sinh viên ngành sư phạm", requirements: "Theo chính sách nhà nước về đào tạo sư phạm", timeline: "Suốt thời gian học", note: "Rất phù hợp cho học sinh miền Tây" }
    ]
  },
  {
    id: "dthu",
    name: "Đại học Đồng Tháp",
    short: "DThU",
    city: "Đồng Tháp",
    logoUrl: "https://logo.clearbit.com/dthu.edu.vn",
    logoFallback: "🌱",
    scholarships: [
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA tốt, hạnh kiểm tốt", timeline: "Xét theo kỳ", note: "" },
      { title: "Hỗ trợ sinh viên sư phạm theo chính sách", target: "Sinh viên ngành sư phạm", requirements: "Theo chính sách nhà nước về đào tạo sư phạm", timeline: "Suốt thời gian học", note: "" },
      { title: "Quỹ hỗ trợ sinh viên", target: "Sinh viên có hoàn cảnh khó khăn", requirements: "Hồ sơ hoàn cảnh + kết quả học tập", timeline: "Theo thông báo", note: "Có thể bổ sung mục cơ hội việc làm địa phương" }
    ]
  }
,
  {id:"hcmus",name:"Đại học Khoa học Tự nhiên – ĐHQG TP.HCM",short:"HCMUS",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/hcmus.edu.vn",
    logoFallback: "🌿",website:"https://hcmus.edu.vn/hoc-bong",scholarships:[{title:"Học bổng khuyến khích học tập",target:"Sinh viên có thành tích học tập tốt",requirements:"GPA & rèn luyện đạt chuẩn theo quy định từng học kỳ/năm",timeline:"Xét theo học kỳ/năm",note:"Theo dõi thông báo từ phòng CTSV / website trường"},{title:"Học bổng nghiên cứu / dự án bền vững",target:"Sinh viên tham gia NCKH/CLB/hoạt động môi trường",requirements:"Có đề tài/dự án, thành tích/giải thưởng là lợi thế",timeline:"Theo đợt / dự án",note:"Thường có từ doanh nghiệp/đối tác"}]},
  {id:"tdtu",name:"Đại học Tôn Đức Thắng",short:"TDTU",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/tdtu.edu.vn",
    logoFallback: "🌿",website:"https://tdtu.edu.vn/hoc-bong",scholarships:[{title:"Học bổng TDTU (đầu vào)",target:"Tân sinh viên",requirements:"Đạt mốc điểm theo thông báo từng năm/đợt",timeline:"Mùa tuyển sinh",note:"Có nhiều mức 30%–100% tùy điều kiện"},{title:"Học bổng khuyến khích học tập",target:"Sinh viên đang học",requirements:"Kết quả học tập tốt, không vi phạm kỷ luật",timeline:"Theo học kỳ",note:"Xét tự động hoặc theo hồ sơ"}]},
  {id:"nttu",name:"Đại học Nguyễn Tất Thành",short:"NTTU",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/ntt.edu.vn",
    logoFallback: "🌿",website:"https://ntt.edu.vn/hoc-bong",scholarships:[{title:"Học bổng tài năng / khuyến học",target:"Tân sinh viên & sinh viên",requirements:"Điểm đầu vào/GPA đạt chuẩn từng mức học bổng",timeline:"Theo đợt",note:"Kiểm tra website học bổng từng năm"},{title:"Học bổng vượt khó",target:"Sinh viên có hoàn cảnh khó khăn",requirements:"Hồ sơ minh chứng + kết quả học tập/rèn luyện phù hợp",timeline:"Theo đợt",note:"Số lượng & mức hỗ trợ tùy quỹ"}]},
  {id:"hcmut-ai",name:"Đại học Bách khoa – ĐHQG TP.HCM",short:"HCMUT",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/hcmut.edu.vn",
    logoFallback: "🤖",website:"https://oisp.hcmut.edu.vn/scholarships",scholarships:[{title:"Học bổng khuyến khích học tập",target:"Sinh viên đang học",requirements:"GPA & rèn luyện theo quy định học kỳ",timeline:"Xét theo học kỳ",note:"Có thể đạt mức cao tùy kết quả"},{title:"Học bổng doanh nghiệp AI/Robotics",target:"Sinh viên có dự án/portfolio",requirements:"Tham gia CLB, dự án, NCKH; phỏng vấn (tùy đợt)",timeline:"Theo đợt",note:"Theo dõi thông báo Khoa/CTSV"}]},
  {id:"uit-ai",name:"Đại học Công nghệ Thông tin – ĐHQG TP.HCM (AI/Data)",short:"UIT AI",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/uit.edu.vn",
    logoFallback: "🤖",website:"https://www.uit.edu.vn/hoc-bong",scholarships:[{title:"Học bổng khuyến khích học tập",target:"Sinh viên đang học",requirements:"GPA tốt + rèn luyện đạt chuẩn",timeline:"Theo học kỳ/năm",note:"Thường xét theo kết quả học tập"},{title:"Học bổng doanh nghiệp (AI/Data)",target:"Sinh viên có năng lực nổi bật",requirements:"Thành tích học tập/giải thưởng/portfolio là lợi thế",timeline:"Theo đợt",note:"Các đơn vị tài trợ thay đổi theo năm"}]},
  {id:"fpt-ai",name:"Đại học FPT",short:"FPTU",city:"TP.HCM/Cần Thơ/...",logoUrl: "https://logo.clearbit.com/daihoc.fpt.edu.vn",
    logoFallback: "🤖",website:"https://fpt.edu.vn/scholarship",scholarships:[{title:"Học bổng toàn phần / bán phần (toàn khóa)",target:"Tân sinh viên",requirements:"Xét học bạ/điểm thi + thành tích + phỏng vấn/thi (tùy đợt)",timeline:"Theo đợt tuyển sinh",note:"Điều kiện thay đổi theo năm"},{title:"Học bổng theo kỳ thi học bổng",target:"Học sinh THPT",requirements:"Tham gia kỳ thi học bổng của FPTU",timeline:"Theo lịch trường",note:"Cần theo dõi lịch thi/đăng ký"}]},
  {id:"hcmiu",name:"Đại học Quốc tế – ĐHQG TP.HCM",short:"HCMIU",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/hcmiu.edu.vn",
    logoFallback: "🧬",website:"https://hcmiu.edu.vn/scholarships",scholarships:[{title:"Học bổng chương trình quốc tế",target:"Tân sinh viên",requirements:"Điểm đầu vào/IELTS theo yêu cầu từng chương trình",timeline:"Mùa tuyển sinh",note:"Một số chương trình học hoàn toàn bằng tiếng Anh"},{title:"Học bổng học tập / nghiên cứu",target:"Sinh viên đang học",requirements:"GPA tốt, tham gia NCKH là lợi thế",timeline:"Theo học kỳ/đợt",note:"Theo dõi CTSV/khoa"}]},
  {id:"nlu",name:"Đại học Nông Lâm TP.HCM",short:"NLU",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/hcmuaf.edu.vn",
    logoFallback: "🧬",website:"https://hcmuaf.edu.vn/hoc-bong",scholarships:[{title:"Học bổng khuyến khích học tập",target:"Sinh viên đang học",requirements:"Kết quả học tập tốt theo tiêu chí từng học kỳ/năm",timeline:"Theo học kỳ/năm",note:"Xét theo quy định trường"},{title:"Học bổng dự án/đối tác (CN sinh học)",target:"Sinh viên ngành liên quan",requirements:"Tham gia dự án, NCKH, CLB chuyên môn",timeline:"Theo đợt",note:"Tùy đối tác tài trợ"}]},
  {id:"hufi",name:"Đại học Công nghiệp Thực phẩm TP.HCM",short:"HUFI",city:"TP.HCM",logoUrl: "https://logo.clearbit.com/huit.edu.vn",
    logoFallback: "🧬",website:"https://hufi.edu.vn/hoc-bong",scholarships:[{title:"Học bổng khuyến học / vượt khó",target:"Tân sinh viên & sinh viên",requirements:"Hồ sơ + kết quả học tập/rèn luyện phù hợp",timeline:"Theo đợt",note:"Mức hỗ trợ tùy quỹ"},{title:"Học bổng theo mốc điểm",target:"Tân sinh viên",requirements:"Đạt mốc điểm theo thông báo từng năm",timeline:"Mùa tuyển sinh",note:"Xem chi tiết trên website trường"}]},

  // ── MIỀN TRUNG (bổ sung từ docx) ──
  {
    id: "huemed",
    name: "Đại học Y Dược – Đại học Huế",
    short: "HuemedU",
    city: "Huế",
    logoUrl: "https://logo.clearbit.com/huemed-univ.edu.vn",
    logoFallback: "🏫",
    website: "https://huemed-univ.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "GPA kỳ trước đạt loại giỏi, xuất sắc; hạnh kiểm tốt", timeline: "Xét theo học kỳ", note: "Có thể đạt 100% học phí học kỳ – cạnh tranh cao" },
      { title: "Học bổng nghiên cứu y sinh & quốc tế", target: "Sinh viên có năng lực nghiên cứu", requirements: "Tham gia đề tài NCKH hoặc hợp tác quốc tế của trường", timeline: "Theo từng đợt / dự án", note: "Theo dõi thông báo từ phòng CTSV và các khoa" }
    ]
  },
  {
    id: "smp-udn",
    name: "Khoa Y Dược – Đại học Đà Nẵng",
    short: "SMP-UDN",
    city: "Đà Nẵng",
    logoUrl: "https://logo.clearbit.com/smp.udn.vn",
    logoFallback: "🏫",
    website: "https://smp.udn.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng ĐH Đà Nẵng", target: "Sinh viên đang theo học", requirements: "GPA đạt chuẩn theo quy định ĐH Đà Nẵng", timeline: "Xét theo học kỳ/năm", note: "" },
      { title: "Học bổng hỗ trợ sinh viên ngành y", target: "Sinh viên ngành y có hoàn cảnh hoặc thành tích nổi bật", requirements: "Theo tiêu chí từng đợt thông báo", timeline: "Theo thông báo", note: "Theo dõi website khoa để cập nhật đợt xét" }
    ]
  },
  {
    id: "duytan",
    name: "Đại học Duy Tân",
    short: "DTU",
    city: "Đà Nẵng",
    logoUrl: "https://logo.clearbit.com/duytan.edu.vn",
    logoFallback: "🎯",
    website: "https://duytan.edu.vn/tuyen-sinh/hoc-bong",
    scholarships: [
      { title: "Học bổng tuyển sinh (50–100% học phí)", target: "Tân sinh viên", requirements: "Đạt mốc điểm theo thông báo tuyển sinh từng năm (THPT, học bạ, ĐGNL)", timeline: "Mùa tuyển sinh", note: "Nhiều mức học bổng, khả năng đạt cao – phù hợp cho nhiều ngành" },
      { title: "Học bổng y khoa / CNTT / AI / Biotech", target: "Sinh viên ngành y, CNTT, AI, kỹ thuật sinh học", requirements: "Theo tiêu chí từng ngành; có suất toàn phần cho thành tích xuất sắc", timeline: "Theo đợt / kỳ học", note: "Trường tư thục với nhiều suất học bổng lớn – nên kiểm tra website trường thường xuyên" }
    ]
  },
  {
    id: "due",
    name: "Đại học Kinh tế – Đại học Đà Nẵng",
    short: "DUE",
    city: "Đà Nẵng",
    logoUrl: "https://logo.clearbit.com/due.udn.vn",
    logoFallback: "📊",
    website: "https://due.udn.vn/vi-vn/hoc-bong",
    scholarships: [
      { title: "Học bổng doanh nghiệp", target: "Sinh viên có thành tích nổi bật", requirements: "Theo tiêu chí từng nhà tài trợ doanh nghiệp", timeline: "Theo thông báo", note: "" },
      { title: "Học bổng khuyến học theo GPA", target: "Sinh viên đang theo học", requirements: "GPA kỳ trước đạt loại giỏi, xuất sắc", timeline: "Xét theo kỳ/năm", note: "Có mức cao theo GPA – theo dõi thông báo từng học kỳ" }
    ]
  },
  {
    id: "ntu",
    name: "Đại học Nha Trang",
    short: "NTU",
    city: "Nha Trang",
    logoUrl: "https://logo.clearbit.com/ntu.edu.vn",
    logoFallback: "🌊",
    website: "https://ntu.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng kinh tế biển & quản trị", target: "Sinh viên ngành kinh tế, quản trị, công nghệ sinh học biển", requirements: "GPA đạt chuẩn từng kỳ", timeline: "Xét theo kỳ", note: "Có thể đạt 100% học phí theo kỳ" },
      { title: "Học bổng công nghệ sinh học biển", target: "Sinh viên ngành công nghệ sinh học", requirements: "Kết quả học tập tốt, tham gia nghiên cứu là lợi thế", timeline: "Theo đợt / dự án", note: "Trường mạnh về biotech biển – nổi bật tại miền Trung" }
    ]
  },
  {
    id: "donga",
    name: "Đại học Đông Á",
    short: "DAU",
    city: "Đà Nẵng",
    logoUrl: "https://logo.clearbit.com/donga.edu.vn",
    logoFallback: "💰",
    website: "https://donga.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng nhập học", target: "Tân sinh viên", requirements: "Theo mốc điểm tuyển sinh từng năm (THPT, học bạ)", timeline: "Mùa tuyển sinh", note: "Có hỗ trợ học phí lớn cho tân sinh viên" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "Kết quả học tập tốt, hạnh kiểm tốt", timeline: "Xét theo kỳ", note: "Trường dễ đạt học bổng so với các trường công" }
    ]
  },
  {
    id: "dut",
    name: "Đại học Bách khoa – Đại học Đà Nẵng",
    short: "DUT",
    city: "Đà Nẵng",
    logoUrl: "https://logo.clearbit.com/dut.udn.vn",
    logoFallback: "⚙️",
    website: "https://dut.udn.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng kỹ thuật / CNTT / AI / Robotics", target: "Sinh viên ngành kỹ thuật, CNTT, AI", requirements: "GPA đạt loại giỏi, xuất sắc; có thể cần hồ sơ hoạt động", timeline: "Xét theo kỳ/năm", note: "Có thể đạt 100% học phí học kỳ – trường đầu ngành tại miền Trung" },
      { title: "Học bổng kỹ thuật môi trường", target: "Sinh viên ngành môi trường, bền vững", requirements: "GPA đạt chuẩn theo quy định", timeline: "Xét theo kỳ", note: "Mạnh về kỹ thuật môi trường và năng lượng tái tạo" },
      { title: "Học bổng theo thành tích đặc biệt", target: "Sinh viên đạt giải hoặc có dự án nổi bật", requirements: "Giải thi quốc gia/quốc tế, dự án nghiên cứu, NCKH", timeline: "Theo thông báo", note: "" }
    ]
  },
  {
    id: "qnu",
    name: "Đại học Quy Nhơn",
    short: "QNU",
    city: "Bình Định",
    logoUrl: "https://logo.clearbit.com/qnu.edu.vn",
    logoFallback: "💻",
    website: "https://qnu.edu.vn/vi/hoc-bong",
    scholarships: [
      { title: "Học bổng CNTT", target: "Sinh viên ngành Công nghệ thông tin", requirements: "GPA đạt chuẩn theo quy định từng kỳ", timeline: "Xét theo kỳ", note: "" },
      { title: "Học bổng nghiên cứu", target: "Sinh viên có đề tài nghiên cứu", requirements: "Tham gia NCKH, có công bố hoặc đề tài được duyệt", timeline: "Theo từng đợt / dự án", note: "Theo dõi thông báo từ phòng CTSV" }
    ]
  },
  {
    id: "husc",
    name: "Đại học Khoa học – Đại học Huế",
    short: "HUSC",
    city: "Huế",
    logoUrl: "https://logo.clearbit.com/husc.edu.vn",
    logoFallback: "🧬",
    website: "https://husc.hueuni.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng nghiên cứu sinh học & môi trường", target: "Sinh viên ngành sinh học, môi trường, biến đổi khí hậu", requirements: "GPA cao; tham gia nghiên cứu là lợi thế lớn", timeline: "Theo kỳ / đợt dự án", note: "Trường mạnh về biotech & môi trường tại miền Trung" },
      { title: "Học bổng theo GPA (khuyến khích học tập)", target: "Sinh viên đang theo học", requirements: "GPA đạt loại giỏi, xuất sắc; hạnh kiểm tốt", timeline: "Xét theo học kỳ", note: "Có suất cao theo GPA" }
    ]
  },
  {
    id: "huaf",
    name: "Đại học Nông Lâm – Đại học Huế",
    short: "HUAF",
    city: "Huế",
    logoUrl: "https://logo.clearbit.com/huaf.edu.vn",
    logoFallback: "🌱",
    website: "https://huaf.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng nông nghiệp bền vững", target: "Sinh viên ngành nông lâm, môi trường, phát triển bền vững", requirements: "GPA đạt chuẩn theo quy định", timeline: "Xét theo kỳ", note: "Hỗ trợ học phí tốt – phù hợp cho hướng nông nghiệp & bền vững" },
      { title: "Học bổng khuyến khích học tập", target: "Sinh viên đang theo học", requirements: "Kết quả học tập tốt, không vi phạm kỷ luật", timeline: "Xét theo học kỳ/năm", note: "" }
    ]
  },
  {
    id: "hucfl",
    name: "Đại học KHXH & NV – Đại học Huế",
    short: "HUCFL",
    city: "Huế",
    logoUrl: "https://logo.clearbit.com/hucfl.edu.vn",
    logoFallback: "📣",
    website: "https://husc.hueuni.edu.vn/",
    scholarships: [
      { title: "Học bổng ngành báo chí – truyền thông", target: "Sinh viên ngành truyền thông, báo chí", requirements: "GPA đạt chuẩn; có hoạt động truyền thông là lợi thế", timeline: "Xét theo kỳ", note: "Top miền Trung về ngành truyền thông & khoa học xã hội" },
      { title: "Học bổng ĐH Huế", target: "Sinh viên đang theo học tại ĐH Huế", requirements: "GPA loại giỏi, xuất sắc; hạnh kiểm tốt", timeline: "Xét theo học kỳ/năm", note: "" }
    ]
  },
  {
    id: "phuxuan",
    name: "Đại học Phú Xuân",
    short: "PXU",
    city: "Huế",
    logoUrl: "https://logo.clearbit.com/pxu.edu.vn",
    logoFallback: "📺",
    website: "https://phuxuan.edu.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng sáng tạo – truyền thông", target: "Sinh viên ngành truyền thông, thiết kế sáng tạo", requirements: "Portfolio, thành tích hoạt động sáng tạo", timeline: "Theo đợt tuyển sinh / xét hàng kỳ", note: "Hỗ trợ học phí cao – dễ đạt hơn so với trường công" },
      { title: "Học bổng nhập học", target: "Tân sinh viên", requirements: "Đạt mốc điểm theo thông báo tuyển sinh từng năm", timeline: "Mùa tuyển sinh", note: "" }
    ]
  },
  {
    id: "vku",
    name: "Đại học Công nghệ TT&TT Việt – Hàn",
    short: "VKU",
    city: "Đà Nẵng",
    logoUrl: "https://logo.clearbit.com/vku.udn.vn",
    logoFallback: "🤖",
    website: "https://vku.udn.vn/hoc-bong",
    scholarships: [
      { title: "Học bổng CNTT & AI", target: "Sinh viên ngành CNTT, AI, truyền thông số", requirements: "GPA đạt chuẩn; tham gia CLB kỹ thuật là lợi thế", timeline: "Xét theo kỳ/năm", note: "Hợp tác chặt với doanh nghiệp Hàn Quốc – cơ hội học bổng từ đối tác" },
      { title: "Học bổng hợp tác doanh nghiệp", target: "Sinh viên có thành tích nổi bật", requirements: "Theo tiêu chí từng đối tác doanh nghiệp", timeline: "Theo thông báo", note: "Theo dõi thông báo từ phòng HTDN của trường" }
    ]
  }
];
SCHOOLS = __PENDING_SCHOOLS__;

/* ═══════════════ RENDER ═══════════════ */
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
let searchTerm = '';

function renderSidebar(schools) {
  if (!sidebar) return;
  try {
    const titleHtml = '<div class="p2-sidebar-title">📚 Danh sách trường</div>';
    const safeSchools = Array.isArray(schools) ? schools : [];
    const linksHtml = safeSchools.map(s => {
      const mainLink = `<a href="#${s.id}" data-id="${s.id}" data-action="highlight-section" data-school-id="${s.id}">${s.logoFallback || '🏫'} ${s.short || s.name || '---'}</a>`;
      const variantLinks = (s.variants && s.variants.length)
        ? s.variants.map(v => `<a href="#${v.id}" data-id="${v.id}" data-action="highlight-section" data-school-id="${v.id}" class="p2-sidebar-variant">↳ ${v.label || v.short || v.name}</a>`).join('')
        : '';
      return mainLink + variantLinks;
    }).join('');
    const emptyMsg = safeSchools.length === 0
      ? '<div style="padding:12px;color:#6b7280;font-size:.8rem;">Không có trường nào khớp từ khóa.</div>'
      : '';
    sidebar.innerHTML = titleHtml + linksHtml + emptyMsg;
  } catch (err) {
    console.error('[renderSidebar] error:', err);
    sidebar.innerHTML = '<div class="p2-sidebar-title">📚 Danh sách trường</div><div style="padding:12px;color:#dc2626;font-size:.8rem;">Lỗi hiển thị danh sách. Vui lòng tải lại trang.</div>';
  }
}

function renderSchools(schools) {
  if (schools.length === 0) {
    mainContent.innerHTML = '<div class="p2-no-results">Không tìm thấy trường phù hợp với từ khóa.</div>';
    return;
  }
  mainContent.innerHTML = schools.map(s => {
    const cardsHtml = s.scholarships.map(sc => `
      <div class="sc-card">
        <div class="sc-card-title">🎓 ${sc.title}</div>
        <div class="sc-row">
          <span class="sc-label">Đối tượng:</span>
          <span class="sc-value">${sc.target}</span>
        </div>
        <div class="sc-row">
          <span class="sc-label">Yêu cầu:</span>
          <span class="sc-value">${sc.requirements}</span>
        </div>
        <div class="sc-row">
          <span class="sc-label">Thời gian:</span>
          <span class="sc-value"><span class="sc-tag sc-tag-green">${sc.timeline}</span></span>
        </div>
        ${sc.note ? `<div class="sc-note">💡 ${sc.note}</div>` : ''}
      </div>
    `).join('');

    // Render variants (chương trình con) nếu có
    const variantsHtml = (s.variants && s.variants.length)
      ? s.variants.map(v => {
          const vCards = v.scholarships.map(sc => `
            <div class="sc-card sc-card-variant">
              <div class="sc-card-title">🎓 ${sc.title}</div>
              <div class="sc-row">
                <span class="sc-label">Đối tượng:</span>
                <span class="sc-value">${sc.target}</span>
              </div>
              <div class="sc-row">
                <span class="sc-label">Yêu cầu:</span>
                <span class="sc-value">${sc.requirements}</span>
              </div>
              <div class="sc-row">
                <span class="sc-label">Thời gian:</span>
                <span class="sc-value"><span class="sc-tag sc-tag-green">${sc.timeline}</span></span>
              </div>
              ${sc.note ? `<div class="sc-note">💡 ${sc.note}</div>` : ''}
            </div>
          `).join('');
          return `
            <div class="school-variant" id="${v.id}">
              <div class="school-variant-header">
                <h3 class="school-variant-title">
                  ${v.website ? `<a href="${v.website}" target="_blank" rel="noopener" class="school-name-link">${v.name} <svg style="display:inline;vertical-align:middle;margin-left:4px;opacity:.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : v.name}
                </h3>
                <span class="school-variant-tag">${v.label || ''}</span>
                ${v.admissionUrl ? `<a href="${v.admissionUrl}" target="_blank" rel="noopener" class="school-admission-link" title="Cổng thông tin tuyển sinh chính thức">📋 Tuyển sinh</a>` : ''}
              </div>
              <div class="school-cards school-cards-variant">
                ${vCards}
              </div>
            </div>
          `;
        }).join('')
      : '';

    return `
      <section class="school-section" id="${s.id}">
        <div class="school-header">
          <div class="school-icon" id="icon-${s.id}"></div>
          <div class="school-info">
            <h2 class="school-name">${s.website ? `<a href="${s.website}" target="_blank" rel="noopener" class="school-name-link">${s.name} <svg style="display:inline;vertical-align:middle;margin-left:5px;opacity:.55" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : s.name}</h2>
            ${s.admissionUrl ? `<a href="${s.admissionUrl}" target="_blank" rel="noopener" class="school-admission-link" title="Cổng thông tin tuyển sinh chính thức">📋 Thông tin tuyển sinh</a>` : ''}
            <div class="school-badges">
              <span class="school-badge-short">${s.short}</span>
              <span class="school-badge-city">📍 ${s.city}</span>
              ${s.variants && s.variants.length ? `<span class="school-badge-variants">+ ${s.variants.length} chương trình</span>` : ''}
            </div>
          </div>
        </div>
        <div class="school-cards">
          ${cardsHtml}
        </div>
        ${variantsHtml ? `<div class="school-variants">${variantsHtml}</div>` : ''}
      </section>
    `;
  }).join('');

  // Inject logos (Phase 4 — logo thật local + chain):
  //   1. Local asset (assets/images/logos/<short>.png) — file thật kéo về repo
  //   2. Wikimedia Commons verified
  //   3. Google Favicon API
  //   4. SVG brand gradient badge
  schools.forEach(s => {
    const iconEl = document.getElementById('icon-' + s.id);
    if (!iconEl) return;

    // 1. Wikimedia verified (match short/alias/name)
    const uniInfo = (window.UNILogo && window.UNILogo(s.short || s.name)) || null;
    const hasVerifiedLogo = (url) => url && typeof url === 'string' && url.includes('upload.wikimedia.org/wikipedia/commons/');
    const wikiLogo = uniInfo && hasVerifiedLogo(uniInfo.logo) ? uniInfo.logo : null;
    const wikiLogoAlt = uniInfo && hasVerifiedLogo(uniInfo.logoAlt) && uniInfo.logoAlt !== wikiLogo ? uniInfo.logoAlt : null;

    function getDomain(url) { try { return new URL(url).hostname; } catch(e) { return null; } }
    const domain = getDomain(s.website) || (s.logoUrl && s.logoUrl.startsWith('http') ? getDomain(s.logoUrl) : null);
    const googleFav = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : null;

    // 2. Local asset (chỉ khi logoUrl là đường dẫn assets/...)
    const localLogo = (s.logoUrl && !s.logoUrl.startsWith('http')) ? s.logoUrl : null;

    const srcs = [];
    if (localLogo) srcs.push(localLogo);
    if (wikiLogo) srcs.push(wikiLogo);
    if (wikiLogoAlt) srcs.push(wikiLogoAlt);
    if (googleFav) srcs.push(googleFav);

    function renderFallbackBadge() {
      iconEl.innerHTML = '';
      if (window.UNILogoSvg) {
        iconEl.innerHTML = window.UNILogoSvg(s.short || s.name, { size: 56 });
        iconEl.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
      } else {
        const initials = (s.short || s.name || '?')
          .replace(/ĐH\s*/i, '')
          .replace(/[^A-Za-zÀ-ỹ\s]/g, '')
          .split(/\s+/).slice(0, 2)
          .map(w => w[0] || '')
          .join('').toUpperCase() || '?';
        iconEl.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,#6366f1,#a78bfa);color:#fff;font-weight:800;font-size:18px;border-radius:8px;font-family:"Nunito",sans-serif;';
        iconEl.textContent = initials;
      }
    }

    if (srcs.length > 0) {
      const img = document.createElement('img');
      img.alt = s.short;
      img.title = s.name;
      img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:4px;display:block;';
      let step = 0;
      img.onerror = () => {
        step++;
        if (step < srcs.length) { img.src = srcs[step]; }
        else { renderFallbackBadge(); }
      };
      img.src = srcs[0];
      iconEl.appendChild(img);
    } else {
      renderFallbackBadge();
    }
  });
}


// Normalize Vietnamese text: lowercase + remove diacritics for accent-insensitive search
function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function filterSchools(val) {
  try {
    searchTerm = normalizeText(val);
    const filtered = !searchTerm ? SCHOOLS : SCHOOLS.filter(s => {
      const haystack = normalizeText(s.name + ' ' + s.short + ' ' + s.city);
      return haystack.includes(searchTerm);
    });
    renderSidebar(filtered);
    renderSchools(filtered);
    try {
      setupObserver(filtered.map(s => s.id));
    } catch (e) { /* observer is optional */ }
  } catch (err) {
    console.error('[filterSchools] error:', err);
    renderSidebar(SCHOOLS);
    renderSchools(SCHOOLS);
  }
}

function highlightSection(id) {
  document.querySelectorAll('.school-section.highlight').forEach(el => el.classList.remove('highlight'));
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => el.classList.add('highlight'), 100);
  }
  document.querySelectorAll('.p2-sidebar a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.p2-sidebar a[data-id="${id}"]`);
  if (link) link.classList.add('active');
}

/* ═══════════════ INIT ═══════════════ */

let activeObserver = null;

function setupObserver(currentIds) {
  if (activeObserver) activeObserver.disconnect();

  activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.p2-sidebar a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.p2-sidebar a[data-id="${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

  currentIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) activeObserver.observe(el);
  });
}

function scrollToTargetFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('school');
  const fromHash = window.location.hash ? window.location.hash.slice(1) : '';
  const targetId = fromHash || fromQuery;

  if (!targetId) return;

  if (!fromHash && fromQuery) {
    window.location.hash = `#${fromQuery}`;
    return; // hashchange will handle the scroll
  }

  const el = document.getElementById(targetId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightSection(targetId);

    document.querySelectorAll('.p2-sidebar a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.p2-sidebar a[data-id="${targetId}"]`);
    if (link) link.classList.add('active');
  }
}

function toggleAccordion(card) {
  const detail = card.querySelector('.accordion-detail');
  const arrow = card.querySelector('.accordion-arrow');
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  card.classList.toggle('open', !isOpen);
  if (!isOpen) {
    card.style.gridColumn = window.innerWidth > 640 ? '1 / -1' : '';
  } else {
    card.style.gridColumn = '';
  }
}

async function initPage2() {
  // Load dữ liệu trường từ JSON trước
  await loadSchoolsData();
  try {
    renderSidebar(SCHOOLS);
    renderSchools(SCHOOLS);
  } catch (e) {
    console.error('[init render] error:', e);
  }
  try {
    if (typeof IntersectionObserver !== 'undefined') {
      setupObserver(SCHOOLS.map(s => s.id));
    }
  } catch (e) {
    console.error('[init observer] error:', e);
  }
  setTimeout(() => {
    try { scrollToTargetFromUrl(); } catch (e) { console.error('[scrollTo] error:', e); }
  }, 150);
  // Show error banner nếu load fail
  if (SCHOOLS_LOAD_ERROR && mainContent) {
    mainContent.insertAdjacentHTML('afterbegin', '<div style="padding:14px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;margin-bottom:12px;font-size:.9rem;">⚠ Không tải được dữ liệu trường. Vui lòng thử lại sau.</div>');
  }
}

// ── Event delegation thay cho inline onclick/oninput ──
//
// Mọi tương tác được route qua data-action:
//   - filter-schools (input#searchInput): filterSchools(value)
//   - highlight-section (a.p2-sidebar a): highlightSection(schoolId)
//   - toggle-accordion (.sc-card): toggleAccordion(card)
function attachPage2Listeners() {
  document.addEventListener('input', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    if (target.getAttribute('data-action') === 'filter-schools') {
      filterSchools(target.value);
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'highlight-section') {
      const id = target.getAttribute('data-school-id');
      if (id) highlightSection(id);
      return;
    }
    if (action === 'toggle-accordion') {
      // card là chính target (đã được .closest tìm thấy)
      toggleAccordion(target);
      return;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    attachPage2Listeners();
    initPage2();
  });
} else {
  attachPage2Listeners();
  initPage2();
}

window.addEventListener('hashchange', () => {
  setTimeout(scrollToTargetFromUrl, 50);
});

// (window.filterSchools/highlightSection/toggleAccordion đã bỏ —
// module giờ route qua data-action; giữ lại sẽ tốn bộ nhớ global không cần thiết.)
