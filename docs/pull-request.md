# Odoo 17 Smart Workspace: tìm kiếm bàn phím và giao diện nhiệm vụ responsive

Bổ sung ứng dụng Next.js tiếng Việt để mỗi nhân viên đăng nhập bằng danh tính Odoo riêng, tìm nhiệm vụ bằng đoạn tiêu đề/tiếng Việt không dấu, phân biệt tên trùng theo dự án và mở task với breadcrumb cha/con xuyên dự án. Dữ liệu dự án, task, Chatter, Discuss và file đi qua XML-RPC Odoo 17; PostgreSQL chỉ giữ phiên mã hóa, metadata chống gửi trùng, lịch sử/đánh dấu và tùy chọn giao diện theo instance/UID.

Giao diện dùng Inter tự host, token Indigo và Lucide. Ctrl/Cmd+K có gợi ý, ↑/↓/Enter, highlight và bộ lọc URL. Dashboard có số đếm ORM dẫn tới dữ liệu thật; Task có ba vùng đổi kích thước/thu gọn, chuyển hai vùng hoặc tabs trên laptop/mobile. Editor tải khi mở, giữ draft và revision gốc; menu có focus trap, banner ngoại tuyến/kết nối lại và thông báo thao tác. Notification lọc trạng thái/đối tượng/subtype Odoo, deep link đúng task/comment/channel.

Ghi task cần addon bridge kiểm tra revision nguyên tử; có chế độ chỉ đọc, CSRF, HTML sanitization, ACL đối tượng/file và idempotency. Hai nhân viên được kiểm tra nhận/gửi thông báo, cập nhật qua polling và từ chối bản sửa lỗi thời. Chưa có realtime bus, SSO, kéo thả Kanban, quản lý thành viên/tệp/unread Discuss; các thao tác này dẫn sang Odoo gốc khi có hỗ trợ.

Validation và hướng dẫn sử dụng:

- [Kết quả kiểm thử](docs/validation.md): typecheck/build, unit, real Odoo/Postgres integration và browser suites; CI chạy trên checkout mới và lưu artifact.
- [Rà soát UX, ảnh 7 màn hình × 3 viewport và tự kiểm thử A–H](docs/ux-review.md). Chuẩn ảnh được cố định browser/font/locale/timezone/fixture; CI không tự cập nhật baseline.
- [Số đo production local](docs/performance.md): Dashboard trung vị 400ms, Task 868ms, tìm kiếm theo URL 298ms; thí nghiệm 0/100/500/1100 task cho thấy giới hạn quét 1000/lượt và continuation. Không coi là SLA doanh nghiệp.
- [Chạy local/Docker](README.md), [staging và triển khai nhiều nhân viên](docs/deployment.md).

Máy chủ người dùng phản hồi public version Odoo 17 Enterprise; chưa có database, xác nhận staging và danh tính test để nghiệm thu nghiệp vụ doanh nghiệp. Không ghi thử production. Không đưa secret, volume, credential hoặc mock runtime vào mã sản phẩm; nhánh main được giữ nguyên.
