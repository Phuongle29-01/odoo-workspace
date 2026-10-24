# Kết quả xác minh

## UX2 — 24/10/2026

Typecheck, 15 unit và build production standalone đã chạy thành công. Integration mới: **30 passed, 0 failed, 0 skipped** trên Odoo17/Postgres16 thật. Lượt Chromium đầu: 36 passed/18 visual failed; cả **5 Odoo thật + 22 UI/accessibility** đều đạt. 18 visual khác gồm 12 ảnh UI thay đổi có chủ đích và 6 ảnh mới chưa có reference. Đã xem trước/sau và diff, cập nhật riêng reference Debian có provenance, giữ threshold50; lượt so sánh cuối và CI còn đang thực hiện tại commit này. Không coi lượt visual lỗi là pass.

Xem [báo cáo UX2](ux2-report.md), [48 ảnh trước/sau](ux2/README.md), [performance raw](measurements/ux2-after.json), [phiếu ba nhân viên chưa chạy](ux2-user-study.md). Staging **BLOCKED**, không có xác minh doanh nghiệp mới. Kết quả 76 tests bên dưới là lịch sử.

## Bản UX trước — lịch sử kiểm tra local production

| Kiểm tra                      | Kết quả đã chạy                                                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript + build production | Thành công trên host và Docker Node 24                                                                                                                           |
| Unit                          | **10 passed, 0 failed, 0 skipped**                                                                                                                               |
| Integration API/Odoo thật     | **27 passed, 0 failed, 0 skipped**, chạy lại qua app Docker                                                                                                      |
| Browser toàn bộ trên Docker   | **39 passed, 0 failed, 0 skipped**: 4 Odoo thật, 14 UI/accessibility, 21 visual comparisons **không cập nhật baseline**                                          |
| Accessibility                 | Axe theo WCAG A/AA, gồm tag 2.2, trên 7 màn hình ở desktop sáng/mobile sáng/mobile tối; keyboard menu/search/resize; không phải chứng nhận WCAG đầy đủ           |
| Visual                        | 21 ảnh production cố định viewport/browser/font/fixture/timezone; ảnh trước được lưu riêng, cập nhật chuẩn phải chủ đích                                         |
| Hai nhân viên trên Odoo thật  | Nhận/gửi notification, deep link, polling hai chiều, ACL riêng, conflict giữ draft và tab mới đã chạy                                                            |
| Hiệu năng                     | Đã đo production host và Docker riêng; 0 JS error, 0 HTTP lỗi trong lượt Docker; từng mẫu và giới hạn tại [performance.md](performance.md)                       |
| Image mới                     | `smart-workspace:local`, SHA `7bf8f35843f5a6fe6d8d94fff05b133234deccfea6c7805e97d638f414a30f0d`; UID 1000; không có `.env.local`/`.env.production` trong runtime |
| Secret-value scan             | 0 trùng giá trị secret local trong source và browser JS đã build                                                                                                 |
| Dependency advisory           | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities tại thời điểm chạy                                                                                  |
| CI bản UX                     | Workflow đã bổ sung report/screenshot/diagnostics/trace artifact 14 ngày; trạng thái run cho commit hiện tại xem PR, không suy từ run cũ bên dưới                |

Tổng suite local: **76 passed, 0 failed, 0 skipped**. Trong các vòng phát triển, test phát hiện mobile hiển thị bảng lặp, contrast ngày hoạt động, ARIA lồng phần tử tương tác, vùng bấm nhỏ và focus sau Escape; đã sửa và chạy lại. Vòng tạo/cập nhật ảnh chuẩn được tách khỏi vòng so sánh 21 ảnh đạt ở trên. Sai hợp đồng plain-text notification trong fixture đã được sửa có chủ đích; không sửa adapter production để khớp dữ liệu mock sai.

Kết quả hiện tại không xác nhận nghiệp vụ trên máy chủ doanh nghiệp, tải đồng thời nhiều người dùng, Safari/Firefox, thiết bị vật lý, domain HTTPS production hoặc khôi phục snapshot trong cloud task mới. [Ảnh và hướng dẫn A–H](ux-review.md).

## Sai khác renderer trong CI và cách xử lý

CI 39978725935 trên Ubuntu 24.04.5: 22 browser test đạt, 17 visual test lỗi, 0 skipped. Cả 4 test Odoo thật và 14 test UI/accessibility đều đạt. Các ảnh lỗi có kích thước/bố cục giữ nguyên, lệch 55–227 pixel tập trung ở nét chữ so với Debian 13. Đã xem diff và log runner, giữ ảnh Debian, thêm bộ ảnh riêng Ubuntu có provenance; chọn baseline theo OS và pin CI Ubuntu 24.04. Giữ `maxDiffPixels:50` và không cập nhật baseline tự động. Kết quả run sau sửa được ghi trong PR/CI theo commit mới; không coi run lỗi này là pass.

## Lịch sử xác minh MVP trước bản UX

### Các kiểm tra trước đây

| Kiểm tra                      | Kết quả thực tế                                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` với lockfile         | Thành công; cache ở `/workspace/.cache/npm`                                                                                                                                      |
| `npm run typecheck`           | Thành công                                                                                                                                                                       |
| `npm test`                    | 6 passed, 0 skipped                                                                                                                                                              |
| `npm run build`               | Production build thành công                                                                                                                                                      |
| `npm run test:integration`    | **24 passed, 0 skipped**, app Docker → XML-RPC Odoo 17 thật + PostgreSQL 16                                                                                                      |
| `npm run test:e2e`            | **3 passed**, Chromium: login/search/cha-con/refresh/back, mobile/theme/Ctrl+K, sửa task/gửi Chatter/upload thực                                                                 |
| Startup development           | `npm run dev`, sau đó `npm run test:e2e -- --grep 'login, unaccented'`: 1 passed                                                                                                 |
| Script cài lại                | `bash scripts/cloud-install.sh` thành công; `.env.local` và nội dung fixture được giữ lại                                                                                        |
| Docker image                  | `smart-workspace:local` build thành công bằng `python3 scripts/build-cloud-image.py`; build production và toàn bộ 27 integration/browser checks ở trên chạy trên container này   |
| Quyền image / secret          | Runtime UID 1000; image không có `.env*`; source candidates và browser JS không chứa các secret local đã sinh                                                                    |
| Health                        | `/api/health` trả `status=ok`, `database=ok`; readiness còn được xác minh qua nghiệp vụ thật                                                                                     |
| Dependency advisory           | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities tại thời điểm kiểm tra                                                                                              |
| GitHub Actions (checkout mới) | [Run 39967007750](https://github.com/Phuongle29-01/odoo-workspace/actions/runs/39967007750) **success**, commit `4a3360e`: typecheck/unit/build/integration/browser đều hoàn tất |
| Remote Odoo                   | Public `/xmlrpc/2/common.version` và JSON-RPC version trả `17.0+e-20260908`                                                                                                      |

Integration kiểm tra hai UID riêng, login sai, session expiry/logout, CSRF, title/partial/ID/project/unaccented search, tên trùng, task con khác dự án, record rules, đổi toàn bộ field được hỗ trợ, conflict/race, thay đổi trực tiếp từ Odoo, comment/note đúng subtype, file roundtrip/IDOR, subtask/idempotency, thu hồi quyền và loại bookmark, notification/read/deep link, Discuss membership/read/send/search/message deep link, unknown mutation và timeout/recover. Timeout được tạo bằng pause/unpause container **local**; không thực hiện với máy chủ doanh nghiệp.

## Các lỗi môi trường đã xử lý

- npm mặc định không ghi được cache trong home read-only: chuyển cache vào `/workspace/.cache/npm`.
- Bind mount addon không đọc được vì umask cloud: cấp quyền đọc/traverse cho source addon và file seed; secret vẫn 0600.
- Odoo 17 XML-RPC trả faultCode 3/4 thay vì tên exception trong message: sửa adapter để giữ đúng 403; conflict code 2 được nhận diện riêng.
- `message_unsubscribe` trong fixture có thể trả None không serialize qua XML-RPC: test thu hồi follower bằng ORM write, gỡ cả quyền theo dự án và task.
- BuildKit không phân giải được mạng registry (`EAI_AGAIN`), trong khi npm host dùng được proxy. Build cloud bind cache npm qua named build context rồi `npm ci --offline`; integrity của lockfile vẫn được kiểm tra. Không tắt TLS/chữ ký/checksum.
- Cache các lần build gây đầy ổ đĩa: dọn cache build do tác vụ tạo, chuyển cache npm sang bind mount để giảm sao chép. Giữ nguyên volume DB/Odoo, source và tagged image.

## Chưa xác minh

Chưa đăng nhập hoặc đọc/ghi nghiệp vụ trên `tabvietnam.vuahethong.com`: thiếu tên database, xác nhận production/staging và danh tính test hợp lệ. CI đã chạy thành công trên checkout mới của GitHub Actions. Chưa triển khai domain HTTPS production, kiểm tra trên hai máy vật lý hoặc phục hồi trong một cloud task mới. Các trạng thái này độc lập với việc local app đã chạy và cấu hình đã lưu.

Giới hạn chức năng, chỉ mục/tải tìm kiếm và checklist staging nằm trong [acceptance.md](acceptance.md); không xem public version response là integration test của doanh nghiệp.
