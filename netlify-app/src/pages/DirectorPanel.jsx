import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import DesignStudio from '@/components/control/DesignStudio';
import TournamentSetup from '@/components/control/TournamentSetup';
import {
  Eye, Paintbrush, Settings2, Trophy, Star, Crown,
  Monitor, Copy, Radio, CheckCircle2, ChevronRight,
  Layers, Map, Crosshair, AlertTriangle, LayoutList,
  Download, RefreshCw, Users, Sword, Shield, Flag,
  Zap, Calendar, Mic2, Clock, BarChart2
} from 'lucide-react';

/* ─────────────────────────────────────────
   SCREEN DEFINITIONS
───────────────────────────────────────── */
const SCREENS = [
  { key: 'setup_blank',        label: 'BLANK',         icon: Monitor,       color: '#ef4444', desc: 'Idle / black screen' },
  { key: 'pre_match_map',      label: 'MAP INTRO',      icon: Map,           color: '#3b82f6', desc: 'Map name + team list' },
  { key: 'ff_scoreboard',      label: 'FF BOARD',       icon: LayoutList,    color: '#FF6B00', desc: 'FF-style ranked table (LIVE)' },
  { key: 'scoreboard',         label: 'STANDINGS',      icon: Trophy,        color: '#FFB800', desc: 'Full tournament standings' },
  { key: 'kill_feed',          label: 'KILL FEED',      icon: Crosshair,     color: '#00D4FF', desc: 'Recent kill events list' },
  { key: 'elimination_alert',  label: 'ELIM ALERT',     icon: AlertTriangle, color: '#ef4444', desc: 'Last elimination pop-up' },
  { key: 'todays_matches',     label: 'TODAY\'S MATCHES',icon: Calendar,     color: '#06b6d4', desc: 'All matches of the day' },
  { key: 'teams_today',        label: 'TEAMS TODAY',    icon: Users,         color: '#8b5cf6', desc: 'Competing teams roster' },
  { key: 'casters',            label: 'CASTERS',        icon: Mic2,          color: '#10b981', desc: 'Caster / host info' },
  { key: 'upcoming_map',       label: 'UPCOMING MAP',   icon: Flag,          color: '#0ea5e9', desc: 'Next map announcement' },
  { key: 'mvp',                label: 'MVP',            icon: Star,          color: '#a855f7', desc: 'MVP of the match' },
  { key: 'champions',          label: 'BOOYAH!',        icon: Crown,         color: '#FFB800', desc: 'Champions reveal' },
];

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

  const handleSwitchScreen = async (key) => {
    setBusy(key);
    try {
      await overlayApi.updateScreen(key);
      toast.success(`Screen switched to ${key.replace(/_/g, ' ').toUpperCase()}`);
    } catch (err) {
      toast.error(err.message || 'Error switching screen');
    } finally {
      setBusy(null);
    }
  };

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
    const nextNum = (state.match_count || 0) + 1;
    setBusy('start_match');
    try {
      await overlayApi.startNewMatch({ map: mapSelect, match_number: nextNum });
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
      await overlayApi.updateMatchStatus({ match_id: currentMatch.id, status });
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
              MATCH {(state.match_count || 0) + 1} // ACTIVE
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
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column (5/12) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                  {/* SCENE SWITCHER PANEL */}
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-white">
                          SCENE SWITCHER
                        </h2>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                          Click to go LIVE instantly
                        </p>
                      </div>
                      <Monitor className="h-4 w-4 text-[#FF6B00]" />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {SCREENS.map((s) => {
                        const Icon = s.icon;
                        const isActive = currentScreen === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={() => handleSwitchScreen(s.key)}
                            disabled={busy !== null}
                            className="group relative flex flex-col items-center justify-between rounded-lg border p-3 text-center transition-all min-h-[100px] bg-white/[0.02]"
                            style={
                              isActive
                                ? {
                                    borderColor: '#FF6B00',
                                    background: 'rgba(255,107,0,0.15)',
                                    boxShadow: '0 0 16px rgba(255,107,0,0.3)',
                                  }
                                : {
                                    borderColor: 'rgba(255,255,255,0.07)',
                                  }
                            }
                          >
                            {/* ACTIVE badge top-right */}
                            {isActive && (
                              <span className="absolute right-1.5 top-1.5 flex items-center gap-1 bg-[#ef4444] px-1 py-0.5 rounded-[3px] scale-75 origin-top-right">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                <span className="font-orbitron text-[8px] font-black text-white">LIVE</span>
                              </span>
                            )}

                            <Icon
                              className="h-5 w-5 mb-1"
                              style={{ color: isActive ? '#FF6B00' : s.color }}
                            />
                            <div>
                              <p className="font-orbitron text-[9px] font-black tracking-wider text-white">
                                {s.label}
                              </p>
                              <p className="text-[8px] text-gray-500 mt-0.5 leading-tight truncate max-w-[85px]">
                                {s.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* OBS SETUP BOX */}
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-[#FF6B00] mb-3">
                      OBS BROWSER SOURCE
                    </h3>
                    <div className="flex items-center gap-2 rounded-lg bg-black/40 p-2.5 border border-white/5 mb-4">
                      <span className="font-mono text-[10px] text-gray-400 truncate flex-1">
                        {window.location.origin}/overlay
                      </span>
                      <button
                        onClick={handleCopyOBS}
                        className="flex h-7 w-7 items-center justify-center rounded bg-[#13131f] border border-white/10 hover:border-[#FF6B00]/40 text-white transition-all"
                      >
                        <Copy className="h-3.5 w-3.5 text-[#FF6B00]" />
                      </button>
                    </div>
                    <ul className="space-y-1.5 text-[10px] text-gray-500 list-disc list-inside">
                      <li>Set resolution to 1920x1080</li>
                      <li>Check "Shutdown source when not visible"</li>
                      <li>Check "Refresh browser when scene becomes active"</li>
                    </ul>
                  </div>
                </div>

                {/* Right Column (7/12) */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                  {/* MVP CONTROL PANEL */}
                  <div className="rounded-xl border border-[rgba(168,85,247,0.4)] bg-[#0f0f1a] p-5">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-purple-400">
                          MVP CONTROL
                        </h2>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                          Manage & highlight match MVP live
                        </p>
                      </div>
                      <Star className="h-4 w-4 text-purple-400 animate-pulse" />
                    </div>

                    {mvp ? (
                      <div className="mb-4 flex items-center gap-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 font-orbitron text-sm font-black text-white border border-purple-400">
                          {(mvp.name || '??').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-orbitron text-sm font-black text-purple-300 truncate">
                            {mvp.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
                            {mvp.team}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-orbitron text-2xl font-black text-[#FF6B00] tabular-nums">
                            {mvp.kills}
                          </p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
                            KILLS
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 flex items-center justify-center rounded-xl border border-dashed border-white/10 py-8">
                        <p className="text-xs text-gray-600 font-medium">
                          No MVP calculated yet. Run calculation below!
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={calculateMVP}
                        disabled={mvpBusy !== null}
                        className="flex-1 rounded-lg border border-purple-500/30 bg-purple-600/10 py-3 font-orbitron text-[10px] font-black tracking-wider text-purple-300 hover:bg-purple-600/20 transition-all disabled:opacity-50"
                      >
                        {mvpBusy === 'calc' ? 'CALCULATING...' : '⟳ CALCULATE MVP'}
                      </button>
                      <button
                        onClick={triggerMVPOverlay}
                        disabled={mvpBusy !== null || !mvp?.player_id}
                        className="flex-1 rounded-lg bg-purple-600 py-3 font-orbitron text-[10px] font-black tracking-wider text-white hover:bg-purple-500 transition-all disabled:opacity-50"
                      >
                        {mvpBusy === 'show' ? 'SENDING LIVE...' : 'SET LIVE MVP'}
                      </button>
                    </div>
                  </div>

                  {/* CHAMPIONS CONTROL PANEL */}
                  <div className="rounded-xl border border-[rgba(255,184,0,0.4)] bg-[#0f0f1a] p-5">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h2 className="font-orbitron text-xs font-black tracking-[0.25em] text-[#FFB800]">
                          CHAMPIONS REVEAL
                        </h2>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                          Crown the ultimate championship team
                        </p>
                      </div>
                      <Crown className="h-4 w-4 text-[#FFB800] animate-bounce" />
                    </div>

                    {/* Rankings list */}
                    <div className="space-y-2 mb-5">
                      {sortedTeams.slice(0, 3).map((team, idx) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                          <div
                            key={team.id}
                            className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm">{medals[idx]}</span>
                              <div>
                                <p className="font-orbitron text-[11px] font-black text-white">
                                  {team.name}
                                </p>
                                <p className="text-[9px] text-gray-500 font-bold mt-0.5">
                                  PTS: {team.total_tournament_points || 0} | KILLS:{' '}
                                  {team.total_tournament_kills || 0}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => revealChampions(team)}
                              disabled={champBusy !== null}
                              className="rounded bg-[#FFB800] hover:bg-[#FFA500] px-3.5 py-1.5 font-orbitron text-[9px] font-black text-black tracking-wider transition-all disabled:opacity-50"
                            >
                              {champBusy === team.id ? 'REVEALING...' : 'REVEAL'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={declareTournamentFinished}
                      disabled={champBusy !== null}
                      className="w-full rounded-lg bg-gradient-to-r from-[#FFB800] to-[#FFA500] py-3.5 font-orbitron text-[11px] font-black tracking-widest text-black hover:brightness-115 transition-all disabled:opacity-50"
                    >
                      {champBusy === 'declare' ? 'DECLARING...' : 'DECLARE CHAMPIONS & END EVENT'}
                    </button>
                  </div>

                  {/* EXPORT / DATA PANEL */}
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-white mb-4">
                      EXPORT / DATA PANEL
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                        <p className="font-orbitron text-xl font-black text-[#FF6B00] tabular-nums">
                          {teams.length}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold mt-0.5">TEAMS</p>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                        <p className="font-orbitron text-xl font-black text-[#00D4FF] tabular-nums">
                          {players.length}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold mt-0.5">PLAYERS</p>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                        <p className="font-orbitron text-xl font-black text-[#FFB800] tabular-nums">
                          {state.match_count || 0}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold mt-0.5">MATCHES</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={handleDownloadJSON}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-[#13131f] py-2.5 font-orbitron text-[10px] font-black text-white hover:border-[#FF6B00]/40 transition-all"
                      >
                        <Download className="h-3.5 w-3.5 text-[#FF6B00]" />
                        DOWNLOAD JSON
                      </button>
                      <button
                        onClick={handleCopyToClipboard}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-[#13131f] py-2.5 font-orbitron text-[10px] font-black text-white hover:border-[#FF6B00]/40 transition-all"
                      >
                        <Copy className="h-3.5 w-3.5 text-[#FF6B00]" />
                        COPY TO CLIPBOARD
                      </button>
                    </div>
                  </div>
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
                            {currentMatch.map || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            Status
                          </p>
                          <span className="inline-block rounded px-2.5 py-0.5 text-[9px] font-orbitron font-black tracking-widest bg-[#10b981]/20 text-[#10b981] mt-1 border border-[#10b981]/30">
                            {currentMatch.status?.toUpperCase() || 'PRE-MATCH'}
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
                      {['Bermuda', 'Kalahari', 'Purgatory', 'Nexterra'].map((mapName) => (
                        <button
                          key={mapName}
                          onClick={() => setMapSelect(mapName)}
                          className={`px-5 py-2.5 rounded-md font-orbitron text-[11px] font-black tracking-wider transition-all border ${
                            mapSelect === mapName
                              ? 'bg-[#FF6B00] border-[#FF6B00] text-black shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                              : 'bg-[#13131f] border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {mapName.toUpperCase()}
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
                        : `START MATCH #${(state.match_count || 0) + 1}`}
                    </button>

                    <div className="flex items-center gap-2">
                      {['pre_match', 'live', 'ended'].map((status) => {
                        const isCurrent = currentMatch?.status === status;
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
                      {sortedTeams.map((team, idx) => {
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
                </div>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                <DesignStudio />
              </div>
            )}

            {/* SETUP TAB */}
            {activeTab === 'setup' && (
              <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                <TournamentSetup />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
