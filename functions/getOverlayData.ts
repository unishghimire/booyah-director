import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const tournaments = await base44.asServiceRole.entities.Tournament.list();
    const tournament = tournaments.find((t: any) => t.data.status === 'active') || tournaments[0];

    if (!tournament) {
      return new Response(JSON.stringify({ overlay_state: { current_screen: 'setup_blank' }, teams: [], players: [], kill_feed: [], eliminations: [], standings: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tid = tournament.id;
    const overlayStates = await base44.asServiceRole.entities.OverlayState.list();
    const overlayState = overlayStates[0] || { data: { current_screen: 'setup_blank' } };

    const allTeams = await base44.asServiceRole.entities.Team.filter({ tournament_id: tid });
    const teams = allTeams.sort((a: any, b: any) => (b.data.total_tournament_points || 0) - (a.data.total_tournament_points || 0));

    const players = await base44.asServiceRole.entities.Player.filter({ tournament_id: tid });

    const matches = await base44.asServiceRole.entities.Match.filter({ tournament_id: tid });
    const currentMatch = matches.sort((a: any, b: any) => (b.data.match_number || 0) - (a.data.match_number || 0))[0];

    let killFeed: any[] = [];
    if (currentMatch) {
      const kills = await base44.asServiceRole.entities.KillEvent.filter({ match_id: currentMatch.id });
      killFeed = kills
        .sort((a: any, b: any) => new Date(b.data.timestamp || b.created_date).getTime() - new Date(a.data.timestamp || a.created_date).getTime())
        .slice(0, 10);
    }

    let eliminations: any[] = [];
    if (currentMatch) {
      const elims = await base44.asServiceRole.entities.EliminationEvent.filter({ match_id: currentMatch.id });
      eliminations = elims
        .sort((a: any, b: any) => new Date(b.data.timestamp || b.created_date).getTime() - new Date(a.data.timestamp || a.created_date).getTime())
        .slice(0, 5);
    }

    let standings: any[] = [];
    if (currentMatch) {
      standings = await base44.asServiceRole.entities.MatchStanding.filter({ match_id: currentMatch.id });
    }

    return new Response(JSON.stringify({
      tournament: { id: tournament.id, ...tournament.data },
      overlay_state: overlayState.data,
      teams: teams.map((t: any) => ({ id: t.id, ...t.data })),
      players: players.map((p: any) => ({ id: p.id, ...p.data })),
      current_match: currentMatch ? { id: currentMatch.id, ...currentMatch.data } : null,
      kill_feed: killFeed.map((k: any) => ({ id: k.id, ...k.data })),
      eliminations: eliminations.map((e: any) => ({ id: e.id, ...e.data })),
      standings: standings.map((s: any) => ({ id: s.id, ...s.data }))
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
