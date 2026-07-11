const admin = require('firebase-admin');

// Initialize Firebase Admin only once (serverless cold-start safety)
if (!admin.apps.length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (projectId && clientEmail && privateKey && databaseURL) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      databaseURL,
    });
  } else {
    // Local dev fallback — use in-memory store so the app still boots without Firebase creds
    console.warn('[_db] Firebase env vars not set — using in-memory store (data will not persist across restarts)');
    admin.initializeApp({ projectId: 'local-dev' });
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

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
      last_updated_at: new Date().toISOString(),
    },
  };
}

// In-memory fallback for local dev without Firebase
let _memDb = null;

async function loadDb() {
  if (!process.env.FIREBASE_DATABASE_URL) {
    if (!_memDb) _memDb = getDefaultDb();
    return JSON.parse(JSON.stringify(_memDb));
  }
  try {
    const snap = await admin.database().ref('booyah').once('value');
    return snap.val() || getDefaultDb();
  } catch (e) {
    console.error('[_db] Firebase read error:', e.message);
    return getDefaultDb();
  }
}

async function saveDb(db) {
  if (!process.env.FIREBASE_DATABASE_URL) {
    _memDb = JSON.parse(JSON.stringify(db));
    return;
  }
  try {
    await admin.database().ref('booyah').set(db);
  } catch (e) {
    console.error('[_db] Firebase write error:', e.message);
  }
}

module.exports = { loadDb, saveDb, genId };
