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
    const { player_id, match_id } = req.body || {};

    if (!player_id || !match_id) {
      return res.status(400).json({ error: 'player_id and match_id are required' });
    }

    const now = new Date().toISOString();

    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(player.team_id);
    const teamName = team ? team.name : 'Unknown Team';

    // Set player is_alive=0
    db.prepare(`
      UPDATE players
      SET is_alive = 0
      WHERE id = ?
    `).run(player_id);

    // Create elimination_event row
    const eliminationEventId = genId();
    db.prepare(`
      INSERT INTO elimination_events (id, match_id, tournament_id, eliminated_player_id, eliminated_player_name, eliminated_team_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(eliminationEventId, match_id, player.tournament_id, player_id, player.name, teamName, now);

    // Update overlay_state timestamp
    db.prepare(`
      UPDATE overlay_state
      SET last_updated_at = ?
      WHERE id = 'singleton'
    `).run(now);

    const updatedPlayer = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    const eliminationEvent = db.prepare("SELECT * FROM elimination_events WHERE id = ?").get(eliminationEventId);

    return res.status(200).json({
      success: true,
      player: updatedPlayer,
      elimination_event: eliminationEvent
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
