# Rà soát giao diện và hướng dẫn nghiệm thu

Bản cải tiến giữ Next.js 16/React 19, adapter XML-RPC Odoo 17, cơ chế phiên PostgreSQL và addon atomic update hiện có. Mã giao diện được tách thành component dùng chung và các vùng tải khi cần; không đưa mock vào runtime.

## Vấn đề quan sát và thay đổi

| Quan sát ban đầu                                      | Thay đổi có thể kiểm chứng                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Chữ phụ nhỏ, màu nhạt và khoảng cách chưa đồng nhất   | Inter tự host có tiếng Việt; token màu/ngữ nghĩa, khoảng cách 4/8 px, focus rõ, giảm chuyển động                                            |
| Dashboard thiên về điều hướng; dữ liệu đếm chưa đủ    | Endpoint đếm qua ORM theo UID, liên kết chỉ số đến bộ lọc thực tế, công việc cập nhật gần đây và hoạt động                                  |
| Tìm kiếm chưa có gợi ý bàn phím/ngữ cảnh đầy đủ       | Debounce, Ctrl/Cmd+K, ↑/↓/Enter/Escape, highlight không dấu an toàn, stage/state/assignee/project/parent và bộ lọc URL                      |
| Task dùng bố cục cố định                              | Ba vùng ở >=1440px, hai vùng từ 1100px, tab ở màn hình nhỏ; đường chia kéo/phím mũi tên, thu gọn và lưu độ rộng riêng theo tài khoản        |
| Thông báo khó phân biệt trạng thái/loại               | Read/unread, task/Discuss, loại sự kiện lấy trực tiếp từ subtype Odoo; đánh dấu đã đọc và deep link đúng ID                                 |
| Chỉnh sửa cần nhập HTML, nội dung dễ mất khi rời form | Trình soạn thảo định dạng tải khi mở; giữ draft riêng theo instance/UID/task; bỏ draft cần xác nhận; revision gốc không bị refocus thay đổi |
| Chưa có thông tin ngoại tuyến rõ                      | Banner mất mạng/kết nối lại, giữ bản nháp, lỗi ghi không báo thành công, chỉ làm mới truy vấn đọc khi có mạng                               |
| View chỉ tồn tại trong component                      | List/Kanban/Tree có URL, ưu tiên lưu trong PostgreSQL theo danh tính; My Tasks luôn giới hạn UID hiện tại                                   |

Các sửa lỗi qua kiểm thử: bỏ bảng desktop bị hiển thị lặp trên mobile, khống chế tràn ngang, tăng tương phản ngày hoạt động, sửa cấu trúc ARIA option, sửa trả focus sau khi đóng menu mobile và tăng vùng bấm liên kết ngữ cảnh lên tối thiểu 24px. Nút định dạng phản ánh trạng thái selection thật của editor.

## Ảnh và visual regression

Ảnh là ảnh trình duyệt của ứng dụng đang chạy. Dữ liệu ảnh đến từ fixture **chỉ trong tests**, có hai dự án, tên trùng, task ba cấp, comment, thông báo và Discuss; không phải ảnh dữ liệu doanh nghiệp.

- 21 ảnh trước thay đổi ở `docs/ui-before/`: giao diện development tại commit `63a80af`; có thể có chỉ báo development của Next.js.
- 21 ảnh sau/chuẩn so sánh ở `tests/visual/snapshots/`: production, Chromium đi kèm Playwright trong lockfile, Inter tự host, `vi-VN`, `Asia/Ho_Chi_Minh`, thời gian fixture cố định, reduced motion.
- Kích thước viewport: desktop 1440×900, laptop 1366×768, mobile 390×844. Ảnh full-page có thể cao hơn viewport.
- Notification fixture sau được sửa để khớp hợp đồng API trả body dạng plain text; markup hiện trong ảnh notification ban đầu không phải lỗi xử lý HTML của adapter production.
- `toHaveScreenshot()` so sánh mặc định không được ghi lại baseline; sai khác >50 pixel làm test thất bại. CI không tự cập nhật chuẩn. Chỉ tạo/cập nhật có chủ đích sau khi xem ảnh actual/expected/diff, dùng `UPDATE_VISUALS=1 npm run test:visual -- --update-snapshots` (thêm `--grep notifications` nếu chỉ thay màn hình đó).
- Mỗi test ảnh đính kèm screenshot vào HTML report; lỗi UI/mock lưu trace và screenshot. Suite dùng tài khoản Odoo thật tắt trace/video để tránh ghi thông tin xác thực. Diagnostics ghi lỗi JavaScript, console và đường dẫn request lỗi, không ghi body/header xác thực.

| Màn hình      | Desktop                                                    | Laptop                                                    | Mobile                                                    |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Login         | [Ảnh](../tests/visual/snapshots/desktop/login.png)         | [Ảnh](../tests/visual/snapshots/laptop/login.png)         | [Ảnh](../tests/visual/snapshots/mobile/login.png)         |
| Dashboard     | [Ảnh](../tests/visual/snapshots/desktop/dashboard.png)     | [Ảnh](../tests/visual/snapshots/laptop/dashboard.png)     | [Ảnh](../tests/visual/snapshots/mobile/dashboard.png)     |
| Search        | [Ảnh](../tests/visual/snapshots/desktop/search.png)        | [Ảnh](../tests/visual/snapshots/laptop/search.png)        | [Ảnh](../tests/visual/snapshots/mobile/search.png)        |
| Project       | [Ảnh](../tests/visual/snapshots/desktop/project.png)       | [Ảnh](../tests/visual/snapshots/laptop/project.png)       | [Ảnh](../tests/visual/snapshots/mobile/project.png)       |
| Task          | [Ảnh](../tests/visual/snapshots/desktop/task.png)          | [Ảnh](../tests/visual/snapshots/laptop/task.png)          | [Ảnh](../tests/visual/snapshots/mobile/task.png)          |
| Notifications | [Ảnh](../tests/visual/snapshots/desktop/notifications.png) | [Ảnh](../tests/visual/snapshots/laptop/notifications.png) | [Ảnh](../tests/visual/snapshots/mobile/notifications.png) |
| Discuss       | [Ảnh](../tests/visual/snapshots/desktop/discuss.png)       | [Ảnh](../tests/visual/snapshots/laptop/discuss.png)       | [Ảnh](../tests/visual/snapshots/mobile/discuss.png)       |

## Tự kiểm thử A–H trên local

Chạy theo [README](../README.md); hai tài khoản local là `workspace.a@example.test` và `workspace.b@example.test`. Mật khẩu ngẫu nhiên nằm trong `.env.local`; không dùng trên doanh nghiệp. Chỉ thực hiện ghi trên local hoặc staging đã được quản trị viên cho phép.

| Kịch bản         | Các bước và kết quả cần thấy                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A – Search       | Ctrl/Cmd+K → gõ `kiem tra ho so` → thấy dự án, cha, giai đoạn, trạng thái và assignee; ↑/↓ chọn, Enter mở đúng ID. Thử cùng từ có dấu, phần tiêu đề và ID; mở tìm kiếm đầy đủ để lọc.                                                                      |
| B – Breadcrumb   | Mở task con ở Nhà máy B → breadcrumb thể hiện task cha ở Tòa nhà A. Nhấn từng cấp; Quay lại dùng lịch sử, link dự án dùng dự án chứa task, link cha dùng task cha. Với task nhiều cấp, thấy đủ tổ tiên có quyền xem.                                       |
| C – Notification | B gửi bình luận đích cho A qua Odoo. A mở Thông báo → lọc Chưa đọc/Nhiệm vụ/loại sự kiện → bấm → URL có task ID, tab discussion và message ID, bình luận được highlight. Đánh dấu đã đọc rồi kiểm tra bộ lọc Đã đọc.                                       |
| D – Editing      | Mở Chỉnh sửa → sửa mô tả bằng editor, state/stage/deadline/assignee → Lưu → refresh → so sánh Odoo gốc. Hai người mở cùng revision rồi lưu lần lượt: người thứ hai phải thấy conflict, giữ draft và không ghi đè. Dùng Bỏ bản nháp để nạp lại dữ liệu mới. |
| E – Permission   | A thấy `Kiểm tra hồ sơ mật`; B tìm không thấy và mở URL trực tiếp bị từ chối. Kiểm tra bookmark/file của task bị thu hồi quyền cũng không còn đọc được.                                                                                                    |
| F – Sync         | Hai cửa sổ riêng đăng nhập A/B, mở cùng task. B gửi; A thấy qua polling 30 giây hoặc refocus. A phản hồi; B cập nhật. Hai thanh profile vẫn đúng người.                                                                                                    |
| G – Offline      | Mở chỉnh sửa hoặc gõ trao đổi → DevTools Network Offline → lưu/gửi → thấy lỗi, nội dung không bị xóa và không có toast thành công. Online → kiểm tra dữ liệu hiện tại, chủ động lưu/gửi lại. Không có hàng đợi ghi tự động.                                |
| H – URL          | Copy URL task/bình luận sang tab mới cùng phiên → đúng nội dung/breadcrumb. Refresh, Back/Forward, link dự án và giai đoạn đều hoạt động.                                                                                                                  |

Thử kéo đường chia ở desktop; focus đường chia và nhấn ←/→/Home/End. Đóng/mở panel, refresh để kiểm tra lưu. Ở mobile mở menu, Tab vòng trong menu, Escape đóng và trả focus; nội dung sau menu không nhận focus. Thử List/Kanban/Tree, mở My Tasks và đăng nhập tài khoản khác để kiểm tra tùy chọn riêng.

## Đánh giá tám tiêu chí

| Tiêu chí              | Bằng chứng và giới hạn                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clarity               | Nhãn tiếng Việt, trạng thái dữ liệu riêng, stage/state có nhãn từ Odoo. Chưa có nghiên cứu với người dùng thật.                                                  |
| Navigation            | Breadcrumb, URL có tab/filter và link đúng ID; cha/con xuyên dự án được kiểm thử. Tổ tiên bị giới hạn quyền không được suy đoán.                                 |
| Information hierarchy | Task summary, mô tả và trao đổi có vùng riêng; chỉ số dẫn tới công việc thực tế. Chưa có dashboard tùy biến theo vai trò.                                        |
| Visual consistency    | Tokens/shared components, Inter và Lucide; 21 chuẩn ảnh. Chưa kiểm Safari/Firefox.                                                                               |
| Accessibility         | Axe WCAG A/AA gồm tag 2.2, keyboard search/menu/resize và mobile sáng/tối; không xem kết quả tự động là chứng nhận WCAG đầy đủ hoặc thay thế test screen reader. |
| Efficiency            | Ctrl/Cmd+K → Enter; editor mở tại task; view/panel riêng từng nhân viên. Chưa có kéo thả Kanban/bulk edit.                                                       |
| Responsive            | 7 màn hình × 3 viewport, assertion không tràn document; bảng chuyển thẻ và vùng chuyển tab. Chưa thử thiết bị vật lý/zoom 400%.                                  |
| Reliability           | Real Odoo ACL, revision/atomic bridge, offline draft, timeout/idempotency và hai phiên độc lập. Chưa hỗ trợ bus realtime/offline write queue.                    |

## Giới hạn vận hành

Dashboard hiển thị dự án **được phép xem**, chưa suy ra “đang tham gia” từ tên miền hoặc vai trò. Thông báo chưa đọc là inbox task/Discuss được Odoo cấp quyền; chưa có tổng unread của mọi hội thoại Discuss. Notification Center lấy tối đa 80 bản ghi mới nhất và chỉ hiện task/Discuss còn quyền đọc; loại sự kiện (kể cả giao việc khi có) lấy từ subtype thật, không suy đoán từ chuỗi tiêu đề. Chưa bao phủ mọi loại thông báo tùy chỉnh của doanh nghiệp.

Search quét ORM theo UID, tối đa 1000 bản ghi/lượt và trả continuation rõ ràng; mỗi trang tối đa 40 kết quả. Cây theo trang, tổ tiên tối đa 20 cấp, task children/siblings và file/chatter có giới hạn ở adapter. Bộ chọn lọc lấy tối đa 100 dự án/100 giai đoạn/200 nhân viên; dữ liệu lớn cần picker tìm từ xa. Xem số đo ở [performance.md](performance.md) trước khi chọn chỉ mục hoặc tải đồng thời.

Discuss đã đọc/gửi/tìm/deep link hội thoại thật; quản lý thành viên, join/tạo, tệp và unread chi tiết vẫn mở Odoo gốc. Chỉnh sửa task trực tiếp cần addon bridge trên Odoo.sh/self-hosted. Chưa triển khai domain HTTPS production, SSO hoặc nghiệm thu trên hai máy vật lý.

Máy chủ `tabvietnam.vuahethong.com` đã phản hồi phiên bản public Odoo 17 Enterprise. Chưa có database, xác nhận môi trường staging và danh tính test của doanh nghiệp; không đăng nhập/ghi thử lên production. [Cấu hình staging và triển khai nhiều nhân viên](deployment.md).
