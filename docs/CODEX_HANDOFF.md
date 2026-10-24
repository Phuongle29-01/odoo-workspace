# Bàn giao Odoo Smart Workspace cho Codex triển khai

> Cập nhật UX 2.0 (24/10/2026): xem [báo cáo và trạng thái kiểm thử](ux2-report.md). Các kết quả 76 tests/hiệu năng và giới hạn chưa có preview/index bên dưới là lịch sử bản trước.

**Ngày soạn:** 24/10/2026 — múi giờ Asia/Saigon.  
**Ngôn ngữ làm việc:** tiếng Việt.  
**Mục đích:** tài liệu độc lập để một Codex khác hiểu đúng sản phẩm, lấy đúng mã nguồn, chạy kiểm thử và triển khai theo phạm vi được chủ sở hữu cho phép. Tài liệu không chứa mật khẩu, API key hoặc khóa mã hóa.

> Hãy đọc toàn bộ phần trạng thái, cấu hình và giới hạn trước khi thao tác. Các kết quả đã kiểm thử gắn với commit dưới đây; không xem chúng là bằng chứng cho mã mới hoặc cho máy chủ doanh nghiệp chưa được nghiệm thu.

## 1. Sản phẩm này là gì?

Odoo Smart Workspace là web app tiếng Việt cho nhân viên làm việc với **Odoo 17** qua một giao diện tìm kiếm, điều hướng và trao đổi công việc thuận tiện hơn.

Nhân viên đăng nhập bằng tài khoản Odoo hoặc API key **cá nhân**. Ứng dụng gọi Odoo bằng UID/quyền của chính nhân viên đó. Dự án, nhiệm vụ, giai đoạn, trạng thái, quan hệ cha/con, Chatter và file nghiệp vụ vẫn nằm trong Odoo.

“Smart” hiện chỉ các tính năng tìm kiếm/điều hướng/UX. Chưa có tích hợp LLM, AI tự sửa công việc hoặc API OpenAI. Không tự suy rằng đây là một hệ thống AI agent đã hoàn thiện.

Đây là ứng dụng web tập trung: triển khai một app dùng chung qua HTTPS, nhân viên mở bằng trình duyệt. Không cần cài repository trên từng máy nhân viên.

## 2. Lấy đúng mã nguồn và hiểu đúng trạng thái GitHub

| Mục                            | Giá trị tại thời điểm bàn giao                                           |
| ------------------------------ | ------------------------------------------------------------------------ |
| Repository                     | https://github.com/Phuongle29-01/odoo-workspace                          |
| Quyền truy cập                 | Private; Codex mới phải có quyền của chủ sở hữu hoặc tổ chức             |
| Nhánh có ứng dụng hoàn chỉnh   | `feature/odoo17-smart-workspace`                                         |
| Commit chuẩn đã xác minh       | `afe5bb9fb56c824bb255c81aad5fa50f38fa447f`                               |
| Pull request                   | https://github.com/Phuongle29-01/odoo-workspace/pull/1                   |
| Trạng thái PR đã đối chiếu     | Open, Draft, chưa merge vào `main`                                       |
| CI thành công của commit chuẩn | https://github.com/Phuongle29-01/odoo-workspace/actions/runs/40029924014 |

**Không clone rồi mặc định coi `main` là bản có đầy đủ ứng dụng.** `main` hiện vẫn ở commit khảo sát `2b555264c2d4fc9133c3400825d74ef12ccd2302`. Trạng thái này có thể đổi sau khi chủ sở hữu merge PR; luôn kiểm tra lại remote.

Trên máy mới, nếu chưa có checkout:

```bash
git clone https://github.com/Phuongle29-01/odoo-workspace.git
cd odoo-workspace
git fetch origin
git switch feature/odoo17-smart-workspace
git status --short
git rev-parse HEAD
```

Nếu cần tái hiện chính xác bản đã nghiệm thu, dùng một checkout sạch của commit chuẩn. Nếu đã có checkout và thay đổi của người dùng, kiểm tra và bảo toàn trước; không reset/clean/ghi đè để ép về commit này.

Nếu không truy cập được repository private, dùng cơ chế cấp quyền GitHub phù hợp. Trong Codex cloud, thử quyền Git được inject sẵn trước khi yêu cầu thông tin mới; không yêu cầu người dùng dán token vào chat.

File bàn giao này không phải toàn bộ mã nguồn. Mã nguồn cần được lấy từ repository. Các file `.env`, secret, volume database, `node_modules`, `.next` và ZIP bàn giao cục bộ không được commit vào Git.

## 3. Những gì đã làm và những gì chưa xác minh

### Đã có và đã kiểm thử trong môi trường local

- Login riêng từng nhân viên, logout/hết hạn phiên, kiểm tra quyền Odoo.
- Dashboard có số đếm ORM thật và link tới dữ liệu/bộ lọc tương ứng.
- Smart Search: một phần tiêu đề, tiếng Việt có/không dấu, ID, dự án; gợi ý, Ctrl/Cmd+K, ↑/↓/Enter/Escape, highlight và bộ lọc.
- Task nhiều cấp, task cha/con khác dự án; breadcrumb theo dữ liệu và quyền thật; URL refresh/tab mới/Back hoạt động.
- List/Kanban/Tree/My Tasks; tùy chọn view/panel lưu riêng theo instance và UID.
- Desktop ba vùng đổi kích thước/thu gọn; laptop hai vùng; mobile dùng tab và thẻ nhiệm vụ.
- Chỉnh sửa các field được hỗ trợ qua atomic bridge; editor mô tả định dạng, giữ draft và chống ghi đè khi hai người sửa cùng revision.
- Tạo task con, gửi Chatter bình luận/internal note, upload/download file theo ACL.
- Notification read/unread, lọc task/Discuss/subtype thật và link chính xác tới task/comment/channel.
- Discuss: danh sách hội thoại đã tham gia, đọc/gửi/tìm lịch sử và deep link tin nhắn theo quyền.
- Polling khoảng 30 giây và refocus; banner offline/reconnect, giữ nội dung chưa gửi.
- Responsive, dark/light, kiểm tra bàn phím và accessibility tự động trong phạm vi đã ghi.

### Chưa được coi là hoàn tất production

- Chưa đăng nhập hoặc kiểm thử nghiệp vụ trên Odoo doanh nghiệp.
- Chưa triển khai một domain HTTPS production thật cho nhiều nhân viên.
- Chưa nghiệm thu trên hai máy vật lý, Safari/Firefox hoặc tải đồng thời quy mô doanh nghiệp.
- Chưa xác minh Publish snapshot cloud và khôi phục trong một task cloud mới.
- Chưa có SSO/OAuth, bus/WebSocket realtime, offline write queue, kéo thả Kanban hoặc bulk edit.
- Chưa đầy đủ tạo/join/quản lý thành viên, file và unread chi tiết của Discuss; các phần này dùng Odoo gốc.
- Chưa có mapping nghiệp vụ tự động cho milestone, “đầu mục công việc” hoặc model/field tùy chỉnh `x_`.

### Máy chủ Odoo người dùng đã cung cấp

URL gốc: **https://tabvietnam.vuahethong.com**.

URL giao diện ban đầu có `/web#action=107&cids=1&menu_id=70`; khi cấu hình backend chỉ dùng URL gốc. Fragment không cho biết database, hosting hoặc task ID.

Public XML-RPC version đã trả **`17.0+e-20260908`**. Kết quả này xác nhận phản hồi phiên bản Odoo 17 Enterprise, không chứng minh quyền đăng nhập, quyền sửa task hoặc gói hosting hỗ trợ đầy đủ External API.

Các thông tin còn thiếu để triển khai/kiểm thử doanh nghiệp:

1. Tên database Odoo chính xác.
2. Xác nhận endpoint/DB nào là staging, endpoint/DB nào là production.
3. Hosting/gói External API và khả năng cài addon tùy chỉnh.
4. Hai danh tính test có vùng quyền khác nhau; cấp secret qua kênh an toàn.
5. Máy chủ triển khai app, domain HTTPS, DNS và phạm vi được phép thao tác.

Không suy hosting từ tên miền hoặc chuỗi phiên bản. Không dò/đoán database rồi thử ghi vào production.

## 4. Kiến trúc và công nghệ

```text
Trình duyệt nhân viên
    │ HTTPS + cookie phiên HttpOnly
    ▼
Next.js UI và API server
    ├── XML-RPC bằng UID + credential riêng ──► Odoo 17
    └── Session/metadata phụ trợ ─────────────► PostgreSQL 16
```

| Thành phần        | Công nghệ / vai trò                                            |
| ----------------- | -------------------------------------------------------------- |
| Frontend + API    | Next.js 16.4.2 App Router, React 19, TypeScript                |
| Truy vấn client   | TanStack Query; cache không persist để chia sẻ qua người dùng  |
| Giao diện         | CSS tokens, Inter tự host hỗ trợ tiếng Việt, Lucide            |
| Editor            | Tiptap, tải khi mở chỉnh sửa                                   |
| Odoo adapter      | XML-RPC `/xmlrpc/2/common` và `/xmlrpc/2/object`, `execute_kw` |
| Validation / HTML | Zod, sanitize-html                                             |
| Metadata DB       | PostgreSQL 16, thư viện `pg`                                   |
| Kiểm thử          | Vitest, Playwright, axe-core, screenshot comparison            |
| Đóng gói          | Docker multi-stage, Next standalone, runtime non-root          |
| Reverse proxy mẫu | Caddy HTTPS                                                    |
| CI                | GitHub Actions, Ubuntu 24.04, Node 24                          |

Odoo là nguồn dữ liệu nghiệp vụ. PostgreSQL của app không phải bản sao cơ sở dữ liệu ERP. Các bảng chính của app:

- `workspace_sessions`: hash token, UID, instance, credential mã hóa và hạn phiên.
- `workspace_limits`: rate limits.
- `workspace_mutations`: ledger idempotency, trạng thái/kết quả thao tác.
- `workspace_preferences`: bookmark/lịch sử task.
- `workspace_ui_preferences`: view, độ rộng và trạng thái panel theo danh tính.

Instance được gắn với Odoo URL/database. Không dùng credential admin chung làm runtime cho mọi nhân viên. Odoo web session và app session độc lập; mở Odoo gốc có thể vẫn cần đăng nhập Odoo trong trình duyệt.

## 5. Bản đồ mã nguồn để Codex đọc

| Đường dẫn trong repository                                     | Nội dung cần hiểu                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| `AGENTS.md`                                                    | Quy tắc dự án; đọc tài liệu Next đi kèm trước khi sửa          |
| `src/app/[[...slug]]/page.tsx`                                 | Điểm vào UI                                                    |
| `src/app/api/[...path]/route.ts`                               | API allowlist, auth, validation, kiểm soát ghi                 |
| `src/components/workspace.tsx`                                 | Shell, login, menu, routes UI, task views, notifications       |
| `src/components/smart-search.tsx`                              | Gợi ý, keyboard, filters, kết quả tìm kiếm                     |
| `src/components/task-detail.tsx`                               | Task, editor draft/revision, Chatter, tài liệu                 |
| `src/components/task-workbench.tsx`                            | Panel, resize, navigation, summary, activities                 |
| `src/components/rich-text-editor.tsx`                          | Editor mô tả tải khi cần                                       |
| `src/components/dashboard.tsx`, `discuss.tsx`                  | Dashboard và Discuss                                           |
| `src/components/ui.tsx`, `context.tsx`                         | Thành phần/trạng thái dùng chung                               |
| `src/app/tokens.css`, `workspace-ux.css`, `globals.css`        | Tokens và style; chú ý thứ tự import                           |
| `src/lib/client.ts`, `search.ts`, `preferences.ts`, `hooks.ts` | API client, normalize/highlight, UI prefs, online/media        |
| `src/server/odoo.ts`                                           | XML-RPC, metadata, ORM, TLS/proxy và fault mapping             |
| `src/server/workspace.ts`, `dashboard.ts`, `discuss.ts`        | Domain/ACL, search, task relations, chatter/file, counts, kênh |
| `src/server/auth.ts`, `crypto.ts`, `http.ts`                   | Phiên, mã hóa, CSRF, lỗi và phản hồi                           |
| `src/server/db.ts`, `mutations.ts`                             | Schema, rate limit, ledger chống replay                        |
| `addons/smart_workspace_bridge/`                               | Addon kiểm tra revision và ghi nguyên tử                       |
| `compose.yaml`, `Dockerfile`                                   | Local Odoo/Postgres/app và image app                           |
| `compose.production.yaml`, `deploy/Caddyfile`                  | Mẫu production riêng, không seed/local Odoo                    |
| `scripts/prepare-local.py`, `seed-odoo.py`                     | Chỉ chuẩn bị dữ liệu test local                                |
| `scripts/integration.ts`, `tests/`                             | Bằng chứng hành vi và guards test                              |
| `playwright.config.ts`                                         | Browser, viewport, locale, OS-specific baselines               |
| `.github/workflows/ci.yml`                                     | Pipeline thực tế                                               |

Các docs để đối chiếu: `README.md`, `docs/ux-review.md`, `docs/validation.md`, `docs/performance.md`, `docs/acceptance.md`, `docs/deployment.md`, `docs/cloud-start.md`.

**Lưu ý tài liệu cũ:** `docs/architecture.md` còn đoạn nói draft form edit chỉ ở bộ nhớ. Bản hiện tại trong `task-detail.tsx` đã lưu draft edit vào `sessionStorage`, gồm values, original và expected revision. Khi tài liệu cũ khác implementation, kiểm tra source và UX review hiện tại; không làm mất tính năng đã có.

Next.js ở repository là phiên bản mới: sau `npm ci`, đọc hướng dẫn liên quan trong `node_modules/next/dist/docs/`. Không tự đổi framework hoặc nâng dependency để khớp kiến thức cũ.

## 6. Hợp đồng tích hợp và dữ liệu cần bảo toàn

### Auth, quyền và credential

- Credential được mã hóa AES-256-GCM phía server, ràng buộc với instance/UID; DB chỉ lưu hash của session token.
- Cookie HttpOnly, SameSite=Lax; production bắt buộc Secure qua HTTPS.
- Mỗi lệnh đọc/ghi vẫn chịu ACL và record rules của Odoo; không thêm `sudo` để “sửa” lỗi 403.
- Mutation cần Origin đúng `APP_ORIGIN`, header `X-Workspace-Request` và idempotency key ở các thao tác được ledger bảo vệ.
- Không đưa credential vào JavaScript client, localStorage, URL, log, repository hoặc file bàn giao.
- Các tùy chọn UI trong DB app vẫn có thể lưu ở chế độ Odoo chỉ đọc; cờ ghi bảo vệ việc thay đổi ERP.

### Task, quan hệ và search

- Field/model lấy qua metadata Odoo; không tự tạo state/stage giả để che lỗi API.
- Một task con có thể nằm ở dự án khác cha. Breadcrumb không được ép về một dự án duy nhất.
- Search không dấu hiện đọc ORM theo quyền, normalize Unicode/đ/Đ; không dùng chỉ mục/cache nghiệp vụ chung bỏ qua ACL.
- Mỗi lượt tối đa 1.000 bản ghi hoặc 40 kết quả; dùng `nextCursor`/`scanLimited`, cho người dùng tìm tiếp.
- Tổ tiên tối đa 20 mức; children/siblings, options, file và chatter có giới hạn. Không xem tập con giới hạn là toàn bộ dữ liệu doanh nghiệp.

### Ghi đồng thời và idempotency

Addon `smart_workspace_bridge` thêm `workspace_revision` và `workspace_write(expected_revision, values)`. Nó kiểm quyền, khóa record, đối chiếu revision và ghi ORM trong cùng transaction.

Allowlist chỉnh sửa: `name`, `description`, `user_ids`, `stage_id`, `state`, `date_deadline`, `priority`.

Thiếu bridge thì sửa trực tiếp bị khóa và người dùng mở task trong Odoo gốc. Không thay bằng read-then-write không nguyên tử. Bridge áp dụng cho Odoo.sh/self-hosted có quyền cài addon; Odoo Online thường không cài addon tùy chỉnh.

Ledger lưu key/fingerprint theo danh tính. Kết quả chưa chắc chắn hoặc timeout không được tự động gửi lại như một thao tác mới. Khi gặp `RESULT_UNKNOWN`, kiểm tra dữ liệu Odoo trước. Không hứa exactly-once tuyệt đối khi phản hồi upstream đã mất.

### Draft, thông báo và đồng bộ

- Draft editor/Chatter scoped theo instance, UID và task trong phiên/tab trình duyệt. Không phải bản lưu bền vững trên server hoặc giữa mọi thiết bị; logout xóa draft.
- Refocus/polling cập nhật truy vấn đọc. Không tự phát lại mutation khi có mạng trở lại.
- Notification link có thể là `/tasks/ID?tab=discussion&message=ID` hoặc `/discuss/ID?message=ID`.
- Mỗi message/file/channel phải được kiểm tra đúng association và quyền; không chỉ kiểm ID tồn tại.
- Notification Center không bao phủ mọi sự kiện tùy chỉnh; loại sự kiện hiển thị từ subtype thật.
- HTML phải tiếp tục được sanitize trước khi hiển thị. Download kiểm tra task/file association; không mở file ngoài quyền.

## 7. Chạy local an toàn trên máy mới

Khuyến nghị Linux; Node.js 24, npm, Python 3, Docker Engine + Compose v2. Node hỗ trợ theo manifest: `>=22.13 <25`. Đảm bảo đủ RAM/disk cho Odoo, Postgres, Node và Chromium. Lượng dung lượng thực tế phụ thuộc cache/storage driver, không chỉ kích thước image được báo.

Trong đúng nhánh/checkout ứng dụng:

```bash
npm ci
npm run local:prepare
chmod -R a+rX addons
chmod a+r scripts/seed-odoo.py
docker compose --env-file .env.local --profile local up -d --wait db odoo
npm run local:seed
npm run db:migrate
npm run dev
```

Dùng terminal khác để kiểm tra health và nghiệp vụ. Không chạy `npm run dev` và app container cùng chiếm cổng 3000.

`local:prepare` chỉ tạo `.env.local` nếu chưa có, sinh secret ngẫu nhiên và không in giá trị. Seed chỉ vào Odoo local database **`workspace_test`**; giữ các task/comment fixture đã tồn tại.

| Local service            | Địa chỉ/cổng mặc định                             |
| ------------------------ | ------------------------------------------------- |
| App                      | `http://localhost:3000`                           |
| Odoo local               | `http://127.0.0.1:8069`                           |
| PostgreSQL app trên host | `127.0.0.1:5433`, database `workspace`            |
| Odoo database test       | `workspace_test` trong PostgreSQL của stack local |

Tài khoản fixture: `workspace.a@example.test` và `workspace.b@example.test`. Mật khẩu tương ứng ở `LOCAL_TEST_PASSWORD_A/B` trong `.env.local` mới sinh, không có trong file bàn giao. Không tái sử dụng tài khoản/secret test này trên doanh nghiệp.

Muốn chạy app bằng Docker thay cho native dev:

```bash
# Dừng npm dev/start do mình khởi động nếu đang chiếm cổng 3000.
docker compose --env-file .env.local --profile app --profile local up -d --build app
```

Compose local override `ODOO_URL` bằng `DOCKER_ODOO_URL` khi có giá trị. Mặc định local dùng `http://odoo:8069` cho backend Docker, còn `ODOO_PUBLIC_URL` là URL trình duyệt mở được. Không nhầm hostname service Docker với URL công khai.

Giữ volume khi dừng. Không dùng `down -v` hoặc xóa volume để khắc phục một lỗi cấu hình thông thường.

## 8. Cấu hình staging/production

### Tách các môi trường

- **Local/test:** stack riêng, DB `workspace_test`, có fixture và bộ test ghi.
- **Staging:** Odoo/DB test được quản trị viên cho phép, hai tài khoản test và secret riêng; không mặc định dùng DB production.
- **Production:** app tập trung + Postgres persistent + reverse proxy HTTPS; Odoo nghiệp vụ là dịch vụ bên ngoài. Không seed dữ liệu local vào hệ thống này.

`compose.production.yaml` chỉ có app, DB phụ trợ và Caddy; không cung cấp một Odoo production mới.

### Những biến cần cung cấp

| Biến                    | Cách dùng                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `APP_DOMAIN`            | Domain app cho Caddy, không kèm `https://` hoặc path                                |
| `APP_ORIGIN`            | Origin HTTPS chính xác của app, không dấu `/` cuối                                  |
| `ODOO_URL`              | URL gốc backend Odoo 17, không `/web`, query, fragment hoặc credential              |
| `ODOO_PUBLIC_URL`       | URL gốc Odoo mà trình duyệt nhân viên mở được                                       |
| `ODOO_DB`               | Tên DB do quản trị viên cung cấp; khác `DATABASE_URL`                               |
| `ODOO_HOSTING`          | `unknown`, `online`, `odoo_sh` hoặc `self_hosted`; metadata, không tự suy từ domain |
| `ODOO_AUTH_MODE`        | `password` hoặc `api_key`; mỗi người vẫn dùng credential riêng                      |
| `ODOO_WRITE_ENABLED`    | Ban đầu `false`; bật trong môi trường/phạm vi đã được cho phép và nghiệm thu        |
| `ODOO_ALLOW_HTTP`       | `false` trên môi trường HTTPS; HTTP chỉ dành cho local test rõ ràng                 |
| `DATABASE_URL`          | PostgreSQL của app, không phải DB Odoo                                              |
| `POSTGRES_PASSWORD`     | Mật khẩu DB phụ trợ trong Compose production                                        |
| `ENCRYPTION_KEY`        | 64 ký tự hex = 32 byte ngẫu nhiên, giữ trong secret storage                         |
| `SESSION_COOKIE_SECURE` | `true` khi triển khai HTTPS                                                         |
| `SESSION_TTL_HOURS`     | Mặc định 8; implementation giới hạn 1–24 giờ                                        |

Mẫu **chưa thể chạy** sau đây chỉ minh họa cấu trúc `.env.production`. Phải thay mọi placeholder bằng cấu hình/secret được cấp, không commit file đã điền:

```dotenv
APP_DOMAIN=<DOMAIN_APP>
APP_ORIGIN=https://<DOMAIN_APP>
ODOO_URL=https://<ODOO_STAGING_HOST>
ODOO_PUBLIC_URL=https://<ODOO_STAGING_HOST>
ODOO_DB=<ODOO_STAGING_DATABASE>
ODOO_HOSTING=unknown
ODOO_AUTH_MODE=password
ODOO_WRITE_ENABLED=false
ODOO_ALLOW_HTTP=false
DATABASE_URL=postgresql://workspace:<URL_ENCODED_DB_PASSWORD>@db:5432/workspace
POSTGRES_PASSWORD=<DB_PASSWORD>
ENCRYPTION_KEY=<64_HEX_SECRET>
SESSION_COOKIE_SECURE=true
SESSION_TTL_HOURS=8
```

`POSTGRES_PASSWORD` và mật khẩu trong `DATABASE_URL` phải tương ứng; phần mật khẩu trong URL phải URL-encode nếu có ký tự đặc biệt. `db` trong mẫu là service của Compose production. Thay bằng host khác nếu dùng DB managed.

Không để lại `DOCKER_ODOO_URL=http://odoo:8069` từ cấu hình local trong một kế hoạch dùng Odoo doanh nghiệp. Compose production hiện dùng `ODOO_URL` trực tiếp.

### Tránh nhầm cách nạp env

- `compose.yaml` và nhiều npm scripts local dùng **`.env.local`**.
- `compose.production.yaml` dùng **`.env.production`** và các biến Compose từ `--env-file`.
- Các script `check:odoo`, `db:migrate`, `test:integration`, `measure:performance` có `--env-file=.env.local` trong `package.json`.
- `npm start` qua `scripts/start.mjs` cũng thử nạp `.env.local` nếu file tồn tại.

Vì vậy, tạo `.env.production` rồi chạy npm scripts local không bảo đảm đang dùng production env. Ưu tiên Compose production đúng file. Nếu chọn native deployment, thiết kế rõ cách inject env và đối chiếu target, không ghi đè file local hoặc chạy nhầm các script ghi.

## 9. Trình tự triển khai cho Codex tiếp nhận

### A. Xác minh checkout và local trước

1. Đọc `AGENTS.md`, manifest/lockfile và các file cấu hình liên quan.
2. Kiểm tra nhánh/HEAD, thay đổi hiện có và quyền GitHub. Bảo toàn thay đổi của chủ sở hữu.
3. Dùng `npm ci`; không tự thay lockfile hoặc nâng framework.
4. Dựng local bằng phần 7, xác minh đăng nhập/task thật và chạy suite local ở phần 10.
5. Đối chiếu những thay đổi mới với commit chuẩn; ghi rõ test nào đã chạy/không chạy.

### B. Kết nối Odoo staging ở chế độ đọc trước

1. Nhận URL gốc, database, hosting/gói API, endpoint staging và hai danh tính test qua kênh phù hợp. Không hỏi secret trong chat.
2. Chuẩn bị env staging riêng, DB phụ trợ riêng, khóa mới, HTTPS và `ODOO_WRITE_ENABLED=false`.
3. Xác minh public version, đăng nhập thực tế, Project/Task metadata và ACL.
4. Mở **Cài đặt kết nối → Kiểm tra khả năng API**. Trang này kiểm khả năng của tài khoản đang đăng nhập; không phải công cụ thay cấu hình máy chủ.
5. Phân biệt ACL model “cho phép ghi” với quyền trên từng record: Odoo tiếp tục kiểm record rules khi thao tác.
6. Nếu hosting cho phép và đã được ủy quyền, cài `addons/smart_workspace_bridge` trên Odoo staging theo quy trình quản trị Odoo; kiểm tra `workspace_revision`/atomic edit.
7. Chỉ thử ghi bằng dữ liệu staging được chỉ định. Kiểm hai người sửa cùng task, quyền riêng, thông báo, file và đồng bộ trước khi mở ghi rộng hơn.

Đối chiếu tài liệu chính thức: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html . Không tự chuyển sang JSON-2 hoặc private web controllers làm hợp đồng mặc định cho Odoo 17.

### C. Chuẩn bị và triển khai app tập trung

Khi hạ tầng và phạm vi thao tác đã được cho phép:

1. Chuẩn bị domain/DNS, máy chủ có Docker/Compose và kết nối Odoo + registry cần thiết.
2. Lưu `.env.production` an toàn, quyền file 0600; không dùng secret local hoặc credential admin chung.
3. Cấu hình reverse proxy bằng file Caddy đã có; mở 80/443 theo quyền quản trị hạ tầng. Không expose Postgres/app nội bộ trực tiếp cho nhân viên.
4. Kiểm tra cấu hình mà không in toàn bộ secret:

   ```bash
   docker compose --env-file .env.production -f compose.production.yaml config --quiet
   ```

5. Build và khởi động:

   ```bash
   docker compose --env-file .env.production -f compose.production.yaml up -d --build
   ```

6. Kiểm tra HTTPS/certificate, health, đăng nhập và đọc dữ liệu Odoo thật. Một container “Running” hoặc health DB OK chưa chứng minh Odoo dùng được.
7. Nghiệm thu hai người dùng theo checklist phần 12. Chỉ bật ghi theo đúng quyền triển khai đã có và phạm vi dữ liệu đã được duyệt; không hỏi lại các bước thường lệ đã được ủy quyền.
8. Ghi lại commit/image, cấu hình không chứa secret, backup/rollback và kết quả kiểm tra. Không tự merge PR vào main nếu phạm vi hiện tại chỉ là triển khai/chuẩn bị bản ở nhánh tính năng.

**Migration:** runtime hiện gọi `readyDb()` và tạo schema bằng `CREATE TABLE IF NOT EXISTS`; `/api/health` cũng đi qua bước này. Image standalone không mặc định chứa `tsx` và source CLI migration để chạy `npm run db:migrate` bên trong container. Nếu cần tách role migration/runtime hoặc thêm thay đổi schema mới, triển khai versioned migrations phù hợp; không tự giả định runtime role bị giới hạn vẫn có quyền CREATE.

**Điều kiện bật ghi:** cờ `ODOO_WRITE_ENABLED` không nâng quyền người dùng; nó chỉ mở các thao tác mà Odoo còn cho phép. Thiếu bridge thì không được bỏ kiểm tra revision để mở nút sửa.

## 10. Kiểm thử và bằng chứng đã có

### Kết quả của commit chuẩn

| Nhóm                                                | Passed | Failed | Skipped |
| --------------------------------------------------- | -----: | -----: | ------: |
| Unit                                                |     10 |      0 |       0 |
| Integration app → XML-RPC Odoo 17 thật + PostgreSQL |     27 |      0 |       0 |
| Browser tổng                                        |     39 |      0 |       0 |
| **Tổng**                                            | **76** |  **0** |   **0** |

39 browser test gồm 4 Odoo thật, 14 UI/accessibility và 21 visual comparisons. CI run `40029924014` đã success từ checkout mới của `afe5bb9`. Đây là bằng chứng lịch sử; Codex mới phải xác minh lại khi đổi mã/môi trường, không chỉ trích con số này làm test mới.

### Chạy lại trên local

Cài Chromium đúng lockfile:

```bash
npx playwright install chromium
# Trên Linux thiếu thư viện hệ thống, dùng install --with-deps chromium
```

Chạy app production local sau build, ở terminal riêng; dừng dev/app khác chiếm cổng. Sau đó chạy tuần tự:

```bash
npm run typecheck
npm test
npm run build
# Terminal riêng: npm start
npm run test:integration
npm run test:e2e
```

Các lựa chọn nhỏ hơn:

```bash
npm run test:ui
npm run test:visual
npm run test:e2e -- --project=odoo
```

Integration chỉ cho loopback + `workspace_test`, có guard ghi; suite này **pause/unpause container Odoo local** để tạo timeout. Tên container được harness tham chiếu là `odoo-smart-workspace-odoo-1`. Không chạy song song integration với browser/performance, không bỏ guard và không chạy suite đó lên production/staging doanh nghiệp.

Mock chỉ ở `tests/fixtures`, chặn API trong browser; API lạ trả 501. Không đưa fixture/mock vào runtime để che kết nối Odoo lỗi.

HTML report ở `playwright-report/`, kết quả/screenshot/diagnostics ở `test-results/`. Trace giữ khi lỗi ở nhóm mock/UI; nhóm Odoo thật tắt trace/video để tránh ghi credential. CI upload artifact trong 14 ngày, sau đó có thể hết hạn.

### Visual regression

- 7 màn hình × 3 viewport: 1440×900, 1366×768, 390×844.
- Chromium theo lockfile, Inter tự host, `vi-VN`, timezone `Asia/Ho_Chi_Minh`, fixture/thời gian và reduced-motion được cố định.
- Baseline chọn theo `/etc/os-release`: `tests/visual/snapshots/debian-13/` hoặc `ubuntu-24.04/`.
- CI pin Ubuntu 24.04; không dùng browser hệ thống khác để so ảnh.
- Giữ `maxDiffPixels:50`, không mask vùng ảnh để che lỗi.
- Lượt CI trước `39978725935` có 17 ảnh lệch 55–227 pixel ở nét chữ giữa Debian/Ubuntu; đã xem diff, bảo toàn ảnh Debian và bổ sung bộ Ubuntu có provenance. Run sau sửa đã success.
- Không tự ghi lại baseline sau mỗi failure. Chỉ cập nhật có chủ đích sau khi xem expected/actual/diff, dùng `UPDATE_VISUALS=1` với lệnh update tương ứng.
- Máy khác OS có thể chạy test hành vi, nhưng cần baseline renderer riêng được review nếu muốn chạy visual. Không coi baseline thiếu là lý do bỏ test âm thầm.

## 11. Số đo và giới hạn hiệu năng

Số đo production Docker local, một client, cache ấm, cùng Odoo/Postgres local; không phải SLA doanh nghiệp:

| Luồng                         | Trung vị |
| ----------------------------- | -------: |
| Dashboard                     |   431 ms |
| Search mở bằng URL có từ khóa |   314 ms |
| Task Detail                   |   885 ms |
| Lưu task và xác nhận UI       |   418 ms |

Đã đo dataset riêng tới 1.100 task: một lượt quét dừng đúng 1.000, trả cursor để tìm tiếp. Tổng client chunks đã đo khoảng 1,11 MB thô / 347 KB gzip, gồm các phần lazy load; không phải toàn bộ lượng tải ban đầu.

0 lỗi JavaScript và 0 HTTP lỗi trong lượt đo Docker. Có các request prefetch/navigation bị hủy, đã phân biệt với lỗi kết nối thực; không quy chúng thành mutation thất bại.

Chi tiết và từng mẫu nằm trong `docs/performance.md`, `docs/measurements/`. `npm run measure:performance` chỉ dành cho local `workspace_test`: tạo dữ liệu riêng, chia lô và dọn sau đo. Không chạy đồng thời với suite/build khác.

Đối với dữ liệu lớn hoặc nhiều nhân viên, đo tải thực trước khi tối ưu; ưu tiên batch RPC/metadata và chiến lược search có index trong Odoo vẫn giữ ACL. Chưa có bằng chứng capacity/throughput doanh nghiệp.

## 12. Checklist nghiệm thu staging cho hai nhân viên

- [ ] A/B đăng nhập bằng danh tính riêng; profile và phiên không bị trộn.
- [ ] Tìm tiêu đề có/không dấu, ID, tên trùng; ↑/↓/Enter và bộ lọc trả đúng phạm vi quyền.
- [ ] Task nhiều cấp/cross-project có breadcrumb đúng; cha, dự án, giai đoạn và Back đi đúng nơi.
- [ ] Refresh, URL chia sẻ, tab mới vẫn đúng nội dung và comment được chỉ định.
- [ ] Task riêng của A không xuất hiện trong search của B; URL trực tiếp/file/bookmark cũng bị chặn khi không còn quyền.
- [ ] Sửa mô tả và các field được hỗ trợ → lưu → refresh/Odoo gốc còn đúng.
- [ ] Hai người cùng revision: người lưu sau nhận conflict, nội dung draft được giữ và dữ liệu không bị ghi đè âm thầm.
- [ ] Chatter bình luận/internal note đúng subtype; B gửi, A thấy cập nhật rồi phản hồi ngược lại.
- [ ] Notification mở đúng task/tab/message; read/unread và Discuss deep link đúng đối tượng.
- [ ] File roundtrip đúng task; giả ID file/task ngoài quyền bị từ chối; giới hạn upload 5 MB được xử lý.
- [ ] Offline/timeout không báo thành công giả, giữ nội dung; online không tự replay mutation chưa chắc chắn.
- [ ] Desktop resize/thu gọn, laptop/mobile tabs, menu bàn phím/focus và không tràn document.
- [ ] HTTPS/cookie Secure, logout/session expiry và trang chẩn đoán hoạt động.
- [ ] Backup/restore và rollback có người chịu trách nhiệm; đánh dấu rõ phần chưa chạy.

Staging dùng dữ liệu được chỉ định và quyền đã cấp. Không đánh dấu checklist này đạt chỉ vì suite fixture local đã pass.

## 13. Vận hành, rollback và xử lý lỗi

- Backup DB app và Odoo theo quy trình riêng. Bảo vệ backup vì DB app có ciphertext credential.
- Giữ `ENCRYPTION_KEY` trong vault/secret storage độc lập với backup DB. Đổi khóa hoặc Odoo URL/DB cần thu hồi phiên và đăng nhập lại; không cố giải mã bằng khóa khác.
- Lưu commit/image đang chạy để rollback. Không xóa DB/volume để rollback một phiên bản app.
- Với volume Postgres đã có dữ liệu, đổi `POSTGRES_PASSWORD` trong env không tự đổi mật khẩu DB hiện hữu; cần quy trình đổi credential đồng bộ.
- Log app chỉ nên có request ID/code/status; không bật debug XML-RPC in payload/credential.
- Rate limit hiện tại: login theo tài khoản và giới hạn tổng; mỗi phiên tối đa 180 request/phút. Theo dõi số tab/polling khi triển khai nhiều người.

| Triệu chứng                   | Kiểm tra tiếp                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------- |
| 401                           | Login/session expiry/logout; kiểm cookie và danh tính                         |
| 403                           | ACL/record rules, chế độ ghi, Origin/header; không thay bằng admin            |
| 409 conflict                  | Đối chiếu revision mới và giữ draft; không ghi đè                             |
| `RESULT_UNKNOWN`              | Đọc Odoo để kiểm tra thao tác đã xảy ra chưa, không retry mù                  |
| 502/504                       | URL, DNS/proxy/allowlist, TLS, timeout và khả năng API của Odoo               |
| Health OK nhưng nghiệp vụ lỗi | Health chỉ kiểm DB app; kiểm auth/metadata/task Odoo thật                     |
| Không sửa được task           | Cờ ghi, quyền của record, khả năng cài/đọc atomic bridge                      |
| Mất thông báo/Discuss         | Kiểm quyền model/membership; dùng fallback Odoo gốc, không fixture production |
| Test ảnh lệch ít pixel chữ    | Kiểm OS/browser/font/viewport đúng trước khi sửa baseline                     |
| BuildKit `EAI_AGAIN`          | Kiểm DNS/proxy/CA; không tắt TLS/checksum. Cloud có helper cache ở repository |

Các runtime role hiện tự tạo schema. Với production lớn cần bổ sung versioned migrations, quan sát tải, quy trình release và kiểm thử backup/restore phù hợp hạ tầng.

## 14. Lưu ý riêng cho Codex cloud và công cụ

Tác vụ trước đã lưu `install_script`, `start_skill`, ref commit mới và domain cần thiết trong bản nháp cấu hình cloud. Việc lưu không chứng minh Publish/snapshot mới hoặc restore trong task mới đã thành công.

Nếu làm trong cùng cloud, checkout trước ở `/workspace/odoo-workspace`. Trên máy khác thay đường dẫn phù hợp. Không giả định process, container, secret hoặc cache của tác vụ cũ vẫn tồn tại.

Trong cloud home read-only, có thể cần:

```bash
export npm_config_cache=/workspace/.cache/npm
export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright
export NEXT_TELEMETRY_DISABLED=1
```

Chỉ dùng đường dẫn này khi đúng môi trường. Dùng checkout đã có, không tự tạo worktree nếu người dùng chưa yêu cầu. Tôn trọng quyền filesystem/network đang áp dụng.

Khi đọc log/artifact GitHub, proxy có thể cần domain tải xuống ngoài `api.github.com`; hostname lưu trữ artifact có thể thay đổi. Chẩn đoán response và bổ sung đúng destination qua cấu hình hợp lệ; không vô hiệu hóa TLS hoặc lấy credential proxy ra ngoài. Không nhúng URL tải artifact có chữ ký tạm thời vào source/file bàn giao.

## 15. Yêu cầu mẫu để giao cho Codex mới

Có thể gửi file này kèm yêu cầu sau; thay mục tiêu staging/server bằng thông tin thực đã được cấp:

> Bạn tiếp nhận Odoo Smart Workspace trong repository `Phuongle29-01/odoo-workspace`. Đọc toàn bộ file bàn giao và `AGENTS.md`. Lấy đúng nhánh `feature/odoo17-smart-workspace`, đối chiếu baseline `afe5bb9fb56c824bb255c81aad5fa50f38fa447f`, bảo toàn thay đổi hiện có. Thực hiện phần cài đặt/kiểm thử/triển khai đã đủ thông tin và đã được ủy quyền, không dừng ở kế hoạch hoặc mockup. Chạy local riêng trước, giữ Odoo là nguồn nghiệp vụ và giữ ACL cá nhân. Thu thập cấu hình staging còn thiếu qua kênh phù hợp, không yêu cầu secret trong chat. Chuẩn bị hoặc triển khai app tập trung theo quyền hiện có; đọc trước, chỉ ghi dữ liệu được chỉ định, kiểm hai nhân viên và xung đột chỉnh sửa. Không dùng admin chung, không seed production, không bỏ atomic bridge/guard test, không thay screenshot baseline để che lỗi. Khi hoàn tất, báo commit/image, URL đã triển khai nếu có, test pass/fail/skipped, bằng chứng và những phần còn chờ thông tin. Không gọi production hoàn tất khi mới chỉ chạy local.

## 16. Nguồn kiểm chứng khi cần đọc sâu

Tất cả liên kết nguồn sau trỏ đúng commit chuẩn để tránh nhầm bản `main`:

- Source tree: https://github.com/Phuongle29-01/odoo-workspace/tree/afe5bb9fb56c824bb255c81aad5fa50f38fa447f
- README: https://github.com/Phuongle29-01/odoo-workspace/blob/afe5bb9fb56c824bb255c81aad5fa50f38fa447f/README.md
- UX và checklist: https://github.com/Phuongle29-01/odoo-workspace/blob/afe5bb9fb56c824bb255c81aad5fa50f38fa447f/docs/ux-review.md
- Deployment: https://github.com/Phuongle29-01/odoo-workspace/blob/afe5bb9fb56c824bb255c81aad5fa50f38fa447f/docs/deployment.md
- Validation: https://github.com/Phuongle29-01/odoo-workspace/blob/afe5bb9fb56c824bb255c81aad5fa50f38fa447f/docs/validation.md
- Performance: https://github.com/Phuongle29-01/odoo-workspace/blob/afe5bb9fb56c824bb255c81aad5fa50f38fa447f/docs/performance.md
- Bridge: https://github.com/Phuongle29-01/odoo-workspace/tree/afe5bb9fb56c824bb255c81aad5fa50f38fa447f/addons/smart_workspace_bridge
- CI success: https://github.com/Phuongle29-01/odoo-workspace/actions/runs/40029924014
- PR để review/merge theo quyền: https://github.com/Phuongle29-01/odoo-workspace/pull/1

Nếu repository đã có commit mới sau baseline, đọc diff, kiểm thử lại và cập nhật kết luận. File bàn giao không thay thế bằng chứng của môi trường triển khai thực tế.
