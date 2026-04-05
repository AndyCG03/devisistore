const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const dash     = require('../controllers/dashboardController');
const { isAuth } = require('../middlewares/authMiddleware');

// ── Multer – almacenamiento de imágenes ────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_PATH || path.join(__dirname, '../public/uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
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
  body('name')
    .notEmpty().trim().isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-.,&]+$/)
    .withMessage('El nombre solo puede contener letras, números y espacios.'),
  body('description')
    .optional({ checkFalsy: true })
    .trim().isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim().matches(/^[\d\s\-\+\(\)]{7,20}$/)
    .withMessage('Teléfono inválido. Solo números, +, -, paréntesis.'),
  body('whatsapp')
    .optional({ checkFalsy: true })
    .trim().matches(/^\d{7,15}$/)
    .withMessage('WhatsApp inválido. Solo números con código de país.'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Email inválido.'),
  body('address')
    .optional({ checkFalsy: true })
    .trim().isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres.'),
  body('schedule')
    .optional({ checkFalsy: true })
    .trim().isLength({ max: 100 })
    .withMessage('El horario no puede exceder 100 caracteres.'),
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
router.get('/qr',                     dash.getQR);
router.get('/api/generate-qr',        dash.generateQR);

module.exports = router;
