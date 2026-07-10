import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { screen } = body;
    const validScreens = ['setup_blank', 'pre_match_map', 'scoreboard', 'kill_feed', 'elimination_alert', 'mvp', 'champions'];
    if (!screen || !validScreens.includes(screen)) {
      return new Response(JSON.stringify({ error: `Invalid screen. Must be one of: ${validScreens.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const overlayStates = await base44.asServiceRole.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: screen,
        last_updated_at: new Date().toISOString()
      });
    } else {
      await base44.asServiceRole.entities.OverlayState.create({
        current_screen: screen,
        last_updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ success: true, current_screen: screen }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
