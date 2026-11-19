# CineManager — Windows Authentication trên máy Như Ý

Đã đặt mặc định server `NHUY\MSSQLSERVER01`, database `CineManager`. Ứng dụng dùng tài khoản Windows đang chạy Node.js (ví dụ `NHUY\Admin`) thông qua `mssql/msnodesqlv8`. Không nhập mật khẩu Windows và không dùng tài khoản `sa` khi `DB_AUTH=windows`.

## Chạy dự án

1. Giải nén vào thư mục mới. Mở thư mục gốc có `backend`, `frontend`, `database`, `package.json` bằng VS Code.
2. Dùng terminal dưới cùng tài khoản Windows đang đăng nhập SSMS. Chạy `whoami` để xem tài khoản thực tế. Windows Authentication lấy tài khoản của tiến trình Node.js, không lấy tài khoản gõ trong `.env`.
3. Cài Microsoft ODBC Driver 18 for SQL Server x64 nếu chưa có: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
4. Trong PowerShell tại gốc chạy:

```powershell
Copy-Item backend\.env.example backend\.env
npm install
npm run db:check
npm start
```

Nếu đã có `.env`, sửa theo mẫu bên dưới; không dùng lại cấu hình `sa` cũ. `npm install` tại gốc tự cài thư viện backend, bao gồm native driver `msnodesqlv8`. Cần Node.js 22.13+ x64; máy Ý đang dùng Node 24.

```env
PORT=3000
DB_AUTH=windows
DB_SERVER=NHUY
DB_INSTANCE=MSSQLSERVER01
DB_NAME=CineManager
DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
SESSION_DAYS=7
```

Mở http://localhost:3000 sau khi kết nối thành công.

## Database có sẵn

Nếu `CineManager` đã có các bảng dự án, **không chạy lại 2 file tạo database**. Chạy `npm run db:check` trước. Lệnh này chỉ đọc dữ liệu, in database và tài khoản SQL Server đang nhận diện.

Bản code cần các bảng `roles`, `permissions`, `role_permissions`, `users`, `sessions`, `rooms`, `movies`, `showtimes`, `bookings`, `booking_seats`, `contacts` cùng các cột đúng schema. Chỉ thấy tên database trong SSMS chưa xác nhận đủ bảng.

Chỉ khi cài mới vào database trống, chạy trong SSMS theo thứ tự:

1. `database/01_CauTruc_PhanQuyen.sql`: cấu trúc và phân quyền.
2. `database/02_DuLieuMau.sql`: dữ liệu mẫu gốc.

Hai script hiện dùng tên `CineManager`. Không xóa database đang dùng để chạy script. Nếu schema cũ khác bản này, cần đối chiếu trước khi thay đổi.

Tài khoản website mẫu sau khi nạp script: `quanly` / `Quanly@123`; `nhanvien1` / `Nhanvien@123`; `khach` / `Khach@123`. Tài khoản website khác với tài khoản Windows dùng kết nối database.

## Nếu có lỗi

- `Data source name not found`, `IM002`: thiếu driver ODBC hoặc sai tên. Kiểm tra:

```powershell
Get-OdbcDriver | Where-Object { $_.Name -like '*SQL Server*' } | Select-Object Name, Platform
```

Nếu máy chỉ có bản 17 x64, đổi thành `DB_ODBC_DRIVER=ODBC Driver 17 for SQL Server`. Nếu chưa có, cài bản 18 x64 từ Microsoft.

- Lỗi native binding khi cài `msnodesqlv8`: kiểm tra `node -p "process.arch"` là `x64`, lưu toàn bộ log npm để xử lý; không bỏ qua lỗi cài đặt. Có thể cần Visual C++ runtime theo yêu cầu trình cài ODBC.
- Login failed cho tài khoản Windows: chạy `whoami`, xác nhận cùng tài khoản SSMS và có quyền trên `CineManager`. Không điền username/password Windows vào `.env`.
- Không tìm thấy instance/timeout: kiểm tra SQL Server `MSSQLSERVER01` đang chạy, TCP/IP và SQL Server Browser. Nếu dùng cổng cố định, đặt `DB_INSTANCE=` (để trống), thêm `DB_PORT=<cổng thực tế>`.
- Chưa tạo bảng/thiếu phân quyền: kiểm tra danh sách bảng trong SSMS. Không tự chạy lệnh xóa database.
- Sau khi sửa `.env`, dừng và chạy lại Node.js.

## Kiểm thử

`npm test` chạy bộ test với driver giả lập, không xác nhận Windows Authentication trên máy thật. Chưa thử được đăng nhập Windows từ môi trường chỉnh sửa Linux.

`npm --prefix backend run test:integration` tạo database test riêng, nạp script rồi chạy các API tests. Cần tài khoản Windows có quyền tạo/xóa database; công cụ chỉ xóa database test do chính lần chạy tạo ra.

## Đổi lại SQL login khi cần

Bản này vẫn hỗ trợ `DB_AUTH=sql`, `DB_USER`, `DB_PASSWORD`; driver được chọn đồng nhất qua `src/sql-client.js`. Mặc định của bản gửi Ý là Windows Authentication.
