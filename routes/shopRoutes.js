const express = require('express');
const router  = express.Router();
const shop    = require('../controllers/shopController');

router.get('/:slug', shop.getCatalog);

module.exports = router;
