# Kết quả kiểm tra chuyển sang SQL Server

Ngày 19/11/2026.

- Kiểm tra cú pháp JavaScript backend: đạt.
- 11/11 test lớp truy cập SQL Server và HTTP đăng nhập: đạt với driver giả lập (`npm test`).
- 20/20 test API gốc đã chỉnh async/await: đạt trong bộ mô phỏng nội bộ dùng dữ liệu gốc và bộ chuyển truy vấn. Bao gồm tài khoản, phân quyền, CRUD, đặt/hủy ghế, bán quầy, thống kê, ảnh phim/suất chiếu. Kết quả này kiểm tra logic ứng dụng, không xác nhận T-SQL chạy trên SQL Server.
- Chưa chạy tạo database, script SQL, kết nối TCP và bộ API tests trên SQL Server thật do môi trường chỉnh sửa không có dịch vụ SQL Server. Trên máy Windows, chạy 2 script trong SSMS rồi `npm run db:check`; có thể chạy bộ integration theo HUONG_DAN.md.

Bản này tạo database SQL Server mới và nạp dữ liệu mẫu từ script gốc. Không nhập dữ liệu phát sinh riêng trong file SQLite cũ.

## Cập nhật Windows Authentication

Chọn driver theo `DB_AUTH`; dùng trusted connection khi chạy Windows. Mặc định server NHUY, instance MSSQLSERVER01, database CineManager; không gửi user/password SQL trong chế độ Windows. Bổ sung SQL12 kiểm tra cấu hình. Hướng dẫn chuyển sang tài khoản Windows, ODBC 18/17 và giữ nguyên database có sẵn. Chưa thể kiểm tra native driver và Windows Authentication trên máy Windows thực tế.

## Bản tích hợp dùng cho main

Nguồn: CineManageer.zip do Như Ý gửi ngày 20/11/2026. Gồm phần việc của cả nhóm; không phải toàn bộ đóng góp cá nhân Như Ý. Giữ banner màu và bản sửa tham số @cm_arg_N; cập nhật kỳ vọng kiểm thử. Không chứa .env hoặc node_modules. Cập nhật bằng commit thông thường, giữ lịch sử và các nhánh thành viên. Chưa kiểm thử kết nối Windows/SQL Server thật trong môi trường chỉnh sửa.
