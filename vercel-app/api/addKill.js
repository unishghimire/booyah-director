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
    const { player_id, match_id, killed_player_name, killed_team_name } = req.body || {};

    if (!player_id || !match_id || !killed_player_name || !killed_team_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = new Date().toISOString();

    // Get killer player and team
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    if (!player) {
      return res.status(404).json({ error: 'Killer player not found' });
    }

    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(player.team_id);
    if (!team) {
      return res.status(404).json({ error: 'Killer team not found' });
    }

    // Get tournament points_per_kill
    const tournament = db.prepare("SELECT points_per_kill FROM tournaments WHERE id = ?").get(player.tournament_id);
    const pointsPerKill = tournament ? (tournament.points_per_kill !== undefined ? tournament.points_per_kill : 1) : 1;

    // Increment player match and tournament kills
    db.prepare(`
      UPDATE players
      SET current_match_kills = current_match_kills + 1,
          total_tournament_kills = total_tournament_kills + 1
      WHERE id = ?
    `).run(player_id);

    // Increment team kills and tournament points
    db.prepare(`
      UPDATE teams
      SET total_tournament_kills = total_tournament_kills + 1,
          total_tournament_points = total_tournament_points + ?
      WHERE id = ?
    `).run(pointsPerKill, team.id);

    // Create kill_event row
    const killEventId = genId();
    db.prepare(`
      INSERT INTO kill_events (id, match_id, tournament_id, killer_player_id, killer_name, killer_team_name, killed_player_name, killed_team_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(killEventId, match_id, player.tournament_id, player_id, player.name, team.name, killed_player_name, killed_team_name, now);

    // Update match_standings for this team in this match
    let standing = db.prepare(`
      SELECT * FROM match_standings
      WHERE match_id = ? AND team_id = ?
    `).get(match_id, team.id);

    if (!standing) {
      const standingId = genId();
      db.prepare(`
        INSERT INTO match_standings (id, match_id, tournament_id, team_id, team_name, placement, placement_points_awarded, team_kills_this_match, total_match_points)
        VALUES (?, ?, ?, ?, ?, 0, 0, 1, ?)
      `).run(standingId, match_id, player.tournament_id, team.id, team.name, pointsPerKill);
    } else {
      db.prepare(`
        UPDATE match_standings
        SET team_kills_this_match = team_kills_this_match + 1,
            total_match_points = total_match_points + ?
        WHERE id = ?
      `).run(pointsPerKill, standing.id);
    }

    // Update overlay_state timestamp
    db.prepare(`
      UPDATE overlay_state
      SET last_updated_at = ?
      WHERE id = 'singleton'
    `).run(now);

    const updatedPlayer = db.prepare("SELECT * FROM players WHERE id = ?").get(player_id);
    const updatedTeam = db.prepare("SELECT * FROM teams WHERE id = ?").get(team.id);
    const killEvent = db.prepare("SELECT * FROM kill_events WHERE id = ?").get(killEventId);

    return res.status(200).json({
      success: true,
      player: updatedPlayer,
      team: updatedTeam,
      kill_event: killEvent
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
