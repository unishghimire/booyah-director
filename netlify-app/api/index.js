// ─────────────────────────────────────────────────────
// BOOYAH DIRECTOR API — Single-file bundle for Vercel
// All helpers inlined to avoid Vercel's single-file bundling limitation
// ─────────────────────────────────────────────────────

// ── VALIDATE ─────────────────────────────────────────
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


// ── RATE LIMIT ───────────────────────────────────────
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


// ── DATABASE ─────────────────────────────────────────
/**
 * _db.js — Firebase Realtime Database adapter with graceful degradation.
 *
 * If Firebase is not configured (missing env vars), operations silently
 * return empty/default data instead of crashing the API.
 *
 * loadDb  → always returns a valid db object, never throws
 * saveDb  → returns false on failure instead of throwing (caller decides)
 */

const BASE_URL = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
const SECRET   = process.env.FIREBASE_DATABASE_SECRET || '';

const CONFIGURED = Boolean(BASE_URL && SECRET);

function fbUrl(uid, suffix = '') {
  return `${BASE_URL}/users/${uid}/booyah${suffix}.json?auth=${SECRET}`;
}

// In-memory fallback for when Firebase is not configured
// (data survives within a single serverless invocation, not between calls)
const _memStore = new Map();

async function loadDb(uid) {
  if (!CONFIGURED) {
    // Return in-memory state for the session
    return _memStore.get(uid) || getDefaultDb();
  }
  try {
    const res = await fetch(fbUrl(uid), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.error(`[db] Firebase read HTTP ${res.status} for uid=${uid}`);
      return _memStore.get(uid) || getDefaultDb();
    }
    const data = await res.json();
    if (!data) return getDefaultDb();
    const def = getDefaultDb();
    const merged = {
      ...def,
      ...data,
      overlay_state: { ...def.overlay_state, ...(data.overlay_state || {}) },
      design: { ...def.design, ...(data.design || {}) },
      // Ensure arrays are always arrays
      tournaments:        Array.isArray(data.tournaments)        ? data.tournaments        : [],
      teams:              Array.isArray(data.teams)              ? data.teams              : [],
      players:            Array.isArray(data.players)            ? data.players            : [],
      matches:            Array.isArray(data.matches)            ? data.matches            : [],
      match_standings:    Array.isArray(data.match_standings)    ? data.match_standings    : [],
      kill_events:        Array.isArray(data.kill_events)        ? data.kill_events        : [],
      elimination_events: Array.isArray(data.elimination_events) ? data.elimination_events : [],
    };
    _memStore.set(uid, merged); // cache for this invocation
    return merged;
  } catch (e) {
    console.error('[db] loadDb error:', e.message);
    return _memStore.get(uid) || getDefaultDb();
  }
}

async function saveDb(uid, db) {
  if (!CONFIGURED) {
    _memStore.set(uid, db);
    return true;
  }
  try {
    const res = await fetch(fbUrl(uid), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[db] Firebase write HTTP ${res.status} for uid=${uid}`);
      _memStore.set(uid, db); // cache anyway
      return false;
    }
    _memStore.set(uid, db);
    return true;
  } catch (e) {
    console.error('[db] saveDb error:', e.message);
    _memStore.set(uid, db); // cache anyway
    return false;
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getDefaultDb() {
  return {
    tournaments:        [],
    teams:              [],
    players:            [],
    matches:            [],
    match_standings:    [],
    kill_events:        [],
    elimination_events: [],
    overlay_state: {
      id: 'singleton',
      tournament_id: null,
      current_screen: 'setup_blank',
      mvp_player_id: null,
      mvp_player_name: null,
      mvp_team_name: null,
      mvp_kills: 0,
      champion_team_id: null,
      champion_team_name: null,
      champion_total_points: 0,
      last_updated_at: new Date().toISOString(),
    },
    design: {
      accentColor:      '#FF6B00',
      accentColor2:     '#00D4FF',
      bgColor:          '#060915',
      textColor:        '#ffffff',
      tournamentName:   'BOOYAH CUP',
      tournamentSubtitle: 'GRAND FINALS',
      gameLabel:        'GAME',
      logoUrl:          '',
      sponsorLogoUrl:   '',
      overlayStyle:     'default',
      fontStyle:        'orbitron',
      casters: [
        { name: 'CASTER ONE',   role: 'SHOUTCASTER', handle: '@caster1', photo: '' },
        { name: 'CASTER TWO',   role: 'ANALYST',     handle: '@caster2', photo: '' },
        { name: 'CASTER THREE', role: 'HOST',         handle: '@caster3', photo: '' },
      ],
      organizerName: 'GARENA',
    },
  };
}


// ── AUTH ─────────────────────────────────────────────
/**
 * _auth.js — Firebase token verification with graceful degradation.
 *
 * verifyToken() always returns either a user object or null.
 * It never throws — auth failure = null, not a 500 error.
 */

const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc';
const OWNER_EMAILS = (process.env.OWNER_EMAILS || 'nex.unishghimire@gmail.com,unishghimire2@gmail.com')
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
        signal: AbortSignal.timeout(4000), // 4s timeout
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


// ── MAIN HANDLER ─────────────────────────────────────

const DEFAULT_DESIGN = {
  accentColor: '#ff4e00', accentColor2: '#ffaa00', bgColor: '#0c0c0e',
  textColor: '#ffffff', tournamentName: 'BOOYAH CUP', tournamentSubtitle: 'GRAND FINALS',
  gameLabel: 'GAME', logoUrl: '', overlayStyle: 'default', fontStyle: 'orbitron',
  casters: [
    { name: 'CASTER ONE', role: 'SHOUTCASTER', handle: '@caster1', photo: '' },
    { name: 'CASTER TWO', role: 'ANALYST',     handle: '@caster2', photo: '' },
    { name: 'CASTER THREE', role: 'HOST',       handle: '@caster3', photo: '' },
  ],
  organizerName: 'GARENA', sponsorLogoUrl: '', sponsorName: '',
  backgrounds: { standings: '', champion: '', teams: '', scoreboard: '' },
  playerPhotos: {}, teamLogos: {}, mapImages: {},
};


// ── Recalculate and persist team totals from all match standings ──────────────
function recalcTeamTotals(db, tournament_id) {
  const teams = tournament_id
    ? db.teams.filter(t => t.tournament_id === tournament_id)
    : db.teams;

  for (const team of teams) {
    const teamStandings = db.match_standings.filter(s => s.team_id === team.id);
    const teamPlayers   = db.players.filter(p => p.team_id === team.id);

    const totalPoints = teamStandings.reduce((sum, s) => sum + (s.total_match_points || 0), 0);
    const totalKills  = teamPlayers.reduce((sum, p) => sum + (p.total_tournament_kills || 0), 0);

    const idx = db.teams.findIndex(t => t.id === team.id);
    if (idx !== -1) {
      db.teams[idx].total_tournament_points = totalPoints;
      db.teams[idx].total_tournament_kills  = totalKills;
    }
  }
}

module.exports = async (req, res) => {
  // GLOBAL_CATCH — ensures every error returns JSON, never crashes the function cold
  try {
    // CORS Configuration
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    const CORS = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate Limiting
    const ip = req.headers['x-nf-client-connection-ip'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown';
    if (!rateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Parse Route and Query
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const route = urlObj.pathname.replace(/^\/api\/?/, '').split('/')[0];
    const query = Object.fromEntries(urlObj.searchParams.entries());
    const body = req.body || {};

    const ok  = (data) => res.status(200).json(data);
    const err = (code, msg) => res.status(code).json({ error: msg });

    // 1. PUBLIC ROUTE: getOverlayData
    if (route === 'getOverlayData') {
      const tokenParam = query.token || query.shareToken;
      const authHeader = req.headers.authorization || req.headers.Authorization || '';
      let uid = null;

      if (authHeader.startsWith('Bearer ')) {
        const authUser = await verifyToken(authHeader);
        if (authUser) uid = authUser.uid;
      }

      // Fallback: If no Bearer token, we authenticate overlay view via shareToken
      if (!uid && tokenParam) {
        // Direct query fallback for dev / OBS sources with authenticated URLs
        if (query.uid) {
          uid = query.uid;
        } else if (process.env.VITE_DEV_MODE || process.env.DEV_UID) {
          uid = process.env.DEV_UID || 'dev_fallback_uid';
        }

        if (!uid) {
          // Find which user owns this shareToken
          // We look it up under /booyah_admin/share_tokens/{token}
          const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
          const secret = process.env.FIREBASE_DATABASE_SECRET;
          if (dbBaseUrl && secret) {
            try {
              // Encode token param in case of unusual characters
              const encodedToken = encodeURIComponent(tokenParam);
              const rToken = await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${encodedToken}.json?auth=${secret}`);
              if (rToken.ok) {
                uid = await rToken.json(); // returns the uid string
              }

              // Option B: scan users node fallback if direct mapping lookup missed
              if (!uid) {
                try {
                  const usersR = await fetch(`${dbBaseUrl}/booyah_admin/users.json?auth=${secret}&shallow=true`);
                  if (usersR.ok) {
                    const usersObj = await usersR.json();
                    if (usersObj) {
                      for (const testUid of Object.keys(usersObj)) {
                        const stR = await fetch(`${dbBaseUrl}/booyah_admin/users/${testUid}/shareToken.json?auth=${secret}`);
                        if (stR.ok) {
                          const st = await stR.json();
                          if (st === tokenParam) {
                            uid = testUid;
                            break;
                          }
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.error('[getOverlayData] fallback scan error:', e.message);
                }
              }
            } catch (e) {
              console.error('[getOverlayData] Token fetch error:', e.message);
            }
          }
        }
      } else if (!uid && query.uid) {
        // Direct ?uid= fallback even without token parameter
        uid = query.uid;
      }

      if (!uid) {
        return ok({
          tournament: null,
          overlay_state: { 
            id: 'singleton', 
            tournament_id: null, 
            current_screen: 'setup_blank', 
            error: 'Invalid or missing share token',
            last_updated_at: new Date().toISOString() 
          },
          design: DEFAULT_DESIGN,
          teams: [],
          players: [],
          matches: [],
          match_standings: [],
          kill_events: [],
          elimination_events: [],
          current_match: null,
          kill_feed: [],
          eliminations: [],
          standings: []
        });
      }

      try {
        const db = await loadDb(uid);
        const tournament = db.tournaments.find(t => t.status === 'active') || db.tournaments[db.tournaments.length - 1] || null;
        if (!tournament) {
          return ok({
            tournament: null,
            overlay_state: db.overlay_state,
            design: db.design || DEFAULT_DESIGN,
            teams: [],
            players: [],
            matches: [],
            match_standings: [],
            kill_events: [],
            elimination_events: [],
            current_match: null,
            kill_feed: [],
            eliminations: [],
            standings: []
          });
        }
        const tid = tournament.id;
        const teams = db.teams.filter(t => t.tournament_id === tid).map(t => {
          // total_match_points already includes placement + kills*ppk (set by setTeamPlacement)
          const standingsForTeam = db.match_standings.filter(s => s.tournament_id === tid && s.team_id === t.id);
          const totalPoints      = standingsForTeam.reduce((sum, s) => sum + (s.total_match_points || 0), 0);
          const teamPlayers      = db.players.filter(p => p.team_id === t.id);
          const totalKills       = teamPlayers.reduce((sum, p) => sum + (p.total_tournament_kills || 0), 0);
          return { ...t, total_tournament_kills: totalKills, total_tournament_points: totalPoints };
        }).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
        
        const players = db.players.filter(p => p.tournament_id === tid).map(p => ({ ...p, is_alive: p.is_alive !== undefined ? p.is_alive : true }));
        const matches = db.matches.filter(m => m.tournament_id === tid).sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
        const currentMatch = matches[0] || null;
        
        let killFeed = [], eliminations = [], standings = [];
        if (currentMatch) {
          killFeed     = db.kill_events.filter(k => k.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15).map(k => ({ ...k, killed_name: k.killed_player_name || k.killed_name || 'Opponent' }));
          eliminations = db.elimination_events.filter(e => e.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
          standings    = db.match_standings.filter(s => s.match_id === currentMatch.id);
        }
        return ok({
          tournament,
          overlay_state: db.overlay_state,
          design: db.design || DEFAULT_DESIGN,
          teams,
          players,
          matches,
          match_standings: db.match_standings.filter(s => s.tournament_id === tid),
          kill_events: db.kill_events.filter(k => k.tournament_id === tid),
          elimination_events: db.elimination_events.filter(e => e.tournament_id === tid),
          current_match: currentMatch,
          kill_feed: killFeed,
          eliminations,
          standings
        });
      } catch (e) {
        return err(500, 'Database load error');
      }
    }

    // 2. PUBLIC ROUTE: registerUser (Firebase signup callback)
    if (route === 'registerUser') {
      const authHeader = req.headers.authorization || req.headers.Authorization || '';
      const user = await verifyToken(authHeader);
      if (!user) return err(401, 'Invalid or expired authentication token');

      try {
        // Just initialize database default structure
        const db = await loadDb(user.uid);
        await saveDb(user.uid, db);
        return ok({ success: true, uid: user.uid, email: user.email });
      } catch (e) {
        return err(500, 'Failed to register user database');
      }
    }

    // ─── AUTHENTICATION REQUIRED FOR ALL OTHER ROUTES ───
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const user = await verifyToken(authHeader);
    if (!user) return err(401, 'Unauthorized: Valid Bearer token required');

    const { uid, isOwner } = user;

    const db = await loadDb(uid);
    if (!db.design)              db.design = { ...DEFAULT_DESIGN };
    if (!db.tournaments)         db.tournaments = [];
    if (!db.teams)               db.teams = [];
    if (!db.players)             db.players = [];
    if (!db.matches)             db.matches = [];
    if (!db.match_standings)     db.match_standings = [];
    if (!db.kill_events)         db.kill_events = [];
    if (!db.elimination_events)  db.elimination_events = [];
    if (!db.overlay_state) {
      db.overlay_state = {
        id: 'singleton', tournament_id: null, current_screen: 'setup_blank',
        mvp_player_id: null, mvp_player_name: null, mvp_team_name: null, mvp_kills: 0,
        champion_team_id: null, champion_team_name: null, champion_total_points: 0,
        last_updated_at: new Date().toISOString(),
      };
    }

    // ── CHECK SUBSCRIPTION ───────────────────────────────────────────────
    if (route === 'checkSubscription') {
      if (isOwner) {
        return ok({ uid, subscription: { plan: 'yearly', status: 'active', expiresAt: Date.now() + 315360000000 } });
      }
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (secret && dbBaseUrl) {
        try {
          const subR = await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}.json?auth=${secret}`);
          const subData = subR.ok ? await subR.json() : null;
          return ok({ uid, subscription: subData?.subscription || null });
        } catch {
          return ok({ uid, subscription: null });
        }
      }
      return ok({ uid, subscription: null });
    }

    // ── GET SHARE TOKEN ──────────────────────────────────────────────────
    if (route === 'getShareToken') {
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (!secret || !dbBaseUrl) return ok({ token: null, shareToken: null, error: 'Database not configured' });

      try {
        // Read current shareToken for this user
        const r = await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`);
        let token = r.ok ? await r.json() : null;
        if (!token) {
          // Generate new token
          token = genId() + genId();
          // Write mapping token -> uid
          await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${token}.json?auth=${secret}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uid)
          });
          // Write user -> token
          await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token)
          });
        }
        return ok({ token, shareToken: token });
      } catch (e) {
        return err(500, 'Failed to fetch or generate share token');
      }
    }

    // ── GENERATE SHARE TOKEN ──────────────────────────────────────────────
    if (route === 'generateShareToken') {
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (!secret || !dbBaseUrl) return ok({ token: null, shareToken: null, error: 'Database not configured' });

      try {
        const token = genId() + genId();
        // Write mapping token -> uid
        await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${token}.json?auth=${secret}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uid)
        });
        // Write user -> token
        await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token)
        });
        return ok({ token });
      } catch (e) {
        return err(500, 'Failed to generate share token');
      }
    }

    // ── SAVE / UPDATE / GET DESIGN ────────────────────────────────────────
    if (route === 'saveDesign' || route === 'updateDesign') {
      const sanitizedCasters = (body.casters || []).map(c => ({
        name: sanitizeString(c.name, 40),
        role: sanitizeString(c.role, 40),
        handle: sanitizeString(c.handle, 40),
        photo: sanitizeString(c.photo || '', 300)
      }));

      // Sanitize backgrounds object
      const sanitizedBackgrounds = {
        standings: sanitizeUrl((body.backgrounds || db.design?.backgrounds || {}).standings || '', 500),
        champion:  sanitizeUrl((body.backgrounds || db.design?.backgrounds || {}).champion  || '', 500),
        teams:     sanitizeUrl((body.backgrounds || db.design?.backgrounds || {}).teams     || '', 500),
        scoreboard:sanitizeUrl((body.backgrounds || db.design?.backgrounds || {}).scoreboard|| '', 500),
      };
      // Preserve and merge playerPhotos/teamLogos/mapImages (keyed by ID)
      const existingPhotos = db.design?.playerPhotos || {};
      const incomingPhotos = typeof body.playerPhotos === 'object' && body.playerPhotos ? body.playerPhotos : {};
      const existingLogos  = db.design?.teamLogos    || {};
      const incomingLogos  = typeof body.teamLogos   === 'object' && body.teamLogos   ? body.teamLogos   : {};
      const existingMaps   = db.design?.mapImages    || {};
      const incomingMaps   = typeof body.mapImages   === 'object' && body.mapImages   ? body.mapImages   : {};

      db.design = {
        ...DEFAULT_DESIGN,
        ...db.design,
        accentColor:        sanitizeString(body.accentColor      || db.design?.accentColor, 20),
        accentColor2:       sanitizeString(body.accentColor2     || db.design?.accentColor2, 20),
        bgColor:            sanitizeString(body.bgColor          || db.design?.bgColor, 20),
        textColor:          sanitizeString(body.textColor        || db.design?.textColor, 20),
        tournamentName:     sanitizeString(body.tournamentName   !== undefined ? body.tournamentName   : db.design?.tournamentName, 100),
        tournamentSubtitle: sanitizeString(body.tournamentSubtitle !== undefined ? body.tournamentSubtitle : db.design?.tournamentSubtitle, 100),
        gameLabel:          sanitizeString(body.gameLabel        !== undefined ? body.gameLabel        : db.design?.gameLabel, 40),
        logoUrl:            sanitizeUrl(body.logoUrl             !== undefined ? body.logoUrl          : db.design?.logoUrl, 300),
        overlayStyle:       sanitizeString(body.overlayStyle     || db.design?.overlayStyle, 40),
        fontStyle:          sanitizeString(body.fontStyle        || db.design?.fontStyle, 40),
        casters:            sanitizedCasters,
        organizerName:      sanitizeString(body.organizerName    !== undefined ? body.organizerName    : db.design?.organizerName, 100),
        sponsorLogoUrl:     sanitizeUrl(body.sponsorLogoUrl      !== undefined ? body.sponsorLogoUrl   : db.design?.sponsorLogoUrl, 300),
        sponsorName:        sanitizeString(body.sponsorName      !== undefined ? body.sponsorName      : db.design?.sponsorName, 100),
        backgrounds:        sanitizedBackgrounds,
        playerPhotos:       { ...existingPhotos, ...incomingPhotos },
        teamLogos:          { ...existingLogos,  ...incomingLogos  },
        mapImages:          { ...existingMaps,   ...incomingMaps   },
      };

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok(route === 'getDesign' ? (db.design || DEFAULT_DESIGN) : { success: true, design: db.design });
    }

    if (route === 'getDesign') {
      return ok({ design: db.design || DEFAULT_DESIGN });
    }

    // ── CREATE / INITIALIZE TOURNAMENT ────────────────────────────────────
    if (route === 'initializeTournament' || route === 'createTournament') {
      const missing = requireFields(body, ['name', 'total_matches']);
      if (missing) return err(400, missing);

      const name = sanitizeString(body.name, 100);
      const total_matches = parseInt(body.total_matches);
      const points_per_kill = parseInt(body.points_per_kill) || 1;
      const defaultConfig = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };

      // Ensure shareToken exists on first init
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (secret && dbBaseUrl) {
        try {
          const r = await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`);
          let token = r.ok ? await r.json() : null;
          if (!token) {
            token = genId() + genId();
            await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${token}.json?auth=${secret}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uid)
            });
            await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token)
            });
          }
        } catch (_) {}
      }

      // Any previously active tournament gets status set to 'completed'
      db.tournaments = db.tournaments.map(t => {
        if (t.status === 'active') {
          return { ...t, status: 'completed' };
        }
        return t;
      });

      const tournament = {
        id: genId(),
        name,
        total_matches,
        points_per_kill,
        placement_points_config: typeof body.placement_points_config === 'string'
          ? body.placement_points_config
          : JSON.stringify(body.placement_points_config || defaultConfig),
        current_match_number: 0,
        status: 'active',
        created_at: new Date().toISOString()
      };

      db.tournaments.push(tournament);
      db.overlay_state.tournament_id = tournament.id;
      db.overlay_state.current_screen = 'setup_blank';
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, tournament });
    }

    // ── LIST / GET TOURNAMENTS ────────────────────────────────────────────
    if (route === 'listTournaments' || route === 'getTournaments') {
      const enriched = db.tournaments.map(t => {
        const tid = t.id;
        const tournamentTeams = db.teams.filter(team => team.tournament_id === tid);
        const tournamentMatches = db.matches.filter(m => m.tournament_id === tid);
        
        // Calculate standings
        const teamsWithPoints = tournamentTeams.map(team => {
          const standingsForTeam = db.match_standings.filter(s => s.tournament_id === tid && s.team_id === team.id);
          const placementPoints  = standingsForTeam.reduce((sum, s) => sum + (s.placement_points_awarded || 0), 0);
          const teamPlayers      = db.players.filter(p => p.team_id === team.id);
          const totalKills       = teamPlayers.reduce((sum, p) => sum + (p.total_tournament_kills || 0), 0);
          const totalPoints      = placementPoints + (totalKills * (t.points_per_kill || 1));
          return {
            id: team.id,
            name: team.name,
            total_points: totalPoints
          };
        }).sort((a, b) => b.total_points - a.total_points);

        return {
          ...t,
          team_count: tournamentTeams.length,
          match_count: tournamentMatches.length,
          standings: teamsWithPoints.slice(0, 3) // Top 3 teams
        };
      });

      const sorted = enriched.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      
      if (route === 'getTournaments') {
        return ok(sorted);
      }
      return ok({ tournaments: sorted });
    }

    // ── SWITCH TOURNAMENT ─────────────────────────────────────────────────
    if (route === 'switchTournament') {
      const { tournament_id } = body;
      if (!tournament_id) return err(400, 'tournament_id is required');

      const exists = db.tournaments.some(t => t.id === tournament_id);
      if (!exists) return err(404, 'Tournament not found');

      db.tournaments = db.tournaments.map(t => ({
        ...t,
        status: t.id === tournament_id ? 'active' : 'completed'
      }));

      db.overlay_state.tournament_id = tournament_id;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── DELETE TOURNAMENT ─────────────────────────────────────────────────
    if (route === 'deleteTournament') {
      const { tournament_id } = body;
      if (!tournament_id) return err(400, 'tournament_id is required');

      const target = db.tournaments.find(t => t.id === tournament_id);
      if (!target) return err(404, 'Tournament not found');

      const wasActive = target.status === 'active';

      // Remove the tournament
      db.tournaments = db.tournaments.filter(t => t.id !== tournament_id);

      // If it was active, sets the most recent other tournament as active
      if (wasActive && db.tournaments.length > 0) {
        const remainingSorted = [...db.tournaments].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const mostRecent = remainingSorted[0];
        db.tournaments = db.tournaments.map(t => ({
          ...t,
          status: t.id === mostRecent.id ? 'active' : 'completed'
        }));
        db.overlay_state.tournament_id = mostRecent.id;
      } else if (db.tournaments.length === 0) {
        db.overlay_state.tournament_id = null;
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, deleted_id: tournament_id });
    }

    // ── ADD TEAM ──────────────────────────────────────────────────────────
    if (route === 'addTeam') {
      const missing = requireFields(body, ['tournament_id', 'team_name']);
      if (missing) return err(400, missing);

      if (db.teams.filter(t => t.tournament_id === body.tournament_id).length >= 12) {
        return err(400, 'Maximum 12 teams allowed');
      }

      const team = {
        id: genId(),
        tournament_id: sanitizeString(body.tournament_id),
        name: sanitizeString(body.team_name, 100),
        logo_url: body.logo_url ? sanitizeString(body.logo_url, 300) : null,
        total_tournament_points: 0,
        total_tournament_kills: 0,
        created_at: new Date().toISOString()
      };

      db.teams.push(team);

      const createdPlayers = (body.player_names || []).filter(n => n?.trim()).slice(0, 4).map(name => {
        const p = {
          id: genId(),
          team_id: team.id,
          tournament_id: team.tournament_id,
          name: sanitizeString(name, 100),
          is_alive: true,
          current_match_kills: 0,
          total_tournament_kills: 0,
          created_at: new Date().toISOString()
        };
        db.players.push(p);
        return p;
      });

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, team, players: createdPlayers });
    }

    // ── ADD PLAYER ────────────────────────────────────────────────────────
    if (route === 'addPlayer') {
      const missing = requireFields(body, ['team_id', 'name']);
      if (missing) return err(400, missing);

      const team = db.teams.find(t => t.id === body.team_id);
      if (!team) return err(404, 'Team not found');

      if (db.players.filter(p => p.team_id === team.id).length >= 6) {
        return err(400, 'Max 6 players per team');
      }

            const player = {
        id: genId(),
        team_id: team.id,
        tournament_id: body.tournament_id ? sanitizeString(body.tournament_id) : team.tournament_id,
        name: sanitizeString(body.name, 100),
        role: sanitizeString(body.role || ', 50),
        photo_url: sanitizeUrl(body.photo_url || '),
        is_alive: true,
        current_match_kills: Number(body.current_match_kills) || 0,
        total_tournament_kills: Number(body.total_tournament_kills) || 0,
        real_name: body.real_name ? sanitizeString(body.real_name, 100) : ',
        nationality: body.nationality ? sanitizeString(body.nationality, 100) : ',
        dob: body.dob ? sanitizeString(body.dob, 50) : ',
        instagram: body.instagram ? sanitizeString(body.instagram, 100) : ',
        youtube: body.youtube ? sanitizeString(body.youtube, 100) : ',
        twitter: body.twitter ? sanitizeString(body.twitter, 100) : ',
        avg_kills_per_match: Number(body.avg_kills_per_match) || 0,
        best_placement: Number(body.best_placement) || 0,
        total_points: Number(body.total_points) || 0,
        matches_played: Number(body.matches_played) || 0,
        matches_won: Number(body.matches_won) || 0,
        created_at: new Date().toISOString()
      };

      db.players.push(player);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, player });
    }

    // ── START / START NEXT MATCH ──────────────────────────────────────────
    if (route === 'startNextMatch' || route === 'startMatch') {
      const missing = requireFields(body, ['tournament_id']);
      if (missing) return err(400, missing);

      const tIdx = db.tournaments.findIndex(t => t.id === body.tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');

      const newMatchNumber = (db.tournaments[tIdx].current_match_number || 0) + 1;
      db.tournaments[tIdx].current_match_number = newMatchNumber;
      db.tournaments[tIdx].status = 'active';

      const match = {
        id: genId(),
        tournament_id: db.tournaments[tIdx].id,
        match_number: newMatchNumber,
        state: 'pre_match',
        map_name: sanitizeString(body.map_name, 50) || 'Bermuda',
        started_at: new Date().toISOString(),
        ended_at: null
      };

      db.matches.push(match);
      db.players = db.players.map(p => p.tournament_id === match.tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      db.overlay_state.current_screen = 'maplabel';
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, match, match_number: newMatchNumber });
    }

    // ── UPDATE MATCH STATE ────────────────────────────────────────────────
    if (route === 'updateMatchState') {
      const missing = requireFields(body, ['match_id', 'state']);
      if (missing) return err(400, missing);

      const mIdx = db.matches.findIndex(m => m.id === body.match_id);
      if (mIdx === -1) return err(404, 'Match not found');

      db.matches[mIdx].state = sanitizeString(body.state, 30);
      if (db.matches[mIdx].state === 'ended') {
        db.matches[mIdx].ended_at = new Date().toISOString();
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, match: db.matches[mIdx] });
    }

    // ── ADD KILL ──────────────────────────────────────────────────────────
    if (route === 'addKill') {
      const missing = requireFields(body, ['match_id', 'killer_player_id']);
      if (missing) return err(400, missing);

      // Resolve tournament_id from match if not provided in body
      let resolvedTid = body.tournament_id;
      if (!resolvedTid) {
        const m = db.matches.find(match => match.id === body.match_id);
        if (m) resolvedTid = m.tournament_id;
      }

      const kill = {
        id: genId(),
        match_id: sanitizeString(body.match_id),
        tournament_id: sanitizeString(resolvedTid || ''),
        killer_player_id: sanitizeString(body.killer_player_id),
        killer_name: sanitizeString(body.killer_name, 100) || 'Unknown',
        killer_team_name: sanitizeString(body.killer_team_name, 100) || '',
        killed_player_name: sanitizeString(body.killed_player_name, 100) || 'Opponent',
        killed_team_name: sanitizeString(body.killed_team_name, 100) || '',
        timestamp: new Date().toISOString()
      };

      db.kill_events.push(kill);
      const pIdx = db.players.findIndex(p => p.id === kill.killer_player_id);
      if (pIdx !== -1) {
        db.players[pIdx].current_match_kills = (db.players[pIdx].current_match_kills || 0) + 1;
        db.players[pIdx].total_tournament_kills = (db.players[pIdx].total_tournament_kills || 0) + 1;
      }

      // Roll up team kill totals
      recalcTeamTotals(db, kill.tournament_id);

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, kill });
    }

    // ── ELIMINATE PLAYER ──────────────────────────────────────────────────
    if (route === 'eliminatePlayer') {
      const missing = requireFields(body, ['match_id', 'player_id']);
      if (missing) return err(400, missing);

      // Resolve tournament_id from match if not provided in body
      let resolvedTid = body.tournament_id;
      if (!resolvedTid) {
        const m = db.matches.find(match => match.id === body.match_id);
        if (m) resolvedTid = m.tournament_id;
      }

      const elim = {
        id: genId(),
        match_id: sanitizeString(body.match_id),
        tournament_id: sanitizeString(resolvedTid || ''),
        eliminated_player_id: sanitizeString(body.player_id),
        eliminated_player_name: sanitizeString(body.player_name, 100) || 'Unknown',
        eliminated_team_name: sanitizeString(body.team_name, 100) || '',
        timestamp: new Date().toISOString()
      };

      db.elimination_events.push(elim);
      const pIdx = db.players.findIndex(p => p.id === elim.eliminated_player_id);
      if (pIdx !== -1) db.players[pIdx].is_alive = false;

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, elimination: elim });
    }

    // ── SET TEAM PLACEMENT ────────────────────────────────────────────────
    if (route === 'setTeamPlacement') {
      const missing = requireFields(body, ['match_id', 'team_id', 'placement']);
      if (missing) return err(400, missing);

      // Resolve tournament_id from match if not provided in body
      let resolvedTid = body.tournament_id;
      if (!resolvedTid) {
        const m = db.matches.find(match => match.id === body.match_id);
        if (m) resolvedTid = m.tournament_id;
      }

      const tournament = db.tournaments.find(t => t.id === resolvedTid);
      let config = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };
      try {
        if (tournament?.placement_points_config) config = JSON.parse(tournament.placement_points_config);
        if (body.placement_points_config) config = body.placement_points_config;
      } catch (_) {}

      const placement = parseInt(body.placement);
      const placementPts = config[placement] || 0;
      const teamPlayers = db.players.filter(p => p.team_id === body.team_id);
      const teamKills   = teamPlayers.reduce((sum, p) => sum + (p.current_match_kills || 0), 0);
      const totalMatchPoints = placementPts + (teamKills * (tournament?.points_per_kill || 1));

      const existing = db.match_standings.findIndex(s => s.match_id === body.match_id && s.team_id === body.team_id);
      const standing = {
        id: existing !== -1 ? db.match_standings[existing].id : genId(),
        match_id: sanitizeString(body.match_id),
        tournament_id: sanitizeString(resolvedTid || ''),
        team_id: sanitizeString(body.team_id),
        team_name: sanitizeString(body.team_name, 100) || '',
        placement,
        placement_points_awarded: placementPts,
        team_kills_this_match: teamKills,
        total_match_points: totalMatchPoints
      };

      if (existing !== -1) db.match_standings[existing] = standing;
      else db.match_standings.push(standing);

      // Roll up team totals after each placement entry
      recalcTeamTotals(db, resolvedTid || standing.tournament_id);

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, standing });
    }

    // ── CALCULATE MVP ─────────────────────────────────────────────────────
    if (route === 'calculateMVP') {
      const missing = requireFields(body, ['match_id']);
      if (missing) return err(400, missing);

      const killMap = {};
      for (const evt of db.kill_events.filter(k => k.match_id === body.match_id)) {
        if (!killMap[evt.killer_player_id]) {
          killMap[evt.killer_player_id] = { name: evt.killer_name, team: evt.killer_team_name, kills: 0, player_id: evt.killer_player_id };
        }
        killMap[evt.killer_player_id].kills++;
      }
      const sorted = Object.values(killMap).sort((a, b) => b.kills - a.kills);
      if (!sorted.length) return ok({ mvp: null, tied: false, message: 'No kills recorded' });
      const maxKills = sorted[0].kills;
      const top = sorted.filter(p => p.kills === maxKills);
      return ok({ mvp: top[0], tied: top.length > 1, tied_players: top, max_kills: maxKills });
    }


    // ── SWITCH OVERLAY SCREEN ──────────────────────────────────────────────
    if (route === 'switchOverlayScreen') {
      const missing = requireFields(body, ['screen']);
      if (missing) return err(400, missing);
      const screen = sanitizeString(body.screen, 50);
      if (!screen) return err(400, 'screen is required');
      if (!/^[a-z0-9_-]+$/.test(screen)) return err(400, 'Invalid screen name');
      db.overlay_state.current_screen = screen;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, current_screen: screen });
    }

    // ── SET MVP / SET MVP AND SHOW SCREEN ─────────────────────────────────
    if (route === 'setMVPAndShowScreen' || route === 'setMVP') {
      const mvpMissing = requireFields(body, ['player_id', 'player_name', 'team_name']);
      if (mvpMissing) return err(400, mvpMissing);
      const playerExists = db.players.some(p => p.id === body.player_id);
      if (!playerExists) return err(404, 'Player not found — calculate MVP first');
      db.overlay_state = {
        ...db.overlay_state,
        current_screen: 'mvp',
        mvp_player_id: sanitizeString(body.player_id),
        mvp_player_name: sanitizeString(body.player_name, 100),
        mvp_team_name: sanitizeString(body.team_name, 100),
        mvp_kills: parseInt(body.kills) || 0,
        last_updated_at: new Date().toISOString()
      };
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── SET CHAMPION / SET CHAMPION AND SHOW SCREEN ───────────────────────
    if (route === 'setChampionAndShowScreen' || route === 'setChampion') {
      db.overlay_state = {
        ...db.overlay_state,
        current_screen: 'champions',
        champion_team_id: sanitizeString(body.team_id),
        champion_team_name: sanitizeString(body.team_name, 100) || '',
        champion_total_points: parseInt(body.total_points) || 0,
        last_updated_at: new Date().toISOString()
      };
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── DECLARE CHAMPIONS ─────────────────────────────────────────────────
    if (route === 'declareChampions') {
      const missing = requireFields(body, ['tournament_id']);
      if (missing) return err(400, missing);

      const tIdx = db.tournaments.findIndex(t => t.id === body.tournament_id);
      if (tIdx !== -1) db.tournaments[tIdx].status = 'completed';

      const teams = db.teams.filter(t => t.tournament_id === body.tournament_id).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, rankings: teams.map((t, i) => ({ rank: i + 1, team: t.name, total_points: t.total_tournament_points, total_kills: t.total_tournament_kills })) });
    }

    // ── DELETE TEAM ───────────────────────────────────────────────────────
    // ── UPDATE PLAYER (photo, role, name) ──────────────────────────────────
        if (route === 'updatePlayer') {
      const missing = requireFields(body, ['player_id']);
      if (missing) return err(400, missing);
      const idx = db.players.findIndex(p => p.id === body.player_id);
      if (idx === -1) return err(404, 'Player not found');
      if (body.name !== undefined)      db.players[idx].name      = sanitizeString(body.name, 100);
      if (body.role !== undefined)      db.players[idx].role      = sanitizeString(body.role, 50);
      if (body.photo_url !== undefined) db.players[idx].photo_url = sanitizeUrl(body.photo_url || ');
      
      // Additional fields for NexPlay Broadcast Studio
      if (body.real_name !== undefined) db.players[idx].real_name = sanitizeString(body.real_name, 100);
      if (body.nationality !== undefined) db.players[idx].nationality = sanitizeString(body.nationality, 100);
      if (body.team_id !== undefined) db.players[idx].team_id = sanitizeString(body.team_id, 100);
      if (body.is_alive !== undefined) db.players[idx].is_alive = !!body.is_alive;
      if (body.dob !== undefined) db.players[idx].dob = sanitizeString(body.dob, 50);
      
      // Social Handles
      if (body.instagram !== undefined) db.players[idx].instagram = sanitizeString(body.instagram, 100);
      if (body.youtube !== undefined) db.players[idx].youtube = sanitizeString(body.youtube, 100);
      if (body.twitter !== undefined) db.players[idx].twitter = sanitizeString(body.twitter, 100);
      
      // Statistics
      if (body.total_tournament_kills !== undefined) db.players[idx].total_tournament_kills = Number(body.total_tournament_kills) || 0;
      if (body.current_match_kills !== undefined) db.players[idx].current_match_kills = Number(body.current_match_kills) || 0;
      if (body.avg_kills_per_match !== undefined) db.players[idx].avg_kills_per_match = Number(body.avg_kills_per_match) || 0;
      if (body.best_placement !== undefined) db.players[idx].best_placement = Number(body.best_placement) || 0;
      if (body.total_points !== undefined) db.players[idx].total_points = Number(body.total_points) || 0;
      if (body.matches_played !== undefined) db.players[idx].matches_played = Number(body.matches_played) || 0;
      if (body.matches_won !== undefined) db.players[idx].matches_won = Number(body.matches_won) || 0;

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, player: db.players[idx] });
    }

    // ── UPDATE TEAM (logo, color) ──────────────────────────────────────────
    if (route === 'updateTeam') {
      const missing = requireFields(body, ['team_id']);
      if (missing) return err(400, missing);
      const idx = db.teams.findIndex(t => t.id === body.team_id);
      if (idx === -1) return err(404, 'Team not found');
      if (body.team_name) db.teams[idx].name      = sanitizeString(body.team_name, 100);
      if (body.logo_url !== undefined) db.teams[idx].logo_url = sanitizeUrl(body.logo_url || '');
      if (body.color)     db.teams[idx].color     = sanitizeString(body.color, 20);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, team: db.teams[idx] });
    }

    if (route === 'deleteTeam') {
      const missing = requireFields(body, ['team_id']);
      if (missing) return err(400, missing);

      db.teams = db.teams.filter(t => t.id !== body.team_id);
      db.players = db.players.filter(p => p.team_id !== body.team_id);
      db.match_standings = db.match_standings.filter(s => s.team_id !== body.team_id);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true });
    }

    if (route === 'deletePlayer') {
      const missing = requireFields(body, ['player_id']);
      if (missing) return err(400, missing);

      db.players = db.players.filter(p => p.id !== body.player_id);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── UPDATE TEAM LOGO ───────────────────────────────────────────────────
    if (route === 'updateTeamLogo') {
      const missing = requireFields(body, ['team_id', 'logo_url']);
      if (missing) return err(400, missing);

      const tIdx = db.teams.findIndex(t => t.id === body.team_id);
      if (tIdx === -1) return err(404, 'Team not found');

      db.teams[tIdx].logo_url = sanitizeString(body.logo_url, 400);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, team: db.teams[tIdx] });
    }


    // ── REVIVE PLAYER ─────────────────────────────────────────────────────
    if (route === 'revivePlayer') {
      const missing = requireFields(body, ['player_id']);
      if (missing) return err(400, missing);

      const pIdx = db.players.findIndex(p => p.id === body.player_id);
      if (pIdx === -1) return err(404, 'Player not found');

      db.players[pIdx].is_alive = true;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, player: db.players[pIdx] });
    }

    // ── RESET MATCH ───────────────────────────────────────────────────────
    if (route === 'resetMatch') {
      const { match_id, tournament_id } = body;
      if (match_id) {
        db.kill_events = db.kill_events.filter(k => k.match_id !== match_id);
        db.elimination_events = db.elimination_events.filter(e => e.match_id !== match_id);
        db.match_standings = db.match_standings.filter(s => s.match_id !== match_id);
        const mIdx = db.matches.findIndex(m => m.id === match_id);
        if (mIdx !== -1) db.matches[mIdx].state = 'pre_match';
      }
      if (tournament_id) {
        db.players = db.players.map(p => p.tournament_id === tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      }
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── UPDATE TOURNAMENT ─────────────────────────────────────────────────
    if (route === 'updateTournament') {
      const missing = requireFields(body, ['tournament_id']);
      if (missing) return err(400, missing);

      const tIdx = db.tournaments.findIndex(t => t.id === body.tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');

      const updates = {};
      if (body.name) updates.name = sanitizeString(body.name, 100);
      if (body.total_matches) updates.total_matches = parseInt(body.total_matches);
      if (body.points_per_kill) updates.points_per_kill = parseInt(body.points_per_kill);
      if (body.placement_points_config) updates.placement_points_config = JSON.stringify(body.placement_points_config);
      if (body.status) updates.status = sanitizeString(body.status, 20);

      db.tournaments[tIdx] = { ...db.tournaments[tIdx], ...updates };
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, tournament: db.tournaments[tIdx] });
    }

    // ── RESET DATABASE (OWNER ONLY) ───────────────────────────────────────
    if (route === 'resetDatabase') {
      if (!isOwner) return err(403, 'Forbidden: Owner permission required');
      
      const activeT = db.tournaments.find(t => t.status === 'active');
      if (activeT) {
        const tid = activeT.id;
        const activeMatchIds = new Set(db.matches.filter(m => m.tournament_id === tid).map(m => m.id));

        db.teams = db.teams.filter(t => t.tournament_id !== tid);
        db.players = db.players.filter(p => p.tournament_id !== tid);
        db.matches = db.matches.filter(m => m.tournament_id !== tid);
        db.match_standings = db.match_standings.filter(s => s.tournament_id !== tid);
        db.kill_events = db.kill_events.filter(k => !activeMatchIds.has(k.match_id) && k.tournament_id !== tid);
        db.elimination_events = db.elimination_events.filter(e => !activeMatchIds.has(e.match_id) && e.tournament_id !== tid);

        if (db.overlay_state.tournament_id === tid) {
          db.overlay_state.current_screen = 'setup_blank';
          db.overlay_state.mvp_player_id = null;
          db.overlay_state.mvp_player_name = null;
          db.overlay_state.mvp_team_name = null;
          db.overlay_state.mvp_kills = 0;
          db.overlay_state.champion_team_id = null;
          db.overlay_state.champion_team_name = null;
          db.overlay_state.champion_total_points = 0;
        }
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, message: 'Match data reset successfully' });
    }

    // ── VALIDATE PROMO ────────────────────────────────────────────────────
    if (route === 'validatePromo') {
      const code = sanitizeString(body.code || '', 50).toUpperCase();
      const plan = sanitizeString(body.plan || '', 20).toLowerCase();
      if (!code) return err(400, 'Promo code is required');

      // Promo codes live in the admin database, not user DB
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;

      let promo = null;
      if (dbBaseUrl && secret) {
        try {
          const r = await fetch(`${dbBaseUrl}/booyah_admin/promo_codes/${encodeURIComponent(code)}.json?auth=${secret}`);
          if (r.ok) promo = await r.json();
        } catch (_) {}
      }

      if (!promo) return err(404, 'Invalid promo code');
      if (promo.used_count >= (promo.max_uses || 1)) return err(400, 'Promo code has been fully redeemed');
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) return err(400, 'Promo code has expired');
      if (promo.active === false) return err(400, 'Promo code is inactive');

      const PRICES = { weekly: 299, monthly: 599, yearly: 2999 };
      const originalPrice = PRICES[plan] || PRICES.monthly;
      const discountPct = promo.discount_percent || 0;
      const discountedPrice = Math.round(originalPrice * (1 - discountPct / 100));
      const savings = originalPrice - discountedPrice;

      return ok({ success: true, code, discountPercent: discountPct, originalPrice, discountedPrice, savings });
    }

    // ── GOOGLE SHEETS IMPORT (Public CSV — no service account needed) ────────
    if (route === 'importFromSheet') {
      const { sheet_url, tournament_id } = body;
      if (!sheet_url) return err(400, 'sheet_url is required');

      // Extract sheet ID from URL
      const match = sheet_url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return err(400, 'Invalid Google Sheets URL. Make sure you paste the full URL from your browser.');
      const sheetId = match[1];

      let teamsAdded = 0, playersAdded = 0;
      try {
        // Fetch Teams tab as public CSV
        const teamsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Teams`;
        const playersUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Players`;

        const fetchCsv = async (url) => {
          const r = await fetch(url);
          if (!r.ok) return null;
          const text = await r.text();
          if (!text || text.includes('<!DOCTYPE')) return null; // private sheet
          return text;
        };

        const parseCsv = (text) => {
          if (!text) return [];
          return text.split('\n')
            .slice(1) // skip header row
            .map(line => {
              // Handle quoted CSV fields
              const cols = [];
              let cur = '', inQ = false;
              for (const ch of line) {
                if (ch === '"') { inQ = !inQ; }
                else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
                else { cur += ch; }
              }
              cols.push(cur.trim());
              return cols;
            })
            .filter(row => row[0] && row[0].replace(/"/g,'').trim()); // skip empty rows
        };

        // Resolve active tournament
        const activeTournament = tournament_id
          ? db.tournaments.find(t => t.id === tournament_id)
          : (db.tournaments.find(t => t.status === 'active') || db.tournaments[db.tournaments.length - 1]);
        if (!activeTournament) return err(404, 'No active tournament. Create one first.');
        const resolvedTid = activeTournament.id;

        // Import Teams
        const teamsCsv = await fetchCsv(teamsUrl);
        if (teamsCsv === null) return err(403, 'Could not read sheet. Make sure it is shared publicly: File → Share → Anyone with link can view.');
        const teamsData = parseCsv(teamsCsv);

        for (const row of teamsData) {
          const teamName = (row[0] || '').replace(/"/g,'').trim();
          const logoUrl  = (row[1] || '').replace(/"/g,'').trim();
          const color    = (row[2] || '').replace(/"/g,'').trim();
          if (!teamName) continue;
          if (!db.teams.find(t => t.name?.toLowerCase() === teamName.toLowerCase())) {
            db.teams.push({ id:genId(), tournament_id:resolvedTid, name:teamName, logo_url:sanitizeUrl(logoUrl), color:color||'', total_tournament_points:0, total_tournament_kills:0 });
            teamsAdded++;
          }
        }

        // Import Players
        const playersCsv = await fetchCsv(playersUrl);
        if (playersCsv) {
          const playersData = parseCsv(playersCsv);
          for (const row of playersData) {
            const playerName = (row[0] || '').replace(/"/g,'').trim();
            const teamName   = (row[1] || '').replace(/"/g,'').trim();
            const role       = (row[2] || '').replace(/"/g,'').trim();
            const photoUrl   = (row[3] || '').replace(/"/g,'').trim();
            if (!playerName || !teamName) continue;
            const team = db.teams.find(t => t.name?.toLowerCase() === teamName.toLowerCase());
            if (!team) continue;
            if (db.players.find(p => p.name === playerName && p.team_id === team.id)) continue;
            if (db.players.filter(p => p.team_id === team.id).length >= 6) continue;
            db.players.push({ id:genId(), team_id:team.id, tournament_id:resolvedTid, name:playerName, role:role||'', photo_url:sanitizeUrl(photoUrl)||'', is_alive:true, current_match_kills:0, total_tournament_kills:0, created_at:new Date().toISOString() });
            playersAdded++;
          }
        }

        db.overlay_state.last_updated_at = new Date().toISOString();
        await saveDb(uid, db);
        return ok({ success:true, teams_added:teamsAdded, players_added:playersAdded, sheet_id:sheetId });
      } catch(e) { return err(500, `Sheet import failed: ${e.message}`); }
    }

    // ── DISCORD WEBHOOK — save ─────────────────────────────────────────────────
    if (route === 'saveDiscordWebhook') {
      const { tournament_id, webhook_url, channel_name } = body;
      if (!tournament_id) return err(400, 'tournament_id is required');
      const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');
      // Clear webhook if url is empty string
      db.tournaments[tIdx].discord_webhook_url  = webhook_url  ? sanitizeUrl(webhook_url, 300) : '';
      db.tournaments[tIdx].discord_channel_name = channel_name ? sanitizeString(channel_name, 100) : '';
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── DISCORD WEBHOOK — test ─────────────────────────────────────────────────
    if (route === 'testDiscordWebhook') {
      const { webhook_url, tournament_name } = body;
      const url = sanitizeUrl(webhook_url || '', 300);
      if (!url) return err(400, 'webhook_url is required');
      try {
        const payload = {
          embeds: [{
            title: '✅ Booyah Director Connected',
            description: `Webhook verified for **${sanitizeString(tournament_name || 'Tournament', 100)}**. You're all set to post updates!`,
            color: 0xFF6B00,
            footer: { text: 'Booyah Director Overlay System' },
            timestamp: new Date().toISOString(),
          }]
        };
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) {
          const txt = await r.text();
          return err(400, `Discord rejected the webhook: ${r.status} — ${txt.slice(0,200)}`);
        }
        return ok({ success: true });
      } catch (e) {
        return err(500, `Failed to reach Discord: ${e.message}`);
      }
    }

    // ── DISCORD WEBHOOK — post update ─────────────────────────────────────────
    if (route === 'postDiscord') {
      const { tournament_id, type } = body;
      if (!tournament_id) return err(400, 'tournament_id is required');
      if (!type) return err(400, 'type is required (standings|mvp|champion|teams)');

      const tournament = db.tournaments.find(t => t.id === tournament_id);
      if (!tournament) return err(404, 'Tournament not found');
      const webhookUrl = sanitizeUrl(tournament.discord_webhook_url || '', 300);
      if (!webhookUrl) return err(400, 'No Discord webhook URL configured for this tournament');

      const tName = sanitizeString(tournament.name, 100);
      const teams = db.teams.filter(t => t.tournament_id === tournament_id);
      const players = db.players.filter(p => p.tournament_id === tournament_id);
      const overlayState = db.overlay_state || {};
      const acc = 0xFF6B00;

      let payload;
      if (type === 'standings') {
        const sorted = [...teams].sort((a,b)=>(b.total_tournament_points||0)-(a.total_tournament_points||0));
        const rows = sorted.slice(0,12).map((t,i) =>
          `\`${String(i+1).padStart(2,'0')}\` **${t.name}** — ${t.total_tournament_kills||0} kills · ${t.total_tournament_points||0} pts`
        ).join('\n');
        payload = { embeds:[{ title:`📊 Live Standings — ${tName}`, description: rows || 'No teams yet.', color: acc, footer:{ text:'Booyah Director' }, timestamp: new Date().toISOString() }] };

      } else if (type === 'mvp') {
        const name  = sanitizeString(overlayState.mvp_player_name || 'TBD', 60);
        const team  = sanitizeString(overlayState.mvp_team_name   || 'TBD', 60);
        const kills = overlayState.mvp_kills || 0;
        payload = { embeds:[{ title:`⭐ Match MVP — ${tName}`, description:`**${name}** from **${team}**\n🎯 Kills: **${kills}**`, color: acc, footer:{ text:'Booyah Director' }, timestamp: new Date().toISOString() }] };

      } else if (type === 'champion') {
        const champ  = sanitizeString(overlayState.champion_team_name   || (teams[0]?.name) || 'TBD', 60);
        const pts    = overlayState.champion_total_points || teams[0]?.total_tournament_points || 0;
        const kills  = teams.find(t=>t.name===champ)?.total_tournament_kills || 0;
        payload = { embeds:[{ title:`🏆 Champions — ${tName}`, description:`🥇 **${champ}**\n📊 Total Points: **${pts}**\n🎯 Total Kills: **${kills}**`, color: 0xFFD700, footer:{ text:'Booyah Director' }, timestamp: new Date().toISOString() }] };

      } else if (type === 'teams') {
        const lines = teams.map(t => {
          const playerCount = players.filter(p=>p.team_id===t.id).length;
          return `• **${t.name}** (${playerCount} players)`;
        }).join('\n');
        payload = { embeds:[{ title:`👥 Team Lineup — ${tName}`, description: lines || 'No teams registered.', color: acc, footer:{ text:'Booyah Director' }, timestamp: new Date().toISOString() }] };

      } else {
        return err(400, `Unknown type: ${type}. Use standings|mvp|champion|teams`);
      }

      try {
        const r = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) {
          const txt = await r.text();
          return err(400, `Discord error: ${r.status} — ${txt.slice(0,200)}`);
        }
        return ok({ success: true, type });
      } catch (e) {
        return err(500, `Failed to reach Discord: ${e.message}`);
      }
    }

    return err(404, `Unknown route: ${route}`);
  } catch (e) {
    return err(500, 'Internal Server Error');
  }
};
