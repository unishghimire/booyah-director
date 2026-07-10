import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { team_id, match_id, placement, tournament_id } = body;
    if (!team_id || !match_id || !placement) return new Response(JSON.stringify({ error: 'team_id, match_id, and placement required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Check for duplicate placement in this match
    const existingStandings = await base44.entities.MatchStanding.filter({ match_id });
    const duplicate = existingStandings.find(s => s.data.placement === placement && s.data.team_id !== team_id);
    if (duplicate) {
      return new Response(JSON.stringify({ error: `Placement ${placement} already assigned to ${duplicate.data.team_name}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get tournament for placement points config
    const tournaments = await base44.entities.Tournament.filter({ status: 'active' });
    const tournament = tournaments[0];
    let placementPoints = 0;
    if (tournament) {
      let config;
      try { config = JSON.parse(tournament.data.placement_points_config || '{}'); } catch { config = {}; }
      const defaultConfig = {1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1};
      const mergedConfig = { ...defaultConfig, ...config };
      placementPoints = mergedConfig[placement] || 0;
    }

    // Get team
    const team = await base44.entities.Team.get(team_id);
    if (!team) return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // Get kills for this team this match
    const killEvents = await base44.entities.KillEvent.filter({ match_id, killer_team_name: team.data.name });
    const teamKills = killEvents.length;
    const pointsPerKill = tournament?.data?.points_per_kill || 1;
    const killPoints = teamKills * pointsPerKill;

    // Upsert match standing
    const existingForTeam = existingStandings.find(s => s.data.team_id === team_id);
    if (existingForTeam) {
      // Remove old placement points from team total first
      const oldPlacementPts = existingForTeam.data.placement_points_awarded || 0;
      await base44.entities.Team.update(team_id, {
        total_tournament_points: Math.max(0, (team.data.total_tournament_points || 0) - oldPlacementPts + placementPoints)
      });
      await base44.entities.MatchStanding.update(existingForTeam.id, {
        placement,
        placement_points_awarded: placementPoints,
        team_kills_this_match: teamKills,
        total_match_points: placementPoints + killPoints
      });
    } else {
      await base44.entities.MatchStanding.create({
        match_id,
        tournament_id: tournament?.id || tournament_id,
        team_id,
        team_name: team.data.name,
        placement,
        placement_points_awarded: placementPoints,
        team_kills_this_match: teamKills,
        total_match_points: placementPoints + killPoints
      });
      await base44.entities.Team.update(team_id, {
        total_tournament_points: (team.data.total_tournament_points || 0) + placementPoints
      });
    }

    return new Response(JSON.stringify({ success: true, team: team.data.name, placement, placement_points: placementPoints }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
