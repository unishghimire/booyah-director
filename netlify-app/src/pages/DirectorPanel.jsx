import { MAP_IMAGES, MAPS } from '@/lib/maps';
import { SectionBoundary, PanelBoundary, safeArray, safeNumber } from '@/components/ErrorBoundary';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import DesignStudio from '@/components/control/DesignStudio';
import TournamentSetup from '@/components/control/TournamentSetup';
import { useAuth } from '@/lib/AuthContext';
import { OVERLAYS, CopyBtn } from './OverlayLinks';
import {
  ExternalLink,
  Eye, Paintbrush, Settings2, Trophy, Star, Crown,
  Monitor, Copy, Radio, CheckCircle2, ChevronRight,
  Layers, Map, Crosshair, AlertTriangle, LayoutList,
  Download, RefreshCw, Users, Sword, Shield, Flag,
  Zap, Calendar, Mic2, Clock, BarChart2, Play
} from 'lucide-react';

/* ─────────────────────────────────────────
   SCREEN DEFINITIONS
───────────────────────────────────────── */


export default function DirectorPanel() {
  const { data, loading, refresh } = useOverlayData(true);
  const [activeTab, setActiveTab] = useState('overlay');
  const [busy, setBusy] = useState(null);
  const [mapSelect, setMapSelect] = useState('Bermuda');
  const [refreshing, setRefreshing] = useState(false);
  const { shareToken } = useAuth();
  const [copied, setCopied] = useState(null);

  const state = data?.overlayState || {};
  const currentScreen = state.current_screen || 'setup_blank';
  const currentMatch = data?.currentMatch;
  const tournament = data?.tournament;
  const teams = data?.teams || [];
  const players = data?.players || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Overlay state synchronized!');
  };

  const handleCopyOBS = () => {
    const url = `${window.location.origin}/overlay`;
    navigator.clipboard.writeText(url);
    toast.success('OBS Source URL copied!');
  };

  // Match control actions
  const startMatch = async () => {
    const nextNum = (tournament?.current_match_number || 0) + 1;
    setBusy('start_match');
    try {
      await overlayApi.startNextMatch({ tournament_id: tournament?.id, map_name: mapSelect });
      toast.success(`Match #${nextNum} on ${mapSelect} Started!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const setMatchStatus = async (status) => {
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy('match_status');
    try {
      await overlayApi.updateMatchState({ match_id: currentMatch.id, state: status });
      toast.success(`Match status updated to ${status}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  // MVP actions
  const [mvpBusy, setMvpBusy] = useState(null);
  const [mvpResult, setMvpResult] = useState(null);
  const storedMvp = state.mvp_player_name ? {
    player_id: state.mvp_player_id,
    name: state.mvp_player_name,
    team: state.mvp_team_name,
    kills: state.mvp_kills,
  } : null;
  const mvp = mvpResult?.mvp || storedMvp;

  const calculateMVP = async () => {
    if (!currentMatch?.id) return toast.error('No active match');
    setMvpBusy('calc');
    try {
      const r = await overlayApi.calculateMVP({ match_id: currentMatch.id });
      setMvpResult(r);
      if (r.mvp) toast.success(`Calculated MVP: ${r.mvp.name} (${r.mvp.kills} kills)`);
      else toast('No kills logged in this match yet', { icon: '⚠️' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMvpBusy(null);
    }
  };

  const triggerMVPOverlay = async () => {
    if (!mvp?.player_id) return toast.error('Calculate MVP first!');
    if (!currentMatch?.id) return toast.error('No active match — start a match first');
    setMvpBusy('show');
    try {
      await overlayApi.setMVPAndShowScreen({
        player_id:   mvp.player_id,
        player_name: mvp.name   || '',
        team_name:   mvp.team   || '',
        kills:       mvp.kills  || 0,
        match_id:    currentMatch.id,
      });
      toast.success('🏆 MVP screen is now LIVE on overlay!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMvpBusy(null);
    }
  };

  // Champions Reveal actions
  const [champBusy, setChampBusy] = useState(null);
  const sortedTeams = [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));

  const revealChampions = async (team) => {
    setChampBusy(team.id);
    try {
      await overlayApi.setChampionAndShowScreen({
        team_id: team.id,
        team_name: team.name,
        total_points: team.total_tournament_points || 0,
      });
      toast.success(`🏆 ${team.name} revealed as Champions!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChampBusy(null);
    }
  };

  const declareTournamentFinished = async () => {
    if (!tournament?.id) return toast.error('No active tournament');
    setChampBusy('declare');
    try {
      await overlayApi.declareChampions({ tournament_id: tournament.id });
      toast.success('BOOYAH! Champions declared and final standings updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChampBusy(null);
    }
  };

  const handleDownloadJSON = () => {
    const payload = { tournament, teams, players, overlayState: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booyah-tournament-${tournament?.id || 'export'}.json`;
    a.click();
    toast.success('Tournament JSON exported!');
  };

  const handleCopyToClipboard = () => {
    const payload = { tournament, teams, players };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success('Export data copied to clipboard!');
  };

  // Overlay Links functions and state duplicated for inline render
  const base = window.location.origin;
  const overlayUrl = (screen) =>
    shareToken
      ? `${base}/overlay/${screen}?token=${shareToken}`
      : `${base}/overlay/${screen}`;

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success('Copied!');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const transparentOverlays = OVERLAYS.filter(o => o.transparent);
  const solidOverlays = OVERLAYS.filter(o => !o.transparent);

  return (
    <div className="flex h-full flex-col bg-[#09090f] text-white">
      {/* ─────────────────────────────────────────
         TOP HEADER BAR — 64px
      ───────────────────────────────────────── */}
      <header className="flex h-16 items-center justify-between border-b border-[rgba(255,107,0,0.2)] bg-[#0c0c18] px-5 flex-shrink-0 relative">
        {/* Left: Tournament name */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-[4px] bg-[#FF6B00]" />
          <div className="leading-none">
            <h1 className="font-orbitron text-sm font-black uppercase tracking-wider text-white">
              {tournament?.name || 'CHAMPIONSHIP TOUR'}
            </h1>
            <p className="font-orbitron text-[9px] font-bold text-gray-500 tracking-widest mt-1">
              MATCH {(tournament?.current_match_number || 0) + 1} // ACTIVE
            </p>
          </div>
        </div>

        {/* Center: Live indicator pill */}
        <div className="flex items-center gap-2 rounded-full border border-[rgba(255,107,0,0.4)] bg-[#09090f] px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B00]"></span>
          </span>
          <span className="font-orbitron text-[10px] font-black tracking-widest text-[#FF6B00]">
            LIVE: {currentScreen.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyOBS}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#13131f] px-3.5 py-2 font-orbitron text-[10px] font-black tracking-widest text-white hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/10 transition-all"
          >
            <Copy className="h-3.5 w-3.5 text-[#FF6B00]" />
            COPY OBS SOURCE
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#13131f] text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#FF6B00]' : ''}`} />
          </button>
        </div>

        {/* Bottom edge gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#FF6B00] via-transparent to-[#00D4FF]" />
      </header>

      {/* ─────────────────────────────────────────
         TAB BAR — 44px
      ───────────────────────────────────────── */}
      <nav className="flex h-11 border-b border-white/5 bg-[#0c0c18] flex-shrink-0">
        {[
          { id: 'overlay', label: 'OVERLAY', icon: Monitor },
          { id: 'match', label: 'MATCH', icon: Map },
          { id: 'standings', label: 'STANDINGS', icon: Trophy },
          { id: 'design', label: 'DESIGN', icon: Paintbrush },
          { id: 'setup', label: 'SETUP', icon: Settings2 },
        ].map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-6 font-orbitron text-[11px] font-black tracking-[0.15em] transition-all relative border-r border-white/5"
              style={
                isActive
                  ? {
                      color: '#FF6B00',
                      background: 'rgba(255,107,0,0.05)',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6B00]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────
         CONTENT AREA — flex-1 (Scrollable)
      ───────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading && (
          <div className="flex h-40 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#FF6B00]" />
          </div>
        )}

        {!loading && (
          <>
            {/* OVERLAY TAB */}
            {activeTab === 'overlay' && (
              <SectionBoundary label="OVERLAY LINKS">
                <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                  {/* OBS Setup Tip */}
                  <div className="rounded-xl border border-[#FF6B00]/20 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
                    <p className="font-orbitron text-[10px] font-black text-[#FF6B00] tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-[#FF6B00] rounded-full animate-pulse" />
                      OBS SETUP — DO THIS ONCE PER SOURCE
                    </p>
                    <div className="space-y-1.5 text-xs text-gray-400">
                      <p>1. OBS → <span className="text-white font-bold">Add → Browser Source</span> → paste the URL below</p>
                      <p>2. Width: <span className="text-white font-bold font-mono">1920</span> · Height: <span className="text-white font-bold font-mono">1080</span></p>
                      <p>3. For transparent overlays: enable <span className="text-white font-bold">Custom CSS</span> → <code className="text-[#00D4FF] font-mono">body {'{ background: transparent !important; }'}</code></p>
                      <p>4. Uncheck <span className="text-white font-bold">"Shutdown source when not visible"</span></p>
                    </div>
                  </div>

                  {/* Your Share Token */}
                  {shareToken && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
                      <p className="font-orbitron text-[10px] font-black text-gray-400 tracking-wider mb-2">YOUR UNIQUE SHARE TOKEN</p>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 truncate rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-mono text-xs text-[#00D4FF]">{shareToken}</code>
                        <CopyBtn text={shareToken} id="token" copied={copied} onCopy={copy} />
                      </div>
                    </div>
                  )}

                  {/* Transparent Overlays */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1.5 w-1.5 bg-[#00D4FF] rounded-full animate-pulse" />
                      <span className="font-orbitron text-[10px] font-black text-[#00D4FF] tracking-widest">TRANSPARENT — LAYER OVER GAMEPLAY</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {transparentOverlays.map((ov) => {
                        const url = overlayUrl(ov.id);
                        const Icon = ov.icon;
                        return (
                          <div
                            key={ov.id}
                            className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-[12px] p-4 hover:border-[#00D4FF]/30 hover:shadow-[0_0_15px_rgba(0,212,255,0.05)] transition-all group"
                          >
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 group-hover:bg-[#00D4FF]/20 transition-all">
                                  <Icon className="h-4 w-4 text-[#00D4FF]" />
                                </div>
                                <div>
                                  <h3 className="font-orbitron text-xs font-black text-white tracking-wider">{ov.label}</h3>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{ov.desc}</p>
                                </div>
                              </div>
                              <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-2 font-mono text-[10px] text-[#00D4FF]/80 truncate">
                                {url}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                              <span className="font-orbitron text-[9px] font-bold text-gray-500 tracking-wider">1920×1080</span>
                              <div className="flex gap-2">
                                <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all"
                                  title="Open Link"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-8 px-3 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/30 transition-all font-orbitron text-[9px] font-black tracking-wider"
                                >
                                  <Play className="h-3 w-3 mr-1" /> TEST
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Solid Scene Overlays */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1.5 w-1.5 bg-[#FF6B00] rounded-full animate-pulse" />
                      <span className="font-orbitron text-[10px] font-black text-[#FF6B00] tracking-widest">FULL SCENE — REPLACE ENTIRE SCREEN</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {solidOverlays.map((ov) => {
                        const url = overlayUrl(ov.id);
                        const Icon = ov.icon;
                        return (
                          <div
                            key={ov.id}
                            className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-[12px] p-4 hover:border-[#FF6B00]/30 hover:shadow-[0_0_15px_rgba(255,107,0,0.05)] transition-all group"
                          >
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20 group-hover:bg-[#FF6B00]/20 transition-all">
                                  <Icon className="h-4 w-4 text-[#FF6B00]" />
                                </div>
                                <div>
                                  <h3 className="font-orbitron text-xs font-black text-white tracking-wider">{ov.label}</h3>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{ov.desc}</p>
                                </div>
                              </div>
                              <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-2 font-mono text-[10px] text-[#FF6B00]/80 truncate">
                                {url}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                              <span className="font-orbitron text-[9px] font-bold text-gray-500 tracking-wider">1920×1080</span>
                              <div className="flex gap-2">
                                <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#FF6B00] hover:border-[#FF6B00]/30 transition-all"
                                  title="Open Link"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-8 px-3 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/30 transition-all font-orbitron text-[9px] font-black tracking-wider"
                                >
                                  <Play className="h-3 w-3 mr-1" /> TEST
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SectionBoundary>
            )}

            {/* MATCH TAB */}
            {activeTab === 'match' && (
              <SectionBoundary label="MATCH CONTROL">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                  <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Zap className="h-5 w-5 text-[#FF6B00]" />
                    <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                      MATCH CONTROL
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-orbitron text-[9px] font-black text-gray-400 tracking-wider mb-2">
                        SELECT NEXT MATCH MAP
                      </label>
                      <select
                        value={mapSelect}
                        onChange={(e) => setMapSelect(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 font-orbitron text-xs text-white focus:border-[#FF6B00] focus:outline-none"
                      >
                        {MAPS.map((m) => (
                          <option key={m} value={m}>
                            {m.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        disabled={busy === 'start_match'}
                        onClick={startMatch}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-3 font-orbitron text-[11px] font-black tracking-wider text-white hover:bg-[#ff8533] disabled:opacity-50 transition-all"
                      >
                        <Play className="h-4 w-4" />
                        START MATCH #{ (tournament?.current_match_number || 0) + 1 }
                      </button>
                    </div>
                  </div>
                </div>

                {currentMatch && (
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                        <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                          LIVE MATCH STATE
                        </h2>
                      </div>
                      <span className="font-orbitron text-[9px] font-bold text-gray-500">
                        ID: {currentMatch.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-black/20 p-4 border border-white/5">
                        <p className="font-orbitron text-[9px] font-bold text-gray-400 tracking-wider mb-1">MAP</p>
                        <p className="font-orbitron text-sm font-black text-white">{currentMatch.map_name?.toUpperCase()}</p>
                      </div>
                      <div className="rounded-lg bg-black/20 p-4 border border-white/5">
                        <p className="font-orbitron text-[9px] font-bold text-gray-400 tracking-wider mb-1">STATUS</p>
                        <p className="font-orbitron text-sm font-black text-[#FF6B00]">{currentMatch.state?.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {['warmup', 'ongoing', 'completed'].map((st) => {
                        const isCurrent = currentMatch.state === st;
                        return (
                          <button
                            key={st}
                            disabled={busy === 'match_status'}
                            onClick={() => setMatchStatus(st)}
                            className="flex-1 min-w-[120px] rounded-lg border px-4 py-2.5 font-orbitron text-[10px] font-black tracking-wider transition-all"
                            style={
                              isCurrent
                                ? {
                                    borderColor: '#FF6B00',
                                    backgroundColor: 'rgba(255,107,0,0.1)',
                                    color: '#FF6B00',
                                  }
                                : {
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    backgroundColor: 'transparent',
                                    color: 'rgba(255,255,255,0.6)',
                                  }
                            }
                          >
                            SET {st.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MVP CONTROL */}
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                  <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Star className="h-5 w-5 text-[#FF6B00]" />
                    <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                      MVP REVEAL CONTROL
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <button
                        onClick={calculateMVP}
                        disabled={mvpBusy === 'calc' || !currentMatch}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-orbitron text-[10px] font-black tracking-wider text-white hover:bg-white/10 disabled:opacity-50"
                      >
                        {mvpBusy === 'calc' ? 'CALCULATING...' : '1. CALCULATE LIVE MVP'}
                      </button>

                      <button
                        onClick={triggerMVPOverlay}
                        disabled={mvpBusy === 'show' || !mvp}
                        className="flex-1 rounded-lg bg-[#FF6B00] px-4 py-3 font-orbitron text-[10px] font-black tracking-wider text-white hover:bg-[#ff8533] disabled:opacity-50"
                      >
                        {mvpBusy === 'show' ? 'SENDING...' : '2. TRIGGER MVP OVERLAY'}
                      </button>
                    </div>

                    {mvp && (
                      <div className="rounded-lg border border-[#FF6B00]/20 bg-[#FF6B00]/5 p-4 flex items-center justify-between">
                        <div>
                          <p className="font-orbitron text-[9px] text-[#FF6B00] font-black tracking-widest">CALCULATED MVP</p>
                          <p className="font-orbitron text-base font-black text-white mt-1">{mvp.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{mvp.team} — {mvp.kills} Total Kills</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20">
                          <Star className="h-5 w-5 text-[#FF6B00]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CHAMPIONS REVEAL */}
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                  <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Crown className="h-5 w-5 text-[#FF6B00]" />
                    <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                      CHAMPION REVEAL
                    </h2>
                  </div>

                  <p className="text-xs text-gray-400 mb-4">
                    Reveal the tournament champions on stream. Select a team to trigger the full-screen Champion animation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {sortedTeams.map((t, idx) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-2.5">
                        <div>
                          <p className="font-orbitron text-[10px] font-black text-white">#{idx+1} {t.name}</p>
                          <p className="text-[9px] text-gray-500">{t.total_tournament_points || 0} pts</p>
                        </div>
                        <button
                          disabled={champBusy === t.id}
                          onClick={() => revealChampions(t)}
                          className="rounded bg-[#FF6B00] px-2.5 py-1.5 font-orbitron text-[9px] font-black tracking-wider text-white hover:bg-[#ff8533]"
                        >
                          {champBusy === t.id ? 'REVEALING...' : 'REVEAL'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    <button
                      disabled={champBusy === 'declare'}
                      onClick={declareTournamentFinished}
                      className="w-full rounded-lg border border-[#FF6B00]/40 bg-[#FF6B00]/10 py-3 font-orbitron text-[10px] font-black tracking-wider text-[#FF6B00] hover:bg-[#FF6B00]/20 transition-all"
                    >
                      {champBusy === 'declare' ? 'CALCULATING STANDINGS...' : 'OFFICIALLY DECLARE CHAMPIONS & LOCK STANDINGS'}
                    </button>
                  </div>
                </div>

              </div>
              </SectionBoundary>
            )}

            {/* STANDINGS TAB */}
            {activeTab === 'standings' && (
              <SectionBoundary label="STANDINGS & LEADERBOARD">
                <div className="max-w-4xl mx-auto rounded-xl border border-white/5 bg-[#0f0f1a] overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/10">
                    <div>
                      <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                        LIVE LEADERBOARD
                      </h2>
                      <p className="font-orbitron text-[9px] text-gray-500 mt-1">REAL-TIME TOURNAMENT STANDINGS</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-black/20 font-orbitron text-[9px] font-black tracking-widest text-gray-400">
                          <th className="py-3 px-4 text-center">POS</th>
                          <th className="py-3 px-4">TEAM</th>
                          <th className="py-3 px-4 text-center">MATCHES</th>
                          <th className="py-3 px-4 text-center">BOOYAH</th>
                          <th className="py-3 px-4 text-center">KILLS</th>
                          <th className="py-3 px-4 text-center">POINTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {sortedTeams.map((team, index) => (
                          <tr key={team.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 text-center font-orbitron font-black text-gray-400">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 font-orbitron font-black text-white">
                              {team.name}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-400 font-mono">
                              {team.matches_played || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#FF6B00]">
                              {team.booyah_count || 0}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-400 font-mono">
                              {team.kill_points || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-[#00D4FF]">
                              {team.total_tournament_points || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionBoundary>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <SectionBoundary label="OVERLAY DESIGN STUDIO">
                <DesignStudio overlayState={state} />
              </SectionBoundary>
            )}

            {/* SETUP TAB */}
            {activeTab === 'setup' && (
              <SectionBoundary label="TOURNAMENT CONFIGURATION">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* JSON Import/Export Actions */}
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-[#FF6B00]" />
                        <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                          BACKUP & PORT DATA
                        </h2>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-6">
                      Download the entire tournament database (teams, matches, overlay states, players) as a single JSON file. You can restore this file on any machine or use it as a backup.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleDownloadJSON}
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-3 font-orbitron text-[11px] font-black tracking-wider text-white hover:bg-[#ff8533] transition-all"
                      >
                        <Download className="h-4 w-4" />
                        EXPORT TOURNAMENT JSON
                      </button>
                      <button
                        onClick={handleCopyToClipboard}
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-orbitron text-[11px] font-black tracking-wider text-white hover:bg-white/10 transition-all"
                      >
                        <Copy className="h-4 w-4" />
                        COPY TO CLIPBOARD
                      </button>
                    </div>
                  </div>

                  {/* Tournament setup form */}
                  <TournamentSetup />
                </div>
              </SectionBoundary>
            )}
          </>
        )}
      </main>
    </div>
  );
}
