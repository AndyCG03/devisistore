const { db } = require('../config/database');

const User = {
  findById(id) {
    return db.prepare('SELECT id, email, role, plan_id, active, created_at FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  create(email, hashedPassword, role = 'user', planId = null) {
    // Si no se especifica plan, usar el plan por defecto
    if (!planId) {
      const defaultPlan = db.prepare('SELECT id FROM plans WHERE is_default = 1 LIMIT 1').get();
      planId = defaultPlan ? defaultPlan.id : 1;
    }
    
    const stmt = db.prepare('INSERT INTO users (email, password, role, plan_id) VALUES (?, ?, ?, ?)');
    const info = stmt.run(email, hashedPassword, role, planId);
    return info.lastInsertRowid;
  },

  getAll() {
    return db.prepare(
      `SELECT u.id, u.email, u.role, u.plan_id, p.name as plan_name, u.active, u.created_at
       FROM users u
       LEFT JOIN plans p ON u.plan_id = p.id
       ORDER BY u.created_at DESC`
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

  updatePlan(userId, planId) {
    return db.prepare('UPDATE users SET plan_id = ? WHERE id = ?').run(planId, userId);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as total FROM users').get().total;
  },
};

module.exports = User;
