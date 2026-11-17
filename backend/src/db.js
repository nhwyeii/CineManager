// Kết nối SQLite (module có sẵn trong Node 22: node:sqlite) và tạo bảng từ schema.sql
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
const db = new DatabaseSync(config.dbFile);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec(fs.readFileSync(path.join(config.databaseDir, 'schema.sql'), 'utf8'));
// Vai trò + quyền (INSERT OR IGNORE nên chạy lại mỗi lần khởi động vẫn an toàn)
db.exec(fs.readFileSync(path.join(config.databaseDir, 'permissions.sql'), 'utf8'));

// Nâng cấp CSDL cũ (tạo từ phiên bản trước): thêm cột mới cho bảng movies
const movieCols = db.prepare('PRAGMA table_info(movies)').all().map((c) => c.name);
[['age_rating', "TEXT NOT NULL DEFAULT 'T13'"], ['release_date', "TEXT NOT NULL DEFAULT ''"], ['poster_url', "TEXT NOT NULL DEFAULT ''"]]
  .forEach(([name, def]) => { if (!movieCols.includes(name)) db.exec('ALTER TABLE movies ADD COLUMN ' + name + ' ' + def); });

const showtimeCols = db.prepare('PRAGMA table_info(showtimes)').all();
if (!showtimeCols.some((column) => column.name === 'poster_url')) {
  db.exec("ALTER TABLE showtimes ADD COLUMN poster_url TEXT NOT NULL DEFAULT ''");
}

// Vé cũ chưa có ghế cụ thể: tự xếp vào các ghế trống đầu tiên để dữ liệu nhất quán
(function backfillSeats() {
  const seats = require('./utils/seats');
  const old = db.prepare(`SELECT b.id, b.seats, b.showtime_id, r.capacity FROM bookings b
      JOIN showtimes s ON s.id = b.showtime_id JOIN rooms r ON r.id = s.room_id
     WHERE NOT EXISTS (SELECT 1 FROM booking_seats x WHERE x.booking_id = b.id) ORDER BY b.id`).all();
  const taken = db.prepare('SELECT seat_label FROM booking_seats WHERE showtime_id = ?');
  const add = db.prepare('INSERT OR IGNORE INTO booking_seats (booking_id, showtime_id, seat_label) VALUES (?, ?, ?)');
  old.forEach((b) => {
    const used = new Set(taken.all(b.showtime_id).map((x) => x.seat_label));
    seats.flat(b.capacity).filter((s) => !used.has(s.label)).slice(0, b.seats).forEach((s) => add.run(b.id, b.showtime_id, s.label));
  });
})();

// Chạy nhiều câu lệnh trong 1 transaction (lỗi thì rollback)
function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Chỉ chạy một lần để người quản lý vẫn có thể bỏ poster sau khi cập nhật.
if (db.prepare('PRAGMA user_version').get().user_version < 1) {
  transaction(() => {
    db.exec(fs.readFileSync(path.join(config.databaseDir, 'sample-posters.sql'), 'utf8'));
    db.exec('PRAGMA user_version = 1');
  });
}

module.exports = { db, transaction };
