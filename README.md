# CineManager — SQL Server + Windows Authentication

Cấu hình cho server `NHUY\MSSQLSERVER01`, database `CineManager`. Backend dùng tài khoản Windows đang chạy Node.js, qua `mssql/msnodesqlv8`. Không cần `sa` hoặc mật khẩu Windows trong `.env`.

1. Giải nén vào thư mục mới và mở terminal bằng cùng tài khoản đang dùng SSMS.
2. Cài ODBC Driver 18 for SQL Server x64 nếu thiếu.
3. `Copy-Item backend\.env.example backend\.env`
4. `npm install`
5. `npm run db:check`
6. `npm start` → http://localhost:3000.

Đọc `HUONG_DAN.md` để kiểm tra driver ODBC, cấu hình cổng và xử lý lỗi.

**Đã có database và bảng thì không chạy lại các script khởi tạo.** Hai file SQL chỉ dùng cho cài mới vào database trống. Bản này không tự sửa hoặc xóa database hiện có.

`npm test`: test với driver giả lập. Chưa xác minh đăng nhập Windows trên máy thật trong môi trường chỉnh sửa.
