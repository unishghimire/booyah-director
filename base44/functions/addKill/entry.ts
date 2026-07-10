import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { player_id, match_id, killed_player_name, killed_team_name } = body;

    const player = await base44.asServiceRole.entities.Player.get(player_id);

    await base44.asServiceRole.entities.Player.update(player_id, {
      $inc: { current_match_kills: 1, total_tournament_kills: 1 },
    });

    let killer_team_name = '';
    if (player.team_id) {
      const team = await base44.asServiceRole.entities.Team.get(player.team_id);
      killer_team_name = team.name;
    }

    const killEvent = await base44.asServiceRole.entities.KillEvent.create({
      match_id,
      tournament_id: player.tournament_id,
      killer_player_id: player_id,
      killer_name: player.name,
      killer_team_name,
      killed_player_name: killed_player_name || '',
      killed_team_name: killed_team_name || '',
      timestamp: new Date().toISOString(),
    });

    return Response.json({ kill_event: killEvent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});