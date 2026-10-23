# Odoo Smart Workspace

Web app tiếng Việt kết nối **Odoo 17** bằng XML-RPC. Odoo giữ toàn bộ dữ liệu dự án/nhiệm vụ; PostgreSQL bổ trợ chỉ lưu phiên mã hóa, metadata chống gửi trùng, đánh dấu và lịch sử truy cập và tùy chọn giao diện riêng theo tài khoản.

Bản giao diện mới: [ảnh trước/sau, tự kiểm thử A–H và giới hạn](docs/ux-review.md), [số đo hiệu năng](docs/performance.md), [kết quả xác minh](docs/validation.md).

Đã có đăng nhập cá nhân, tìm kiếm toàn cục không dấu, breadcrumb cha/con khác dự án, danh sách/Kanban/cây, chỉnh sửa nguyên tử qua addon, tạo nhiệm vụ con, Chatter và tệp đính kèm. Xem phạm vi và giới hạn ở [nghiệm thu](docs/acceptance.md), [kiến trúc](docs/architecture.md), [khảo sát repository](docs/repository-audit.md).

## Chạy development với Odoo local riêng

Yêu cầu: Node.js 24 (hoặc >=22.13), npm, Python 3, Docker Engine và Compose v2; khoảng 3 GB dung lượng image. Không cần tài khoản Odoo doanh nghiệp để chạy local.

```bash
git clone https://github.com/Phuongle29-01/odoo-workspace.git
cd odoo-workspace
git switch feature/odoo17-smart-workspace
npm ci
npm run local:prepare
docker compose --env-file .env.local --profile local up -d --wait db odoo
npm run local:seed
npm run db:migrate
npm run dev
```

`local:prepare` sinh secret ngẫu nhiên trong `.env.local` (quyền 0600), không ghi đè file đã tồn tại và không in giá trị. Không commit file này. Seed chỉ chạy bên trong container và chỉ vào database local cố định `workspace_test`. Dự án, nhiệm vụ con khác dự án và nhiệm vụ riêng được tạo một lần; chạy seed lại giữ nội dung đã có.

Đăng nhập local bằng `workspace.a@example.test` hoặc `workspace.b@example.test`. Mật khẩu tương ứng nằm trong `.env.local` tại `LOCAL_TEST_PASSWORD_A/B`; mở file trực tiếp trong môi trường phát triển, không gửi lên chat/log/Git. Đây là tài khoản local tự sinh, không dùng trên máy chủ doanh nghiệp.

Postgres và Odoo local chỉ bind loopback, cổng lần lượt 5433 và 8069. Nếu Docker tạo thư mục thay cho file seed, kiểm tra file `scripts/seed-odoo.py` tồn tại trước khi chạy Compose. Trên cloud có umask hạn chế, cấp quyền đọc cho bind mount bằng `chmod -R a+rX addons` và `chmod a+r scripts/seed-odoo.py`; không cấp quyền đọc cho `.env.local`.

## Kết nối Odoo 17 hiện có

Tạo cấu hình riêng từ `.env.example`; không ghi đè `.env.local` đang dùng nếu còn cần dữ liệu local. Quản trị viên đặt:

- `ODOO_URL`: URL gốc HTTPS, ví dụ `https://tabvietnam.vuahethong.com`; bỏ `/web#action=...`.
- `ODOO_PUBLIC_URL`: URL Odoo mà trình duyệt mở được; mặc định bằng ODOO_URL. Dùng khi backend Docker gọi tên service nội bộ nhưng trình duyệt cần domain/cổng công khai.
- `ODOO_DB`: tên database chính xác do quản trị viên cung cấp. URL giao diện không xác định database.
- `ODOO_HOSTING`: `unknown`, `online`, `odoo_sh` hoặc `self_hosted`; chỉ là metadata, không suy luận từ domain.
- `ODOO_AUTH_MODE`: `password` hoặc `api_key`. Nhân viên dùng thông tin riêng qua màn hình đăng nhập; API key là phương án thay mật khẩu trong External API, không phải mật khẩu web Odoo.
- `DATABASE_URL`: PostgreSQL bổ trợ của ứng dụng.
- `ENCRYPTION_KEY`: 32 byte ở dạng 64 ký tự hex, sinh qua công cụ quản lý secret hoặc `openssl rand -hex 32` trong nơi an toàn. Không đưa vào source/log/chat.
- `APP_ORIGIN`: đúng origin của web app, không có dấu `/` cuối, ví dụ `https://workspace.example.vn`.
- `ODOO_WRITE_ENABLED=false`: giữ chỉ đọc cho đến khi xác nhận môi trường và quyền ghi.
- `ODOO_ALLOW_HTTP=false`, `SESSION_COOKIE_SECURE=true` khi dùng HTTPS.

Mỗi nhân viên nhập username/password hoặc API key cá nhân. Không cần nhập URL/database mỗi lần. Không dùng tài khoản admin chung. Odoo Online yêu cầu gói hỗ trợ External API và có thể cần thiết lập local password/API key theo chính sách quản trị; không vượt giới hạn gói. SSO chưa được triển khai.

```bash
npm run check:odoo
npm run db:migrate
npm run build
npm start
```

`check:odoo` chỉ kiểm tra phiên bản public; đăng nhập và trang **Cài đặt kết nối → Kiểm tra khả năng API** kiểm tra quyền thật của tài khoản hiện tại. Trường tùy chỉnh `x_` được liệt kê theo metadata nhưng chưa có mapping nghiệp vụ tự động. Cần làm rõ “đầu mục công việc” với doanh nghiệp trước khi coi đó là task cha, milestone hay model tùy chỉnh.

Máy chủ người dùng đã phản hồi Odoo `17.0+e-20260908`; chưa xác minh database/đăng nhập/quyền nghiệp vụ của máy chủ này. Mọi kiểm thử ghi trong repository bị khóa cứng vào local `workspace_test`.

## Chỉnh sửa đồng thời và addon bridge

Copy `addons/smart_workspace_bridge` vào addons path của Odoo **staging**, cập nhật danh sách module rồi cài module này theo quy trình quản trị Odoo.sh/self-hosted. Addon chỉ bổ sung revision và phương thức atomic `workspace_write`, không thêm nguồn dữ liệu task khác. Backup trước khi cài lên môi trường nghiệp vụ. Không cài lên production trong quá trình onboarding này.

Ứng dụng tự kiểm tra `workspace_revision` qua `fields_get`. Nếu thiếu addon, nút sửa trực tiếp bị khóa và người dùng có thể mở task trong Odoo gốc. Đọc/tìm kiếm/chatter/tạo subtask/file vẫn tùy quyền và cờ ghi. Odoo Online không cài addon tùy chỉnh nên có giới hạn này.

## Kiểm thử

Khởi động local Odoo và app trước. Chạy tuần tự, vì integration có tạm pause container local để kiểm tra timeout:

```bash
npm run typecheck
npm test
npm run build
# Ở terminal riêng: npm start
npm run test:integration
npm run test:e2e
```

Cài đúng Chromium đi kèm lockfile bằng `npx playwright install chromium` (Linux thiếu thư viện hệ thống: `npx playwright install --with-deps chromium`). Cloud dùng `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright`; config tự nhận cache này khi tồn tại. Không thay browser hệ thống trong suite visual.

`npm run test:ui` chạy mock browser + accessibility, `npm run test:visual` so sánh 21 chuẩn ảnh cho OS đang chạy (Debian 13 hoặc Ubuntu 24.04), `npm run test:e2e -- --project=odoo` chỉ chạy browser/Odoo thật. `npm run test:e2e` chạy cả ba nhóm. Mock chỉ chặn request trong Playwright; API lạ trong fixture trả 501. HTML report ở `playwright-report/`, screenshot/diagnostics/trace ở `test-results/`; CI upload artifact trong 14 ngày. Không cập nhật chuẩn ảnh khi lỗi chưa được giải thích.

Sau khi dừng các suite khác, dùng production `npm start` và `npm run measure:performance` để đo local thực, tạo dữ liệu riêng 0/100/500/1100 task và dọn trong `finally`. Không chạy công cụ này lên production/staging doanh nghiệp; có guard local `workspace_test`.

Integration thực sự gọi app → XML-RPC → Odoo 17 + PostgreSQL: hai tài khoản, ACL, tìm kiếm, cập nhật đồng thời, thu hồi quyền, upload/download, chatter/idempotency, timeout/reconnect, expiry/logout. Không thay integration bằng mock. Tài khoản admin chỉ dùng seed/thu hồi quyền fixture trong database local; runtime không dùng tài khoản này.

## Docker development

```bash
docker compose --env-file .env.local --profile local up -d --wait db odoo
npm run local:seed
# Dừng npm dev/start nếu đang chiếm cổng 3000.
docker compose --env-file .env.local --profile app --profile local up -d --build app
```

File được sinh mới có `DOCKER_ODOO_URL=http://odoo:8069`. Nếu dùng cấu hình cũ, thêm biến này khi sử dụng Odoo local trong Docker và đặt `ODOO_PUBLIC_URL=http://127.0.0.1:8069`; với Odoo từ xa, đặt các URL này bằng địa chỉ HTTPS phù hợp. Dockerfile chạy non-root, không copy `.env*` vào image. Image dùng lockfile và build production. Trong cloud có DNS BuildKit bị cô lập, chạy `python3 scripts/build-cloud-image.py` sau `npm ci` với `npm_config_cache=/workspace/.cache/npm`, rồi dùng `up -d --no-build app`: helper tái sử dụng cache npm đã kiểm tra integrity bằng `npm ci --offline`, không bỏ kiểm tra checksum/TLS. Cấu hình build online hỗ trợ CA bổ sung qua BuildKit secret `build_ca`, không ghi chứng thư hoặc proxy credential vào image.

`docker compose --env-file .env.local --profile app --profile local down` dừng stack, giữ volume. Không dùng `down -v` trừ khi bạn chủ đích xóa toàn bộ dữ liệu local.

## Triển khai tập trung cho nhiều máy

Xem [hướng dẫn triển khai](docs/deployment.md). Nhân viên chỉ truy cập domain app qua trình duyệt, mỗi người dùng tài khoản Odoo riêng; không cần clone repository trên từng máy. Dùng PostgreSQL chung nếu chạy nhiều app instance; session và idempotency không phụ thuộc bộ nhớ một process. Polling mặc định 30 giây, chưa đảm bảo realtime tuyệt đối.

## Xử lý lỗi

- 401: phiên hết hạn/đã logout hoặc đăng nhập sai; đăng nhập lại.
- 403: quyền Odoo, Origin không đúng hoặc chế độ chỉ đọc. Đừng dùng admin để vượt quyền; kiểm tra APP_ORIGIN/HTTPS và record rules.
- 409 conflict: dữ liệu đã đổi; giữ nội dung cần lưu, tải lại và so sánh. RESULT_UNKNOWN: kiểm tra dữ liệu Odoo trước khi tạo yêu cầu mới, không tự gửi lại hàng loạt.
- 502/504: kiểm tra URL, proxy/allowlist, TLS và Odoo. Tên miền API phải được cho phép trong môi trường cloud; phiên bản public thành công không chứng minh quyền authenticate/execute_kw.
- Không có thông báo qua API: xem kết quả chẩn đoán `mail.notification` rồi dùng Odoo gốc; không thay bằng dữ liệu giả. Discuss đọc/gửi được vào các hội thoại đã tham gia khi API cho phép; tạo hội thoại, thành viên và tệp Discuss vẫn quản lý trong Odoo gốc.
- Không thấy nhiệm vụ trong lượt tìm đầu: bấm **Tìm tiếp**, mỗi lượt quét tối đa 1.000 bản ghi theo quyền. Với dữ liệu lớn cần đo và thiết kế index kiểm tra lại ACL.

## Fork/clone sang tài khoản khác

GitHub API đã xác nhận repository này là **private**. Chỉ fork hoặc tạo bản sao khi được chủ sở hữu và chính sách tổ chức cho phép. Không thay visibility hoặc chia sẻ mã nguồn/dữ liệu ra ngoài phạm vi được cấp quyền.

Sau khi fork được phép: clone URL của bản fork; kiểm tra `git remote -v` trên máy riêng (không đưa URL chứa credential vào log), đặt `origin` tới bản fork và tùy chọn `upstream` tới repository gốc. Chọn nhánh tính năng, chạy `npm ci` và `npm run local:prepare`, dựng Odoo test riêng rồi thực hiện các bước local ở trên. Khi triển khai server mới, sinh secret mới và cấu hình Odoo staging riêng. Không copy `.env.local`, volume Odoo/Postgres, dữ liệu hoặc secret production sang repository/tài khoản mới.

CI GitHub Actions nằm trong `.github/workflows/ci.yml`; [run đầu tiên đã thành công](https://github.com/Phuongle29-01/odoo-workspace/actions/runs/39967007750) trên checkout mới. Xem trạng thái commit hiện tại trong [draft PR #1](https://github.com/Phuongle29-01/odoo-workspace/pull/1).
