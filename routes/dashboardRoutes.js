const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const dash     = require('../controllers/dashboardController');
const { isAuth } = require('../middlewares/authMiddleware');

// ── Multer – almacenamiento de imágenes ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif).'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.UPLOAD_MAX_SIZE_MB) || 5) * 1024 * 1024 },
});

// ── Validaciones ───────────────────────────────────────────────────────────
const bizRules = [
  body('name').notEmpty().trim().withMessage('El nombre del negocio es requerido.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido.'),
];

const productRules = [
  body('name').notEmpty().trim().withMessage('El nombre del producto es requerido.'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.'),
];

// ── Rutas ──────────────────────────────────────────────────────────────────
router.use(isAuth);

router.get('/',                       dash.getIndex);
router.get('/business',               dash.getBusinessForm);
router.post('/business',              upload.single('logo'), bizRules,     dash.postBusiness);
router.get('/products',               dash.getProducts);
router.get('/products/new',           dash.getNewProduct);
router.post('/products/new',          upload.single('image'), productRules, dash.postNewProduct);
router.get('/products/:id/edit',      dash.getEditProduct);
router.post('/products/:id/edit',     upload.single('image'), productRules, dash.postEditProduct);
router.post('/products/:id/delete',   dash.deleteProduct);

module.exports = router;
