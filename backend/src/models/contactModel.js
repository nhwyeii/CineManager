// Model: bảng contacts
const {
  db
} = require('../db');
module.exports = {
  create: async d => await db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)').run(d.name, d.email, d.message),
  findAll: async () => await db.prepare('SELECT * FROM contacts ORDER BY id DESC').all(),
  remove: async id => (await db.prepare('DELETE FROM contacts WHERE id = ?').run(id)).changes
};
