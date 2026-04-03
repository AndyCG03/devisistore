const express = require('express');
const router  = express.Router();
const admin   = require('../controllers/adminController');
const { isAuth, isAdmin } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación y rol admin
router.use(isAuth, isAdmin);

router.get('/',                         admin.getDashboard);
router.get('/users',                    admin.getUsers);
router.post('/users/:id/toggle',        admin.toggleUser);
router.post('/users/:id/delete',        admin.deleteUser);
router.get('/keys',                     admin.getKeys);
router.post('/keys/generate',           admin.generateKey);
router.post('/keys/:id/delete',         admin.deleteKey);
router.get('/businesses',               admin.getBusinesses);
router.post('/businesses/:id/toggle',   admin.toggleBusiness);
router.post('/businesses/:id/delete',   admin.deleteBusiness);

module.exports = router;
