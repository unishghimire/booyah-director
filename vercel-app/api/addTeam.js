const { loadDb, saveDb, genId } = require('./_db');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

module.exports = (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { tournament_id, team_name, player_names } = req.body || {};
    if (!tournament_id || !team_name) return res.status(400).json({ error: 'tournament_id and team_name required' });

    const db = loadDb();
    const existing = db.teams.filter(t => t.tournament_id === tournament_id);
    if (existing.length >= 12) return res.status(400).json({ error: 'Maximum 12 teams allowed' });

    const players = player_names || [];
    if (players.length > 4) return res.status(400).json({ error: 'Maximum 4 players per squad' });

    const team = {
      id: genId(),
      tournament_id,
      name: team_name,
      logo_url: null,
      total_tournament_points: 0,
      total_tournament_kills: 0,
      created_at: new Date().toISOString()
    };
    db.teams.push(team);

    const createdPlayers = [];
    for (const playerName of players) {
      if (playerName && playerName.trim()) {
        const player = {
          id: genId(),
          team_id: team.id,
          tournament_id,
          name: playerName.trim(),
          is_alive: true,
          current_match_kills: 0,
          total_tournament_kills: 0,
          created_at: new Date().toISOString()
        };
        db.players.push(player);
        createdPlayers.push(player);
      }
    }

    saveDb(db);
    res.json({ success: true, team, players: createdPlayers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
