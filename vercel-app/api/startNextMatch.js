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
    const { tournament_id, map_name } = req.body || {};
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });

    const db = loadDb();
    const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
    if (tIdx === -1) return res.status(404).json({ error: 'Tournament not found' });

    const newMatchNumber = (db.tournaments[tIdx].current_match_number || 0) + 1;
    db.tournaments[tIdx].current_match_number = newMatchNumber;
    db.tournaments[tIdx].status = 'active';

    const match = {
      id: genId(),
      tournament_id,
      match_number: newMatchNumber,
      state: 'pre_match',
      map_name: map_name || 'Bermuda',
      started_at: new Date().toISOString(),
      ended_at: null
    };
    db.matches.push(match);

    // Reset all players
    db.players = db.players.map(p =>
      p.tournament_id === tournament_id
        ? { ...p, is_alive: true, current_match_kills: 0 }
        : p
    );

    db.overlay_state.current_screen = 'pre_match_map';
    db.overlay_state.tournament_id = tournament_id;
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);

    res.json({ success: true, match, match_number: newMatchNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
