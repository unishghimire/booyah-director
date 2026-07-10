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
    const { match_id, state } = req.body || {};
    if (!match_id || !state) return res.status(400).json({ error: 'match_id and state required' });

    const db = loadDb();
    const mIdx = db.matches.findIndex(m => m.id === match_id);
    if (mIdx === -1) return res.status(404).json({ error: 'Match not found' });

    db.matches[mIdx].state = state;
    if (state === 'ended') db.matches[mIdx].ended_at = new Date().toISOString();
    if (state === 'live') {
      db.overlay_state.current_screen = 'scoreboard';
      db.overlay_state.last_updated_at = new Date().toISOString();
    }

    saveDb(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
