const { db } = require('../config/database');

const Business = {
  findByUserId(userId) {
    return db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(userId);
  },

  findBySlug(slug) {
    return db.prepare('SELECT * FROM businesses WHERE slug = ? AND active = 1').get(slug);
  },

  findById(id) {
    return db.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO businesses (user_id, name, slug, logo, description, address, phone, whatsapp, email, social_links, schedule, header_color, enable_cart)
      VALUES (@user_id, @name, @slug, @logo, @description, @address, @phone, @whatsapp, @email, @social_links, @schedule, @header_color, @enable_cart)
    `);
    const info = stmt.run({ ...data, enable_cart: data.enable_cart || 0 });
    return info.lastInsertRowid;
  },

  update(id, data) {
    return db.prepare(`
      UPDATE businesses
      SET name = @name, logo = @logo, description = @description,
          address = @address, phone = @phone, whatsapp = @whatsapp,
          email = @email, social_links = @social_links, schedule = @schedule,
          header_color = @header_color, enable_cart = @enable_cart
      WHERE id = @id
    `).run({ ...data, id, enable_cart: data.enable_cart || 0 });
  },

  getAll() {
    return db.prepare(`
      SELECT b.*, u.email as owner_email
      FROM businesses b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `).all();
  },

  getAllActive() {
    return db.prepare(`
      SELECT b.*, u.email as owner_email
      FROM businesses b
      JOIN users u ON b.user_id = u.id
      WHERE b.active = 1
      ORDER BY b.created_at DESC
    `).all();
  },

  toggleActive(id, active) {
    return db.prepare('UPDATE businesses SET active = ? WHERE id = ?').run(active, id);
  },

  deleteById(id) {
    // Eliminar productos primero, luego el negocio
    db.prepare('DELETE FROM products WHERE business_id = ?').run(id);
    return db.prepare('DELETE FROM businesses WHERE id = ?').run(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as total FROM businesses').get().total;
  },

  slugExists(slug, excludeId = null) {
    if (excludeId) {
      return db.prepare('SELECT id FROM businesses WHERE slug = ? AND id != ?').get(slug, excludeId);
    }
    return db.prepare('SELECT id FROM businesses WHERE slug = ?').get(slug);
  },
};

module.exports = Business;
