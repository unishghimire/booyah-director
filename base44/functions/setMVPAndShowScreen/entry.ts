import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { match_id, player_id, player_name, team_name, kills } = body;

    const match = await base44.asServiceRole.entities.Match.get(match_id);

    const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id: match.tournament_id });
    if (overlayStates[0]) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: 'mvp',
        mvp_player_id: player_id,
        mvp_player_name: player_name,
        mvp_team_name: team_name,
        mvp_kills: Number(kills),
        last_updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});