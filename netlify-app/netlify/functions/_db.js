const fs = require('fs');
const path = require('path');

// Netlify (and all serverless): only /tmp is writable at runtime.
// BUT since /tmp data is ephemeral and can disappear between serverless container invocations,
// we must make sure we try our best to load/save correctly, and that we handle missing directories.
const IS_SERVERLESS = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'booyah.json');

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
      last_updated_at: new Date().toISOString()
    }
  };
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { /* corrupted or missing — reset */ }
  return getDefaultDb();
}

function saveDb(db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
}

module.exports = { loadDb, saveDb, genId };
