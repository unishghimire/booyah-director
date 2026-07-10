const { loadDb } = require('./_db');

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
    const db = loadDb();
    const tournament = db.tournaments.find(t => t.status === 'active') || db.tournaments[0] || null;

    if (!tournament) {
      return res.json({
        tournament: null,
        overlay_state: db.overlay_state,
        teams: [], players: [], current_match: null,
        kill_feed: [], eliminations: [], standings: []
      });
    }

    const tid = tournament.id;
    const teams = db.teams
      .filter(t => t.tournament_id === tid)
      .sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));

    const players = db.players.filter(p => p.tournament_id === tid);

    const matches = db.matches
      .filter(m => m.tournament_id === tid)
      .sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
    const currentMatch = matches[0] || null;

    let killFeed = [];
    let eliminations = [];
    let standings = [];

    if (currentMatch) {
      killFeed = db.kill_events
        .filter(k => k.match_id === currentMatch.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      eliminations = db.elimination_events
        .filter(e => e.match_id === currentMatch.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      standings = db.match_standings.filter(s => s.match_id === currentMatch.id);
    }

    res.json({
      tournament,
      overlay_state: db.overlay_state,
      teams,
      players,
      current_match: currentMatch,
      kill_feed: killFeed,
      eliminations,
      standings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
