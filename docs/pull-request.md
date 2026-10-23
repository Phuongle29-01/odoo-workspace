# Odoo 17 Smart Workspace: tìm kiếm và điều hướng nhiệm vụ theo quyền

Repository ban đầu trống. Thay đổi bổ sung ứng dụng Next.js tiếng Việt để nhân viên đăng nhập bằng danh tính Odoo riêng, tìm nhiệm vụ bằng đoạn tiêu đề/tiếng Việt không dấu và mở đúng task với ngữ cảnh dự án/cha/con. Task, Chatter và attachment được đọc/ghi trực tiếp bằng XML-RPC Odoo 17; PostgreSQL chỉ giữ session mã hóa và metadata phụ trợ.

Sửa task yêu cầu addon bridge để kiểm tra revision nguyên tử, tránh ghi đè khi nhiều người cùng sửa. Có chế độ chỉ đọc, chống CSRF, sanitization, đối chiếu attachment và idempotency cho thao tác tạo. Discuss đọc/gửi/search vào các hội thoại đã tham gia khi API cho phép; notification deep link đúng task/comment hoặc channel, tái kiểm tra ACL. Phần tạo/join kênh và tệp Discuss dùng Odoo gốc.

Validation thực tế và phần chưa nghiệm thu được ghi ở `docs/validation.md` và `docs/acceptance.md`. Không có secret, volume hoặc credential được đưa vào source. Không sửa dữ liệu máy chủ doanh nghiệp; public version của URL người dùng xác nhận Odoo 17 Enterprise, còn thiếu database/staging account để nghiệm thu.

Docker development/production, CI và hướng dẫn Việt ngữ nằm trong README. Workflow CI remote và triển khai HTTPS doanh nghiệp cần được chạy độc lập sau khi repository và hạ tầng sẵn sàng.

Đã kiểm thử: typecheck và production build; 6 unit, 24 integration với Odoo 17/PostgreSQL thật, 3 browser checks. GitHub Actions run 39967007750 đã success trên checkout mới ở commit 4a3360e. Startup development cũng đã qua kiểm tra đăng nhập/tìm kiếm/điều hướng.
