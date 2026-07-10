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
    const { match_id, state } = req.body || {};

    if (!match_id || !state) {
      return res.status(400).json({ error: 'match_id and state are required' });
    }

    const now = new Date().toISOString();

    if (state === 'ended') {
      db.prepare(`
        UPDATE matches
        SET state = ?, ended_at = ?
        WHERE id = ?
      `).run(state, now, match_id);
    } else {
      db.prepare(`
        UPDATE matches
        SET state = ?
        WHERE id = ?
      `).run(state, match_id);
    }

    // If state is live, update overlay screen to scoreboard
    if (state === 'live') {
      db.prepare(`
        UPDATE overlay_state
        SET current_screen = 'scoreboard', last_updated_at = ?
        WHERE id = 'singleton'
      `).run(now);
    } else {
      db.prepare(`
        UPDATE overlay_state
        SET last_updated_at = ?
        WHERE id = 'singleton'
      `).run(now);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
