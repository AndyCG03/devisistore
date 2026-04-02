const Business = require('../models/Business');
const Product  = require('../models/Product');

// ── GET /shop/:slug ────────────────────────────────────────────────────────
exports.getCatalog = (req, res) => {
  const business = Business.findBySlug(req.params.slug);
  if (!business) {
    return res.status(404).render('errors/404', { title: 'Negocio no encontrado' });
  }

  const { category, search, page = 1 } = req.query;
  const { rows, total, pages } = Product.findByBusinessId(business.id, {
    category, search, page: parseInt(page), limit: 12,
  });

  let socials = {};
  try { socials = JSON.parse(business.social_links || '{}'); } catch {}

  const categories = Product.getCategories(business.id);

  res.render('shop/catalog', {
    title:       `${business.name} – Catálogo`,
    description: business.description || `Ver productos de ${business.name}`,
    business,
    socials,
    products:    rows,
    categories,
    total,
    pages,
    currentPage: parseInt(page),
    category:    category || 'all',
    search:      search   || '',
  });
};
