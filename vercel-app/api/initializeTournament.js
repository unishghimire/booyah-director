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
    const { name, total_matches, points_per_kill, placement_points_config } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Tournament name is required' });
    }

    const defaultPlacementConfig = {
      1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1
    };

    const finalConfig = placement_points_config || defaultPlacementConfig;
    const configString = JSON.stringify(finalConfig);

    const tournamentId = genId();
    const createdAt = new Date().toISOString();

    const insertTournament = db.prepare(`
      INSERT INTO tournaments (id, name, total_matches, points_per_kill, placement_points_config, current_match_number, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 'setup', ?)
    `);
    
    insertTournament.run(
      tournamentId,
      name,
      total_matches || 6,
      points_per_kill !== undefined ? points_per_kill : 1,
      configString,
      createdAt
    );

    const updateOverlay = db.prepare(`
      UPDATE overlay_state
      SET tournament_id = ?, current_screen = 'setup_blank', last_updated_at = ?
      WHERE id = 'singleton'
    `);
    updateOverlay.run(tournamentId, createdAt);

    const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournamentId);

    return res.status(200).json({
      success: true,
      tournament
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
