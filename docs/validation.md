# Kết quả xác minh — 23/10/2026

## Đã chạy thành công

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| `npm ci` với lockfile | Thành công; cache ở `/workspace/.cache/npm` |
| `npm run typecheck` | Thành công |
| `npm test` | 6 passed, 0 skipped |
| `npm run build` | Production build thành công |
| `npm run test:integration` | **24 passed, 0 skipped**, app Docker → XML-RPC Odoo 17 thật + PostgreSQL 16 |
| `npm run test:e2e` | **3 passed**, Chromium: login/search/cha-con/refresh/back, mobile/theme/Ctrl+K, sửa task/gửi Chatter/upload thực |
| Startup development | `npm run dev`, sau đó `npm run test:e2e -- --grep 'login, unaccented'`: 1 passed |
| Script cài lại | `bash scripts/cloud-install.sh` thành công; `.env.local` và nội dung fixture được giữ lại |
| Docker image | `smart-workspace:local` build thành công bằng `python3 scripts/build-cloud-image.py`; build production và toàn bộ 27 integration/browser checks ở trên chạy trên container này |
| Quyền image / secret | Runtime UID 1000; image không có `.env*`; source candidates và browser JS không chứa các secret local đã sinh |
| Health | `/api/health` trả `status=ok`, `database=ok`; readiness còn được xác minh qua nghiệp vụ thật |
| Dependency advisory | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities tại thời điểm kiểm tra |
| Remote Odoo | Public `/xmlrpc/2/common.version` và JSON-RPC version trả `17.0+e-20260908` |

Integration kiểm tra hai UID riêng, login sai, session expiry/logout, CSRF, title/partial/ID/project/unaccented search, tên trùng, task con khác dự án, record rules, đổi toàn bộ field được hỗ trợ, conflict/race, thay đổi trực tiếp từ Odoo, comment/note đúng subtype, file roundtrip/IDOR, subtask/idempotency, thu hồi quyền và loại bookmark, notification/read/deep link, Discuss membership/read/send/search/message deep link, unknown mutation và timeout/recover. Timeout được tạo bằng pause/unpause container **local**; không thực hiện với máy chủ doanh nghiệp.

## Các lỗi môi trường đã xử lý

- npm mặc định không ghi được cache trong home read-only: chuyển cache vào `/workspace/.cache/npm`.
- Bind mount addon không đọc được vì umask cloud: cấp quyền đọc/traverse cho source addon và file seed; secret vẫn 0600.
- Odoo 17 XML-RPC trả faultCode 3/4 thay vì tên exception trong message: sửa adapter để giữ đúng 403; conflict code 2 được nhận diện riêng.
- `message_unsubscribe` trong fixture có thể trả None không serialize qua XML-RPC: test thu hồi follower bằng ORM write, gỡ cả quyền theo dự án và task.
- BuildKit không phân giải được mạng registry (`EAI_AGAIN`), trong khi npm host dùng được proxy. Build cloud bind cache npm qua named build context rồi `npm ci --offline`; integrity của lockfile vẫn được kiểm tra. Không tắt TLS/chữ ký/checksum.
- Cache các lần build gây đầy ổ đĩa: dọn cache build do tác vụ tạo, chuyển cache npm sang bind mount để giảm sao chép. Giữ nguyên volume DB/Odoo, source và tagged image.

## Chưa xác minh

Chưa đăng nhập hoặc đọc/ghi nghiệp vụ trên `tabvietnam.vuahethong.com`: thiếu tên database, xác nhận production/staging và danh tính test hợp lệ. Chưa chạy CI trên GitHub, triển khai domain HTTPS production, kiểm tra trên hai máy vật lý hoặc phục hồi trong một cloud task mới. Các trạng thái này độc lập với việc local app đã chạy và cấu hình đã lưu.

Giới hạn chức năng, chỉ mục/tải tìm kiếm và checklist staging nằm trong [acceptance.md](acceptance.md); không xem public version response là integration test của doanh nghiệp.
