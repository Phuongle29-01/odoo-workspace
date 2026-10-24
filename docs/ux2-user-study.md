# Nghiệm thu UX2 với ba nhân viên — chưa thực hiện

Trạng thái **NOT STARTED**. Không có số đo, điểm UX hoặc phát biểu của nhân viên được suy diễn từ automation. Dùng staging được ủy quyền, tài liệu thử không chứa bí mật; không chạy seed/mutation suite vào production.

Chuẩn bị ba người: NV1 phụ trách task chung và project A; NV2 làm task chung nhưng không được xem project mật; NV3 người đọc/điều phối với quyền thực tế khác. Quản trị viên ghi lại ma trận quyền đã xác nhận, thiết bị/browser, DB staging, phiên bản app và addon. Nhập credential qua UI/secret manager, không ghi vào phiếu.

Mỗi người làm hai lượt trên bản trước và UX2 cùng bộ task tương đương (đổi thứ tự giữa người thử để giảm hiệu ứng học). Người hướng dẫn đọc yêu cầu, không chỉ nơi nhấp. Bắt đầu đồng hồ khi đọc xong; kết thúc khi người thử xác nhận đúng kết quả. Người quan sát đếm click/phím kích hoạt, nhấp sai, quay về Odoo gốc; không ghi nội dung nhạy cảm.

1. Tìm một nhiệm vụ bằng nửa tiêu đề không dấu, phân biệt tên trùng giữa hai dự án. Nếu chưa quét hết, người thử cần hiểu trạng thái và tìm tiếp.
2. Mở task được giao, xác định dự án hiện tại, giai đoạn, trạng thái, deadline và nhiệm vụ cha (có trường hợp khác dự án).
3. Chuyển Focus/toàn bộ bối cảnh, thu gọn/mở cây; mở một con, browser Back và refresh; kiểm tra bộ lọc tìm kiếm.
4. Xem PDF/ảnh trong nhiệm vụ, tải xuống và đóng để tiếp tục đúng tab. File không hỗ trợ phải có thông báo rõ ràng.
5. Trả lời một bình luận; ngắt mạng trước gửi để kiểm tra lỗi/draft, nối mạng và chủ động gửi lại. Không coi timeout là thành công.
6. Quay về đầu mục công việc; lọc Cần xử lý/dự án/ngày, tải trang thông báo cũ, mở đúng message rồi đánh dấu đã đọc.
7. Tìm lịch sử Discuss, mở message liên kết, thử draft; ghi lại trường hợp phải về Odoo gốc.

Lượt phối hợp NV1/NV2: cùng mở một task, cùng sửa. Một người lưu trước; người sau phải thấy conflict, không mất draft. Kiểm tra comment hiển thị sau polling, phiên độc lập, NV2 không đọc được task/file mật sau khi thu hồi quyền. Kiểm tra qua hai context và ít nhất hai thiết bị nếu có, desktop và mobile 390×844. Firefox và Safari thật ghi phiên bản cụ thể, không suy ra từ Chromium/WebKit.

| Nhân viên | Lượt trước/sau | Tác vụ | Hoàn thành đúng? | Thời gian (s) | Thao tác | Nhấp sai | Về Odoo gốc | Nhận xét nguyên văn |
|---|---|---|---|---|---|---|---|---|
| NV1 | | | | | | | | |
| NV2 | | | | | | | | |
| NV3 | | | | | | | | |

Sao chép dòng cho từng tác vụ/lượt. Chỉ tổng hợp sau khi đủ dữ liệu thật: tỷ lệ hoàn thành, trung vị thời gian, số thao tác/nhấp sai/về Odoo. Ghi cả trường hợp thất bại và giúp đỡ, không bỏ mẫu để tăng điểm. Hỏi người thử tự đánh giá dễ sử dụng và nêu chỗ gây nhầm, giữ nguyên câu trả lời. Tiêu chí bắt buộc: không lộ quyền, không ghi đè revision cũ, không báo gửi thành công giả, draft được giữ khi lỗi. Các tiêu chí thời gian cần thống nhất với nhóm trước thử, không đặt mục tiêu sau khi xem kết quả.
