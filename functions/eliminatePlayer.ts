import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { player_id, match_id } = body;
    if (!player_id || !match_id) return new Response(JSON.stringify({ error: 'player_id and match_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const player = await base44.entities.Player.get(player_id);
    if (!player) return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const team = await base44.entities.Team.get(player.data.team_id);

    await base44.entities.Player.update(player_id, { is_alive: false });

    const elimEvent = await base44.entities.EliminationEvent.create({
      match_id,
      tournament_id: player.data.tournament_id,
      eliminated_player_id: player_id,
      eliminated_player_name: player.data.name,
      eliminated_team_name: team?.data?.name || 'Unknown',
      timestamp: new Date().toISOString()
    });

    const overlayStates = await base44.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.entities.OverlayState.update(overlayStates[0].id, {
        last_updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      player: { id: player_id, name: player.data.name, team: team?.data?.name },
      elimination_event: { id: elimEvent.id, ...elimEvent.data }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
