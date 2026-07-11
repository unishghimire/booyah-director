'use strict';

// Pure-fetch Firebase Admin verification (no native SDK)
// Uses Firebase REST API + Google public keys for JWT verification

const crypto = require('crypto');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function ok(data)        { return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) }; }
function err(code, msg)  { return { statusCode: code, headers: corsHeaders, body: JSON.stringify({ error: msg }) }; }

// ─── Firebase DB helpers (pure fetch, no SDK) ─────────────────────────────
function dbUrl(path) {
  const base = (process.env.FIREBASE_DATABASE_URL || 'https://nexoverlays-default-rtdb.firebaseio.com').replace(/\/$/, '');
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  return `${base}${path}.json?auth=${secret}`;
}
async function dbGet(path) {
  const r = await fetch(dbUrl(path));
  return r.ok ? await r.json() : null;
}
async function dbSet(path, data) {
  await fetch(dbUrl(path), { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
}
async function dbUpdate(path, data) {
  await fetch(dbUrl(path), { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
}
async function dbDelete(path) {
  await fetch(dbUrl(path), { method: 'DELETE' });
}

// ─── Verify Firebase ID token (admin user check) ──────────────────────────
// We call Firebase REST API to verify the token server-side
async function verifyAdminToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const projectId = process.env.FIREBASE_PROJECT_ID || 'nexoverlays';
  if (!projectId) return { uid: 'dev', email: 'admin@dev.local', isAdmin: true }; // dev fallback
  
  try {
    // Use Firebase REST to verify token
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc'}`,
      { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ idToken: token }) }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const user = data.users?.[0];
    if (!user) return null;
    
    // Check if user is in admin list in DB
    const adminRecord = await dbGet(`/booyah_admin/admins/${user.localId}`);
    return adminRecord?.enabled ? { uid: user.localId, email: user.email, isAdmin: true } : null;
  } catch (e) {
    console.error('Token verify error:', e.message);
    return null;
  }
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ─── PLANS ────────────────────────────────────────────────────────────────
const PLANS = {
  weekly:  { id: 'weekly',  label: 'Weekly',  price: 299,  durationDays: 7   },
  monthly: { id: 'monthly', label: 'Monthly', price: 599,  durationDays: 30  },
  yearly:  { id: 'yearly',  label: 'Yearly',  price: 2999, durationDays: 365 },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  // Parse route
  const pathParts = event.path.replace('/.netlify/functions/admin-api', '').replace('/api', '').split('/').filter(Boolean);
  const route = pathParts[0] || '';

  // Parse body
  let body = {};
  if (event.body) { try { body = JSON.parse(event.body); } catch (_) {} }

  // ─── PUBLIC ROUTES (no auth needed) ───────────────────────────────────
  
  // Health check
  if (route === 'health') return ok({ status: 'ok', ts: Date.now() });

  // Plans info (used by main app to check user subscription)
  if (route === 'plans') return ok({ plans: PLANS });

  // ─── PROTECTED ROUTES ──────────────────────────────────────────────────
  const admin = await verifyAdminToken(event.headers.authorization || event.headers.Authorization);
  if (!admin) return err(401, 'Unauthorized — admin access required');

  try {
    // ── DASHBOARD STATS ──────────────────────────────────────────────────
    if (route === 'stats') {
      const users = await dbGet('/booyah_admin/users') || {};
      const promos = await dbGet('/booyah_admin/promo_codes') || {};
      const userArr = Object.values(users);
      const now = Date.now();
      const active = userArr.filter(u => u.subscription?.status === 'active' && u.subscription?.expiresAt > now);
      const revenue = active.reduce((sum, u) => sum + (PLANS[u.subscription?.plan]?.price || 0), 0);
      return ok({
        totalUsers:    userArr.length,
        activeUsers:   active.length,
        totalRevenue:  revenue,
        promoCodes:    Object.keys(promos).length,
        planBreakdown: {
          weekly:  active.filter(u => u.subscription?.plan === 'weekly').length,
          monthly: active.filter(u => u.subscription?.plan === 'monthly').length,
          yearly:  active.filter(u => u.subscription?.plan === 'yearly').length,
        },
      });
    }

    // ── LIST USERS ────────────────────────────────────────────────────────
    if (route === 'users' && event.httpMethod === 'GET') {
      const users = await dbGet('/booyah_admin/users') || {};
      return ok({ users: Object.values(users) });
    }

    // ── GET SINGLE USER ───────────────────────────────────────────────────
    if (route === 'user' && event.httpMethod === 'GET') {
      const uid = event.queryStringParameters?.uid;
      if (!uid) return err(400, 'uid required');
      const user = await dbGet(`/booyah_admin/users/${uid}`);
      return user ? ok({ user }) : err(404, 'User not found');
    }

    // ── UPDATE USER STATUS (activate/suspend/ban) ─────────────────────────
    if (route === 'user-status' && event.httpMethod === 'POST') {
      const { uid, status } = body; // status: 'active' | 'suspended' | 'banned'
      if (!uid || !status) return err(400, 'uid and status required');
      const allowed = ['active', 'suspended', 'banned'];
      if (!allowed.includes(status)) return err(400, `status must be one of: ${allowed.join(', ')}`);
      await dbUpdate(`/booyah_admin/users/${uid}`, { status, updatedAt: Date.now() });
      return ok({ success: true, uid, status });
    }

    // ── ASSIGN / UPDATE SUBSCRIPTION ─────────────────────────────────────
    if (route === 'assign-subscription' && event.httpMethod === 'POST') {
      const { uid, plan, discountPercent = 0, notes = '' } = body;
      if (!uid || !plan) return err(400, 'uid and plan required');
      if (!PLANS[plan]) return err(400, `Invalid plan. Use: ${Object.keys(PLANS).join(', ')}`);
      const p = PLANS[plan];
      const now = Date.now();
      const expiresAt = now + p.durationDays * 86400000;
      const finalPrice = Math.round(p.price * (1 - discountPercent / 100));
      const subscription = { plan, status: 'active', price: finalPrice, originalPrice: p.price, discountPercent, startedAt: now, expiresAt, notes };
      await dbUpdate(`/booyah_admin/users/${uid}`, { subscription, updatedAt: now });
      return ok({ success: true, subscription });
    }

    // ── REVOKE SUBSCRIPTION ───────────────────────────────────────────────
    if (route === 'revoke-subscription' && event.httpMethod === 'POST') {
      const { uid } = body;
      if (!uid) return err(400, 'uid required');
      await dbUpdate(`/booyah_admin/users/${uid}`, {
        subscription: { plan: null, status: 'expired', expiresAt: 0 },
        updatedAt: Date.now()
      });
      return ok({ success: true });
    }

    // ── LIST PROMO CODES ──────────────────────────────────────────────────
    if (route === 'promo-codes' && event.httpMethod === 'GET') {
      const promos = await dbGet('/booyah_admin/promo_codes') || {};
      return ok({ promoCodes: Object.values(promos) });
    }

    // ── CREATE PROMO CODE ─────────────────────────────────────────────────
    if (route === 'create-promo' && event.httpMethod === 'POST') {
      const { code, discountPercent, discountAmount, applicablePlans, maxUses, expiresAt, description } = body;
      if (!code || (!discountPercent && !discountAmount)) return err(400, 'code and discount required');
      const id = genId();
      const promo = {
        id, code: code.toUpperCase().trim(), discountPercent: discountPercent || 0,
        discountAmount: discountAmount || 0, applicablePlans: applicablePlans || ['weekly','monthly','yearly'],
        maxUses: maxUses || 999, usedCount: 0, expiresAt: expiresAt || null,
        description: description || '', active: true, createdAt: Date.now(),
      };
      await dbSet(`/booyah_admin/promo_codes/${code.toUpperCase().trim()}`, promo);
      return ok({ success: true, promo });
    }

    // ── TOGGLE PROMO CODE ACTIVE/INACTIVE ────────────────────────────────
    if (route === 'toggle-promo' && event.httpMethod === 'POST') {
      const { code, active } = body;
      if (!code) return err(400, 'code required');
      await dbUpdate(`/booyah_admin/promo_codes/${code.toUpperCase()}`, { active, updatedAt: Date.now() });
      return ok({ success: true });
    }

    // ── DELETE PROMO CODE ─────────────────────────────────────────────────
    if (route === 'delete-promo' && event.httpMethod === 'DELETE') {
      const { code } = body;
      if (!code) return err(400, 'code required');
      await dbDelete(`/booyah_admin/promo_codes/${code.toUpperCase()}`);
      return ok({ success: true });
    }

    // ── VALIDATE PROMO (called from main app) ─────────────────────────────
    if (route === 'validate-promo') {
      const { code, plan } = body;
      if (!code || !plan) return err(400, 'code and plan required');
      const promo = await dbGet(`/booyah_admin/promo_codes/${code.toUpperCase()}`);
      if (!promo) return err(404, 'Promo code not found');
      if (!promo.active) return err(400, 'Promo code is inactive');
      if (promo.expiresAt && Date.now() > promo.expiresAt) return err(400, 'Promo code has expired');
      if (promo.usedCount >= promo.maxUses) return err(400, 'Promo code usage limit reached');
      if (!promo.applicablePlans.includes(plan)) return err(400, `Code not valid for ${plan} plan`);
      const originalPrice = PLANS[plan].price;
      const discountedPrice = promo.discountAmount
        ? Math.max(0, originalPrice - promo.discountAmount)
        : Math.round(originalPrice * (1 - promo.discountPercent / 100));
      return ok({ valid: true, promo, originalPrice, discountedPrice, savings: originalPrice - discountedPrice });
    }

    // ── PLATFORM SETTINGS ─────────────────────────────────────────────────
    if (route === 'settings' && event.httpMethod === 'GET') {
      const settings = await dbGet('/booyah_admin/settings') || {};
      return ok({ settings });
    }
    if (route === 'settings' && event.httpMethod === 'POST') {
      await dbUpdate('/booyah_admin/settings', { ...body, updatedAt: Date.now() });
      return ok({ success: true });
    }

    return err(404, `Unknown admin route: ${route}`);
  } catch (e) {
    console.error('[admin-api]', e.message);
    return err(500, e.message);
  }
};
