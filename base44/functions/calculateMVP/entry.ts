import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { match_id } = body;

    const match = await base44.asServiceRole.entities.Match.get(match_id);
    const players = await base44.asServiceRole.entities.Player.filter({ tournament_id: match.tournament_id });

    let mvp = null;
    let maxKills = -1;
    for (const player of players) {
      if ((player.current_match_kills || 0) > maxKills) {
        maxKills = player.current_match_kills || 0;
        mvp = player;
      }
    }

    let team_name = '';
    if (mvp && mvp.team_id) {
      const team = await base44.asServiceRole.entities.Team.get(mvp.team_id);
      team_name = team.name;
    }

    return Response.json({
      player_id: mvp?.id || null,
      player_name: mvp?.name || '',
      team_name,
      kills: Math.max(maxKills, 0),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});