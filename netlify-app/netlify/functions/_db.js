/**
 * _db.js — Smart storage layer (zero native dependencies)
 *
 * Priority:
 *   1. Firebase Realtime DB via REST API (no SDK — pure HTTP fetch)
 *   2. /tmp JSON file fallback (works on Netlify without any env vars)
 *
 * Required env vars for Firebase (optional — falls back to /tmp if missing):
 *   FIREBASE_DATABASE_URL   e.g. https://your-project-default-rtdb.firebaseio.com
 *   FIREBASE_DATABASE_SECRET  (Database secret from Firebase console > Project Settings > Service Accounts > Database secrets)
 */

const fs   = require('fs');
const path = require('path');

// Use built-in fetch (Node 18+) or fall back to https
const USE_FIREBASE = !!(
  process.env.FIREBASE_DATABASE_URL &&
  process.env.FIREBASE_DATABASE_SECRET
);

// ─── Firebase REST helpers ────────────────────────────────────────────────────
function fbUrl(suffix) {
  const base = process.env.FIREBASE_DATABASE_URL.replace(/\/$/, '');
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  return `${base}${suffix}?auth=${secret}`;
}

async function fbGet() {
  const res = await fetch(fbUrl('/booyah.json'));
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  return await res.json();
}

async function fbSet(data) {
  const res = await fetch(fbUrl('/booyah.json'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase PUT failed: ${res.status}`);
}

// ─── JSON file path (Netlify /tmp fallback) ───────────────────────────────────
const IS_SERVERLESS = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE  = path.join(DATA_DIR, 'booyah.json');

// ─── ID generator ─────────────────────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Default DB shape ─────────────────────────────────────────────────────────
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

// ─── Load ─────────────────────────────────────────────────────────────────────
async function loadDb() {
  if (USE_FIREBASE) {
    try {
      const data = await fbGet();
      if (data && typeof data === 'object') return data;
    } catch (e) {
      console.error('[_db] Firebase read failed, using /tmp fallback:', e.message);
    }
  }
  // File fallback
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[_db] File read failed, using default DB:', e.message);
  }
  return getDefaultDb();
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function saveDb(db) {
  if (USE_FIREBASE) {
    try {
      await fbSet(db);
      return;
    } catch (e) {
      console.error('[_db] Firebase write failed, falling back to /tmp:', e.message);
    }
  }
  // File fallback
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('[_db] File write failed:', e.message);
  }
}

module.exports = { loadDb, saveDb, genId };
