# database/

| File | Nội dung |
|---|---|
| `schema.sql` | Tạo 11 bảng: phân quyền (`roles`, `permissions`, `role_permissions`) + `users`, `sessions`, `rooms`, `movies`, `showtimes`, `bookings`, `booking_seats`, `contacts` (khóa chính, khóa ngoại, ràng buộc) |
| `permissions.sql` | Dữ liệu phân quyền: 4 vai trò (guest, customer, staff, manager), 27 quyền, ma trận `role_permissions`. Chạy mỗi lần khởi động |
| `seed.sql` | Dữ liệu mẫu cho từng bảng: 7 người dùng, 5 phòng, 10 phim, 24 suất chiếu, 14 vé (online + quầy) với 41 ghế, 5 liên hệ. Ngày dùng `date('now', '+N day')` nên luôn mới |
| `reset.js` | `npm run seed`: xóa CSDL cũ rồi nạp lại schema + permissions + seed |
| `cinema.db` | File SQLite, tự sinh khi chạy server lần đầu (không đẩy lên GitHub) |

Tài khoản mẫu: `quanly / Quanly@123`, `nhanvien1 / Nhanvien@123`, `khach / Khach@123`.

Xem ma trận phân quyền bằng SQL:
```sql
SELECT p.code, p.description,
       MAX(rp.role_code = 'guest')    AS guest,
       MAX(rp.role_code = 'customer') AS customer,
       MAX(rp.role_code = 'staff')    AS staff,
       MAX(rp.role_code = 'manager')  AS manager
  FROM permissions p LEFT JOIN role_permissions rp ON rp.permission_code = p.code
 GROUP BY p.code ORDER BY p.code;
```
Vai trò kế thừa: customer có mọi quyền của guest, staff có mọi quyền của customer, manager có mọi quyền của staff.
