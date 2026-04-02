const Database = require('./sqlite-adapter');
const path     = require('path');
const bcrypt   = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || './cataloghub.db';

// Crear / abrir la base de datos
const db = new Database(path.resolve(DB_PATH));

// Optimizaciones de SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Crea las tablas si no existen e inserta el admin inicial.
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'user',
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS access_keys (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key_value  TEXT    NOT NULL UNIQUE,
      used       INTEGER NOT NULL DEFAULT 0,
      used_by    INTEGER REFERENCES users(id),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT    NOT NULL,
      slug         TEXT    NOT NULL UNIQUE,
      logo         TEXT,
      description  TEXT,
      address      TEXT,
      phone        TEXT,
      whatsapp     TEXT,
      email        TEXT,
      social_links TEXT    DEFAULT '{}',
      schedule     TEXT,
      active       INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      description TEXT,
      price       REAL    NOT NULL DEFAULT 0,
      image       TEXT,
      category    TEXT,
      status      TEXT    NOT NULL DEFAULT 'available',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_slug   ON businesses(slug);
  `);

  // Crear admin inicial si no existe
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@cataloghub.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    ).run(adminEmail, hash, 'admin');
    console.log(`🔑  Admin inicial creado: ${adminEmail}`);
  }
}

module.exports = { db, initDatabase };
