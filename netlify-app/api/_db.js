// Required env: FIREBASE_DATABASE_URL, FIREBASE_DATABASE_SECRET
const BASE_URL = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, '');
const SECRET   = process.env.FIREBASE_DATABASE_SECRET;

/**
 * Generates the Firebase Realtime Database URL for a given user and suffix.
 * @param {string} uid - User identifier.
 * @param {string} [suffix=''] - Path suffix (e.g., '/design').
 * @returns {string} Fully qualified URL with authorization.
 */
function fbUrl(uid, suffix = '') {
  return `${BASE_URL}/users/${uid}/booyah${suffix}.json?auth=${SECRET}`;
}

/**
 * Loads database state from Firebase for a user.
 * @param {string} uid - User identifier.
 * @returns {Promise<Object>} The database schema.
 */
async function loadDb(uid) {
  if (!BASE_URL || !SECRET) {
    throw new Error('Firebase not configured: set FIREBASE_DATABASE_URL and FIREBASE_DATABASE_SECRET');
  }
  const res = await fetch(fbUrl(uid));
  if (!res.ok) throw new Error(`Firebase read failed: ${res.status}`);
  const data = await res.json();
  if (!data) return getDefaultDb();
  // Merge with defaults to add any missing keys
  const def = getDefaultDb();
  return {
    ...def,
    ...data,
    overlay_state: { ...def.overlay_state, ...data.overlay_state },
    design: { ...def.design, ...data.design }
  };
}

/**
 * Saves database state to Firebase for a user.
 * @param {string} uid - User identifier.
 * @param {Object} db - The database state.
 */
async function saveDb(uid, db) {
  if (!BASE_URL || !SECRET) {
    throw new Error('Firebase not configured');
  }
  const res = await fetch(fbUrl(uid), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(db)
  });
  if (!res.ok) throw new Error(`Firebase write failed: ${res.status}`);
}

/**
 * Generates a unique secure-ish ID.
 * @returns {string} Generated ID.
 */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Returns the default database structure.
 * @returns {Object} Default database structure.
 */
function getDefaultDb() {
  return {
    tournaments: [],
    teams: [],
    players: [],
    matches: [],
    match_standings: [],
    kill_events: [],
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
      last_updated_at: new Date().toISOString()
    },
    design: {
      accentColor: '#FF6B00',
      accentColor2: '#00D4FF',
      bgColor: '#060915',
      textColor: '#ffffff',
      tournamentName: 'BOOYAH CUP',
      tournamentSubtitle: 'GRAND FINALS',
      gameLabel: 'GAME',
      logoUrl: '',
      overlayStyle: 'default',
      fontStyle: 'orbitron',
      casters: [
        { name: 'CASTER ONE', role: 'SHOUTCASTER', handle: '@caster1' },
        { name: 'CASTER TWO', role: 'ANALYST', handle: '@caster2' },
        { name: 'CASTER THREE', role: 'HOST', handle: '@caster3' }
      ],
      organizerName: 'GARENA',
      sponsorLogoUrl: ''
    }
  };
}

module.exports = { loadDb, saveDb, genId, getDefaultDb };
