// Model: bảng sessions (phiên đăng nhập)
const { db } = require('../db');

module.exports = {
  create: (hash, userId, expires) => db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hash, userId, expires),
  findUser: (hash) => db.prepare(
    `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`).get(hash),
  remove: (hash) => db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash),
  removeOthers: (userId, currentHash) => db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(userId, currentHash)
};
