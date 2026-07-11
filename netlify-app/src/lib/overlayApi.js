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
  if (!response.ok) throw new Error(data.error || data.message || `${name} failed`);
  return data;
}

export const overlayApi = {
  getOverlayData: () => callFunction('getOverlayData', {}, 'GET'),
  initializeTournament: (data) => callFunction('initializeTournament', data),
  addTeam: (data) => callFunction('addTeam', data),
  startNextMatch: (data) => callFunction('startNextMatch', data),
  updateMatchState: (data) => callFunction('updateMatchState', data),
  addKill: (data) => callFunction('addKill', data),
  eliminatePlayer: (data) => callFunction('eliminatePlayer', data),
  setTeamPlacement: (data) => callFunction('setTeamPlacement', data),
  calculateMVP: (data) => callFunction('calculateMVP', data),
  setMVPAndShowScreen: (data) => callFunction('setMVPAndShowScreen', data),
  setChampionAndShowScreen: (data) => callFunction('setChampionAndShowScreen', data),
  switchOverlayScreen: (data) => callFunction('switchOverlayScreen', data),
  declareChampions: (data) => callFunction('declareChampions', data),
  saveDesign: (data) => callFunction('saveDesign', data),
  getDesign: () => callFunction('getDesign', {}, 'GET'),
};

export function useOverlayData(enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await overlayApi.getOverlayData();
      if (mountedRef.current) { setData(result); setLoading(false); }
    } catch (err) {}
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
