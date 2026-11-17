// Bảng định tuyến: URL + phương thức HTTP + quyền truy cập -> controller
// access: 'public' (ai cũng gọi được) hoặc mã quyền trong bảng permissions (VD 'movie:create').
// Vai trò nào có quyền nào: xem database/permissions.sql
const auth = require('../controllers/authController');
const user = require('../controllers/userController');
const movie = require('../controllers/movieController');
const room = require('../controllers/roomController');
const showtime = require('../controllers/showtimeController');
const booking = require('../controllers/bookingController');
const stats = require('../controllers/statsController');
const contact = require('../controllers/contactController');

const routes = [];
function route(method, path, access, handler) {
  const keys = [];
  const regex = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, regex, keys, access, handler });
}

// Xác thực & tài khoản
route('POST', '/api/auth/register', 'public', auth.register);
route('POST', '/api/auth/login', 'public', auth.login);
route('POST', '/api/auth/logout', 'public', auth.logout);
route('GET', '/api/auth/me', 'public', auth.me);
route('PUT', '/api/auth/me', 'profile:update', auth.updateProfile);
route('PUT', '/api/auth/password', 'profile:update', auth.changePassword);

// Phim
route('GET', '/api/movies', 'movie:view', movie.list);
route('GET', '/api/movies/:id', 'movie:view', movie.detail);
route('POST', '/api/movies', 'movie:create', movie.create);
route('PUT', '/api/movies/:id', 'movie:update', movie.update);
route('DELETE', '/api/movies/:id', 'movie:delete', movie.remove);

// Phòng chiếu
route('GET', '/api/rooms', 'room:view', room.list);
route('POST', '/api/rooms', 'room:create', room.create);
route('PUT', '/api/rooms/:id', 'room:update', room.update);
route('DELETE', '/api/rooms/:id', 'room:delete', room.remove);

// Suất chiếu
route('GET', '/api/showtimes', 'showtime:view', showtime.list);
route('GET', '/api/showtimes/:id', 'showtime:view', showtime.detail);
route('GET', '/api/showtimes/:id/seats', 'showtime:view', showtime.seatMap);
route('POST', '/api/showtimes', 'showtime:create', showtime.create);
route('PUT', '/api/showtimes/:id', 'showtime:update', showtime.update);
route('DELETE', '/api/showtimes/:id', 'showtime:delete', showtime.remove);

// Đặt vé
route('POST', '/api/bookings', ['booking:create', 'booking:sell_counter'], booking.create); // khách hàng tự đặt; nhân viên bán quầy (bắt buộc SĐT khách)
route('GET', '/api/bookings/mine', 'booking:view_own', booking.mine);
route('GET', '/api/bookings', 'booking:view_all', booking.list);            // nhân viên / quản lý
route('DELETE', '/api/bookings/:id', ['booking:cancel_own', 'booking:cancel_any'], booking.cancel); // nhân viên hủy được vé mọi khách

// Thống kê, liên hệ, người dùng
route('GET', '/api/stats', 'stats:view', stats.get);
route('POST', '/api/contact', 'contact:create', contact.create);
route('GET', '/api/contacts', 'contact:view', contact.list);
route('DELETE', '/api/contacts/:id', 'contact:delete', contact.remove);
route('GET', '/api/users', 'user:view', user.list);
route('PUT', '/api/users/:id/role', 'user:change_role', user.changeRole);

module.exports = { routes };
