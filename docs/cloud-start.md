# Khởi động Odoo Smart Workspace trong cloud

Mỗi cloud task đã có môi trường cô lập. Dùng checkout hiện có tại `/workspace/odoo-workspace`; không tạo Git worktree trừ khi người dùng yêu cầu rõ ràng. Đọc AGENTS.md và tài liệu Next.js đi kèm trước khi sửa code. Giữ nguyên thay đổi của người dùng, không reset/clean, không ghi đè `.env.local` hoặc cấu hình đã được inject; không in secret.

Các dependency và build output đã được cài/snapshot không thay thế tiến trình dịch vụ. PostgreSQL, Odoo local và dev server phải được khởi động lại khi task mới cần chúng. Không coi PID/cổng mở là bằng chứng nghiệp vụ chạy được.

Quy trình local mặc định, đã được kiểm thử:

```bash
cd /workspace/odoo-workspace
export npm_config_cache=/workspace/.cache/npm
export NEXT_TELEMETRY_DISABLED=1
chmod -R a+rX addons
chmod a+r scripts/seed-odoo.py
docker compose --env-file .env.local --profile local up -d --wait db odoo
npm run local:seed
npm run db:migrate
# Chỉ dừng app container thuộc stack này để giải phóng cổng cho dev server.
docker compose --env-file .env.local --profile app stop app
npm run dev
```

Giữ dev server trong terminal chạy lâu dài. Từ terminal khác, kiểm tra `/api/health` phải trả `status=ok,database=ok`, rồi:

```bash
cd /workspace/odoo-workspace
npm run test:e2e -- --grep 'login, unaccented'
```

Kiểm tra này đăng nhập tài khoản test local, tìm nhiệm vụ không dấu, mở cha/con khác dự án, refresh/back rồi logout. Không in giá trị LOCAL_TEST_PASSWORD_A/B. Chromium sẵn ở `/usr/bin/chromium`; nếu môi trường khác thì dùng browser được cài hợp lệ theo README. Không tạo preview/link localhost trong giao diện onboarding; chỉ báo kết quả bằng văn bản.

Nếu `.env.local` chưa có, chạy `bash scripts/cloud-install.sh` để chuẩn bị local một lần. Nếu dependency bị thiếu hoặc lockfile thay đổi, dùng `npm ci`, không tự sửa lockfile. Để kiểm tra production build dùng `npm run build` rồi `npm start`; trước đó chỉ dừng dev server do mình khởi động. Để chạy image đã chuẩn bị, dừng dev server do mình khởi động rồi `docker compose --env-file .env.local --profile app --profile local up -d --no-build app` và kiểm tra nghiệp vụ lại.

Nếu quản trị viên đã chuyển sang Odoo từ xa, giữ nguyên URL/database/secret đang cấu hình; chỉ khởi động database bổ trợ cần thiết, bỏ seed/local Odoo và không chạy suite ghi vào production. `test:integration`/browser suite bị khóa vào local `workspace_test`; không bỏ guard. Chỉ bật ODOO_WRITE_ENABLED sau khi người dùng xác nhận đúng môi trường và quyền ghi.

Khi cần full validation trên local, chạy tuần tự typecheck → unit → build/start → integration → browser. Integration pause/unpause container Odoo local để kiểm tra timeout; không chạy song song với browser suite. Tình trạng nghiệm thu doanh nghiệp và giới hạn ở docs/acceptance.md. Publish/snapshot mới và phục hồi trên task mới phải được xác minh riêng.
