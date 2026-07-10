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
    const { tournament_id } = req.body || {};
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });

    const db = loadDb();
    const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
    if (tIdx !== -1) db.tournaments[tIdx].status = 'completed';

    const teams = db.teams
      .filter(t => t.tournament_id === tournament_id)
      .sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));

    saveDb(db);
    res.json({
      success: true,
      rankings: teams.map((t, i) => ({
        rank: i + 1,
        team: t.name,
        total_points: t.total_tournament_points,
        total_kills: t.total_tournament_kills
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
