'use strict';

const crypto = require('crypto');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function ok(res, data)       { res.status(200).json(data); }
function err(res, code, msg) { res.status(code).json({ error: msg }); }

// ─── Firebase DB helpers ──────────────────────────────────────────────────
function dbUrl(path) {
  const base   = (process.env.FIREBASE_DATABASE_URL || 'https://nexoverlays-default-rtdb.firebaseio.com').replace(/\/$/, '');
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  return `${base}${path}.json?auth=${secret}`;
}
async function dbGet(path)         { const r = await fetch(dbUrl(path)); return r.ok ? await r.json() : null; }
async function dbSet(path, data)   { await fetch(dbUrl(path), { method:'PUT',   headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); }
async function dbUpdate(path,data) { await fetch(dbUrl(path), { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); }
async function dbDelete(path)      { await fetch(dbUrl(path), { method:'DELETE' }); }

async function verifyAdminToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc'}`,
      { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ idToken: token }) }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const user = data.users?.[0];
    if (!user) return null;
    const adminRecord = await dbGet(`/booyah_admin/admins/${user.localId}`);
    return adminRecord?.enabled ? { uid: user.localId, email: user.email, isAdmin: true } : null;
  } catch(e) { console.error('Token verify error:', e.message); return null; }
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const PLANS = {
  weekly:  { id:'weekly',  label:'Weekly',  price:299,  durationDays:7   },
  monthly: { id:'monthly', label:'Monthly', price:599,  durationDays:30  },
  yearly:  { id:'yearly',  label:'Yearly',  price:2999, durationDays:365 },
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const route = (req.url || '').replace(/^\/api\/?/, '').split('?')[0].split('/')[0];
  const body  = req.body || {};

  // ─── PUBLIC ROUTES ────────────────────────────────────────────────────
  if (route === 'health') return ok(res, { status:'ok', ts: Date.now() });
  if (route === 'plans')  return ok(res, { plans: PLANS });

  // ─── BOOTSTRAP FIRST ADMIN ───────────────────────────────────────────
  if (route === 'bootstrap-admin' && req.method === 'POST') {
    const { secret, uid, email } = body;
    const superSecret = process.env.SUPER_ADMIN_SECRET;
    if (!superSecret)       return err(res, 500, 'SUPER_ADMIN_SECRET env var not set');
    if (secret !== superSecret) return err(res, 403, 'Invalid secret');
    if (!uid || !email)     return err(res, 400, 'uid and email required');
    await dbSet(`/booyah_admin/admins/${uid}`, { uid, email, enabled: true, addedAt: Date.now() });
    return ok(res, { success: true, message: `Admin ${email} bootstrapped. Remove SUPER_ADMIN_SECRET after use.` });
  }

  // ─── PROTECTED ROUTES ────────────────────────────────────────────────
  const admin = await verifyAdminToken(req.headers.authorization || req.headers.Authorization);
  if (!admin) return err(res, 401, 'Unauthorized — admin access required');

  try {
    // STATS
    if (route === 'stats') {
      const users  = await dbGet('/booyah_admin/users')       || {};
      const promos = await dbGet('/booyah_admin/promo_codes') || {};
      const userArr = Object.values(users);
      const now = Date.now();
      const active = userArr.filter(u => u.subscription?.status === 'active' && u.subscription?.expiresAt > now);
      const revenue = active.reduce((sum, u) => sum + (PLANS[u.subscription?.plan]?.price || 0), 0);
      return ok(res, { totalUsers: userArr.length, activeUsers: active.length, totalRevenue: revenue, promoCodes: Object.keys(promos).length, planBreakdown: { weekly: active.filter(u=>u.subscription?.plan==='weekly').length, monthly: active.filter(u=>u.subscription?.plan==='monthly').length, yearly: active.filter(u=>u.subscription?.plan==='yearly').length } });
    }

    // USERS
    if (route === 'users' && req.method === 'GET') { const users = await dbGet('/booyah_admin/users') || {}; return ok(res, { users: Object.values(users) }); }
    if (route === 'user'  && req.method === 'GET') {
      const uid = req.query?.uid || new URL('http://x'+req.url).searchParams.get('uid');
      if (!uid) return err(res, 400, 'uid required');
      const user = await dbGet(`/booyah_admin/users/${uid}`);
      return user ? ok(res, { user }) : err(res, 404, 'User not found');
    }
    if (route === 'user-status' && req.method === 'POST') {
      const { uid, status } = body;
      if (!uid || !status) return err(res, 400, 'uid and status required');
      if (!['active','suspended','banned'].includes(status)) return err(res, 400, 'Invalid status');
      await dbUpdate(`/booyah_admin/users/${uid}`, { status, updatedAt: Date.now() });
      return ok(res, { success: true, uid, status });
    }

    // SUBSCRIPTIONS
    if (route === 'assign-subscription' && req.method === 'POST') {
      const { uid, plan, discountPercent = 0, notes = '' } = body;
      if (!uid || !plan || !PLANS[plan]) return err(res, 400, 'uid and valid plan required');
      const p = PLANS[plan], now = Date.now();
      const subscription = { plan, status:'active', price: Math.round(p.price*(1-discountPercent/100)), originalPrice: p.price, discountPercent, startedAt: now, expiresAt: now + p.durationDays*86400000, notes };
      await dbUpdate(`/booyah_admin/users/${uid}`, { subscription, updatedAt: now });
      return ok(res, { success: true, subscription });
    }
    if (route === 'revoke-subscription' && req.method === 'POST') {
      const { uid } = body; if (!uid) return err(res, 400, 'uid required');
      await dbUpdate(`/booyah_admin/users/${uid}`, { subscription: { plan:null, status:'expired', expiresAt:0 }, updatedAt: Date.now() });
      return ok(res, { success: true });
    }

    // PROMO CODES
    if (route === 'promo-codes'  && req.method === 'GET')    { const promos = await dbGet('/booyah_admin/promo_codes') || {}; return ok(res, { promoCodes: Object.values(promos) }); }
    if (route === 'create-promo' && req.method === 'POST') {
      const { code, discountPercent, discountAmount, applicablePlans, maxUses, expiresAt, description } = body;
      if (!code || (!discountPercent && !discountAmount)) return err(res, 400, 'code and discount required');
      const promo = { id: genId(), code: code.toUpperCase().trim(), discountPercent: discountPercent||0, discountAmount: discountAmount||0, applicablePlans: applicablePlans||['weekly','monthly','yearly'], maxUses: maxUses||999, usedCount:0, expiresAt: expiresAt||null, description: description||'', active:true, createdAt: Date.now() };
      await dbSet(`/booyah_admin/promo_codes/${promo.code}`, promo);
      return ok(res, { success: true, promo });
    }
    if (route === 'toggle-promo' && req.method === 'POST') {
      const { code, active } = body; if (!code) return err(res, 400, 'code required');
      await dbUpdate(`/booyah_admin/promo_codes/${code.toUpperCase()}`, { active, updatedAt: Date.now() });
      return ok(res, { success: true });
    }
    if (route === 'delete-promo' && req.method === 'DELETE') {
      const { code } = body; if (!code) return err(res, 400, 'code required');
      await dbDelete(`/booyah_admin/promo_codes/${code.toUpperCase()}`);
      return ok(res, { success: true });
    }

    // VALIDATE PROMO (called from main app)
    if (route === 'validate-promo') {
      const { code, plan } = body;
      if (!code || !plan) return err(res, 400, 'code and plan required');
      const promo = await dbGet(`/booyah_admin/promo_codes/${code.toUpperCase()}`);
      if (!promo) return err(res, 404, 'Promo code not found');
      if (!promo.active) return err(res, 400, 'Promo code is inactive');
      if (promo.expiresAt && Date.now() > promo.expiresAt) return err(res, 400, 'Promo code expired');
      if (promo.usedCount >= promo.maxUses) return err(res, 400, 'Promo code usage limit reached');
      if (promo.applicablePlans && !promo.applicablePlans.includes(plan)) return err(res, 400, `Not valid for ${plan} plan`);
      let finalPrice = PLANS[plan]?.price || 0;
      if (promo.discountPercent) finalPrice = Math.round(finalPrice * (1 - promo.discountPercent/100));
      if (promo.discountAmount)  finalPrice = Math.max(0, finalPrice - promo.discountAmount);
      return ok(res, { valid:true, promo, finalPrice, originalPrice: PLANS[plan]?.price });
    }

    // SETTINGS
    if (route === 'settings' && req.method === 'GET') { const s = await dbGet('/booyah_admin/settings') || {}; return ok(res, { settings: s }); }
    if (route === 'settings' && req.method === 'POST') { const existing = await dbGet('/booyah_admin/settings') || {}; await dbSet('/booyah_admin/settings', { ...existing, ...body, updatedAt: Date.now() }); return ok(res, { success: true }); }

    return err(res, 404, `Unknown admin route: ${route}`);
  } catch(e) {
    return err(res, 500, e.message);
  }
};
