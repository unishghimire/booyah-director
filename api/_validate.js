/**
 * _validate.js — Input sanitization and validation.
 * Every function here is safe-by-default — never throws.
 */

/**
 * Strips HTML tags, trims, and enforces max length.
 */
function sanitizeString(val, maxLen = 100) {
  if (val == null) return '';
  if (typeof val !== 'string') {
    try { val = String(val); } catch { return ''; }
  }
  return val.trim().slice(0, maxLen).replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

/**
 * Returns null if all required fields are present, or an error message string.
 * Treats 0 and false as valid (non-missing) values.
 */
function requireFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return 'Invalid request body';
  for (const f of fields) {
    const val = obj[f];
    if (val === undefined || val === null || val === '') {
      return `Missing required field: ${f}`;
    }
  }
  return null;
}

/**
 * Safely parses a number, returning fallback if NaN/Infinity.
 */
function sanitizeNumber(val, { min = -Infinity, max = Infinity, fallback = 0 } = {}) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Safely parses a URL — returns '' if invalid/non-http.
 */
function sanitizeUrl(val, maxLen = 500) {
  const s = sanitizeString(val, maxLen);
  if (!s) return '';
  try {
    const u = new URL(s);
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    return s;
  } catch {
    return '';
  }
}

module.exports = { sanitizeString, sanitizeNumber, sanitizeUrl, requireFields };
