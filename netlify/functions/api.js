const admin = require('firebase-admin');
const { genId } = require('./_db'); // Keep genId for generating safe IDs

// Initialize only once (serverless cold start safety)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function ok(data) { return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) }; }
function err(code, msg) { return { statusCode: code, headers: corsHeaders, body: JSON.stringify({ error: msg }) }; }

const DEFAULT_DESIGN = {
  accentColor: '#f97316',
  accentColor2: '#ef4444',
  bgColor: '#0a0a0f',
  textColor: '#ffffff',
  tournamentName: 'BOOYAH CUP',
  tournamentSubtitle: 'GRAND FINALS',
  gameLabel: 'GAME',
  logoUrl: '',
  overlayStyle: 'default',   // 'default' | 'ff_classic'
  fontStyle: 'orbitron',     // 'orbitron' | 'rajdhani' | 'impact'
};

function defaultDB() {
  return {
    tournament: null,
    tournaments: [],
    teams: [],
    players: [],
    matches: [],
    match_standings: [],
    kill_events: [],
    elimination_events: [],
    current_match: null,
    kill_feed: [],
    eliminations: [],
    standings: [],
    overlay_state: {
      id: 'singleton',
      tournament_id: null,
      current_screen: 'setup_blank',
      mvp_player_id: null,
      mvp_player_name: null,
      mvp_team_name: null,
      mvp_kills: 0,
      champion_team_id: null,
      champion_team_name: null,
      champion_total_points: 0,
      last_updated_at: new Date().toISOString()
    },
    design: null,
  };
}

async function readDB() {
  const snap = await db.ref('booyah').once('value');
  return snap.val() || defaultDB();
}

async function writeDB(data) {
  await db.ref('booyah').set(data);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const pathParts = event.path.replace('/.netlify/functions/api', '').replace('/api', '').split('/').filter(Boolean);
  const route = pathParts[0] || '';
  
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return err(400, 'Invalid JSON body');
    }
  }

  try {
    const data = await readDB();

    if (route === 'resetDatabase') {
      await writeDB(defaultDB());
      return ok({ success: true, message: 'Database reset' });
    }

    if (!data.design) data.design = { ...DEFAULT_DESIGN };
    if (!data.tournaments) data.tournaments = [];
    if (!data.teams) data.teams = [];
    if (!data.players) data.players = [];
    if (!data.matches) data.matches = [];
    if (!data.match_standings) data.match_standings = [];
    if (!data.kill_events) data.kill_events = [];
    if (!data.elimination_events) data.elimination_events = [];
    if (!data.overlay_state) {
      data.overlay_state = {
        id: 'singleton',
        tournament_id: null,
        current_screen: 'setup_blank',
        mvp_player_id: null,
        mvp_player_name: null,
        mvp_team_name: null,
        mvp_kills: 0,
        champion_team_id: null,
        champion_team_name: null,
        champion_total_points: 0,
        last_updated_at: new Date().toISOString()
      };
    }

    // ── GET OVERLAY DATA ──────────────────────────────────────────
    if (route === 'getOverlayData') {
      const tournament = data.tournaments.find(t => t.status === 'active') || data.tournaments[data.tournaments.length - 1] || null;
      if (!tournament) {
        return ok({
          tournament: null,
          overlay_state: data.overlay_state,
          design: data.design,
          teams: [],
          players: [],
          current_match: null,
          kill_feed: [],
          eliminations: [],
          standings: []
        });
      }
      const tid = tournament.id;
      const teams = data.teams.filter(t => t.tournament_id === tid).map(t => {
        // Compute total_tournament_points dynamically from match_standings and kills to ensure data integrity
        const standingsForTeam = data.match_standings.filter(s => s.tournament_id === tid && s.team_id === t.id);
        const placementPoints = standingsForTeam.reduce((sum, s) => sum + (s.placement_points_awarded || 0), 0);
        
        // Sum player kills for total tournament kills
        const teamPlayers = data.players.filter(p => p.team_id === t.id);
        const totalKills = teamPlayers.reduce((sum, p) => sum + (p.total_tournament_kills || 0), 0);
        
        const pointsPerKill = tournament.points_per_kill || 1;
        const totalPoints = placementPoints + (totalKills * pointsPerKill);

        return {
          ...t,
          total_tournament_kills: totalKills,
          total_tournament_points: totalPoints
        };
      }).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));

      // Map players and attach the 'is_alive' field dynamically (default to true if missing)
      const players = data.players.filter(p => p.tournament_id === tid).map(p => ({
        ...p,
        is_alive: p.is_alive !== undefined ? p.is_alive : true
      }));

      const matches = data.matches.filter(m => m.tournament_id === tid).sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
      const currentMatch = matches[0] || null;
      let killFeed = [], eliminations = [], standings = [];
      if (currentMatch) {
        killFeed = data.kill_events.filter(k => k.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);
        eliminations = data.elimination_events.filter(e => e.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
        standings = data.match_standings.filter(s => s.match_id === currentMatch.id);
      }
      return ok({ tournament, overlay_state: data.overlay_state, design: data.design, teams, players, current_match: currentMatch, kill_feed: killFeed, eliminations, standings });
    }

    // ── SAVE DESIGN ───────────────────────────────────────────────
    if (route === 'saveDesign') {
      data.design = { ...DEFAULT_DESIGN, ...data.design, ...body };
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true, design: data.design });
    }

    // ── GET DESIGN ────────────────────────────────────────────────
    if (route === 'getDesign') {
      return ok({ design: data.design || DEFAULT_DESIGN });
    }

    // ── INITIALIZE TOURNAMENT ─────────────────────────────────────
    if (route === 'initializeTournament') {
      const { name, total_matches, points_per_kill, placement_points_config } = body;
      if (!name || !total_matches) return err(400, 'name and total_matches required');
      const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
      const tournament = { id: genId(), name, total_matches: parseInt(total_matches), points_per_kill: points_per_kill || 1, placement_points_config: JSON.stringify(placement_points_config || defaultConfig), current_match_number: 0, status: 'setup', created_at: new Date().toISOString() };
      data.tournaments.push(tournament);
      data.overlay_state.tournament_id = tournament.id;
      data.overlay_state.current_screen = 'setup_blank';
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true, tournament });
    }

    // ── ADD TEAM ──────────────────────────────────────────────────
    if (route === 'addTeam') {
      const { tournament_id, team_name, player_names } = body;
      if (!tournament_id || !team_name) return err(400, 'tournament_id and team_name required');
      if (data.teams.filter(t => t.tournament_id === tournament_id).length >= 12) return err(400, 'Maximum 12 teams allowed');
      const team = { id: genId(), tournament_id, name: team_name, logo_url: body.logo_url || null, total_tournament_points: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
      data.teams.push(team);
      const createdPlayers = (player_names || []).filter(n => n?.trim()).slice(0, 4).map(name => {
        const p = { id: genId(), team_id: team.id, tournament_id, name: name.trim(), is_alive: true, current_match_kills: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
        data.players.push(p);
        return p;
      });
      await writeDB(data);
      return ok({ success: true, team, players: createdPlayers });
    }

    // ── ADD PLAYER ────────────────────────────────────────────────
    if (route === 'addPlayer') {
      const { team_id, name } = body;
      if (!team_id || !name) return err(400, 'team_id and name required');
      const team = data.teams.find(t => t.id === team_id);
      if (!team) return err(404, 'Team not found');
      const existing = data.players.filter(p => p.team_id === team_id);
      if (existing.length >= 6) return err(400, 'Max 6 players per team');
      const player = { id: genId(), team_id, tournament_id: team.tournament_id, name: name.trim(), is_alive: true, current_match_kills: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
      data.players.push(player);
      await writeDB(data);
      return ok({ success: true, player });
    }

    // ── START NEXT MATCH ──────────────────────────────────────────
    if (route === 'startNextMatch') {
      const { tournament_id, map_name } = body;
      if (!tournament_id) return err(400, 'tournament_id required');
      const tIdx = data.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');
      const newMatchNumber = (data.tournaments[tIdx].current_match_number || 0) + 1;
      data.tournaments[tIdx].current_match_number = newMatchNumber;
      data.tournaments[tIdx].status = 'active';
      const match = { id: genId(), tournament_id, match_number: newMatchNumber, state: 'pre_match', map_name: map_name || 'Bermuda', started_at: new Date().toISOString(), ended_at: null };
      data.matches.push(match);
      data.players = data.players.map(p => p.tournament_id === tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      data.overlay_state.current_screen = 'pre_match_map';
      data.overlay_state.tournament_id = tournament_id;
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true, match, match_number: newMatchNumber });
    }

    // ── UPDATE MATCH STATE ────────────────────────────────────────
    if (route === 'updateMatchState') {
      const { match_id, state } = body;
      if (!match_id || !state) return err(400, 'match_id and state required');
      const mIdx = data.matches.findIndex(m => m.id === match_id);
      if (mIdx === -1) return err(404, 'Match not found');
      data.matches[mIdx].state = state;
      if (state === 'ended') data.matches[mIdx].ended_at = new Date().toISOString();
      if (state === 'live') { data.overlay_state.current_screen = 'ff_scoreboard'; data.overlay_state.last_updated_at = new Date().toISOString(); }
      await writeDB(data);
      return ok({ success: true });
    }

    // ── ADD KILL ──────────────────────────────────────────────────
    if (route === 'addKill') {
      const { player_id, match_id, killed_player_name, killed_team_name } = body;
      if (!player_id || !match_id) return err(400, 'player_id and match_id required');
      const pIdx = data.players.findIndex(p => p.id === player_id);
      if (pIdx === -1) return err(404, 'Player not found');
      const player = data.players[pIdx];
      const tIdx = data.teams.findIndex(t => t.id === player.team_id);
      if (tIdx === -1) return err(404, 'Team not found');
      const tournament = data.tournaments.find(t => t.id === player.tournament_id);
      const pointsPerKill = tournament?.points_per_kill || 1;
      data.players[pIdx].current_match_kills = (player.current_match_kills || 0) + 1;
      data.players[pIdx].total_tournament_kills = (player.total_tournament_kills || 0) + 1;
      data.teams[tIdx].total_tournament_kills = (data.teams[tIdx].total_tournament_kills || 0) + 1;
      data.teams[tIdx].total_tournament_points = (data.teams[tIdx].total_tournament_points || 0) + pointsPerKill;
      const killEvent = { id: genId(), match_id, tournament_id: player.tournament_id, killer_player_id: player_id, killer_name: player.name, killer_team_name: data.teams[tIdx].name, killed_player_name: killed_player_name || 'Unknown', killed_team_name: killed_team_name || 'Unknown', timestamp: new Date().toISOString() };
      data.kill_events.push(killEvent);
      const sIdx = data.match_standings.findIndex(s => s.match_id === match_id && s.team_id === data.teams[tIdx].id);
      if (sIdx !== -1) { data.match_standings[sIdx].team_kills_this_match = (data.match_standings[sIdx].team_kills_this_match || 0) + 1; data.match_standings[sIdx].total_match_points = (data.match_standings[sIdx].total_match_points || 0) + pointsPerKill; }
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true, player: { id: player_id, name: player.name, current_match_kills: data.players[pIdx].current_match_kills, total_tournament_kills: data.players[pIdx].total_tournament_kills }, team: { id: data.teams[tIdx].id, name: data.teams[tIdx].name }, kill_event: killEvent });
    }

    // ── ELIMINATE PLAYER ──────────────────────────────────────────
    if (route === 'eliminatePlayer') {
      const { player_id, match_id } = body;
      if (!player_id || !match_id) return err(400, 'player_id and match_id required');
      const pIdx = data.players.findIndex(p => p.id === player_id);
      if (pIdx === -1) return err(404, 'Player not found');
      const player = data.players[pIdx];
      const team = data.teams.find(t => t.id === player.team_id);
      data.players[pIdx].is_alive = false;
      const elimEvent = { id: genId(), match_id, tournament_id: player.tournament_id, eliminated_player_id: player_id, eliminated_player_name: player.name, eliminated_team_name: team?.name || 'Unknown', timestamp: new Date().toISOString() };
      data.elimination_events.push(elimEvent);
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true, player: { id: player_id, name: player.name, team: team?.name }, elimination_event: elimEvent });
    }

    // ── SET TEAM PLACEMENT ────────────────────────────────────────
    if (route === 'setTeamPlacement') {
      const { team_id, match_id, placement, tournament_id } = body;
      if (!team_id || !match_id || placement === undefined) return err(400, 'team_id, match_id, placement required');
      const duplicate = data.match_standings.find(s => s.match_id === match_id && s.placement === placement && s.team_id !== team_id);
      if (duplicate) return err(400, `Placement ${placement} already assigned to ${duplicate.team_name}`);
      const tournament = data.tournaments.find(t => t.id === tournament_id) || data.tournaments.find(t => t.status === 'active');
      const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
      let config = defaultConfig;
      if (tournament?.placement_points_config) { try { config = { ...defaultConfig, ...JSON.parse(tournament.placement_points_config) }; } catch {} }
      const placementPoints = config[String(placement)] || 0;
      const team = data.teams.find(t => t.id === team_id);
      if (!team) return err(404, 'Team not found');
      const teamKills = data.kill_events.filter(k => k.match_id === match_id && k.killer_team_name === team.name).length;
      const pointsPerKill = tournament?.points_per_kill || 1;
      const killPoints = teamKills * pointsPerKill;
      const sIdx = data.match_standings.findIndex(s => s.match_id === match_id && s.team_id === team_id);
      const tIdx = data.teams.findIndex(t => t.id === team_id);
      if (sIdx !== -1) {
        const oldPts = data.match_standings[sIdx].placement_points_awarded || 0;
        data.teams[tIdx].total_tournament_points = Math.max(0, (data.teams[tIdx].total_tournament_points || 0) - oldPts + placementPoints);
        data.match_standings[sIdx] = { ...data.match_standings[sIdx], placement, placement_points_awarded: placementPoints, team_kills_this_match: teamKills, total_match_points: placementPoints + killPoints };
      } else {
        data.match_standings.push({ id: genId(), match_id, tournament_id: tournament?.id || tournament_id, team_id, team_name: team.name, placement, placement_points_awarded: placementPoints, team_kills_this_match: teamKills, total_match_points: placementPoints + killPoints });
        data.teams[tIdx].total_tournament_points = (data.teams[tIdx].total_tournament_points || 0) + placementPoints;
      }
      await writeDB(data);
      return ok({ success: true, team: team.name, placement, placement_points: placementPoints, kill_points: killPoints });
    }

    // ── CALCULATE MVP ─────────────────────────────────────────────
    if (route === 'calculateMVP') {
      const match_id = body.match_id || event.queryStringParameters?.match_id;
      if (!match_id) return err(400, 'match_id required');
      const killMap = {};
      for (const evt of data.kill_events.filter(k => k.match_id === match_id)) {
        if (!killMap[evt.killer_player_id]) killMap[evt.killer_player_id] = { name: evt.killer_name, team: evt.killer_team_name, kills: 0, player_id: evt.killer_player_id };
        killMap[evt.killer_player_id].kills++;
      }
      const sorted = Object.values(killMap).sort((a, b) => b.kills - a.kills);
      if (!sorted.length) return ok({ mvp: null, tied: false, message: 'No kills recorded' });
      const maxKills = sorted[0].kills;
      const top = sorted.filter(p => p.kills === maxKills);
      return ok({ mvp: top[0], tied: top.length > 1, tied_players: top, max_kills: maxKills });
    }

    // ── SET MVP AND SHOW SCREEN ───────────────────────────────────
    if (route === 'setMVPAndShowScreen') {
      const { player_id, player_name, team_name, kills } = body;
      data.overlay_state = { ...data.overlay_state, current_screen: 'mvp', mvp_player_id: player_id || '', mvp_player_name: player_name || '', mvp_team_name: team_name || '', mvp_kills: kills || 0, last_updated_at: new Date().toISOString() };
      await writeDB(data);
      return ok({ success: true });
    }

    // ── SET CHAMPION AND SHOW SCREEN ──────────────────────────────
    if (route === 'setChampionAndShowScreen') {
      const { team_id, team_name, total_points } = body;
      data.overlay_state = { ...data.overlay_state, current_screen: 'champions', champion_team_id: team_id || '', champion_team_name: team_name || '', champion_total_points: total_points || 0, last_updated_at: new Date().toISOString() };
      await writeDB(data);
      return ok({ success: true });
    }

    // ── SWITCH OVERLAY SCREEN ─────────────────────────────────────
    if (route === 'switchOverlayScreen') {
      const { screen } = body;
      if (!screen) return err(400, 'screen required');
      data.overlay_state.current_screen = screen;
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true });
    }

    // ── DECLARE CHAMPIONS ─────────────────────────────────────────
    if (route === 'declareChampions') {
      const { tournament_id } = body;
      if (!tournament_id) return err(400, 'tournament_id required');
      const tIdx = data.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx !== -1) data.tournaments[tIdx].status = 'completed';
      const teams = data.teams.filter(t => t.tournament_id === tournament_id).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
      await writeDB(data);
      return ok({ success: true, rankings: teams.map((t, i) => ({ rank: i + 1, team: t.name, total_points: t.total_tournament_points, total_kills: t.total_tournament_kills })) });
    }

    // ── DELETE TEAM ───────────────────────────────────────────────
    if (route === 'deleteTeam') {
      const { team_id } = body;
      if (!team_id) return err(400, 'team_id required');
      data.teams = data.teams.filter(t => t.id !== team_id);
      data.players = data.players.filter(p => p.team_id !== team_id);
      data.match_standings = data.match_standings.filter(s => s.team_id !== team_id);
      await writeDB(data);
      return ok({ success: true });
    }

    // ── REVIVE PLAYER ─────────────────────────────────────────────
    if (route === 'revivePlayer') {
      const { player_id } = body;
      if (!player_id) return err(400, 'player_id required');
      const pIdx = data.players.findIndex(p => p.id === player_id);
      if (pIdx === -1) return err(404, 'Player not found');
      data.players[pIdx].is_alive = true;
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true, player: data.players[pIdx] });
    }

    // ── RESET MATCH ───────────────────────────────────────────────
    if (route === 'resetMatch') {
      const { match_id, tournament_id } = body;
      if (match_id) {
        data.kill_events = data.kill_events.filter(k => k.match_id !== match_id);
        data.elimination_events = data.elimination_events.filter(e => e.match_id !== match_id);
        data.match_standings = data.match_standings.filter(s => s.match_id !== match_id);
        const mIdx = data.matches.findIndex(m => m.id === match_id);
        if (mIdx !== -1) data.matches[mIdx].state = 'pre_match';
      }
      if (tournament_id) {
        data.players = data.players.map(p => p.tournament_id === tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      }
      data.overlay_state.last_updated_at = new Date().toISOString();
      await writeDB(data);
      return ok({ success: true });
    }

    // ── UPDATE TOURNAMENT ─────────────────────────────────────────
    if (route === 'updateTournament') {
      const { tournament_id, ...updates } = body;
      const tIdx = data.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');
      data.tournaments[tIdx] = { ...data.tournaments[tIdx], ...updates };
      await writeDB(data);
      return ok({ success: true, tournament: data.tournaments[tIdx] });
    }

    return err(404, `Unknown route: ${route}`);
  } catch (e) {
    return err(500, e.message);
  }
};
