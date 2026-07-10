import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = 'https://kaelo-cec2b53f.base44.app/functions';

async function callFunction(name, payload = {}) {
  const response = await fetch(`${BASE_URL}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await response.json(); } catch (_) { /* not json */ }
  if (!response.ok) {
    throw new Error(data.error || data.message || `Function ${name} failed`);
  }
  return data;
}

export const overlayApi = {
  getOverlayData: () => callFunction('getOverlayData'),
  initializeTournament: (data) => callFunction('initializeTournament', data),
  addTeam: (data) => callFunction('addTeam', data),
  addKill: (data) => callFunction('addKill', data),
  eliminatePlayer: (data) => callFunction('eliminatePlayer', data),
  updateMatchState: (data) => callFunction('updateMatchState', data),
  startNextMatch: (data) => callFunction('startNextMatch', data),
  setTeamPlacement: (data) => callFunction('setTeamPlacement', data),
  switchOverlayScreen: (data) => callFunction('switchOverlayScreen', data),
  calculateMVP: (data) => callFunction('calculateMVP', data),
  setMVPAndShowScreen: (data) => callFunction('setMVPAndShowScreen', data),
  setChampionAndShowScreen: (data) => callFunction('setChampionAndShowScreen', data),
  declareChampions: (data) => callFunction('declareChampions', data),
};

export function useOverlayData(enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await overlayApi.getOverlayData();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (_) {
      // silent poll fail
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;
    refresh();
    const interval = setInterval(refresh, 500);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [enabled, refresh]);

  return { data, loading, refresh };
}