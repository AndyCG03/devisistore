const { db } = require('../config/database');

// ── GET /businesses ────────────────────────────────────────────────────────
exports.getBusinesses = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 9; // Carga de 9 en 9
  const offset = (page - 1) * limit;

  // Obtener total de negocios activos
  const { count } = db.prepare("SELECT COUNT(*) as count FROM businesses b WHERE b.active = 1").get();

  // Obtener negocios paginados
  const businesses = db.prepare(`
    SELECT b.*, u.email as owner_email, u.role as owner_role
    FROM businesses b
    JOIN users u ON b.user_id = u.id
    WHERE b.active = 1
    ORDER BY u.role DESC, b.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  // Si es petición AJAX (infinite scroll), devolver JSON
  if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.json({
      businesses,
      hasMore: (offset + businesses.length) < count
    });
  }

  // Si es carga inicial, renderizar vista
  res.render('shop/businesses', {
    title: 'Negocios – DevisiStore',
    businesses,
    hasMore: (offset + businesses.length) < count,
    nextPage: page + 1
  });
};
