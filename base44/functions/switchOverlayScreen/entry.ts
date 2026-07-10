import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { screen } = body;

    const tournaments = await base44.asServiceRole.entities.Tournament.list('-created_date', 1);
    if (!tournaments[0]) {
      return Response.json({ error: 'No tournament found' }, { status: 404 });
    }

    const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id: tournaments[0].id });
    if (overlayStates[0]) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
        current_screen: screen,
        last_updated_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true, screen });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});