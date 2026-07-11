import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = '/api';

async function callFunction(name, payload = {}, method = 'POST') {
  const options = { method, headers: {} };
  if (method === 'POST') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }
  const url = method === 'GET' && Object.keys(payload).length
    ? `${BASE_URL}/${name}?${new URLSearchParams(payload)}`
    : `${BASE_URL}/${name}`;
  const response = await fetch(url, options);
  let data = {};
  try { data = await response.json(); } catch (e) {}
  if (!response.ok) throw new Error(data.error || data.message || `${name} failed (${response.status})`);
  return data;
}

export const overlayApi = {
  getOverlayData:         ()     => callFunction('getOverlayData', {}, 'GET'),
  initializeTournament:   (d)    => callFunction('initializeTournament', d),
  addTeam:                (d)    => callFunction('addTeam', d),
  addPlayer:              (d)    => callFunction('addPlayer', d),
  deleteTeam:             (d)    => callFunction('deleteTeam', d),
  startNextMatch:         (d)    => callFunction('startNextMatch', d),
  updateMatchState:       (d)    => callFunction('updateMatchState', d),
  addKill:                (d)    => callFunction('addKill', d),
  eliminatePlayer:        (d)    => callFunction('eliminatePlayer', d),
  revivePlayer:           (d)    => callFunction('revivePlayer', d),
  setTeamPlacement:       (d)    => callFunction('setTeamPlacement', d),
  calculateMVP:           (d)    => callFunction('calculateMVP', d),
  setMVPAndShowScreen:    (d)    => callFunction('setMVPAndShowScreen', d),
  setChampionAndShowScreen:(d)   => callFunction('setChampionAndShowScreen', d),
  switchOverlayScreen:    (d)    => callFunction('switchOverlayScreen', d),
  declareChampions:       (d)    => callFunction('declareChampions', d),
  saveDesign:             (d)    => callFunction('saveDesign', d),
  getDesign:              ()     => callFunction('getDesign', {}, 'GET'),
  resetMatch:             (d)    => callFunction('resetMatch', d),
};

export function useOverlayData(enabled = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await overlayApi.getOverlayData();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        // On first load error, still set loading=false so UI renders
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
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [enabled, refresh]);

  return { data, loading, error, refresh };
}
