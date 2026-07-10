import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { match_id, state } = body;
    const validStates = ['idle', 'pre_match', 'in_game', 'post_match', 'mvp', 'champions'];
    if (!match_id || !state || !validStates.includes(state)) {
      return new Response(JSON.stringify({ error: 'match_id and valid state required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const updateData: any = { state };
    if (state === 'in_game') updateData.started_at = new Date().toISOString();
    if (state === 'post_match') updateData.ended_at = new Date().toISOString();

    await base44.asServiceRole.entities.Match.update(match_id, updateData);

    const screenMap: Record<string, string> = { pre_match: 'pre_match_map', in_game: 'scoreboard', post_match: 'scoreboard' };
    if (screenMap[state]) {
      const overlayStates = await base44.asServiceRole.entities.OverlayState.list();
      if (overlayStates.length > 0) {
        await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
          current_screen: screenMap[state], last_updated_at: new Date().toISOString()
        });
      }
    }

    return new Response(JSON.stringify({ success: true, match_id, state, overlay_screen: screenMap[state] || null }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
