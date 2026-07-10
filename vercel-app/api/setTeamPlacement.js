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
    const { team_id, match_id, placement, tournament_id } = req.body || {};

    if (!team_id || !match_id || !placement || !tournament_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = new Date().toISOString();

    // Check no duplicate placement for same match
    const duplicatePlacement = db.prepare(`
      SELECT * FROM match_standings
      WHERE match_id = ? AND placement = ? AND team_id != ?
    `).get(match_id, placement, team_id);

    if (duplicatePlacement) {
      return res.status(400).json({ error: `Placement ${placement} already awarded to team: ${duplicatePlacement.team_name}` });
    }

    // Get tournament config
    const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournament_id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    let config = {};
    try {
      config = JSON.parse(tournament.placement_points_config);
    } catch (e) {
      // Default fallback
      config = {1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1};
    }

    const placementPoints = parseFloat(config[placement] || 0);

    // Get the team name
    const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(team_id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get current match standing for this team
    let standing = db.prepare(`
      SELECT * FROM match_standings
      WHERE match_id = ? AND team_id = ?
    `).get(match_id, team_id);

    let originalPlacementPoints = 0;
    let killPoints = 0;
    const pointsPerKill = tournament.points_per_kill !== undefined ? tournament.points_per_kill : 1;

    if (standing) {
      originalPlacementPoints = standing.placement_points_awarded || 0;
      killPoints = (standing.team_kills_this_match || 0) * pointsPerKill;

      // Update standing
      db.prepare(`
        UPDATE match_standings
        SET placement = ?,
            placement_points_awarded = ?,
            total_match_points = ? + ?
        WHERE id = ?
      `).run(placement, placementPoints, killPoints, placementPoints, standing.id);
    } else {
      const standingId = genId();
      db.prepare(`
        INSERT INTO match_standings (id, match_id, tournament_id, team_id, team_name, placement, placement_points_awarded, team_kills_this_match, total_match_points)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(standingId, match_id, tournament_id, team_id, team.name, placement, placementPoints, placementPoints);
    }

    // Update team total_tournament_points: remove old placement points, add new placement points
    const pointsDifference = placementPoints - originalPlacementPoints;
    db.prepare(`
      UPDATE teams
      SET total_tournament_points = total_tournament_points + ?
      WHERE id = ?
    `).run(pointsDifference, team_id);

    // Update overlay_state timestamp
    db.prepare(`
      UPDATE overlay_state
      SET last_updated_at = ?
      WHERE id = 'singleton'
    `).run(now);

    return res.status(200).json({
      success: true,
      placement_points: placementPoints,
      kill_points: killPoints
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
