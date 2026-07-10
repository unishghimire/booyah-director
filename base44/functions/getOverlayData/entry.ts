import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const tournaments = await base44.asServiceRole.entities.Tournament.list('-created_date', 1);
    const tournament = tournaments[0];

    if (!tournament) {
      return Response.json({
        tournament: null,
        overlay_state: { current_screen: 'setup_blank' },
        teams: [],
        players: [],
        current_match: null,
        kill_feed: [],
        eliminations: [],
        standings: [],
      });
    }

    const tid = tournament.id;

    const overlayStates = await base44.asServiceRole.entities.OverlayState.filter({ tournament_id: tid });
    const overlay_state = overlayStates[0] || { current_screen: 'setup_blank', tournament_id: tid };

    const teams = await base44.asServiceRole.entities.Team.filter({ tournament_id: tid });

    const players = await base44.asServiceRole.entities.Player.filter({ tournament_id: tid });

    const matches = await base44.asServiceRole.entities.Match.filter({ tournament_id: tid }, '-match_number', 1);
    const current_match = matches[0] || null;

    let kill_feed = [];
    let eliminations = [];
    let standings = [];

    if (current_match) {
      kill_feed = await base44.asServiceRole.entities.KillEvent.filter({ match_id: current_match.id }, '-created_date', 30);
      eliminations = await base44.asServiceRole.entities.EliminationEvent.filter({ match_id: current_match.id }, '-created_date', 20);
      standings = await base44.asServiceRole.entities.MatchStanding.filter({ match_id: current_match.id }, 'placement');
    }

    return Response.json({
      tournament,
      overlay_state,
      teams,
      players,
      current_match,
      kill_feed,
      eliminations,
      standings,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});