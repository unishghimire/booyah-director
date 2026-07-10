import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { player_id, match_id } = body;

    const player = await base44.asServiceRole.entities.Player.get(player_id);

    await base44.asServiceRole.entities.Player.update(player_id, { is_alive: false });

    let eliminated_team_name = '';
    if (player.team_id) {
      const team = await base44.asServiceRole.entities.Team.get(player.team_id);
      eliminated_team_name = team.name;
    }

    const eliminationEvent = await base44.asServiceRole.entities.EliminationEvent.create({
      match_id,
      tournament_id: player.tournament_id,
      eliminated_player_id: player_id,
      eliminated_player_name: player.name,
      eliminated_team_name,
      timestamp: new Date().toISOString(),
    });

    const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id: player.tournament_id });
    if (overlayStates[0]) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: 'elimination_alert',
        last_updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ elimination_event: eliminationEvent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});