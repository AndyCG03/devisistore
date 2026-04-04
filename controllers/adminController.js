const User       = require('../models/User');
const AccessKey  = require('../models/AccessKey');
const Business   = require('../models/Business');
const Product    = require('../models/Product');
const Plan       = require('../models/Plan');

// ── GET /admin ─────────────────────────────────────────────────────────────
exports.getDashboard = (req, res) => {
  const stats = {
    users:      User.count(),
    businesses: Business.count(),
    keys:       AccessKey.count(),
    plans:      Plan.getAll().length,
  };
  res.render('admin/index', { title: 'Panel de administración', stats });
};

// ── GET /admin/users ───────────────────────────────────────────────────────
exports.getUsers = (req, res) => {
  const users = User.getAll();
  const plans = Plan.getAll();
  res.render('admin/users', { title: 'Usuarios', users, plans });
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

// ── POST /admin/businesses/:id/delete ─────────────────────────────────────
exports.deleteBusiness = (req, res) => {
  const biz = Business.findById(req.params.id);
  if (!biz) {
    req.session.flashError = 'Negocio no encontrado.';
    return res.redirect('/admin/businesses');
  }
  Business.deleteById(biz.id);
  req.session.flashSuccess = `Negocio "${biz.name}" eliminado permanentemente.`;
  res.redirect('/admin/businesses');
};

// ── GET /admin/plans ──────────────────────────────────────────────────────
exports.getPlans = (req, res) => {
  const plans = Plan.getAllIncludingInactive();
  res.render('admin/plans', { title: 'Planes', plans });
};

// ── POST /admin/plans ─────────────────────────────────────────────────────
exports.createPlan = (req, res) => {
  try {
    const { name, slug, description, price, currency, billing_period,
            max_businesses, max_products, max_storage_mb,
            enable_cart, enable_custom_domain, enable_analytics,
            enable_priority_support, features, is_default, sort_order } = req.body;

    Plan.create({
      name, slug, description,
      price: parseFloat(price) || 0,
      currency: currency || 'USD',
      billing_period: billing_period || 'monthly',
      max_businesses: parseInt(max_businesses) || 1,
      max_products: parseInt(max_products) || 50,
      max_storage_mb: parseInt(max_storage_mb) || 100,
      enable_cart: enable_cart ? 1 : 0,
      enable_custom_domain: enable_custom_domain ? 1 : 0,
      enable_analytics: enable_analytics ? 1 : 0,
      enable_priority_support: enable_priority_support ? 1 : 0,
      features: features || '[]',
      is_default: is_default ? 1 : 0,
      sort_order: parseInt(sort_order) || 0,
    });

    req.session.flashSuccess = 'Plan creado correctamente.';
  } catch (err) {
    console.error('Error al crear plan:', err);
    req.session.flashError = 'Error al crear el plan.';
  }
  res.redirect('/admin/plans');
};

// ── POST /admin/plans/:id ─────────────────────────────────────────────────
exports.updatePlan = (req, res) => {
  try {
    const { name, slug, description, price, currency, billing_period,
            max_businesses, max_products, max_storage_mb,
            enable_cart, enable_custom_domain, enable_analytics,
            enable_priority_support, features, is_active, is_default, sort_order } = req.body;

    Plan.update(req.params.id, {
      name, slug, description,
      price: parseFloat(price) || 0,
      currency: currency || 'USD',
      billing_period: billing_period || 'monthly',
      max_businesses: parseInt(max_businesses) || 1,
      max_products: parseInt(max_products) || 50,
      max_storage_mb: parseInt(max_storage_mb) || 100,
      enable_cart: enable_cart ? 1 : 0,
      enable_custom_domain: enable_custom_domain ? 1 : 0,
      enable_analytics: enable_analytics ? 1 : 0,
      enable_priority_support: enable_priority_support ? 1 : 0,
      features: features || '[]',
      is_active: is_active ? 1 : 0,
      is_default: is_default ? 1 : 0,
      sort_order: parseInt(sort_order) || 0,
    });

    req.session.flashSuccess = 'Plan actualizado correctamente.';
  } catch (err) {
    console.error('Error al actualizar plan:', err);
    req.session.flashError = 'Error al actualizar el plan.';
  }
  res.redirect('/admin/plans');
};

// ── POST /admin/plans/:id/toggle ──────────────────────────────────────────
exports.togglePlan = (req, res) => {
  const plan = Plan.findById(req.params.id);
  if (!plan) {
    req.session.flashError = 'Plan no encontrado.';
    return res.redirect('/admin/plans');
  }
  Plan.toggleActive(plan.id);
  req.session.flashSuccess = `Plan ${plan.is_active ? 'desactivado' : 'activado'}.`;
  res.redirect('/admin/plans');
};

// ── POST /admin/users/:id/plan ────────────────────────────────────────────
exports.updateUserPlan = (req, res) => {
  const { plan_id } = req.body;
  const user = User.findById(req.params.id);
  
  if (!user) {
    req.session.flashError = 'Usuario no encontrado.';
    return res.redirect('/admin/users');
  }

  const plan = Plan.findById(plan_id);
  if (!plan) {
    req.session.flashError = 'Plan no válido.';
    return res.redirect('/admin/users');
  }

  User.updatePlan(user.id, plan_id);
  req.session.flashSuccess = `Plan de ${user.email} cambiado a "${plan.name}".`;
  res.redirect('/admin/users');
};
