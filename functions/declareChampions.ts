import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { tournament_id } = body;
    if (!tournament_id) return new Response(JSON.stringify({ error: 'tournament_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const teams = await base44.asServiceRole.entities.Team.filter({ tournament_id });
    if (teams.length === 0) return new Response(JSON.stringify({ error: 'No teams found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const sorted = teams.sort((a: any, b: any) => (b.data.total_tournament_points || 0) - (a.data.total_tournament_points || 0));
    const maxPts = sorted[0].data.total_tournament_points || 0;
    const topTeams = sorted.filter((t: any) => (t.data.total_tournament_points || 0) === maxPts);

    return new Response(JSON.stringify({
      champion: { id: sorted[0].id, ...sorted[0].data },
      tied: topTeams.length > 1,
      tied_teams: topTeams.map((t: any) => ({ id: t.id, ...t.data })),
      all_teams_ranked: sorted.map((t: any) => ({ id: t.id, ...t.data }))
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
