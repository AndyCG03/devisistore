const Business = require('../models/Business');
const Product  = require('../models/Product');
const PDFDocument = require('pdfkit');
const path = require('path');

// ── GET /shop/:slug ────────────────────────────────────────────────────────
exports.getCatalog = (req, res) => {
  const business = Business.findBySlug(req.params.slug);
  if (!business) {
    return res.status(404).render('errors/404', { title: 'Negocio no encontrado' });
  }

  const { category, search, page = 1 } = req.query;
  const { rows, total, pages } = Product.findByBusinessId(business.id, {
    category, search, page: parseInt(page), limit: 12,
  });

  let socials = {};
  try { socials = JSON.parse(business.social_links || '{}'); } catch {}

  const categories = Product.getCategories(business.id);

  res.render('shop/catalog', {
    title:       `${business.name} – Catálogo`,
    description: business.description || `Ver productos de ${business.name}`,
    business,
    socials,
    products:    rows,
    categories,
    total,
    pages,
    currentPage: parseInt(page),
    category:    category || 'all',
    search:      search   || '',
  });
};

// ── GET /shop/:slug/pdf ────────────────────────────────────────────────────
exports.downloadCatalogPDF = (req, res) => {
  const business = Business.findBySlug(req.params.slug);
  if (!business) {
    return res.status(404).render('errors/404', { title: 'Negocio no encontrado' });
  }

  // Obtener todos los productos (límite de 100 para no sobrecargar)
  const { rows } = Product.findByBusinessId(business.id, { limit: 100 });

  // Crear documento PDF
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4',
    layout: 'portrait'
  });
  
  // Configurar headers de descarga
  const filename = `${business.slug.replace(/[^a-z0-9]/gi, '-')}-catalogo.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  doc.pipe(res);
  
  // ═══════════════════════════════════════════════════════════════════════
  // PORTADA
  // ═══════════════════════════════════════════════════════════════════════
  
  // Nombre del negocio
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#2E5FA8')
     .text(business.name, { align: 'left' });
  
  doc.moveDown(0.5);
  
  // Descripción
  if (business.description) {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#6B7280')
       .text(business.description, { align: 'left', width: 450 });
  }
  
  doc.moveDown(1);
  
  // Línea separadora
  doc.moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke('#E5E7EB');
  
  doc.moveDown(1);
  
  // Información de contacto (solo si existe)
  const hasContact = business.phone || business.whatsapp || business.email || business.address || business.schedule;
  
  if (hasContact) {
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1F2933')
       .text('Información de Contacto', { underline: true });
    doc.moveDown(0.3);
    
    if (business.phone) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Telefono: ${business.phone}`);
    }
    if (business.whatsapp) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`WhatsApp: ${business.whatsapp}`);
    }
    if (business.email) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Email: ${business.email}`);
    }
    if (business.address) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Direccion: ${business.address}`);
    }
    if (business.schedule) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Horario: ${business.schedule}`);
    }
  }
  
  doc.moveDown(1.5);
  
  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTOS
  // ═══════════════════════════════════════════════════════════════════════
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1F2933')
     .text('Catálogo de Productos', { underline: true });
  doc.moveDown(1);

  if (rows.length === 0) {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#6B7280')
       .text('No hay productos disponibles en este momento.', { align: 'left' });
  } else {
    rows.forEach((p, index) => {
      // Número y nombre del producto
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor('#1F2933')
         .text(`${index + 1}. ${p.name}`);
      
      // Descripción (si existe)
      if (p.description && p.description.trim()) {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#4B5563')
           .text(p.description, { width: 450, align: 'left' });
      }
      
      // Categoría, precio y estado
      const price = `${p.currency === 'CUP' ? '$' : '$'}${parseFloat(p.price).toFixed(2)}${p.currency === 'CUP' ? ' CUP' : ''}`;
      const status = p.status === 'available' ? 'Disponible' : 'Agotado';
      const statusColor = p.status === 'available' ? '#059669' : '#DC2626';
      
      // Precio en negrita
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#2E5FA8')
         .text(price, { continued: true });
      
      // Estado con color
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(statusColor)
         .text(` • ${status}`, { continued: true });
      
      // Stock level
      if (p.stock_level === 'low' && p.status !== 'unavailable') {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#D97706')
           .text(` * Pocas`, { continued: true });
      }
      
      // Categoría (si existe)
      if (p.category && p.category.trim()) {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text(`• ${p.category}`);
      } else {
        doc.text('');
      }
      
      // Separador entre productos (solo si hay más productos)
      if (index < rows.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke('#F3F4F6');
      }
      doc.moveDown(0.75);
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PIE DE PÁGINA - DevisiStore
  // ═══════════════════════════════════════════════════════════════════════
  
  doc.moveDown(1);
  
  // Línea superior
  doc.moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke('#E5E7EB');
  
  doc.moveDown(0.5);
  
  // Branding DevisiStore
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text('Catálogo creado con ', { continued: true });
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#2E5FA8')
     .text('DevisiStore', { continued: true });
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text(' | Generado el ');
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#9CA3AF')
     .text(new Date().toLocaleDateString('es-ES', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     }), { align: 'left' });
  
  // Finalizar documento
  doc.end();
};
