const Business = require('../models/Business');
const Product  = require('../models/Product');
const PDFDocument = require('pdfkit');
const path = require('path');

// Función para sanitizar texto para PDF (sin emojis ni caracteres especiales problemáticos)
function sanitizeForPDF(text) {
  if (!text) return '';
  return String(text)
    // Reemplazar emojis comunes con texto equivalente
    .replace(/🛒/g, '[Pedido]')
    .replace(/✅/g, '[OK]')
    .replace(/❌/g, '[X]')
    .replace(/🔥/g, '[!]')
    .replace(/💰/g, '[$]')
    .replace(/📞/g, '[Tel]')
    .replace(/💬/g, '[WA]')
    .replace(/✉️/g, '[Mail]')
    .replace(/📍/g, '[Dir]')
    .replace(/🕐/g, '[Hora]')
    .replace(/⭐/g, '[*]')
    .replace(/❤️/g, '<3')
    .replace(/📱/g, '[Tel]')
    // Eliminar emojis restantes (rango Unicode de emojis)
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
    // Limpiar caracteres de control no imprimibles
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Reemplazar caracteres latinos extendidos con equivalentes ASCII
    .replace(/[áàâãäå]/g, 'a').replace(/[ÁÀÂÃÄÅ]/g, 'A')
    .replace(/[éèêë]/g, 'e').replace(/[ÉÈÊË]/g, 'E')
    .replace(/[íìîï]/g, 'i').replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[óòôõö]/g, 'o').replace(/[ÓÒÔÕÖ]/g, 'O')
    .replace(/[úùûü]/g, 'u').replace(/[ÚÙÛÜ]/g, 'U')
    .replace(/[ñ]/g, 'n').replace(/[Ñ]/g, 'N')
    .replace(/[ç]/g, 'c').replace(/[Ç]/g, 'C')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
}

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
     .text(sanitizeForPDF(business.name), { align: 'left' });

  doc.moveDown(0.5);

  // Descripción
  if (business.description) {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#6B7280')
       .text(sanitizeForPDF(business.description), { align: 'left', width: 450 });
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
         .text(`Telefono: ${sanitizeForPDF(business.phone)}`);
    }
    if (business.email) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Email: ${sanitizeForPDF(business.email)}`);
    }
    if (business.address) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Direccion: ${sanitizeForPDF(business.address)}`);
    }
    if (business.schedule) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4B5563')
         .text(`Horario: ${sanitizeForPDF(business.schedule)}`);
    }
  }

  doc.moveDown(1.5);

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTOS
  // ═══════════════════════════════════════════════════════════════════════

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1F2933')
     .text('Catalogo de Productos', { underline: true });
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
         .text(`${index + 1}. ${sanitizeForPDF(p.name)}`);

      // Descripción (si existe)
      if (p.description && p.description.trim()) {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#4B5563')
           .text(sanitizeForPDF(p.description), { width: 450, align: 'left' });
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
         .text(` - ${status}`, { continued: true });

      // Stock level
      if (p.stock_level === 'low' && p.status !== 'unavailable') {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#D97706')
           .text(` [Pocas unidades]`, { continued: true });
      }

      // Categoría (si existe)
      if (p.category && p.category.trim()) {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text(` - ${sanitizeForPDF(p.category)}`);
      } else {
        doc.text('');
      }

      // Espacio entre productos (sin líneas separadoras)
      doc.moveDown(1);
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
