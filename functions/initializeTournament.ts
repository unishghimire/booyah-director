import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, total_matches, points_per_kill, placement_points_config } = body;
    if (!name || !total_matches) return new Response(JSON.stringify({ error: 'name and total_matches required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const defaultConfig = {"1":15,"2":12,"3":10,"4":8,"5":6,"6":4,"7":2,"8":1,"9":1,"10":1,"11":1,"12":1};
    const finalConfig = placement_points_config || defaultConfig;

    const tournament = await base44.asServiceRole.entities.Tournament.create({
      name,
      total_matches: parseInt(total_matches),
      points_per_kill: points_per_kill || 1,
      placement_points_config: JSON.stringify(finalConfig),
      current_match_number: 0,
      status: 'setup'
    });

    const overlayStates = await base44.asServiceRole.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        tournament_id: tournament.id, current_screen: 'setup_blank', last_updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ success: true, tournament: { id: tournament.id, ...tournament.data } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
