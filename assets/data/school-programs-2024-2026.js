const toPrograms = (rows, track) => rows.map(([code, name]) => ({
  code,
  name,
  track: typeof track === 'function' ? track(name) : track,
}));

const ctuTrack = name => name.includes('(CTCLC)') ? 'CTCLC'
  : name.includes('(CTTT)') ? 'CTTT'
    : / - (Cơ sở|Khu)/.test(name) ? 'Cơ sở khác' : 'Đại trà / khác';

const ctuPrograms = toPrograms([
  ['7140201','Giáo dục mầm non'],['7140202','Giáo dục Tiểu học'],['7140204','Giáo dục Công dân'],['7140206','Giáo dục Thể chất'],
  ['7140209','Sư phạm Toán học'],['7140210','Sư phạm Tin học'],['7140211','Sư phạm Vật lý'],['7140212','Sư phạm Hóa học'],
  ['7140213','Sư phạm Sinh học'],['7140217','Sư phạm Ngữ văn'],['7140218','Sư phạm Lịch sử'],['7140219','Sư phạm Địa lý'],
  ['7140231','Sư phạm Tiếng Anh'],['7140233','Sư phạm Tiếng Pháp'],['7140247','Sư phạm Khoa học tự nhiên'],['7140249','Sư phạm Lịch sử - Địa lý'],
  ['7220201','Ngôn ngữ Anh'],['7220201C','Ngôn ngữ Anh (CTCLC)'],['7220201H','Ngôn ngữ Anh - Cơ sở Hậu Giang'],['7220203','Ngôn ngữ Pháp'],
  ['7229001','Triết học'],['7229030','Văn học'],['7310101','Kinh tế'],['7310201','Chính trị học'],['7310301','Xã hội học'],
  ['7310403','Tâm lý học giáo dục'],['7320101','Báo chí'],['7320104','Truyền thông đa phương tiện'],['7320201','Thông tin - thư viện'],
  ['7340101','Quản trị kinh doanh'],['7340101C','Quản trị kinh doanh (CTCLC)'],['7340101H','Quản trị kinh doanh - Cơ sở Hậu Giang'],
  ['7340115','Marketing'],['7340120','Kinh doanh quốc tế'],['7340120C','Kinh doanh quốc tế (CTCLC)'],['7340121','Kinh doanh thương mại'],
  ['7340122','Thương mại điện tử'],['7340201','Tài chính - Ngân hàng'],['7340201C','Tài chính - Ngân hàng (CTCLC)'],
  ['7340205','Công nghệ tài chính'],['7340301','Kế toán'],['7340301S','Kế toán - Khu Sóc Trăng'],['7340302','Kiểm toán'],
  ['7380101','Luật'],['7380101H','Luật - Cơ sở Hậu Giang'],['7380101S','Luật - Khu Sóc Trăng'],['7380103','Luật dân sự và tố tụng dân sự'],
  ['7380107','Luật kinh tế'],['7420101','Sinh học'],['7420201','Công nghệ sinh học'],['7420201T','Công nghệ sinh học (CTTT)'],
  ['7420203','Sinh học ứng dụng'],['7440112','Hóa học'],['7440301','Khoa học môi trường'],['7460108','Khoa học dữ liệu'],
  ['7460112','Toán ứng dụng'],['7460201','Thống kê'],['7480101','Khoa học máy tính'],['7480102','Mạng máy tính và truyền thông dữ liệu'],
  ['7480102C','Mạng máy tính và truyền thông dữ liệu (CTCLC)'],['7480103','Kỹ thuật phần mềm'],['7480103C','Kỹ thuật phần mềm (CTCLC)'],
  ['7480104','Hệ thống thông tin'],['7480104C','Hệ thống thông tin (CTCLC)'],['7480106','Kỹ thuật máy tính (Thiết kế vi mạch bán dẫn)'],
  ['7480107','Trí tuệ nhân tạo'],['7480201','Công nghệ thông tin'],['7480201C','Công nghệ thông tin (CTCLC)'],
  ['7480201H','Công nghệ thông tin - Cơ sở Hậu Giang'],['7480202','An toàn thông tin'],['7510401','Công nghệ kỹ thuật hóa học'],
  ['7510401C','Công nghệ kỹ thuật hóa học (CTCLC)'],['7510601','Quản lý công nghiệp'],['7510605','Logistics và Quản lý chuỗi cung ứng'],
  ['7510605S','Logistics và Quản lý chuỗi cung ứng - Khu Sóc Trăng'],['7520103','Kỹ thuật cơ khí'],['7520103C','Kỹ thuật cơ khí (CTCLC)'],
  ['7520114','Kỹ thuật cơ điện tử'],['7520130','Kỹ thuật ô tô'],['7520201','Kỹ thuật điện'],['7520201C','Kỹ thuật điện (CTCLC)'],
  ['7520207','Kỹ thuật điện tử - viễn thông'],['7520212','Kỹ thuật y sinh'],['7520216','Kỹ thuật điều khiển và tự động hóa'],
  ['7520216C','Kỹ thuật điều khiển và tự động hóa (CTCLC)'],['7520309','Kỹ thuật vật liệu'],['7520320','Kỹ thuật môi trường'],
  ['7520401','Vật lý kỹ thuật'],['7540101','Công nghệ thực phẩm'],['7540101C','Công nghệ thực phẩm (CTCLC)'],
  ['7540104','Công nghệ sau thu hoạch'],['7540105','Công nghệ chế biến thủy sản'],['7540106','Đảm bảo chất lượng và an toàn thực phẩm'],
  ['7580101','Kiến trúc'],['7580105','Quy hoạch vùng và đô thị'],['7580201','Kỹ thuật xây dựng'],['7580201C','Kỹ thuật xây dựng (CTCLC)'],
  ['7580202','Kỹ thuật xây dựng công trình thủy'],['7580205','Kỹ thuật xây dựng công trình giao thông'],['7580213','Kỹ thuật cấp thoát nước'],
  ['7580302','Quản lý xây dựng'],['7620103','Khoa học đất'],['7620105','Chăn nuôi'],['7620109','Nông học'],['7620110','Khoa học cây trồng'],
  ['7620112','Bảo vệ thực vật'],['7620112C','Bảo vệ thực vật (CTCLC)'],['7620113','Công nghệ rau hoa quả và cảnh quan'],
  ['7620114','Kinh doanh nông nghiệp'],['7620114H','Kinh doanh nông nghiệp - Cơ sở Hậu Giang'],['7620115','Kinh tế nông nghiệp'],
  ['7620115H','Kinh tế nông nghiệp - Cơ sở Hậu Giang'],['7620301','Nuôi trồng thủy sản'],['7620301T','Nuôi trồng thủy sản (CTTT)'],
  ['7620302','Bệnh học thủy sản'],['7620305','Quản lý thủy sản'],['7640101','Thú y'],['7640101C','Thú y (CTCLC)'],
  ['7720203','Hóa dược'],['7810101','Du lịch'],['7810101H','Du lịch - Cơ sở Hậu Giang'],['7810101S','Du lịch - Khu Sóc Trăng'],
  ['7810103','Quản trị dịch vụ du lịch và lữ hành'],['7810103C','Quản trị dịch vụ du lịch và lữ hành (CTCLC)'],
  ['7850101','Quản lý tài nguyên và môi trường'],['7850102','Kinh tế tài nguyên thiên nhiên'],['7850103','Quản lý đất đai'],
], ctuTrack);

const hcmusPrograms = toPrograms([
  ['7420101','Sinh học'],['7420101_DKD','Sinh học (chương trình tăng cường tiếng Anh)'],['7420201','Công nghệ Sinh học'],
  ['7420201_DKD','Công nghệ Sinh học (chương trình tăng cường tiếng Anh)'],['7440102_DKD','Vật lý học (chương trình tăng cường tiếng Anh)'],
  ['7440102_NN','Nhóm ngành Vật lý học và Công nghệ vật lý điện tử và tin học'],
  ['7440107_DKD','Công nghệ vật lý điện tử và tin học (chương trình tăng cường tiếng Anh)'],['74401a1','Công nghệ bán dẫn'],
  ['7440112','Hóa học'],['7440112_DKD','Hóa học (chương trình tăng cường tiếng Anh)'],['7440122','Khoa học Vật liệu'],
  ['7440122_DKD','Khoa học Vật liệu (chương trình tăng cường tiếng Anh)'],['7440201_NN','Nhóm ngành Địa chất học và Kinh tế đất đai'],
  ['7440228','Hải dương học'],['7440228_DKD','Hải dương học (chương trình tăng cường tiếng Anh)'],['7440301','Khoa học Môi trường'],
  ['7440301_DKD','Khoa học Môi trường (chương trình tăng cường tiếng Anh)'],['7460101_NN','Nhóm ngành Toán học, Toán ứng dụng, Toán tin'],
  ['7460112_DKD','Toán ứng dụng (chương trình tăng cường tiếng Anh)'],['7460117_DKD','Toán tin (chương trình tăng cường tiếng Anh)'],
  ['7460108_NN','Nhóm ngành Khoa học dữ liệu và Thống kê'],['7460108_DKD','Khoa học dữ liệu (chương trình tăng cường tiếng Anh)'],
  ['7480101_TT','Khoa học máy tính (chương trình tiên tiến)'],['7480107','Trí tuệ nhân tạo'],
  ['7480201_DKD','Công nghệ thông tin (chương trình tăng cường tiếng Anh)'],['7480201_NN','Nhóm ngành Máy tính và Công nghệ thông tin'],
  ['7510401_DKD','Công nghệ kỹ thuật Hóa học (chương trình tăng cường tiếng Anh)'],['7510402','Công nghệ Vật liệu'],
  ['7510402_DKD','Công nghệ Vật liệu (chương trình tăng cường tiếng Anh)'],['7510406','Công nghệ kỹ thuật Môi trường'],
  ['7520207','Kỹ thuật điện tử - viễn thông'],['75202a1','Thiết kế vi mạch'],
  ['7520207_DKD','Kỹ thuật điện tử - viễn thông (chương trình tăng cường tiếng Anh)'],['7520402','Kỹ thuật hạt nhân'],
  ['7520403','Vật lý y khoa'],['7520403_DKD','Vật lý y khoa (chương trình tăng cường tiếng Anh)'],['7520501','Kỹ thuật địa chất'],
  ['7850101','Quản lý tài nguyên và môi trường'],['7140103','Công nghệ giáo dục'],
], 'Ngành/nhóm ngành');

const hcmuePrograms = toPrograms([
  ['7140201','Giáo dục Mầm non'],['7140202','Giáo dục Tiểu học'],['7140202SN','Giáo dục Tiểu học (song ngữ)'],
  ['7140203','Giáo dục Đặc biệt'],['7140204','Giáo dục Công dân'],['7140205','Giáo dục Chính trị'],['7140206','Giáo dục Thể chất'],
  ['7140208','Giáo dục Quốc phòng - An ninh'],['7140209','Sư phạm Toán học'],['7140210','Sư phạm Tin học'],
  ['7140211','Sư phạm Vật lý'],['7140212','Sư phạm Hóa học'],['7140213','Sư phạm Sinh học'],['7140217','Sư phạm Ngữ văn'],
  ['7140218','Sư phạm Lịch sử'],['7140219','Sư phạm Địa lý'],['7140231','Sư phạm Tiếng Anh'],['7140232','Sư phạm Tiếng Nga'],
  ['7140233','Sư phạm Tiếng Pháp'],['7140234','Sư phạm Tiếng Trung Quốc'],['7140246','Sư phạm Công nghệ'],
  ['7140247','Sư phạm Khoa học tự nhiên'],['7140249','Sư phạm Lịch sử - Địa lý'],['7140101','Giáo dục học'],
  ['7140103','Công nghệ giáo dục'],['7140114','Quản lý giáo dục'],['7310201','Chính trị học'],['7760103','Hỗ trợ giáo dục người khuyết tật'],
], 'Đại học - trụ sở chính');

export const schoolProgramDetails = {
  ctu: { 2026: {
    year: 2026,
    programs: ctuPrograms,
    programSource: 'https://tuyensinh.ctu.edu.vn/thong-tin-tuyen-sinh/166-d-i-h-c-chinh-quy/841-danh-muc-nganh-va-chi-tieu-tuyen-sinh-dhcq.html',
    programNote: '127 mã xét tuyển từ trang công bố 2026. Dữ liệu kế thừa cần tiếp tục rà soát nguồn.',
  } },
  hcmus: { 2026: {
    year: 2026,
    programs: hcmusPrograms,
    programSource: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/',
    programNote: '39 mã xét tuyển từ bảng tuyển sinh chính thức 2026. Dữ liệu kế thừa cần tiếp tục rà soát nguồn.',
  } },
  hcmue: { 2026: {
    year: 2026,
    programs: hcmuePrograms,
    programSource: 'https://tuyensinh.hcmue.edu.vn/index.php?Itemid=9677&id=27823&lang=vi&option=com_content&site=183&view=article',
    supplementarySources: [{
      label: 'Hai ngành mở mới năm 2026',
      url: 'https://tuyensinh.hcmue.edu.vn/index.php?Itemid=9677&id=27819&lang=vi&option=com_content&site=183&view=article',
    }],
    programNote: '28 dòng tại trụ sở chính, gồm 2 ngành mở mới. Danh sách trong file chưa khẳng định đầy đủ mọi cơ sở.',
  } },
};

export const PROGRAM_IMPORT_METADATA = {
  source: 'BrightWay_37_muc_35_truong_Nganh_2024_2026.xlsx',
  importedAt: '2026-10-15',
  totalRows: ctuPrograms.length + hcmusPrograms.length + hcmuePrograms.length,
};
