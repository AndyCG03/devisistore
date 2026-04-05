const Business = require('../models/Business');
const { db } = require('../config/database');

// ── GET /businesses ────────────────────────────────────────────────────────
exports.getBusinesses = (req, res) => {
  // Get all active businesses, admin's business first
  const businesses = db.prepare(`
    SELECT b.*, u.email as owner_email, u.role as owner_role
    FROM businesses b
    JOIN users u ON b.user_id = u.id
    WHERE b.active = 1
    ORDER BY u.role DESC, b.created_at DESC
  `).all();

  res.render('shop/businesses', {
    title:       'Negocios – DevisiStore',
    description: 'Explora todos los negocios disponibles en DevisiStore',
    businesses,
  });
};
