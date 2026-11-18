// Model: bảng contacts
const { db } = require('../db');

module.exports = {
  create: (d) => db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)').run(d.name, d.email, d.message),
  findAll: () => db.prepare('SELECT * FROM contacts ORDER BY id DESC').all(),
  remove: (id) => db.prepare('DELETE FROM contacts WHERE id = ?').run(id).changes
};
