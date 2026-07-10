import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { match_id } = body;
    if (!match_id) return new Response(JSON.stringify({ error: 'match_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const killEvents = await base44.entities.KillEvent.filter({ match_id });

    // Aggregate kills per player
    const killMap: Record<string, { name: string, team: string, kills: number, player_id: string }> = {};
    for (const evt of killEvents) {
      const pid = evt.data.killer_player_id;
      if (!killMap[pid]) {
        killMap[pid] = { name: evt.data.killer_name, team: evt.data.killer_team_name, kills: 0, player_id: pid };
      }
      killMap[pid].kills++;
    }

    const sorted = Object.values(killMap).sort((a, b) => b.kills - a.kills);
    if (sorted.length === 0) return new Response(JSON.stringify({ mvp: null, tied: false }), { headers: { 'Content-Type': 'application/json' } });

    const maxKills = sorted[0].kills;
    const topPlayers = sorted.filter(p => p.kills === maxKills);

    return new Response(JSON.stringify({ mvp: topPlayers[0], tied: topPlayers.length > 1, tied_players: topPlayers, max_kills: maxKills }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
