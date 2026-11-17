# HƯỚNG DẪN HOÀN THIỆN BÀI TẬP LỚN - CineManager

> Tài liệu này giải thích: (1) vì sao phải sửa web tĩnh, (2) đã sửa gì, (3) cách chạy, (4) đối chiếu từng yêu cầu của rubric, (5) việc cần làm tiếp để nộp bài (báo cáo, slide, video, vấn đáp).

---

## 1. Vì sao không thể nộp bản web tĩnh?

Rubric ghi rõ:

- *"Không được xây dựng toàn bộ ứng dụng bằng HTML/CSS/JavaScript tĩnh mà không có xử lý phía máy chủ."*
- *"Các chức năng CRUD phải được thực hiện thông qua Backend và lưu xuống cơ sở dữ liệu. Không sử dụng dữ liệu giả lập cố định."*
- Bắt buộc có đăng ký / đăng nhập / đăng xuất / phân quyền, ≥ 4 bảng có quan hệ, mật khẩu không lưu plain text.

Bản cũ (dữ liệu trong LocalStorage, không có đăng nhập) chỉ đạt khoảng CLO2 (giao diện) nên rất dễ bị **dưới 50% yêu cầu**. Vì vậy mình giữ nguyên giao diện, màu sắc, dark mode, cách tìm kiếm/lọc/phân trang của nhóm và **thêm backend + CSDL + đăng nhập**.

## 2. Đã thay đổi những gì?

| Trước (web tĩnh) | Sau (web động) |
|---|---|
| Dữ liệu trong LocalStorage của trình duyệt | Dữ liệu trong CSDL SQLite, thao tác qua API |
| `taskService.js` đọc/ghi LocalStorage | `backend/src/controllers/`, `routes/index.js` (API) + `frontend/assets/js/api.js` (gọi API) |
| Không đăng nhập | Đăng ký / đăng nhập / đăng xuất, 2 vai trò Admin và Người dùng |
| "Task" (deadline, priority) | Suất chiếu liên kết Phim + Phòng chiếu, có giá vé, số ghế |
| Lọc phía trình duyệt | Tìm kiếm, lọc, sắp xếp, phân trang xử lý ở server |
| Validate 1 chỗ (client) | Validate cả client (`validation.js`) và server (`backend/src/utils/validate.js`) |
| Export/Import JSON, Clear All | Bỏ (không phù hợp khi dùng CSDL, và Clear All là nguy hiểm khi có phân quyền) |
| Form liên hệ giả lập | Lưu vào bảng `contacts`, admin xem được |
| File `vadilation.js` (gõ sai tên, `tasks.html` gọi `validation.js` nên **không load được**) | Đã đổi thành `validation.js` đúng tên |

Chức năng mới: Đặt vé / hủy vé, trang Tài khoản (sửa hồ sơ, đổi mật khẩu, xem vé), trang Quản trị (phim, phòng, người dùng, liên hệ).

## 3. Cấu trúc thư mục

```
CineManager/
├── frontend/              # GIAO DIỆN (chạy trên trình duyệt)
│   ├── index.html, login.html, register.html, showtimes.html,
│   │   profile.html, admin.html, about.html
│   └── assets/css/style.css, assets/js/*.js
├── backend/               # MÁY CHỦ Node.js theo mô hình MVC
│   ├── server.js          # Điểm vào: nhận request, gọi middleware, chuyển cho controller, trả JSON
│   ├── package.json       # npm start / test / seed
│   ├── .env.example       # Mẫu cấu hình (copy thành .env nếu muốn đổi cổng/mật khẩu admin)
│   ├── src/
│   │   ├── models/        # M: truy vấn SQL từng bảng (userModel, movieModel, showtimeModel, ...)
│   │   ├── controllers/   # C: xử lý nghiệp vụ, kiểm tra dữ liệu, trả kết quả (authController, ...)
│   │   ├── routes/        # Bảng định tuyến: URL + method + quyền -> controller
│   │   ├── middlewares/   # auth.js: xác định người dùng, kiểm tra quyền 401/403
│   │   ├── utils/         # security (băm mật khẩu), validate, http, text
│   │   └── config.js, db.js, seed.js
│   └── tests/api.test.js  # 13 bài kiểm thử tự động
├── database/              # CƠ SỞ DỮ LIỆU
│   ├── schema.sql         # SCRIPT TẠO CSDL (nộp theo yêu cầu "file script tạo CSDL")
│   ├── reset.js           # npm run seed (tạo lại dữ liệu mẫu)
│   └── cinema.db          # file CSDL SQLite, tự sinh khi chạy lần đầu
├── docs/                  # Hình ERD, kiến trúc, use case (dùng cho báo cáo)
├── .vscode/               # Cấu hình VS Code (F5, tasks)
├── package.json           # Lệnh npm start / test / seed chạy ở thư mục gốc
├── .gitignore             # Không đẩy .env, file .db lên GitHub
├── README.md, HUONG_DAN.md, GIT_HUONG_DAN.md
```

### Mô hình MVC trong dự án

| Thành phần | Nằm ở đâu | Làm gì |
|---|---|---|
| **Model** | `backend/src/models/` | Làm việc với CSDL: mỗi file một bảng (câu SQL tham số hóa) |
| **View** | `frontend/` | Giao diện hiển thị cho người dùng (HTML/CSS/JS), nhận dữ liệu JSON từ API |
| **Controller** | `backend/src/controllers/` | Nhận yêu cầu, kiểm tra dữ liệu và nghiệp vụ, gọi Model, trả kết quả |

Luồng một yêu cầu: View (`fetch`) → `routes/index.js` → `middlewares/auth.js` (kiểm tra quyền) → Controller → Model → SQLite, rồi trả JSON về View.
Ví dụ thêm suất chiếu: `POST /api/showtimes` → `showtimeController.create` → `showtimeModel.create`.


## 4. Cách chạy

**Bước 1.** Cài Node.js **bản 22.13 trở lên** (https://nodejs.org, chọn bản LTS). Kiểm tra: `node -v`.
Dự án dùng module SQLite có sẵn của Node 22 nên **không cần `npm install`** và không cần cài thêm gì.

**Bước 2.** Mở thư mục `CineManager` bằng Visual Studio Code (File → Open Folder), nhấn **F5** hoặc mở terminal (`Ctrl + \``) và gõ:
```bash
npm start
```
Mở trình duyệt: http://localhost:3000

**Bước 3.** Đăng nhập thử:

| Vai trò | Tên đăng nhập | Mật khẩu | Làm được gì |
|---|---|---|---|
| Quản lý | `quanly` | `Quanly@123` | Toàn quyền: thêm / xóa suất chiếu, phim, phòng, thống kê và doanh thu, người dùng và đổi vai trò |
| Nhân viên | `nhanvien1`, `nhanvien2` | `Nhanvien@123` | Bán vé tại quầy (nhập SĐT khách), xem / hủy vé của mọi khách, sửa suất chiếu, xem liên hệ |
| Khách hàng | `khach`, `lan`, `minh`, `hoa` | `Khach@123` | Đặt / hủy vé của mình, xem "Vé của tôi", sửa hồ sơ |
| Khách vãng lai | (không đăng nhập) | | Xem phim, lịch chiếu, sơ đồ ghế, gửi liên hệ, đăng ký / đăng nhập |

### Ma trận phân quyền (nguồn: `database/permissions.sql`)

| Chức năng | Khách vãng lai | Khách hàng | Nhân viên | Quản lý |
|---|:-:|:-:|:-:|:-:|
| Xem phim, lịch chiếu, sơ đồ ghế | ✔ | ✔ | ✔ | ✔ |
| Gửi liên hệ (trang "Liên hệ") | ✔ | ✔ | | |
| Sửa hồ sơ, đổi mật khẩu | | ✔ | ✔ | ✔ |
| Đặt vé online, xem và hủy "Vé của tôi" | | ✔ | | |
| Bán vé tại quầy (bắt buộc nhập số điện thoại khách) | | | ✔ | ✔ |
| Xem / hủy vé của mọi khách | | | ✔ | ✔ |
| Sửa suất chiếu, đánh dấu Đã chiếu | | | ✔ | ✔ |
| Đọc liên hệ của khách (tab Liên hệ trong `admin.html`), vào trang `admin.html` | | | ✔ | ✔ |
| Thêm / xóa suất chiếu | | | | ✔ |
| Thêm / sửa / xóa phim (kèm ảnh minh họa tải từ máy hoặc link) và phòng chiếu; xóa liên hệ | | | | ✔ |
| Xem thống kê và doanh thu (trang "Thống kê", thay cho trang Liên hệ) | | | | ✔ |
| Xem người dùng, đổi vai trò | | | | ✔ |

Cách hoạt động: 3 bảng `roles`, `permissions`, `role_permissions` lưu ai được làm gì; mỗi route trong `backend/src/routes/index.js` khai báo mã quyền (VD `movie:create`); `middlewares/auth.js` tra bảng này trước khi chạy. Giao diện chỉ ẩn / hiện nút theo `user.permissions`, còn việc chặn thật sự nằm ở server.

Muốn đổi cổng hoặc mật khẩu quản lý: copy `.env.example` thành `.env` rồi sửa. Muốn xóa sạch dữ liệu: `npm run seed`.

> Lần chạy đầu tiên, server tự tạo file `database/cinema.db` và nạp dữ liệu mẫu (2 tài khoản, 5 phòng, 6 phim, 10 suất chiếu, vài vé).

## 5. Đối chiếu yêu cầu của rubric

### 5.1. 10 nhóm chức năng bắt buộc

| # | Yêu cầu | Đã làm ở đâu |
|---|---|---|
| 1 | Đăng ký | `register.html`, `POST /api/auth/register` |
| 2 | Đăng nhập | `login.html`, `POST /api/auth/login` |
| 3 | Đăng xuất | Menu tên người dùng → Đăng xuất, `POST /api/auth/logout` |
| 4 | Quản lý tài khoản | `profile.html`: sửa họ tên/email/SĐT, đổi mật khẩu |
| 5 | Quản lý dữ liệu (thêm/sửa/xóa/xem) | `showtimes.html` (suất chiếu), `admin.html` (phim, phòng) |
| 6 | Tìm kiếm theo từ khóa | Ô tìm kiếm ở Lịch chiếu và tab Phim (tìm **không dấu**) |
| 7 | Lọc ≥ 1 tiêu chí | Lọc theo trạng thái và phòng chiếu, sắp xếp theo ngày |
| 8 | Phân trang | Lịch chiếu 6 suất/trang, tab Phim 6 dòng/trang (cắt trang ở server) |
| 9 | Phân quyền ≥ 2 vai trò | `admin` và `user`, kiểm tra ở server cho từng API |
| 10 | Thống kê | `about.html`: tổng số, tỷ lệ đã chiếu, theo phòng, phim bán chạy, theo thể loại, doanh thu (chỉ admin) |

### 5.2. Yêu cầu giao diện

| Yêu cầu | Đáp ứng |
|---|---|
| Bố cục thống nhất, có Navigation | Navbar + footer dùng chung, sinh bởi `app.js`, menu thay đổi theo quyền |
| Responsive | Bootstrap grid, navbar thu gọn, bảng cuộn ngang, modal cuộn được |
| Validation | Báo lỗi từng ô, kiểm tra ngay khi gõ |
| Thông báo thêm/sửa/xóa/lỗi | Toast màu xanh/đỏ/vàng, hộp thoại xác nhận khi xóa |
| Dữ liệu rỗng / không tìm thấy | "Chưa có suất chiếu nào" và "Không tìm thấy suất chiếu phù hợp với bộ lọc" |

### 5.3. Cơ sở dữ liệu (`database/schema.sql`)

- **7 bảng** (yêu cầu ≥ 4): `users`, `sessions`, `rooms`, `movies`, `showtimes`, `bookings`, `contacts`.
- Có **khóa chính, khóa ngoại** (`showtimes.movie_id → movies`, `showtimes.room_id → rooms`, `bookings.user_id → users`, `bookings.showtime_id → showtimes`...).
- **Hạn chế trùng lặp**: `UNIQUE(username)`, `UNIQUE(email)`, `UNIQUE(title)` của phim, `UNIQUE(name)` của phòng, `UNIQUE(room_id, show_date, show_time)` để không xếp 2 suất cùng phòng cùng giờ.
- **Nhất quán dữ liệu**: `ON DELETE RESTRICT` nên không xóa được phim/phòng đang có suất chiếu, không xóa được suất đã có vé; `CHECK` giới hạn giá trị (role, status, sức chứa, số vé 1-10...).
- Dữ liệu mẫu: `backend/src/seed.js` (tự chạy lần đầu).

Hình ERD: `docs/erd.png`.

### 5.4. Kỹ thuật và an toàn (mục 6 của rubric)

| Yêu cầu | Cách làm | File |
|---|---|---|
| Mật khẩu không lưu plain text | Băm `scrypt` + salt ngẫu nhiên, so sánh `timingSafeEqual` | `backend/src/utils/security.js`, `middlewares/auth.js` |
| Kiểm tra dữ liệu cả Client và Server | `validation.js` và `backend/src/utils/validate.js` | |
| Xử lý lỗi API / CSDL | Mã lỗi chuẩn 400/401/403/404/409/422/429/500, thông báo tiếng Việt, giao diện có nút "Thử lại" | `backend/src/http.js`, `backend/server.js` |
| Kiểm soát quyền truy cập quản trị | Mỗi route khai báo mã quyền (RBAC: `roles`, `permissions`, `role_permissions`), server tra CSDL trước khi chạy | `backend/src/controllers/`, `routes/index.js`, `backend/server.js` |
| Không lộ thông tin kết nối CSDL | Cấu hình đọc từ `.env` (đã nằm trong `.gitignore`), file `.db` không được web phục vụ | `backend/src/config.js` |
| Không cho thao tác vượt quyền | Khách hàng gọi API nhân viên / quản lý → 403 (chưa đăng nhập → 401); khách hàng chỉ hủy được vé của mình, nhân viên hủy được vé mọi khách; nhân viên không xóa được suất / phim / phòng, không xem được doanh thu; quản lý không tự đổi role của mình; đăng ký luôn là role `customer` dù gửi `role=manager` | |

Bảo vệ thêm (điểm cộng khi vấn đáp): cookie `HttpOnly` + `SameSite=Lax`, lưu SHA-256 của token phiên, giới hạn đăng nhập sai 5 lần/10 phút, chống XSS bằng `escapeHtml`, chống SQL Injection bằng câu lệnh tham số hóa (`?`), chống path traversal khi phục vụ file, header CSP.

### 5.5. Công nghệ - **điểm cần hỏi giảng viên**

Bảng công nghệ trong rubric *đề xuất* Node.js + **Express** hoặc ASP.NET Core, CSDL **SQL Server** hoặc **MongoDB**, và dòng đầu mục 3 ghi *"có thể lựa chọn một trong các công nghệ phù hợp"*. Bản này dùng:

- Node.js **thuần** (module `http`), không dùng Express, vì môi trường mình làm không cài được thư viện ngoài, và như vậy bạn chạy được ngay không cần `npm install`.
- **SQLite** (CSDL quan hệ, có khóa chính/khóa ngoại) thay vì SQL Server/MongoDB.

Đây là chỗ **có rủi ro bị trừ điểm nếu thầy Ngô Việt Anh yêu cầu đúng SQL Server/MongoDB**. Bạn nên nhắn hỏi thầy sớm: *"Nhóm em dùng Node.js + SQLite được không ạ?"*. Nếu thầy không đồng ý:

- Đổi sang SQL Server/MongoDB chỉ cần sửa `backend/src/db.js` và các câu SQL trong `backend/src/controllers/`, `routes/index.js`; giao diện, validate, phân quyền, test giữ nguyên.
- Đổi sang Express: thay hàm `route(...)` và `handleApi` bằng `app.get/post...`, logic bên trong từng route giữ nguyên.
- Nói với mình, mình sẽ viết bản chuyển đổi cho bạn.

## 6. Danh sách API (RESTful)

| Method | Đường dẫn | Quyền | Chức năng |
|---|---|---|---|
| POST | `/api/auth/register` | Công khai | Đăng ký |
| POST | `/api/auth/login` | Công khai | Đăng nhập |
| POST | `/api/auth/logout` | Công khai | Đăng xuất |
| GET | `/api/auth/me` | Công khai | Người dùng hiện tại (hoặc `null`) |
| PUT | `/api/auth/me` | Đăng nhập | Sửa hồ sơ |
| PUT | `/api/auth/password` | Đăng nhập | Đổi mật khẩu |
| GET | `/api/showtimes?q=&status=&room_id=&sort=&page=&limit=` | Công khai | Danh sách suất chiếu (tìm, lọc, sắp xếp, phân trang) |
| GET | `/api/showtimes/:id` | Công khai | Chi tiết |
| PUT | `/api/showtimes/:id` | **Nhân viên, Quản lý** | Sửa suất chiếu |
| POST / DELETE | `/api/showtimes[/:id]` | **Quản lý** | Thêm / xóa suất chiếu |
| GET | `/api/movies?q=&page=` | Công khai | Danh sách phim |
| POST / PUT / DELETE | `/api/movies[/:id]` | **Quản lý** | CRUD phim |
| GET | `/api/rooms` | Công khai | Danh sách phòng |
| POST / PUT / DELETE | `/api/rooms[/:id]` | **Quản lý** | CRUD phòng |
| POST | `/api/bookings` | Khách hàng; Nhân viên, Quản lý | Khách hàng: đặt vé online. Nhân viên / Quản lý: bán tại quầy, **bắt buộc** `customer_phone` (tùy chọn `customer_name`) |
| GET | `/api/bookings/mine` | **Khách hàng** | Vé của tôi (nhân viên, quản lý không có) |
| GET | `/api/bookings` | **Nhân viên, Quản lý** | Mọi vé (khách, kênh online / quầy, nhân viên bán) |
| DELETE | `/api/bookings/:id` | Khách hàng; Nhân viên, Quản lý | Khách hàng: hủy vé của mình. Nhân viên / Quản lý: hủy vé của bất kỳ khách |
| GET | `/api/stats` | **Quản lý** | Thống kê và doanh thu |
| POST | `/api/contact` | Khách, Khách hàng | Gửi liên hệ (nhân viên, quản lý không có) |
| GET | `/api/contacts` | **Nhân viên, Quản lý** | Xem liên hệ |
| DELETE | `/api/contacts/:id` | **Quản lý** | Xóa liên hệ |
| GET | `/api/users` | **Quản lý** | Danh sách người dùng |
| PUT | `/api/users/:id/role` | **Quản lý** | Đổi vai trò |

## 7. Kiểm thử

- `npm test` chạy bộ kiểm thử API (có thêm ma trận quyền Khách / Nhân viên / Quản lý và nghiệp vụ bán vé tại quầy): đăng nhập, đăng ký, mật khẩu đã băm, phân quyền (401/403), CRUD, chống trùng lịch, tìm không dấu/lọc/phân trang, đặt vé hết ghế, ràng buộc khóa ngoại, đổi mật khẩu, đăng xuất, chặn truy cập file ngoài `public`. **Chụp màn hình kết quả này cho báo cáo.**
- Mình cũng đã chạy thử giao diện bằng trình duyệt tự động: đăng nhập sai/đúng, chuyển hướng khi chưa đăng nhập, thêm suất chiếu có báo lỗi và báo trùng lịch, đặt vé, chặn user vào trang admin.
- **Chưa kiểm chứng được:** hiển thị thật của Bootstrap/Chart.js (môi trường mình bị chặn CDN) và responsive trên điện thoại. Bạn hãy tự mở trên máy, bấm F12 → biểu tượng điện thoại để kiểm tra các trang ở khổ 375px trước khi chụp hình.

<a id="8-phan-cong"></a>

## 8. Phân công

| Thành viên | Phần phụ trách |
|---|---|
| TV1 – Nhóm trưởng | Cơ sở dữ liệu, đăng ký, đăng nhập, hồ sơ và phân quyền |
| TV2 | Suất chiếu, phòng chiếu, ảnh riêng của suất và luồng mở form thêm phim từ suất |
| TV3 | Quản lý phim, poster, đặt vé, chọn ghế và bán vé tại quầy |
| TV4 | Thống kê, liên hệ và quản lý người dùng |
| TV5 | Giao diện chung, trang chủ, danh sách và chi tiết phim, tích hợp server và routes, tổng hợp báo cáo |

Mỗi thành viên tự kiểm thử, viết phần báo cáo và chuẩn bị demo chức năng của mình.

## 9. Quy trình Git (CLO4: dùng công cụ hợp lý)

```bash
git checkout -b feature/ten-ban        # hoặc dùng nhánh cũ
git add .
git commit -m "feat: them api dat ve"  # commit nhỏ, thông điệp rõ
git push origin feature/ten-ban        # rồi tạo Pull Request vào main
```
Trước khi push: kiểm tra `git status` **không có** `.env` và `database/*.db`.
Nếu có dùng AI (ChatGPT, Claude...) để hỗ trợ, hãy ghi trung thực trong báo cáo: dùng để làm gì, nhóm đã đọc hiểu và chỉnh sửa gì (CLO4 và CLO5 chấm tính trung thực).

## 10. Báo cáo - dàn ý theo đúng 8 mục rubric

| Mục | Nội dung gợi ý |
|---|---|
| 1. Giới thiệu đề tài, mục tiêu | Rạp phim cần quản lý suất chiếu/vé thay cho ghi sổ; mục tiêu: lịch chiếu, đặt vé, phân quyền, thống kê |
| 2. Khảo sát, phân tích yêu cầu | Đối tượng: Khách, Người dùng, Admin; bảng yêu cầu chức năng (mục 5.1) và phi chức năng (bảo mật, responsive) |
| 3. Sơ đồ Use Case | Dùng `docs/usecase.png` (nếu thầy muốn UML chuẩn, vẽ lại bằng draw.io theo `docs/usecase.mmd`) |
| 4. Sơ đồ ERD | `docs/erd.png`, giải thích khóa chính/ngoại và ràng buộc (mục 5.3) |
| 5. Kiến trúc hệ thống | `docs/kientruc.png`: Trình duyệt → fetch JSON → Node.js (routes, auth, validate) → SQLite. Giải thích mô hình client-server, RESTful |
| 6. Mô tả chức năng | Theo bảng 10 chức năng; mỗi chức năng 1 ảnh + 2-3 dòng |
| 7. Hình ảnh chạy chương trình | Đăng nhập, lịch chiếu, thêm suất (có báo lỗi), đặt vé, trang admin, thống kê, mobile, kết quả `npm test` |
| 8. Đánh giá, hướng phát triển | Đã đạt gì; hạn chế (chưa chọn ghế cụ thể, chưa thanh toán online, SQLite chỉ hợp quy mô nhỏ); hướng: chọn ghế, thanh toán, chuyển SQL Server, triển khai cloud |

Cần nộp đủ 6 thứ: source code, script CSDL (`database/schema.sql` + `backend/src/seed.js`), báo cáo, tài liệu hướng dẫn (chính là file này, sửa lại theo nhóm), slide, video demo.

## 11. Kịch bản video demo (3-5 phút)

1. Mở trang chủ (khách) → Lịch chiếu → tìm "hanh dong" (không dấu) → lọc → chuyển trang.
2. Đăng ký tài khoản mới (thử nhập sai để thấy báo lỗi) → đăng nhập.
3. Đặt vé 2 chỗ → vào "Tài khoản & vé của tôi" → hủy vé → sửa hồ sơ.
4. Thử vào `/admin.html` bằng user thường → thấy 403.
5. Đăng nhập admin → thêm suất chiếu, thử thêm trùng phòng/giờ → báo lỗi → sửa → xóa.
6. Tab Phim/Phòng/Người dùng/Liên hệ → mở trang Thống kê (có doanh thu) → bật dark mode.
7. Chạy `npm test` cho thấy 13 bài đều pass.

## 12. Câu hỏi vấn đáp thường gặp (30% điểm)

1. **Frontend và Backend khác nhau thế nào? Dự án của em chia ra sao?** Frontend (`frontend/`) chạy trên trình duyệt, lo giao diện và gửi `fetch` đến API; Backend (`backend/server.js`, `backend/src/`) chạy trên máy chủ, xử lý nghiệp vụ, kiểm tra quyền và đọc/ghi CSDL.
2. **RESTful API là gì? Ví dụ trong dự án?** Quy ước dùng HTTP method + URL để thao tác tài nguyên: `GET /api/showtimes` lấy danh sách, `POST` thêm, `PUT /:id` sửa, `DELETE /:id` xóa; trả JSON và mã trạng thái chuẩn.
3. **Mật khẩu lưu thế nào?** Không lưu mật khẩu gốc; lưu `salt:hash` bằng scrypt. Khi đăng nhập băm lại mật khẩu nhập vào rồi so sánh.
4. **Đăng nhập hoạt động ra sao?** Đúng mật khẩu thì server tạo token ngẫu nhiên, lưu SHA-256 của token vào bảng `sessions`, gửi token cho trình duyệt qua cookie HttpOnly. Mỗi request sau, server đọc cookie để biết ai đang gọi.
5. **Phân quyền làm ở đâu? Ẩn nút ở giao diện đã đủ chưa?** Chưa đủ, vì ai cũng gọi API trực tiếp được. Nên server kiểm tra quyền ở từng route (`backend/server.js`: 401 chưa đăng nhập, 403 không đủ quyền). Giao diện ẩn nút chỉ để thân thiện.
6. **401 khác 403?** 401: chưa đăng nhập/không xác thực được; 403: đã đăng nhập nhưng không đủ quyền.
7. **Vì sao validate cả client và server?** Client để phản hồi nhanh; server vì dữ liệu từ client có thể bị sửa/giả mạo (Postman, DevTools).
8. **SQL Injection là gì, em chống thế nào?** Chèn mã SQL qua ô nhập. Em dùng câu lệnh tham số hóa `db.prepare('... WHERE id = ?').run(id)` nên dữ liệu không bao giờ bị hiểu là lệnh.
9. **XSS là gì?** Chèn script vào nội dung hiển thị. Em dùng hàm `escapeHtml` mọi dữ liệu người dùng nhập trước khi đưa vào HTML, và có header CSP.
10. **Khóa ngoại để làm gì? Chuyện gì xảy ra khi xóa phim đang có suất chiếu?** Đảm bảo `showtimes.movie_id` luôn trỏ tới phim tồn tại; `ON DELETE RESTRICT` nên CSDL từ chối, API trả 409 kèm thông báo.
11. **Hai người cùng đặt ghế cuối cùng thì sao?** Server kiểm tra số ghế còn lại và ghi vé trong cùng một transaction; Node xử lý đồng bộ phần này nên không bị đặt vượt sức chứa (có test).
12. **Responsive em làm thế nào?** Bootstrap grid (`col-12 col-md-6 col-xl-4`), navbar `navbar-expand-lg`, bảng bọc `table-responsive`, thẻ meta viewport.
13. **Vì sao dùng SQLite, không dùng SQL Server/MongoDB?** Gọn, không cần cài máy chủ CSDL, vẫn là CSDL quan hệ có PK/FK/ràng buộc; muốn đổi chỉ cần sửa tầng `db.js` và câu SQL.
14. **Em đã dùng AI/công cụ nào, ở đâu?** Trả lời trung thực và nói được phần nào nhóm tự hiểu và sửa.

## 13. Checklist trước khi nộp

- [ ] Chạy `npm start` trên **máy sạch** (hoặc thư mục mới giải nén) vẫn lên được
- [ ] `npm test` pass hết, đã chụp màn hình
- [ ] Đã xem từng trang ở khổ điện thoại (375px) và máy tính
- [ ] Hỏi/xác nhận với giảng viên về Node.js + SQLite (mục 5.5)
- [ ] Repo GitHub: không có `.env`, `*.db`; mỗi thành viên có commit của mình
- [ ] Đổi mật khẩu admin trong `.env` nếu deploy công khai
- [ ] Báo cáo đủ 8 mục, slide, video demo, tài liệu hướng dẫn
- [ ] Mỗi thành viên đọc và giải thích được phần mình làm

## 14. Triển khai (không bắt buộc)

Rubric chấp nhận **localhost**, nên chỉ cần chạy `npm start` trên máy lúc báo cáo. Nếu muốn lên cloud (Render, Railway...) cần dịch vụ có ổ đĩa lưu trữ lâu dài vì SQLite là một file; đặt biến môi trường `PORT`, `ADMIN_PASSWORD` trong trang cấu hình của dịch vụ (không ghi vào mã nguồn).
