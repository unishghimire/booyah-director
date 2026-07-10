const { db, genId } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method Not Allowed' });
  }

  try {
    const { tournament_id, map_name } = req.body || {};

    if (!tournament_id) {
      return res.status(400).json({ error: 'tournament_id is required' });
    }

    // Get current tournament info
    const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournament_id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const nextMatchNumber = (tournament.current_match_number || 0) + 1;
    const now = new Date().toISOString();

    // Increment tournament current_match_number & set status='active'
    db.prepare(`
      UPDATE tournaments
      SET current_match_number = ?, status = 'active'
      WHERE id = ?
    `).run(nextMatchNumber, tournament_id);

    // Create match row (state='pre_match')
    const matchId = genId();
    db.prepare(`
      INSERT INTO matches (id, tournament_id, match_number, state, map_name, started_at)
      VALUES (?, ?, ?, 'pre_match', ?, ?)
    `).run(matchId, tournament_id, nextMatchNumber, map_name || 'Bermuda', now);

    // Reset all players: is_alive=1, current_match_kills=0 for this tournament
    db.prepare(`
      UPDATE players
      SET is_alive = 1, current_match_kills = 0
      WHERE tournament_id = ?
    `).run(tournament_id);

    // Update overlay_state: current_screen='pre_match_map'
    db.prepare(`
      UPDATE overlay_state
      SET current_screen = 'pre_match_map', last_updated_at = ?
      WHERE id = 'singleton'
    `).run(now);

    const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId);

    return res.status(200).json({
      success: true,
      match,
      match_number: nextMatchNumber
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
