const { loadDb, saveDb, genId } = require('./_db');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function ok(data) { return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) }; }
function err(code, msg) { return { statusCode: code, headers: corsHeaders, body: JSON.stringify({ error: msg }) }; }

const DEFAULT_DESIGN = {
  accentColor:         '#FF6B00',
  accentColor2:        '#00D4FF',
  bgColor:             '#060915',
  textColor:           '#ffffff',
  tournamentName:      'BOOYAH CUP',
  tournamentSubtitle:  'GRAND FINALS',
  gameLabel:           'GAME',
  logoUrl:             '',
  overlayStyle:        'default',
  fontStyle:           'orbitron',
  // Casters array (used by CastersScreen and DesignStudio)
  casters: [
    { name: 'CASTER ONE',   role: 'SHOUTCASTER', handle: '@caster1' },
    { name: 'CASTER TWO',   role: 'ANALYST',     handle: '@caster2' },
    { name: 'CASTER THREE', role: 'HOST',         handle: '@caster3' },
  ],
  // Organiser / sponsor branding
  organizerName:       'GARENA',
  sponsorLogoUrl:      '',
};

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
    const db = await loadDb();
    if (!db.design) db.design = { ...DEFAULT_DESIGN };
    if (!db.tournaments) db.tournaments = [];
    if (!db.teams) db.teams = [];
    if (!db.players) db.players = [];
    if (!db.matches) db.matches = [];
    if (!db.match_standings) db.match_standings = [];
    if (!db.kill_events) db.kill_events = [];
    if (!db.elimination_events) db.elimination_events = [];
    if (!db.overlay_state) {
      db.overlay_state = {
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
      const tournament = db.tournaments.find(t => t.status === 'active') || db.tournaments[db.tournaments.length - 1] || null;
      if (!tournament) {
        return ok({
          tournament: null,
          overlay_state: db.overlay_state,
          design: db.design,
          teams: [],
          players: [],
          current_match: null,
          kill_feed: [],
          eliminations: [],
          standings: []
        });
      }
      const tid = tournament.id;
      const teams = db.teams.filter(t => t.tournament_id === tid).map(t => {
        // Compute total_tournament_points dynamically from match_standings and kills to ensure data integrity
        const standingsForTeam = db.match_standings.filter(s => s.tournament_id === tid && s.team_id === t.id);
        const placementPoints = standingsForTeam.reduce((sum, s) => sum + (s.placement_points_awarded || 0), 0);
        
        // Sum player kills for total tournament kills
        const teamPlayers = db.players.filter(p => p.team_id === t.id);
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
      const players = db.players.filter(p => p.tournament_id === tid).map(p => ({
        ...p,
        is_alive: p.is_alive !== undefined ? p.is_alive : true
      }));

      const matches = db.matches.filter(m => m.tournament_id === tid).sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
      const currentMatch = matches[0] || null;
      let killFeed = [], eliminations = [], standings = [];
      if (currentMatch) {
        killFeed = db.kill_events.filter(k => k.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15).map(k => ({ ...k, killed_name: k.killed_player_name || k.killed_name || 'Opponent' }));
        eliminations = db.elimination_events.filter(e => e.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
        standings = db.match_standings.filter(s => s.match_id === currentMatch.id);
      }
      return ok({ tournament, overlay_state: db.overlay_state, design: db.design, teams, players, current_match: currentMatch, kill_feed: killFeed, eliminations, standings });
    }

    // ── SAVE DESIGN ───────────────────────────────────────────────
    if (route === 'saveDesign') {
      db.design = { ...DEFAULT_DESIGN, ...db.design, ...body };
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true, design: db.design });
    }

    // ── GET DESIGN ────────────────────────────────────────────────
    if (route === 'getDesign') {
      return ok({ design: db.design || DEFAULT_DESIGN });
    }

    // ── INITIALIZE TOURNAMENT ─────────────────────────────────────
    if (route === 'initializeTournament') {
      const { name, total_matches, points_per_kill, placement_points_config } = body;
      if (!name || !total_matches) return err(400, 'name and total_matches required');
      const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
      const tournament = { id: genId(), name, total_matches: parseInt(total_matches), points_per_kill: points_per_kill || 1, placement_points_config: JSON.stringify(placement_points_config || defaultConfig), current_match_number: 0, status: 'setup', created_at: new Date().toISOString() };
      db.tournaments.push(tournament);
      db.overlay_state.tournament_id = tournament.id;
      db.overlay_state.current_screen = 'setup_blank';
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true, tournament });
    }

    // ── ADD TEAM ──────────────────────────────────────────────────
    if (route === 'addTeam') {
      const { tournament_id, team_name, player_names } = body;
      if (!tournament_id || !team_name) return err(400, 'tournament_id and team_name required');
      if (db.teams.filter(t => t.tournament_id === tournament_id).length >= 12) return err(400, 'Maximum 12 teams allowed');
      const team = { id: genId(), tournament_id, name: team_name, logo_url: body.logo_url || null, total_tournament_points: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
      db.teams.push(team);
      const createdPlayers = (player_names || []).filter(n => n?.trim()).slice(0, 4).map(name => {
        const p = { id: genId(), team_id: team.id, tournament_id, name: name.trim(), is_alive: true, current_match_kills: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
        db.players.push(p);
        return p;
      });
      await saveDb(db);
      return ok({ success: true, team, players: createdPlayers });
    }

    // ── ADD PLAYER ────────────────────────────────────────────────
    if (route === 'addPlayer') {
      const { team_id, name } = body;
      if (!team_id || !name) return err(400, 'team_id and name required');
      const team = db.teams.find(t => t.id === team_id);
      if (!team) return err(404, 'Team not found');
      const existing = db.players.filter(p => p.team_id === team_id);
      if (existing.length >= 6) return err(400, 'Max 6 players per team');
      const player = { id: genId(), team_id, tournament_id: team.tournament_id, name: name.trim(), is_alive: true, current_match_kills: 0, total_tournament_kills: 0, created_at: new Date().toISOString() };
      db.players.push(player);
      await saveDb(db);
      return ok({ success: true, player });
    }

    // ── START NEXT MATCH ──────────────────────────────────────────
    if (route === 'startNextMatch') {
      const { tournament_id, map_name } = body;
      if (!tournament_id) return err(400, 'tournament_id required');
      const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');
      const newMatchNumber = (db.tournaments[tIdx].current_match_number || 0) + 1;
      db.tournaments[tIdx].current_match_number = newMatchNumber;
      db.tournaments[tIdx].status = 'active';
      const match = { id: genId(), tournament_id, match_number: newMatchNumber, state: 'pre_match', map_name: map_name || 'Bermuda', started_at: new Date().toISOString(), ended_at: null };
      db.matches.push(match);
      db.players = db.players.map(p => p.tournament_id === tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      db.overlay_state.current_screen = 'pre_match_map';
      db.overlay_state.tournament_id = tournament_id;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true, match, match_number: newMatchNumber });
    }

    // ── UPDATE MATCH STATE ────────────────────────────────────────
    if (route === 'updateMatchState') {
      const { match_id, state } = body;
      if (!match_id || !state) return err(400, 'match_id and state required');
      const mIdx = db.matches.findIndex(m => m.id === match_id);
      if (mIdx === -1) return err(404, 'Match not found');
      db.matches[mIdx].state = state;
      if (state === 'ended') db.matches[mIdx].ended_at = new Date().toISOString();
      if (state === 'live') { db.overlay_state.current_screen = 'ff_scoreboard'; db.overlay_state.last_updated_at = new Date().toISOString(); }
      await saveDb(db);
      return ok({ success: true });
    }

    // ── ADD KILL ──────────────────────────────────────────────────
    if (route === 'addKill') {
      const { player_id, match_id, killed_player_name, killed_team_name } = body;
      if (!player_id || !match_id) return err(400, 'player_id and match_id required');
      const pIdx = db.players.findIndex(p => p.id === player_id);
      if (pIdx === -1) return err(404, 'Player not found');
      const player = db.players[pIdx];
      const tIdx = db.teams.findIndex(t => t.id === player.team_id);
      if (tIdx === -1) return err(404, 'Team not found');
      const tournament = db.tournaments.find(t => t.id === player.tournament_id);
      const pointsPerKill = tournament?.points_per_kill || 1;
      db.players[pIdx].current_match_kills = (player.current_match_kills || 0) + 1;
      db.players[pIdx].total_tournament_kills = (player.total_tournament_kills || 0) + 1;
      db.teams[tIdx].total_tournament_kills = (db.teams[tIdx].total_tournament_kills || 0) + 1;
      db.teams[tIdx].total_tournament_points = (db.teams[tIdx].total_tournament_points || 0) + pointsPerKill;
      const killEvent = { id: genId(), match_id, tournament_id: player.tournament_id, killer_player_id: player_id, killer_name: player.name, killer_team_name: db.teams[tIdx].name, killed_player_name: killed_player_name || 'Unknown', killed_team_name: killed_team_name || 'Unknown', timestamp: new Date().toISOString() };
      db.kill_events.push(killEvent);
      const sIdx = db.match_standings.findIndex(s => s.match_id === match_id && s.team_id === db.teams[tIdx].id);
      if (sIdx !== -1) { db.match_standings[sIdx].team_kills_this_match = (db.match_standings[sIdx].team_kills_this_match || 0) + 1; db.match_standings[sIdx].total_match_points = (db.match_standings[sIdx].total_match_points || 0) + pointsPerKill; }
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true, player: { id: player_id, name: player.name, current_match_kills: db.players[pIdx].current_match_kills, total_tournament_kills: db.players[pIdx].total_tournament_kills }, team: { id: db.teams[tIdx].id, name: db.teams[tIdx].name }, kill_event: killEvent });
    }

    // ── ELIMINATE PLAYER ──────────────────────────────────────────
    if (route === 'eliminatePlayer') {
      const { player_id, match_id } = body;
      if (!player_id || !match_id) return err(400, 'player_id and match_id required');
      const pIdx = db.players.findIndex(p => p.id === player_id);
      if (pIdx === -1) return err(404, 'Player not found');
      const player = db.players[pIdx];
      const team = db.teams.find(t => t.id === player.team_id);
      db.players[pIdx].is_alive = false;
      const elimEvent = { id: genId(), match_id, tournament_id: player.tournament_id, eliminated_player_id: player_id, eliminated_player_name: player.name, eliminated_team_name: team?.name || 'Unknown', timestamp: new Date().toISOString() };
      db.elimination_events.push(elimEvent);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true, player: { id: player_id, name: player.name, team: team?.name }, elimination_event: elimEvent });
    }

    // ── SET TEAM PLACEMENT ────────────────────────────────────────
    if (route === 'setTeamPlacement') {
      const { team_id, match_id, placement, tournament_id } = body;
      if (!team_id || !match_id || placement === undefined) return err(400, 'team_id, match_id, placement required');
      const duplicate = db.match_standings.find(s => s.match_id === match_id && s.placement === placement && s.team_id !== team_id);
      if (duplicate) return err(400, `Placement ${placement} already assigned to ${duplicate.team_name}`);
      const tournament = db.tournaments.find(t => t.id === tournament_id) || db.tournaments.find(t => t.status === 'active');
      const defaultConfig = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };
      let config = defaultConfig;
      if (tournament?.placement_points_config) { try { config = { ...defaultConfig, ...JSON.parse(tournament.placement_points_config) }; } catch {} }
      const placementPoints = config[String(placement)] || 0;
      const team = db.teams.find(t => t.id === team_id);
      if (!team) return err(404, 'Team not found');
      const teamKills = db.kill_events.filter(k => k.match_id === match_id && k.killer_team_name === team.name).length;
      const pointsPerKill = tournament?.points_per_kill || 1;
      const killPoints = teamKills * pointsPerKill;
      const sIdx = db.match_standings.findIndex(s => s.match_id === match_id && s.team_id === team_id);
      const tIdx = db.teams.findIndex(t => t.id === team_id);
      if (sIdx !== -1) {
        const oldPts = db.match_standings[sIdx].placement_points_awarded || 0;
        db.teams[tIdx].total_tournament_points = Math.max(0, (db.teams[tIdx].total_tournament_points || 0) - oldPts + placementPoints);
        db.match_standings[sIdx] = { ...db.match_standings[sIdx], placement, placement_points_awarded: placementPoints, team_kills_this_match: teamKills, total_match_points: placementPoints + killPoints };
      } else {
        db.match_standings.push({ id: genId(), match_id, tournament_id: tournament?.id || tournament_id, team_id, team_name: team.name, placement, placement_points_awarded: placementPoints, team_kills_this_match: teamKills, total_match_points: placementPoints + killPoints });
        db.teams[tIdx].total_tournament_points = (db.teams[tIdx].total_tournament_points || 0) + placementPoints;
      }
      await saveDb(db);
      return ok({ success: true, team: team.name, placement, placement_points: placementPoints, kill_points: killPoints });
    }

    // ── CALCULATE MVP ─────────────────────────────────────────────
    if (route === 'calculateMVP') {
      const match_id = body.match_id || event.queryStringParameters?.match_id;
      if (!match_id) return err(400, 'match_id required');
      const killMap = {};
      for (const evt of db.kill_events.filter(k => k.match_id === match_id)) {
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
      db.overlay_state = { ...db.overlay_state, current_screen: 'mvp', mvp_player_id: player_id || '', mvp_player_name: player_name || '', mvp_team_name: team_name || '', mvp_kills: kills || 0, last_updated_at: new Date().toISOString() };
      await saveDb(db);
      return ok({ success: true });
    }

    // ── SET CHAMPION AND SHOW SCREEN ──────────────────────────────
    if (route === 'setChampionAndShowScreen') {
      const { team_id, team_name, total_points } = body;
      db.overlay_state = { ...db.overlay_state, current_screen: 'champions', champion_team_id: team_id || '', champion_team_name: team_name || '', champion_total_points: total_points || 0, last_updated_at: new Date().toISOString() };
      await saveDb(db);
      return ok({ success: true });
    }

    // ── SWITCH OVERLAY SCREEN ─────────────────────────────────────
    if (route === 'switchOverlayScreen') {
      const { screen } = body;
      if (!screen) return err(400, 'screen required');
      db.overlay_state.current_screen = screen;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true });
    }

    // ── DECLARE CHAMPIONS ─────────────────────────────────────────
    if (route === 'declareChampions') {
      const { tournament_id } = body;
      if (!tournament_id) return err(400, 'tournament_id required');
      const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx !== -1) db.tournaments[tIdx].status = 'completed';
      const teams = db.teams.filter(t => t.tournament_id === tournament_id).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
      await saveDb(db);
      return ok({ success: true, rankings: teams.map((t, i) => ({ rank: i + 1, team: t.name, total_points: t.total_tournament_points, total_kills: t.total_tournament_kills })) });
    }

    // ── DELETE TEAM ───────────────────────────────────────────────
    if (route === 'deleteTeam') {
      const { team_id } = body;
      if (!team_id) return err(400, 'team_id required');
      db.teams = db.teams.filter(t => t.id !== team_id);
      db.players = db.players.filter(p => p.team_id !== team_id);
      db.match_standings = db.match_standings.filter(s => s.team_id !== team_id);
      await saveDb(db);
      return ok({ success: true });
    }

    // ── REVIVE PLAYER ─────────────────────────────────────────────
    if (route === 'revivePlayer') {
      const { player_id } = body;
      if (!player_id) return err(400, 'player_id required');
      const pIdx = db.players.findIndex(p => p.id === player_id);
      if (pIdx === -1) return err(404, 'Player not found');
      db.players[pIdx].is_alive = true;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true, player: db.players[pIdx] });
    }

    // ── RESET MATCH ───────────────────────────────────────────────
    if (route === 'resetMatch') {
      const { match_id, tournament_id } = body;
      if (match_id) {
        db.kill_events = db.kill_events.filter(k => k.match_id !== match_id);
        db.elimination_events = db.elimination_events.filter(e => e.match_id !== match_id);
        db.match_standings = db.match_standings.filter(s => s.match_id !== match_id);
        const mIdx = db.matches.findIndex(m => m.id === match_id);
        if (mIdx !== -1) db.matches[mIdx].state = 'pre_match';
      }
      if (tournament_id) {
        db.players = db.players.map(p => p.tournament_id === tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      }
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(db);
      return ok({ success: true });
    }

    // ── UPDATE TOURNAMENT ─────────────────────────────────────────
    if (route === 'updateTournament') {
      const { tournament_id, ...updates } = body;
      const tIdx = db.tournaments.findIndex(t => t.id === tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');
      db.tournaments[tIdx] = { ...db.tournaments[tIdx], ...updates };
      await saveDb(db);
      return ok({ success: true, tournament: db.tournaments[tIdx] });
    }


    // ── RESET DATABASE ─────────────────────────────────────────────
    if (route === 'resetDatabase') {
      const fresh = {
        tournaments: [], teams: [], players: [], matches: [],
        match_standings: [], kill_events: [], elimination_events: [],
        overlay_state: {
          id: 'singleton', tournament_id: null, current_screen: 'setup_blank',
          mvp_player_id: null, mvp_player_name: null, mvp_team_name: null, mvp_kills: 0,
          champion_team_id: null, champion_team_name: null, champion_total_points: 0,
          last_updated_at: new Date().toISOString(),
        },
      };
      await saveDb(fresh);
      return ok({ success: true, message: 'Database reset successfully' });
    }

    // ── GOOGLE SHEETS IMPORT ────────────────────────────────────────
    if (route === 'importFromSheet') {
      const { sheet_url, tournament_id } = body;
      if (!sheet_url) return err(400, 'sheet_url is required');
      const match = sheet_url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return err(400, 'Invalid Google Sheets URL');
      const sheetId = match[1];

      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey  = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!clientEmail || !privateKey) return err(500, 'Google Sheets credentials not configured. Add GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY to Netlify env vars.');

      try {
        // Pure-fetch Google Sheets access via service account JWT (no googleapis SDK)
        const crypto = require('crypto');
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const jwtPayload = Buffer.from(JSON.stringify({
          iss: clientEmail, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
          aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
        })).toString('base64url');
        const toSign = `${jwtHeader}.${jwtPayload}`;
        const signature = crypto.createSign('RSA-SHA256').update(toSign).sign(privateKey, 'base64url');
        const jwt = `${toSign}.${signature}`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
        });
        const { access_token } = await tokenRes.json();
        if (!access_token) return err(500, 'Failed to get Google access token');

        async function getSheetRange(range) {
          const r = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          return r.ok ? (await r.json()).values || [] : [];
        }

        let teamsData = [], playersData = [];
        try {
          const rows = await getSheetRange('Teams!A:C');
          teamsData = rows.slice(1).filter(row => row[0]).map(row => ({
            team_name: row[0]?.trim(), logo_url: row[1]?.trim() || '', color: row[2]?.trim() || '',
          }));
        } catch (_) {}
        try {
          const rows = await getSheetRange('Players!A:C');
          playersData = rows.slice(1).filter(row => row[0] && row[1]).map(row => ({
            player_name: row[0]?.trim(), team_name: row[1]?.trim(), role: row[2]?.trim() || 'Player',
          }));
        } catch (_) {}

        let teamsAdded = 0, playersAdded = 0;
        for (const t of teamsData) {
          if (!t.team_name) continue;
          const exists = db.teams.find(x => x.name?.toLowerCase() === t.team_name.toLowerCase());
          if (!exists) {
            db.teams.push({
              id: genId(), tournament_id: tournament_id || db.tournaments[0]?.id,
              name: t.team_name, logo_url: t.logo_url, color: t.color,
              total_tournament_points: 0, total_tournament_kills: 0,
            });
            teamsAdded++;
          }
        }
        for (const p of playersData) {
          const team = db.teams.find(t => t.name?.toLowerCase() === p.team_name.toLowerCase());
          if (!team) continue;
          const exists = db.players.find(x => x.name === p.player_name && x.team_id === team.id);
          if (!exists) {
            db.players.push({
              id: genId(), team_id: team.id, tournament_id: tournament_id || db.tournaments[0]?.id,
              name: p.player_name, role: p.role, is_alive: true,
              total_tournament_kills: 0, current_match_kills: 0,
            });
            playersAdded++;
          }
        }
        await saveDb(db);
        return ok({ success: true, teams_added: teamsAdded, players_added: playersAdded, message: `Imported ${teamsAdded} teams and ${playersAdded} players` });
      } catch (e) {
        return err(500, `Sheet import failed: ${e.message}`);
      }
    }

    return err(404, `Unknown route: ${route}`);
  } catch (e) {
    return err(500, e.message);
  }
};
