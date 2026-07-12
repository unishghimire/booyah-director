function sanitizeString(val, maxLen = 100) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen).replace(/<[^>]*>/g, ''); // strip HTML tags
}

function requireFields(obj, fields) {
  for (const f of fields) {
    if (!obj[f] && obj[f] !== 0) return `Missing required field: ${f}`;
  }
  return null;
}

module.exports = { sanitizeString, requireFields };
