-- SQL Server 2017+ / SSMS. Chạy file này trước 02_DuLieuMau.sql.
-- Dùng database mới CineManager; không ghi đè database SQLite cũ.
USE master;
GO
IF DB_ID(N'CineManager') IS NULL CREATE DATABASE CineManager;
GO
USE CineManager;
GO
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
    THROW 50001, N'Database đã có bảng. Không chạy lại script cấu trúc trên database đang dùng.', 1;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE roles (
  code        NVARCHAR(80) PRIMARY KEY,
  name        NVARCHAR(100) NOT NULL,
  description NVARCHAR(MAX) NOT NULL DEFAULT N''
);

CREATE TABLE permissions (
  code        NVARCHAR(80) PRIMARY KEY,
  description NVARCHAR(MAX) NOT NULL
);

CREATE TABLE role_permissions (
  role_code       NVARCHAR(80) NOT NULL REFERENCES roles(code)       ON DELETE CASCADE,
  permission_code NVARCHAR(80) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE users (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  username      NVARCHAR(50) COLLATE Latin1_General_100_CI_AS_SC NOT NULL CONSTRAINT UQ_users_username UNIQUE,
  email         NVARCHAR(254) COLLATE Latin1_General_100_CI_AS_SC NOT NULL CONSTRAINT UQ_users_email UNIQUE,
  full_name     NVARCHAR(100) NOT NULL,
  phone         NVARCHAR(20),
  password_hash NVARCHAR(200) NOT NULL,
  role          NVARCHAR(80) NOT NULL DEFAULT N'customer' REFERENCES roles(code)
                CHECK (role IN (N'customer', N'staff', N'manager')),
  created_at    NVARCHAR(19) NOT NULL DEFAULT (CONVERT(varchar(19), SYSDATETIME(), 120))
);

CREATE TABLE sessions (
  token_hash NVARCHAR(64) PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);

CREATE TABLE rooms (
  id       INT IDENTITY(1,1) PRIMARY KEY,
  name     NVARCHAR(100) COLLATE Latin1_General_100_CI_AS_SC NOT NULL CONSTRAINT UQ_rooms_name UNIQUE,
  capacity INT NOT NULL CHECK (capacity BETWEEN 1 AND 1000)
);

CREATE TABLE movies (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  title        NVARCHAR(200) COLLATE Latin1_General_100_CI_AS_SC NOT NULL CONSTRAINT UQ_movies_title UNIQUE,
  genre        NVARCHAR(100) NOT NULL,
  duration_min INT NOT NULL CHECK (duration_min BETWEEN 1 AND 600),
  description  NVARCHAR(MAX) NOT NULL DEFAULT N'',
  age_rating   NVARCHAR(3) NOT NULL DEFAULT N'T13' CHECK (age_rating IN (N'P', N'T13', N'T16', N'T18')),
  release_date NVARCHAR(10) NOT NULL DEFAULT N'',
  poster_url   NVARCHAR(MAX) NOT NULL DEFAULT N''
);

CREATE TABLE showtimes (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  movie_id  INT NOT NULL REFERENCES movies(id) ON DELETE NO ACTION,
  room_id   INT NOT NULL REFERENCES rooms(id)  ON DELETE NO ACTION,
  show_date NVARCHAR(10) NOT NULL,
  show_time NVARCHAR(5) NOT NULL,
  price     INT NOT NULL CHECK (price >= 0),
  status    NVARCHAR(10) NOT NULL DEFAULT N'Pending' CHECK (status IN (N'Pending', N'Done')),
  note      NVARCHAR(MAX) NOT NULL DEFAULT N'',
  poster_url NVARCHAR(MAX) NOT NULL DEFAULT N'',
  CONSTRAINT UQ_showtimes_room_id UNIQUE (room_id, show_date, show_time)
);

CREATE TABLE bookings (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  showtime_id INT NOT NULL REFERENCES showtimes(id) ON DELETE NO ACTION,
  seats       INT NOT NULL CHECK (seats BETWEEN 1 AND 10),
  total_price INT NOT NULL CHECK (total_price >= 0),
  channel     NVARCHAR(10) NOT NULL DEFAULT N'online' CHECK (channel IN (N'online', N'counter')),
  sold_by     INT REFERENCES users(id) ON DELETE NO ACTION,
  customer_phone NVARCHAR(20),
  customer_name  NVARCHAR(100),
  created_at  NVARCHAR(19) NOT NULL DEFAULT (CONVERT(varchar(19), SYSDATETIME(), 120)),
  CHECK (channel = N'online' OR (customer_phone IS NOT NULL AND customer_phone <> N''))
);

CREATE TABLE booking_seats (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  booking_id  INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  showtime_id INT NOT NULL REFERENCES showtimes(id) ON DELETE NO ACTION,
  seat_label  NVARCHAR(10) NOT NULL,
  CONSTRAINT UQ_booking_seats_showtime_seat UNIQUE (showtime_id, seat_label)
);

CREATE TABLE contacts (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  name       NVARCHAR(100) NOT NULL,
  email      NVARCHAR(254) NOT NULL,
  message    NVARCHAR(MAX) NOT NULL,
  created_at NVARCHAR(19) NOT NULL DEFAULT (CONVERT(varchar(19), SYSDATETIME(), 120))
);

CREATE INDEX idx_showtimes_date ON showtimes(show_date, show_time);
CREATE INDEX idx_bookings_user  ON bookings(user_id);
CREATE INDEX idx_bookings_show  ON bookings(showtime_id);

INSERT INTO roles (code, name, description) VALUES
(N'guest', N'Khách vãng lai', N'Chưa đăng nhập: xem phim, lịch chiếu, sơ đồ ghế, gửi liên hệ, đăng ký / đăng nhập'),
(N'customer', N'Khách hàng', N'Đã đăng nhập: đặt vé, xem / hủy vé của chính mình, sửa hồ sơ'),
(N'staff', N'Nhân viên', N'Bán vé tại quầy (nhập SĐT khách), xem / hủy mọi vé, sửa suất chiếu, đọc liên hệ của khách. Không có vé cá nhân, không gửi liên hệ, không xem thống kê'),
(N'manager', N'Quản lý', N'Toàn quyền: thêm / xóa suất chiếu, phim, phòng, thống kê và doanh thu, người dùng và phân vai trò');

INSERT INTO permissions (code, description) VALUES
(N'movie:view', N'Xem danh sách / chi tiết phim'),
(N'room:view', N'Xem danh sách phòng chiếu'),
(N'showtime:view', N'Xem lịch chiếu và sơ đồ ghế'),
(N'contact:create', N'Gửi liên hệ / góp ý (chỉ khách; nhân viên, quản lý không có)'),
(N'profile:update', N'Sửa hồ sơ, đổi mật khẩu của chính mình'),
(N'booking:create', N'Đặt vé trực tuyến'),
(N'booking:view_own', N'Xem vé của mình'),
(N'booking:cancel_own', N'Hủy vé của mình (trước giờ chiếu)'),
(N'booking:sell_counter', N'Bán vé tại quầy (bắt buộc nhập số điện thoại khách)'),
(N'booking:view_all', N'Xem danh sách vé của mọi khách'),
(N'booking:cancel_any', N'Hủy vé của bất kỳ khách nào (trước giờ chiếu)'),
(N'showtime:create', N'Thêm suất chiếu'),
(N'showtime:update', N'Sửa suất chiếu / đổi trạng thái Đã chiếu'),
(N'showtime:delete', N'Xóa suất chiếu'),
(N'movie:create', N'Thêm phim'),
(N'movie:update', N'Sửa phim'),
(N'movie:delete', N'Xóa phim'),
(N'room:create', N'Thêm phòng chiếu'),
(N'room:update', N'Sửa phòng chiếu'),
(N'room:delete', N'Xóa phòng chiếu'),
(N'contact:view', N'Xem liên hệ của khách'),
(N'contact:delete', N'Xóa liên hệ'),
(N'stats:view', N'Xem trang thống kê'),
(N'stats:revenue', N'Xem doanh thu'),
(N'user:view', N'Xem danh sách người dùng'),
(N'user:change_role', N'Đổi vai trò người dùng (khách hàng / nhân viên / quản lý)'),
(N'admin:access', N'Vào trang quản trị (admin.html)');

INSERT INTO role_permissions (role_code, permission_code) VALUES
(N'guest', N'movie:view'),
(N'guest', N'room:view'),
(N'guest', N'showtime:view'),
(N'guest', N'contact:create'),
(N'customer', N'contact:create'),
(N'customer', N'movie:view'),
(N'customer', N'room:view'),
(N'customer', N'showtime:view'),
(N'customer', N'profile:update'),
(N'customer', N'booking:create'),
(N'customer', N'booking:view_own'),
(N'customer', N'booking:cancel_own'),
(N'staff', N'movie:view'),
(N'staff', N'room:view'),
(N'staff', N'showtime:view'),
(N'staff', N'profile:update'),
(N'staff', N'booking:sell_counter'),
(N'staff', N'booking:view_all'),
(N'staff', N'booking:cancel_any'),
(N'staff', N'showtime:update'),
(N'staff', N'contact:view'),
(N'staff', N'admin:access'),
(N'manager', N'admin:access'),
(N'manager', N'booking:cancel_any'),
(N'manager', N'booking:sell_counter'),
(N'manager', N'booking:view_all'),
(N'manager', N'contact:view'),
(N'manager', N'movie:view'),
(N'manager', N'profile:update'),
(N'manager', N'room:view'),
(N'manager', N'showtime:update'),
(N'manager', N'showtime:view'),
(N'manager', N'showtime:create'),
(N'manager', N'showtime:delete'),
(N'manager', N'movie:create'),
(N'manager', N'movie:update'),
(N'manager', N'movie:delete'),
(N'manager', N'room:create'),
(N'manager', N'room:update'),
(N'manager', N'room:delete'),
(N'manager', N'contact:delete'),
(N'manager', N'stats:view'),
(N'manager', N'stats:revenue'),
(N'manager', N'user:view'),
(N'manager', N'user:change_role');

COMMIT;
GO
