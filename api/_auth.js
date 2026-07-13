/**
 * _auth.js — Firebase token verification with graceful degradation.
 *
 * verifyToken() always returns either a user object or null.
 * It never throws — auth failure = null, not a 500 error.
 */

const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc';
const OWNER_EMAILS = (process.env.OWNER_EMAILS || 'nex.unishghimire@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

// Simple in-process token cache — avoids re-verifying the same token on every
// API call within a single serverless execution context.
const _cache = new Map();
const CACHE_TTL = 55 * 60 * 1000; // 55 min — Firebase tokens last 60min

async function verifyToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token || token.length < 10) return null;

  // Check cache
  const cached = _cache.get(token);
  if (cached && cached.exp > Date.now()) return cached.user;

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(6000), // 6s timeout
      }
    );

    if (!r.ok) {
      // 400 = invalid/expired token (normal) — don't log as error
      if (r.status !== 400) console.error('[auth] lookup HTTP', r.status);
      _cache.delete(token);
      return null;
    }

    const d = await r.json();
    const u = d?.users?.[0];
    if (!u?.localId) return null;

    const user = {
      uid:     u.localId,
      email:   u.email   || '',
      name:    u.displayName || '',
      isOwner: OWNER_EMAILS.includes((u.email || '').toLowerCase()),
    };

    // Cache result
    _cache.set(token, { user, exp: Date.now() + CACHE_TTL });

    // Trim cache to avoid unbounded growth (max 200 tokens)
    if (_cache.size > 200) {
      const oldest = _cache.keys().next().value;
      _cache.delete(oldest);
    }

    return user;
  } catch (e) {
    if (e?.name !== 'AbortError') console.error('[auth] verifyToken error:', e.message);
    return null;
  }
}

module.exports = { verifyToken };
