import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tournament_id, team_name, player_names } = body;
    if (!tournament_id || !team_name) return new Response(JSON.stringify({ error: 'tournament_id and team_name required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const existingTeams = await base44.asServiceRole.entities.Team.filter({ tournament_id });
    if (existingTeams.length >= 12) return new Response(JSON.stringify({ error: 'Maximum 12 teams allowed' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const players = player_names || [];
    if (players.length > 4) return new Response(JSON.stringify({ error: 'Maximum 4 players per squad' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const team = await base44.asServiceRole.entities.Team.create({
      tournament_id, name: team_name, total_tournament_points: 0, total_tournament_kills: 0
    });

    const createdPlayers: any[] = [];
    for (const playerName of players) {
      if (playerName && playerName.trim()) {
        const player = await base44.asServiceRole.entities.Player.create({
          team_id: team.id, tournament_id, name: playerName.trim(),
          is_alive: true, current_match_kills: 0, total_tournament_kills: 0
        });
        createdPlayers.push({ id: player.id, ...player.data });
      }
    }

    return new Response(JSON.stringify({ success: true, team: { id: team.id, ...team.data }, players: createdPlayers }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
