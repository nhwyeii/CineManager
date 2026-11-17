// Model: bảng movies (kèm trạng thái đang chiếu / sắp chiếu và số suất sắp tới)
const { db } = require('../db');

const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

const SELECT = `SELECT m.*, (SELECT COUNT(*) FROM showtimes s WHERE s.movie_id = m.id AND s.status = 'Pending' AND s.show_date >= ?) AS upcoming FROM movies m`;
// release_date rỗng hoặc <= hôm nay = đang chiếu; sau hôm nay = sắp chiếu
const withState = (m) => Object.assign(m, { state: m.release_date && m.release_date > today() ? 'coming' : 'showing' });

module.exports = {
  findAll: () => db.prepare(SELECT + ' ORDER BY m.title COLLATE NOCASE').all(today()).map(withState),
  findById: (id) => { const m = db.prepare(SELECT + ' WHERE m.id = ?').get(today(), id); return m ? withState(m) : undefined; },
  create: (d) => Number(db.prepare('INSERT INTO movies (title, genre, duration_min, description, age_rating, release_date, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(d.title, d.genre, d.duration_min, d.description, d.age_rating, d.release_date, d.poster_url).lastInsertRowid),
  update: (id, d) => db.prepare('UPDATE movies SET title = ?, genre = ?, duration_min = ?, description = ?, age_rating = ?, release_date = ?, poster_url = ? WHERE id = ?')
    .run(d.title, d.genre, d.duration_min, d.description, d.age_rating, d.release_date, d.poster_url, id),
  remove: (id) => db.prepare('DELETE FROM movies WHERE id = ?').run(id).changes
};
