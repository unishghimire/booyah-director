const { db } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method Not Allowed' });
  }

  try {
    const { match_id } = req.body || {};

    if (!match_id) {
      return res.status(400).json({ error: 'match_id is required' });
    }

    // Count kill_events per killer_player_id
    const killCounts = db.prepare(`
      SELECT killer_player_id, COUNT(*) as kills
      FROM kill_events
      WHERE match_id = ?
      GROUP BY killer_player_id
      ORDER BY kills DESC
    `).all(match_id);

    if (killCounts.length === 0) {
      return res.status(200).json({
        mvp: null,
        tied: false,
        max_kills: 0
      });
    }

    const maxKills = killCounts[0].kills;
    const leaders = killCounts.filter(k => k.kills === maxKills);
    const tied = leaders.length > 1;

    // Get mvp details (take the first one)
    const mvpPlayerId = leaders[0].killer_player_id;
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(mvpPlayerId);

    let teamName = 'Unknown Team';
    if (player) {
      const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(player.team_id);
      if (team) {
        teamName = team.name;
      }
    }

    return res.status(200).json({
      mvp: {
        player_id: mvpPlayerId,
        name: player ? player.name : 'Unknown Player',
        team: teamName,
        kills: maxKills
      },
      tied,
      max_kills: maxKills
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
