/**
 * ════════════════════════════════════════════════════════════════════════
 *  BOOYAH DIRECTOR — Broadcast Control Server
 *  Express + Socket.io v4 + JSON State Machine
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

// ─── Ensure upload dir exists ──────────────────────────────────────────
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Initialize database with 12 empty teams ──────────────────────────
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.teams && Array.isArray(parsed.teams)) return parsed;
    } catch (_) { /* fall through to fresh init */ }
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
    tournament: {
      name: 'Untitled Tournament',
      logo: '',
      sponsor: '',
      sponsorLogo: ''
    },
    theme: {
      preset: 'ffws-neon-orange',
      primaryColor: '#ff4e00',
      accentGlow: '#ffaa00',
      bgDark: '#0c0c0e',
      textMain: '#ffffff'
    },
    teams
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

// ─── Express setup ─────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Increase limit for base64 media payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Multer for file uploads ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = 'asset_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Socket.io ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e8
});

// Map connections to token room
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token && token === SOCKET_ROOM) {
    socket.join(SOCKET_ROOM);
    return next();
  }
  // Allow connections without token for overlay observers
  socket.join(SOCKET_ROOM);
  next();
});

io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  // Send current state on connect
  socket.emit('stateUpdated', database);

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

// ─── Broadcast helpers ─────────────────────────────────────────────────
function broadcastState() {
  io.to(SOCKET_ROOM).emit('stateUpdated', database);
}

function broadcastTheme(theme) {
  io.to(SOCKET_ROOM).emit('globalThemeUpdate', theme);
}

function broadcastDatabase() {
  io.to(SOCKET_ROOM).emit('databaseUpdated', database);
}

// ─── API Routes ────────────────────────────────────────────────────────

/**
 * POST /api/state/save
 * Overwrites database.json with updated state and broadcasts stateUpdated
 */
app.post('/api/state/save', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.json({ success: false, error: 'Invalid payload' });
    }

    // Merge incoming data — shallow merge for top-level keys
    database = { ...database, ...incoming };

    // Persist
    saveDatabase();

    // Broadcast
    broadcastState();

    // If theme changed, broadcast theme update
    if (incoming.theme) {
      broadcastTheme(incoming.theme);
    }

    res.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    console.error('[API] /state/save error:', err);
    res.json({ success: false, error: err.message });
  }
});

/**
 * POST /api/teams/bulk-import
 * Accepts structured JSON from parsed spreadsheet, saves, and broadcasts databaseUpdated
 */
app.post('/api/teams/bulk-import', (req, res) => {
  try {
    const { teams } = req.body;
    if (!Array.isArray(teams)) {
      return res.json({ success: false, error: 'Expected { teams: [...] } payload' });
    }

    // Merge imported teams into database, preserving IDs 1-12
    const currentTeams = database.teams || [];
    const maxLen = Math.max(teams.length, currentTeams.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < teams.length && teams[i]) {
        const imported = teams[i];
        const existing = currentTeams[i] || {};
        currentTeams[i] = {
          id: imported.id || (i + 1),
          teamName: imported.teamName || existing.teamName || ('Team ' + (i + 1)),
          shortName: imported.shortName || existing.shortName || ('T' + (i + 1)),
          logoUrl: imported.logoUrl || existing.logoUrl || '',
          themeColor: imported.themeColor || existing.themeColor || '#ff4e00',
          players: imported.players || existing.players || [],
          liveStats: existing.liveStats || { kills: 0, alive: 4 }
        };
      }
    }

    database.teams = currentTeams.slice(0, 12);
    saveDatabase();
    broadcastDatabase();

    res.json({ success: true, count: database.teams.length, timestamp: Date.now() });
  } catch (err) {
    console.error('[API] /teams/bulk-import error:', err);
    res.json({ success: false, error: err.message });
  }
});

/**
 * POST /api/media/upload
 * Handles single-file multipart uploads, saves to public/uploads/, returns public URL
 */
app.post('/api/media/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: 'No file provided' });
    }

    const publicUrl = '/uploads/' + req.file.filename;
    const { teamId, fieldType, playerIndex } = req.body;

    // Auto-update state if context provided
    if (teamId) {
      const team = database.teams.find(t => t.id === parseInt(teamId));
      if (team) {
        if (fieldType === 'logo') {
          team.logoUrl = publicUrl;
        } else if (fieldType === 'player' && playerIndex !== undefined) {
          const idx = parseInt(playerIndex);
          if (team.players[idx]) {
            team.players[idx].img = publicUrl;
          }
        }
        saveDatabase();
        broadcastState();
      }
    }

    res.json({ success: true, url: publicUrl, filename: req.file.filename });
  } catch (err) {
    console.error('[API] /media/upload error:', err);
    res.json({ success: false, error: err.message });
  }
});

/**
 * GET /api/state
 * Returns the current full database state
 */
app.get('/api/state', (req, res) => {
  res.json(database);
});

// ─── Health check ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), teams: database.teams.length });
});

// ─── Start server ──────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('==================================================');
  console.log('  BOOYAH DIRECTOR — Broadcast Server');
  console.log('  Port: ' + PORT);
  console.log('  Socket Room: ' + SOCKET_ROOM);
  console.log('  Controller:  http://localhost:' + PORT + '/controller.html');
  console.log('  Overlay:     http://localhost:' + PORT + '/overlay.html');
  console.log('==================================================');
});
