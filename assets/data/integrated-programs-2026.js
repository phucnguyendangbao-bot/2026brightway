// Only program/combination scopes checked against the cited 2026 university pages.
const program = (programId,name,combos,extra={}) => ({programId,name,combos,...extra});
const engineering=['A00','A01','X06','math-phy-industrial'];
export const hcmutPrograms = [
  ['106','Khoa học Máy tính'],['107','Kỹ thuật Máy tính'],['109','Kỹ thuật Cơ khí'],
  ['110','Kỹ thuật Cơ Điện tử'],['112','Nhóm ngành Dệt - May'],['115','Nhóm ngành Xây dựng và Quản lý Dự án Xây dựng'],
  ['128','Nhóm ngành Logistics và Hệ thống Công nghiệp'],['138','Cơ Kỹ thuật'],['140','Kỹ thuật Nhiệt'],
  ['141','Bảo dưỡng Công nghiệp'],['142','Kỹ thuật Ô tô'],['145','Song ngành Tàu thủy - Hàng không'],
  ['146','Khoa học Dữ liệu'],['147','Địa Kỹ thuật Xây dựng'],['151','Kỹ thuật Địa chất'],['152','Kỹ thuật Đường sắt'],
].map(([id,name])=>program(id,name,engineering));
const economic=['A00','A01','D01','D07','X25','X26'];
export const uelPrograms = [
  ['401','Kinh tế học'],['403','Kinh tế và Quản lý công'],['421','Kinh tế số'],['402','Kinh tế đối ngoại'],
  ['413','Toán ứng dụng trong Kinh tế, Quản trị và Tài chính'],['419','Phân tích dữ liệu'],
  ['407','Quản trị kinh doanh'],['415','Quản trị du lịch và lữ hành'],['410','Marketing'],['417','Digital Marketing'],
  ['408','Kinh doanh quốc tế'],['420','Quản lý chuỗi cung ứng và Logistics quốc tế'],['411','Thương mại điện tử'],
  ['404','Tài chính - Ngân hàng'],['414','Công nghệ tài chính'],['405','Kế toán'],['422','Kế toán và phân tích dữ liệu'],
  ['409','Kiểm toán'],['418','Quản lý công'],['406','Hệ thống thông tin quản lý'],['416','Kinh doanh số và Trí tuệ nhân tạo'],
].map(([id,name])=>program(id,name,economic));
export const uhsPrograms = [
  program('7720101','Y khoa',['B00','A02']),program('7720201','Dược học',['B00','A00','A02']),
  program('7720501','Răng - Hàm - Mặt',['B00','A00','A02']),program('7720115','Y học cổ truyền',['B00','A00','A02']),
  program('7720301','Điều dưỡng',['B00','A00','A02']),
];
export const uitPrograms = [
  ...[['7480101','Khoa học Máy tính'],['7480103','Kỹ thuật phần mềm'],['7480201','Công nghệ Thông tin'],
    ['7480202','An toàn thông tin'],['7480107','Trí tuệ nhân tạo'],['7340122','Thương mại điện tử']].map(([id,name])=>program(id,name,['A00','A01','D01','D07','X06','X26'])),
  program('7480102','Mạng máy tính và truyền thông dữ liệu',['A00','A01','D01','D07','X06','X14','X26']),
  program('7480104','Hệ thống thông tin',['A00','A01','D01','D07','D08','X06','X26']),
  program('7480106','Kỹ thuật máy tính',['A00','A01','X06','X26']),
  program('7460108','Khoa học dữ liệu',['A00','A01','D01','X26','X06','D07','A02']),
  program('75202A1','Thiết kế vi mạch',['A00','A01','X06','X26'],{special:true}),
];
// Limited to combinations whose subject mapping is already verified in the app.
export const aguPrograms = [
  program('7480201','Công nghệ Thông tin',['A01','C01','D01','D07','X06']),
  program('7480103','Kỹ thuật Phần mềm',['A00','A01','C01','D01','X06','X26']),
  program('7460108','Khoa học Dữ liệu',['A00','A01','D01','X26']),
  ...[['7340101','Quản trị Kinh doanh'],['7340115','Marketing'],['7340201','Tài chính - Ngân hàng'],['7340301','Kế toán'],['7340122','Thương mại Điện tử'],['7310106','Kinh tế Quốc tế']].map(([id,name])=>program(id,name,['A00','A01','D01'])),
  program('7420201','Công nghệ Sinh học',['A00','B00','C02','D07']),
  program('7540101','Công nghệ Thực phẩm',['A00','A01','B00','C02','D07']),
  program('7620105','Chăn nuôi',['A00','B00','B03','B08','C02']),
  program('7640101','Thú y',['A00','B00','B03','B08','D07']),
  program('7380101','Luật',['A01','D01','D07','X25','X26'],{special:true,requiresThpt:true}),
  program('7140209','Sư phạm Toán học',['A00','A01','C01','D01','D07'],{special:true,requiresThpt:true}),
  program('7140201','Giáo dục Mầm non',[],{special:true,requiresThpt:true,unsupported:'Ngành cần môn năng khiếu và công thức học bạ 2 môn riêng; chưa hỗ trợ phép tính.'}),
];
