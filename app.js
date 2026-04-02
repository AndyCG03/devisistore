require('dotenv').config();

const express      = require('express');
const path         = require('path');
const morgan       = require('morgan');
const helmet       = require('helmet');
const session      = require('express-session');
const FileStore    = require('session-file-store')(session);
const rateLimit    = require('express-rate-limit');

// ── Inicializar base de datos ──────────────────────────────────────────────
const { initDatabase } = require('./config/database');
initDatabase();

// ── Rutas ──────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/authRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const shopRoutes     = require('./routes/shopRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad con Helmet ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "cdn.jsdelivr.net"],
        styleSrc:   ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "fonts.googleapis.com"],
        fontSrc:    ["'self'", "fonts.gstatic.com"],
        imgSrc:     ["'self'", "data:", "blob:"],
      },
    },
  })
);

// ── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Archivos estáticos ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Sesiones ───────────────────────────────────────────────────────────────
app.use(
  session({
    store: new FileStore({
      path:    './sessions',   // carpeta donde se guardan los archivos de sesión
      ttl:     86400,          // 24 horas en segundos
      retries: 0,
    }),
    secret:            process.env.SESSION_SECRET || 'secreto_desarrollo_cambiar',
    resave:            false,
    saveUninitialized: false,
    cookie: {
      secure:   process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge:   1000 * 60 * 60 * 24, // 24 horas
    },
  })
);

// ── Motor de vistas ────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Variables globales en vistas ───────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user          = req.session.user || null;
  res.locals.flashSuccess  = req.session.flashSuccess || null;
  res.locals.flashError    = req.session.flashError   || null;
  res.locals.appName       = 'CatalogHub';
  delete req.session.flashSuccess;
  delete req.session.flashError;
  next();
});

// ── Rate limiting en login ─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: (parseInt(process.env.LOGIN_WINDOW_MINUTES) || 15) * 60 * 1000,
  max:      parseInt(process.env.LOGIN_MAX_ATTEMPTS)     || 10,
  message:  'Demasiados intentos. Intenta más tarde.',
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/auth/login', loginLimiter);

// ── Rutas principales ──────────────────────────────────────────────────────
app.use('/auth',      authRoutes);
app.use('/admin',     adminRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/shop',      shopRoutes);

// Página de inicio
app.get('/', (req, res) => {
  res.render('home/index', { title: 'CatalogHub – Tu catálogo online' });
});

// ── Manejo de errores 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Página no encontrada' });
});

// ── Manejo centralizado de errores ────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  const status  = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Algo salió mal. Inténtalo más tarde.'
    : err.message;
  res.status(status).render('errors/500', { title: 'Error del servidor', message });
});

// ── Iniciar servidor ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  CatalogHub corriendo en http://localhost:${PORT}`);
  console.log(`🌍  Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
