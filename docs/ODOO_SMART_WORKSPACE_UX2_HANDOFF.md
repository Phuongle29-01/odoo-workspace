# ODOO SMART WORKSPACE UX 2.0 — TÀI LIỆU ĐẦY ĐỦ CHO CODEX TIẾP NHẬN

**Cập nhật:** 24/10/2026, tiếng Việt.  
**Bản ứng dụng đã được xác minh:** `24fbd02205b24d0aeecdc905c488a63aeb6be50f`.  
**Repository:** https://github.com/Phuongle29-01/odoo-workspace  
**Nhánh ứng dụng:** `feature/odoo17-smart-workspace`.  
**PR review:** https://github.com/Phuongle29-01/odoo-workspace/pull/1  
**CI của bản ứng dụng:** https://github.com/Phuongle29-01/odoo-workspace/actions/runs/40058906015 — **success**.

Đây là một file mô tả và bàn giao độc lập, đủ ngữ cảnh để một Codex khác tiếp tục cài đặt, phát triển và chuẩn bị triển khai. File không chứa toàn bộ mã nguồn: phải lấy source đúng nhánh hoặc commit ở trên. File được soạn sau commit ứng dụng đã kiểm thử; commit chỉ bổ sung tài liệu không phải một lần nghiệm thu ứng dụng mới.

Không có mật khẩu, API key, khóa mã hóa, cookie, URL tải artifact có chữ ký hoặc cấu hình database thật trong tài liệu. Các giá trị trong dấu `<...>` là placeholder. URL Odoo doanh nghiệp được thay bằng ví dụ chung; quản trị viên cấp cấu hình và secret thực qua kênh an toàn.

Các kết quả local/CI không phải kết quả staging hoặc production. Các trạng thái chưa hoàn thành được ghi rõ, không suy ra từ việc có mã nguồn hoặc health check thành công.

## 1. Sản phẩm này là gì?

Odoo Smart Workspace là web app tiếng Việt cho nhân viên làm việc với **Odoo 17** qua một giao diện tìm kiếm, điều hướng và trao đổi công việc thuận tiện hơn.

Nhân viên đăng nhập bằng tài khoản Odoo hoặc API key **cá nhân**. Ứng dụng gọi Odoo bằng UID/quyền của chính nhân viên đó. Dự án, nhiệm vụ, giai đoạn, trạng thái, quan hệ cha/con, Chatter và file nghiệp vụ vẫn nằm trong Odoo.

“Smart” hiện chỉ các tính năng tìm kiếm/điều hướng/UX. Chưa có tích hợp LLM, AI tự sửa công việc hoặc API OpenAI. Không tự suy rằng đây là một hệ thống AI agent đã hoàn thiện.

Đây là ứng dụng web tập trung: triển khai một app dùng chung qua HTTPS, nhân viên mở bằng trình duyệt. Không cần cài repository trên từng máy nhân viên.

## 2. Lấy đúng mã nguồn và hiểu đúng trạng thái GitHub

| Mục                            | Giá trị tại thời điểm bàn giao                                           |
| ------------------------------ | ------------------------------------------------------------------------ |
| Repository                     | https://github.com/Phuongle29-01/odoo-workspace                          |
| Quyền truy cập                 | Public tại lúc soạn; kiểm tra lại quyền truy cập nếu có thay đổi         |
| Nhánh có ứng dụng hoàn chỉnh   | `feature/odoo17-smart-workspace`                                         |
| Commit chuẩn đã xác minh       | `24fbd02205b24d0aeecdc905c488a63aeb6be50f`                               |
| Pull request                   | https://github.com/Phuongle29-01/odoo-workspace/pull/1                   |
| Trạng thái PR đã đối chiếu     | Open, Draft, chưa merge vào `main`                                       |
| CI thành công của commit chuẩn | https://github.com/Phuongle29-01/odoo-workspace/actions/runs/40058906015 |

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

File bàn giao này không phải toàn bộ mã nguồn. Mã nguồn cần được lấy từ repository. Không commit `.env`, secret, volume database, `node_modules` hoặc `.next`. Các file export có sẵn trong `docs/downloads` là snapshot lịch sử `f65357d`, trước UX2; tải source đúng nhánh hiện hành để có đầy đủ code mới.

## 3. Trạng thái thực tế và chức năng UX 2.0

| Hạng mục                                                            | Trạng thái                     | Phạm vi bằng chứng                                                              |
| ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| App, login, task, ACL, atomic bridge, Chatter                       | DONE LOCAL                     | Odoo17/PostgreSQL16 thật, production standalone và Docker                       |
| Search2, Focus Mode, cây lazy, preview PDF/ảnh, thông báo2, Discuss | DONE LOCAL                     | Code, integration, browser thật và UI fixture được phân biệt                    |
| Search addon + chỉ mục trigram                                      | DONE LOCAL                     | Cài trên Odoo17 local, đo tới 10.000 task; ORM vẫn theo UID                     |
| 48 ảnh trước/sau và visual/accessibility fixture                    | MOCK ONLY về dữ liệu trong ảnh | App chạy thật; dữ liệu browser tổng hợp, không phải doanh nghiệp                |
| Sáu ca UX2 Firefox                                                  | DONE LOCAL                     | UI fixture, Firefox157 trong Ubuntu24.04 container                              |
| Staging Odoo doanh nghiệp                                           | BLOCKED                        | Thiếu tên DB, xác nhận staging, hosting/API và hai danh tính test được ủy quyền |
| Đánh giá ít nhất ba nhân viên thật                                  | NOT STARTED                    | Có kịch bản/phiếu đo; chưa có số liệu hoặc điểm UX từ người thật                |
| WebKit trên host cloud                                              | BLOCKED                        | Thiếu thư viện hệ thống; không báo pass                                         |
| Safari/macOS, HTTPS production, tải đồng thời doanh nghiệp          | NOT STARTED                    | Chưa triển khai/nghiệm thu thực tế                                              |
| Publish và restore cloud trong một task mới                         | Chưa xác minh                  | Đã lưu bản nháp cấu hình, không chứng minh snapshot đã được Publish/restore     |

### 3.1. Đăng nhập và nguồn dữ liệu

Mỗi nhân viên dùng tài khoản hoặc API key Odoo cá nhân. App không dùng admin chung cho runtime. Có logout, hết hạn phiên, rate limit và kiểm tra ACL/record rules. Odoo giữ dữ liệu nghiệp vụ; DB app giữ phiên/metadata phụ trợ. Odoo web session và app session độc lập.

Dashboard dùng số đếm ORM thật và các đường dẫn tới phạm vi công việc tương ứng. Có My Tasks, List/Kanban/Tree, bookmark, gần đây, light/dark và tùy chọn giao diện theo instance/UID.

### 3.2. Smart Search 2.0

- Tìm một phần tiêu đề, tiếng Việt có/không dấu, ID và tên dự án; task cha/con ở nhiều dự án. Tên trùng được phân biệt bằng ID, dự án, cha, giai đoạn, trạng thái, người phụ trách và hạn.
- Ctrl/Cmd+K, gợi ý toàn cục, ↑/↓/Enter/Escape và highlight. Bộ lọc dự án, giai đoạn, trạng thái, người phụ trách, của tôi, quá hạn, chưa hoàn tất; gợi ý lọc theo dự án/người phụ trách.
- Kết quả nhiều trang được append và dedup ID. Trạng thái “chưa thấy trong phần đã tìm” khác với “đã tìm hết phạm vi”. Không coi 1.000 bản ghi đã quét là toàn bộ dữ liệu.
- URL giữ từ khóa/bộ lọc, số trang và task đã chọn. Back/refresh tự phục hồi tối đa 20 trang; sau đó vẫn tải tay. Thay bộ lọc trong lúc continuation đang chạy không để phản hồi cũ ghi đè phạm vi mới.
- Có addon tùy chọn `smart_workspace_search`: lưu tên chuẩn hóa trên `project.task` và `project.project`, có GIN trigram index của Odoo17. Vẫn search_read qua ORM theo UID và domain/record rules; không có chỉ mục hoặc cache nghiệp vụ chung bỏ qua quyền.
- Thiếu addon, tìm mô tả hoặc tên truy vấn khớp hơn 1.000 dự án: fallback live ORM scan tối đa 1.000 task/lượt, 40 kết quả/trang, trả continuation rõ ràng. Từ quá ngắn có thể vẫn tốn chi phí dù có index.
- Index chỉ cho tên task/project, chưa lập chỉ mục nội dung file hoặc mô tả. Không có tìm kiếm LLM, embedding hoặc nguồn dữ liệu ERP thứ hai.

### 3.3. Smart Task Navigator và Focus Mode

Breadcrumb lấy tổ tiên thật, tối đa 20 mức và có xử lý cha không còn quyền. Task con không bắt buộc cùng dự án với cha. Task hiện rõ dự án, giai đoạn, trạng thái, cha/con, người phụ trách, deadline, ưu tiên, mô tả, tài liệu và trao đổi.

Mở từ search hoặc notification có `focus=1`, ưu tiên nội dung xử lý/trao đổi và thu gọn cây. Nút “Toàn bộ bối cảnh” mở lại ngữ cảnh; tùy chọn panel/độ rộng/view/focus lưu riêng tài khoản. URL tab/message, browser Back/Forward và refresh được giữ.

Desktop đủ rộng có ba vùng resize/thu gọn; laptop hai vùng; mobile dùng tabs. Cây hiển thị 12 task con trước, mở dần tối đa 100 con đã có trong detail, sau đó đọc tiếp keyset 20/lượt có ACL. Chưa tải một cây tùy ý hàng nghìn node nhiều tầng; đi sâu bằng cách mở task con.

### 3.4. Chỉnh sửa và Chatter

Editor Tiptap hỗ trợ mô tả rich text; HTML được sanitize. Draft editor gồm dữ liệu/original/revision, Chatter và Discuss được scoped theo danh tính/task hoặc channel trong sessionStorage của phiên/tab. Chưa có draft đồng bộ đa thiết bị; giữ draft khi gửi lỗi, không có offline mutation queue.

Atomic bridge bảo vệ hai người sửa cùng revision; không mất draft khi conflict. Có tạo task con, gửi bình luận hoặc internal note đúng subtype và upload/download attachment. Thông báo “đã lưu/đã gửi” chỉ sau khi Odoo xác nhận; timeout/RESULT_UNKNOWN không được tự động phát lại mù.

### 3.5. Document Experience

- Xem PDF, PNG/JPEG/GIF/WebP trong dialog giữ nguyên nhiệm vụ/tab; metadata tên, dung lượng, ngày và nguồn task Odoo. Escape/đóng trả focus về nút mở, có download rõ ràng.
- Server kiểm quyền task và association attachment mỗi lượt. Xác định định dạng bằng magic bytes, không tin tên đuôi/MIME tự khai. Preview và upload giữ giới hạn 5 MB.
- HTML/SVG/định dạng lạ chỉ download; không render markup của file trong origin ứng dụng. Download luôn attachment, nosniff, private/no-store.
- PDF.js6 render canvas, không render annotation/actions/XFA hoặc chạy script trong PDF. Worker tĩnh cùng origin được đóng gói vào Next standalone. CSP frame/object vẫn none.
- PDF/ảnh hỏng, quá lớn hoặc không đọc được có thông báo và đường tải xuống. Preview không thay một trình biên tập tài liệu; sửa bằng ứng dụng phù hợp sau download. Chưa co-edit tài liệu trong browser.

### 3.6. Notification Center 2.0

Phân trang keyset 80/lượt, đọc message/target theo nhóm qua ORM có ACL. Lọc read/kind/ngày ở server; project/subtype/cần xử lý áp dụng trên các trang đã tải, có nhắc tải tiếp nếu còn dữ liệu. “Cần xử lý” là thông báo task chưa đọc và task chưa done/canceled, không phải mọi workflow/approval tùy chỉnh.

Dedup theo notification ID, phân biệt chưa đọc/đã đọc, chỉ xác nhận đã đọc sau phản hồi thành công. Link tới đúng task/tab/message hoặc Discuss message; task link vào Focus. Không biến API unavailable thành hộp thư rỗng; có fallback Odoo gốc, trạng thái đồng bộ và lỗi.

### 3.7. Discuss và đồng bộ

Danh sách kênh đã tham gia; đọc/gửi, tìm toàn lịch sử có phân trang, deep link/scroll tới message, hiển thị người gửi và giờ theo timezone trình duyệt. Lịch sử cũ → mới, dedup trang, lỗi tải/gửi rõ ràng, giữ draft.

Create/join channel, quản lý member, file và unread chi tiết chưa triển khai đầy đủ: mở Odoo gốc. Không dùng private Odoo controller làm hợp đồng API ổn định. Đồng bộ hiện là polling khoảng 30s/refocus, không phải bus/WebSocket realtime; không hứa realtime hoặc tự replay ghi khi nối mạng lại.

### 3.8. Dữ kiện doanh nghiệp còn thiếu

Endpoint ban đầu đã trả public version Odoo17 Enterprise `17.0+e-20260908`; chưa có đăng nhập hoặc đọc/ghi nghiệp vụ doanh nghiệp được xác minh. URL giao diện `/web#action=...` không cho biết tên DB, hosting hoặc ID task.

Cần quản trị viên cung cấp: URL gốc HTTPS, DB chính xác, xác nhận staging/production, hosting/gói External API/khả năng cài addon, hai danh tính test có vùng quyền khác nhau, domain/server app và phạm vi được phép ghi. Secret đi qua secret manager/UI bảo mật, không dán vào chat hay file này.

Chưa có SSO/OAuth, kéo thả Kanban/bulk edit, mapping tự động milestone/model hoặc field `x_`, tải đồng thời quy mô doanh nghiệp, backup/restore thực địa hoặc nghiệm thu trên hai máy vật lý. Không coi các phần này DONE LOCAL chỉ vì có UI.

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
| PDF/ảnh           | PDF.js6 tải khi cần, canvas/blob, kiểm MIME thực và ACL        |
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
| `src/components/document-preview.tsx`, `pdf-preview.tsx`       | Dialog và canvas PDF/ảnh, giữ task/tab                         |
| `src/server/preview.ts`, `src/app/pdf-worker/route.ts`         | Magic bytes/giới hạn và static worker                          |
| `src/server/rpc-metrics.ts`                                    | AsyncLocalStorage và Server-Timing riêng request               |
| `addons/smart_workspace_search/`                               | Tên chuẩn hóa và trigram index Odoo17                          |
| `scripts/benchmark-search.ts`                                  | Baseline/index benchmark guarded local, tới 10.000 task        |
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
- Search tự chọn indexed ORM khi có search addon; fallback scan theo quyền khi thiếu addon hoặc tìm mô tả. Chuẩn hóa Unicode/đ/Đ; không dùng cache/chỉ mục ngoài ORM để bỏ qua ACL.
- Trang tìm kiếm tối đa 40 kết quả. Giới hạn 1.000 bản ghi quét/lượt chỉ áp dụng fallback scan, không phải trần tổng số task có thể tìm qua chỉ mục. Dùng `nextCursor`/`scanLimited` và UI continuation đúng nghĩa.
- Tổ tiên tối đa 20 mức; children/siblings, options, file và chatter có giới hạn. Không xem tập con giới hạn là toàn bộ dữ liệu doanh nghiệp.

### Ghi đồng thời và idempotency

Addon `smart_workspace_bridge` thêm `workspace_revision` và `workspace_write(expected_revision, values)`. Nó kiểm quyền, khóa record, đối chiếu revision và ghi ORM trong cùng transaction.

Allowlist chỉnh sửa: `name`, `description`, `user_ids`, `stage_id`, `state`, `date_deadline`, `priority`.

Thiếu bridge thì sửa trực tiếp bị khóa và người dùng mở task trong Odoo gốc. Không thay bằng read-then-write không nguyên tử. Bridge áp dụng cho Odoo.sh/self-hosted có quyền cài addon; Odoo Online thường không cài addon tùy chỉnh.

Ledger lưu key/fingerprint theo danh tính. Kết quả chưa chắc chắn hoặc timeout không được tự động gửi lại như một thao tác mới. Khi gặp `RESULT_UNKNOWN`, kiểm tra dữ liệu Odoo trước. Không hứa exactly-once tuyệt đối khi phản hồi upstream đã mất.

### Draft, thông báo và đồng bộ

- Draft editor/Chatter scoped theo instance, UID và task trong phiên/tab trình duyệt. Không phải bản lưu bền vững trên server hoặc giữa mọi thiết bị; logout xóa draft.
- Refocus/polling cập nhật truy vấn đọc. Không tự phát lại mutation khi có mạng trở lại.
- Notification link có thể là `/tasks/ID?tab=discussion&message=ID&focus=1` hoặc `/discuss/ID?message=ID`.
- Mỗi message/file/channel phải được kiểm tra đúng association và quyền; không chỉ kiểm ID tồn tại.
- Notification Center không bao phủ mọi sự kiện tùy chỉnh; loại sự kiện hiển thị từ subtype thật.
- HTML phải tiếp tục được sanitize trước khi hiển thị. Download kiểm tra task/file association; không mở file ngoài quyền.

### Hai addon độc lập

`smart_workspace_bridge` bảo vệ cập nhật nguyên tử bằng revision; `smart_workspace_search` chỉ tối ưu tìm tên. Có thể thiếu một addon mà addon kia vẫn hoạt động. Thiếu bridge khóa sửa trực tiếp; thiếu search addon dùng fallback. Không cài addon tự động lên doanh nghiệp khi chạy frontend.

Search addon dùng computed stored field `workspace_search_name`, phụ thuộc name, `compute_sudo=False`, index='trigram'. Đổi tên tự tính lại; không thêm controller/ACL bypass. Quản trị viên kiểm pg_trgm/GIN và khả năng cài trên đúng Odoo17 staging. Odoo Online thường không hỗ trợ addon tùy chỉnh.

### Đo RPC và metadata

`Server-Timing` chỉ chứa số RPC/tổng thời gian. AsyncLocalStorage riêng request, metadata dedup trong một Odoo instance/request/UID, không có cache permission/data lâu giữa người dùng. Tổng `dur` từng RPC có thể lớn hơn wall time vì RPC song song; không cộng sai thành thời gian mở trang. Log không chứa arguments/credential/body nghiệp vụ.

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

### Bật search addon trong DB local đã có

Compose local mới cài `project,smart_workspace_bridge,smart_workspace_search`. DB/volume local cũ chưa có search addon cần cập nhật bằng quy trình quản trị Odoo, không xóa volume. Dừng Odoo đang phục vụ DB trước lần cài module một lần; dùng đúng addons path, DB local `workspace_test` và `-i smart_workspace_search --stop-after-init --no-http`, rồi khởi động lại. Làm theo README addon trong source để tránh chạy hai tiến trình cập nhật cùng DB.

Cloud build Docker gặp DNS EAI_AGAIN có helper `python3 scripts/build-cloud-image.py` dùng cache npm công khai có integrity đã kiểm tra; đây là fallback môi trường, không tắt TLS/checksum. Theo dõi disk trước build; cache của storage driver có thể lớn hơn số SIZE hiển thị. Chỉ dọn cache do tác vụ tạo, giữ volume/ảnh cần rollback.

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
7. Nếu đã được phép cài addon và cần tối ưu tìm kiếm, cài riêng `smart_workspace_search`, kiểm rename/index/record rules và fallback khi thiếu module.
8. Chỉ thử ghi bằng dữ liệu staging được chỉ định. Kiểm hai người sửa cùng task, quyền riêng, thông báo, file và đồng bộ trước khi mở ghi rộng hơn.

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

## 10. Kiểm thử đã thực sự chạy và cách chạy lại

### Bằng chứng của bản UX2

Ứng dụng source `24fbd02205b24d0aeecdc905c488a63aeb6be50f` (app code từ `2525455`, commit sau bổ sung báo cáo/reference). CI mới từ checkout sạch đã **success**:

https://github.com/Phuongle29-01/odoo-workspace/actions/runs/40058906015

| Nhóm                         | Passed | Failed | Skipped | Phạm vi                                                                |
| ---------------------------- | -----: | -----: | ------: | ---------------------------------------------------------------------- |
| Unit Vitest                  |     15 |      0 |       0 | Validation, normalize/filter, preview boundary, isolation RPC          |
| Integration                  |     30 |      0 |       0 | App → Odoo17 XML-RPC + Postgres16 thật                                 |
| Chromium browser             |     54 |      0 |       0 | 5 Odoo thật + 22 UI/accessibility fixture + 27 visual                  |
| **Bộ chính local và CI**     | **99** |  **0** |   **0** | Không dùng lại số 76 cũ                                                |
| Firefox157/build1555 bổ sung |      6 |      0 |       0 | UX2 UI fixture trên Ubuntu24.04 container; chưa phải Odoo doanh nghiệp |

105 ca/engine đạt nếu cộng sáu Firefox vào bộ chính. Lượt 27 visual Chromium trên Ubuntu container cũng đạt, nhưng là lặp cùng ca để đối chiếu renderer, không cộng thêm vào tổng105.

Docker image UX2 local đã build, chạy UID1000, không đóng gói `.env.local`, PDF worker phục vụ200. Image ID được kiểm: `sha256:c64cc3f8c25e6169c37b6bf3c71961053df9bf460bfddbc77ade4994dc0121b8`. Đây là image local, không phải image đã publish lên registry. Tag có thể bị thay ở lần build sau; không suy rằng một máy mới đã có image này.

Integration có hai UID, ACL/search/direct/file, thu hồi quyền, wildcard literal `%_`, tên đổi được index lại, phân trang indexed/children, preview PDF/PNG/reject HTML/IDOR, 85 notification và batched RPC. Giữ các ca authentication/CSRF/revision/concurrent editors/idempotency/RESULT_UNKNOWN/timeout/reconnect/session cũ. Browser thật có seed/dọn riêng1.100 task, fallback tìm tiếp và PDF/ảnh thật.

Host cloud trực tiếp ban đầu không mở profile Firefox; chuyển sang Ubuntu24.04 container và cài dependency hợp lệ rồi6/6 đạt. WebKit host thiếu GTK4/Graphene/Harfbuzz-ICU/Manette/Hyphen/GLES, không coi là pass. Safari/macOS thật chưa thử. npm audit production ghi nhận0 vulnerabilities tại thời điểm kiểm tra; không phải cam kết cho các advisory tương lai.

### Chạy lại local, tuần tự

```bash
npx playwright install chromium
# Linux mới thiếu thư viện: npx playwright install --with-deps chromium
npm run typecheck
npm test
npm run build
# Terminal khác, sau khi dừng dev/app đang chiếm cổng: npm start
npm run test:integration
npm run test:e2e
```

Integration chỉ cho loopback + DB `workspace_test`, có guard ghi và pause/unpause Odoo local để tạo timeout. Không chạy đồng thời integration với browser/performance, không bỏ guard và không đổi đích sang doanh nghiệp. Test admin chỉ dùng tạo/dọn fixture local, runtime vẫn từng UID.

```bash
npm run test:ui
npm run test:visual
npm run test:e2e -- --project=odoo
# Trên host hỗ trợ Firefox, cài browser/deps tương ứng rồi:
CROSS_BROWSER=1 npm run test:e2e -- --project=firefox
# WebKit tùy chọn chỉ khi host/binary/deps được hỗ trợ:
CROSS_BROWSER=1 npm run test:e2e -- --project=webkit
```

Playwright HTML ở `playwright-report`, kết quả/ảnh/diagnostics ở `test-results`. Trace/video nhóm Odoo thật tắt để hạn chế ghi credential; UI/mock giữ trace khi lỗi. CI artifact có thời hạn14 ngày, không xem URL có chữ ký là liên kết bàn giao lâu dài. Không nhúng signed URL vào tài liệu/source.

### Ảnh và visual regression

- 48 ảnh before/after =8 màn hình ×3 viewport ×2 thời điểm, full page; Login, Dashboard, Search, Project List, Task List, Task Detail, Notifications, Discuss.
- Visual regression giữ thêm Project Detail cũ:9 màn hình ×3 viewport =27 comparisons. Viewport1440×900,1366×768,390×844, Chromium theo lockfile, Inter tự host, localevi-VN, timezoneAsia/Ho_Chi_Minh, fixture clock/reduced motion cố định.
- Before/after trong `docs/ux2/before` và `after` là **browser fixture**, không phải ảnh doanh nghiệp. Hai ảnh `docs/ux2/real-local` là attachment thao tác thật trên Odoo local với PDF/PNG tổng hợp; fixture được dọn sau test.
- Baseline riêng `debian-13` và `ubuntu-24.04`, provenance trong thư mục renderer; threshold50px giữ nguyên. Không tự update baseline để che lỗi. Xem expected/actual/diff trước một thay đổi có chủ đích.
- CI đầu UX2 `40057573679` đạt chức năng nhưng18visual failed vì reference thay đổi/thiếu; run sau cập nhật được review `40058906015` đã success. Ubuntu refs mới từ renderer Ubuntu local được ghi nguồn thật, không giả nhận tải được artifact CI khi proxy chặn.
- Có lượt local trung gian bị ENOSPC do Docker build cache; đã dọn cache của tác vụ rồi chạy lại integration và browser trên image mới đạt. Không tính lượt bị ngắt là pass.

Các số đo và kết quả chỉ áp dụng bản/môi trường đã nêu. Sau đổi code hoặc triển khai ở hạ tầng mới, phải chạy lại kiểm tra phù hợp; không trích99/105 làm kết quả mới chưa chạy.

## 11. Hiệu năng UX2 và cách hiểu đúng

Đo API development đã ấm, cùng host cloud, Odoo/Postgres local thật, một UID,3 mẫu sau warmup mỗi truy vấn. Baseline đo trước thiết kế/cài index, đã có telemetry/metadata dedup để quan sát. Sau đo cùng dataset theo chiều giảm, không đồng thời build/integration/browser nặng. Tạo dữ liệu riêng lô50 và dọn sau đo. Không phải benchmark nhiều nhân viên hoặc SLA doanh nghiệp.

| Task trong tập đo | Không khớp trước → sau, trung bình ms | Có khớp trước → sau, trung bình ms | Kết quả trang đầu trước → sau |
| ----------------: | ------------------------------------: | ---------------------------------: | ----------------------------- |
|               100 |                             111 → 116 |                          135 → 152 | 1 →1                          |
|               500 |                               324 →98 |                           332 →143 | 2 →2                          |
|             1.100 |                              551 →105 |                           547 →159 | 2 và continuation →3, hết     |
|             5.000 |                              547 →103 |                           537 →139 | 2 và continuation →4, hết     |
|            10.000 |                              533 →105 |                           559 →118 | 2 và continuation →5, hết     |

Task khớp được đặt ở vị trí95,495,1095,4995,9995. Baseline bounded scan báo continuation đúng, không phải trả sai khẳng định “không có”; sau index tìm đủ khớp trong lượt đầu. Với100 task lần đo sau chậm hơn, không tuyên bố mọi kích thước đều nhanh hơn.

| API                            | RPC trước → sau | Trung bình trước → sau |
| ------------------------------ | --------------: | ---------------------: |
| Dashboard                      |          11 →11 |            237 →324 ms |
| Task Detail API                |            8 →8 |            179 →186 ms |
| Notifications, có task targets |           21 →4 |            415 →144 ms |

Chỉ notification có bằng chứng giảm RPC/latency. Không tuyên bố Dashboard/Task nhanh hơn. Thời gian API chưa bao gồm toàn bộ render tương tác. Số đo production/UI/bundle của bản trước trong tài liệu lịch sử không phải số đo UX2 mới. PDF/editor/Discuss được tải khi cần; chưa đo capacity, throughput hoặc cold-navigation quy mô doanh nghiệp.

Dữ liệu từng mẫu: `docs/measurements/ux2-before.json`, `ux2-after.json`. Harness:

```bash
npx tsx --env-file=.env.local scripts/benchmark-search.ts before
# Cài addon đúng quy trình trên DB local riêng sau baseline, rồi:
npx tsx --env-file=.env.local scripts/benchmark-search.ts after
npx tsx --env-file=.env.local scripts/benchmark-search.ts cleanup
```

`before` yêu cầu DB local dùng một lần chưa có search addon, tạo/giữ dataset và state cho `after`; `after` yêu cầu đã cài addon. Guard từ chối đặt nhãn before khi addon đã có. Không chạy trên DB doanh nghiệp, không gỡ addon/reset volume thật để tái hiện baseline. `BENCHMARK_RUNTIME` mô tả đúng runtime khi đo lại. Không coi số đo một UID là bằng chứng nhân sự đồng thời.

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
- [ ] Search nhiều trang giữ bộ lọc/chọn task khi Back/refresh; phân biệt chưa quét hết và đã hết phạm vi.
- [ ] Focus/toàn bộ bối cảnh, cây thu gọn/mở/tải tiếp và dữ liệu con khác dự án không mất ngữ cảnh.
- [ ] PDF/ảnh preview giữ task/tab, đóng trả focus, download hoạt động; HTML/SVG/ID ngoài quyền không được render.
- [ ] Notifications lọc ngày/loại/dự án/Cần xử lý, tải cũ hơn, không trùng và không báo read khi lưu lỗi.
- [ ] File roundtrip đúng task; giả ID file/task ngoài quyền bị từ chối; giới hạn upload 5 MB được xử lý.
- [ ] Offline/timeout không báo thành công giả, giữ nội dung; online không tự replay mutation chưa chắc chắn.
- [ ] Desktop resize/thu gọn, laptop/mobile tabs, menu bàn phím/focus và không tràn document.
- [ ] HTTPS/cookie Secure, logout/session expiry và trang chẩn đoán hoạt động.
- [ ] Backup/restore và rollback có người chịu trách nhiệm; đánh dấu rõ phần chưa chạy.

Staging dùng dữ liệu được chỉ định và quyền đã cấp. Không đánh dấu checklist này đạt chỉ vì suite fixture local đã pass.

## 13. Kịch bản kiểm thử ít nhất ba nhân viên thật

Trạng thái **NOT STARTED**. Không có số đo, điểm UX hoặc phát biểu của nhân viên được suy diễn từ automation. Dùng staging được ủy quyền, tài liệu thử không chứa bí mật; không chạy seed/mutation suite vào production.

Chuẩn bị ba người: NV1 phụ trách task chung và project A; NV2 làm task chung nhưng không được xem project mật; NV3 người đọc/điều phối với quyền thực tế khác. Quản trị viên ghi lại ma trận quyền đã xác nhận, thiết bị/browser, DB staging, phiên bản app và addon. Nhập credential qua UI/secret manager, không ghi vào phiếu.

Mỗi người làm hai lượt trên bản trước và UX2 cùng bộ task tương đương (đổi thứ tự giữa người thử để giảm hiệu ứng học). Người hướng dẫn đọc yêu cầu, không chỉ nơi nhấp. Bắt đầu đồng hồ khi đọc xong; kết thúc khi người thử xác nhận đúng kết quả. Người quan sát đếm click/phím kích hoạt, nhấp sai, quay về Odoo gốc; không ghi nội dung nhạy cảm.

1. Tìm một nhiệm vụ bằng nửa tiêu đề không dấu, phân biệt tên trùng giữa hai dự án. Nếu chưa quét hết, người thử cần hiểu trạng thái và tìm tiếp.
2. Mở task được giao, xác định dự án hiện tại, giai đoạn, trạng thái, deadline và nhiệm vụ cha (có trường hợp khác dự án).
3. Chuyển Focus/toàn bộ bối cảnh, thu gọn/mở cây; mở một con, browser Back và refresh; kiểm tra bộ lọc tìm kiếm.
4. Xem PDF/ảnh trong nhiệm vụ, tải xuống và đóng để tiếp tục đúng tab. File không hỗ trợ phải có thông báo rõ ràng.
5. Trả lời một bình luận; ngắt mạng trước gửi để kiểm tra lỗi/draft, nối mạng và chủ động gửi lại. Không coi timeout là thành công.
6. Quay về đầu mục công việc; lọc Cần xử lý/dự án/ngày, tải trang thông báo cũ, mở đúng message rồi đánh dấu đã đọc.
7. Tìm lịch sử Discuss, mở message liên kết, thử draft; ghi lại trường hợp phải về Odoo gốc.

Lượt phối hợp NV1/NV2: cùng mở một task, cùng sửa. Một người lưu trước; người sau phải thấy conflict, không mất draft. Kiểm tra comment hiển thị sau polling, phiên độc lập, NV2 không đọc được task/file mật sau khi thu hồi quyền. Kiểm tra qua hai context và ít nhất hai thiết bị nếu có, desktop và mobile 390×844. Firefox và Safari thật ghi phiên bản cụ thể, không suy ra từ Chromium/WebKit.

| Nhân viên | Lượt trước/sau | Tác vụ | Hoàn thành đúng? | Thời gian (s) | Thao tác | Nhấp sai | Về Odoo gốc | Nhận xét nguyên văn |
| --------- | -------------- | ------ | ---------------- | ------------- | -------- | -------- | ----------- | ------------------- |
| NV1       |                |        |                  |               |          |          |             |                     |
| NV2       |                |        |                  |               |          |          |             |                     |
| NV3       |                |        |                  |               |          |          |             |                     |

Sao chép dòng cho từng tác vụ/lượt. Chỉ tổng hợp sau khi đủ dữ liệu thật: tỷ lệ hoàn thành, trung vị thời gian, số thao tác/nhấp sai/về Odoo. Ghi cả trường hợp thất bại và giúp đỡ, không bỏ mẫu để tăng điểm. Hỏi người thử tự đánh giá dễ sử dụng và nêu chỗ gây nhầm, giữ nguyên câu trả lời. Tiêu chí bắt buộc: không lộ quyền, không ghi đè revision cũ, không báo gửi thành công giả, draft được giữ khi lỗi. Các tiêu chí thời gian cần thống nhất với nhóm trước thử, không đặt mục tiêu sau khi xem kết quả.

## 14. Vận hành, rollback và xử lý lỗi

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

## 15. Lưu ý riêng cho Codex cloud và công cụ

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

Bản nháp cloud đã được backend xác nhận lưu ref ứng dụng `24fbd02205b24d0aeecdc905c488a63aeb6be50f`, install script và hướng dẫn khởi động UX2. Lưu draft không áp dụng/publish cấu hình. Chủ môi trường cần lưu và Publish trong cài đặt để dùng cho task sau; restore thực tế vẫn phải xác minh riêng.

## 16. Yêu cầu mẫu để giao cho Codex mới

Có thể gửi file này kèm yêu cầu sau; thay mục tiêu staging/server bằng thông tin thực đã được cấp:

> Bạn tiếp nhận Odoo Smart Workspace trong repository `Phuongle29-01/odoo-workspace`. Đọc toàn bộ file bàn giao và `AGENTS.md`. Lấy đúng nhánh `feature/odoo17-smart-workspace`, đối chiếu baseline `24fbd02205b24d0aeecdc905c488a63aeb6be50f`, bảo toàn thay đổi hiện có. UX2 có search addon, Focus Mode, preview PDF/ảnh, notification pagination và batched RPC; không làm mất các phần này. Đối chiếu CI40058906015 đã success với99 test chính và6 Firefox fixture local, nhưng chỉ báo kết quả mới nếu chính bạn đã chạy lại. Trạng thái staging BLOCKED và nghiên cứu ba nhân viên NOT STARTED vẫn phải ghi đúng. Thực hiện phần cài đặt/kiểm thử/triển khai đã đủ thông tin và đã được ủy quyền, không dừng ở kế hoạch hoặc mockup. Chạy local riêng trước, giữ Odoo là nguồn nghiệp vụ và giữ ACL cá nhân. Thu thập cấu hình staging còn thiếu qua kênh phù hợp, không yêu cầu secret trong chat. Chuẩn bị hoặc triển khai app tập trung theo quyền hiện có; đọc trước, chỉ ghi dữ liệu được chỉ định, kiểm hai nhân viên và xung đột chỉnh sửa. Không dùng admin chung, không seed production, không bỏ atomic bridge/guard test, không thay screenshot baseline để che lỗi. Khi hoàn tất, báo commit/image, URL đã triển khai nếu có, test pass/fail/skipped, bằng chứng và những phần còn chờ thông tin. Không gọi production hoàn tất khi mới chỉ chạy local.

## 17. Nguồn kiểm chứng và ưu tiên công việc tiếp theo

Các liên kết source sau được ghim vào commit ứng dụng đã xác minh, tránh tải nhầm main:

- Mã nguồn: https://github.com/Phuongle29-01/odoo-workspace/tree/24fbd02205b24d0aeecdc905c488a63aeb6be50f/
- README: https://github.com/Phuongle29-01/odoo-workspace/blob/24fbd02205b24d0aeecdc905c488a63aeb6be50f/README.md
- Báo cáo UX2: https://github.com/Phuongle29-01/odoo-workspace/blob/24fbd02205b24d0aeecdc905c488a63aeb6be50f/docs/ux2-report.md
- Kiểm thử: https://github.com/Phuongle29-01/odoo-workspace/blob/24fbd02205b24d0aeecdc905c488a63aeb6be50f/docs/validation.md
- Ảnh trước/sau: https://github.com/Phuongle29-01/odoo-workspace/tree/24fbd02205b24d0aeecdc905c488a63aeb6be50f/docs/ux2
- Performance raw: https://github.com/Phuongle29-01/odoo-workspace/tree/24fbd02205b24d0aeecdc905c488a63aeb6be50f/docs/measurements
- Deployment: https://github.com/Phuongle29-01/odoo-workspace/blob/24fbd02205b24d0aeecdc905c488a63aeb6be50f/docs/deployment.md
- Bridge: https://github.com/Phuongle29-01/odoo-workspace/tree/24fbd02205b24d0aeecdc905c488a63aeb6be50f/addons/smart_workspace_bridge
- Search addon: https://github.com/Phuongle29-01/odoo-workspace/tree/24fbd02205b24d0aeecdc905c488a63aeb6be50f/addons/smart_workspace_search
- Protocol nhân viên: https://github.com/Phuongle29-01/odoo-workspace/blob/24fbd02205b24d0aeecdc905c488a63aeb6be50f/docs/ux2-user-study.md
- PR: https://github.com/Phuongle29-01/odoo-workspace/pull/1
- CI success: https://github.com/Phuongle29-01/odoo-workspace/actions/runs/40058906015

Ưu tiên tiếp theo: có đúng staging và danh tính test; xác minh hai addon/External API/ACL trên Odoo doanh nghiệp; nghiệm thu phối hợp hai người, tổ chức nghiên cứu ít nhất ba nhân viên, kiểm Safari và tải thực trước khi quyết định năng lực production. Chuẩn bị release, secrets, backup/restore, migrations/monitoring phù hợp hạ tầng. Không tự phát sinh một dự án viết lại app hoặc tự mở ghi production từ tài liệu này.

Nếu source đã tiến thêm sau commit được nêu, đọc diff và kiểm thử lại; không reset về bản cũ để làm mất thay đổi người dùng. File này không thay thế bằng chứng vận hành của môi trường đích.
