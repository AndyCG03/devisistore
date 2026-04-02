const Business = require('../models/Business');

// ── GET /businesses ────────────────────────────────────────────────────────
exports.getBusinesses = (req, res) => {
  const businesses = Business.getAllActive();
  
  res.render('shop/businesses', {
    title:       'Negocios – DevisiStore',
    description: 'Explora todos los negocios disponibles en DevisiStore',
    businesses,
  });
};
