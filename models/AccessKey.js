const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const AccessKey = {
  generate() {
    // Genera una clave de acceso única tipo: CAT-XXXX-XXXX
    const raw  = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 8);
    const key  = `CAT-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    const stmt = db.prepare('INSERT INTO access_keys (key_value) VALUES (?)');
    const info = stmt.run(key);
    return { id: info.lastInsertRowid, key };
  },

  findByKey(keyValue) {
    return db.prepare('SELECT * FROM access_keys WHERE key_value = ?').get(keyValue);
  },

  markUsed(id, userId) {
    return db.prepare(
      'UPDATE access_keys SET used = 1, used_by = ? WHERE id = ?'
    ).run(userId, id);
  },

  getAll() {
    return db.prepare(`
      SELECT ak.*, u.email as used_by_email
      FROM access_keys ak
      LEFT JOIN users u ON ak.used_by = u.id
      ORDER BY ak.created_at DESC
    `).all();
  },

  deleteById(id) {
    return db.prepare('DELETE FROM access_keys WHERE id = ?').run(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as total FROM access_keys WHERE used = 0').get().total;
  },
};

module.exports = AccessKey;
