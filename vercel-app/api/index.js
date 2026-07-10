const express = require('express');
const { loadDb, saveDb, genId } = require('./_db');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── GET OVERLAY DATA ─────────────────────────────────────────────
app.get('/api/getOverlayData', (req, res) => {
  try {
    const db = loadDb();
    const tournament = db.tournaments.find(t => t.status === 'active') || db.tournaments[0] || null;
    if (!tournament) return res.json({ tournament: null, overlay_state: db.overlay_state, teams: [], players: [], current_match: null, kill_feed: [], eliminations: [], standings: [] });

    const tid = tournament.id;
    const teams = db.teams.filter(t => t.tournament_id === tid).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
    const players = db.players.filter(p => p.tournament_id === tid);
    const matches = db.matches.filter(m => m.tournament_id === tid).sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
    const currentMatch = matches[0] || null;
    let killFeed = [], eliminations = [], standings = [];
    if (currentMatch) {
      killFeed = db.kill_events.filter(k => k.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
      eliminations = db.elimination_events.filter(e => e.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
      standings = db.match_standings.filter(s => s.match_id === currentMatch.id);
    }
    res.json({ tournament, overlay_state: db.overlay_state, teams, players, current_match: currentMatch, kill_feed: killFeed, eliminations, standings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── INITIALIZE TOURNAMENT ────────────────────────────────────────
app.post('/api/initializeTournament', (req, res) => {
  try {
    const { name, total_matches, points_per_kill, placement_points_config } = req.body || {};
    if (!name || !total_matches) return res.status(400).json({ error: 'name and total_matches required' });
    const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
    const db = loadDb();
    const tournament = { id: genId(), name, total_matches: parseInt(total_matches), points_per_kill: points_per_kill || 1, placement_points_config: JSON.stringify(placement_points_config || defaultConfig), current_match_number: 0, status: 'setup', created_at: new Date().toISOString() };
    db.tournaments.push(tournament);
    db.overlay_state.tournament_id = tournament.id;
    db.overlay_state.current_screen = 'setup_blank';
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, tournament });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADD TEAM ─────────────────────────────────────────────────────
app.post('/api/addTeam', (req, res) => {
  try {
    const { tournament_id, team_name, player_names } = req.body || {};
    if (!tournament_id || !team_name) return res.status(400).json({ error: 'tournament_id and team_name required' });
    const db = loadDb();
    if (db.teams.filter(t => t.tournament_id === tournament_id).length >= 12) return res.status(400).json({ error: 'Maximum 12 teams allowed' });
    const players = (player_names || []).slice(0, 4);
    const team = { id: genId(), tournament_id, name: team_name, logo_url: null, total_tournament_points: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
    db.teams.push(team);
    const createdPlayers = players.filter(n => n?.trim()).map(name => { const p = { id: genId(), team_id: team.id, tournament_id, name: name.trim(), is_alive: true, current_match_kills: 0, total_tournament_kills: 0, created_at: new Date().toISOString() }; db.players.push(p); return p; });
    saveDb(db);
    res.json({ success: true, team, players: createdPlayers });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── START NEXT MATCH ─────────────────────────────────────────────
app.post('/api/startNextMatch', (req, res) => {
  try {
    const { tournament_id, map_name } = req.body || {};
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
    const db = loadDb();
    const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
    if (tIdx === -1) return res.status(404).json({ error: 'Tournament not found' });
    const newMatchNumber = (db.tournaments[tIdx].current_match_number || 0) + 1;
    db.tournaments[tIdx].current_match_number = newMatchNumber;
    db.tournaments[tIdx].status = 'active';
    const match = { id: genId(), tournament_id, match_number: newMatchNumber, state: 'pre_match', map_name: map_name || 'Bermuda', started_at: new Date().toISOString(), ended_at: null };
    db.matches.push(match);
    db.players = db.players.map(p => p.tournament_id === tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
    db.overlay_state.current_screen = 'pre_match_map';
    db.overlay_state.tournament_id = tournament_id;
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, match, match_number: newMatchNumber });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── UPDATE MATCH STATE ───────────────────────────────────────────
app.post('/api/updateMatchState', (req, res) => {
  try {
    const { match_id, state } = req.body || {};
    if (!match_id || !state) return res.status(400).json({ error: 'match_id and state required' });
    const db = loadDb();
    const mIdx = db.matches.findIndex(m => m.id === match_id);
    if (mIdx === -1) return res.status(404).json({ error: 'Match not found' });
    db.matches[mIdx].state = state;
    if (state === 'ended') db.matches[mIdx].ended_at = new Date().toISOString();
    if (state === 'live') { db.overlay_state.current_screen = 'scoreboard'; db.overlay_state.last_updated_at = new Date().toISOString(); }
    saveDb(db);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADD KILL ─────────────────────────────────────────────────────
app.post('/api/addKill', (req, res) => {
  try {
    const { player_id, match_id, killed_player_name, killed_team_name } = req.body || {};
    if (!player_id || !match_id) return res.status(400).json({ error: 'player_id and match_id required' });
    const db = loadDb();
    const pIdx = db.players.findIndex(p => p.id === player_id);
    if (pIdx === -1) return res.status(404).json({ error: 'Player not found' });
    const player = db.players[pIdx];
    const tIdx = db.teams.findIndex(t => t.id === player.team_id);
    if (tIdx === -1) return res.status(404).json({ error: 'Team not found' });
    const tournament = db.tournaments.find(t => t.id === player.tournament_id);
    const pointsPerKill = tournament?.points_per_kill || 1;
    db.players[pIdx].current_match_kills = (player.current_match_kills || 0) + 1;
    db.players[pIdx].total_tournament_kills = (player.total_tournament_kills || 0) + 1;
    db.teams[tIdx].total_tournament_kills = (db.teams[tIdx].total_tournament_kills || 0) + 1;
    db.teams[tIdx].total_tournament_points = (db.teams[tIdx].total_tournament_points || 0) + pointsPerKill;
    const killEvent = { id: genId(), match_id, tournament_id: player.tournament_id, killer_player_id: player_id, killer_name: player.name, killer_team_name: db.teams[tIdx].name, killed_player_name: killed_player_name || 'Unknown', killed_team_name: killed_team_name || 'Unknown', timestamp: new Date().toISOString() };
    db.kill_events.push(killEvent);
    const sIdx = db.match_standings.findIndex(s => s.match_id === match_id && s.team_id === db.teams[tIdx].id);
    if (sIdx !== -1) { db.match_standings[sIdx].team_kills_this_match = (db.match_standings[sIdx].team_kills_this_match || 0) + 1; db.match_standings[sIdx].total_match_points = (db.match_standings[sIdx].total_match_points || 0) + pointsPerKill; }
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, player: { id: player_id, name: player.name, current_match_kills: db.players[pIdx].current_match_kills, total_tournament_kills: db.players[pIdx].total_tournament_kills }, team: { id: db.teams[tIdx].id, name: db.teams[tIdx].name }, kill_event: killEvent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ELIMINATE PLAYER ─────────────────────────────────────────────
app.post('/api/eliminatePlayer', (req, res) => {
  try {
    const { player_id, match_id } = req.body || {};
    if (!player_id || !match_id) return res.status(400).json({ error: 'player_id and match_id required' });
    const db = loadDb();
    const pIdx = db.players.findIndex(p => p.id === player_id);
    if (pIdx === -1) return res.status(404).json({ error: 'Player not found' });
    const player = db.players[pIdx];
    const team = db.teams.find(t => t.id === player.team_id);
    db.players[pIdx].is_alive = false;
    const elimEvent = { id: genId(), match_id, tournament_id: player.tournament_id, eliminated_player_id: player_id, eliminated_player_name: player.name, eliminated_team_name: team?.name || 'Unknown', timestamp: new Date().toISOString() };
    db.elimination_events.push(elimEvent);
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, player: { id: player_id, name: player.name, team: team?.name }, elimination_event: elimEvent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SET TEAM PLACEMENT ───────────────────────────────────────────
app.post('/api/setTeamPlacement', (req, res) => {
  try {
    const { team_id, match_id, placement, tournament_id } = req.body || {};
    if (!team_id || !match_id || placement === undefined) return res.status(400).json({ error: 'team_id, match_id, placement required' });
    const db = loadDb();
    const duplicate = db.match_standings.find(s => s.match_id === match_id && s.placement === placement && s.team_id !== team_id);
    if (duplicate) return res.status(400).json({ error: `Placement ${placement} already assigned to ${duplicate.team_name}` });
    const tournament = db.tournaments.find(t => t.id === tournament_id) || db.tournaments.find(t => t.status === 'active');
    const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
    let config = defaultConfig;
    if (tournament?.placement_points_config) { try { config = { ...defaultConfig, ...JSON.parse(tournament.placement_points_config) }; } catch {} }
    const placementPoints = config[String(placement)] || 0;
    const team = db.teams.find(t => t.id === team_id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const teamKills = db.kill_events.filter(k => k.match_id === match_id && k.killer_team_name === team.name).length;
    const pointsPerKill = tournament?.points_per_kill || 1;
    const killPoints = teamKills * pointsPerKill;
    const sIdx = db.match_standings.findIndex(s => s.match_id === match_id && s.team_id === team_id);
    const tIdx = db.teams.findIndex(t => t.id === team_id);
    if (sIdx !== -1) {
      const oldPts = db.match_standings[sIdx].placement_points_awarded || 0;
      db.teams[tIdx].total_tournament_points = Math.max(0, (db.teams[tIdx].total_tournament_points || 0) - oldPts + placementPoints);
      db.match_standings[sIdx] = { ...db.match_standings[sIdx], placement, placement_points_awarded: placementPoints, team_kills_this_match: teamKills, total_match_points: placementPoints + killPoints };
    } else {
      db.match_standings.push({ id: genId(), match_id, tournament_id: tournament?.id || tournament_id, team_id, team_name: team.name, placement, placement_points_awarded: placementPoints, team_kills_this_match: teamKills, total_match_points: placementPoints + killPoints });
      db.teams[tIdx].total_tournament_points = (db.teams[tIdx].total_tournament_points || 0) + placementPoints;
    }
    saveDb(db);
    res.json({ success: true, team: team.name, placement, placement_points: placementPoints, kill_points: killPoints });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CALCULATE MVP ────────────────────────────────────────────────
app.get('/api/calculateMVP', (req, res) => {
  try {
    const match_id = req.query.match_id;
    if (!match_id) return res.status(400).json({ error: 'match_id required' });
    const db = loadDb();
    const killMap = {};
    for (const evt of db.kill_events.filter(k => k.match_id === match_id)) {
      if (!killMap[evt.killer_player_id]) killMap[evt.killer_player_id] = { name: evt.killer_name, team: evt.killer_team_name, kills: 0, player_id: evt.killer_player_id };
      killMap[evt.killer_player_id].kills++;
    }
    const sorted = Object.values(killMap).sort((a, b) => b.kills - a.kills);
    if (!sorted.length) return res.json({ mvp: null, tied: false, message: 'No kills recorded' });
    const maxKills = sorted[0].kills;
    const top = sorted.filter(p => p.kills === maxKills);
    res.json({ mvp: top[0], tied: top.length > 1, tied_players: top, max_kills: maxKills });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SET MVP AND SHOW SCREEN ──────────────────────────────────────
app.post('/api/setMVPAndShowScreen', (req, res) => {
  try {
    const { player_id, player_name, team_name, kills } = req.body || {};
    const db = loadDb();
    db.overlay_state = { ...db.overlay_state, current_screen: 'mvp', mvp_player_id: player_id || '', mvp_player_name: player_name || '', mvp_team_name: team_name || '', mvp_kills: kills || 0, last_updated_at: new Date().toISOString() };
    saveDb(db);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SET CHAMPION AND SHOW SCREEN ─────────────────────────────────
app.post('/api/setChampionAndShowScreen', (req, res) => {
  try {
    const { team_id, team_name, total_points } = req.body || {};
    const db = loadDb();
    db.overlay_state = { ...db.overlay_state, current_screen: 'champions', champion_team_id: team_id || '', champion_team_name: team_name || '', champion_total_points: total_points || 0, last_updated_at: new Date().toISOString() };
    saveDb(db);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SWITCH OVERLAY SCREEN ────────────────────────────────────────
app.post('/api/switchOverlayScreen', (req, res) => {
  try {
    const { screen } = req.body || {};
    if (!screen) return res.status(400).json({ error: 'screen required' });
    const db = loadDb();
    db.overlay_state.current_screen = screen;
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DECLARE CHAMPIONS ────────────────────────────────────────────
app.post('/api/declareChampions', (req, res) => {
  try {
    const { tournament_id } = req.body || {};
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
    const db = loadDb();
    const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
    if (tIdx !== -1) db.tournaments[tIdx].status = 'completed';
    const teams = db.teams.filter(t => t.tournament_id === tournament_id).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
    saveDb(db);
    res.json({ success: true, rankings: teams.map((t, i) => ({ rank: i + 1, team: t.name, total_points: t.total_tournament_points, total_kills: t.total_tournament_kills })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = app;
