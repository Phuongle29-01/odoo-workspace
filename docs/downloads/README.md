# Tải mã nguồn để ChatGPT đọc

1. Tải `ODOO_SOURCE_FOR_CHATGPT.txt` về máy.
2. Trong ChatGPT/Codex, bấm nút **đính kèm tệp** rồi chọn file TXT vừa tải. Đừng chỉ dán link GitHub private.
3. Yêu cầu: “Đọc file mã nguồn này, bắt đầu bằng README và docs/CODEX_HANDOFF.md. Giải thích kiến trúc, xác minh trạng thái rồi triển khai theo phạm vi tôi cấp quyền.”
4. Dùng `ODOO_SOURCE_CLEAN.zip` để giải nén thành repository source và triển khai; dependencies cài bằng `npm ci`.

ZIP/TXT chỉ lấy các file Git tracked tại snapshot trong `SOURCE_EXPORT_REVIEW.json`, không chứa Git history, env thật, secret, database hay node_modules. Hostname doanh nghiệp trong bản export đã thay bằng `odoo.example.test`; điền endpoint/credential hợp lệ của bạn trước khi chạy. Giá trị giả của unit tests/fixture được giữ.

Repository private yêu cầu đăng nhập tài khoản có quyền để tải. Sau khi tải lên ChatGPT bằng file đính kèm, ChatGPT đọc nội dung file mà không cần quyền GitHub. File TXT lớn có thể cần hỏi theo đường dẫn/thành phần thay vì yêu cầu AI xuất lại toàn bộ mã cùng lúc.
