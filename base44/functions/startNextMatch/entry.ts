import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tournament_id, map_name } = body;

    const tournament = await base44.asServiceRole.entities.Tournament.get(tournament_id);
    const newMatchNumber = (tournament.current_match_number || 0) + 1;

    await base44.asServiceRole.entities.Tournament.update(tournament_id, {
      current_match_number: newMatchNumber,
      status: 'active',
    });

    const match = await base44.asServiceRole.entities.Match.create({
      tournament_id,
      match_number: newMatchNumber,
      state: 'pre_match',
      map_name: map_name || 'Bermuda',
      started_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Player.updateMany(
      { tournament_id },
      { $set: { is_alive: true, current_match_kills: 0 } }
    );

    const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id });
    if (overlayStates[0]) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: 'pre_match_map',
        last_updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ match });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});