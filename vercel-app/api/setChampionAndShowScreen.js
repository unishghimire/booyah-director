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
    const { team_id, team_name, total_points } = req.body || {};

    if (!team_id) {
      return res.status(400).json({ error: 'team_id is required' });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE overlay_state
      SET current_screen = 'champions',
          champion_team_id = ?,
          champion_team_name = ?,
          champion_total_points = ?,
          last_updated_at = ?
      WHERE id = 'singleton'
    `).run(team_id, team_name || '', total_points || 0, now);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
