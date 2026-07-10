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
    const { screen } = req.body || {};
    if (!screen) return res.status(400).json({ error: 'screen required' });

    const db = loadDb();
    db.overlay_state.current_screen = screen;
    db.overlay_state.last_updated_at = new Date().toISOString();
    saveDb(db);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
