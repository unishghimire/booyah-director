const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc';
const OWNER_EMAILS = (process.env.OWNER_EMAILS || 'nex.unishghimire@gmail.com').split(',').map(e => e.trim().toLowerCase());

async function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${WEB_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const user = d.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email, isOwner: OWNER_EMAILS.includes(user.email?.toLowerCase()) };
  } catch (e) { console.error('[auth] verify failed:', e.message); return null; }
}

module.exports = { verifyToken };
