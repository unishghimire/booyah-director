import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from './firebase';

const BASE = '/api';

async function getToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  try { return await user.getIdToken(forceRefresh); }
  catch { return null; }
}

async function call(name, payload = {}, method = 'POST', retry = true) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isGet = method === 'GET';
  const url = isGet && Object.keys(payload).length
    ? `${BASE}/${name}?${new URLSearchParams(payload)}`
    : `${BASE}/${name}`;

  const opts = { method, headers };
  if (!isGet) opts.body = JSON.stringify(payload);

  let res;
  try { res = await fetch(url, opts); }
  catch (e) {
    if (retry) return call(name, payload, method, false); // retry once
    throw new Error('Network error — please check your connection');
  }

  // Token expired — refresh and retry once
  if (res.status === 401 && retry) {
    await getToken(true);
    return call(name, payload, method, false);
  }

  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const overlayApi = {
  getOverlayData:           (shareToken) => {
    const token = shareToken || sessionStorage.getItem('shareToken') || '';
    return call('getOverlayData', token ? { shareToken: token } : {}, 'GET');
  },
  initializeTournament:     (d) => call('initializeTournament', d),
  addTeam:                  (d) => call('addTeam', d),
  addPlayer:                (d) => call('addPlayer', d),
  deleteTeam:               (d) => call('deleteTeam', d),
  startNextMatch:           (d) => call('startNextMatch', d),
  updateMatchState:         (d) => call('updateMatchState', d),
  addKill:                  (d) => call('addKill', d),
  eliminatePlayer:          (d) => call('eliminatePlayer', d),
  revivePlayer:             (d) => call('revivePlayer', d),
  setTeamPlacement:         (d) => call('setTeamPlacement', d),
  calculateMVP:             (d) => call('calculateMVP', d),
  setMVPAndShowScreen:      (d) => call('setMVPAndShowScreen', d),
  setChampionAndShowScreen: (d) => call('setChampionAndShowScreen', d),
  switchOverlayScreen:      (d) => call('switchOverlayScreen', d),
  declareChampions:         (d) => call('declareChampions', d),
  saveDesign:               (d) => call('saveDesign', d),
  getDesign:                ()  => call('getDesign', {}, 'GET'),
  resetMatch:               (d) => call('resetMatch', d),
  updateTournament:         (d) => call('updateTournament', d),
  importFromSheet:          (d) => call('importFromSheet', d),
  resetDatabase:            ()  => call('resetDatabase'),
  getShareToken:            ()  => call('getShareToken', {}, 'GET'),
};

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

export function useOverlayData(enabled = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const raw = await overlayApi.getOverlayData();
      if (mountedRef.current) { setData(normalise(raw)); setLoading(false); setError(null); }
    } catch (err) {
      if (mountedRef.current) { setLoading(false); setError(err.message); }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) { setLoading(false); return; }
    refresh();
    const iv = setInterval(refresh, 2000);
    return () => { mountedRef.current = false; clearInterval(iv); };
  }, [enabled, refresh]);

  return {
    data, loading, error, refresh,
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
