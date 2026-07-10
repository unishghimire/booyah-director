const { loadDb, saveDb, genId } = require('./_db');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

module.exports = (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

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

    // Update player
    db.players[pIdx].current_match_kills = (player.current_match_kills || 0) + 1;
    db.players[pIdx].total_tournament_kills = (player.total_tournament_kills || 0) + 1;

    // Update team
    db.teams[tIdx].total_tournament_kills = (db.teams[tIdx].total_tournament_kills || 0) + 1;
    db.teams[tIdx].total_tournament_points = (db.teams[tIdx].total_tournament_points || 0) + pointsPerKill;

    // Create kill event
    const killEvent = {
      id: genId(),
      match_id,
      tournament_id: player.tournament_id,
      killer_player_id: player_id,
      killer_name: player.name,
      killer_team_name: db.teams[tIdx].name,
      killed_player_name: killed_player_name || 'Unknown',
      killed_team_name: killed_team_name || 'Unknown',
      timestamp: new Date().toISOString()
    };
    db.kill_events.push(killEvent);

    // Update match standing
    const sIdx = db.match_standings.findIndex(s => s.match_id === match_id && s.team_id === db.teams[tIdx].id);
    if (sIdx !== -1) {
      db.match_standings[sIdx].team_kills_this_match = (db.match_standings[sIdx].team_kills_this_match || 0) + 1;
      db.match_standings[sIdx].total_match_points = (db.match_standings[sIdx].total_match_points || 0) + pointsPerKill;
    }

    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);

    res.json({
      success: true,
      player: { id: player_id, name: player.name, current_match_kills: db.players[pIdx].current_match_kills, total_tournament_kills: db.players[pIdx].total_tournament_kills },
      team: { id: db.teams[tIdx].id, name: db.teams[tIdx].name },
      kill_event: killEvent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
