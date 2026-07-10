const { db } = require('./_db');

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
    const { match_id, player_id, player_name, team_name, kills } = req.body || {};

    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE overlay_state
      SET current_screen = 'mvp',
          mvp_player_id = ?,
          mvp_player_name = ?,
          mvp_team_name = ?,
          mvp_kills = ?,
          last_updated_at = ?
      WHERE id = 'singleton'
    `).run(player_id, player_name || '', team_name || '', kills || 0, now);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
