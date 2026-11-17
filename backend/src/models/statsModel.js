// Model: truy vấn tổng hợp cho thống kê (COUNT, SUM, GROUP BY)
const { db } = require('../db');

const one = (sql) => db.prepare(sql).get();

module.exports = {
  summary() {
    const t = one(`SELECT COUNT(*) AS total, SUM(status = 'Pending') AS pending, SUM(status = 'Done') AS done FROM showtimes`);
    const b = one('SELECT COALESCE(SUM(seats), 0) AS tickets, COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS bookings FROM bookings');
    return {
      total: t.total, pending: t.pending || 0, done: t.done || 0,
      movies: one('SELECT COUNT(*) AS n FROM movies').n,
      rooms: one('SELECT COUNT(*) AS n FROM rooms').n,
      tickets: b.tickets, bookings: b.bookings, revenue: b.revenue,
      byRoom: db.prepare('SELECT r.name AS label, COUNT(s.id) AS value FROM rooms r LEFT JOIN showtimes s ON s.room_id = r.id GROUP BY r.id ORDER BY r.name').all(),
      byGenre: db.prepare('SELECT m.genre AS label, COUNT(s.id) AS value FROM movies m JOIN showtimes s ON s.movie_id = m.id GROUP BY m.genre ORDER BY value DESC').all(),
      topMovies: db.prepare(
        `SELECT m.title AS label, SUM(b.seats) AS value FROM bookings b JOIN showtimes s ON s.id = b.showtime_id
           JOIN movies m ON m.id = s.movie_id GROUP BY m.id ORDER BY value DESC LIMIT 5`).all()
    };
  }
};
