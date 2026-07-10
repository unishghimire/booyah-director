import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { team_id, team_name, total_points, tournament_id } = body;

    const overlayStates = await base44.entities.OverlayState.list();
    const updateData = {
      current_screen: 'champions',
      champion_team_id: team_id || '',
      champion_team_name: team_name || '',
      champion_total_points: total_points || 0,
      last_updated_at: new Date().toISOString()
    };

    if (overlayStates.length > 0) {
      await base44.entities.OverlayState.update(overlayStates[0].id, updateData);
    } else {
      await base44.entities.OverlayState.create(updateData);
    }

    if (tournament_id) {
      await base44.entities.Tournament.update(tournament_id, { status: 'completed' });
    }

    return new Response(JSON.stringify({ success: true, screen: 'champions', champion: { team_name, total_points } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
