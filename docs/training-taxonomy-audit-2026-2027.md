# BrightWay Career — kiểm toán ngành đào tạo 2026–2027

Ngày rà soát: 26/10/2026. Phạm vi: repository hiện tại và một lần đọc **chỉ đọc** bảng CMS `public.majors`; không ghi vào cơ sở dữ liệu sản xuất.

**Trạng thái nghiệm thu:** PASS cho logic và kiểm thử tự động; FAIL 0 kiểm thử; BLOCKED cho xác nhận dữ liệu còn thiếu hoặc chưa đối chiếu với đề án gốc. Chưa đủ bằng chứng để tuyên bố toàn bộ danh mục/chương trình chính xác tuyệt đối.

## Kết luận và nguyên nhân gốc

- **PASS — logic đã sửa:** tra cứu trường trước đây giữ thứ tự bản ghi dù tên trường khớp chính xác; tra cứu ngành xếp mã trước tên khớp chính xác; thiếu bộ lọc nhóm ngành kết hợp với khu vực. Giờ xếp hạng theo mức khớp và lọc cùng tập kết quả.
- **PASS — dữ liệu lịch sử được bảo toàn:** 2026 dùng danh mục 7 chữ số theo [Thông tư 09/2022/TT-BGDĐT](https://congbao.chinhphu.vn/van-ban/thong-tu-so-09-2022-tt-bgddt-37383.htm) cùng 40 mã ngành thí điểm bậc đại học tại [Quyết định 1596/QĐ-BGDĐT](https://xaydungchinhsach.chinhphu.vn/dao-tao-thi-diem-trinh-do-dai-hoc-nganh-ky-thuat-robot-chi-huy-tham-muu-tac-chien-khong-gian-mang-119240610094542482.htm). Danh mục 6 chữ số theo [Thông tư 74/2026/TT-BGDĐT](https://chinhphu.vn/?classid=1&docid=219455&pageid=27160&typegroupid=6) nằm riêng, áp dụng cho khóa tuyển sinh từ 01/01/2027. Không chuyển mã của 622 dòng tuyển sinh 2026.
- **PASS — điểm chuẩn thiếu ngữ cảnh được chặn hiển thị:** 2 số điểm DUT có nguồn năm 2026 nhưng chưa rõ phương thức và thang điểm. Giá trị gốc vẫn trong dữ liệu, giao diện chỉ dẫn tới nguồn cho đến khi xác minh. 61 số điểm còn lại có URL nguồn, năm, mô tả phương thức và thang ở cấp hồ sơ nên tiếp tục hiển thị kèm chú thích; kiểm chứng từng điều kiện theo dòng vẫn là việc đối chiếu thủ công.
- **CẦN XÁC MINH:** dữ liệu nhiều trường thiếu mã hoặc chỉ có mã xét tuyển riêng. Không có căn cứ để khẳng định toàn bộ chương trình của 35 trường hay mọi liên kết biên tập trong CMS là đúng. Các trường hợp này được giữ và ghi rõ trạng thái, không tự sửa.

## Nguồn, phiên bản và sao lưu

| Nguồn trong hệ thống | Vai trò | Kết quả |
| --- | --- | --- |
| `assets/data/school-programs-2024-2026.js`, `school-profile-details.js` | Chương trình, mã xét tuyển, nguồn và điểm từng trường/năm | 622 dòng thuộc 23/35 trường, chỉ năm 2026 |
| `assets/data/moet-undergraduate-catalog-2022.js` | Mã lĩnh vực/nhóm/ngành tham chiếu cho dữ liệu 2026 | 496 mã, trong đó 377 mã ngành 7 chữ số |
| `assets/data/moet-undergraduate-pilot-2024.js` | Bổ sung ngành thí điểm 2024, giữ nguồn riêng | 82 dòng phân cấp, trong đó 40 mã ngành 7 chữ số mới; 4 dòng chương trình ở 3 trường khớp |
| `assets/data/moet-undergraduate-catalog-2026.js` | Danh mục áp dụng từ tuyển sinh 2027 | 553 mục: 24 lĩnh vực, 94 nhóm, 435 ngành 6 chữ số của các trình độ đại học |
| `assets/data/moet-catalog-transition-2026.js` | Các dòng chuyển đổi được in ở Phụ lục II | 120 dòng bậc đại học, 119 mã cũ; một mã cũ có hai đích |
| `assets/data/integrated-programs-2026.js` | Phạm vi công cụ tính điểm riêng của trường | 69 dòng thuộc 5 cấu hình trường; không cộng vào 622 vì có chồng lặp |
| `assets/data/schools.json` | Hồ sơ trường và dữ liệu `cutoffScores` cũ | 35 hồ sơ đại học có trường `cutoffScores` thiếu khóa ngành/năm/phương thức; công cụ tính điểm không sử dụng |
| Supabase `public.majors` | 10 bài/chủ đề biên tập ngành nghề | 32 gợi ý trường, chưa có khóa chương trình/năm hoặc nguồn theo từng liên kết |

Danh mục 2027 được trích bằng script từ [bản HTML chép văn bản](https://luatvietnam.vn/giao-duc/thong-tu-74-2026-tt-bgddt-danh-muc-nganh-dao-tao-trinh-do-giao-duc-dai-hoc-447389-d1.html), đối chiếu mẫu với [PDF ký số trên Cổng Chính phủ](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/9/74-bgddt.signed.pdf), gồm điều khoản chuyển tiếp và một số trang phụ lục. **Chưa soát thủ công từng dòng của 553 mục và 120 dòng chuyển đổi trên PDF gốc.** Bộ dữ liệu lưu rõ xuất xứ và không tự áp dụng ánh xạ cho hồ sơ trường.

Trước khi sửa, các tệp danh mục 2022, chương trình trường, chi tiết trường, `schools.json`, bộ phân loại và trang tra cứu đã được sao lưu tại `.cache/taxonomy-backup-2026-10-26/` (thư mục nội bộ không đưa lên production). Không thực hiện migration, xóa hay ghi đè dữ liệu Supabase.

## Kiểm kê và lỗi dữ liệu

- 35 hồ sơ trường; 23 có 622 dòng chương trình và 12 chưa có bảng ngành.
- Cả 23 bảng có URL nguồn; 20 mang trạng thái `school-source`, 2 được đánh dấu nguồn thứ cấp và 1 là danh mục hiện hành chưa xác nhận đúng kỳ nhập học. URL nguồn không xác nhận tự động từng dòng chương trình.
- 335 tên chương trình khác nhau sau chuẩn hóa dấu/chữ; 175 mã ngành chuẩn khác nhau liên kết tới hồ sơ, gồm 4 mã thí điểm. Không thể khẳng định một tổng số **ngành duy nhất theo nghĩa chuyên môn** khi 176 dòng thiếu mã và nhiều tên là chương trình/chuyên ngành riêng. 206 mã ngành trong danh mục 2022 và 36 mã thí điểm không xuất hiện ở 35 hồ sơ; đây là danh mục tham chiếu chưa được dùng, không phải liên kết mồ côi.
- 315 dòng khớp chính xác mã và tên, gồm 4 dòng trước đây bị xếp nhầm “chưa có trong danh mục” do thiếu Quyết định 1596; 176 thiếu mã; 79 dùng hậu tố/mã riêng có tiền tố khớp; 48 mã chưa có trong hai danh mục tham chiếu 2026; 4 mã chuẩn có tên chương trình khác. **48 mã chưa đối chiếu không đồng nghĩa mã sai.**
- 32 nhóm cùng tên nhưng khác mã, 3 nhóm cùng mã với cách ghi tên khác, 51 nhóm cùng mã ngành chuẩn có nhiều chương trình trong một trường. Không gộp hay xóa dòng. Không có tên trùng hệt sau chuẩn hóa trong cùng trường.
- Không phát hiện khóa trường mồ côi trong các module chương trình tĩnh. Không có bằng chứng tự động để khẳng định chương trình thuộc sai trường; việc xác nhận từng ngành đang tuyển đòi hỏi đề án từng trường/đúng kỳ. 32 gợi ý trường trong CMS hiện được ghi rõ là gợi ý biên tập, chưa phải xác nhận đào tạo.

Toàn bộ **358 mục kiểm toán** có giá trị hiện tại, đề xuất, căn cứ và trạng thái trong [CSV lỗi dữ liệu](training-taxonomy-issues-2026-2027.csv). [CSV từng dòng 2026](training-taxonomy-audit-2026.csv) giữ mã/nhóm/trạng thái/nguồn danh mục của 622 chương trình và 12 hồ sơ thiếu bảng. [CSV liên kết CMS](training-taxonomy-cms-links-2026.csv) ghi 32 gợi ý trường chưa xác minh. [JSON số liệu](training-taxonomy-audit-summary.json) do script tạo lại.

| Trường hợp tiêu biểu | Giá trị hiện tại | Giá trị đề xuất và căn cứ | Trạng thái |
| --- | --- | --- | --- |
| Ngành thí điểm 2024 bị phân loại thiếu | PNT `7720609` Khúc xạ nhãn khoa, `7720610` Kỹ thuật gây mê hồi sức; UMP `7720202` Công nghệ dược phẩm; HUAF `7620210` Lâm nghiệp | Gắn đúng lĩnh vực/nhóm/ngành theo [Quyết định 1596/QĐ-BGDĐT](https://xaydungchinhsach.chinhphu.vn/dao-tao-thi-diem-trinh-do-dai-hoc-nganh-ky-thuat-robot-chi-huy-tham-muu-tac-chien-khong-gian-mang-119240610094542482.htm); giữ bản ghi và mã trường | Đã sửa phân loại |
| Phân nhóm trong Phụ lục I 2027 | `220111` Ngôn ngữ Ảrập in dưới nhóm `2202`, trong khi tiền tố mã là `2201` | Giữ nguyên mã/tên, đánh dấu xung đột; [PDF ký số trang phụ lục 3](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/9/74-bgddt.signed.pdf) | Cần Bộ/trường xác minh, không tự đổi |
| Chuyển mã 2027 | `7810104` → `810101` **và** `810201` trong Phụ lục II | Giữ hai ứng viên, chọn theo chương trình/đề án riêng; [Thông tư 74/2026](https://chinhphu.vn/?classid=1&docid=219455&pageid=27160&typegroupid=6) | Mơ hồ, không tự áp dụng |
| Mã/tên chương trình | CTU `7480106` “Kỹ thuật máy tính (Thiết kế vi mạch bán dẫn)” so với “Kỹ thuật máy tính” | Giữ tên trường; tham chiếu ngành chuẩn, [nguồn CTU trong CSV](training-taxonomy-issues-2026-2027.csv) | Cần xác minh tên chuyên biệt |
| Cách ghi tên cùng mã | VLU `7229030` “Văn học Ứng dụng”, CTU/QNU “Văn học” | Giữ từng bản ghi của trường; đối chiếu tên chương trình với nguồn | Cần xác minh, chưa coi là lỗi |
| Điểm chuẩn thiếu siêu dữ liệu | DUT `7480201TN` 27 và `7520216TN` 27,1; thang/phương thức chưa xác minh | Giữ số trong dữ liệu, ẩn số trên UI; mở [nguồn DUT](https://dut.udn.vn/TrangNCKH/Thongbao/id/12208) | Đã chặn hiển thị, chờ đối chiếu |

## Cấu trúc dữ liệu và quy tắc

- Danh mục chuẩn tách khỏi `schoolProgramDetails`: **phiên bản văn bản → lĩnh vực → nhóm ngành → ngành**. Chương trình trường vẫn giữ `schoolId`, mã xét tuyển riêng, tên, cơ sở, phân loại, năm, tổ hợp, chỉ tiêu, điểm và nguồn. `sortedPrograms` chỉ tạo bản xem có chỉ số gốc, không thay mảng dữ liệu.
- Phụ lục II lưu mọi ánh xạ được công bố; API `transitionForCode` trả `explicit`, `ambiguous` hoặc `not-listed`. Không bỏ chữ số đầu của mã 2026 để tạo mã 2027 khi Phụ lục II không nêu.
- Giao diện tra cứu kết hợp từ khóa, chế độ tìm trường/ngành, khu vực, nhóm ngành và trường yêu thích. Tên ngành khớp chính xác đứng trước mã rồi tới từ viết tắt/từ đồng nghĩa; tên trường chính thức khớp chính xác đứng trước viết tắt và kết quả yếu. Trang hồ sơ giữ sắp xếp theo nhóm, mã tăng dần hoặc A–Z.
- CMS `majors` là chủ đề biên tập theo khối thi, không phải bảng ngành chuẩn hoặc bảng trường–ngành; nhãn trên card được sửa để tránh coi gợi ý trường là quan hệ tuyển sinh đã xác minh.

**Migration đề xuất cho giai đoạn sau, chưa thực hiện:** các bảng `taxonomy_versions`, `fields`, `groups`, `majors`, `major_crosswalk`, `school_program_offerings`, `admission_methods`, `cutoff_scores`; khóa duy nhất cần gồm trường + năm + cơ sở + mã xét tuyển + chương trình + phương thức khi phù hợp. Nhập liệu phải lưu URL nguồn và trạng thái xác minh. Cần thiết kế và đối chiếu từng trường trước khi chuyển dữ liệu sản xuất.

## Tệp đã sửa và tạo

| Phần | Tệp |
| --- | --- |
| Danh mục, ánh xạ và phân loại | `assets/data/moet-undergraduate-pilot-2024.js`, `assets/data/moet-undergraduate-catalog-2026.js`, `assets/data/moet-catalog-transition-2026.js`, `assets/js/training-taxonomy.js` |
| Tra cứu và hiển thị điểm | `page2.html`, `assets/css/page2.css`, `assets/js/page2-loader.js`, `assets/js/page2.js`, `assets/js/score-provenance.js`, `assets/js/school-comparison-model.js`, `majors.html` |
| Kiểm toán và kiểm thử | `scripts/import-moet-pilot-2024.mjs`, `scripts/import-moet-catalog-2026.mjs`, `scripts/audit-training-taxonomy.mjs`, `scripts/audit-cms-major-links.mjs`, `scripts/qa-training-taxonomy.cjs`, `tests/training-taxonomy.test.mjs`, `package.json` |
| Báo cáo | `docs/training-taxonomy-audit-2026.md`, tài liệu này và các CSV/JSON kiểm kê liên kết phía trên |

Các tệp điểm chuẩn, công thức, tổ hợp xét tuyển, học phí, dữ liệu hồ sơ trường và dữ liệu cá nhân đã lưu không bị sửa.

## Kiểm thử và giới hạn

| Hạng mục | Kết quả |
| --- | --- |
| `npm test` | PASS 128/128; gồm ngành thí điểm 2024, mã 6/7 chữ số theo năm, mã chuyển đổi mơ hồ, tên gần giống, một ngành ở nhiều trường, sắp xếp, tìm không dấu/mã/từ viết tắt, bảo toàn chương trình và giá trị tuyển sinh |
| `npm run test:e2e:training-taxonomy` | PASS; tìm trường/ngành, nhóm + khu vực, không có kết quả, A–Z, 2027 dự kiến không đổi nguồn 2026, ẩn điểm DUT, chuyển đúng dòng sang công cụ tính điểm |
| `npm run test:e2e:admissions` | PASS 10/10, gồm 34 tổ hợp và khôi phục mục tiêu |
| `npm run test:e2e:integrated` | PASS 17/17, gồm các nhánh trường và viewport 360–1366px |
| `npm run validate` | PASS 28 trang, 541 liên kết/asset, 103 kiểm tra cú pháp |
| `npm run audit:training-taxonomy` | PASS, tạo CSV và JSON kiểm toán |
| `npm run audit:cms-major-links` | PASS, đọc 10 chủ đề/32 gợi ý; không ghi Supabase |
| `npm run test:e2e:content` | PASS 6/6, gồm CMS thật, lọc và trạng thái thử lại |
| `npm run audit:product` | PASS 18/18 trang được kiểm tra giao diện, bàn phím và khả năng truy cập |

Website tĩnh không có script `build`, `lint` hoặc `typecheck` riêng; `validate` là cổng kiểm tra cú pháp và liên kết. Chưa xác minh từng dòng của phụ lục 2027 bằng PDF gốc, từng chương trình tại 23 trường và từng gợi ý CMS bằng đề án trường. Chưa có hồ sơ tuyển sinh 2027 để thử ánh xạ trên dữ liệu trường thực tế. Vì vậy chưa kết luận toàn bộ dữ liệu đạt độ chính xác tuyệt đối và chưa sửa dữ liệu tuyển sinh gốc.
