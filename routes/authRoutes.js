const express = require('express');
const { body }  = require('express-validator');
const router  = express.Router();
const auth    = require('../controllers/authController');

const loginRules = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida.'),
];

const registerRules = [
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.'),
  body('access_key').notEmpty().withMessage('Clave de acceso requerida.'),
];

router.get('/login',    auth.getLogin);
router.post('/login',   loginRules,    auth.postLogin);
router.get('/register', auth.getRegister);
router.post('/register', registerRules, auth.postRegister);
router.post('/logout',  auth.logout);

module.exports = router;
