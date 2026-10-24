# UX 2.0 — ảnh trước/sau

Ngày 24/10/2026. 48 ảnh mở bằng Chromium 156 qua ứng dụng production, fixture browser cố định: 8 màn hình × 3 viewport × trước/sau. Đây là **MOCK ONLY** cho dữ liệu trong ảnh, không phải ảnh dữ liệu doanh nghiệp. API fixture chỉ nằm trong tests, không được đóng gói vào runtime. Before được chụp trước khi sửa UX2 tại HEAD `cbcb3ed`; after là ứng dụng UX2 đã build. Đã mở và quan sát ảnh/contact sheet, đồng thời xem ảnh đầy đủ các vùng tìm kiếm, nhiệm vụ và thông báo. Ảnh kiểm thử Odoo thật nằm trong [real-local](real-local) và artifact browser của PR, tách riêng khỏi fixture. Hai ảnh bổ sung dùng PDF/PNG tổng hợp, attachment upload thật vào task local; task/fixture đã dọn sau kiểm thử.

| Viewport | Trước | Sau |
|---|---|---|
| 1440 × 900 | [before/desktop](before/desktop) | [after/desktop](after/desktop) |
| 1366 × 768 | [before/laptop](before/laptop) | [after/laptop](after/laptop) |
| 390 × 844 | [before/mobile](before/mobile) | [after/mobile](after/mobile) |

Trong mỗi thư mục: login.png, dashboard.png, search.png, projects.png, tasks.png, task.png, notifications.png, discuss.png. Chụp full page nên chiều cao file có thể lớn hơn viewport. Project Detail cũ vẫn nằm trong visual regression; tổng cộng 9 màn hình/27 so sánh, không xóa bài cũ.

Quan sát: search ghi rõ kết quả đã tải/phạm vi chưa quét; task có điều khiển tập trung và mở lại bối cảnh; thông báo thêm ngày/dự án/cần xử lý; Discuss hiển thị giờ và lịch sử theo thứ tự cũ → mới. Desktop giữ ba vùng khi mở toàn bộ bối cảnh, laptop hai vùng, mobile dùng tabs. Không phát hiện tràn ngang trong các ảnh; Playwright kiểm tra riêng DOM và WCAG A/AA tự động. Không suy ra điểm UX hay thời gian làm việc của nhân viên từ ảnh fixture.

Baseline visual chỉ được đổi có chủ đích sau khi xem các thay đổi trên. Giữ ngưỡng 50 pixel và bộ tham chiếu riêng theo renderer; CI không cập nhật tự động. Xem [báo cáo UX2](../ux2-report.md) về kiểm thử thật và giới hạn.
