import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get active tournament
    const tournaments = await base44.entities.Tournament.list();
    const tournament = tournaments.find(t => t.data.status === 'active') || tournaments[0];
    
    if (!tournament) {
      return new Response(JSON.stringify({ error: 'No tournament found', overlay_state: { current_screen: 'setup_blank' } }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tid = tournament.id;

    // Get overlay state
    const overlayStates = await base44.entities.OverlayState.list();
    const overlayState = overlayStates[0] || { data: { current_screen: 'setup_blank' } };

    // Get all teams for this tournament
    const allTeams = await base44.entities.Team.filter({ tournament_id: tid });
    const teams = allTeams.sort((a, b) => (b.data.total_tournament_points || 0) - (a.data.total_tournament_points || 0));

    // Get all players for this tournament
    const players = await base44.entities.Player.filter({ tournament_id: tid });

    // Get active match
    const matches = await base44.entities.Match.filter({ tournament_id: tid });
    const currentMatch = matches.sort((a, b) => (b.data.match_number || 0) - (a.data.match_number || 0))[0];

    // Get recent kill events (last 10)
    let killFeed = [];
    if (currentMatch) {
      const kills = await base44.entities.KillEvent.filter({ match_id: currentMatch.id });
      killFeed = kills
        .sort((a, b) => new Date(b.data.timestamp || b.created_date).getTime() - new Date(a.data.timestamp || a.created_date).getTime())
        .slice(0, 10);
    }

    // Get recent elimination events (last 5)
    let eliminations = [];
    if (currentMatch) {
      const elims = await base44.entities.EliminationEvent.filter({ match_id: currentMatch.id });
      eliminations = elims
        .sort((a, b) => new Date(b.data.timestamp || b.created_date).getTime() - new Date(a.data.timestamp || a.created_date).getTime())
        .slice(0, 5);
    }

    // Get match standings
    let standings = [];
    if (currentMatch) {
      standings = await base44.entities.MatchStanding.filter({ match_id: currentMatch.id });
    }

    return new Response(JSON.stringify({
      tournament: { id: tournament.id, ...tournament.data },
      overlay_state: overlayState.data,
      teams: teams.map(t => ({ id: t.id, ...t.data })),
      players: players.map(p => ({ id: p.id, ...p.data })),
      current_match: currentMatch ? { id: currentMatch.id, ...currentMatch.data } : null,
      kill_feed: killFeed.map(k => ({ id: k.id, ...k.data })),
      eliminations: eliminations.map(e => ({ id: e.id, ...e.data })),
      standings: standings.map(s => ({ id: s.id, ...s.data }))
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
