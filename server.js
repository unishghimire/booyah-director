/**
 * ════════════════════════════════════════════════════════════════════════
 *  BOOYAH DIRECTOR — Broadcast Control Server
 *  Express + Socket.io v4 + JSON State Machine
 *  + Champion Rush & Point Rush (Headstart) Scoring Engine
 * ════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');

// ─── Config ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const SOCKET_ROOM = process.env.SOCKET_ROOM_TOKEN || 'booyah-director-room';
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const DB_PATH = path.join(__dirname, 'database.json');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════════════
//  SCORING ENGINE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

// Official headstart point rules (Point Rush carryovers)
const HEADSTART_POINTS_MAP = {
  1: 10, // 1st place gets 10 headstart points
  2: 7,  // 2nd gets 7
  3: 5,  // 3rd gets 5
  4: 3,  // 4th gets 3
  5: 2,  // 5th gets 2
  6: 1   // 6th gets 1
};

// ─── Database initialization ────────────────────────────────────────────
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.teams && Array.isArray(parsed.teams)) {
        // Ensure new fields exist on legacy DBs
        if (!parsed.tournamentSettings) parsed.tournamentSettings = getDefaultTournamentSettings();
        if (!parsed.headstartPoints) parsed.headstartPoints = {};
        if (!parsed.matches) parsed.matches = [];
        if (!parsed.standings) parsed.standings = [];
        return parsed;
      }
    } catch (_) { /* fall through */ }
  }

  const teams = [];
  for (let i = 1; i <= 12; i++) {
    const players = [];
    for (let p = 1; p <= 4; p++) {
      players.push({ name: '', img: '', role: 'Player ' + p });
    }
    teams.push({
      id: i,
      teamName: 'Team ' + i,
      shortName: 'T' + i,
      logoUrl: '',
      themeColor: '#ff4e00',
      players,
      liveStats: { kills: 0, alive: 4 }
    });
  }

  return {
    tournament: { name: 'Untitled Tournament', logo: '', sponsor: '', sponsorLogo: '' },
    theme: { preset: 'ffws-neon-orange', primaryColor: '#ff4e00', accentGlow: '#ffaa00', bgDark: '#0c0c0e', textMain: '#ffffff' },
    tournamentSettings: getDefaultTournamentSettings(),
    headstartPoints: {},
    matches: [],
    standings: [],
    teams
  };
}

function getDefaultTournamentSettings() {
  return {
    championRushThreshold: 80,
    currentStage: 'Grand-Finals',
    pointsPerKill: 1,
    placementPoints: {
      1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0
    }
  };
}

let database = initDatabase();

// ─── Persist helper ────────────────────────────────────────────────────
function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[DB] Save failed:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  SCORING ENGINE — Champion Rush & Point Rush
// ═══════════════════════════════════════════════════════════════════════

/**
 * FEATURE 1: Calculates and returns carrying over / headstart points.
 * @param {Array} previousStageStandings - Ranked array of teams from the previous stage.
 * @returns {Object} Map of teamId -> headstart points
 */
function assignHeadstartPoints(previousStageStandings) {
  const headstart = {};
  previousStageStandings.forEach((team, index) => {
    const rank = index + 1;
    headstart[team.teamId || team.id] = HEADSTART_POINTS_MAP[rank] || 0;
  });
  return headstart;
}

/**
 * Calculate cumulative standings from all matches + headstart points.
 * @returns {Array} Sorted standings with totalPoints, kills, headstart
 */
function calculateStandings() {
  const teams = database.teams || [];
  const matches = database.matches || [];
  const headstart = database.headstartPoints || {};
  const ppk = database.tournamentSettings?.pointsPerKill || 1;
  const placementPoints = database.tournamentSettings?.placementPoints || {};

  const standings = teams.map(team => {
    const teamId = team.id;

    // Sum points from all completed matches
    let matchPoints = 0;
    let totalKills = 0;

    matches.forEach(m => {
      if (m.results) {
        const result = m.results.find(r => r.teamId === teamId);
        if (result) {
          const placement = result.placement || 0;
          const pp = placementPoints[placement] || 0;
          const kills = result.kills || 0;
          const killPoints = kills * ppk;
          matchPoints += pp + killPoints;
          totalKills += kills;
        }
      }
    });

    const hs = headstart[teamId] || 0;
    const totalPoints = matchPoints + hs;

    return {
      teamId,
      teamName: team.teamName,
      shortName: team.shortName,
      logoUrl: team.logoUrl,
      themeColor: team.themeColor,
      liveStats: team.liveStats,
      matchPoints,
      headstartPoints: hs,
      totalPoints,
      totalKills
    };
  });

  // Sort by total points desc, then kills desc
  standings.sort((a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills);

  return standings;
}

/**
 * FEATURE 2: Processes standings and identifies Champion Rush eligibility / winners.
 * @param {Array} standings - Output from calculateStandings().
 * @param {number} threshold - Target points (e.g. 80 or 90).
 * @param {Object} latestMatch - Most recently finished match (with results array).
 * @returns {Array} Standings with isEligible and isTournamentWinner flags.
 */
function evaluateChampionRush(standings, threshold, latestMatch) {
  // Identify which team won the Booyah (placement === 1) in the latest match
  let booyahWinnerId = null;
  if (latestMatch && latestMatch.results) {
    const booyahWinner = latestMatch.results.find(t => t.placement === 1);
    booyahWinnerId = booyahWinner ? (booyahWinner.teamId || booyahWinner.id) : null;
  }

  return standings.map(team => {
    // Did they cross the threshold?
    const isEligible = team.totalPoints >= threshold;

    // If eligible AND they just got the Booyah → tournament winner!
    const isTournamentWinner = isEligible && (team.teamId === booyahWinnerId);

    return {
      ...team,
      isEligible,
      isTournamentWinner
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  EXPRESS SETUP
// ═══════════════════════════════════════════════════════════════════════
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Multer ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'asset_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Socket.io ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e8
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  socket.join(SOCKET_ROOM);
  next();
});

io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  socket.emit('stateUpdated', database);
  socket.on('disconnect', () => console.log('[Socket] Disconnected:', socket.id));
});

// ─── Broadcast helpers ─────────────────────────────────────────────────
function broadcastState()     { io.to(SOCKET_ROOM).emit('stateUpdated', database); }
function broadcastTheme(t)    { io.to(SOCKET_ROOM).emit('globalThemeUpdate', t); }
function broadcastDatabase()  { io.to(SOCKET_ROOM).emit('databaseUpdated', database); }
function broadcastStandings(s){ io.to(SOCKET_ROOM).emit('standingsUpdated', s); }
function broadcastChampion(c) { io.to(SOCKET_ROOM).emit('championRushUpdate', c); }

// ═══════════════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════════════

/** POST /api/state/save — overwrites state and broadcasts */
app.post('/api/state/save', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') return res.json({ success: false, error: 'Invalid payload' });

    database = { ...database, ...incoming };
    saveDatabase();
    broadcastState();
    if (incoming.theme) broadcastTheme(incoming.theme);

    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    console.error('[API] /state/save:', err);
    res.json({ success: false, error: err.message });
  }
});

/** POST /api/teams/bulk-import — import spreadsheet data */
app.post('/api/teams/bulk-import', (req, res) => {
  try {
    const { teams } = req.body;
    if (!Array.isArray(teams)) return res.json({ success: false, error: 'Expected { teams: [...] }' });

    const current = database.teams || [];
    const maxLen = Math.max(teams.length, current.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < teams.length && teams[i]) {
        const imp = teams[i], ex = current[i] || {};
        current[i] = {
          id: imp.id || (i + 1),
          teamName: imp.teamName || ex.teamName || ('Team ' + (i + 1)),
          shortName: imp.shortName || ex.shortName || ('T' + (i + 1)),
          logoUrl: imp.logoUrl || ex.logoUrl || '',
          themeColor: imp.themeColor || ex.themeColor || '#ff4e00',
          players: imp.players || ex.players || [],
          liveStats: ex.liveStats || { kills: 0, alive: 4 }
        };
      }
    }
    database.teams = current.slice(0, 12);
    saveDatabase();
    broadcastDatabase();
    res.json({ success: true, count: database.teams.length, timestamp: Date.now() });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/** POST /api/media/upload — file upload */
app.post('/api/media/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: 'No file' });
    const url = '/uploads/' + req.file.filename;
    const { teamId, fieldType, playerIndex } = req.body;
    if (teamId) {
      const team = database.teams.find(t => t.id === parseInt(teamId));
      if (team) {
        if (fieldType === 'logo') team.logoUrl = url;
        else if (fieldType === 'player' && playerIndex !== undefined) {
          const idx = parseInt(playerIndex);
          if (team.players[idx]) team.players[idx].img = url;
        }
        saveDatabase();
        broadcastState();
      }
    }
    res.json({ success: true, url, filename: req.file.filename });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  CHAMPION RUSH & POINT RUSH API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/settings/update
 * Update tournament settings (champion rush threshold, stage, scoring config)
 */
app.post('/api/settings/update', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') return res.json({ success: false, error: 'Invalid payload' });

    database.tournamentSettings = { ...database.tournamentSettings, ...incoming };
    saveDatabase();
    broadcastState();

    res.json({ success: true, settings: database.tournamentSettings, timestamp: Date.now() });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/**
 * POST /api/headstart/assign
 * Assign headstart points based on previous stage standings (Point Rush carryover)
 * Body: { previousStageStandings: [{ teamId, teamName, ... }, ...] }
 */
app.post('/api/headstart/assign', (req, res) => {
  try {
    const { previousStageStandings } = req.body;
    if (!Array.isArray(previousStageStandings)) return res.json({ success: false, error: 'Expected { previousStageStandings: [...] }' });

    database.headstartPoints = assignHeadstartPoints(previousStageStandings);
    saveDatabase();
    broadcastState();

    res.json({
      success: true,
      headstartPoints: database.headstartPoints,
      timestamp: Date.now()
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/**
 * POST /api/headstart/manual
 * Manually set headstart points for a specific team
 * Body: { teamId, points }
 */
app.post('/api/headstart/manual', (req, res) => {
  try {
    const { teamId, points } = req.body;
    if (!teamId) return res.json({ success: false, error: 'teamId required' });

    if (!database.headstartPoints) database.headstartPoints = {};
    database.headstartPoints[teamId] = parseInt(points) || 0;
    saveDatabase();
    broadcastState();

    res.json({ success: true, headstartPoints: database.headstartPoints });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/**
 * POST /api/match/submit
 * Submit a finished match, calculate standings + headstart + champion rush
 * Body: { match: { matchNumber, mapName, results: [{ teamId, placement, kills }] } }
 */
app.post('/api/match/submit', (req, res) => {
  try {
    const latestMatch = req.body.match;
    if (!latestMatch || !Array.isArray(latestMatch.results)) {
      return res.json({ success: false, error: 'Expected { match: { results: [...] } }' });
    }

    // Store the match
    if (!database.matches) database.matches = [];
    const matchRecord = {
      matchNumber: latestMatch.matchNumber || (database.matches.length + 1),
      mapName: latestMatch.mapName || 'Unknown',
      results: latestMatch.results,
      timestamp: Date.now()
    };
    database.matches.push(matchRecord);

    // 1. Calculate raw standings from all matches
    let standings = calculateStandings();

    // 2. Add headstart/carryover points (already included in calculateStandings)
    //    standings = standings.map(team => { ... }) — headstart already merged

    // 3. Evaluate champion rush status
    const threshold = database.tournamentSettings?.championRushThreshold || 80;
    const finalStandings = evaluateChampionRush(standings, threshold, matchRecord);

    // Store standings in database
    database.standings = finalStandings;
    saveDatabase();

    // 4. Broadcast to overlays
    broadcastState();
    broadcastStandings(finalStandings);

    // Check for champion winner
    const champion = finalStandings.find(t => t.isTournamentWinner);
    if (champion) {
      broadcastChampion(champion);
    }

    res.json({
      success: true,
      standings: finalStandings,
      champion: champion || null,
      matchNumber: matchRecord.matchNumber,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('[API] /match/submit:', err);
    res.json({ success: false, error: err.message });
  }
});

/**
 * GET /api/standings
 * Returns current calculated standings with champion rush status
 */
app.get('/api/standings', (req, res) => {
  try {
    let standings = calculateStandings();
    const threshold = database.tournamentSettings?.championRushThreshold || 80;
    const lastMatch = database.matches?.[database.matches.length - 1] || null;
    standings = evaluateChampionRush(standings, threshold, lastMatch);
    res.json({ standings, threshold, championRushActive: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

/** GET /api/state — full state */
app.get('/api/state', (req, res) => res.json(database));

/** GET /api/health */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), teams: database.teams.length, matches: (database.matches || []).length });
});

// ─── Start server ──────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('==================================================');
  console.log('  BOOYAH DIRECTOR — Broadcast Server');
  console.log('  Port: ' + PORT + ' | Room: ' + SOCKET_ROOM);
  console.log('  Champion Rush: ' + (database.tournamentSettings?.championRushThreshold || 80) + ' pts');
  console.log('  Controller:  http://localhost:' + PORT + '/controller.html');
  console.log('  Overlay:     http://localhost:' + PORT + '/overlay.html');
  console.log('==================================================');
});
