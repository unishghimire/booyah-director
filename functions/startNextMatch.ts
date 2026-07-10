import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { tournament_id, map_name } = body;
    if (!tournament_id) return new Response(JSON.stringify({ error: 'tournament_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const tournament = await base44.entities.Tournament.get(tournament_id);
    if (!tournament) return new Response(JSON.stringify({ error: 'Tournament not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const newMatchNumber = (tournament.data.current_match_number || 0) + 1;

    // Update tournament
    await base44.entities.Tournament.update(tournament_id, {
      current_match_number: newMatchNumber,
      status: 'active'
    });

    // Create new match
    const match = await base44.entities.Match.create({
      tournament_id,
      match_number: newMatchNumber,
      state: 'pre_match',
      map_name: map_name || 'Bermuda',
      started_at: new Date().toISOString()
    });

    // Reset all players to alive with 0 kills
    const players = await base44.entities.Player.filter({ tournament_id });
    for (const player of players) {
      await base44.entities.Player.update(player.id, {
        is_alive: true,
        current_match_kills: 0
      });
    }

    // Switch overlay to pre_match_map
    const overlayStates = await base44.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: 'pre_match_map',
        tournament_id,
        last_updated_at: new Date().toISOString()
      });
    } else {
      await base44.entities.OverlayState.create({
        current_screen: 'pre_match_map',
        tournament_id,
        last_updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ success: true, match: { id: match.id, ...match.data }, match_number: newMatchNumber }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
