const Database = require('./sqlite-adapter');
const path     = require('path');
const bcrypt   = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || './devisistore.db';

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
      plan_id    INTEGER REFERENCES plans(id) DEFAULT 1,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL UNIQUE,
      slug            TEXT    NOT NULL UNIQUE,
      description     TEXT,
      price           REAL    NOT NULL DEFAULT 0,
      currency        TEXT    DEFAULT 'USD',
      billing_period  TEXT    DEFAULT 'monthly',
      max_businesses  INTEGER NOT NULL DEFAULT 1,
      max_products    INTEGER NOT NULL DEFAULT 50,
      max_storage_mb  INTEGER NOT NULL DEFAULT 100,
      enable_cart     INTEGER NOT NULL DEFAULT 0,
      enable_custom_domain INTEGER NOT NULL DEFAULT 0,
      enable_analytics INTEGER NOT NULL DEFAULT 0,
      enable_priority_support INTEGER NOT NULL DEFAULT 0,
      features        TEXT    DEFAULT '[]',
      is_active       INTEGER NOT NULL DEFAULT 1,
      is_default      INTEGER NOT NULL DEFAULT 0,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
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
      header_color TEXT    DEFAULT '#2E5FA8',
      enable_cart  INTEGER NOT NULL DEFAULT 0,
      active       INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      description TEXT,
      price       REAL    NOT NULL DEFAULT 0,
      currency    TEXT    DEFAULT 'USD',
      image       TEXT,
      category    TEXT,
      status      TEXT    NOT NULL DEFAULT 'available',
      stock_level TEXT    DEFAULT 'normal',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_plan     ON users(plan_id);
    CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_slug   ON businesses(slug);
  `);

  // ── Insertar planes por defecto ──────────────────────────────────────────
  const planCount = db.prepare("SELECT COUNT(*) as count FROM plans").get().count;
  if (planCount === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO plans (name, slug, description, price, billing_period, max_businesses, max_products, max_storage_mb, enable_cart, enable_custom_domain, enable_analytics, enable_priority_support, features, is_default, sort_order)
      VALUES (@name, @slug, @description, @price, @billing_period, @max_businesses, @max_products, @max_storage_mb, @enable_cart, @enable_custom_domain, @enable_analytics, @enable_priority_support, @features, @is_default, @sort_order)
    `);

    insertPlan.run({
      name: 'Gratuito', slug: 'free', description: 'Para emprendedores que inician',
      price: 0, billing_period: 'monthly', max_businesses: 1, max_products: 50, max_storage_mb: 100,
      enable_cart: 0, enable_custom_domain: 0, enable_analytics: 0, enable_priority_support: 0,
      features: JSON.stringify(['1 negocio', '50 productos', 'Catálogo público', 'Botón WhatsApp']),
      is_default: 1, sort_order: 1,
    });

    insertPlan.run({
      name: 'Profesional', slug: 'pro', description: 'Para negocios en crecimiento',
      price: 9.99, billing_period: 'monthly', max_businesses: 3, max_products: 500, max_storage_mb: 1000,
      enable_cart: 1, enable_custom_domain: 1, enable_analytics: 1, enable_priority_support: 0,
      features: JSON.stringify(['3 negocios', '500 productos', 'Carrito de compras', 'Dominio personalizado', 'Analíticas']),
      is_default: 0, sort_order: 2,
    });

    insertPlan.run({
      name: 'Empresarial', slug: 'enterprise', description: 'Solución completa para empresas',
      price: 29.99, billing_period: 'monthly', max_businesses: -1, max_products: -1, max_storage_mb: 5000,
      enable_cart: 1, enable_custom_domain: 1, enable_analytics: 1, enable_priority_support: 1,
      features: JSON.stringify(['Negocios ilimitados', 'Productos ilimitados', 'Carrito', 'Dominio personalizado', 'Analíticas avanzadas', 'Soporte prioritario']),
      is_default: 0, sort_order: 3,
    });
  }

  // Crear o actualizar admin inicial
  const adminEmail    = process.env.ADMIN_EMAIL    || 'devisi.software@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Devisi123*';

  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    ).run(adminEmail, hash, 'admin');
    console.log(`🔑  Admin inicial creado: ${adminEmail}`);
  } else {
    // Actualizar contraseña del admin existente
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare('UPDATE users SET email = ?, password = ? WHERE role = ?').run(adminEmail, hash, 'admin');
    console.log(`🔑  Admin actualizado: ${adminEmail}`);
  }
}

module.exports = { db, initDatabase };
