// Model: truy vấn tổng hợp cho thống kê (COUNT, SUM, GROUP BY)
const {
  db
} = require('../db');
const one = async sql => await db.prepare(sql).get();
module.exports = {
  async summary() {
    const t = await one(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS done FROM showtimes`);
    const b = await one('SELECT COALESCE(SUM(seats), 0) AS tickets, COALESCE(SUM(total_price), 0) AS revenue, COUNT(*) AS bookings FROM bookings');
    return {
      total: t.total,
      pending: t.pending || 0,
      done: t.done || 0,
      movies: (await one('SELECT COUNT(*) AS n FROM movies')).n,
      rooms: (await one('SELECT COUNT(*) AS n FROM rooms')).n,
      tickets: b.tickets,
      bookings: b.bookings,
      revenue: b.revenue,
      byRoom: await db.prepare('SELECT r.name AS label, COUNT(s.id) AS value FROM rooms r LEFT JOIN showtimes s ON s.room_id = r.id GROUP BY r.id, r.name ORDER BY r.name').all(),
      byGenre: await db.prepare('SELECT m.genre AS label, COUNT(s.id) AS value FROM movies m JOIN showtimes s ON s.movie_id = m.id GROUP BY m.genre ORDER BY value DESC').all(),
      topMovies: await db.prepare(`SELECT TOP (5) m.title AS label, SUM(b.seats) AS value FROM bookings b JOIN showtimes s ON s.id = b.showtime_id
           JOIN movies m ON m.id = s.movie_id GROUP BY m.id, m.title ORDER BY value DESC`).all()
    };
  }
};
