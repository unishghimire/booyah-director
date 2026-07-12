import { MAP_IMAGES, MAPS } from '@/lib/maps';
import { SectionBoundary, PanelBoundary, safeArray, safeNumber } from '@/components/ErrorBoundary';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import DesignStudio from '@/components/control/DesignStudio';
import TournamentSetup from '@/components/control/TournamentSetup';
import {
  ExternalLink,
  Eye, Paintbrush, Settings2, Trophy, Star, Crown,
  Monitor, Copy, Radio, CheckCircle2, ChevronRight,
  Layers, Map, Crosshair, AlertTriangle, LayoutList,
  Download, RefreshCw, Users, Sword, Shield, Flag,
  Zap, Calendar, Mic2, Clock, BarChart2
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
    setMvpBusy('show');
    try {
      await overlayApi.setMVPAndShowScreen({
        player_id: mvp.player_id,
        player_name: mvp.name,
        team_name: mvp.team,
        kills: mvp.kills,
      });
      toast.success('MVP screen is now LIVE on overlay!');
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
  <div className="h-full flex items-center justify-center py-12">
    <div className="text-center max-w-md bg-[#0f0f1a] border border-white/5 rounded-2xl p-8 shadow-2xl">
      <Monitor className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
      <h2 className="font-orbitron text-lg font-black text-white mb-2">OVERLAY SOURCES</h2>
      <p className="font-orbitron text-[10px] text-gray-500 mb-6 leading-relaxed">
        Each overlay is now a dedicated URL. Add them directly to OBS as Browser Sources at 1920×1080.
      </p>
      <a
        href="/overlay-links"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-orbitron text-[11px] font-black text-white tracking-wider"
        style={{ background: 'linear-gradient(135deg, #00D4FF, #0099bb)' }}
      >
        <ExternalLink className="w-4 h-4" /> VIEW ALL OVERLAY LINKS
      </a>
    </div>
  </div>
)}

            {/* MATCH TAB */}
            {activeTab === 'match' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                  <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Zap className="h-5 w-5 text-[#FF6B00]" />
                    <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                      MATCH CONTROL
                    </h2>
                  </div>

                  {/* Current match info display */}
                  <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Current Match
                      </p>
                      <p className="font-orbitron text-lg font-black text-[#FF6B00] mt-1">
                        {currentMatch ? `MATCH #${currentMatch.match_number}` : 'NO ACTIVE MATCH'}
                      </p>
                    </div>
                    {currentMatch && (
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            Map
                          </p>
                          <p className="font-orbitron text-sm font-black text-white mt-0.5">
                            {currentMatch.map_name || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            Status
                          </p>
                          <span className="inline-block rounded px-2.5 py-0.5 text-[9px] font-orbitron font-black tracking-widest bg-[#10b981]/20 text-[#10b981] mt-1 border border-[#10b981]/30">
                            {currentMatch.state?.toUpperCase() || 'PRE-MATCH'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Map selector */}
                  <div className="mb-6">
                    <p className="font-orbitron text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2.5">
                      Select Next Map
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {MAPS.map(m => (
                        <button 
                          key={m}
                          onClick={() => setMapSelect(m)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-[11px] font-orbitron ${
                            mapSelect === m 
                              ? 'border-[#FF6B00]/60 bg-[#FF6B00]/15 text-[#FF6B00]' 
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <img 
                            src={MAP_IMAGES?.[m] || ''} 
                            alt={m} 
                            style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                            onError={e => e.target.style.display='none'}
                          />
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start match / Pill group */}
                  <div className="space-y-4">
                    <button
                      onClick={startMatch}
                      disabled={busy !== null}
                      className="w-full rounded-lg bg-gradient-to-r from-[#10b981] to-[#059669] py-4 font-orbitron text-xs font-black tracking-widest text-white shadow-[0_0_16px_rgba(16,185,129,0.2)] hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {busy === 'start_match'
                        ? 'CREATING MATCH...'
                        : `START MATCH #${(tournament?.current_match_number || 0) + 1}`}
                    </button>

                    <div className="flex items-center gap-2">
                      {['pre_match', 'live', 'ended'].map((status) => {
                        const isCurrent = currentMatch?.state === status;
                        return (
                          <button
                            key={status}
                            onClick={() => setMatchStatus(status)}
                            disabled={busy !== null || !currentMatch?.id}
                            className={`flex-1 rounded-md py-2.5 font-orbitron text-[10px] font-black tracking-widest transition-all border ${
                              isCurrent
                                ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]'
                                : 'bg-[#13131f] border-white/5 text-gray-500 hover:text-white'
                            } disabled:opacity-30`}
                          >
                            {status.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STANDINGS TAB */}
            {activeTab === 'standings' && (
              <div className="rounded-xl border border-white/5 bg-[#0f0f1a] overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-[#FFB800]">
                    LIVE STANDINGS
                  </h2>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">
                    Sorted by total tournament points
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {sortedTeams.length === 0 ? (
                    <div className='py-16 text-center text-gray-600 font-orbitron text-xs'>NO TEAMS REGISTERED YET</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 font-orbitron text-[9px] font-black tracking-widest bg-black/20">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">LOGO</th>
                        <th className="py-3 px-4">TEAM</th>
                        <th className="py-3 px-4 text-center">KILLS</th>
                        <th className="py-3 px-4 text-center">BOOYAH</th>
                        <th className="py-3 px-4 text-right">TOTAL PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {safeArray(sortedTeams).map((team, idx) => {
                        const isTop = idx === 0;
                        return (
                          <tr
                            key={team.id}
                            className={`hover:bg-white/[0.01] transition-all text-xs font-semibold ${
                              isTop ? 'bg-[#FFB800]/5 text-[#FFB800]' : 'text-gray-300'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold">{idx + 1}</td>
                            <td className="py-3 px-4">
                              {team.logo_url ? (
                                <img
                                  src={team.logo_url}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover border border-white/10"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center font-orbitron text-[8px] font-black">
                                  {team.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-orbitron font-bold tracking-wide">
                              {team.name}
                            </td>
                            <td className="py-3 px-4 text-center font-mono tabular-nums">
                              {team.total_tournament_kills || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-mono tabular-nums">
                              {team.booyahs || 0}
                            </td>
                            <td className="py-3 px-4 text-right font-orbitron font-black text-[#FF6B00] tracking-wide tabular-nums">
                              {team.total_tournament_points || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  )}
                </div>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <SectionBoundary label="DESIGN STUDIO">
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                  <DesignStudio />
                </div>
              </SectionBoundary>
            )}

            {/* SETUP TAB */}
            {activeTab === 'setup' && (
              <SectionBoundary label="TOURNAMENT SETUP">
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
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
