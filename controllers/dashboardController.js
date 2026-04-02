const path     = require('path');
const slugify  = require('slugify');
const { validationResult } = require('express-validator');
const Business = require('../models/Business');
const Product  = require('../models/Product');

// ── GET /dashboard ─────────────────────────────────────────────────────────
exports.getIndex = (req, res) => {
  const business     = Business.findByUserId(req.session.user.id);
  const productCount = business ? Product.countByBusiness(business.id) : 0;
  res.render('dashboard/index', {
    title: 'Mi Panel',
    business,
    productCount,
  });
};

// ── GET /dashboard/business ────────────────────────────────────────────────
exports.getBusinessForm = (req, res) => {
  const business = Business.findByUserId(req.session.user.id);
  let socials = {};
  if (business && business.social_links) {
    try { socials = JSON.parse(business.social_links); } catch {}
  }
  res.render('dashboard/business', {
    title: 'Mi Negocio',
    business,
    socials,
  });
};

// ── POST /dashboard/business ───────────────────────────────────────────────
exports.postBusiness = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flashError = errors.array()[0].msg;
    return res.redirect('/dashboard/business');
  }

  try {
    const userId   = req.session.user.id;
    const existing = Business.findByUserId(userId);

    const { name, description, address, phone, whatsapp, email, schedule,
            instagram, facebook, twitter, tiktok, header_color } = req.body;

    const social_links = JSON.stringify({ instagram, facebook, twitter, tiktok });

    // Logo: si se subió uno nuevo, usar ese; si no, mantener el anterior
    let logo = existing ? existing.logo : null;
    if (req.file) {
      logo = `/uploads/${req.file.filename}`;
    }

    if (existing) {
      Business.update(existing.id, { name, logo, description, address, phone, whatsapp, email, social_links, schedule, header_color: header_color || '#2E5FA8' });
      req.session.flashSuccess = 'Negocio actualizado correctamente.';
    } else {
      // Crear slug único
      let slug = slugify(name, { lower: true, strict: true });
      let counter = 0;
      while (Business.slugExists(slug)) {
        counter++;
        slug = slugify(name, { lower: true, strict: true }) + '-' + counter;
      }
      Business.create({ user_id: userId, name, slug, logo, description, address, phone, whatsapp, email, social_links, schedule, header_color: header_color || '#2E5FA8' });
      req.session.flashSuccess = '¡Negocio creado! Ya tienes tu catálogo público.';
    }

    return res.redirect('/dashboard/business');
  } catch (err) {
    next(err);
  }
};

// ── GET /dashboard/products ────────────────────────────────────────────────
exports.getProducts = (req, res) => {
  const business = Business.findByUserId(req.session.user.id);
  if (!business) {
    req.session.flashError = 'Primero crea tu negocio.';
    return res.redirect('/dashboard/business');
  }

  const { page = 1, category, search } = req.query;
  const { rows, total, pages } = Product.findByBusinessId(business.id, {
    category, search, page: parseInt(page), limit: 12,
  });
  const categories = Product.getCategories(business.id);

  res.render('dashboard/products', {
    title: 'Mis Productos',
    products: rows,
    business,
    categories,
    total,
    pages,
    currentPage: parseInt(page),
    category: category || 'all',
    search: search || '',
  });
};

// ── GET /dashboard/products/new ────────────────────────────────────────────
exports.getNewProduct = (req, res) => {
  const business = Business.findByUserId(req.session.user.id);
  if (!business) {
    req.session.flashError = 'Primero crea tu negocio.';
    return res.redirect('/dashboard/business');
  }
  const categories = Product.getCategories(business.id);
  res.render('dashboard/product-form', {
    title:    'Nuevo Producto',
    product:  null,
    business,
    categories,
    action:   '/dashboard/products/new',
  });
};

// ── POST /dashboard/products/new ───────────────────────────────────────────
exports.postNewProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flashError = errors.array()[0].msg;
    return res.redirect('/dashboard/products/new');
  }

  try {
    const business = Business.findByUserId(req.session.user.id);
    if (!business) return res.redirect('/dashboard/business');

    const { name, description, price, currency, category, status, stock_level } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    Product.create({
      business_id: business.id,
      name, description,
      price: parseFloat(price) || 0,
      currency: currency || 'USD',
      image, category,
      status: status || 'available',
      stock_level: stock_level || 'normal',
    });

    req.session.flashSuccess = 'Producto creado correctamente.';
    return res.redirect('/dashboard/products');
  } catch (err) {
    next(err);
  }
};

// ── GET /dashboard/products/:id/edit ──────────────────────────────────────
exports.getEditProduct = (req, res) => {
  const business = Business.findByUserId(req.session.user.id);
  if (!business) return res.redirect('/dashboard/business');

  const product = Product.findByIdAndBusiness(req.params.id, business.id);
  if (!product) {
    req.session.flashError = 'Producto no encontrado.';
    return res.redirect('/dashboard/products');
  }

  const categories = Product.getCategories(business.id);
  res.render('dashboard/product-form', {
    title:    'Editar Producto',
    product,
    business,
    categories,
    action:   `/dashboard/products/${product.id}/edit`,
  });
};

// ── POST /dashboard/products/:id/edit ─────────────────────────────────────
exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flashError = errors.array()[0].msg;
    return res.redirect(`/dashboard/products/${req.params.id}/edit`);
  }

  try {
    const business = Business.findByUserId(req.session.user.id);
    const product  = Product.findByIdAndBusiness(req.params.id, business.id);
    if (!product) return res.redirect('/dashboard/products');

    const { name, description, price, currency, category, status, stock_level } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : product.image;

    Product.update(product.id, { name, description, price: parseFloat(price) || 0, currency: currency || 'USD', image, category, status: status || 'available', stock_level: stock_level || 'normal' });
    req.session.flashSuccess = 'Producto actualizado.';
    return res.redirect('/dashboard/products');
  } catch (err) {
    next(err);
  }
};

// ── POST /dashboard/products/:id/delete ───────────────────────────────────
exports.deleteProduct = (req, res) => {
  const business = Business.findByUserId(req.session.user.id);
  const product  = Product.findByIdAndBusiness(req.params.id, business?.id);
  if (product) {
    Product.delete(product.id);
    req.session.flashSuccess = 'Producto eliminado.';
  }
  res.redirect('/dashboard/products');
};
