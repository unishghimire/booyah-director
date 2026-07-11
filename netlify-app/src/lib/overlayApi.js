import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = '/api';

async function callFunction(name, payload = {}, method = 'POST') {
  const options = { method, headers: {} };
  if (method === 'POST') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }
  const url =
    method === 'GET' && Object.keys(payload).length
      ? `${BASE_URL}/${name}?${new URLSearchParams(payload)}`
      : `${BASE_URL}/${name}`;
  const response = await fetch(url, options);
  let data = {};
  try { data = await response.json(); } catch (e) {}
  if (!response.ok)
    throw new Error(data.error || data.message || `${name} failed (${response.status})`);
  return data;
}

export const overlayApi = {
  getOverlayData:           ()  => callFunction('getOverlayData', {}, 'GET'),
  initializeTournament:     (d) => callFunction('initializeTournament', d),
  addTeam:                  (d) => callFunction('addTeam', d),
  addPlayer:                (d) => callFunction('addPlayer', d),
  deleteTeam:               (d) => callFunction('deleteTeam', d),
  startNextMatch:           (d) => callFunction('startNextMatch', d),
  updateMatchState:         (d) => callFunction('updateMatchState', d),
  addKill:                  (d) => callFunction('addKill', d),
  eliminatePlayer:          (d) => callFunction('eliminatePlayer', d),
  revivePlayer:             (d) => callFunction('revivePlayer', d),
  setTeamPlacement:         (d) => callFunction('setTeamPlacement', d),
  calculateMVP:             (d) => callFunction('calculateMVP', d),
  setMVPAndShowScreen:      (d) => callFunction('setMVPAndShowScreen', d),
  setChampionAndShowScreen: (d) => callFunction('setChampionAndShowScreen', d),
  switchOverlayScreen:      (d) => callFunction('switchOverlayScreen', d),
  declareChampions:         (d) => callFunction('declareChampions', d),
  saveDesign:               (d) => callFunction('saveDesign', d),
  getDesign:                ()  => callFunction('getDesign', {}, 'GET'),
  resetMatch:               (d) => callFunction('resetMatch', d),
  updateTournament:         (d) => callFunction('updateTournament', d),
  importFromSheet:          (d) => callFunction('importFromSheet', d),
  resetDatabase:            ()  => callFunction('resetDatabase'),
};

/**
 * Normalise raw API response (snake_case) into camelCase shape every component expects.
 * API returns: { tournament, overlay_state, design, teams, players, current_match, kill_feed, eliminations, standings }
 * Components expect: { tournament, overlayState, design, teams, players, currentMatch, killFeed, eliminations, standings }
 */
function normalise(raw) {
  if (!raw) return null;
  return {
    tournament:   raw.tournament    ?? null,
    overlayState: raw.overlay_state ?? null,
    design:       raw.design        ?? null,
    teams:        raw.teams         ?? [],
    players:      raw.players       ?? [],
    currentMatch: raw.current_match ?? null,
    killFeed:     raw.kill_feed     ?? [],
    eliminations: raw.eliminations  ?? [],
    standings:    raw.standings     ?? [],
  };
}

/**
 * useOverlayData — polls /api/getOverlayData every second.
 * Returns { data, loading, error, refresh } plus flat convenience aliases
 * so both DirectorPanel (uses data?.overlayState) and Overlay.jsx
 * (destructures overlayState directly) both work correctly.
 */
export function useOverlayData(enabled = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const raw = await overlayApi.getOverlayData();
      if (mountedRef.current) {
        setData(normalise(raw));
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setLoading(false);
        setError(err.message);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) { setLoading(false); return; }
    refresh();
    const interval = setInterval(refresh, 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [enabled, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    // Flat aliases — safe defaults when data is null
    overlayState: data?.overlayState ?? null,
    design:       data?.design       ?? null,
    teams:        data?.teams        ?? [],
    players:      data?.players      ?? [],
    currentMatch: data?.currentMatch ?? null,
    killFeed:     data?.killFeed     ?? [],
    eliminations: data?.eliminations ?? [],
    standings:    data?.standings    ?? [],
    tournament:   data?.tournament   ?? null,
  };
}
