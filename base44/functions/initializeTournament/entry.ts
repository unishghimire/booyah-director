import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, total_matches, points_per_kill, placement_points_config } = body;

    const configStr = typeof placement_points_config === 'object'
      ? JSON.stringify(placement_points_config)
      : (placement_points_config || JSON.stringify({ 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1 }));

    const tournament = await base44.asServiceRole.entities.Tournament.create({
      name: name || 'Untitled Tournament',
      total_matches: Number(total_matches) || 6,
      points_per_kill: Number(points_per_kill) || 1,
      placement_points_config: configStr,
      current_match_number: 0,
      status: 'active',
    });

    await base44.asServiceRole.entities.OverlayState.create({
      tournament_id: tournament.id,
      current_screen: 'setup_blank',
      last_updated_at: new Date().toISOString(),
    });

    return Response.json({ tournament });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});