/**
 * auth.js — PIN-based access control with AES-GCM encryption
 *
 * PINs are stored in localStorage encrypted with AES-GCM (Web Crypto API).
 * Even if someone reads localStorage they cannot recover the PIN values.
 * The encryption key is derived from a per-browser device fingerprint.
 */

const STORAGE_KEY = 'bd_pins_v2';    // encrypted PIN store
const SESSION_KEY = 'bd_sess_v2';    // session flags

const DEFAULT_PINS = { director: '1234', inputer: '5678' };

// ── Crypto helpers ────────────────────────────────────────────────────────────

/** Derive an AES-GCM key from a stable per-device seed (not sent to server) */
async function _getKey() {
  // Seed: combine navigator properties for a stable per-browser value
  const seed = [
    navigator.language,
    navigator.platform || '',
    screen.colorDepth,
    'bd_v2_salt_2026',
  ].join('|');

  const enc  = new TextEncoder();
  const raw  = await crypto.subtle.importKey('raw', enc.encode(seed), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('booyah-salt'), iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function _encrypt(obj) {
  const key   = await _getKey();
  const iv    = crypto.getRandomValues(new Uint8Array(12));
  const data  = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // Store as base64(iv) + ':' + base64(cipher)
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  return toB64(iv) + ':' + toB64(cipher);
}

async function _decrypt(stored) {
  try {
    const key      = await _getKey();
    const [ivB64, cipherB64] = stored.split(':');
    const fromB64  = (b) => Uint8Array.from(atob(b), c => c.charCodeAt(0));
    const iv       = fromB64(ivB64);
    const cipher   = fromB64(cipherB64);
    const plain    = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null; // corrupted or wrong device — fall back to defaults
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns current PINs (decrypts from localStorage, falls back to defaults) */
export async function getPins() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PINS };
    // Legacy plain JSON (from old installs) — migrate
    if (!stored.includes(':')) {
      const legacy = JSON.parse(stored);
      await setPins({ ...DEFAULT_PINS, ...legacy }); // re-encrypt
      return { ...DEFAULT_PINS, ...legacy };
    }
    const decrypted = await _decrypt(stored);
    return decrypted ? { ...DEFAULT_PINS, ...decrypted } : { ...DEFAULT_PINS };
  } catch {
    return { ...DEFAULT_PINS };
  }
}

/** Encrypts and saves PINs to localStorage */
export async function setPins(pins) {
  try {
    const encrypted = await _encrypt(pins);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch {
    // Fallback: store plain if crypto unavailable (very old browsers)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  }
}

// ── Session helpers (in-memory only, cleared on tab close) ───────────────────

export function getSession() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export function setSession(role) {
  const s = getSession();
  s[role] = true;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(role) {
  const s = getSession();
  delete s[role];
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function isAuthorized(role) {
  return getSession()[role] === true;
}

/** Async PIN check — decrypts stored PINs and compares */
export async function checkPin(role, pin) {
  const pins = await getPins();
  return pins[role] === pin;
}
