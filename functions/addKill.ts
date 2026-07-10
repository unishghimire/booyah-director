import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { player_id, match_id, killed_player_name, killed_team_name } = body;
    if (!player_id || !match_id) return new Response(JSON.stringify({ error: 'player_id and match_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Get player
    const player = await base44.entities.Player.get(player_id);
    if (!player) return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // Get team
    const team = await base44.entities.Team.get(player.data.team_id);
    if (!team) return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // Update player kills
    const newMatchKills = (player.data.current_match_kills || 0) + 1;
    const newTotalKills = (player.data.total_tournament_kills || 0) + 1;
    await base44.entities.Player.update(player_id, {
      current_match_kills: newMatchKills,
      total_tournament_kills: newTotalKills
    });

    // Update team kills and points
    const tournament = await base44.entities.Tournament.get(player.data.tournament_id);
    const pointsPerKill = tournament?.data?.points_per_kill || 1;
    await base44.entities.Team.update(team.id, {
      total_tournament_kills: (team.data.total_tournament_kills || 0) + 1,
      total_tournament_points: (team.data.total_tournament_points || 0) + pointsPerKill
    });

    // Create kill event
    const killEvent = await base44.entities.KillEvent.create({
      match_id,
      tournament_id: player.data.tournament_id,
      killer_player_id: player_id,
      killer_name: player.data.name,
      killer_team_name: team.data.name,
      killed_player_name: killed_player_name || 'Unknown',
      killed_team_name: killed_team_name || 'Unknown',
      timestamp: new Date().toISOString()
    });

    // Update match standing kills for team
    const standings = await base44.entities.MatchStanding.filter({ match_id, team_id: team.id });
    if (standings.length > 0) {
      const standing = standings[0];
      await base44.entities.MatchStanding.update(standing.id, {
        team_kills_this_match: (standing.data.team_kills_this_match || 0) + 1,
        total_match_points: (standing.data.total_match_points || 0) + pointsPerKill
      });
    }

    // Update overlay state timestamp
    const overlayStates = await base44.entities.OverlayState.list();
    if (overlayStates.length > 0) {
      await base44.entities.OverlayState.update(overlayStates[0].id, {
        last_updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      player: { id: player_id, name: player.data.name, current_match_kills: newMatchKills, total_tournament_kills: newTotalKills },
      team: { id: team.id, name: team.data.name },
      kill_event: { id: killEvent.id, ...killEvent.data }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
