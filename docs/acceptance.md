# Trạng thái nghiệm thu

`DONE` nghĩa là đã chạy kiểm thử phạm vi được ghi rõ. **Local Odoo thật không phải xác nhận instance doanh nghiệp.** Không có mock runtime hoặc dữ liệu demo dùng thay lỗi Odoo.

| Hạng mục | Trạng thái | Phạm vi |
| --- | --- | --- |
| Khảo sát, adapter XML-RPC, version/auth/metadata | DONE (local) | Odoo 17 thật; remote chỉ xác minh phiên bản public |
| Session cá nhân, expiry/logout, credential AES-GCM, CSRF | DONE (local) | Hai UID riêng và PostgreSQL; chưa pentest độc lập |
| Search một từ/đoạn/ID/dự án/không dấu, tên trùng | DONE (local) | Per-user live ORM, continuation rõ ràng; chưa load-test dữ liệu lớn |
| Projects, task list/Kanban/cây, breadcrumb cha/con | DONE (local) | E2E trực tiếp, cha/con khác dự án, refresh/back; cây theo trang hiện tại |
| Edit, state/stage/assignee/deadline/priority | DONE (local) | Roundtrip mọi field và concurrent update qua atomic bridge; remote cần cài bridge và nghiệm thu riêng |
| Tạo subtask | DONE (local) | Tạo Odoo record thật, kiểm tra parent và chống replay cùng key |
| Attachment upload/download/quyền | DONE (local) | Tệp <=5 MB, đối chiếu task/attachment và hai tài khoản; chưa preview/chỉnh sửa trực tuyến |
| Chatter | DONE (local) | Đọc/gửi bình luận và internal note thật, đúng subtype và idempotency; chưa @mention/reply threading |
| Notification Center | PARTIAL | Đã kiểm thử notification task/comment thật, deep link và đánh dấu đọc đúng chủ sở hữu; chưa bảo đảm mọi loại event của doanh nghiệp |
| Discuss riêng/kênh | PARTIAL | Đã kiểm thử đọc/gửi/search/deep link ở group thật, chặn kênh ngoài quyền, chống replay; list hội thoại đã tham gia. Chưa tạo/join, tệp và unread; dùng Odoo gốc cho các phần này |
| Polling app ↔ Odoo, conflict, ACL revocation, timeout | DONE (local) | 30s polling + refocus; direct Odoo edit, đồng thời, thu hồi quyền và local pause/recover; chưa realtime bus/offline queue |
| Responsive/dark/light/Ctrl+K | DONE (local browser) | Chromium desktop/mobile; chưa kiểm tra nhiều trình duyệt/thiết bị vật lý |
| Docker build và app runtime | Xem validation.md | Kết quả thực tế được ghi sau khi chạy |
| GitHub Actions | PARTIAL | Workflow đã viết, chưa chạy trên GitHub |
| Production/multi-machine/SSO | BLOCKED / NOT STARTED | Cần DB, môi trường staging, tài khoản test và hạ tầng HTTPS; SSO chưa cấu hình |
| Milestone/đầu mục/model x_ của doanh nghiệp | BLOCKED | Cần xác minh metadata và quy ước doanh nghiệp |

## Checklist staging được quản trị viên cho phép

- [ ] Xác nhận hosting/gói External API, database và URL HTTPS chính xác; có backup, không dùng production làm test tự động.
- [ ] Hai nhân viên có vùng dữ liệu khác nhau; login đúng/sai, hết hạn, logout và thu hồi API key.
- [ ] Search đoạn tiêu đề/không dấu/trùng tên/ID/cross-project; thử đủ các trang tìm tiếp; không lộ task vừa bị thu hồi quyền.
- [ ] Search → Task → Parent/Project/Stage; notification → comment; refresh/back/forward, task thiếu cha có quyền riêng.
- [ ] Bridge hoặc fallback Odoo gốc; test từng state/stage thật, assignee, deadline, description, priority và hai người sửa cùng lúc.
- [ ] Subtask, download/upload, sai attachment ID, không tải được file task ngoài quyền; kiểm tra giới hạn tệp.
- [ ] Chatter bình luận/note, phân biệt người gửi, nội dung HTML, tệp và quyền note; không thử @mention khi chưa có hỗ trợ.
- [ ] Seed notification bằng sự kiện Odoo hợp lệ; unread/read và deep link bình luận. Xác nhận Discuss mở đúng app gốc; kiểm tra deep link Discuss đúng hội thoại/tin nhắn, không gán vào nhiệm vụ.
- [ ] Sửa Odoo gốc → refocus/poll UI; sửa app → kiểm tra Odoo; timeout khi ghi có kết quả không rõ, không retry mù.
- [ ] Hai máy vật lý, hai phiên, domain HTTPS/cookie Secure, proxy/backup/restore; đo tải search trên dữ liệu thực tế.

Chưa chạy checklist này trên `tabvietnam.vuahethong.com`; không đánh dấu tất cả tính năng DONE cho hệ thống doanh nghiệp.
