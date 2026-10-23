# Triển khai và vận hành

## Tách môi trường

- **Development/test**: `compose.yaml`, database Odoo `workspace_test`, secret sinh riêng, local fixtures. Integration từ chối chạy nếu URL không phải loopback hoặc database khác.
- **Staging**: máy chủ/DB Odoo test được quản trị viên cho phép, URL HTTPS, nhân viên test có quyền khác nhau, secret mới. Không chạy suite local lên staging; dùng checklist thủ công có quyền rõ ràng.
- **Production**: `compose.production.yaml`, `.env.production` không commit, PostgreSQL persistent và Caddy HTTPS. Không có service seed hoặc local Odoo trong cấu hình này.

## Production

1. Có domain trỏ tới máy chủ, mở cổng 80/443 cho reverse proxy; không expose Postgres hoặc app trực tiếp.
2. Tạo `.env.production` (chmod 0600) với APP_DOMAIN, APP_ORIGIN=https://domain, POSTGRES_PASSWORD ngẫu nhiên, DATABASE_URL=postgresql://workspace:...@db:5432/workspace (URL-encode mật khẩu), ENCRYPTION_KEY mới và ODOO_URL/ODOO_DB/ODOO_AUTH_MODE đúng môi trường. Cấu hình source secret qua giải pháp bảo mật server; không commit giá trị.
3. Ban đầu ODOO_WRITE_ENABLED=false. Cookie Secure và ODOO_ALLOW_HTTP=false được Compose production bắt buộc. Cài bridge chỉ sau khi staging, backup và quyền quản trị được xác nhận.
4. Build và chạy:

   ```bash
   docker compose --env-file .env.production -f compose.production.yaml up -d --build
   ```

5. Kiểm tra HTTPS, `/api/health` (DB app), đăng nhập hai nhân viên, trang chẩn đoán API, đọc task/attachment và ACL. Health không tự chứng minh Odoo dùng được.
6. Chỉ bật ghi khi hoàn thành checklist bằng dữ liệu được phép. Người dùng cùng domain truy cập từ nhiều máy với danh tính riêng.

Cấu hình Caddy production được cung cấp nhưng chưa cấp chứng thư/triển khai domain thật trong cloud onboarding. Cần kiểm tra DNS, firewall và TLS ở hạ tầng đích. Cấu hình service restart là `unless-stopped`; production image chạy bằng user node.

## Backup và đổi khóa

Backup PostgreSQL bằng quy trình quản trị (`pg_dump` qua kênh an toàn), backup Odoo theo quy trình riêng; bản backup chứa ciphertext credential phải được bảo vệ. Secret ENCRYPTION_KEY không nằm trong DB, cần vault/backup có kiểm soát. Khi đổi khóa hoặc URL/database: thu hồi toàn bộ session, buộc đăng nhập lại; không cố giải mã bằng khóa sai hoặc copy phiên sang môi trường khác.

Không đăng ký bí mật mật khẩu nhân viên dưới dạng admin chung. API key có thể thay mật khẩu trên từng phiên; app không tạo API key cho nhân viên và không quản lý SSO.

## Giám sát

Log app chỉ có requestId/code/status, không có credential hoặc RPC arguments. Theo dõi 401/403/429/502/504, thời gian search/ORM và tài nguyên PostgreSQL/Odoo. Rate limit login ở PostgreSQL, mỗi session tối đa 180 request/phút; cần thêm kiểm soát egress/load theo tổ chức nếu dùng quy mô lớn. UI polling là gần thời gian thực, không phải bus Discuss.

Schema hiện được tạo idempotent bằng `CREATE TABLE IF NOT EXISTS`; khi nâng cấp cần versioned migrations và tách role migration/runtime trước quy trình release lớn. Bộ Compose production là điểm bắt đầu triển khai, chưa được nghiệm thu trên hạ tầng doanh nghiệp.

## Git và PR

Nhánh làm việc: `feature/odoo17-smart-workspace`. Không force-push/reset/clean. Repository remote ban đầu chưa có nhánh main; PR cần một base branch thực sự và quyền GitHub API. Nội dung PR có sẵn trong `docs/pull-request.md`. Không tuyên bố đã mở PR hoặc CI remote thành công khi API chưa cho phép.
