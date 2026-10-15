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

const hufiPrograms = toPrograms([
  ['7220201', 'Ngôn ngữ Anh'],
  ['7220204', 'Ngôn ngữ Trung Quốc'],
  ['7340101', 'Quản trị kinh doanh'],
  ['7340115', 'Marketing'],
], 'Ngành / chương trình theo trang tuyển sinh');

const uitPrograms = toPrograms([
  ['', 'Công nghệ thông tin'],
  ['', 'Hệ thống thông tin'],
  ['', 'Khoa học máy tính'],
  ['', 'Kỹ thuật phần mềm'],
  ['', 'Kỹ thuật máy tính'],
  ['', 'Mạng máy tính và truyền thông dữ liệu'],
  ['', 'An toàn thông tin'],
  ['', 'Thương mại điện tử'],
  ['', 'Khoa học dữ liệu'],
  ['', 'Thiết kế vi mạch'],
  ['', 'Truyền thông đa phương tiện'],
  ['', 'Công nghệ thông tin Việt Nhật'],
  ['7480101LK', 'Khoa học máy tính (liên kết Birmingham City)'],
  ['7480102LK', 'Mạng máy tính và An toàn thông tin (liên kết Birmingham City)'],
  ['7480106LK', 'Kỹ thuật máy tính (Kỹ thuật hệ thống máy tính – liên kết Newcastle)'],
], 'Ngành / chương trình theo trang tuyển sinh');

const duytanPrograms = toPrograms([
  ['', 'Kỹ thuật phần mềm'], ['', 'An toàn thông tin'], ['', 'Khoa học máy tính'], ['', 'Trí tuệ nhân tạo'],
  ['', 'Khoa học dữ liệu'], ['', 'Mạng máy tính và truyền thông dữ liệu'], ['', 'Công nghệ kỹ thuật điện, điện tử'],
  ['', 'Công nghệ kỹ thuật ô tô'], ['', 'Kỹ thuật điều khiển và tự động hóa'], ['', 'Công nghệ chế tạo máy'],
  ['', 'Kỹ thuật điện'], ['', 'Kỹ thuật cơ điện tử'], ['', 'Kiến trúc'], ['', 'Thiết kế đồ họa'], ['', 'Thiết kế thời trang'],
  ['', 'Kỹ thuật xây dựng'], ['', 'Công nghệ kỹ thuật công trình xây dựng'], ['', 'Kỹ thuật xây dựng công trình giao thông'],
  ['', 'Công nghệ kỹ thuật môi trường'], ['', 'Quản lý tài nguyên và môi trường'], ['', 'Công nghệ thực phẩm'],
  ['', 'Y khoa'], ['', 'Dược học'], ['', 'Răng - Hàm - Mặt'], ['', 'Điều dưỡng'], ['', 'Công nghệ sinh học'], ['', 'Kỹ thuật y sinh'],
  ['', 'Quản trị kinh doanh'], ['', 'Tài chính - Ngân hàng'], ['', 'Kế toán'], ['', 'Kiểm toán'], ['', 'Thương mại điện tử'],
  ['', 'Quản trị nhân lực'], ['', 'Marketing'], ['', 'Kinh doanh thương mại'], ['', 'Đầu tư tài chính'],
  ['', 'Logistics và quản lý chuỗi cung ứng'], ['', 'Ngôn ngữ Anh'], ['', 'Ngôn ngữ Trung Quốc'], ['', 'Ngôn ngữ Hàn Quốc'],
  ['', 'Ngôn ngữ Nhật'], ['', 'Văn học'], ['', 'Việt Nam học'], ['', 'Truyền thông đa phương tiện'], ['', 'Quan hệ quốc tế'],
  ['', 'Quan hệ công chúng'], ['', 'Luật'], ['', 'Luật kinh tế'], ['', 'Quản trị dịch vụ du lịch và lữ hành'],
  ['', 'Quản trị sự kiện'], ['', 'Quản trị nhà hàng và dịch vụ ăn uống'], ['', 'Quản trị khách sạn'], ['', 'Du lịch'],
], 'Ngành / chương trình theo trang tuyển sinh');

const hubPrograms = toPrograms([
  ['7220201', 'Ngôn ngữ Anh'],
  ['7220201DB', 'Ngôn ngữ Anh (chương trình đặc biệt)'],
  ['7220204', 'Ngôn ngữ Trung Quốc'],
  ['7310106', 'Kinh tế quốc tế'],
], 'Ngành / chương trình theo trang tuyển sinh');

const ntuPrograms = [
  ['7220204', 'Ngôn ngữ Trung Quốc', 'Ngành / chương trình theo trang tuyển sinh', 21.56, 'TVA2'],
  ['7380101', 'Luật', 'Ngành / chương trình theo trang tuyển sinh', 26.59, 'TV2A'],
  ['7420201', 'Công nghệ sinh học', 'Ngành / chương trình theo trang tuyển sinh', 20, 'T2VA'],
  ['7340101A', 'Quản trị kinh doanh (chương trình đặc biệt)', 'Chương trình đặc thù', 24, 'T2VA'],
  ['7340201A', 'Tài chính - Ngân hàng (chương trình đặc biệt)', 'Chương trình đặc thù', 24, 'T2VA'],
  ['7340301A', 'Kế toán (chương trình đặc biệt)', 'Chương trình đặc thù', 23, 'T2VA'],
  ['7420201MP', 'Công nghệ sinh học (chương trình Minh Phú - NTU)', 'Chương trình đặc thù', 20, 'T2VA'],
  ['7480201A', 'Công nghệ thông tin (chương trình đặc biệt)', 'Chương trình đặc thù', 22, 'T2VA'],
  ['7480201B', 'Công nghệ thông tin Việt - Nhật', 'Chương trình đặc thù', 22, 'T2VA'],
  ['7520103MP', 'Cơ khí thủy sản thông minh (chương trình Minh Phú - NTU)', 'Chương trình đặc thù', 20, 'T2VA'],
  ['7520115MP', 'Kỹ thuật cơ điện lạnh (chương trình MP - NTU)', 'Chương trình đặc thù', 20, 'T2VA'],
  ['7540105HV', 'Công nghệ chế biến thủy sản (chương trình Hải Vương - NTU)', 'Chương trình đặc thù', 20, 'T2VA'],
  ['7540105MP', 'Công nghệ chế biến thủy sản (chương trình Minh Phú - NTU)', 'Chương trình đặc thù', 20, 'T2VA'],
  ['7620301MP', 'Nuôi trồng thủy sản (chương trình Minh Phú - NTU)', 'Chương trình đặc thù', 20, 'T2VA'],
  ['7810103A', 'Quản trị dịch vụ du lịch và lữ hành (chương trình đặc biệt)', 'Chương trình đặc thù', 25, 'T2VA'],
  ['7810103P', 'Quản trị dịch vụ du lịch và lữ hành (chương trình song ngữ Pháp - Việt)', 'Chương trình đặc thù', 23, 'T2VA'],
  ['7810201A', 'Quản trị khách sạn (chương trình đặc biệt)', 'Chương trình đặc thù', 25, 'T2VA'],
  ['7810201V', 'Quản trị khách sạn (chương trình Vin - NTU)', 'Chương trình đặc thù', 25, 'T2VA'],
  ['7220201', 'Ngôn ngữ Anh', 'Đại trà', 24.61, 'TVA2'],
  ['7310101', 'Kinh tế', 'Đại trà', 22, 'T2VA'],
  ['7310105', 'Kinh tế phát triển', 'Đại trà', 21.5, 'T2VA'],
  ['7340101', 'Quản trị kinh doanh', 'Đại trà', 24, 'T2VA'],
  ['7340115', 'Marketing', 'Đại trà', 27, 'T2VA'],
  ['7340121', 'Kinh doanh thương mại', 'Đại trà', 24, 'T2VA'],
  ['7340201', 'Tài chính - Ngân hàng', 'Đại trà', 24, 'T2VA'],
  ['7340301', 'Kế toán', 'Đại trà', 23, 'T2VA'],
  ['7340302', 'Kiểm toán', 'Đại trà', 23, 'T2VA'],
  ['7340405', 'Hệ thống thông tin quản lý', 'Đại trà', 21, 'T2VA'],
  ['7480101', 'Khoa học máy tính', 'Đại trà', 22, 'T2VA'],
  ['7480201', 'Công nghệ thông tin', 'Đại trà', 22, 'T2VA'],
  ['7510202', 'Công nghệ chế tạo máy', 'Đại trà', 20, 'T2VA'],
  ['7520103', 'Kỹ thuật cơ khí', 'Đại trà', 21, 'T2VA'],
  ['7520114', 'Kỹ thuật cơ điện tử', 'Đại trà', 22, 'T2VA'],
  ['7520115', 'Kỹ thuật nhiệt', 'Đại trà', 21, 'T2VA'],
  ['7520116', 'Kỹ thuật cơ khí động lực', 'Đại trà', 20, 'T2VA'],
  ['7520122', 'Kỹ thuật tàu thủy', 'Đại trà', 21, 'T2VA'],
  ['7520130', 'Kỹ thuật ô tô', 'Đại trà', 22, 'T2VA'],
  ['7520201', 'Kỹ thuật điện', 'Đại trà', 23, 'T2VA'],
  ['7520206', 'Kỹ thuật biển', 'Đại trà', 20, 'T2VA'],
  ['7520216', 'Kỹ thuật điều khiển và tự động hóa', 'Đại trà', 23, 'T2VA'],
  ['7520301', 'Kỹ thuật hóa học', 'Đại trà', 20, 'T2VA'],
  ['7520320', 'Kỹ thuật môi trường', 'Đại trà', 20, 'T2VA'],
  ['7540101', 'Công nghệ thực phẩm', 'Đại trà', 20.5, 'T2VA'],
  ['7540105', 'Công nghệ chế biến thủy sản', 'Đại trà', 20, 'T2VA'],
  ['7540106', 'Đảm bảo chất lượng và an toàn thực phẩm', 'Đại trà', 20, 'T2VA'],
  ['7580201', 'Kỹ thuật xây dựng', 'Đại trà', 20, 'T2VA'],
  ['7580205', 'Kỹ thuật xây dựng công trình giao thông', 'Đại trà', 20, 'T2VA'],
  ['7620301', 'Nuôi trồng thủy sản', 'Đại trà', 20, 'T2VA'],
  ['7620303', 'Khoa học thủy sản', 'Đại trà', 20, 'T2VA'],
  ['7620305', 'Quản lý thủy sản', 'Đại trà', 20, 'T2VA'],
  ['7810103', 'Quản trị dịch vụ du lịch và lữ hành', 'Đại trà', 25, 'T2VA'],
  ['7810201', 'Quản trị khách sạn', 'Đại trà', 25, 'T2VA'],
  ['7840106', 'Khoa học hàng hải', 'Đại trà', 25, 'T2VA'],
].map(([code, name, track, score, combination]) => ({ code, name, track, score, combination }));

const qnuPrograms = toPrograms([
  ['7140114', 'Quản lý giáo dục'], ['7220204', 'Ngôn ngữ Trung Quốc'], ['7229030', 'Văn học'], ['7310109', 'Kinh tế số'],
  ['7140201', 'Giáo dục mầm non'], ['7140202', 'Giáo dục tiểu học'], ['7140205', 'Giáo dục chính trị'], ['7140206', 'Giáo dục thể chất'],
], 'Ngành / chương trình theo trang tuyển sinh');

const tdtuPrograms = toPrograms([
  ['', 'Kế toán'], ['', 'Kiểm toán'], ['', 'Kinh doanh quốc tế'], ['', 'Quan hệ lao động'], ['', 'Marketing'],
  ['', 'Quản trị nhân lực'], ['', 'Quản trị kinh doanh'], ['', 'Tài chính - Ngân hàng'], ['', 'Công nghệ tài chính'],
  ['', 'Luật'], ['', 'Thống kê'], ['', 'Toán ứng dụng'], ['', 'Khoa học dữ liệu'], ['', 'Ngôn ngữ Anh'],
  ['', 'Ngôn ngữ Trung Quốc'], ['', 'Du lịch'],
], 'Ngành / chương trình theo trang tuyển sinh');

const dongaPrograms = toPrograms([
  ['132', 'Y khoa'], ['133', 'Dược học'], ['134', 'Điều dưỡng'], ['136', 'Hộ sinh'], ['135', 'Kỹ thuật phục hồi chức năng'],
  ['137', 'Dinh dưỡng'], ['141', 'Tâm lý học'], ['142', 'Quản lý văn hóa'], ['143', 'Văn học (Ứng dụng)'],
  ['117', 'Quản trị khách sạn'], ['116', 'Quản trị dịch vụ du lịch và lữ hành'], ['118', 'Quản trị nhà hàng và dịch vụ ăn uống'],
  ['102', 'Ngôn ngữ Anh'], ['101', 'Ngôn ngữ Trung Quốc'], ['104', 'Ngôn ngữ Nhật'], ['103', 'Ngôn ngữ Hàn Quốc'],
  ['138', 'Luật'], ['139', 'Luật kinh tế'], ['120', 'Công nghệ thông tin'], ['121', 'Kỹ thuật máy tính'],
  ['122', 'Trí tuệ nhân tạo'], ['123', 'Đồ họa'], ['119', 'Công nghệ kỹ thuật ô tô'], ['125', 'Công nghệ kỹ thuật điện, điện tử'],
  ['124', 'Công nghệ kỹ thuật điều khiển và tự động hóa'], ['127', 'Kỹ thuật cơ điện tử'], ['126', 'Công nghệ kỹ thuật xây dựng'],
  ['128', 'Công nghệ sinh học'], ['129', 'Công nghệ thực phẩm'], ['130', 'Nông nghiệp'], ['131', 'Thú y'],
  ['105', 'Quản trị kinh doanh'], ['106', 'Marketing'], ['107', 'Logistics và quản lý chuỗi cung ứng'], ['108', 'Thương mại điện tử'],
  ['109', 'Kế toán'], ['111', 'Kinh doanh quốc tế'], ['115', 'Thiết kế thời trang'], ['112', 'Truyền thông đa phương tiện'],
  ['113', 'Quản trị nhân lực'],
], 'Ngành / chương trình theo trang tuyển sinh');

const huafPrograms = toPrograms([
  ['7340116', 'Bất động sản'], ['7510201', 'Công nghệ kỹ thuật cơ khí'], ['7520114', 'Kỹ thuật cơ – điện tử'],
  ['7540101', 'Công nghệ thực phẩm'], ['7540106', 'Đảm bảo chất lượng và an toàn thực phẩm'],
  ['7580210', 'Kỹ thuật cơ sở hạ tầng'], ['7620102', 'Khuyến nông'], ['7620105', 'Chăn nuôi'],
  ['7620110', 'Khoa học cây trồng'], ['7620112', 'Bảo vệ thực vật'], ['7620116', 'Phát triển nông thôn'],
  ['7620118', 'Nông nghiệp công nghệ cao'], ['7620210', 'Lâm nghiệp'], ['7620211', 'Quản lý tài nguyên rừng'],
  ['7620301', 'Nuôi trồng thủy sản'], ['7620302', 'Bệnh học thủy sản'], ['7620305', 'Quản lý thủy sản'],
  ['7640101', 'Thú y'], ['7850103', 'Quản lý đất đai'],
], 'Ngành');

const vkuPrograms = toPrograms([
  ['', 'Công nghệ Game'], ['', 'Công nghệ Thông tin (Cử nhân)'], ['', 'Công nghệ Thông tin (Kỹ sư)'],
  ['', 'Giải trí và truyền thông số'], ['', 'Quản trị dịch vụ du lịch & lữ hành số'],
  ['', 'Quản trị dự án Công nghệ thông tin'],
], 'Chương trình/chuyên ngành');

const dutPrograms = [
  ['', 'Công nghệ thông tin', 170], ['', 'Công nghệ thông tin (ngoại ngữ Nhật)', 80],
  ['', 'Công nghệ thông tin, chuyên ngành Khoa học dữ liệu và Trí tuệ nhân tạo', 60],
  ['7480201TN', 'Chương trình đào tạo kỹ sư tài năng Công nghệ thông tin (định hướng Khoa học dữ liệu và Trí tuệ nhân tạo)', 30, 27],
  ['', 'Kỹ thuật máy tính', 100], ['', 'Công nghệ thông tin, chuyên ngành An toàn thông tin trên không gian số', 40],
  ['', 'Công nghệ sinh học', 65], ['', 'Công nghệ sinh học chuyên ngành Công nghệ sinh học Y Dược', 45],
  ['', 'Công nghệ kỹ thuật vật liệu xây dựng', 45], ['', 'Công nghệ chế tạo máy', 180],
  ['', 'Quản lý công nghiệp', 120], ['', 'Công nghệ dầu khí và khai thác dầu', 60],
  ['', 'Kỹ thuật cơ khí - chuyên ngành Cơ khí động lực', 110], ['', 'Chương trình Kỹ sư chất lượng cao Việt - Pháp (PFIEV)', 120],
  ['', 'Kỹ thuật Cơ khí, chuyên ngành Kỹ thuật phương tiện đường sắt tốc độ cao', 40], ['', 'Kỹ thuật cơ điện tử', 140],
  ['7520114TN', 'Chương trình đào tạo kỹ sư tài năng Kỹ thuật cơ điện tử', 30], ['', 'Kỹ thuật nhiệt', 120],
  ['', 'Kỹ thuật nhiệt - Chuyên ngành Quản lý năng lượng', 60], ['', 'Kỹ thuật tàu thủy', 60],
  ['', 'Kỹ thuật điện', 250], ['7520201TN', 'Chương trình đào tạo kỹ sư tài năng Kỹ thuật điện', 30],
  ['', 'Kỹ thuật điện tử - viễn thông', 170], ['7520207TN', 'Chương trình đào tạo kỹ sư tài năng Kỹ thuật điện tử - viễn thông', 30],
  ['', 'Kỹ thuật điện tử - viễn thông, chuyên ngành vi điện tử - thiết kế vi mạch', 60],
  ['', 'Kỹ thuật điều khiển và tự động hóa', 120],
  ['7520216TN', 'Chương trình đào tạo kỹ sư tài năng Kỹ thuật điều khiển và tự động hóa', 30, 27.1],
  ['', 'Kỹ thuật hóa học', 90], ['', 'Kỹ thuật môi trường', 60], ['', 'Kỹ thuật hệ thống công nghiệp', 60],
  ['', 'Kỹ thuật cơ khí - chuyên ngành cơ khí hàng không', 50], ['', 'Kỹ thuật ô tô', 80],
  ['7520130TN', 'Chương trình đào tạo kỹ sư tài năng Kỹ thuật ô tô', 30],
  ['', 'Chương trình tiên tiến Việt - Mỹ ngành Điện tử viễn thông', 45],
  ['', 'Chương trình tiên tiến Việt - Mỹ chuyên ngành Hệ thống nhúng và IoT thuộc ngành Kỹ thuật điện, điện tử', 45],
  ['', 'Kỹ thuật Cơ khí, chuyên ngành Cơ khí hàng không (Hợp tác doanh nghiệp, dạy và học bằng tiếng Anh)', 45],
  ['', 'Công nghệ thực phẩm', 140], ['', 'Kiến trúc', 130],
  ['', 'Kỹ thuật xây dựng, chuyên ngành Xây dựng dân dụng & Công nghiệp', 220],
  ['', 'Kỹ thuật xây dựng, chuyên ngành Tin học xây dựng', 85],
  ['', 'Kỹ thuật xây dựng, chuyên ngành Kỹ thuật và quản lý xây dựng đô thị thông minh', 40],
  ['', 'Kỹ thuật xây dựng, chuyên ngành Mô hình thông tin và trí tuệ nhân tạo trong xây dựng', 50],
  ['7580201TN', 'Chương trình đào tạo kỹ sư tài năng Kỹ thuật xây dựng', 30],
  ['', 'Kỹ thuật xây dựng công trình thủy', 45], ['', 'Kỹ thuật xây dựng công trình giao thông', 105],
  ['', 'Kỹ thuật xây dựng công trình giao thông - chuyên ngành xây dựng đường sắt tốc độ cao và đường sắt đô thị', 60],
  ['', 'Kinh tế xây dựng', 120], ['', 'Kỹ thuật cơ sở hạ tầng', 45], ['', 'Quản lý tài nguyên & môi trường', 60],
].map(([code, name, quota, score]) => ({ code, name, track: 'Ngành / chương trình', quota, score }));

const hcmutPrograms = toPrograms([
  ['', 'Nhóm ngành Máy tính và Công nghệ thông tin'], ['', 'Kỹ thuật vật liệu'],
  ['', 'Nhóm ngành Hóa - Thực phẩm - Sinh học'], ['', 'Nhóm ngành Môi trường'],
  ['', 'Nhóm ngành Kỹ thuật Dệt – Công nghệ May'], ['', 'Kỹ thuật cơ khí'], ['', 'Kỹ thuật cơ điện tử'],
  ['', 'Nhóm ngành Kỹ thuật Hệ thống Công nghiệp, Logistics và Quản lý chuỗi Cung ứng'],
  ['', 'Kỹ thuật nhiệt'], ['', 'Vật lý kỹ thuật'], ['', 'Cơ kỹ thuật'], ['', 'Quản lý công nghiệp'],
], 'Ngành / nhóm ngành (chưa phải mã xét tuyển)');

const vluPrograms = toPrograms([
  ['7210205','Thanh nhạc'], ['7210208','Piano'], ['7210234','Diễn viên Kịch, Điện ảnh - Truyền hình'], ['7210235','Đạo diễn Điện ảnh, Truyền hình'],
  ['7210402','Thiết kế Công nghiệp'], ['7210403','Thiết kế Đồ họa'], ['7210404','Thiết kế Thời Trang'], ['7210409','Thiết kế Mỹ thuật số'],
  ['7580108','Thiết kế Nội thất'], ['7220201','Ngôn ngữ Anh'], ['7220204','Ngôn ngữ Trung Quốc'], ['7220210','Ngôn ngữ Hàn Quốc'],
  ['7229030','Văn học Ứng dụng'], ['7310608','Đông phương học'], ['7310401','Tâm lý học'], ['7320104','Truyền thông Đa phương tiện'],
  ['7320108','Quan hệ Công chúng'], ['7320106','Công nghệ Truyền thông'], ['7210302','Công nghệ Điện ảnh - Truyền hình'], ['7210303','Thiết kế âm thanh, ánh sáng'],
  ['7320105','Truyền thông Đại chúng'], ['7310106','Kinh tế Quốc tế'], ['7340101','Quản trị Kinh doanh'], ['7340115','Marketing'],
  ['7340116','Bất động sản'], ['7340120','Kinh doanh Quốc tế'], ['7340121','Kinh doanh Thương mại'], ['7340122','Thương mại Điện tử'],
  ['7340201','Tài chính - Ngân hàng'], ['7340205','Công nghệ Tài chính'], ['7340301','Kế toán'], ['7380101','Luật'],
  ['7380107','Luật Kinh tế'], ['7420201','Công nghệ Sinh học'], ['7420207','Công nghệ Thẩm mỹ'], ['7540101','Công nghệ Thực phẩm'],
  ['7460108','Khoa học Dữ liệu'], ['7480104','Hệ thống Thông tin'], ['7480103','Kỹ thuật Phần mềm'], ['7480201','Công nghệ Thông tin'],
  ['7480102','Mạng máy tính và Truyền thông dữ liệu'], ['7480107','Trí tuệ Nhân tạo'], ['7510605','Logistics và Quản lý chuỗi cung ứng'], ['7520118','Kỹ thuật Hệ thống Công nghiệp'],
  ['7510205','Công nghệ Kỹ thuật Ô tô'], ['7510301','Công nghệ Kỹ thuật điện, Điện tử'], ['7520114','Kỹ thuật Cơ điện tử'], ['7520115','Kỹ thuật Nhiệt'],
  ['7520120','Kỹ thuật Hàng không'], ['7580201','Kỹ thuật Xây dựng'], ['7580302','Quản lý Xây dựng'], ['7580205','Kỹ thuật xây dựng công trình giao thông'],
  ['7510406','Công nghệ Kỹ thuật Môi trường'], ['7850101','Quản lý Tài nguyên & Môi trường'], ['7580101','Kiến trúc'], ['7720201','Dược học'],
  ['7720301','Điều dưỡng'], ['7720501','Răng - Hàm - Mặt'], ['7720101','Y Khoa'], ['7720601','Kỹ thuật Xét nghiệm Y học'],
  ['7810101','Du lịch'], ['7810103','Quản trị Dịch vụ Du lịch & Lữ hành'], ['7810201','Quản trị Khách sạn'], ['7810202','Quản trị Nhà hàng và Dịch vụ Ăn uống'],
], 'Ngành tuyển sinh');

const pntPrograms = toPrograms([
  ['7720101','Y khoa'], ['7720115','Y học cổ truyền'], ['7720201','Dược học'], ['7720301','Điều dưỡng'],
  ['7720302','Hộ sinh'], ['7720401','Dinh dưỡng'], ['7720501','Răng Hàm Mặt'], ['7720601','Kỹ thuật xét nghiệm y học'],
  ['7720602','Kỹ thuật hình ảnh y học'], ['7720603','Kỹ thuật phục hồi chức năng'], ['7720609','Khúc xạ nhãn khoa'], ['7720610','Kỹ thuật gây mê hồi sức'],
  ['7720701','Y tế công cộng'], ['7310401','Tâm lý học'],
], 'Ngành tuyển sinh');

const uehPrograms = toPrograms([
  ['', 'Kinh tế chính trị quốc tế'], ['', 'Công nghệ Logistics tích hợp chứng chỉ FIATA (hệ kỹ sư)'],
  ['', 'Kiến trúc và Thiết kế đô thị thông minh'], ['', 'Luật'], ['', 'Luật Thương mại quốc tế'],
  ['', 'Sản xuất thông minh (hệ kỹ sư)'], ['', 'Quản trị vận hành và di chuyển thông minh'],
  ['', 'Cử nhân tài năng – Công nghệ (AI for Business)'],
], 'Chương trình được UEH công bố mở mới');

const ftuPrograms = toPrograms([
  ['', 'Quản trị nhân lực'], ['', 'Thương mại số thông minh và Đổi mới kinh doanh'],
], 'Ngành/chương trình được trường giới thiệu');

const ctumpPrograms = toPrograms([
  ['7720101','Y khoa'], ['7720101E','Y khoa (tiếng Anh)'], ['7720110','Y học dự phòng'], ['7720115','Y học cổ truyền'],
  ['7720201','Dược học'], ['7720301','Điều dưỡng'], ['7720302','Hộ sinh'], ['7720401','Dinh dưỡng'],
  ['7720501','Răng hàm mặt'], ['7720601','Kỹ thuật Xét nghiệm y học'], ['7720602','Kỹ thuật Hình ảnh y học'], ['7720603','Kỹ thuật Phục hồi chức năng'],
  ['7720701','Y tế công cộng'], ['7520212','Kỹ thuật Y sinh'], ['7310401','Tâm lý học'],
], 'Ngành / chương trình');

const umpPrograms = toPrograms([
  ['7310401','Tâm lý học'], ['7720101','Y khoa'], ['7720110','Y học dự phòng'], ['7720115','Y học cổ truyền'],
  ['7720201','Dược học'], ['7720202','Công nghệ dược phẩm'], ['7720203','Hóa dược'], ['7720301','Điều dưỡng'],
  ['772030103','Điều dưỡng chuyên ngành Gây mê hồi sức'], ['7720302','Hộ sinh'], ['7720401','Dinh dưỡng'], ['7720501','Răng - Hàm - Mặt'],
  ['7720502','Kỹ thuật phục hình răng'],
], 'Ngành / chương trình');

const rmitPrograms = toPrograms([
  ['', 'Kinh doanh'], ['', 'Kế toán'], ['', 'Kinh tế và Tài chính'], ['', 'Quản trị Nguồn nhân lực'],
  ['', 'Kinh doanh toàn cầu'], ['', 'Quản trị'], ['', 'Quản lý Chuỗi cung ứng và Logistics'], ['', 'Kinh doanh Kỹ thuật số'],
  ['', 'Quản trị du lịch và khách sạn'], ['', 'Digital Marketing'], ['', 'Thiết kế (Truyền thông số)'], ['', 'Thiết kế ứng dụng sáng tạo'],
  ['', 'Sản xuất phim kỹ thuật số'], ['', 'Thiết kế game'], ['', 'Truyền thông chuyên nghiệp'], ['', 'Quản trị doanh nghiệp thời trang'],
  ['', 'Tâm lý học'], ['', 'Hàng không'], ['', 'Công nghệ thông tin'], ['', 'Kỹ thuật phần mềm'],
  ['', 'Kỹ thuật điện tử và hệ thống máy tính'], ['', 'Kỹ thuật robot và cơ điện tử'], ['', 'Công nghệ Thực phẩm và Dinh dưỡng'],
  ['', 'Quốc tế học'], ['', 'Khoa học máy tính'],
], 'Chương trình / lĩnh vực học');

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
  hufi: { 2026: {
    year: 2026,
    programs: hufiPrograms,
    programSource: 'https://diemthi.tuyensinh247.com/thong-tin-dai-hoc-cong-nghiep-thuc-pham-tphcm-DCT.html',
    programSourceLabel: 'Nguồn tra cứu danh sách ngành',
    programNote: '4 ngành từ nguồn tra cứu thứ cấp. Đây chưa phải danh mục ngành đầy đủ của trường.',
  } },
  uit: { 2026: {
    year: 2026,
    programs: uitPrograms,
    programSource: 'https://tuyensinh.uit.edu.vn/',
    supplementarySources: [
      { label: 'Thông tin chương trình liên kết', url: 'https://tuyensinh.uit.edu.vn/node/4241' },
      { label: 'Tuyển sinh liên kết Birmingham City', url: 'https://tuyensinh.uit.edu.vn/2026-thong-bao-tuyen-sinh-trinh-do-dai-hoc-chuong-trinh-lien-ket-voi-truong-dai-hoc-birmingham-city-vuong-quoc-anh-nam-2026-dot-2?page=2' },
      { label: 'Thông tin chương trình Việt Nhật', url: 'https://tuyensinh.uit.edu.vn/node/4225' },
    ],
    programNote: '15 ngành/chương trình được ghi nhận; 12 dòng chưa có mã xét tuyển trong nguồn nhập.',
  } },
  duytan: { 2026: {
    year: 2026,
    programs: duytanPrograms,
    programSource: 'https://tuyensinh2026.duytan.edu.vn/',
    programNote: '53 ngành được giới thiệu trên trang tuyển sinh 2026; nguồn nhập chưa kèm mã xét tuyển.',
  } },
  hub: { 2026: {
    year: 2026,
    programs: hubPrograms,
    programSource: 'https://diemthi.tuyensinh247.com/kqxt-dai-hoc-ngan-hang-tphcm-NHS.html',
    programSourceLabel: 'Nguồn tra cứu danh sách ngành',
    programNote: '4 ngành từ nguồn tra cứu thứ cấp. Đây chưa phải danh mục ngành đầy đủ của trường.',
  } },
  ntu: { 2026: {
    year: 2026,
    programs: ntuPrograms,
    programSource: 'https://tuyensinh.ntu.edu.vn/thong-bao/diem-chuan-trung-tuyen-2026',
    scoreSource: 'https://tuyensinh.ntu.edu.vn/thong-bao/diem-chuan-trung-tuyen-2026',
    scoreMethod: 'Điểm thi THPT 2026 theo tổ hợp được trích; một số tổ hợp có hệ số môn',
    programNote: '53 ngành/chương trình từ công bố điểm trúng tuyển 2026. Điểm trong bảng là của tổ hợp được trích, không phải điểm chung cho mọi tổ hợp.',
  } },
  qnu: { 2026: {
    year: 2026,
    programs: qnuPrograms,
    programSource: 'https://tuyensinh.qnu.edu.vn/vi/tuyen-sinh-dai-hoc-chinh-quy-2027/tb151-xet-tuyen-bo-sung-vao-dai-hoc-chinh-quy-nam-2026',
    supplementarySources: [{
      label: 'Nguồn tra cứu bổ sung',
      url: 'https://thuvienphapluat.vn/hoi-dap-phap-luat/truong-dai-hoc-quy-nhon-tuyen-sinh-2026-gom-nhung-nganh-nao-138081635.html',
    }],
    programNote: '8 ngành tổng hợp từ thông báo tuyển bổ sung và nguồn tra cứu; chưa phải danh mục đầy đủ.',
  } },
  tdtu: { 2026: {
    year: 2026,
    programs: tdtuPrograms,
    programSource: 'https://admission.tdtu.edu.vn/hoc-tai-tdtu/hoc-phi-hoc-bong-2026',
    programNote: '16 ngành xuất hiện trong danh sách chương trình học phí 2026; nguồn nhập chưa kèm mã xét tuyển và chưa khẳng định đầy đủ.',
  } },
  donga: { 2026: {
    year: 2026,
    programs: dongaPrograms,
    programSource: 'https://tuyensinhdonga.edu.vn/',
    programNote: '40 ngành từ trang tuyển sinh 2026 của trường.',
  } },
  huaf: { 2026: {
    year: 2026,
    programs: huafPrograms,
    programSource: 'https://tuyensinh.huaf.edu.vn/thong-bao-dang-ky-xet-tuyen-dai-hoc-he-chinh-quy-nam-2026/',
    programNote: '19 ngành trong thông báo tuyển sinh chính thức năm 2026.',
  } },
  vku: { 2026: {
    year: 2026,
    programs: vkuPrograms,
    programSource: 'https://tuyensinh.vku.udn.vn/nganh',
    programNote: 'Đã xác minh 6 tên trong danh sách 22 ngành/chuyên ngành trên cổng tuyển sinh; nguồn nhập chưa có mã xét tuyển và chưa phải danh mục đầy đủ.',
  } },
  dut: { 2026: {
    year: 2026,
    programs: dutPrograms,
    programSource: 'https://tuyensinh.dut.udn.vn/nganh-va-chi-tieu-tuyen-sinh',
    scoreSource: 'https://dut.udn.vn/TrangNCKH/Thongbao/id/12208',
    scoreMethod: 'Điểm theo bài công bố kết quả tuyển sinh 2026 của trường; cần đối chiếu bảng gốc để xác định đúng phương thức',
    programNote: '49 ngành/chương trình cùng chỉ tiêu dự kiến năm 2026. Mã xét tuyển chỉ hiển thị ở 7 dòng đã xác minh; hiện có điểm chuẩn đã xác minh cho 2 chương trình kỹ sư tài năng.',
  } },
  hcmut: { 2026: {
    year: 2026,
    programs: hcmutPrograms,
    programSource: 'https://hcmut.edu.vn/tuyen-sinh/dai-hoc-chinh-quy/phuong-thuc-tuyen-sinh/xet-tuyen-thang-2026',
    programNote: 'Danh sách tham khảo mới xác minh 12 trong 44 ngành/nhóm ngành trường công bố; chưa phải danh mục đầy đủ và chưa phải mã xét tuyển.',
  } },
  vlu: { 2026: {
    year: 2026,
    programs: vluPrograms,
    programSource: 'https://www.vlu.edu.vn/dynamic/nganh-dao-tao',
    programNote: '64 mã ngành từ danh mục tuyển sinh 2026. Thông tin điểm sàn của trường không được dùng thay cho điểm chuẩn trúng tuyển.',
  } },
  pnt: { 2026: {
    year: 2026,
    programs: pntPrograms,
    programSource: 'https://pnt.edu.vn/vi/tuyen-sinh-dai-hoc/danh-sach-trung-tuyen-dai-hoc-chinh-quy-nam-2026',
    programNote: '14 mã ngành được xác minh từ danh sách trúng tuyển đại học chính quy 2026; chưa nhập điểm chuẩn khi chưa có bảng số theo đúng mã và phương thức.',
  } },
  ueh: { 2026: {
    year: 2026,
    programs: uehPrograms,
    programSource: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026/',
    programNote: 'Mới ghi nhận 8 chương trình đào tạo mở mới. UEH công bố 82 chương trình tại TP.HCM và 15 tại Vĩnh Long; đây chưa phải danh mục đầy đủ và chưa đối chiếu mã xét tuyển.',
  } },
  ftu: { 2026: {
    year: 2026,
    programs: ftuPrograms,
    programSource: 'https://ftu.edu.vn/ftu/99-news/dao-tao/%C4%91%C3%A0o-t%E1%BA%A1o-%C4%91%E1%BA%A1i-h%E1%BB%8Dc-h%E1%BB%87-ch%C3%ADnh-quy/6853-tru-ng-d-i-h-c-ngo-i-thuong-m-them-cac-nganh-dao-t-o-va-ap-d-ng-toan-di-n-mo-hinh-dao-t-o-g-n-v-i-phat-tri-n-ngh-nghi-p-cdim',
    programNote: 'Mới ghi nhận 2 ngành/chương trình được trường giới thiệu; chưa có bảng đầy đủ theo trụ sở/cơ sở TP.HCM và chưa xác minh mã xét tuyển.',
  } },
  ctump: { 2026: {
    year: 2026,
    programs: ctumpPrograms,
    programSource: 'https://tuyensinh.ctump.edu.vn/thong-bao-tuyen-sinh-dai-hoc-nam-2026-030350.html',
    programNote: '15 ngành/chương trình tuyển sinh chính quy năm 2026, gồm chương trình Y khoa tiếng Anh riêng; không bao gồm hệ liên thông và chưa nhập điểm chuẩn.',
  } },
  ump: { 2026: {
    year: 2026,
    programs: umpPrograms,
    programSource: 'https://ump.edu.vn/uploads/ckeditor/files/Truong/DaoTaoDaiHoc/TuyenSinh/2026/2373_27052026_Capnhat_Thongtintuyensinh.pdf',
    programNote: '13 mục được trích từ PDF thông tin tuyển sinh cập nhật 2026; đây chưa phải danh mục đầy đủ của trường và chưa nhập điểm chuẩn.',
  } },
  rmit: { 2026: {
    year: 2026,
    programs: rmitPrograms,
    programSource: 'https://www.rmit.edu.vn/vi/hoc-tap-tai-rmit/chuong-trinh-cu-nhan',
    programNote: '25 chương trình/lĩnh vực trên trang cử nhân hiện hành; cần xác nhận chương trình mở tại từng cơ sở và kỳ nhập học 2026. RMIT không dùng mã xét tuyển ngành Việt Nam hoặc điểm chuẩn THPT chung.',
  } },
};

export const PROGRAM_IMPORT_METADATA = {
  source: 'BrightWay_CTUMP_UMP_USSH_RMIT_2026_CapNhat.xlsx',
  importedAt: '2026-10-15',
  years: [2026],
  schoolCount: Object.keys(schoolProgramDetails).length,
  missingCodeRows: Object.values(schoolProgramDetails)
    .flatMap(years => Object.values(years))
    .flatMap(details => details.programs)
    .filter(program => !program.code).length,
  totalRows: Object.values(schoolProgramDetails)
    .flatMap(years => Object.values(years))
    .reduce((total, details) => total + details.programs.length, 0),
};
