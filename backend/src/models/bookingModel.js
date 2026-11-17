// Model: bảng bookings + booking_seats
const { db } = require('../db');
const seats = require('../utils/seats');

const addSeat = db.prepare('INSERT INTO booking_seats (booking_id, showtime_id, seat_label) VALUES (?, ?, ?)');

module.exports = {
  // labels: danh sách ghế cụ thể (đã được kiểm tra hợp lệ / còn trống ở controller)
  // channel: 'online' (khách tự đặt) | 'counter' (nhân viên bán tại quầy, soldBy = id nhân viên)
  // counter = { phone, name } khi bán tại quầy
  create(userId, showtimeId, labels, total, channel = 'online', soldBy = null, counter = {}) {
    const id = Number(db.prepare('INSERT INTO bookings (user_id, showtime_id, seats, total_price, channel, sold_by, customer_phone, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(userId, showtimeId, labels.length, total, channel, soldBy, counter.phone || null, counter.name || null).lastInsertRowid);
    labels.forEach((l) => addSeat.run(id, showtimeId, l));
    return id;
  },
  findByUser: (userId) => db.prepare(
    `SELECT b.id, b.showtime_id, b.seats, b.total_price, b.created_at, s.show_date, s.show_time, s.status,
            m.title AS movie_title, m.genre, m.duration_min, m.age_rating, COALESCE(NULLIF(s.poster_url, ''), m.poster_url) AS poster_url, r.name AS room_name,
            (SELECT group_concat(seat_label, ',') FROM booking_seats bs WHERE bs.booking_id = b.id) AS seat_labels
       FROM bookings b JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id JOIN rooms r ON r.id = s.room_id
      WHERE b.user_id = ? ORDER BY s.show_date DESC, s.show_time DESC, b.id DESC`).all(userId)
    .map((b) => Object.assign(b, {
      code: 'CM' + String(b.id).padStart(6, '0'),
      seat_labels: b.seat_labels ? seats.sortLabels(b.seat_labels.split(',')) : []
    })),
  // Mọi vé (cho nhân viên / quản lý): kèm khách, phim, suất, nhân viên bán
  findAll: () => db.prepare(
    `SELECT b.id, b.seats, b.total_price, b.channel, b.created_at, s.show_date, s.show_time, s.status,
            COALESCE(b.customer_name, u.full_name) AS customer_name, COALESCE(b.customer_phone, u.phone) AS customer_phone, seller.full_name AS sold_by_name,
            m.title AS movie_title, r.name AS room_name,
            (SELECT group_concat(seat_label, ',') FROM booking_seats bs WHERE bs.booking_id = b.id) AS seat_labels
       FROM bookings b JOIN users u ON u.id = b.user_id JOIN showtimes s ON s.id = b.showtime_id
       JOIN movies m ON m.id = s.movie_id JOIN rooms r ON r.id = s.room_id
       LEFT JOIN users seller ON seller.id = b.sold_by
      ORDER BY b.id DESC`).all()
    .map((b) => Object.assign(b, {
      code: 'CM' + String(b.id).padStart(6, '0'),
      seat_labels: b.seat_labels ? seats.sortLabels(b.seat_labels.split(',')) : []
    })),
  // Tìm vé bất kỳ (chỉ dùng cho người có quyền booking:cancel_any)
  findAny: (id) => db.prepare(
    'SELECT b.id, s.show_date, s.show_time, s.status FROM bookings b JOIN showtimes s ON s.id = b.showtime_id WHERE b.id = ?').get(id),
  // Chỉ tìm vé thuộc về userId (không cho xem/hủy vé của người khác)
  findOwn: (id, userId) => db.prepare(
    'SELECT b.id, s.show_date, s.show_time, s.status FROM bookings b JOIN showtimes s ON s.id = b.showtime_id WHERE b.id = ? AND b.user_id = ?').get(id, userId),
  remove: (id) => db.prepare('DELETE FROM bookings WHERE id = ?').run(id).changes
};
