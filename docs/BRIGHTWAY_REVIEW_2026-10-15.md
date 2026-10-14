# Rà soát BrightWay Career — 15/10/2026

## Phạm vi và giới hạn

Bản rà soát tập trung tuyển sinh, tra cứu trường/nghề, Holland, lịch và trang chủ cho lớp 12 năm học 2026–2027. Giữ giao diện tím và quy trình chính hiện có, không thiết kế lại toàn bộ.

Không sửa CV/Portfolio hoặc hệ thống học bổng. Các file `scholarship-roadmap.html`, `essay-review.html`, `interview-prep.html`, `api/analyze.js`, `api/prompts.js`, `assets/js/resources-data.js`, `assets/js/flow.js`, `assets/js/sync.js`, `assets/js/waybi.js` được đối chiếu checksum với commit `68c1965` và không thay đổi. `schools.json` và `jobs.json` cũng được giữ nguyên; không xóa dữ liệu cũ.

## Các lỗi đã xác nhận và cách sửa

- 40 bản ghi trường không tương đương 40 trường độc lập: FPT/`fpt-ai` và HCMUS/`khtn-hcm` trùng trường. Hai đại học vùng (Huế, Đà Nẵng) cần thống kê riêng. Bản ghi `hucfl` có tên KHXH & NV – Đại học Huế nhưng URL trỏ Đại học Khoa học, chưa đủ căn cứ để nhận là một trường khác.
- Lớp danh mục tuyển sinh mới hiển thị **35 hồ sơ trường + 2 đại học vùng**, còn **1 bản ghi danh tính cần xác minh** chưa đếm. Đây là số hồ sơ trong cơ sở dữ liệu, KHÔNG phải 35 trường đã xác minh toàn bộ đề án. Tất cả 40 bản ghi gốc được bảo toàn cho phần ngoài phạm vi, gồm học bổng.
- Tên HUFI cũ được cập nhật ở lớp tra cứu thành Trường Đại học Công Thương TP.HCM; Khoa Y Dược Đà Nẵng được cập nhật thành Trường Y Dược. FTU hiển thị tên trường, phân biệt phân hiệu TP.HCM, không nhân đôi số trường. [Quyết định đổi tên HUIT](https://huit.edu.vn/tin-tuc/quyet-dinh-doi-ten-truong-dh-cong-nghiep-thuc-pham-tp-hcm-thanh-truong-dh-cong-thuong-tp-hcm), [Trường Y Dược Đà Nẵng](https://smp.udn.vn/), [FTU 2026](https://thongtintuyensinh.ftu.edu.vn/admissions-methods).
- Metadata danh mục công khai bổ sung `admission_year`, `updated_at`, `official_source`, `verification_status`, cùng loại đơn vị và nguồn nhận diện. Nguồn nhận diện trường không đồng nghĩa đã xác minh công thức.
- Mở liên kết trường sau khi tìm kiếm không có kết quả từng bị kẹt ở bộ lọc. Hiện deep link hợp lệ tự phục hồi danh sách; alias cũ của FPT, HCMUS và chương trình dẫn về trường chính. `hucfl` dẫn tới thông báo cần xác minh, không tới một trường giả.
- Điểm học bạ ngoài tổ hợp có thể vượt thang mà chưa bị kiểm tra; nay kiểm tra tất cả ô đã nhập. Không chấp nhận số âm, vượt thang, ký tự lạ, ký pháp khoa học, hơn 2 chữ số thập phân; phân biệt trống với 0. Khi có lỗi, ẩn cả kết quả cũ và bước tiếp theo.
- Trước đây FPT vẫn hiện thành phần chính xác dù tổng tổ hợp chưa đạt điều kiện 15. Nay không hiện điểm áp dụng FPT trong trường hợp đó. Công thức tính thành phần không thay đổi: `(tổng 3 môn thi + 3 × TB tất cả môn lớp 12) / 2`.
- Thông báo FPT 01/07/2026 bổ sung điểm sàn 18, riêng Cử nhân tài năng Khoa học máy tính 21; công cụ phân biệt đó là ngưỡng xét tuyển, không phải tổng điểm thi gốc 15. Chưa tự cộng ưu tiên/khuyến khích hoặc kết luận đạt sàn. [Thông báo FPT 2026](https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/thong-bao-tuyen-sinh-truong-dai-hoc-fpt-he-dai-hoc-chinh-quy-nam-2026/), [Điểm sàn 01/07/2026](https://daihoc.fpt.edu.vn/tin-tuc/truong-dai-hoc-fpt-cong-bo-diem-san-xet-tuyen-he-dai-hoc-chinh-quy-nam-2026/).
- Gỡ mô tả trọng số UEH chung chưa đủ phụ lục theo ngành; không bật công thức thay thế. Học bạ làm rõ trung bình chung 6 học kỳ không được mặc định bằng trung bình điểm cả năm.
- Lịch mặc định 2027, hỗ trợ `?year=2026` và `?year=2027`. Giữ 11 mốc chính thức 2026; không sao chép sang 2027. Grid/bộ đếm chỉ nhận mốc có trạng thái chính thức, nguồn, ngày đối chiếu, timestamp hợp lệ và đúng năm. Các ngày như 30/02 bị loại. Mỗi mốc hiện nguồn và ngày đối chiếu.
- Tháng 12 đổi sang ôn tập/kiểm tra/chuẩn bị kết thúc học kỳ I; tháng 1 hoàn thành học kỳ I, đánh giá và điều chỉnh. Tháng 9 và FAQ không ép chốt nguyện vọng, không khuyên dừng ôn tập, không áp đặt số giờ học.
- Holland bỏ “60 triệu học sinh”, dùng “sở thích nghề nghiệp”, giải thích điểm đồng hạng/gần nhau và giới hạn kết quả. Bài 42 câu tham khảo không được trình bày là thang O*NET đã chuẩn hóa. Nội dung 42 câu và phép cộng điểm/thứ tự xếp điểm giữ nguyên; chỉ sửa kiểm tra dữ liệu lưu và cờ hoàn thành khi bài thiếu câu. Mã nhập thủ công 1–3 chữ RIASEC, không lặp, không nhận dấu nối/khoảng trắng bên trong. [O*NET Interest Profiler](https://www.onetcenter.org/IP.html).
- Trang chủ: Hero → tin tuyển sinh → một quy trình 4 bước → Waybi → công cụ → FAQ → liên hệ. Giữ khối tiếp tục hành trình chỉ khi có dữ liệu đã lưu. Số trường dùng cùng danh mục với trang tra cứu; đang tải dùng “…”, lỗi dùng “—”, không dùng 0 thay lỗi.
- 102 nghề không trùng tên, không thiếu tên/mô tả, nhưng **không có nguồn lương** trong dữ liệu. Tra cứu hiện “Chưa có dữ liệu xác minh” thay các mức lương chưa có nguồn/năm/kinh nghiệm. Các mã nghề chưa đối chiếu không còn bị gắn nhãn ISCO chính thức. Triển vọng ghi rõ chưa có nguồn thị trường lao động/năm xác minh. Dữ liệu gốc vẫn giữ, không xóa.

## Rà soát 9 trường trong công cụ tính điểm

“9 trường có nguồn đối chiếu” không có nghĩa đã có 9 công thức xét tuyển hoàn chỉnh.

| Trường | Phần được giữ/kiểm tra | Giới hạn đang hiện cho người dùng |
| --- | --- | --- |
| FPT | Thành phần kết hợp 2026; kiểm tra A/C và tổng gốc ≥15; nguồn 10/04 và 01/07 | Chưa cộng ưu tiên/khuyến khích; chưa chọn ngành/diện; C không áp dụng CNTT/KHMT; không kết luận đạt sàn hoặc trúng tuyển |
| Cần Thơ | Tổng 3 môn thi gốc theo phương thức 2 không nhân hệ số | Chưa chọn ngành/tổ hợp hợp lệ; học bạ và V-SAT chưa nhập đủ bảng quy đổi từng môn |
| UEH | Chặn suy ra điểm tích hợp từ tổng 3 môn | Thiếu ma trận ngành/hệ số, học bạ và quy đổi đã kiểm định |
| Y Dược TP.HCM | Không tính số xét tuyển cuối cùng | Trang HTML nguồn không mở thành công trong lần rà soát; cần đối chiếu thông báo/phụ lục ngành và ngưỡng sức khỏe |
| Sư phạm TP.HCM | Giữ hướng dẫn độ lệch, tổ hợp gốc và năng khiếu/ĐGNL chuyên biệt | Phụ lục theo ngành chưa được chuyển thành bộ công thức kiểm định |
| Ngoại thương | Bổ sung đường dẫn cổng FTU 2026 mở được | Cần cơ sở/chương trình/nhóm đối tượng và bảng quy đổi mới; không chia tỷ lệ kỳ thi chung |
| Khoa học Tự nhiên | Kiểm tra ngưỡng điểm gốc, không giả thành điểm tích hợp | Cần đủ học bạ, quy đổi và công thức theo ngành; danh sách chính thức cập nhật 10/07/2026 |
| UIT | Không tự quy đổi V-ACT sang thang 30 | Cần phương thức/ngành và công thức phụ lục |
| Sài Gòn | Không suy đoán điểm xét tuyển | Cần phụ lục ngành, hệ số, năng khiếu, ngoại ngữ/V-SAT nếu áp dụng |

Nguồn đối chiếu: [Cần Thơ PT2](https://tuyensinh.ctu.edu.vn/phuong-thuc-xet-tuyen/938-phuong-thuc-2.html), [UEH 2026](https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026/), [Y Dược TP.HCM](https://ump.edu.vn/tuyen-sinh-dao-tao/dai-hoc/tuyen-sinh/10140/thong-tin-tuyen-sinh-dai-hoc-he-chinh-quy-nam-2026), [Sư phạm TP.HCM](https://tuyensinh.hcmue.edu.vn/), [FTU](https://thongtintuyensinh.ftu.edu.vn/admissions-methods), [Khoa học Tự nhiên](https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/), [UIT](https://tuyensinh.uit.edu.vn/), [Sài Gòn](https://tuyensinh.sgu.edu.vn/index.php/tuyen-sinh/thong-tin-de-an-tuyen-sinh/nam-2026/thong-tin-tuyen-sinh-nam-2026-chinh-thuc).

Thang điểm giữ đúng V-ACT 1200, HSA 150, TSA 100; V-SAT là tối đa 150/môn, chưa có chức năng quy đổi khi thiếu bảng. C01 = Văn–Toán–Lý, C02 = Văn–Toán–Hóa, C03 = Văn–Toán–Sử; X25/X26 vẫn có GD KT&PL/Tin học. Danh mục tổ hợp hiện tại là danh mục công cụ, không cam kết bao phủ mọi ngành/ngoại ngữ/năng khiếu.

## Kết quả kiểm thử

- 16 kiểm thử Node: đạt. Bao gồm định danh/không sửa dữ liệu gốc, mã tổ hợp, giới hạn nhập, ngày không hợp lệ, mốc dự thảo, năm 2027 và công thức thành phần.
- Bộ điểm đối chiếu thủ công FPT: tổng 26, TB 8,4 → 25,6; tổng 15, TB 7 → 18; tổng 30, TB 10 → 30. Tổng <15, thiếu TB, vượt thang, tổ hợp D, hoặc năm 2027 → không có thành phần áp dụng.
- 30 kịch bản browser local: 8 trang ở desktop 1440, tablet 768, mobile 390 (24 lượt) và 6 trạng thái dữ liệu tải/chậm/trống/sai/lỗi. Menu, deep link, reset/lưu/khôi phục điểm, Holland mã thủ công, bài 42 câu đồng điểm, lưu/khôi phục nghề, tìm kiếm không kết quả đều kiểm tra. Không lỗi JavaScript hoặc tràn ngang trên các lượt trang chính.
- Trang học bổng chỉ kiểm tra hồi quy đọc, không ghi dữ liệu, không gọi AI hay thao tác tài khoản thật. Chưa kiểm thử giao dịch cloud với tài khoản đăng nhập thật.
- Kết quả kiểm tra production sẽ được ghi sau khi Vercel triển khai bản mới.

## Dữ liệu vẫn chưa xác minh đầy đủ

- Đề án ngành/phương thức, chỉ tiêu, cơ sở, học phí và điểm chuẩn đầy đủ cho tất cả hồ sơ trường; có URL không có nghĩa đã xác minh thông tin.
- Các nguồn nhận diện không mở lại được được giữ trạng thái cần kiểm tra, không nâng thành đã xác minh.
- Danh tính `hucfl`; không tự gán sang Đại học Ngoại ngữ Huế hoặc xóa bản ghi gốc.
- Bảy trường ngoài thành phần FPT/tổng điểm gốc Cần Thơ chưa được bật công thức cuối cùng; các dữ liệu nguồn vẫn có thể đọc qua liên kết.
- Nguồn lương, năm dữ liệu, VNĐ/tháng, khoảng lương và mức kinh nghiệm của 102 nghề.
- Lịch chính thức 2027 trong kho nguồn hiện có. Không khẳng định không tồn tại văn bản ở mọi nơi; chỉ ghi chưa có mốc đã kiểm chứng để đưa vào công cụ.
- Không tạo bộ lọc hoặc nút so sánh học phí/điểm chuẩn giả khi chưa có dữ liệu đủ căn cứ.
- Bộ chọn trường cũ có nội dung học bổng trên trang chủ nằm ngoài phạm vi chỉnh sửa phần học bổng; không coi danh sách đó là số liệu danh mục tuyển sinh đã kiểm định.

## Các file thay đổi

HTML: `index.html`, `calendar.html`, `page2.html`, `score-calculator.html`, `holland.html`, `careers-holland.html`.

Logic: `assets/js/page2.js`, `assets/js/score-calculator.js`, `assets/js/admissions-calendar.js`, `assets/js/holland.js`, `assets/js/holland-mini.js`, `assets/js/careers.js`; thứ tự riêng trang chủ: `assets/css/admissions-home.css`.

File mới: `assets/data/university-identities.js`, `assets/js/catalog-stats.js`, `assets/js/calendar-rules.js`, `assets/js/score-rules.js`, `tests/upgrade-2027.test.mjs`, `scripts/qa-upgrade-browser.cjs` và báo cáo này.

## Đối chiếu toàn bộ 40 bản ghi gốc

Các đường dẫn sau dùng nhận diện đơn vị; không thay thế đề án tuyển sinh từng năm.

| ID gốc | Tên tại lớp tra cứu | Xử lý/trạng thái | Nguồn |
| --- | --- | --- | --- |
| hcmut | Đại học Bách khoa – ĐHQG TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://hcmut.edu.vn/) |
| uit | Đại học Công nghệ Thông tin – ĐHQG TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://www.uit.edu.vn/) |
| fpt | Đại học FPT | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://daihoc.fpt.edu.vn/) |
| ueh | Đại học Kinh tế TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://www.ueh.edu.vn/) |
| ftu | Trường Đại học Ngoại thương | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://www.ftu.edu.vn/) |
| vlu | Đại học Văn Lang | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://www.vlu.edu.vn/) |
| pnt | Đại học Y khoa Phạm Ngọc Thạch | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://pnt.edu.vn/) |
| ctump | Đại học Y Dược Cần Thơ | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://ctump.edu.vn/) |
| ump | Đại học Y Dược TP.HCM | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://ump.edu.vn/) |
| ussh | Đại học KHXH & NV – ĐHQG TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://hcmussh.edu.vn/) |
| rmit | RMIT University Vietnam | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://www.rmit.edu.vn/) |
| hub | Đại học Ngân hàng TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://hub.edu.vn/) |
| hcmue | Đại học Sư phạm TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://hcmue.edu.vn/) |
| ctu | Đại học Cần Thơ | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://www.ctu.edu.vn/) |
| dthu | Đại học Đồng Tháp | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://dthu.edu.vn/) |
| hcmus | Đại học Khoa học Tự nhiên – ĐHQG TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://hcmus.edu.vn/) |
| tdtu | Đại học Tôn Đức Thắng | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://tdtu.edu.vn/) |
| nttu | Đại học Nguyễn Tất Thành | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://ntt.edu.vn/) |
| fpt-ai | Đại học FPT | Trùng định danh → fpt | [Nguồn](https://daihoc.fpt.edu.vn/) |
| hcmiu | Đại học Quốc tế – ĐHQG TP.HCM | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://hcmiu.edu.vn/) |
| nlu | Đại học Nông Lâm TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://nlu.edu.vn/) |
| hufi | Trường Đại học Công Thương TP.HCM | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://huit.edu.vn/tin-tuc/quyet-dinh-doi-ten-truong-dh-cong-nghiep-thuc-pham-tp-hcm-thanh-truong-dh-cong-thuong-tp-hcm) |
| huemed | Đại học Y Dược – Đại học Huế | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://humed.hueuni.edu.vn/ve-nha-truong) |
| smp-udn | Trường Y Dược – Đại học Đà Nẵng | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://smp.udn.vn/) |
| duytan | Đại học Duy Tân | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://duytan.edu.vn/) |
| due | Đại học Kinh tế – Đại học Đà Nẵng | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://due.udn.vn/) |
| ntu | Đại học Nha Trang | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://ntu.edu.vn/) |
| donga | Đại học Đông Á | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://donga.edu.vn/) |
| dut | Đại học Bách khoa – Đại học Đà Nẵng | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://dut.udn.vn/) |
| qnu | Đại học Quy Nhơn | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://qnu.edu.vn/) |
| husc | Đại học Khoa học – Đại học Huế | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://husc.hueuni.edu.vn/) |
| huaf | Đại học Nông Lâm – Đại học Huế | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://huaf.edu.vn/) |
| hucfl | Đại học KHXH & NV – Đại học Huế | Danh tính xung đột; chưa đếm | [Nguồn](https://sinhvien.hueuni.edu.vn/) |
| phuxuan | Đại học Phú Xuân | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://pxu.edu.vn/) |
| vku | Đại học Công nghệ TT&TT Việt – Hàn | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://vku.udn.vn/) |
| dnu | Đại học Đà Nẵng | Đại học vùng; đếm riêng | [Nguồn](https://www.udn.vn/) |
| khtn-hcm | Đại học Khoa học Tự nhiên – ĐHQG TP.HCM | Trùng định danh → hcmus | [Nguồn](https://hcmus.edu.vn/) |
| hue-uni | Đại học Huế | Đại học vùng; đếm riêng | [Nguồn](https://hueuni.edu.vn/portal/vi/) |
| sgu | Đại học Sài Gòn | Đã mở nguồn nhận diện; đề án vẫn cần xác minh | [Nguồn](https://sgu.edu.vn/) |
| uel | Đại học Kinh tế - Luật – ĐHQG TP.HCM | Hồ sơ trường; nguồn cần mở lại | [Nguồn](https://www.uel.edu.vn/) |
