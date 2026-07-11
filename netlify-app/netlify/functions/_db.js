/**
 * _db.js — Smart storage layer
 * 
 * Priority:
 *   1. Firebase Realtime DB (if FIREBASE_DATABASE_URL env var is set)
 *   2. /tmp JSON file (Netlify serverless fallback — ephemeral but works without Firebase)
 * 
 * This ensures the app ALWAYS works, even before Firebase is configured.
 */

const fs   = require('fs');
const path = require('path');

const USE_FIREBASE = !!(
  process.env.FIREBASE_DATABASE_URL &&
  process.env.FIREBASE_PROJECT_ID   &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

// ─── Firebase path ────────────────────────────────────────────────────────────
let _fbApp = null;
function getFirebaseDb() {
  if (_fbApp) return _fbApp;
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  _fbApp = admin.database();
  return _fbApp;
}

// ─── JSON file path (Netlify /tmp fallback) ───────────────────────────────────
const IS_SERVERLESS = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE  = path.join(DATA_DIR, 'booyah.json');

// ─── Shared helpers ───────────────────────────────────────────────────────────
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

// ─── Load ──────────────────────────────────────────────────────────────────────
async function loadDb() {
  if (USE_FIREBASE) {
    try {
      const snap = await getFirebaseDb().ref('booyah').once('value');
      return snap.val() || getDefaultDb();
    } catch (e) {
      console.error('[_db] Firebase read failed, falling back to /tmp:', e.message);
      // Fall through to file fallback
    }
  }
  // File fallback
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { /* corrupted — reset */ }
  return getDefaultDb();
}

// ─── Save ──────────────────────────────────────────────────────────────────────
async function saveDb(db) {
  if (USE_FIREBASE) {
    try {
      await getFirebaseDb().ref('booyah').set(db);
      return;
    } catch (e) {
      console.error('[_db] Firebase write failed, falling back to /tmp:', e.message);
      // Fall through to file fallback
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
