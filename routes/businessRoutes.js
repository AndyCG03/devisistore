const express = require('express');
const router  = express.Router();
const business = require('../controllers/businessController');

// ── GET /businesses ────────────────────────────────────────────────────────
router.get('/', business.getBusinesses);

module.exports = router;
