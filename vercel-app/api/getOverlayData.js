const { db } = require('./_db');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(455).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Get active tournament (status='active') or first tournament
    let tournament = db.prepare("SELECT * FROM tournaments WHERE status = 'active' LIMIT 1").get();
    if (!tournament) {
      tournament = db.prepare("SELECT * FROM tournaments ORDER BY created_at DESC LIMIT 1").get();
    }

    // 2. Get overlay_state singleton
    const overlay_state = db.prepare("SELECT * FROM overlay_state WHERE id = 'singleton'").get();

    let teams = [];
    let players = [];
    let current_match = null;
    let kill_feed = [];
    let eliminations = [];
    let standings = [];

    if (tournament) {
      const tourneyId = tournament.id;

      // 3. Get teams for tournament sorted by total_tournament_points DESC
      teams = db.prepare("SELECT * FROM teams WHERE tournament_id = ? ORDER BY total_tournament_points DESC").all(tourneyId);

      // 4. Get players for tournament
      players = db.prepare("SELECT * FROM players WHERE tournament_id = ?").all(tourneyId);

      // 5. Get most recent match for tournament
      current_match = db.prepare("SELECT * FROM matches WHERE tournament_id = ? ORDER BY match_number DESC LIMIT 1").get();

      if (current_match) {
        const matchId = current_match.id;

        // 6. Get last 10 kill_events for current match
        kill_feed = db.prepare("SELECT * FROM kill_events WHERE match_id = ? ORDER BY timestamp DESC LIMIT 10").all(matchId);

        // 7. Get last 5 elimination_events for current match
        eliminations = db.prepare("SELECT * FROM elimination_events WHERE match_id = ? ORDER BY timestamp DESC LIMIT 5").all(matchId);

        // 8. Get match_standings for current match
        standings = db.prepare("SELECT * FROM match_standings WHERE match_id = ?").all(matchId);
      }
    }

    return res.status(200).json({
      tournament,
      overlay_state,
      teams,
      players,
      current_match,
      kill_feed,
      eliminations,
      standings
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
