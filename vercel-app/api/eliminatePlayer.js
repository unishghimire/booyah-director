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
    const { player_id, match_id } = req.body || {};
    if (!player_id || !match_id) return res.status(400).json({ error: 'player_id and match_id required' });

    const db = loadDb();
    const pIdx = db.players.findIndex(p => p.id === player_id);
    if (pIdx === -1) return res.status(404).json({ error: 'Player not found' });

    const player = db.players[pIdx];
    const team = db.teams.find(t => t.id === player.team_id);

    db.players[pIdx].is_alive = false;

    const elimEvent = {
      id: genId(),
      match_id,
      tournament_id: player.tournament_id,
      eliminated_player_id: player_id,
      eliminated_player_name: player.name,
      eliminated_team_name: team?.name || 'Unknown',
      timestamp: new Date().toISOString()
    };
    db.elimination_events.push(elimEvent);

    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);

    res.json({ success: true, player: { id: player_id, name: player.name, team: team?.name }, elimination_event: elimEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
