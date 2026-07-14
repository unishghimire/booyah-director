'use strict';

// Rate limiting state (in-memory)
const rateLimits = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120;

// Rate limiting middleware helper
function isRateLimited(ip) {
  const now = Date.now();
  if (!rateLimits[ip]) {
    rateLimits[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return false;
  }
  
  if (now > rateLimits[ip].resetTime) {
    rateLimits[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return false;
  }
  
  rateLimits[ip].count += 1;
  return rateLimits[ip].count > MAX_REQUESTS_PER_WINDOW;
}

// Clean up old rate limits periodically to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimits).forEach(ip => {
    if (now > rateLimits[ip].resetTime) {
      delete rateLimits[ip];
    }
  });
}, 5 * 60 * 1000).unref?.();

// Helper to sanitize inputs (recursively sanitizes strings to prevent XSS/injection basics)
function sanitize(val) {
  if (typeof val === 'string') {
    return val
      .trim()
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '') // Remove scripts
      .replace(/<\/?[^>]+(>|$)/g, ''); // Strip basic HTML tags
  }
  if (Array.isArray(val)) {
    return val.map(sanitize);
  }
  if (val !== null && typeof val === 'object') {
    const sanitizedObj = {};
    for (const key of Object.keys(val)) {
      sanitizedObj[key] = sanitize(val[key]);
    }
    return sanitizedObj;
  }
  return val;
}

function ok(res, data) {
  res.status(200).json(data);
}

function err(res, code, msg) {
  // Return only structured error message, hide raw internal stack/details
  res.status(code).json({ error: msg });
}

// ─── Firebase DB helpers ──────────────────────────────────────────────────
function dbUrl(path) {
  const base = (process.env.FIREBASE_DATABASE_URL || 'https://nexoverlays-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/$/, '');
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  if (!secret) return null;
  return `${base}${path}.json?auth=${secret}`;
}

async function dbGet(path) {
  const url = dbUrl(path);
  if (!url) return null;
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function dbSet(path, data) {
  const url = dbUrl(path);
  if (!url) return;
  try {
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {}
}

async function dbUpdate(path, data) {
  const url = dbUrl(path);
  if (!url) return;
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {}
}

async function dbDelete(path) {
  const url = dbUrl(path);
  if (!url) return;
  try {
    await fetch(url, { method: 'DELETE' });
  } catch {}
}

// ─── Verify admin token ───────────────────────────────────────────────────
async function verifyAdminToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const webKey = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc';
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${webKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!r.ok) {
      const errBody = await r.json().catch(() => ({}));
      console.error('[verifyAdminToken] Identity Toolkit error:', errBody);
      return null;
    }
    const data = await r.json();
    const user = data.users?.[0];
    if (!user) return null;

    // Layer 1: hardcoded ADMIN_EMAIL env var — always superadmin
    const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@booyah.gg';
    if (user.email === envAdminEmail) {
      return { uid: user.localId, email: user.email, isAdmin: true, isSuperAdmin: true };
    }

    // Layer 2: DB whitelist — requires FIREBASE_DATABASE_SECRET
    if (!process.env.FIREBASE_DATABASE_SECRET) {
      console.error('[verifyAdminToken] FIREBASE_DATABASE_SECRET not set — DB whitelist check skipped');
      return null;
    }
    const adminRecord = await dbGet(`/booyah_admin/admins/${user.localId}`);
    if (adminRecord && adminRecord.enabled === true) {
      return { uid: user.localId, email: user.email, isAdmin: true };
    }

    return null;
  } catch (e) {
    console.error('[verifyAdminToken] Unexpected error:', e.message);
    return null;
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const PLANS = {
  weekly:  { id: 'weekly',  label: 'Weekly',  price: 299,  durationDays: 7   },
  monthly: { id: 'monthly', label: 'Monthly', price: 599,  durationDays: 30  },
  yearly:  { id: 'yearly',  label: 'Yearly',  price: 2999, durationDays: 365 },
};

module.exports = async (req, res) => {
  // CORS configuration
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting Check
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return err(res, 429, 'Too many requests. Please try again later.');
  }

  // Parse URL & Sanitized Body
  const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const route = parsedUrl.pathname.replace(/^\/api\/?/, '').split('/')[0];
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  const body = req.body ? sanitize(req.body) : {};

  // 1. PUBLIC ROUTES
  if (route === 'health') {
    return ok(res, { status: 'ok', ts: Date.now() });
  }

  // Debug env check — confirms which required env vars are present (values never exposed)
  if (route === 'env-check') {
    return ok(res, {
      FIREBASE_DATABASE_SECRET:  !!process.env.FIREBASE_DATABASE_SECRET,
      FIREBASE_DATABASE_URL:     !!process.env.FIREBASE_DATABASE_URL,
      FIREBASE_WEB_API_KEY:      !!process.env.FIREBASE_WEB_API_KEY,
      SUPER_ADMIN_SECRET:        !!process.env.SUPER_ADMIN_SECRET,
      ADMIN_EMAIL:               !!process.env.ADMIN_EMAIL,
      VITE_ADMIN_ACCESS_CODE:    !!process.env.VITE_ADMIN_ACCESS_CODE,
    });
  }

  if (route === 'plans') {
    return ok(res, { plans: PLANS });
  }

  if (route === 'validate-promo') {
    const { code, plan } = body;
    if (!code || !plan) {
      return err(res, 400, 'code and plan are required');
    }
    const cleanCode = code.toUpperCase().trim();
    const promo = await dbGet(`/booyah_admin/promo_codes/${cleanCode}`);
    if (!promo) {
      return err(res, 404, 'Promo code not found');
    }
    if (!promo.active) {
      return err(res, 400, 'Promo code is inactive');
    }
    if (promo.expiresAt && Date.now() > promo.expiresAt) {
      return err(res, 400, 'Promo code has expired');
    }
    if (promo.usedCount >= promo.maxUses) {
      return err(res, 400, 'Promo code use limit reached');
    }
    if (promo.applicablePlans && !promo.applicablePlans.includes(plan)) {
      return err(res, 400, `Promo code is not applicable for the ${plan} plan`);
    }

    const originalPrice = PLANS[plan]?.price || 0;
    let finalPrice = originalPrice;
    if (promo.discountPercent) {
      finalPrice = Math.round(originalPrice * (1 - promo.discountPercent / 100));
    } else if (promo.discountAmount) {
      finalPrice = Math.max(0, originalPrice - promo.discountAmount);
    }
    return ok(res, { valid: true, promo, finalPrice, originalPrice });
  }

  // 2. ADMIN BOOTSTRAP (Super Admin Secret authorization)
  if (route === 'bootstrap-admin' && req.method === 'POST') {
    const { secret, uid, email } = body;
    const superSecret = process.env.SUPER_ADMIN_SECRET;
    if (!superSecret) {
      return err(res, 500, 'SUPER_ADMIN_SECRET environment variable is not configured in Vercel');
    }
    if (secret !== superSecret) {
      return err(res, 403, 'Invalid super admin secret — check your SUPER_ADMIN_SECRET env var');
    }
    if (!uid || !email) {
      return err(res, 400, 'uid and email are required');
    }
    if (!process.env.FIREBASE_DATABASE_SECRET) {
      return err(res, 500, 'FIREBASE_DATABASE_SECRET environment variable is not configured in Vercel — cannot write to database');
    }
    try {
      await dbSet(`/booyah_admin/admins/${uid}`, {
        uid,
        email,
        enabled: true,
        role: 'superadmin',
        addedAt: Date.now(),
      });
      // Also set ADMIN_EMAIL fallback in DB for reference
      await dbSet(`/booyah_admin/meta/bootstrappedAt`, Date.now());
    } catch (e) {
      return err(res, 500, `Database write failed: ${e.message} — verify FIREBASE_DATABASE_SECRET and database rules`);
    }
    return ok(res, { success: true, message: `Admin ${email} granted super admin access successfully.` });
  }

  // 3. ADMIN AUTHENTICATED ROUTES
  if (route !== 'payment-info') {
    const admin = await verifyAdminToken(req.headers.authorization || req.headers.Authorization);
    if (!admin) {
      return err(res, 401, 'Unauthorized access — admin credentials required');
    }
  }

  try {
    switch (route) {
      case 'stats': {
        const users = (await dbGet('/booyah_admin/users')) || {};
        const promos = (await dbGet('/booyah_admin/promo_codes')) || {};
        const userArr = Object.values(users);
        const now = Date.now();
        const active = userArr.filter(
          u => u.subscription?.status === 'active' && u.subscription?.expiresAt > now
        );
        const totalRevenue = active.reduce(
          (sum, u) => sum + (PLANS[u.subscription?.plan]?.price || 0),
          0
        );

        const subReqs = (await dbGet('/booyah_admin/subscription_requests')) || {};
        const pendingRequests = Object.values(subReqs).filter(r => r.status === 'pending').length;

        return ok(res, {
          totalUsers: userArr.length,
          activeUsers: active.length,
          totalRevenue,
          promoCodes: Object.keys(promos).length,
          pendingRequests,
          planBreakdown: {
            weekly: active.filter(u => u.subscription?.plan === 'weekly').length,
            monthly: active.filter(u => u.subscription?.plan === 'monthly').length,
            yearly: active.filter(u => u.subscription?.plan === 'yearly').length,
          },
        });
      }

      case 'users': {
        if (req.method !== 'GET') return err(res, 405, 'Method not allowed');
        const u = (await dbGet('/booyah_admin/users')) || {};
        return ok(res, { users: Object.values(u) });
      }

      case 'user': {
        if (req.method !== 'GET') return err(res, 405, 'Method not allowed');
        const uid = query.uid;
        if (!uid) {
          return err(res, 400, 'uid query parameter is required');
        }
        const u = await dbGet(`/booyah_admin/users/${uid}`);
        if (!u) {
          return err(res, 404, 'User not found');
        }
        return ok(res, { user: u });
      }

      case 'user-status': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { uid, status } = body;
        if (!uid || !status) {
          return err(res, 400, 'uid and status are required');
        }
        if (!['active', 'suspended', 'banned'].includes(status)) {
          return err(res, 400, 'Invalid status value');
        }
        await dbUpdate(`/booyah_admin/users/${uid}`, {
          status,
          updatedAt: Date.now(),
        });
        return ok(res, { success: true });
      }

      case 'assign-subscription': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { uid, plan, discountPercent = 0, notes = '' } = body;
        if (!uid || !plan || !PLANS[plan]) {
          return err(res, 400, 'Valid uid and plan are required');
        }
        const p = PLANS[plan];
        const now = Date.now();
        const sub = {
          plan,
          status: 'active',
          price: Math.round(p.price * (1 - discountPercent / 100)),
          originalPrice: p.price,
          discountPercent,
          startedAt: now,
          expiresAt: now + p.durationDays * 86400000,
          notes,
        };
        await dbUpdate(`/booyah_admin/users/${uid}`, {
          subscription: sub,
          updatedAt: now,
        });
        return ok(res, { success: true, subscription: sub });
      }

      case 'revoke-subscription': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { uid } = body;
        if (!uid) {
          return err(res, 400, 'uid is required');
        }
        await dbUpdate(`/booyah_admin/users/${uid}`, {
          subscription: { plan: null, status: 'expired', expiresAt: 0 },
          updatedAt: Date.now(),
        });
        return ok(res, { success: true });
      }

      case 'promo-codes': {
        if (req.method !== 'GET') return err(res, 405, 'Method not allowed');
        const p = (await dbGet('/booyah_admin/promo_codes')) || {};
        return ok(res, { promoCodes: Object.values(p) });
      }

      case 'create-promo': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const {
          code,
          discountPercent,
          discountAmount,
          applicablePlans,
          maxUses,
          expiresAt,
          description,
        } = body;
        if (!code || (!discountPercent && !discountAmount)) {
          return err(res, 400, 'code and a valid discount are required');
        }
        const promoCode = code.toUpperCase().trim();
        const promo = {
          id: genId(),
          code: promoCode,
          discountPercent: discountPercent || 0,
          discountAmount: discountAmount || 0,
          applicablePlans: applicablePlans || ['weekly', 'monthly', 'yearly'],
          maxUses: maxUses || 999,
          usedCount: 0,
          expiresAt: expiresAt || null,
          description: description || '',
          active: true,
          createdAt: Date.now(),
        };
        await dbSet(`/booyah_admin/promo_codes/${promoCode}`, promo);
        return ok(res, { success: true, promo });
      }

      case 'toggle-promo': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { code, active } = body;
        if (!code) {
          return err(res, 400, 'code is required');
        }
        await dbUpdate(`/booyah_admin/promo_codes/${code.toUpperCase()}`, {
          active: !!active,
          updatedAt: Date.now(),
        });
        return ok(res, { success: true });
      }

      case 'delete-promo': {
        if (req.method !== 'DELETE' && req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { code } = body;
        if (!code) {
          return err(res, 400, 'code is required');
        }
        await dbDelete(`/booyah_admin/promo_codes/${code.toUpperCase()}`);
        return ok(res, { success: true });
      }

      case 'settings': {
        if (req.method === 'GET') {
          const s = (await dbGet('/booyah_admin/settings')) || {};
          return ok(res, { settings: s });
        }
        if (req.method === 'POST') {
          const ex = (await dbGet('/booyah_admin/settings')) || {};
          await dbSet('/booyah_admin/settings', {
            ...ex,
            ...body,
            updatedAt: Date.now(),
          });
          return ok(res, { success: true });
        }
        return err(res, 405, 'Method not allowed');
      }

      case 'clear-payments': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        await dbSet('/booyah_admin/payment_requests', null);
        return ok(res, { success:true });
      }

      case 'export-users': {
        if (req.method !== 'GET') return err(res, 405, 'Method not allowed');
        const u = (await dbGet('/booyah_admin/users')) || {};
        return ok(res, { users: Object.values(u), exportedAt: new Date().toISOString() });
      }

      case 'list-admins': {
        const admins = (await dbGet('/booyah_admin/admins')) || {};
        return ok(res, { admins: Object.values(admins) });
      }

      case 'revoke-admin': {
        if (req.method !== 'POST' && req.method !== 'DELETE') return err(res, 405, 'Method not allowed');
        const { uid: revokeUid } = body;
        if (!revokeUid) return err(res, 400, 'uid required');
        if (revokeUid === admin.uid) return err(res, 400, 'Cannot revoke your own access');
        await dbDelete(`/booyah_admin/admins/${revokeUid}`);
        return ok(res, { success:true });
      }

      case 'subscription-requests': {
        if (req.method !== 'GET') return err(res, 405, 'Method not allowed');
        const reqs = (await dbGet('/booyah_admin/subscription_requests')) || {};
        const arr = Object.values(reqs).sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
        return ok(res, { requests: arr });
      }

      case 'approve-subscription-request': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { requestId, discountPercent: disc = 0 } = body;
        if (!requestId) return err(res, 400, 'requestId required');
        const reqData = await dbGet(`/booyah_admin/subscription_requests/${requestId}`);
        if (!reqData) return err(res, 404, 'Request not found');
        const PLAN_DURATION = { weekly: 7, monthly: 30, yearly: 365 };
        const PLAN_PRICES = { weekly: 299, monthly: 599, yearly: 2999 };
        const plan = reqData.plan;
        const durationDays = PLAN_DURATION[plan] || 30;
        const now = Date.now();
        const sub = {
          plan,
          status: 'active',
          price: Math.round((PLAN_PRICES[plan] || 0) * (1 - disc / 100)),
          originalPrice: PLAN_PRICES[plan] || 0,
          discountPercent: disc,
          startedAt: now,
          expiresAt: now + durationDays * 86400000,
          notes: reqData.notes || '',
          approvedByAdmin: true,
        };
        // Update user subscription
        await dbUpdate(`/booyah_admin/users/${reqData.uid}`, { subscription: sub, updatedAt: now });
        // Mark request as approved
        await dbUpdate(`/booyah_admin/subscription_requests/${requestId}`, { status: 'approved', approvedAt: now, discountPercent: disc });
        // Sync to user's director DB path
        try {
          const dUrl = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, '');
          const dSecret = process.env.FIREBASE_DATABASE_SECRET;
          if (dUrl && dSecret) {
            await fetch(`${dUrl}/users/${reqData.uid}/booyah/subscription.json?auth=${dSecret}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sub),
            });
          }
        } catch(syncErr) {
          console.error('[approve-subscription-request] Director DB sync failed:', syncErr.message);
        }
        return ok(res, { success: true, subscription: sub });
      }

      case 'reject-subscription-request': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
        const { requestId, reason: rejReason = '' } = body;
        if (!requestId) return err(res, 400, 'requestId required');
        await dbUpdate(`/booyah_admin/subscription_requests/${requestId}`, {
          status: 'rejected', rejectedAt: Date.now(), reason: rejReason,
        });
        return ok(res, { success: true });
      }

      case 'payment-requests': {
        // GET: fetch all payment requests sorted by submittedAt desc
        const reqs = (await dbGet('/booyah_admin/payment_requests')) || {};
        const arr = Object.values(reqs).sort((a,b)=>(b.submittedAt||0)-(a.submittedAt||0));
        return ok(res, { requests: arr });
      }

      case 'approve-payment': {
        // POST: { requestId, note }
        const { requestId, note='' } = body;
        if (!requestId) return err(res, 400, 'requestId required');
        const reqData = await dbGet(`/booyah_admin/payment_requests/${requestId}`);
        if (!reqData) return err(res, 404, 'Not found');
        const PLAN_DURATION = { weekly:7, monthly:30, yearly:365 };
        const now = Date.now();
        const durationDays = PLAN_DURATION[reqData.plan] || 30;
        const sub = {
          plan: reqData.plan, status:'active',
          price: reqData.finalPrice, originalPrice: reqData.originalPrice,
          discountPercent: reqData.promoDiscount||0,
          startedAt: now, expiresAt: now + durationDays*86400000,
          paymentMethod: reqData.paymentMethod, transactionId: reqData.transactionId,
          approvedAt: now, adminNote: note,
        };
        await dbUpdate(`/booyah_admin/users/${reqData.uid}`, { subscription: sub, pendingPayment: null, updatedAt: now });
        await dbUpdate(`/booyah_admin/payment_requests/${requestId}`, { status:'approved', approvedAt: now, adminNote: note });
        // Also sync to user's director DB path so their app sees the active subscription immediately
        try {
          const directorDbUrl = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, '');
          const directorSecret = process.env.FIREBASE_DATABASE_SECRET;
          if (directorDbUrl && directorSecret) {
            await fetch(`${directorDbUrl}/users/${reqData.uid}/booyah/subscription.json?auth=${directorSecret}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sub),
            });
          }
        } catch(syncErr) {
          console.error('[approve-payment] Director DB sync failed:', syncErr.message);
        }
        return ok(res, { success:true, subscription: sub });
      }

      case 'reject-payment': {
        // POST: { requestId, reason }
        const { requestId: rId, reason } = body;
        if (!rId || !reason) return err(res, 400, 'requestId and reason required');
        const rReq = await dbGet(`/booyah_admin/payment_requests/${rId}`);
        if (!rReq) return err(res, 404, 'Not found');
        await dbUpdate(`/booyah_admin/payment_requests/${rId}`, { status:'rejected', rejectedAt: Date.now(), rejectionReason: reason });
        await dbUpdate(`/booyah_admin/users/${rReq.uid}`, { pendingPayment: { status:'rejected', reason, requestId: rId }, updatedAt: Date.now() });
        return ok(res, { success:true });
      }

      case 'payment-info': {
        // Public endpoint — no auth required
        // Returns only the payment-relevant subset of settings
        const s = (await dbGet('/booyah_admin/settings')) || {};
        return ok(res, {
          esewa: {
            number: s.esewaNumber || '',
            name: s.esewaName || '',
            qrUrl: s.esewaQrUrl || '',
          },
          bank: {
            bankName: s.bankName || '',
            accountName: s.bankAccountName || '',
            accountNumber: s.bankAccountNumber || '',
            branch: s.bankBranch || '',
            qrUrl: s.bankQrUrl || '',
          },
          imgbbApiKey: '', // never expose
        });
      }

      default:
        return err(res, 404, `Unknown route: ${route}`);
    }
  } catch (e) {
    console.error('[admin-api] Unhandled error:', e.message, e.stack);
    return err(res, 500, `Internal Server Error: ${e.message}`);
  }
};