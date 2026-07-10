const { loadDb, saveDb } = require('./_db');

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
    const { team_id, team_name, total_points } = req.body || {};
    const db = loadDb();

    db.overlay_state.current_screen = 'champions';
    db.overlay_state.champion_team_id = team_id || '';
    db.overlay_state.champion_team_name = team_name || '';
    db.overlay_state.champion_total_points = total_points || 0;
    db.overlay_state.last_updated_at = new Date().toISOString();

    saveDb(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
