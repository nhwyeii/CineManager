-- ============================================================
-- CineManager - Script tạo cơ sở dữ liệu (SQLite)
-- 11 bảng: roles, permissions, role_permissions (phân quyền) + users, sessions, rooms,
--          movies, showtimes, bookings, booking_seats, contacts
-- ============================================================
PRAGMA foreign_keys = ON;

-- ===================== PHÂN QUYỀN (RBAC) =====================
-- Vai trò: guest (khách vãng lai, chưa đăng nhập - không có dòng trong users),
--          customer (khách hàng đã đăng ký), staff (nhân viên), manager (quản lý)
CREATE TABLE IF NOT EXISTS roles (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

-- Quyền thao tác: đặt tên theo kiểu <đối tượng>:<hành động>, VD movie:create
CREATE TABLE IF NOT EXISTS permissions (
  code        TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Vai trò nào được quyền gì (bảng nối nhiều-nhiều)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code       TEXT NOT NULL REFERENCES roles(code)       ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

-- Người dùng (mật khẩu lưu dạng băm scrypt, KHÔNG lưu plain text)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' REFERENCES roles(code)
                CHECK (role IN ('customer', 'staff', 'manager')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Phiên đăng nhập (lưu SHA-256 của token, không lưu token gốc)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- Phòng chiếu
CREATE TABLE IF NOT EXISTS rooms (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL UNIQUE COLLATE NOCASE,
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 1000)
);

-- Phim
CREATE TABLE IF NOT EXISTS movies (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  genre        TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 1 AND 600),
  description  TEXT NOT NULL DEFAULT '',
  age_rating   TEXT NOT NULL DEFAULT 'T13' CHECK (age_rating IN ('P', 'T13', 'T16', 'T18')),
  release_date TEXT NOT NULL DEFAULT '',   -- YYYY-MM-DD; sau hôm nay = phim sắp chiếu
  poster_url   TEXT NOT NULL DEFAULT ''    -- để trống thì giao diện tự vẽ poster
);

-- Suất chiếu: 1 phim chiếu ở 1 phòng vào 1 ngày/giờ.
-- UNIQUE(room_id, show_date, show_time) => không trùng lịch trong cùng phòng.
CREATE TABLE IF NOT EXISTS showtimes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id  INTEGER NOT NULL REFERENCES movies(id) ON DELETE RESTRICT,
  room_id   INTEGER NOT NULL REFERENCES rooms(id)  ON DELETE RESTRICT,
  show_date TEXT NOT NULL,                 -- YYYY-MM-DD
  show_time TEXT NOT NULL,                 -- HH:MM
  price     INTEGER NOT NULL CHECK (price >= 0),
  status    TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Done')),
  note      TEXT NOT NULL DEFAULT '',
  poster_url TEXT NOT NULL DEFAULT '',      -- ảnh riêng, rỗng thì dùng poster phim
  UNIQUE (room_id, show_date, show_time)
);

-- Vé đặt. channel = 'online' (khách hàng tự đặt) | 'counter' (nhân viên bán tại quầy: sold_by = nhân viên, customer_phone bắt buộc)
CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
  seats       INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 10),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  channel     TEXT NOT NULL DEFAULT 'online' CHECK (channel IN ('online', 'counter')),
  sold_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_phone TEXT,                       -- SĐT khách: BẮT BUỘC khi bán tại quầy
  customer_name  TEXT,                       -- tên khách vãng lai (bán quầy, khách chưa có tài khoản)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (channel = 'online' OR (customer_phone IS NOT NULL AND customer_phone <> ''))
);

-- Ghế đã đặt của từng vé. UNIQUE(showtime_id, seat_label) => 1 ghế chỉ bán được 1 lần/suất chiếu.
CREATE TABLE IF NOT EXISTS booking_seats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
  seat_label  TEXT NOT NULL,               -- VD: A1, F12
  UNIQUE (showtime_id, seat_label)
);

-- Liên hệ / góp ý
CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_showtimes_date ON showtimes(show_date, show_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user  ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_show  ON bookings(showtime_id);
