import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { match_id, state } = body;

    const match = await base44.asServiceRole.entities.Match.update(match_id, { state });

    const screenMap = {
      'pre_match': 'pre_match_map',
      'in_game': 'scoreboard',
      'post_match': 'scoreboard',
    };
    const screen = screenMap[state];
    if (screen && match.tournament_id) {
      const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id: match.tournament_id });
      if (overlayStates[0]) {
        await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, {
          current_screen: screen,
          last_updated_at: new Date().toISOString(),
        });
      }
    }

    if (state === 'post_match' && match.tournament_id) {
      // no-op; standings are set via setTeamPlacement
    }

    return Response.json({ match });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});