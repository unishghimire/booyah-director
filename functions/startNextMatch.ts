import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tournament_id, map_name } = body;
    if (!tournament_id) return new Response(JSON.stringify({ error: 'tournament_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const tournament = await base44.asServiceRole.entities.Tournament.get(tournament_id);
    if (!tournament) return new Response(JSON.stringify({ error: 'Tournament not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const newMatchNumber = (tournament.data.current_match_number || 0) + 1;
    await base44.asServiceRole.entities.Tournament.update(tournament_id, { current_match_number: newMatchNumber, status: 'active' });

    const match = await base44.asServiceRole.entities.Match.create({
      tournament_id, match_number: newMatchNumber, state: 'pre_match',
      map_name: map_name || 'Bermuda', started_at: new Date().toISOString()
    });

    const players = await base44.asServiceRole.entities.Player.filter({ tournament_id });
    for (const player of players) {
      await base44.asServiceRole.entities.Player.update(player.id, { is_alive: true, current_match_kills: 0 });
    }

    const overlayStates = await base44.asServiceRole.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: 'pre_match_map', tournament_id, last_updated_at: new Date().toISOString()
      });
    } else {
      await base44.asServiceRole.entities.OverlayState.create({
        current_screen: 'pre_match_map', tournament_id, last_updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ success: true, match: { id: match.id, ...match.data }, match_number: newMatchNumber }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
