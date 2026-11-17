// Model: bảng showtimes (kèm thông tin phim, phòng, số ghế đã đặt)
const { db } = require('../db');

const SELECT = `
  SELECT s.id, s.movie_id, s.room_id, s.show_date, s.show_time, s.price, s.status, s.note,
         m.title AS movie_title, m.genre, m.duration_min, m.age_rating, s.poster_url AS show_poster_url,
         COALESCE(NULLIF(s.poster_url, ''), m.poster_url) AS poster_url,
         r.name AS room_name, r.capacity,
         COALESCE((SELECT SUM(b.seats) FROM bookings b WHERE b.showtime_id = s.id), 0) AS booked
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    JOIN rooms  r ON r.id = s.room_id`;

module.exports = {
  findAll: () => db.prepare(SELECT).all(),
  findById: (id) => db.prepare(SELECT + ' WHERE s.id = ?').get(id),
  findRaw: (id) => db.prepare('SELECT * FROM showtimes WHERE id = ?').get(id),
  bookedSeats: (id) => db.prepare('SELECT COALESCE(SUM(seats), 0) AS n FROM bookings WHERE showtime_id = ?').get(id).n,
  takenSeats: (id) => db.prepare('SELECT seat_label FROM booking_seats WHERE showtime_id = ?').all(id).map((r) => r.seat_label),
  create: (d) => Number(db.prepare('INSERT INTO showtimes (movie_id, room_id, show_date, show_time, price, status, note, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(d.movie_id, d.room_id, d.show_date, d.show_time, d.price, d.status, d.note, d.poster_url).lastInsertRowid),
  update: (id, d) => db.prepare('UPDATE showtimes SET movie_id = ?, room_id = ?, show_date = ?, show_time = ?, price = ?, status = ?, note = ?, poster_url = ? WHERE id = ?')
    .run(d.movie_id, d.room_id, d.show_date, d.show_time, d.price, d.status, d.note, d.poster_url, id),
  remove: (id) => db.prepare('DELETE FROM showtimes WHERE id = ?').run(id).changes
};
