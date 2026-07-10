const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(process.cwd(), 'data', 'booyah.db');
const db = new Database(dbPath, { fileMustExist: false });

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT,
    total_matches INTEGER,
    points_per_kill REAL,
    placement_points_config TEXT,
    current_match_number INTEGER DEFAULT 0,
    status TEXT DEFAULT 'setup',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    tournament_id TEXT,
    name TEXT,
    logo_url TEXT,
    total_tournament_points REAL DEFAULT 0,
    total_tournament_kills INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    tournament_id TEXT,
    name TEXT,
    is_alive INTEGER DEFAULT 1,
    current_match_kills INTEGER DEFAULT 0,
    total_tournament_kills INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT,
    match_number INTEGER,
    state TEXT DEFAULT 'pre_match',
    map_name TEXT,
    started_at TEXT,
    ended_at TEXT
  );

  CREATE TABLE IF NOT EXISTS match_standings (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    tournament_id TEXT,
    team_id TEXT,
    team_name TEXT,
    placement INTEGER,
    placement_points_awarded REAL DEFAULT 0,
    team_kills_this_match INTEGER DEFAULT 0,
    total_match_points REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS kill_events (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    tournament_id TEXT,
    killer_player_id TEXT,
    killer_name TEXT,
    killer_team_name TEXT,
    killed_player_name TEXT,
    killed_team_name TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS elimination_events (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    tournament_id TEXT,
    eliminated_player_id TEXT,
    eliminated_player_name TEXT,
    eliminated_team_name TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS overlay_state (
    id TEXT PRIMARY KEY,
    tournament_id TEXT,
    current_screen TEXT DEFAULT 'setup_blank',
    mvp_player_id TEXT,
    mvp_player_name TEXT,
    mvp_team_name TEXT,
    mvp_kills INTEGER DEFAULT 0,
    champion_team_id TEXT,
    champion_team_name TEXT,
    champion_total_points REAL DEFAULT 0,
    last_updated_at TEXT
  );
`);

// Insert default overlay_state if none exists
const checkOverlay = db.prepare('SELECT id FROM overlay_state WHERE id = ?').get('singleton');
if (!checkOverlay) {
  const insertOverlay = db.prepare(`
    INSERT INTO overlay_state (id, tournament_id, current_screen, last_updated_at)
    VALUES (?, ?, ?, ?)
  `);
  insertOverlay.run('singleton', null, 'setup_blank', new Date().toISOString());
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = {
  db,
  genId
};
