import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { match_id, player_id, player_name, team_name, kills } = body;

    const updateData: any = {
      current_screen: 'mvp', mvp_player_id: player_id || '',
      mvp_player_name: player_name || '', mvp_team_name: team_name || '',
      mvp_kills: kills || 0, last_updated_at: new Date().toISOString()
    };

    const overlayStates = await base44.asServiceRole.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.asServiceRole.entities.OverlayState.update(overlayStates[0].id, updateData);
    } else {
      await base44.asServiceRole.entities.OverlayState.create(updateData);
    }

    if (match_id) await base44.asServiceRole.entities.Match.update(match_id, { state: 'mvp' });

    return new Response(JSON.stringify({ success: true, screen: 'mvp', mvp: { player_name, team_name, kills } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
