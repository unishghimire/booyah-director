const { loadDb } = require('./_db');

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
    const { match_id } = req.body || {};
    if (!match_id) return res.status(400).json({ error: 'match_id required' });

    const db = loadDb();
    const killEvents = db.kill_events.filter(k => k.match_id === match_id);

    const killMap = {};
    for (const evt of killEvents) {
      const pid = evt.killer_player_id;
      if (!killMap[pid]) killMap[pid] = { name: evt.killer_name, team: evt.killer_team_name, kills: 0, player_id: pid };
      killMap[pid].kills++;
    }

    const sorted = Object.values(killMap).sort((a, b) => b.kills - a.kills);
    if (sorted.length === 0) return res.json({ mvp: null, tied: false, message: 'No kills recorded' });

    const maxKills = sorted[0].kills;
    const topPlayers = sorted.filter(p => p.kills === maxKills);

    res.json({ mvp: topPlayers[0], tied: topPlayers.length > 1, tied_players: topPlayers, max_kills: maxKills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
