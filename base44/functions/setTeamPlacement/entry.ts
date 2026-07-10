import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { team_id, match_id, placement, tournament_id } = body;

    const team = await base44.asServiceRole.entities.Team.get(team_id);
    const tournament = await base44.asServiceRole.entities.Tournament.get(tournament_id);

    let placementConfig = {};
    try { placementConfig = JSON.parse(tournament.placement_points_config || '{}'); } catch (e) { /* empty */ }

    const placementPoints = placementConfig[Number(placement)] || 0;
    const players = await base44.asServiceRole.entities.Player.filter({ team_id });
    const teamKills = players.reduce((sum, p) => sum + (p.current_match_kills || 0), 0);
    const totalMatchPoints = placementPoints + teamKills * (tournament.points_per_kill || 1);

    const existing = await base44.asServiceRole.entities.MatchStanding.filter({ match_id, team_id });
    let standing;
    if (existing[0]) {
      standing = await base44.asServiceRole.entities.MatchStanding.update(existing[0].id, {
        placement: Number(placement),
        placement_points_awarded: placementPoints,
        team_kills_this_match: teamKills,
        total_match_points: totalMatchPoints,
      });
    } else {
      standing = await base44.asServiceRole.entities.MatchStanding.create({
        match_id,
        tournament_id,
        team_id,
        team_name: team.name,
        placement: Number(placement),
        placement_points_awarded: placementPoints,
        team_kills_this_match: teamKills,
        total_match_points: totalMatchPoints,
      });
    }

    const allStandings = await base44.asServiceRole.entities.MatchStanding.filter({ team_id });
    const totalPoints = allStandings.reduce((sum, s) => sum + (s.total_match_points || 0), 0);
    await base44.asServiceRole.entities.Team.update(team_id, { total_tournament_points: totalPoints });

    return Response.json({ standing });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});