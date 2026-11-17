-- ============================================================
-- CineManager - PHÂN QUYỀN theo vai trò (RBAC)
-- Dữ liệu cấu hình bắt buộc của hệ thống: chạy mỗi lần khởi động (INSERT OR IGNORE nên chạy lại không lỗi).
-- Server đọc bảng role_permissions để quyết định ai được gọi API nào (xem backend/src/middlewares/auth.js).
--
--  guest    = Khách vãng lai (chưa đăng nhập)
--  customer = Khách hàng (đã đăng ký tài khoản)
--  staff    = Nhân viên rạp
--  manager  = Quản lý (toàn quyền)
-- ============================================================

INSERT OR IGNORE INTO roles (code, name, description) VALUES
  ('guest',    'Khách vãng lai', 'Chưa đăng nhập: xem phim, lịch chiếu, sơ đồ ghế, gửi liên hệ, đăng ký / đăng nhập'),
  ('customer', 'Khách hàng',     'Đã đăng nhập: đặt vé, xem / hủy vé của chính mình, sửa hồ sơ'),
  ('staff',    'Nhân viên',      'Bán vé tại quầy (nhập SĐT khách), xem / hủy mọi vé, sửa suất chiếu, đọc liên hệ của khách. Không có vé cá nhân, không gửi liên hệ, không xem thống kê'),
  ('manager',  'Quản lý',        'Toàn quyền: thêm / xóa suất chiếu, phim, phòng, thống kê và doanh thu, người dùng và phân vai trò');

INSERT OR IGNORE INTO permissions (code, description) VALUES
  -- Xem nội dung công khai
  ('movie:view',          'Xem danh sách / chi tiết phim'),
  ('room:view',           'Xem danh sách phòng chiếu'),
  ('showtime:view',       'Xem lịch chiếu và sơ đồ ghế'),
    ('contact:create',      'Gửi liên hệ / góp ý (chỉ khách; nhân viên, quản lý không có)'),
  -- Tài khoản cá nhân
  ('profile:update',      'Sửa hồ sơ, đổi mật khẩu của chính mình'),
  -- Vé
  ('booking:create',      'Đặt vé trực tuyến'),
  ('booking:view_own',    'Xem vé của mình'),
  ('booking:cancel_own',  'Hủy vé của mình (trước giờ chiếu)'),
  ('booking:sell_counter','Bán vé tại quầy (bắt buộc nhập số điện thoại khách)'),
  ('booking:view_all',    'Xem danh sách vé của mọi khách'),
  ('booking:cancel_any',  'Hủy vé của bất kỳ khách nào (trước giờ chiếu)'),
  -- Suất chiếu
  ('showtime:create',     'Thêm suất chiếu'),
  ('showtime:update',     'Sửa suất chiếu / đổi trạng thái Đã chiếu'),
  ('showtime:delete',     'Xóa suất chiếu'),
  -- Phim, phòng
  ('movie:create',        'Thêm phim'),
  ('movie:update',        'Sửa phim'),
  ('movie:delete',        'Xóa phim'),
  ('room:create',         'Thêm phòng chiếu'),
  ('room:update',         'Sửa phòng chiếu'),
  ('room:delete',         'Xóa phòng chiếu'),
  -- Liên hệ
  ('contact:view',        'Xem liên hệ của khách'),
  ('contact:delete',      'Xóa liên hệ'),
  -- Hệ thống
  ('stats:view',          'Xem trang thống kê'),
  ('stats:revenue',       'Xem doanh thu'),
  ('user:view',           'Xem danh sách người dùng'),
  ('user:change_role',    'Đổi vai trò người dùng (khách hàng / nhân viên / quản lý)'),
  ('admin:access',        'Vào trang quản trị (admin.html)');

-- ---------- Khách vãng lai ----------
INSERT OR IGNORE INTO role_permissions (role_code, permission_code) VALUES
  ('guest', 'movie:view'), ('guest', 'room:view'), ('guest', 'showtime:view'), ('guest', 'contact:create');

-- ---------- Khách hàng = Khách vãng lai + đặt vé / vé của mình ----------
INSERT OR IGNORE INTO role_permissions (role_code, permission_code)
  SELECT 'customer', permission_code FROM role_permissions WHERE role_code = 'guest';
INSERT OR IGNORE INTO role_permissions (role_code, permission_code) VALUES
  ('customer', 'profile:update'), ('customer', 'booking:create'),
  ('customer', 'booking:view_own'), ('customer', 'booking:cancel_own');

-- ---------- Nhân viên: nghiệp vụ quầy vé (KHÔNG có "vé của tôi", KHÔNG xem thống kê, KHÔNG thêm suất chiếu) ----------
INSERT OR IGNORE INTO role_permissions (role_code, permission_code)
  SELECT 'staff', permission_code FROM role_permissions WHERE role_code = 'guest' AND permission_code <> 'contact:create';  -- gửi liên hệ chỉ dành cho khách
INSERT OR IGNORE INTO role_permissions (role_code, permission_code) VALUES
  ('staff', 'profile:update'),
  ('staff', 'booking:sell_counter'), ('staff', 'booking:view_all'), ('staff', 'booking:cancel_any'),
  ('staff', 'showtime:update'), ('staff', 'contact:view'), ('staff', 'admin:access');

-- ---------- Quản lý = Nhân viên + toàn bộ quyền quản trị ----------
INSERT OR IGNORE INTO role_permissions (role_code, permission_code)
  SELECT 'manager', permission_code FROM role_permissions WHERE role_code = 'staff';
INSERT OR IGNORE INTO role_permissions (role_code, permission_code) VALUES
  ('manager', 'showtime:create'), ('manager', 'showtime:delete'),
  ('manager', 'movie:create'), ('manager', 'movie:update'), ('manager', 'movie:delete'),
  ('manager', 'room:create'),  ('manager', 'room:update'),  ('manager', 'room:delete'),
  ('manager', 'contact:delete'), ('manager', 'stats:view'), ('manager', 'stats:revenue'),
  ('manager', 'user:view'), ('manager', 'user:change_role');

-- Xem ma trận phân quyền (chạy thử):
--   SELECT p.code, p.description,
--          MAX(rp.role_code = 'guest') AS guest, MAX(rp.role_code = 'customer') AS customer,
--          MAX(rp.role_code = 'staff') AS staff, MAX(rp.role_code = 'manager') AS manager
--     FROM permissions p LEFT JOIN role_permissions rp ON rp.permission_code = p.code GROUP BY p.code ORDER BY p.code;
