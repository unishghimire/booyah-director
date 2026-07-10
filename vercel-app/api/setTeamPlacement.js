const { loadDb, saveDb, genId } = require('./_db');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

module.exports = (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { team_id, match_id, placement, tournament_id } = req.body || {};
    if (!team_id || !match_id || placement === undefined) return res.status(400).json({ error: 'team_id, match_id, and placement required' });

    const db = loadDb();

    // Check duplicate placement
    const duplicate = db.match_standings.find(s => s.match_id === match_id && s.placement === placement && s.team_id !== team_id);
    if (duplicate) return res.status(400).json({ error: `Placement ${placement} already assigned to ${duplicate.team_name}` });

    const tournament = db.tournaments.find(t => t.id === tournament_id) || db.tournaments.find(t => t.status === 'active');
    const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
    let config = defaultConfig;
    if (tournament?.placement_points_config) {
      try { config = { ...defaultConfig, ...JSON.parse(tournament.placement_points_config) }; } catch {}
    }
    const placementPoints = config[String(placement)] || config[placement] || 0;

    const team = db.teams.find(t => t.id === team_id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const teamKillEvents = db.kill_events.filter(k => k.match_id === match_id && k.killer_team_name === team.name);
    const teamKills = teamKillEvents.length;
    const pointsPerKill = tournament?.points_per_kill || 1;
    const killPoints = teamKills * pointsPerKill;

    const sIdx = db.match_standings.findIndex(s => s.match_id === match_id && s.team_id === team_id);
    const tIdx = db.teams.findIndex(t => t.id === team_id);

    if (sIdx !== -1) {
      const oldPlacementPts = db.match_standings[sIdx].placement_points_awarded || 0;
      db.teams[tIdx].total_tournament_points = Math.max(0, (db.teams[tIdx].total_tournament_points || 0) - oldPlacementPts + placementPoints);
      db.match_standings[sIdx].placement = placement;
      db.match_standings[sIdx].placement_points_awarded = placementPoints;
      db.match_standings[sIdx].team_kills_this_match = teamKills;
      db.match_standings[sIdx].total_match_points = placementPoints + killPoints;
    } else {
      db.match_standings.push({
        id: genId(),
        match_id,
        tournament_id: tournament?.id || tournament_id,
        team_id,
        team_name: team.name,
        placement,
        placement_points_awarded: placementPoints,
        team_kills_this_match: teamKills,
        total_match_points: placementPoints + killPoints
      });
      db.teams[tIdx].total_tournament_points = (db.teams[tIdx].total_tournament_points || 0) + placementPoints;
    }

    saveDb(db);
    res.json({ success: true, team: team.name, placement, placement_points: placementPoints, kill_points: killPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
