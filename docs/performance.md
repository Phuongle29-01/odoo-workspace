# Số đo hiệu năng thực tế

Đo lúc `2026-10-23T15:17:56.824Z` bằng production Next standalone, Odoo 17 thật và PostgreSQL 16 cục bộ, Chromium 156, viewport 1440×900. Một người dùng trên cloud chia sẻ tài nguyên; cache trình duyệt đã ấm. Không chạy bộ kiểm thử/build khác trong lúc đo. Đây không phải SLA của máy chủ doanh nghiệp.

## Thời gian giao diện

Đo từ bắt đầu navigation đến heading và dữ liệu hết skeleton; tìm kiếm đo mở URL đã có từ khóa. Mỗi navigation có 5 mẫu; lưu task có 3 mẫu, kết thúc khi nội dung mới đã được tải xác nhận từ Odoo. Độ trễ gõ còn có debounce 250ms (gợi ý)/300ms (tìm kiếm đầy đủ).

| Luồng                   | Trung vị (ms) | Lớn nhất (ms) |
| ----------------------- | ------------: | ------------: |
| Dashboard               |           400 |           410 |
| Search theo URL         |           298 |           408 |
| Task Detail             |           868 |           892 |
| Lưu task và xác nhận UI |           932 |           942 |

## API end-to-end

Bao gồm app, xác minh phiên và các RPC đến Odoo local; 5 mẫu mỗi endpoint.

| Endpoint                       | Trung vị (ms) | Lớn nhất (ms) |
| ------------------------------ | ------------: | ------------: |
| `dashboard`                    |           232 |           252 |
| `tasks?q=kiem%20tra%20ho%20so` |            95 |           113 |
| `tasks/2`                      |           230 |           289 |
| `notifications`                |           351 |           420 |

## Khi dữ liệu tăng

Dataset sinh riêng trong project local với tracking tạo fixture tắt, chia lô 50; đo truy vấn không có kết quả, có lọc project để khảo sát toàn bộ tập được chọn. Dữ liệu được dọn sau đo. UI polling dừng trong thí nghiệm tăng dữ liệu.

| Số task | Trung vị (ms) | Lớn nhất (ms) | Đã quét | Còn phần tiếp theo |
| ------: | ------------: | ------------: | ------: | ------------------ |
|       0 |            50 |            65 |       0 | Không              |
|     100 |           108 |           110 |     100 | Không              |
|     500 |           309 |           324 |     500 | Không              |
|    1100 |           525 |           551 |    1000 | Có, cursor 1000    |

1000 bản ghi/lượt là giới hạn có chủ đích, không phải toàn bộ 1100 bản ghi. Giao diện có Tìm tiếp; tối đa 40 kết quả mỗi trang. Quét accent-insensitive hiện tăng chi phí theo số bản ghi được đọc. Chưa đo tải đồng thời hay dữ liệu doanh nghiệp.

## Bundle và lỗi trình duyệt

- 12 client chunks (gồm editor/route tải khi cần): **1,109,003 byte thô**, **346,845 byte gzip**. Đây là tổng file, không phải lượng tải ban đầu.
- Dashboard ghi nhận **561,852 byte JavaScript** và **53,235 byte CSS** sau giải nén. `jsTransfer=0` ở lượt cache ấm, không có nghĩa app không có bundle.
- **0 uncaught JavaScript errors** trong lượt đo. Trường `failedRequests` của bản đo đầu ghi cả request bị hủy do prefetch/navigation/unmount; không xem danh sách này là toàn bộ lỗi kết nối và không tuyên bố network không lỗi dựa trên nó. Công cụ hiện ghi thêm reason/resource type/HTTP status để phân biệt ở lần đo Docker.

## Điều đã điều chỉnh và ưu tiên tiếp theo

Editor Tiptap và vùng Task/Discuss được lazy load; font được tự host. Truy vấn dùng debounce, pagination và TanStack Query theo phiên, không cache dữ liệu nghiệp vụ dùng chung giữa UID. Chỉ số Dashboard được count bằng ORM thay vì lấy 40 task rồi suy ra tổng. Một lần tạo 600 fixture trong cùng RPC vượt timeout client 15 giây; harness chuyển sang lô 50 và giữ nguyên timeout runtime. Đây là khởi tạo dữ liệu đo, không phải benchmark thao tác nhập công việc của nhân viên.

Số đo API cho thấy Dashboard và Task tốn nhiều vòng RPC metadata/quan hệ; Notification hiện đọc từng message/target. Ưu tiên tiếp theo là batch read có kiểm tra ACL và cache metadata theo instance/UID với cơ chế hết hạn; đo lại trước khi thay đổi. Với hàng chục nghìn task, nên bổ sung chỉ mục tìm không dấu qua addon Odoo và giữ domain/record rules của ORM. Không dùng database index chung bỏ qua ACL hoặc cache lâu không thu hồi quyền.

Chạy lại: production `npm start` hoặc app Docker, sau đó `npm run measure:performance` trong terminal khác, không đồng thời với integration/browser/build. Guard chỉ cho `workspace_test` ở loopback; harness reset giới hạn login fixture local trước đo, không vô hiệu hóa rate limit của app. Kết quả vào `.artifacts/performance.json`, từng mẫu của lần đo trên ở [local-production.json](measurements/local-production.json).

## Đo lại qua app Docker

Lượt đo riêng sau khi các suite dừng, cùng Odoo/Postgres và browser, lúc `2026-10-23T15:26:01.680Z`:

| Luồng                   | Trung vị (ms) | Lớn nhất (ms) |
| ----------------------- | ------------: | ------------: |
| Dashboard               |           431 |           938 |
| Task                    |           885 |           900 |
| Search theo URL         |           314 |           412 |
| Lưu task và xác nhận UI |           418 |           904 |

Diagnostics: **0 lỗi JavaScript**, **0 HTTP >=400**, **0 lỗi request khác**. Có 303 request `net::ERR_ABORTED`, gồm 293 RSC prefetch và phần còn lại là truy vấn đọc bị hủy khi navigation/unmount trong harness. Đây là request bị hủy, không phải RPC ghi thất bại; dữ liệu đầy đủ có reason/type ở [docker-production.json](measurements/docker-production.json). Số lượng prefetch bị hủy cho thấy có thể hạn chế prefetch ở danh sách/điều hướng dày nếu đường truyền doanh nghiệp chậm; cần đo cold navigation trước khi đổi hành vi.
