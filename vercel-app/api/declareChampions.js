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
    const { tournament_id } = req.body || {};

    if (!tournament_id) {
      return res.status(400).json({ error: 'tournament_id is required' });
    }

    // Get all teams for tournament sorted by total_tournament_points DESC
    const teams = db.prepare(`
      SELECT id, name, logo_url, total_tournament_points, total_tournament_kills
      FROM teams
      WHERE tournament_id = ?
      ORDER BY total_tournament_points DESC
    `).all(tournament_id);

    // Update tournament status='completed'
    db.prepare(`
      UPDATE tournaments
      SET status = 'completed'
      WHERE id = ?
    `).run(tournament_id);

    // Update overlay_state timestamp
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE overlay_state
      SET last_updated_at = ?
      WHERE id = 'singleton'
    `).run(now);

    const rankings = teams.map(t => ({
      team: {
        id: t.id,
        name: t.name,
        logo_url: t.logo_url
      },
      total_points: t.total_tournament_points,
      total_kills: t.total_tournament_kills
    }));

    return res.status(200).json({
      success: true,
      rankings
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
