import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from './firebase';

const BASE = '/api';

// ── Token helper ─────────────────────────────────────────────────────────────

let _tokenCache = null;
let _tokenExp   = 0;

async function getToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  const now = Date.now();
  // Reuse cached token if still valid for >60s
  if (!forceRefresh && _tokenCache && _tokenExp - now > 60_000) return _tokenCache;
  try {
    _tokenCache = await user.getIdToken(forceRefresh);
    _tokenExp   = now + 55 * 60 * 1000; // Firebase tokens last 60min
    return _tokenCache;
  } catch {
    return null;
  }
}

// ── Core API caller ───────────────────────────────────────────────────────────

async function call(name, payload = {}, method = 'POST', retry = true, signal = null) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isGet = method === 'GET';
  const url = isGet && Object.keys(payload).length
    ? `${BASE}/${name}?${new URLSearchParams(payload)}`
    : `${BASE}/${name}`;

  const opts = { method, headers, signal };
  if (!isGet && Object.keys(payload).length) opts.body = JSON.stringify(payload);

  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    if (e?.name === 'AbortError') throw e; // don't retry aborted requests
    if (retry) return call(name, payload, method, false, signal);
    throw new Error('Network error — check your connection');
  }

  // Token expired — refresh and retry once
  if (res.status === 401 && retry) {
    _tokenCache = null;
    await getToken(true);
    return call(name, payload, method, false, signal);
  }

  // Rate limited
  if (res.status === 429) {
    throw new Error('Too many requests. Please wait a moment.');
  }

  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// ── Public API surface ────────────────────────────────────────────────────────

export const overlayApi = {
  getOverlayData:           (shareToken) => {
    const token = shareToken || sessionStorage.getItem('bd_share_token') || '';
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

// ── Data normaliser ───────────────────────────────────────────────────────────

function normalise(raw) {
  if (!raw) return null;
  return {
    tournament:   raw.tournament    ?? null,
    overlayState: raw.overlay_state ?? null,
    design:       raw.design        ?? null,
    teams:        Array.isArray(raw.teams)        ? raw.teams        : [],
    players:      Array.isArray(raw.players)      ? raw.players      : [],
    currentMatch: raw.current_match ?? null,
    killFeed:     Array.isArray(raw.kill_feed)    ? raw.kill_feed    : [],
    eliminations: Array.isArray(raw.eliminations) ? raw.eliminations : [],
    standings:    Array.isArray(raw.standings)    ? raw.standings    : [],
  };
}

// ── React hook — live polling with AbortController ────────────────────────────

const POLL_INTERVAL = 2000; // 2s — fast enough for live events

export function useOverlayData(enabled = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);
  const timerRef              = useRef(null);
  const mountedRef            = useRef(true);
  const errCountRef           = useRef(0);

  const refresh = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const raw = await overlayApi.getOverlayData(null);
      if (!mountedRef.current || ctrl.signal.aborted) return;
      errCountRef.current = 0;
      setData(normalise(raw));
      setLoading(false);
      setError(null);
    } catch (e) {
      if (e?.name === 'AbortError' || !mountedRef.current) return;
      errCountRef.current++;
      setLoading(false);
      // Only surface error after 3 consecutive failures (avoids flashing on transient issues)
      if (errCountRef.current >= 3) setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    mountedRef.current = true;
    refresh();

    // Adaptive polling: slow down on errors to reduce spam
    const schedule = () => {
      const delay = errCountRef.current > 5 ? 8000 : POLL_INTERVAL;
      timerRef.current = setTimeout(async () => {
        await refresh();
        if (mountedRef.current) schedule();
      }, delay);
    };
    schedule();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearTimeout(timerRef.current);
    };
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
