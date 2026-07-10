import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { team_id, team_name, total_points, tournament_id } = body;

    const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id });
    if (overlayStates[0]) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: 'champions',
        champion_team_id: team_id,
        champion_team_name: team_name,
        champion_total_points: Number(total_points),
        last_updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});