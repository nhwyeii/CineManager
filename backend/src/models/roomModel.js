// Model: bảng rooms
const { db } = require('../db');

module.exports = {
  findAll: () => db.prepare('SELECT * FROM rooms ORDER BY name COLLATE NOCASE').all(),
  findById: (id) => db.prepare('SELECT * FROM rooms WHERE id = ?').get(id),
  create: (d) => Number(db.prepare('INSERT INTO rooms (name, capacity) VALUES (?, ?)').run(d.name, d.capacity).lastInsertRowid),
  update: (id, d) => db.prepare('UPDATE rooms SET name = ?, capacity = ? WHERE id = ?').run(d.name, d.capacity, id),
  remove: (id) => db.prepare('DELETE FROM rooms WHERE id = ?').run(id).changes,
  // Số ghế đã đặt lớn nhất của một suất chiếu trong phòng (để không giảm sức chứa quá thấp)
  maxBookedSeats: (id) => db.prepare(
    `SELECT COALESCE(MAX(t), 0) AS m FROM (SELECT SUM(b.seats) AS t FROM bookings b JOIN showtimes s ON s.id = b.showtime_id WHERE s.room_id = ? GROUP BY s.id)`
  ).get(id).m,
  // Các ghế đã bán (có nhãn) trong mọi suất chiếu của phòng
  bookedLabels: (id) => db.prepare(
    'SELECT DISTINCT bs.seat_label FROM booking_seats bs JOIN showtimes s ON s.id = bs.showtime_id WHERE s.room_id = ?'
  ).all(id).map((r) => r.seat_label)
};
