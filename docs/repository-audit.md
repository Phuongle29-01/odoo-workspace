# Khảo sát repository

Ngày: 23/10/2026. Repository: `Phuongle29-01/odoo-workspace`.

## Trạng thái ban đầu

- Checkout `/workspace/odoo-workspace`, nhánh symbolic `work`, chưa có commit.
- `git status --short` trống. Không có thay đổi hoặc tệp người dùng cần di chuyển.
- Origin HTTPS GitHub đúng repository. `git ls-remote` thành công nhưng không có ref; `main` chưa tồn tại.
- Chưa có README, manifest, frontend/backend, ORM, migration, Docker, CI hay tests.
- Đã tạo nhánh unborn `feature/odoo17-smart-workspace`, giữ nguyên origin, không reset/clean/xóa lịch sử hoặc tạo worktree.

## Kiến trúc được chọn

Next.js 16 + React 19 + TypeScript, TanStack Query, CSS responsive, Lucide; Node XML-RPC adapter Odoo 17; PostgreSQL 16 chỉ lưu phiên mã hóa, metadata yêu cầu, đánh dấu/gần đây. Không tạo bản sao hệ thống nhiệm vụ.

Tailwind, shadcn, Redis và chỉ mục tìm kiếm riêng chưa cần cho MVP. Không có dependency hoặc lockfile cũ để thay thế.

## Nhu cầu và rủi ro

- Máy chủ người dùng `https://tabvietnam.vuahethong.com` trả phiên bản `17.0+e-20260908` qua public common.version. Hosting, database, quyền External API và trường `x_` chưa được xác minh bằng tài khoản.
- URL giao diện `/web#action=107...` không cung cấp database. Không suy đoán hosting hoặc dùng API JSON-2.
- Record rules phải áp dụng trên từng lời gọi bằng UID và thông tin xác thực riêng của nhân viên; không dùng admin thay người dùng.
- Odoo Online có thể không cho addon và có giới hạn gói External API. Sửa đồng thời an toàn cần addon bridge; khi thiếu bridge, khóa sửa trực tiếp và cung cấp liên kết Odoo gốc.
- Search không dấu quét ORM trực tiếp có giới hạn 1.000 bản ghi mỗi lượt, có con trỏ tìm tiếp; cần đo tải thực tế trước khi mở rộng quy mô.
- Chatter dùng public `message_post`; Discuss/notification có thể bị ACL hoặc thiếu public API. Không giả lập chat production.
- Chỉ database local `workspace_test` được seed/test ghi. Không chạy acceptance suite trên production.

## Chiến lược

Xây adapter/auth trước; điều hướng/search tiếp theo; kiểm thử ghi/đính kèm/chatter với hai tài khoản trên Odoo local thật. Giữ mọi secret trong `.env.local` bị Git bỏ qua. Tách Compose production và thêm checklist staging trước khi dùng dữ liệu doanh nghiệp. Chi tiết phạm vi nghiệm thu ở `docs/acceptance.md`.
