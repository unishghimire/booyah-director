import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tournament_id } = body;

    await base44.asServiceRole.entities.Tournament.update(tournament_id, { status: 'completed' });

    const teams = await base44.asServiceRole.entities.Team.filter({ tournament_id });
    const sorted = [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
    const champion = sorted[0];

    if (champion) {
      const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id });
      if (overlayStates[0]) {
        await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
          current_screen: 'champions',
          champion_team_id: champion.id,
          champion_team_name: champion.name,
          champion_total_points: champion.total_tournament_points || 0,
          last_updated_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({ champion });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});