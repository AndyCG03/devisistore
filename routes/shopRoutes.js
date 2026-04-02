const express = require('express');
const router  = express.Router();
const shop    = require('../controllers/shopController');

// Catálogo público
router.get('/:slug', shop.getCatalog);

// Descargar catálogo en PDF
router.get('/:slug/pdf', shop.downloadCatalogPDF);

module.exports = router;
