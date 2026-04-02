const { db } = require('../config/database');

const User = {
  findById(id) {
    return db.prepare('SELECT id, email, role, active, created_at FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  create(email, hashedPassword, role = 'user') {
    const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
    const info = stmt.run(email, hashedPassword, role);
    return info.lastInsertRowid;
  },

  getAll() {
    return db.prepare(
      'SELECT id, email, role, active, created_at FROM users ORDER BY created_at DESC'
    ).all();
  },

  deleteById(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  toggleActive(id, active) {
    return db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active, id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as total FROM users').get().total;
  },
};

module.exports = User;
