# BrightWay — rà soát ngành đào tạo, 26/10/2026

## Phạm vi và nguồn chuẩn

- Rà 35 hồ sơ trường đại học trong catalog hiện có. 23 hồ sơ có 622 dòng ngành/chương trình 2026; 12 hồ sơ chưa có danh sách ngành chi tiết. File [CSV kiểm kê từng dòng](training-taxonomy-audit-2026.csv) gồm cả 12 hồ sơ thiếu bảng, mã gốc, nhóm đối chiếu và trạng thái cần xác minh.
- Danh mục chuẩn riêng trong `assets/data/moet-undergraduate-catalog-2022.js` là Phụ lục I, Phần I của [Thông tư 09/2022/TT-BGDĐT đăng Công báo Chính phủ](https://congbao.chinhphu.vn/van-ban/thong-tu-so-09-2022-tt-bgddt-37383.htm). 496 mã cấp lĩnh vực (3 số), nhóm (5 số), ngành (7 số) đã được đối chiếu tập mã 1:1 với PDF Công báo. Tên ngành trích từ bản HTML cùng văn bản; chưa bao gồm mọi quyết định ngành thí điểm hoặc cập nhật sau 2022. [Bộ Tài chính năm 2025](https://isa.mof.gov.vn/hoidapcstc/home/cthoidap/157194) vẫn viện dẫn Thông tư 09/2022 là danh mục thống kê ngành đại học.
- Dòng tuyển sinh trường vẫn là bản ghi riêng: mã xét tuyển, tên chương trình, cơ sở, phương thức, tổ hợp, chỉ tiêu, điểm và nguồn **không sửa**. Mã 3 chữ số của trường, mã có hậu tố/chữ cái, mã mới chưa có trong ảnh chụp 2022 không được tự đổi thành mã ngành Bộ.

## Kết quả đối chiếu

| Trạng thái | Số dòng | Xử lý |
| --- | ---: | --- |
| Mã 7 số + tên trùng danh mục 2022 | 311 | Đặt đúng lĩnh vực/nhóm/ngành bằng mã; hiển thị theo mã tăng dần. |
| Thiếu mã xét tuyển | 176 | Giữ nguyên tên và nguồn trường; đưa vào khu “Chưa xác minh”, không tự gán mã. Danh sách đầy đủ nằm trong CSV, lọc `classificationStatus=missing-code`. |
| Mã riêng của trường có 7 số đầu khớp ngành chuẩn | 79 | Giữ nguyên mã đầy đủ; chỉ hiển thị nhóm/ngành tham chiếu từ tiền tố, đánh dấu cần đối chiếu. |
| Mã chưa có trong danh mục 2022 hoặc dạng mã trường | 52 | Không kết luận sai; tách khu cần xác minh. |
| Mã 7 số có trong danh mục nhưng tên khác tên chuẩn | 4 | Giữ tên chương trình trường và gắn trạng thái cần đối chiếu. |
| Trường chưa có bảng ngành chi tiết | 12 | Không tạo dữ liệu mẫu; hồ sơ vẫn hiển thị trạng thái thiếu dữ liệu. |

Không tìm thấy bản ghi có nhóm ngành khai sẵn để khẳng định “phân loại sai” theo một trường dữ liệu cũ; lỗi đã xác minh là thứ tự hiển thị phụ thuộc thứ tự nhập và không có phân cấp chuẩn. Bốn trường hợp tên/mã khác nhau cần xem thủ công, **không tự coi là sai ngành**: CTU `7480106` “Kỹ thuật máy tính (Thiết kế vi mạch bán dẫn)” so với ngành chuẩn “Kỹ thuật máy tính”; VLU `7229030` “Văn học Ứng dụng”, `7850101` “Quản lý Tài nguyên & Môi trường”, `7810103` “Quản trị Dịch vụ Du lịch & Lữ hành”. Ba mục VLU có thể chỉ là tên chuyên biệt/cách viết.

52 dòng mã chưa đối chiếu tập trung tại Đông Á (40 mã ba chữ số riêng), HCMUS (5), VLU (2), PNT (2), HUAF (2), UMP (1). Không kết luận mã không hợp lệ: có thể là mã chương trình, mã thí điểm hoặc ngành thêm sau bản danh mục 2022. Chi tiết mã và tên ở CSV.

Không có cặp trùng tên *trong cùng một trường* theo tên chuẩn hóa; có 51 nhóm cùng mã ngành chuẩn nhưng nhiều dòng chương trình/cơ sở trong một trường, và 121 tên ngành xuất hiện ở nhiều trường. Đây không phải lý do để gộp bản ghi: dữ liệu tuyển sinh và nguồn theo trường vẫn độc lập.

12 hồ sơ chưa có bảng ngành: `ussh`, `dthu`, `nttu`, `hcmiu`, `nlu`, `huemed`, `smp-udn`, `due`, `husc`, `phuxuan`, `sgu`, `uel`. Cần nhập từ đề án đúng năm/trường/cơ sở; không dùng bản ghi 2026 để khẳng định tuyển sinh 2027.

## Thay đổi giao diện và logic

- Hồ sơ trường: bốn tầng Lĩnh vực → Nhóm ngành → Ngành chuẩn → Chương trình của trường; mặc định theo mã ngành tăng dần trong nhóm, cho phép A–Z trong nhóm. Dòng thiếu/chưa đối chiếu tách riêng và có nhãn.
- Khám phá trường theo ngành: tìm không dấu, viết tắt và một số từ đồng nghĩa; xếp kết quả theo độ khớp chính xác/tên đầu chuỗi/tên chứa từ khóa, rồi mới theo tên trường. Bộ lọc khu vực/trường đã lưu vẫn được áp dụng trước khi xếp hạng.
- Danh mục ngành CMS: bộ lọc khối vẫn áp dụng; từ khóa được xếp theo độ liên quan tại client thay vì chỉ thứ tự tên trên cơ sở dữ liệu. Không dùng dữ liệu giả nếu CMS lỗi.
- Công cụ tính điểm và so sánh trường dùng cùng hàm sắp xếp, nhưng `value`/`data-program` vẫn là chỉ số/mã gốc của dòng tuyển sinh. Công thức và dữ liệu điểm/học phí/tổ hợp không đổi.

## Cần xác minh thủ công trước khi công bố độ chính xác tuyệt đối

1. 176 dòng thiếu mã và 12 trường thiếu bảng ngành: yêu cầu công bố chính thức đúng kỳ, cơ sở, chương trình.
2. 52 mã chưa đối chiếu: kiểm tra quyết định ngành thí điểm/cập nhật mới, và phân biệt mã xét tuyển riêng với mã ngành thống kê; đặc biệt mã ba chữ số của Đông Á.
3. 79 dòng mã có hậu tố và 4 dòng tên khác chuẩn: đối chiếu ngành mẹ với bảng trường trước khi gỡ trạng thái cảnh báo.
4. Chưa có dữ liệu tuyển sinh 2027 cho toàn bộ 35 trường; hệ thống chỉ sẵn cấu trúc để thêm dữ liệu năm mới, không suy diễn 2026 sang 2027.

## Kiểm thử

Đã chạy: `npm test` PASS 122/122; `npm run test:e2e:training-taxonomy` PASS; `npm run test:e2e:admissions` PASS 10/10, bao gồm 34 ca tổ hợp và bốn viewport; `npm run test:e2e:integrated` PASS 17/17; `npm run test:e2e:content` PASS 6/6; `npm run validate` PASS; `npm run audit:product` PASS 18/18. CSV được tái tạo bằng `npm run audit:training-taxonomy` khi dữ liệu nguồn đổi. Kiểm tra browser xác nhận tìm “cntt”, nhóm/bốn tầng, A–Z, không mất dòng và chuyển đúng ngành sang công cụ tính điểm theo chỉ số gốc.

Website tĩnh không có script `build`/`lint` riêng; `validate` kiểm tra cú pháp/link/asset. Chưa kiểm thử quyền admin CMS và chưa đối chiếu thủ công các mã ngoài bản danh mục 2022. Trạng thái triển khai production được xác nhận riêng sau mỗi lần phát hành.
