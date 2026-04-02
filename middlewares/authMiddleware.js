/**
 * Middleware que verifica si el usuario tiene sesión activa.
 */
exports.isAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  req.session.flashError = 'Debes iniciar sesión para acceder.';
  res.redirect('/auth/login');
};

/**
 * Middleware que verifica si el usuario tiene rol de administrador.
 * Debe usarse DESPUÉS de isAuth.
 */
exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).render('errors/403', { title: 'Acceso denegado' });
};
