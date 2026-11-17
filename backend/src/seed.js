// Dữ liệu mẫu: nạp database/seed.sql khi bảng users còn trống (npm run seed để tạo lại từ đầu)
const fs = require('fs');
const path = require('path');
const { db, transaction } = require('./db');
const { hashPassword } = require('./utils/security');
const config = require('./config');

function seedIfEmpty() {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return false;
  transaction(() => {
    db.exec(fs.readFileSync(path.join(config.databaseDir, 'seed.sql'), 'utf8'));
    // Mật khẩu quản lý có thể đổi qua ADMIN_PASSWORD trong .env (mặc định Quanly@123)
    db.prepare("UPDATE users SET password_hash = ? WHERE username = 'quanly'").run(hashPassword(config.adminPassword));
  });
  return true;
}

module.exports = { seedIfEmpty };
