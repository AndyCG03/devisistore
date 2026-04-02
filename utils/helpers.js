/**
 * Formatea un número como precio.
 * @param {number} value
 * @param {string} currency
 */
exports.formatPrice = (value, currency = '$') => {
  return `${currency}${parseFloat(value || 0).toFixed(2)}`;
};

/**
 * Trunca un texto a una longitud máxima.
 */
exports.truncate = (str, len = 100) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

/**
 * Devuelve la URL de WhatsApp con un mensaje predefinido.
 */
exports.whatsappUrl = (number, message = '¡Hola! Me interesa un producto de tu catálogo.') => {
  const clean = (number || '').replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
};

/**
 * Construye la URL pública de un negocio.
 */
exports.shopUrl = (slug) => `/shop/${slug}`;
