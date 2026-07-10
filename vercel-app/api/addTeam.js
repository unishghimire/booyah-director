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
    const { tournament_id, team_name, player_names } = req.body || {};

    if (!tournament_id || !team_name || !player_names || !Array.isArray(player_names)) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // Max 12 teams limit
    const existingTeamsCount = db.prepare("SELECT COUNT(*) AS count FROM teams WHERE tournament_id = ?").get(tournament_id).count;
    if (existingTeamsCount >= 12) {
      return res.status(400).json({ error: 'Maximum limit of 12 teams has been reached for this tournament' });
    }

    // Max 4 players limit
    if (player_names.length > 4) {
      return res.status(400).json({ error: 'A team can have a maximum of 4 players' });
    }

    const teamId = genId();
    const createdAt = new Date().toISOString();

    // Create team row
    const insertTeam = db.prepare(`
      INSERT INTO teams (id, tournament_id, name, logo_url, total_tournament_points, total_tournament_kills, created_at)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `);
    insertTeam.run(teamId, tournament_id, team_name, '', createdAt);

    // Create player rows
    const insertPlayer = db.prepare(`
      INSERT INTO players (id, team_id, tournament_id, name, is_alive, current_match_kills, total_tournament_kills, created_at)
      VALUES (?, ?, ?, ?, 1, 0, 0, ?)
    `);

    const players = [];
    for (const name of player_names) {
      if (name && name.trim()) {
        const playerId = genId();
        insertPlayer.run(playerId, teamId, tournament_id, name.trim(), createdAt);
        players.push({
          id: playerId,
          team_id: teamId,
          tournament_id,
          name: name.trim(),
          is_alive: 1,
          current_match_kills: 0,
          total_tournament_kills: 0,
          created_at: createdAt
        });
      }
    }

    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId);

    // Update overlay_state timestamp
    db.prepare("UPDATE overlay_state SET last_updated_at = ? WHERE id = 'singleton'").run(createdAt);

    return res.status(200).json({
      success: true,
      team,
      players
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
