// Model: bảng users
const { db } = require('../db');

const PUBLIC = 'id, username, email, full_name, phone, role';

module.exports = {
  count: () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
  findPublicById: (id) => db.prepare(`SELECT ${PUBLIC} FROM users WHERE id = ?`).get(id),
  findByLogin: (name) => db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(name, name),
  findCustomerByPhone: (phone) => db.prepare("SELECT id, full_name FROM users WHERE phone = ? AND role = 'customer' ORDER BY id LIMIT 1").get(phone),
  getPasswordHash: (id) => db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id).password_hash,
  create: (u) => Number(db.prepare('INSERT INTO users (username, email, full_name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run(u.username, u.email, u.full_name, u.phone, u.password_hash, u.role).lastInsertRowid),
  updateProfile: (id, d) => db.prepare('UPDATE users SET email = ?, full_name = ?, phone = ? WHERE id = ?').run(d.email, d.full_name, d.phone, id),
  updatePassword: (id, hash) => db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id),
  list: () => db.prepare('SELECT id, username, email, full_name, phone, role, created_at FROM users ORDER BY id').all(),
  updateRole: (id, role) => db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id).changes
};
