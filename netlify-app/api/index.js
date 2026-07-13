const { loadDb, saveDb, genId, getDefaultDb } = require('./_db');
const { verifyToken } = require('./_auth');
const { rateLimit } = require('./_ratelimit');
const { sanitizeString, requireFields } = require('./_validate');

const DEFAULT_DESIGN = {
  accentColor: '#FF6B00', accentColor2: '#00D4FF', bgColor: '#060915',
  textColor: '#ffffff', tournamentName: 'BOOYAH CUP', tournamentSubtitle: 'GRAND FINALS',
  gameLabel: 'GAME', logoUrl: '', overlayStyle: 'default', fontStyle: 'orbitron',
  casters: [
    { name: 'CASTER ONE', role: 'SHOUTCASTER', handle: '@caster1', photo: '' },
    { name: 'CASTER TWO', role: 'ANALYST',     handle: '@caster2', photo: '' },
    { name: 'CASTER THREE', role: 'HOST',       handle: '@caster3', photo: '' },
  ],
  organizerName: 'GARENA', sponsorLogoUrl: '',
};

module.exports = async (req, res) => {
  // GLOBAL_CATCH — ensures every error returns JSON, never crashes the function cold
  try {
  // CORS Configuration
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const CORS = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate Limiting
  const ip = req.headers['x-nf-client-connection-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Parse Route and Query
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const route = urlObj.pathname.replace(/^\/api\/?/, '').split('/')[0];
  const query = Object.fromEntries(urlObj.searchParams.entries());
  const body = req.body || {};

  const ok  = (data) => res.status(200).json(data);
  const err = (code, msg) => res.status(code).json({ error: msg });

  // 1. PUBLIC ROUTE: getOverlayData
  if (route === 'getOverlayData') {
    const tokenParam = query.token || query.shareToken;
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    let uid = null;

    if (authHeader.startsWith('Bearer ')) {
      const authUser = await verifyToken(authHeader);
      if (authUser) uid = authUser.uid;
    }

    // Fallback: If no Bearer token, we authenticate overlay view via shareToken
    if (!uid && tokenParam) {
      // Direct query fallback for dev / OBS sources with authenticated URLs
      if (query.uid) {
        uid = query.uid;
      } else if (process.env.VITE_DEV_MODE || process.env.DEV_UID) {
        uid = process.env.DEV_UID || 'dev_fallback_uid';
      }

      if (!uid) {
        // Find which user owns this shareToken
        // We look it up under /booyah_admin/share_tokens/{token}
        const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
        const secret = process.env.FIREBASE_DATABASE_SECRET;
        if (dbBaseUrl && secret) {
          try {
            // Encode token param in case of unusual characters
            const encodedToken = encodeURIComponent(tokenParam);
            const rToken = await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${encodedToken}.json?auth=${secret}`);
            if (rToken.ok) {
              uid = await rToken.json(); // returns the uid string
            }

            // Option B: scan users node fallback if direct mapping lookup missed
            if (!uid) {
              try {
                const usersR = await fetch(`${dbBaseUrl}/booyah_admin/users.json?auth=${secret}&shallow=true`);
                if (usersR.ok) {
                  const usersObj = await usersR.json();
                  if (usersObj) {
                    for (const testUid of Object.keys(usersObj)) {
                      const stR = await fetch(`${dbBaseUrl}/booyah_admin/users/${testUid}/shareToken.json?auth=${secret}`);
                      if (stR.ok) {
                        const st = await stR.json();
                        if (st === tokenParam) {
                          uid = testUid;
                          break;
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                console.error('[getOverlayData] fallback scan error:', e.message);
              }
            }
          } catch (e) {
            console.error('[getOverlayData] Token fetch error:', e.message);
          }
        }
      }
    } else if (!uid && query.uid) {
      // Direct ?uid= fallback even without token parameter
      uid = query.uid;
    }

    if (!uid) {
      return ok({
        tournament: null,
        overlay_state: { 
          id: 'singleton', 
          tournament_id: null, 
          current_screen: 'setup_blank', 
          error: 'Invalid or missing share token',
          last_updated_at: new Date().toISOString() 
        },
        design: DEFAULT_DESIGN,
        teams: [],
        players: [],
        current_match: null,
        kill_feed: [],
        eliminations: [],
        standings: []
      });
    }

    try {
      const db = await loadDb(uid);
      const tournament = db.tournaments.find(t => t.status === 'active') || db.tournaments[db.tournaments.length - 1] || null;
      if (!tournament) return ok({ tournament: null, overlay_state: db.overlay_state, design: db.design, teams: [], players: [], current_match: null, kill_feed: [], eliminations: [], standings: [] });
      const tid = tournament.id;
      const teams = db.teams.filter(t => t.tournament_id === tid).map(t => {
        const standingsForTeam = db.match_standings.filter(s => s.tournament_id === tid && s.team_id === t.id);
        const placementPoints  = standingsForTeam.reduce((sum, s) => sum + (s.placement_points_awarded || 0), 0);
        const teamPlayers      = db.players.filter(p => p.team_id === t.id);
        const totalKills       = teamPlayers.reduce((sum, p) => sum + (p.total_tournament_kills || 0), 0);
        const totalPoints      = placementPoints + (totalKills * (tournament.points_per_kill || 1));
        return { ...t, total_tournament_kills: totalKills, total_tournament_points: totalPoints };
      }).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
      const players = db.players.filter(p => p.tournament_id === tid).map(p => ({ ...p, is_alive: p.is_alive !== undefined ? p.is_alive : true }));
      const matches = db.matches.filter(m => m.tournament_id === tid).sort((a, b) => (b.match_number || 0) - (a.match_number || 0));
      const currentMatch = matches[0] || null;
      let killFeed = [], eliminations = [], standings = [];
      if (currentMatch) {
        killFeed     = db.kill_events.filter(k => k.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15).map(k => ({ ...k, killed_name: k.killed_player_name || k.killed_name || 'Opponent' }));
        eliminations = db.elimination_events.filter(e => e.match_id === currentMatch.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
        standings    = db.match_standings.filter(s => s.match_id === currentMatch.id);
      }
      return ok({ tournament, overlay_state: db.overlay_state, design: db.design, teams, players, current_match: currentMatch, kill_feed: killFeed, eliminations, standings });
    } catch (e) {
      return err(500, 'Database load error');
    }
  }

  // 2. PUBLIC ROUTE: registerUser (Firebase signup callback)
  if (route === 'registerUser') {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const user = await verifyToken(authHeader);
    if (!user) return err(401, 'Invalid or expired authentication token');

    try {
      // Just initialize database default structure
      const db = await loadDb(user.uid);
      await saveDb(user.uid, db);
      return ok({ success: true, uid: user.uid, email: user.email });
    } catch (e) {
      return err(500, 'Failed to register user database');
    }
  }

  // ─── AUTHENTICATION REQUIRED FOR ALL OTHER ROUTES ───
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const user = await verifyToken(authHeader);
  if (!user) return err(401, 'Unauthorized: Valid Bearer token required');

  const { uid, isOwner } = user;

  try {
    const db = await loadDb(uid);
    if (!db.design)              db.design = { ...DEFAULT_DESIGN };
    if (!db.tournaments)         db.tournaments = [];
    if (!db.teams)               db.teams = [];
    if (!db.players)             db.players = [];
    if (!db.matches)             db.matches = [];
    if (!db.match_standings)     db.match_standings = [];
    if (!db.kill_events)         db.kill_events = [];
    if (!db.elimination_events)  db.elimination_events = [];
    if (!db.overlay_state) {
      db.overlay_state = {
        id: 'singleton', tournament_id: null, current_screen: 'setup_blank',
        mvp_player_id: null, mvp_player_name: null, mvp_team_name: null, mvp_kills: 0,
        champion_team_id: null, champion_team_name: null, champion_total_points: 0,
        last_updated_at: new Date().toISOString(),
      };
    }

    // ── CHECK SUBSCRIPTION ───────────────────────────────────────────────
    if (route === 'checkSubscription') {
      if (isOwner) {
        return ok({ uid, subscription: { plan: 'yearly', status: 'active', expiresAt: Date.now() + 315360000000 } });
      }
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (secret && dbBaseUrl) {
        try {
          const subR = await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}.json?auth=${secret}`);
          const subData = subR.ok ? await subR.json() : null;
          return ok({ uid, subscription: subData?.subscription || null });
        } catch {
          return ok({ uid, subscription: null });
        }
      }
      return ok({ uid, subscription: null });
    }

    // ── GET SHARE TOKEN ──────────────────────────────────────────────────
    if (route === 'getShareToken') {
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (!secret || !dbBaseUrl) return err(500, 'Database credentials missing');

      try {
        // Read current shareToken for this user
        const r = await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`);
        let token = r.ok ? await r.json() : null;
        if (!token) {
          // Generate new token
          token = genId() + genId();
          // Write mapping token -> uid
          await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${token}.json?auth=${secret}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uid)
          });
          // Write user -> token
          await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token)
          });
        }
        return ok({ shareToken: token });
      } catch (e) {
        return err(500, 'Failed to fetch or generate share token');
      }
    }

    // ── SAVE / GET DESIGN ────────────────────────────────────────────────
    if (route === 'saveDesign') {
      const sanitizedCasters = (body.casters || []).map(c => ({
        name: sanitizeString(c.name, 40),
        role: sanitizeString(c.role, 40),
        handle: sanitizeString(c.handle, 40),
        photo: sanitizeString(c.photo || '', 300)
      }));

      db.design = {
        ...DEFAULT_DESIGN,
        ...db.design,
        ...body,
        accentColor: sanitizeString(body.accentColor, 20),
        accentColor2: sanitizeString(body.accentColor2, 20),
        bgColor: sanitizeString(body.bgColor, 20),
        textColor: sanitizeString(body.textColor, 20),
        tournamentName: sanitizeString(body.tournamentName, 100),
        tournamentSubtitle: sanitizeString(body.tournamentSubtitle, 100),
        gameLabel: sanitizeString(body.gameLabel, 40),
        logoUrl: sanitizeString(body.logoUrl, 300),
        overlayStyle: sanitizeString(body.overlayStyle, 40),
        fontStyle: sanitizeString(body.fontStyle, 40),
        casters: sanitizedCasters,
        organizerName: sanitizeString(body.organizerName, 100),
        sponsorLogoUrl: sanitizeString(body.sponsorLogoUrl, 300)
      };

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, design: db.design });
    }

    if (route === 'getDesign') return ok({ design: db.design || DEFAULT_DESIGN });

    // ── INITIALIZE TOURNAMENT ─────────────────────────────────────────────
    if (route === 'initializeTournament') {
      const missing = requireFields(body, ['name', 'total_matches']);
      if (missing) return err(400, missing);

      const name = sanitizeString(body.name, 100);
      const total_matches = parseInt(body.total_matches);
      const points_per_kill = parseInt(body.points_per_kill) || 1;
      const defaultConfig = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };

      // Ensure shareToken exists on first init
      const dbBaseUrl = (process.env.FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
      const secret = process.env.FIREBASE_DATABASE_SECRET;
      if (secret && dbBaseUrl) {
        try {
          const r = await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`);
          let token = r.ok ? await r.json() : null;
          if (!token) {
            token = genId() + genId();
            await fetch(`${dbBaseUrl}/booyah_admin/share_tokens/${token}.json?auth=${secret}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uid)
            });
            await fetch(`${dbBaseUrl}/booyah_admin/users/${uid}/shareToken.json?auth=${secret}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token)
            });
          }
        } catch (_) {}
      }

      // Any previously active tournament gets status set to 'completed'
      db.tournaments = db.tournaments.map(t => {
        if (t.status === 'active') {
          return { ...t, status: 'completed' };
        }
        return t;
      });

      const tournament = {
        id: genId(),
        name,
        total_matches,
        points_per_kill,
        placement_points_config: JSON.stringify(body.placement_points_config || defaultConfig),
        current_match_number: 0,
        status: 'active',
        created_at: new Date().toISOString()
      };

      db.tournaments.push(tournament);
      db.overlay_state.tournament_id = tournament.id;
      db.overlay_state.current_screen = 'setup_blank';
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, tournament });
    }

    // ── LIST TOURNAMENTS ──────────────────────────────────────────────────
    if (route === 'listTournaments') {
      const enriched = db.tournaments.map(t => {
        const tid = t.id;
        const tournamentTeams = db.teams.filter(team => team.tournament_id === tid);
        const tournamentMatches = db.matches.filter(m => m.tournament_id === tid);
        
        // Calculate standings
        const teamsWithPoints = tournamentTeams.map(team => {
          const standingsForTeam = db.match_standings.filter(s => s.tournament_id === tid && s.team_id === team.id);
          const placementPoints  = standingsForTeam.reduce((sum, s) => sum + (s.placement_points_awarded || 0), 0);
          const teamPlayers      = db.players.filter(p => p.team_id === team.id);
          const totalKills       = teamPlayers.reduce((sum, p) => sum + (p.total_tournament_kills || 0), 0);
          const totalPoints      = placementPoints + (totalKills * (t.points_per_kill || 1));
          return {
            id: team.id,
            name: team.name,
            total_points: totalPoints
          };
        }).sort((a, b) => b.total_points - a.total_points);

        return {
          ...t,
          team_count: tournamentTeams.length,
          match_count: tournamentMatches.length,
          standings: teamsWithPoints.slice(0, 3) // Top 3 teams
        };
      });

      const sorted = enriched.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return ok({ tournaments: sorted });
    }

    // ── SWITCH TOURNAMENT ─────────────────────────────────────────────────
    if (route === 'switchTournament') {
      const { tournament_id } = body;
      if (!tournament_id) return err(400, 'tournament_id is required');

      const exists = db.tournaments.some(t => t.id === tournament_id);
      if (!exists) return err(404, 'Tournament not found');

      db.tournaments = db.tournaments.map(t => ({
        ...t,
        status: t.id === tournament_id ? 'active' : 'completed'
      }));

      db.overlay_state.tournament_id = tournament_id;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── DELETE TOURNAMENT ─────────────────────────────────────────────────
    if (route === 'deleteTournament') {
      // Any authenticated user can delete their own tournaments (data is UID-scoped)
      const { tournament_id } = body;
      if (!tournament_id) return err(400, 'tournament_id is required');

      const target = db.tournaments.find(t => t.id === tournament_id);
      if (!target) return err(404, 'Tournament not found');

      const wasActive = target.status === 'active';

      // Remove the tournament
      db.tournaments = db.tournaments.filter(t => t.id !== tournament_id);

      // If it was active, sets the most recent other tournament as active
      if (wasActive && db.tournaments.length > 0) {
        const remainingSorted = [...db.tournaments].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const mostRecent = remainingSorted[0];
        db.tournaments = db.tournaments.map(t => ({
          ...t,
          status: t.id === mostRecent.id ? 'active' : 'completed'
        }));
        db.overlay_state.tournament_id = mostRecent.id;
      } else if (db.tournaments.length === 0) {
        db.overlay_state.tournament_id = null;
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, deleted_id: tournament_id });
    }

    // ── ADD TEAM ──────────────────────────────────────────────────────────
    if (route === 'addTeam') {
      const missing = requireFields(body, ['tournament_id', 'team_name']);
      if (missing) return err(400, missing);

      if (db.teams.filter(t => t.tournament_id === body.tournament_id).length >= 12) {
        return err(400, 'Maximum 12 teams allowed');
      }

      const team = {
        id: genId(),
        tournament_id: sanitizeString(body.tournament_id),
        name: sanitizeString(body.team_name, 100),
        logo_url: body.logo_url ? sanitizeString(body.logo_url, 300) : null,
        total_tournament_points: 0,
        total_tournament_kills: 0,
        created_at: new Date().toISOString()
      };

      db.teams.push(team);

      const createdPlayers = (body.player_names || []).filter(n => n?.trim()).slice(0, 4).map(name => {
        const p = {
          id: genId(),
          team_id: team.id,
          tournament_id: team.tournament_id,
          name: sanitizeString(name, 100),
          is_alive: true,
          current_match_kills: 0,
          total_tournament_kills: 0,
          created_at: new Date().toISOString()
        };
        db.players.push(p);
        return p;
      });

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, team, players: createdPlayers });
    }

    // ── ADD PLAYER ────────────────────────────────────────────────────────
    if (route === 'addPlayer') {
      const missing = requireFields(body, ['team_id', 'name']);
      if (missing) return err(400, missing);

      const team = db.teams.find(t => t.id === body.team_id);
      if (!team) return err(404, 'Team not found');

      if (db.players.filter(p => p.team_id === team.id).length >= 6) {
        return err(400, 'Max 6 players per team');
      }

      const player = {
        id: genId(),
        team_id: team.id,
        tournament_id: team.tournament_id,
        name: sanitizeString(body.name, 100),
        is_alive: true,
        current_match_kills: 0,
        total_tournament_kills: 0,
        created_at: new Date().toISOString()
      };

      db.players.push(player);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, player });
    }

    // ── START NEXT MATCH ──────────────────────────────────────────────────
    if (route === 'startNextMatch') {
      const missing = requireFields(body, ['tournament_id']);
      if (missing) return err(400, missing);

      const tIdx = db.tournaments.findIndex(t => t.id === body.tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');

      const newMatchNumber = (db.tournaments[tIdx].current_match_number || 0) + 1;
      db.tournaments[tIdx].current_match_number = newMatchNumber;
      db.tournaments[tIdx].status = 'active';

      const match = {
        id: genId(),
        tournament_id: db.tournaments[tIdx].id,
        match_number: newMatchNumber,
        state: 'pre_match',
        map_name: sanitizeString(body.map_name, 50) || 'Bermuda',
        started_at: new Date().toISOString(),
        ended_at: null
      };

      db.matches.push(match);
      db.players = db.players.map(p => p.tournament_id === match.tournament_id ? { ...p, is_alive: true, current_match_kills: 0 } : p);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, match, match_number: newMatchNumber });
    }

    // ── UPDATE MATCH STATE ────────────────────────────────────────────────
    if (route === 'updateMatchState') {
      const missing = requireFields(body, ['match_id', 'state']);
      if (missing) return err(400, missing);

      const mIdx = db.matches.findIndex(m => m.id === body.match_id);
      if (mIdx === -1) return err(404, 'Match not found');

      db.matches[mIdx].state = sanitizeString(body.state, 30);
      if (db.matches[mIdx].state === 'ended') {
        db.matches[mIdx].ended_at = new Date().toISOString();
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, match: db.matches[mIdx] });
    }

    // ── ADD KILL ──────────────────────────────────────────────────────────
    if (route === 'addKill') {
      const missing = requireFields(body, ['match_id', 'killer_player_id']);
      if (missing) return err(400, missing);

      const kill = {
        id: genId(),
        match_id: sanitizeString(body.match_id),
        tournament_id: sanitizeString(body.tournament_id || ''),
        killer_player_id: sanitizeString(body.killer_player_id),
        killer_name: sanitizeString(body.killer_name, 100) || 'Unknown',
        killer_team_name: sanitizeString(body.killer_team_name, 100) || '',
        killed_player_name: sanitizeString(body.killed_player_name, 100) || 'Opponent',
        killed_team_name: sanitizeString(body.killed_team_name, 100) || '',
        timestamp: new Date().toISOString()
      };

      db.kill_events.push(kill);
      const pIdx = db.players.findIndex(p => p.id === kill.killer_player_id);
      if (pIdx !== -1) {
        db.players[pIdx].current_match_kills = (db.players[pIdx].current_match_kills || 0) + 1;
        db.players[pIdx].total_tournament_kills = (db.players[pIdx].total_tournament_kills || 0) + 1;
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, kill });
    }

    // ── ELIMINATE PLAYER ──────────────────────────────────────────────────
    if (route === 'eliminatePlayer') {
      const missing = requireFields(body, ['match_id', 'player_id']);
      if (missing) return err(400, missing);

      const elim = {
        id: genId(),
        match_id: sanitizeString(body.match_id),
        tournament_id: sanitizeString(body.tournament_id || ''),
        eliminated_player_id: sanitizeString(body.player_id),
        eliminated_player_name: sanitizeString(body.player_name, 100) || 'Unknown',
        eliminated_team_name: sanitizeString(body.team_name, 100) || '',
        timestamp: new Date().toISOString()
      };

      db.elimination_events.push(elim);
      const pIdx = db.players.findIndex(p => p.id === elim.eliminated_player_id);
      if (pIdx !== -1) db.players[pIdx].is_alive = false;

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, elimination: elim });
    }

    // ── SET TEAM PLACEMENT ────────────────────────────────────────────────
    if (route === 'setTeamPlacement') {
      const missing = requireFields(body, ['match_id', 'team_id', 'placement']);
      if (missing) return err(400, missing);

      const tournament = db.tournaments.find(t => t.id === body.tournament_id);
      let config = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };
      try {
        if (tournament?.placement_points_config) config = JSON.parse(tournament.placement_points_config);
        if (body.placement_points_config) config = body.placement_points_config;
      } catch (_) {}

      const placement = parseInt(body.placement);
      const placementPts = config[placement] || 0;
      const teamPlayers = db.players.filter(p => p.team_id === body.team_id);
      const teamKills   = teamPlayers.reduce((sum, p) => sum + (p.current_match_kills || 0), 0);
      const totalMatchPoints = placementPts + (teamKills * (tournament?.points_per_kill || 1));

      const existing = db.match_standings.findIndex(s => s.match_id === body.match_id && s.team_id === body.team_id);
      const standing = {
        id: existing !== -1 ? db.match_standings[existing].id : genId(),
        match_id: sanitizeString(body.match_id),
        tournament_id: sanitizeString(body.tournament_id || ''),
        team_id: sanitizeString(body.team_id),
        team_name: sanitizeString(body.team_name, 100) || '',
        placement,
        placement_points_awarded: placementPts,
        team_kills_this_match: teamKills,
        total_match_points: totalMatchPoints
      };

      if (existing !== -1) db.match_standings[existing] = standing;
      else db.match_standings.push(standing);

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, standing });
    }

    // ── CALCULATE MVP ─────────────────────────────────────────────────────
    if (route === 'calculateMVP') {
      const missing = requireFields(body, ['match_id']);
      if (missing) return err(400, missing);

      const killMap = {};
      for (const evt of db.kill_events.filter(k => k.match_id === body.match_id)) {
        if (!killMap[evt.killer_player_id]) {
          killMap[evt.killer_player_id] = { name: evt.killer_name, team: evt.killer_team_name, kills: 0, player_id: evt.killer_player_id };
        }
        killMap[evt.killer_player_id].kills++;
      }
      const sorted = Object.values(killMap).sort((a, b) => b.kills - a.kills);
      if (!sorted.length) return ok({ mvp: null, tied: false, message: 'No kills recorded' });
      const maxKills = sorted[0].kills;
      const top = sorted.filter(p => p.kills === maxKills);
      return ok({ mvp: top[0], tied: top.length > 1, tied_players: top, max_kills: maxKills });
    }


    // ── SWITCH OVERLAY SCREEN ──────────────────────────────────────────────
    if (route === 'switchOverlayScreen') {
      const missing = requireFields(body, ['screen']);
      if (missing) return err(400, missing);
      const screen = sanitizeString(body.screen, 50);
      if (!screen) return err(400, 'screen is required');
      if (!/^[a-z0-9_-]+$/.test(screen)) return err(400, 'Invalid screen name');
      db.overlay_state.current_screen = screen;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, current_screen: screen });
    }

    // ── SET MVP AND SHOW SCREEN ───────────────────────────────────────────
    if (route === 'setMVPAndShowScreen') {
      const mvpMissing = requireFields(body, ['player_id', 'player_name', 'team_name']);
      if (mvpMissing) return err(400, mvpMissing);
      const playerExists = db.players.some(p => p.id === body.player_id);
      if (!playerExists) return err(404, 'Player not found — calculate MVP first');
      db.overlay_state = {
        ...db.overlay_state,
        current_screen: 'mvp',
        mvp_player_id: sanitizeString(body.player_id),
        mvp_player_name: sanitizeString(body.player_name, 100),
        mvp_team_name: sanitizeString(body.team_name, 100),
        mvp_kills: parseInt(body.kills) || 0,
        last_updated_at: new Date().toISOString()
      };
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── SET CHAMPION AND SHOW SCREEN ──────────────────────────────────────
    if (route === 'setChampionAndShowScreen') {
      db.overlay_state = {
        ...db.overlay_state,
        current_screen: 'champions',
        champion_team_id: sanitizeString(body.team_id),
        champion_team_name: sanitizeString(body.team_name, 100) || '',
        champion_total_points: parseInt(body.total_points) || 0,
        last_updated_at: new Date().toISOString()
      };
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── DECLARE CHAMPIONS ─────────────────────────────────────────────────
    if (route === 'declareChampions') {
      const missing = requireFields(body, ['tournament_id']);
      if (missing) return err(400, missing);

      const tIdx = db.tournaments.findIndex(t => t.id === body.tournament_id);
      if (tIdx !== -1) db.tournaments[tIdx].status = 'completed';

      const teams = db.teams.filter(t => t.tournament_id === body.tournament_id).sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, rankings: teams.map((t, i) => ({ rank: i + 1, team: t.name, total_points: t.total_tournament_points, total_kills: t.total_tournament_kills })) });
    }

    // ── DELETE TEAM ───────────────────────────────────────────────────────
    if (route === 'deleteTeam') {
      const missing = requireFields(body, ['team_id']);
      if (missing) return err(400, missing);

      db.teams = db.teams.filter(t => t.id !== body.team_id);
      db.players = db.players.filter(p => p.team_id !== body.team_id);
      db.match_standings = db.match_standings.filter(s => s.team_id !== body.team_id);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── UPDATE TEAM LOGO ───────────────────────────────────────────────────
    if (route === 'updateTeamLogo') {
      const missing = requireFields(body, ['team_id', 'logo_url']);
      if (missing) return err(400, missing);

      const tIdx = db.teams.findIndex(t => t.id === body.team_id);
      if (tIdx === -1) return err(404, 'Team not found');

      db.teams[tIdx].logo_url = sanitizeString(body.logo_url, 400);
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, team: db.teams[tIdx] });
    }


    // ── REVIVE PLAYER ─────────────────────────────────────────────────────
    if (route === 'revivePlayer') {
      const missing = requireFields(body, ['player_id']);
      if (missing) return err(400, missing);

      const pIdx = db.players.findIndex(p => p.id === body.player_id);
      if (pIdx === -1) return err(404, 'Player not found');

      db.players[pIdx].is_alive = true;
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, player: db.players[pIdx] });
    }

    // ── RESET MATCH ───────────────────────────────────────────────────────
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
      await saveDb(uid, db);
      return ok({ success: true });
    }

    // ── UPDATE TOURNAMENT ─────────────────────────────────────────────────
    if (route === 'updateTournament') {
      const missing = requireFields(body, ['tournament_id']);
      if (missing) return err(400, missing);

      const tIdx = db.tournaments.findIndex(t => t.id === body.tournament_id);
      if (tIdx === -1) return err(404, 'Tournament not found');

      const updates = {};
      if (body.name) updates.name = sanitizeString(body.name, 100);
      if (body.total_matches) updates.total_matches = parseInt(body.total_matches);
      if (body.points_per_kill) updates.points_per_kill = parseInt(body.points_per_kill);
      if (body.placement_points_config) updates.placement_points_config = JSON.stringify(body.placement_points_config);
      if (body.status) updates.status = sanitizeString(body.status, 20);

      db.tournaments[tIdx] = { ...db.tournaments[tIdx], ...updates };
      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, tournament: db.tournaments[tIdx] });
    }

    // ── RESET DATABASE (OWNER ONLY) ───────────────────────────────────────
    if (route === 'resetDatabase') {
      if (!isOwner) return err(403, 'Forbidden: Owner permission required');
      
      const activeT = db.tournaments.find(t => t.status === 'active');
      if (activeT) {
        const tid = activeT.id;
        const activeMatchIds = new Set(db.matches.filter(m => m.tournament_id === tid).map(m => m.id));

        db.teams = db.teams.filter(t => t.tournament_id !== tid);
        db.players = db.players.filter(p => p.tournament_id !== tid);
        db.matches = db.matches.filter(m => m.tournament_id !== tid);
        db.match_standings = db.match_standings.filter(s => s.tournament_id !== tid);
        db.kill_events = db.kill_events.filter(k => !activeMatchIds.has(k.match_id) && k.tournament_id !== tid);
        db.elimination_events = db.elimination_events.filter(e => !activeMatchIds.has(e.match_id) && e.tournament_id !== tid);

        if (db.overlay_state.tournament_id === tid) {
          db.overlay_state.current_screen = 'setup_blank';
          db.overlay_state.mvp_player_id = null;
          db.overlay_state.mvp_player_name = null;
          db.overlay_state.mvp_team_name = null;
          db.overlay_state.mvp_kills = 0;
          db.overlay_state.champion_team_id = null;
          db.overlay_state.champion_team_name = null;
          db.overlay_state.champion_total_points = 0;
        }
      }

      db.overlay_state.last_updated_at = new Date().toISOString();
      await saveDb(uid, db);
      return ok({ success: true, message: 'Match data reset successfully' });
    }

    // ── GOOGLE SHEETS IMPORT ──────────────────────────────────────────────
    if (route === 'validatePromo') {
      const code = sanitizeString(body.code || '', 50).toUpperCase();
      const plan = sanitizeString(body.plan || '', 20).toLowerCase();
      if (!code) return err(400, 'Promo code is required');

      // Load promo codes from DB
      const promoCodes = db.promo_codes || {};
      const promo = promoCodes[code];
      if (!promo) return err(404, 'Invalid promo code');
      if (promo.used_count >= (promo.max_uses || 1)) return err(400, 'Promo code has expired');
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) return err(400, 'Promo code has expired');

      const PRICES = { weekly: 299, monthly: 599, yearly: 2999 };
      const originalPrice = PRICES[plan] || PRICES.monthly;
      const discountPct = promo.discount_percent || 0;
      const discountedPrice = Math.round(originalPrice * (1 - discountPct / 100));
      const savings = originalPrice - discountedPrice;

      return ok({ success: true, code, discountPercent: discountPct, originalPrice, discountedPrice, savings });
    }

    if (route === 'importFromSheet') {
      const { sheet_url, tournament_id } = body;
      if (!sheet_url) return err(400, 'sheet_url is required');
      const match = sheet_url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return err(400, 'Invalid Google Sheets URL');
      const sheetId = match[1];
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey  = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!clientEmail || !privateKey) return err(500, 'Google Sheets credentials not configured');
      try {
        const crypto = require('crypto');
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader  = Buffer.from(JSON.stringify({ alg:'RS256', typ:'JWT' })).toString('base64url');
        const jwtPayload = Buffer.from(JSON.stringify({ iss:clientEmail, scope:'https://www.googleapis.com/auth/spreadsheets.readonly', aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600 })).toString('base64url');
        const toSign = `${jwtHeader}.${jwtPayload}`;
        const signature = crypto.createSign('RSA-SHA256').update(toSign).sign(privateKey, 'base64url');
        const jwt = `${toSign}.${signature}`;
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}` });
        const { access_token } = await tokenRes.json();
        if (!access_token) return err(500, 'Failed to get Google access token');
        const getRange = async (range) => { const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`, { headers:{ Authorization:`Bearer ${access_token}` } }); return r.ok ? (await r.json()).values || [] : []; };
        const teamsRows = await getRange('Teams!A:C');
        const teamsData = teamsRows.slice(1).filter(r => r[0]).map(r => ({ team_name: r[0]?.trim(), logo_url: r[1]?.trim()||'', color: r[2]?.trim()||'' }));
        const playerRows = await getRange('Players!A:C');
        const playersData = playerRows.slice(1).filter(r => r[0]&&r[1]).map(r => ({ player_name: r[0]?.trim(), team_name: r[1]?.trim(), role: r[2]?.trim()||'Player' }));
        let teamsAdded = 0, playersAdded = 0;
        // Resolve active tournament: prefer explicit param → active status → most recent
        const activeTournament = tournament_id
          ? db.tournaments.find(t => t.id === tournament_id)
          : (db.tournaments.find(t => t.status === 'active') || db.tournaments[db.tournaments.length - 1]);
        if (!activeTournament) return err(404, 'No active tournament found. Create a tournament first.');
        const resolvedTid = activeTournament.id;

        for (const t of teamsData) { if (!db.teams.find(x => x.name?.toLowerCase()===t.team_name.toLowerCase())) { db.teams.push({ id:genId(), tournament_id:resolvedTid, name:t.team_name, logo_url:t.logo_url, color:t.color, total_tournament_points:0, total_tournament_kills:0 }); teamsAdded++; } }
        for (const p of playersData) { const team = db.teams.find(t => t.name?.toLowerCase()===p.team_name.toLowerCase()); if (!team) continue; if (!db.players.find(x => x.name===p.player_name&&x.team_id===team.id)) { db.players.push({ id:genId(), team_id:team.id, tournament_id:resolvedTid, name:p.player_name, role:p.role, is_alive:true, total_tournament_kills:0, current_match_kills:0 }); playersAdded++; } }
        db.overlay_state.last_updated_at = new Date().toISOString();
        await saveDb(uid, db);
        return ok({ success:true, teams_added:teamsAdded, players_added:playersAdded });
      } catch(e) { return err(500, `Sheet import failed: ${e.message}`); }
    }

    return err(404, `Unknown route: ${route}`);
  } catch (e) {
    return err(500, 'Internal Server Error');
  }