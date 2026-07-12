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
    const res = await fetch(fbUrl(uid), { signal: AbortSignal.timeout(8000) });
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
      signal: AbortSignal.timeout(8000),
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

module.exports = { loadDb, saveDb, genId, getDefaultDb, CONFIGURED };
