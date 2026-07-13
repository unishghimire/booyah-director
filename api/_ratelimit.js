const store = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120; // per minute per IP

function rateLimit(ip) {
  const now = Date.now();
  const key = ip;
  let rec = store.get(key);
  if (!rec || now - rec.ts > WINDOW_MS) { rec = { ts: now, count: 0 }; store.set(key, rec); }
  rec.count++;
  if (rec.count > MAX_REQUESTS) return false;
  // Cleanup old entries periodically
  if (store.size > 10000) { for (const [k, v] of store) { if (now - v.ts > WINDOW_MS) store.delete(k); } }
  return true;
}

module.exports = { rateLimit };
