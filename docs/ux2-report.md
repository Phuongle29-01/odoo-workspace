# Odoo Smart Workspace UX 2.0 — bàn giao 24/10/2026

Nhánh `feature/odoo17-smart-workspace`; [PR #1](https://github.com/Phuongle29-01/odoo-workspace/pull/1). Nền nghiệm thu trước là `afe5bb9`; UX2 bắt đầu từ `cbcb3ed` (đã thêm tài liệu/export). SHA triển khai chính xác xem đầu PR; không sửa main, không merge/deploy doanh nghiệp trong tác vụ này.

## Trạng thái và phạm vi

| Hạng mục | Trạng thái | Bằng chứng/phạm vi |
|---|---|---|
| Search2, Focus Mode, cây lazy, PDF/ảnh, thông báo, Discuss | DONE LOCAL | Production standalone, Odoo 17 + Postgres 16 thật; tests mới bên dưới |
| Chỉ mục không dấu Odoo 17 | DONE LOCAL | Cài module trên dataset 10.000 task sau khi đo baseline; kiểm tra GIN, rename, wildcard và ACL qua ORM |
| 48 ảnh khảo sát trước/sau, visual và accessibility fixture | MOCK ONLY | [Bộ ảnh](ux2/README.md), dữ liệu tổng hợp browser, không phải dữ liệu doanh nghiệp |
| Staging doanh nghiệp | BLOCKED | URL public/version đã biết; còn thiếu tên DB, xác nhận staging và hai danh tính test được ủy quyền |
| Kiểm thử có người thật, ít nhất ba nhân viên | NOT STARTED | [Kịch bản và phiếu đo](ux2-user-study.md); chưa có điểm hay kết quả do người thử cung cấp |
| Firefox UI fixture | DONE LOCAL | 6/6 ca UX2 đạt trên Firefox157 trong Ubuntu24.04 container; không phải kiểm thử doanh nghiệp |
| WebKit cloud | BLOCKED | Host thiếu thư viện OS; không có kết quả pass |
| Production và Safari thật | NOT STARTED | Không deploy, không seed/ghi doanh nghiệp; WebKit không tương đương nghiệm thu Safari/macOS |

## Các thay đổi chính

- `src/components/smart-search.tsx`: append nhiều trang, dedup ID, phân biệt chưa quét hết/không có kết quả, gợi ý dự án/người phụ trách, lưu số trang và nhiệm vụ chọn vào URL. Back/refresh phục hồi phạm vi đã tải (tự phục hồi tối đa 20 trang; sau đó vẫn tải tay). Hủy truy vấn cũ và kiểm tra URL sau await để phản hồi continuation cũ không ghi đè bộ lọc mới. Ctrl/Cmd+K và ngữ cảnh tên trùng được giữ.
- `addons/smart_workspace_search`, `src/server/workspace.ts`: trường tên chuẩn hóa có trigram index trên task/project; tự phát hiện bằng fields_get. Search_read luôn dùng UID nhân viên, domain lọc và record rules. Thiếu addon, tìm mô tả hoặc khớp quá 1.000 dự án thì giữ bounded scan 1.000 task/lượt, 40 kết quả/trang và continuation. Không cache dữ liệu dùng chung. Từ rất ngắn vẫn có thể tốn chi phí; không lập chỉ mục mô tả/tệp.
- `task-workbench.tsx`, `preferences.ts`, API: Focus từ search/thông báo ưu tiên chi tiết và trao đổi, nút Toàn bộ bối cảnh mở cây trở lại. Tùy chọn riêng tài khoản; URL vẫn có focus/tab/message. Cây hiển thị 12 con trước, mở dần dữ liệu detail tối đa 100, sau đó gọi API keyset 20/lượt có ACL. Cha/con vẫn có thể khác dự án. Chưa virtualization cây tùy ý nhiều tầng trong một lần; mở task con để đi sâu.
- `task-detail.tsx`, `document-preview.tsx`, `pdf-preview.tsx`, `server/preview.ts`, `/pdf-worker`: dialog giữ task/tab, metadata file, Escape và trả focus, download rõ ràng. Server kiểm tra quyền task + quan hệ attachment mỗi lượt, giới hạn preview 5 MB và kiểm tra magic bytes. HTML/SVG/định dạng lạ chỉ download. Ảnh dùng blob, PDF.js 6 render canvas, không render annotation/action/XFA hay HTML của file trong origin; CSP frame/object vẫn none. Worker tĩnh cùng origin được đưa vào standalone tracing. PDF lỗi/timeout có đường tải xuống. Chỉnh sửa tài liệu đồng thời chưa triển khai; mở bằng công cụ phù hợp sau download.
- `workspace.tsx` và notifications API: keyset 80 thông báo/lượt, lọc read/kind/ngày trên server; project/subtype/cần xử lý trên các trang đã tải, có nhắc tải tiếp khi còn dữ liệu. Cần xử lý = thông báo task chưa đọc và task chưa done/canceled, không suy đoán sự kiện mới. Đọc message/target theo nhóm có ORM ACL, dedup trang theo ID; chỉ xác nhận read sau khi Odoo trả thành công. Không coi notification unavailable là hộp thư rỗng. Link vẫn mang đúng message và Focus.
- `discuss.tsx`, `client.ts`: giờ theo múi giờ browser, lịch sử cũ → mới/dedup, tìm kiếm lưu URL, tải tiếp có trạng thái/lỗi, scroll message liên kết và giữ draft khi gửi thất bại. Create/join/member/file/unread vẫn mở Odoo gốc, không dùng private controller.
- `server/rpc-metrics.ts`, `http.ts`, `odoo.ts`: Server-Timing đếm RPC trong AsyncLocalStorage riêng request; metadata dedup trong từng Odoo instance/request/UID, không cache lâu qua request. Không log đối số, nội dung hay credential. `dur` là tổng thời gian từng RPC, có thể lớn hơn wall time khi chạy song song.
- `compose.yaml` cài thêm search addon ở local mới. `next.config.ts`, package/lock thêm PDF worker/dependency, không đổi framework. Tests cũ vẫn được giữ; hai assertion URL được cập nhật để kiểm tra Focus mới. Thêm tests UX2 và hai trang Project List/Task List vào visual/accessibility.

## Kiểm thử mới

Đã chạy mới trên production standalone: typecheck, 15 unit, build thành công; **30 integration đạt, 0 skipped** (không dùng số 27/76 cũ). Gồm tìm kiếm theo chỉ mục/phân trang/escape `%_`/rename, ACL thu hồi với user B, safe preview PDF/PNG/reject HTML/IDOR, children keyset, 85 notification và giới hạn RPC, cùng toàn bộ authentication/revision/idempotency/CSRF/timeout/reconnect cũ.

**99 kiểm thử local bộ chính đạt** = 15 unit + 30 integration + 54 browser, không skipped. Bổ sung **6/6 Firefox UI fixture**, tổng 105 ca/engine đạt; 27 visual lặp trên renderer Ubuntu cũng đạt nhưng không cộng vào tổng. Docker image mới build thành công và chạy runtime UID1000, không đóng gói .env.local; cả integration/browser được chạy lại tuần tự qua image này.

Browser Chromium chạy cả 5 kịch bản Odoo thật (gồm dữ liệu 1.100 task được tạo/dọn riêng, PDF/ảnh thật) và 22 UI/accessibility fixture, 27 visual comparisons. Trạng thái lượt hoàn chỉnh và CI cuối cùng được cập nhật trong [validation.md](validation.md). Baseline không cập nhật tự động; ảnh được xem trước khi thay có chủ đích cho giao diện UX2. Kiểm thử tự động không thay cho đánh giá bằng bàn phím/screen reader và người thật.

Integration pause/unpause Odoo local để tạo timeout, vì vậy luôn chạy tuần tự trước browser/performance. Tài khoản admin chỉ dùng tạo/dọn fixture local; runtime vẫn dùng từng nhân viên. Không có offline write queue/realtime giả; polling 30 giây, lỗi gửi giữ draft và yêu cầu hành động lại có chủ đích.

## Hiệu năng trước/sau

Đo API development đã ấm, cùng cloud host, Odoo/Postgres local thật, một UID, 3 mẫu sau warmup mỗi truy vấn. Baseline đo **trước thiết kế/cài index**, gồm telemetry và metadata dedup để quan sát. Sau đo cùng dataset theo chiều giảm; không chạy build/integration/browser nặng đồng thời. Dữ liệu tăng theo lô 50 và đã dọn. Không phải load test hoặc SLA của doanh nghiệp.

| Số task | Không khớp trước → sau (ms, trung bình) | Có khớp trước → sau (ms, trung bình) | Kết quả trang đầu trước → sau |
|---:|---:|---:|---:|
| 100 | 111 → 116 | 135 → 152 | 1 → 1 |
| 500 | 324 → 98 | 332 → 143 | 2 → 2 |
| 1.100 | 551 → 105 | 547 → 159 | 2 + continuation → 3, hết |
| 5.000 | 547 → 103 | 537 → 139 | 2 + continuation → 4, hết |
| 10.000 | 533 → 105 | 559 → 118 | 2 + continuation → 5, hết |

Không diễn giải 100 task là nhanh hơn: sau chậm hơn trong lần đo này. Các task khớp được đặt ở vị trí 95,495,1095,4995,9995. Baseline chỉ quét 1.000 task đầu và báo continuation đúng; chỉ mục trả đủ các khớp ở lượt đầu. Truy vấn không khớp baseline cũng còn continuation từ mức 1.100, sau index trả phạm vi đầy đủ. Dữ liệu thô: [trước](measurements/ux2-before.json), [sau](measurements/ux2-after.json).

| API | RPC trước → sau | Trung bình trước → sau |
|---|---:|---:|
| Dashboard | 11 → 11 | 237 → 324 ms |
| Task Detail API | 8 → 8 | 179 → 186 ms |
| Notifications (fixture có task targets) | 21 → 4 | 415 → 144 ms |

Chỉ notification có bằng chứng giảm RPC/độ trễ. Không tuyên bố Dashboard/Task nhanh hơn từ các mẫu này. Thời gian ở đây là API, chưa bao gồm toàn bộ render tương tác. Bộ đo UI production cũ trong performance.md là lịch sử, không phải kết quả UX2.

Harness `npx tsx --env-file=.env.local scripts/benchmark-search.ts before|after|cleanup` chỉ cho loopback `workspace_test`. Muốn lặp lại baseline cần DB local dùng một lần chưa cài search addon; before tạo dataset và giữ state để after đo sau khi cài addon. Sau cùng chạy cleanup. Script từ chối gắn nhãn before khi addon đã có. `BENCHMARK_RUNTIME` mô tả đúng runtime khi đo lại. Không gỡ addon/reset DB doanh nghiệp để đo.

## Chạy và nghiệm thu

Làm theo [README](../README.md): Node24, Docker, `npm ci`, `npm run local:prepare`, Compose local db/odoo, `npm run local:seed`, `npm run db:migrate`, `npm run build`, `npm start`. Secret local tự sinh trong `.env.local` không được commit. Local cũ chưa có search addon cần cài theo [README addon](../addons/smart_workspace_search/README.md), không xóa volume. Cloud dùng scripts/cloud-install.sh và docs/cloud-start.md.

Hai người nghiệm thu: đăng nhập A/B ở hai browser context riêng; A xem được task mật, B phải bị từ chối ở search/direct/file. Cùng mở task chung: A lưu trước, B lưu revision cũ phải thấy conflict và còn draft. Gửi comment, chờ polling 30s ở người kia, mở notification đúng message; xem PDF/ảnh, Back về search giữ filter, thử mobile/offline/reconnect. Kịch bản người thật chi tiết có bảng đo trống ở [ux2-user-study.md](ux2-user-study.md).

Staging chỉ bắt đầu khi quản trị viên cung cấp cấu hình DB/hosting và hai danh tính test qua kênh secret phù hợp, xác nhận môi trường/quyền ghi. Cần kiểm tra search addon/bridge, Project/Task/attachment ACL, notification API, Chatter/Discuss/membership và hai người sửa cùng lúc trên đúng Odoo17 enterprise. Chưa có bất kỳ DONE STAGING nào.
