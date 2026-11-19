// Model: bảng users
const {
  db
} = require('../db');
const PUBLIC = 'id, username, email, full_name, phone, role';
module.exports = {
  count: async () => (await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n,
  findPublicById: async id => await db.prepare(`SELECT ${PUBLIC} FROM users WHERE id = ?`).get(id),
  findByLogin: async name => await db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(name, name),
  findCustomerByPhone: async phone => await db.prepare("SELECT TOP (1) id, full_name FROM users WHERE phone = ? AND role = 'customer' ORDER BY id").get(phone),
  getPasswordHash: async id => (await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id)).password_hash,
  create: async u => Number((await db.prepare('INSERT INTO users (username, email, full_name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(u.username, u.email, u.full_name, u.phone, u.password_hash, u.role)).lastInsertRowid),
  updateProfile: async (id, d) => await db.prepare('UPDATE users SET email = ?, full_name = ?, phone = ? WHERE id = ?').run(d.email, d.full_name, d.phone, id),
  updatePassword: async (id, hash) => await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id),
  list: async () => await db.prepare('SELECT id, username, email, full_name, phone, role, created_at FROM users ORDER BY id').all(),
  updateRole: async (id, role) => (await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)).changes
};
