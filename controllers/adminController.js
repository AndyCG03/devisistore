const User       = require('../models/User');
const AccessKey  = require('../models/AccessKey');
const Business   = require('../models/Business');
const Product    = require('../models/Product');

// ── GET /admin ─────────────────────────────────────────────────────────────
exports.getDashboard = (req, res) => {
  const stats = {
    users:      User.count(),
    businesses: Business.count(),
    keys:       AccessKey.count(),
  };
  res.render('admin/index', { title: 'Panel de administración', stats });
};

// ── GET /admin/users ───────────────────────────────────────────────────────
exports.getUsers = (req, res) => {
  const users = User.getAll();
  res.render('admin/users', { title: 'Usuarios', users });
};

// ── POST /admin/users/:id/toggle ───────────────────────────────────────────
exports.toggleUser = (req, res) => {
  const user = User.findById(req.params.id);
  if (!user || user.role === 'admin') {
    req.session.flashError = 'Operación no permitida.';
    return res.redirect('/admin/users');
  }
  User.toggleActive(user.id, user.active ? 0 : 1);
  req.session.flashSuccess = `Usuario ${user.active ? 'desactivado' : 'activado'}.`;
  res.redirect('/admin/users');
};

// ── POST /admin/users/:id/delete ───────────────────────────────────────────
exports.deleteUser = (req, res) => {
  const user = User.findById(req.params.id);
  if (!user || user.role === 'admin') {
    req.session.flashError = 'No puedes eliminar a un administrador.';
    return res.redirect('/admin/users');
  }
  if (user.id === req.session.user.id) {
    req.session.flashError = 'No puedes eliminarte a ti mismo.';
    return res.redirect('/admin/users');
  }
  User.deleteById(req.params.id);
  req.session.flashSuccess = 'Usuario eliminado.';
  res.redirect('/admin/users');
};

// ── GET /admin/keys ────────────────────────────────────────────────────────
exports.getKeys = (req, res) => {
  const keys = AccessKey.getAll();
  res.render('admin/keys', { title: 'Claves de acceso', keys });
};

// ── POST /admin/keys/generate ──────────────────────────────────────────────
exports.generateKey = (req, res) => {
  const { key } = AccessKey.generate();
  req.session.flashSuccess = `Clave generada: ${key}`;
  res.redirect('/admin/keys');
};

// ── POST /admin/keys/:id/delete ────────────────────────────────────────────
exports.deleteKey = (req, res) => {
  AccessKey.deleteById(req.params.id);
  req.session.flashSuccess = 'Clave eliminada.';
  res.redirect('/admin/keys');
};

// ── GET /admin/businesses ──────────────────────────────────────────────────
exports.getBusinesses = (req, res) => {
  const businesses = Business.getAll();
  res.render('admin/businesses', { title: 'Negocios', businesses });
};

// ── POST /admin/businesses/:id/toggle ─────────────────────────────────────
exports.toggleBusiness = (req, res) => {
  const biz = Business.findById(req.params.id);
  if (!biz) return res.redirect('/admin/businesses');
  Business.toggleActive(biz.id, biz.active ? 0 : 1);
  req.session.flashSuccess = `Negocio ${biz.active ? 'desactivado' : 'activado'}.`;
  res.redirect('/admin/businesses');
};
