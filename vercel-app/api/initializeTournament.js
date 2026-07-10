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
    const { name, total_matches, points_per_kill, placement_points_config } = req.body || {};
    if (!name || !total_matches) return res.status(400).json({ error: 'name and total_matches required' });

    const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
    const finalConfig = placement_points_config || defaultConfig;

    const db = loadDb();
    const tournament = {
      id: genId(),
      name,
      total_matches: parseInt(total_matches),
      points_per_kill: points_per_kill || 1,
      placement_points_config: JSON.stringify(finalConfig),
      current_match_number: 0,
      status: 'setup',
      created_at: new Date().toISOString()
    };

    db.tournaments.push(tournament);
    db.overlay_state.tournament_id = tournament.id;
    db.overlay_state.current_screen = 'setup_blank';
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);

    res.json({ success: true, tournament });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
