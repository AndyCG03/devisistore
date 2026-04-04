const { db } = require('../config/database');

const Plan = {
  getAll() {
    return db.prepare(
      'SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();
  },

  getAllIncludingInactive() {
    return db.prepare(
      'SELECT * FROM plans ORDER BY sort_order ASC'
    ).all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  },

  findBySlug(slug) {
    return db.prepare('SELECT * FROM plans WHERE slug = ? AND is_active = 1').get(slug);
  },

  getDefault() {
    return db.prepare('SELECT * FROM plans WHERE is_default = 1 LIMIT 1').get();
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO plans (name, slug, description, price, currency, billing_period,
                         max_businesses, max_products, max_storage_mb,
                         enable_cart, enable_custom_domain, enable_analytics,
                         enable_priority_support, features, is_default, sort_order)
      VALUES (@name, @slug, @description, @price, @currency, @billing_period,
              @max_businesses, @max_products, @max_storage_mb,
              @enable_cart, @enable_custom_domain, @enable_analytics,
              @enable_priority_support, @features, @is_default, @sort_order)
    `);
    const info = stmt.run(data);
    return info.lastInsertRowid;
  },

  update(id, data) {
    return db.prepare(`
      UPDATE plans
      SET name = @name, slug = @slug, description = @description,
          price = @price, currency = @currency, billing_period = @billing_period,
          max_businesses = @max_businesses, max_products = @max_products,
          max_storage_mb = @max_storage_mb,
          enable_cart = @enable_cart, enable_custom_domain = @enable_custom_domain,
          enable_analytics = @enable_analytics,
          enable_priority_support = @enable_priority_support,
          features = @features, is_active = @is_active,
          is_default = @is_default, sort_order = @sort_order
      WHERE id = @id
    `).run({ ...data, id });
  },

  delete(id) {
    return db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  },

  toggleActive(id) {
    const plan = this.findById(id);
    if (!plan) return null;
    const newActive = plan.is_active ? 0 : 1;
    db.prepare('UPDATE plans SET is_active = ? WHERE id = ?').run(newActive, id);
    return newActive;
  },

  /**
   * Verifica si un usuario puede realizar una acción según su plan
   * @param {number} userId - ID del usuario
   * @param {string} feature - Nombre de la característica a verificar
   * @returns {boolean}
   */
  canUseFeature(userId, feature) {
    const user = db.prepare('SELECT plan_id FROM users WHERE id = ?').get(userId);
    if (!user) return false;

    const plan = this.findById(user.plan_id);
    if (!plan) return false;

    // Verificar límites numéricos
    if (feature === 'max_businesses' && plan.max_businesses === -1) return true;
    if (feature === 'max_products' && plan.max_products === -1) return true;

    // Verificar características booleanas
    if (plan[feature] !== undefined) {
      return plan[feature] === 1;
    }

    return false;
  },

  /**
   * Obtiene el plan de un usuario
   */
  getUserPlan(userId) {
    return db.prepare(`
      SELECT p.* FROM plans p
      JOIN users u ON u.plan_id = p.id
      WHERE u.id = ?
    `).get(userId);
  },

  /**
   * Cuenta cuántos negocios/productos tiene un usuario
   */
  getUserUsage(userId) {
    const businesses = db.prepare(
      'SELECT COUNT(*) as count FROM businesses WHERE user_id = ?'
    ).get(userId).count;

    const products = db.prepare(`
      SELECT COUNT(*) as count FROM products p
      JOIN businesses b ON b.id = p.business_id
      WHERE b.user_id = ?
    `).get(userId).count;

    return { businesses, products };
  },

  count() {
    return db.prepare("SELECT COUNT(*) as total FROM plans").get().total;
  },
};

module.exports = Plan;
