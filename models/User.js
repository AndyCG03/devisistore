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
    // Eliminar en cascada: productos → negocios → usuario
    const businesses = db.prepare('SELECT id FROM businesses WHERE user_id = ?').all(id);
    
    businesses.forEach(biz => {
      // Eliminar productos del negocio
      db.prepare('DELETE FROM products WHERE business_id = ?').run(biz.id);
    });
    
    // Eliminar negocios del usuario
    db.prepare('DELETE FROM businesses WHERE user_id = ?').run(id);
    
    // Eliminar access keys usadas por el usuario
    db.prepare('DELETE FROM access_keys WHERE used_by = ?').run(id);
    
    // Finalmente eliminar el usuario
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
