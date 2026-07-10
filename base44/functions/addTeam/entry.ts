import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tournament_id, team_name, player_names } = body;

    const team = await base44.asServiceRole.entities.Team.create({
      tournament_id,
      name: team_name,
      total_tournament_points: 0,
      total_tournament_kills: 0,
    });

    const names = (player_names || []).filter(n => n && n.trim());
    if (names.length > 0) {
      await base44.asServiceRole.entities.Player.bulkCreate(
        names.map(n => ({
          tournament_id,
          team_id: team.id,
          name: n.trim(),
          is_alive: true,
          current_match_kills: 0,
          total_tournament_kills: 0,
        }))
      );
    }

    return Response.json({ team });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});