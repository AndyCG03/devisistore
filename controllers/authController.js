const bcrypt     = require('bcryptjs');
const { validationResult } = require('express-validator');
const User       = require('../models/User');
const AccessKey  = require('../models/AccessKey');

// ── GET /auth/login ────────────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Iniciar sesión' });
};

// ── POST /auth/login ───────────────────────────────────────────────────────
exports.postLogin = async (req, res) => {
  console.log('[LOGIN POST] Body recibido:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[LOGIN POST] Errores de validación:', errors.array());
    req.session.flashError = errors.array()[0].msg;
    return res.redirect('/auth/login');
  }

  const { email, password } = req.body;
  console.log('[LOGIN] Intento de login para:', email);
  console.log('[LOGIN] Sesión antes:', req.session.id);

  try {
    const user = User.findByEmail(email);
    console.log('[LOGIN] Usuario encontrado:', user ? user.email : 'NO');

    if (!user || !user.active) {
      console.log('[LOGIN] Usuario no encontrado o inactivo');
      req.session.flashError = 'Credenciales incorrectas o cuenta desactivada.';
      return res.redirect('/auth/login');
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password match:', match);
    
    if (!match) {
      req.session.flashError = 'Credenciales incorrectas.';
      return res.redirect('/auth/login');
    }

    // Guardar sesión
    req.session.user = { id: user.id, email: user.email, role: user.role };
    console.log('[LOGIN] Sesión guardada:', req.session.user);
    req.session.flashSuccess = `Bienvenido de nuevo, ${user.email}`;

    return res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    next(err);
  }
};

// ── GET /auth/register ─────────────────────────────────────────────────────
exports.getRegister = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Crear cuenta' });
};

// ── POST /auth/register ────────────────────────────────────────────────────
exports.postRegister = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flashError = errors.array()[0].msg;
    return res.redirect('/auth/register');
  }

  const { email, password, access_key } = req.body;

  try {
    // Verificar clave de acceso
    const keyRecord = AccessKey.findByKey(access_key.trim().toUpperCase());
    if (!keyRecord || keyRecord.used) {
      req.session.flashError = 'Clave de acceso inválida o ya utilizada.';
      return res.redirect('/auth/register');
    }

    // Email único
    if (User.findByEmail(email)) {
      req.session.flashError = 'Ya existe una cuenta con ese email.';
      return res.redirect('/auth/register');
    }

    const hash   = await bcrypt.hash(password, 12);
    const userId = User.create(email, hash, 'user');
    AccessKey.markUsed(keyRecord.id, userId);

    req.session.flashSuccess = 'Cuenta creada. ¡Inicia sesión!';
    return res.redirect('/auth/login');
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/logout ──────────────────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
