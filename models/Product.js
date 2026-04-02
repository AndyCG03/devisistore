const { db } = require('../config/database');

const Product = {
  findByBusinessId(businessId, { category, search, page = 1, limit = 12 } = {}) {
    let query  = 'SELECT * FROM products WHERE business_id = ?';
    const args = [businessId];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      args.push(category);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(
      query.replace('SELECT *', 'SELECT COUNT(*) as count')
    ).get(...args).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, (page - 1) * limit);

    const rows = db.prepare(query).all(...args);
    return { rows, total, pages: Math.ceil(total / limit) };
  },

  findById(id) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  findByIdAndBusiness(id, businessId) {
    return db.prepare(
      'SELECT * FROM products WHERE id = ? AND business_id = ?'
    ).get(id, businessId);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO products (business_id, name, description, price, currency, image, category, status, stock_level)
      VALUES (@business_id, @name, @description, @price, @currency, @image, @category, @status, @stock_level)
    `);
    const info = stmt.run(data);
    return info.lastInsertRowid;
  },

  update(id, data) {
    return db.prepare(`
      UPDATE products
      SET name = @name, description = @description, price = @price,
          currency = @currency, image = @image, category = @category,
          status = @status, stock_level = @stock_level
      WHERE id = @id
    `).run({ ...data, id });
  },

  delete(id) {
    return db.prepare('DELETE FROM products WHERE id = ?').run(id);
  },

  getCategories(businessId) {
    return db.prepare(
      'SELECT DISTINCT category FROM products WHERE business_id = ? AND category IS NOT NULL ORDER BY category'
    ).all(businessId).map(r => r.category);
  },

  countByBusiness(businessId) {
    return db.prepare(
      'SELECT COUNT(*) as total FROM products WHERE business_id = ?'
    ).get(businessId).total;
  },
};

module.exports = Product;
