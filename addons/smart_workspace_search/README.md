# Accent Independent Search — Odoo 17

Addon tùy chọn cho `project.task` và `project.project`. Lưu `workspace_search_name` từ `name`: Unicode NFD, bỏ combining marks, đổi đ → d, chữ thường. Odoo 17 tạo GIN trigram index bằng `index='trigram'`. Không thêm route/controller, ACL hay `sudo`; ứng dụng tìm qua ORM bằng UID nhân viên. Đổi tên tự tính lại trường. Không lập chỉ mục mô tả/attachment hoặc dùng bảng PostgreSQL bổ trợ để giữ dữ liệu nghiệp vụ.

Local Compose mới cài cả project, smart_workspace_bridge và addon này. Với local đã có DB, cập nhật bằng quy trình quản trị Odoo; dừng tiến trình Odoo đang phục vụ DB trước khi chạy `odoo -d workspace_test -i smart_workspace_search --stop-after-init --no-http` với addons path hiện tại, rồi khởi động lại. Không xóa volume để cập nhật.

Staging Odoo.sh/self-hosted: quản trị viên backup, copy addon, cập nhật danh sách và cài theo quy trình được duyệt, kiểm tra index/rename/ACL với hai nhân viên. Không cài vào production trong tác vụ này. Odoo Online không cho addon tùy chỉnh: ứng dụng tự dùng bounded ORM scan/continuation. Tìm trong mô tả cũng giữ scan tối đa 1000 task/lượt, 40 kết quả/trang. Nếu tên dự án khớp >1000 dự án, fallback tránh trả kết quả thiếu mà gọi là đầy đủ.

Chỉ mục không thay quyền: mọi search_read vẫn áp domain, ACL và record rules. Không có cache kết quả chung giữa tài khoản. Trigram với từ rất ngắn có thể vẫn tốn chi phí quét; số đo local không phải SLA doanh nghiệp. Gỡ addon làm ứng dụng trở lại fallback, không ảnh hưởng bridge revision.
