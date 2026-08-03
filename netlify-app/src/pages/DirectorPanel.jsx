import { MAPS } from '@/lib/maps';
import { SectionBoundary, PanelBoundary } from '@/components/ErrorBoundary';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import DesignStudio from '@/components/control/DesignStudio';
import AssetManager from '@/components/control/AssetManager';
import TournamentManager from '@/components/control/TournamentManager';
import { useAuth } from '@/lib/AuthContext';
import { CopyBtn } from './OverlayLinks';
import { SCREENS, GROUP_LABELS } from '@/components/control/ScreenSwitcher';
import { useObsStore } from '@/lib/obsStore';
import { obsService } from '@/lib/obsWebSocket';
import LiveControlPanel from '@/components/control/LiveControlPanel';
import BroadcastDashboard from '@/components/control/BroadcastDashboard';
import EventTimeline from '@/components/control/EventTimeline';
import ThemeManager from '@/components/control/ThemeManager';
import PlayerManager from '@/components/control/PlayerManager';
import OrsConfigSection from '@/components/control/OrsConfigSection';
import SoundManager from '@/components/control/SoundManager';
import AnimationLibrary from '@/components/control/AnimationLibrary';
import { useUndoRedo } from '@/lib/useUndoRedo';
import { ROLES, getRoleConfig, canAccessTab } from '@/lib/roles';

import {
  ExternalLink, Paintbrush, Settings2, Trophy, Star, Crown,
  Monitor, Copy, Radio, ChevronDown,
  Layers, Map, Volume2, Film,
  Download, RefreshCw, Users,
  Zap, Clock, Play, Activity, Palette,
  RotateCcw, Trash2
} from 'lucide-react';


export default function DirectorPanel() {
  const { data, loading, refresh } = useOverlayData(true);
  const { undo, redo, canUndo, canRedo } = useUndoRedo(data, overlayApi, refresh);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [busy, setBusy] = useState(null);
  const [mapSelect, setMapSelect] = useState('Bermuda');
  const [refreshing, setRefreshing] = useState(false);
  const { shareToken } = useAuth();
  const [copied, setCopied] = useState(null);
  const [previewScreen, setPreviewScreen] = useState(null);
  const [takeBusy, setTakeBusy] = useState(false);
  const [tournamentList, setTournamentList] = useState([]);
  const [showTournamentSwitcher, setShowTournamentSwitcher] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [isOwner, setIsOwner] = useState(false);
  const obsStatus = useObsStore(s => s.connectionStatus);
  const roleConfig = getRoleConfig(userRole, isOwner);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, rRes] = await Promise.all([
          overlayApi.listTournaments(),
          overlayApi.getUserRole(),
        ]);
        if (tRes?.tournaments) setTournamentList(tRes.tournaments);
        if (rRes?.role) setUserRole(rRes.role);
        if (rRes?.isOwner) setIsOwner(true);
      } catch (e) { /* ignore on first load */ }
    })();
  }, []);

  const state = data?.overlayState || {};
  const currentScreen = state.current_screen || 'setup_blank';
  const currentMatch = data?.currentMatch;
  const tournament = data?.tournament;
  const teams = data?.teams || [];
  const players = data?.players || [];
  const standings = data?.standings || [];

  const handleSwitchTournament = async (tid) => {
    try {
      await overlayApi.switchTournament({ tournament_id: tid });
      setShowTournamentSwitcher(false);
      await refresh();
      const tRes = await overlayApi.listTournaments();
      if (tRes?.tournaments) setTournamentList(tRes.tournaments);
      toast.success('Tournament switched!');
    } catch (e) { toast.error('Failed to switch tournament'); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Overlay state synchronized!');
  };

  const handleCopyOBS = () => {
    navigator.clipboard.writeText(`${window.location.origin}/overlay`);
    toast.success('OBS Source URL copied!');
  };

  const handleTake = async () => {
    if (!previewScreen || takeBusy) return;
    setTakeBusy(true);
    try {
      await overlayApi.switchOverlayScreen({ screen: previewScreen });
      if (obsStatus === 'connected') {
        const screen = SCREENS.find(s => s.key === previewScreen);
        if (screen) { try { await obsService.takeScene(screen.label); } catch (e) { console.warn('OBS scene switch failed:', e.message); } }
      }
      toast.success(`>> ${previewScreen.replace(/_/g, ' ').toUpperCase()} is now LIVE!`);
      setPreviewScreen(null);
      refresh();
    } catch (err) { toast.error(err.message); } finally { setTakeBusy(false); }
  };

  const startMatch = async () => {
    const nextNum = (tournament?.current_match_number || 0) + 1;
    setBusy('start_match');
    try {
      await overlayApi.startNextMatch({ tournament_id: tournament?.id, map_name: mapSelect });
      toast.success(`Match #${nextNum} on ${mapSelect} Started!`);
    } catch (err) { toast.error(err.message); } finally { setBusy(null); }
  };

  const setMatchStatus = async (status) => {
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy('match_status');
    try {
      await overlayApi.updateMatchState({ match_id: currentMatch.id, state: status });
      toast.success(`Match status updated to ${status}`);
    } catch (err) { toast.error(err.message); } finally { setBusy(null); }
  };

  const [mvpBusy, setMvpBusy] = useState(null);
  const [mvpResult, setMvpResult] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const tabKeys = { '1': 'dashboard', '2': 'live', '3': 'overlay', '4': 'match', '5': 'standings', '6': 'players', '7': 'design', '8': 'theme', '9': 'assets', 's': 'sound', 'a': 'animations', '-': 'timeline', '=': 'setup' };
      if (tabKeys[key]) { e.preventDefault(); setActiveTab(tabKeys[key]); return; }
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); if (canRedo) redo(); return; }
      if (key === 'r') { e.preventDefault(); refresh(); return; }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const storedMvp = state.mvp_player_name ? {
    player_id: state.mvp_player_id, name: state.mvp_player_name, team: state.mvp_team_name, kills: state.mvp_kills,
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
    } catch (err) { toast.error(err.message); } finally { setMvpBusy(null); }
  };

  const triggerMVPOverlay = async () => {
    if (!mvp?.player_id) return toast.error('Calculate MVP first!');
    if (!currentMatch?.id) return toast.error('No active match');
    setMvpBusy('show');
    try {
      await overlayApi.setMVPAndShowScreen({
        player_id: mvp.player_id, player_name: mvp.name || '', team_name: mvp.team || '', kills: mvp.kills || 0, match_id: currentMatch.id,
      });
      toast.success('🏆 MVP screen is now LIVE on overlay!');
    } catch (err) { toast.error(err.message); } finally { setMvpBusy(null); }
  };

  const [champBusy, setChampBusy] = useState(null);
  const sortedTeams = [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));

  const revealChampions = async (team) => {
    setChampBusy(team.id);
    try {
      await overlayApi.setChampionAndShowScreen({ team_id: team.id, team_name: team.name, total_points: team.total_tournament_points || 0 });
      toast.success(`🏆 ${team.name} revealed as Champions!`);
    } catch (err) { toast.error(err.message); } finally { setChampBusy(null); }
  };

  const handleResetMatch = async () => {
    if (!currentMatch) { toast.error('No active match to reset'); return; }
    if (!confirm('Reset current match? This will clear all kills, eliminations, and placements for this match.')) return;
    try { await overlayApi.resetMatch({ match_id: currentMatch.id }); refresh(); toast.success('Match reset successfully'); }
    catch (e) { toast.error('Failed to reset match'); }
  };

  const handleResetDatabase = async () => {
    if (!confirm('⚠️ DANGER: This will permanently delete ALL tournaments, teams, players, and match data. This cannot be undone. Continue?')) return;
    if (!confirm('Are you absolutely sure? This is your final warning.')) return;
    try { await overlayApi.resetDatabase(); refresh(); toast.success('Database reset to defaults'); }
    catch (e) { toast.error('Failed to reset database'); }
  };

  const declareTournamentFinished = async () => {
    if (!tournament?.id) return toast.error('No active tournament');
    setChampBusy('declare');
    try {
      await overlayApi.declareChampions({ tournament_id: tournament.id });
      toast.success('NEXOVERLAYS! Champions declared and final standings updated!');
    } catch (err) { toast.error(err.message); } finally { setChampBusy(null); }
  };

  const handleDownloadJSON = () => {
    const payload = { tournament, teams, players, overlayState: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nexoverlays-tournament-${tournament?.id || 'export'}.json`; a.click();
    toast.success('Tournament JSON exported!');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify({ tournament, teams, players }, null, 2));
    toast.success('Export data copied to clipboard!');
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); toast.success('Copied!'); setTimeout(() => setCopied(null), 2000); });
  };

  const TABS = [
    { id: 'dashboard', label: 'DASHBOARD', icon: Activity },
    { id: 'live', label: 'LIVE', icon: Radio },
    { id: 'overlay', label: 'OVERLAY', icon: Monitor },
    { id: 'match', label: 'MATCH', icon: Map },
    { id: 'standings', label: 'STANDINGS', icon: Trophy },
    { id: 'players', label: 'PLAYERS', icon: Users },
    { id: 'design', label: 'DESIGN', icon: Paintbrush },
    { id: 'theme', label: 'THEME', icon: Palette },
    { id: 'assets', label: 'ASSETS', icon: Layers },
    { id: 'sound', label: 'SOUND', icon: Volume2 },
    { id: 'animations', label: 'ANIM', icon: Film },
    { id: 'timeline', label: 'TIMELINE', icon: Clock },
    { id: 'setup', label: 'SETUP', icon: Settings2 },
  ].filter(t => canAccessTab(userRole, t.id, isOwner));

  return (
    <div className="flex h-full flex-col bg-[#0D0B1A] text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
      {/* HEADER */}
      <header className="nx-glass-header flex h-14 items-center justify-between px-4 flex-shrink-0 relative">
        <div className="flex items-center gap-3 relative">
          <button onClick={() => roleConfig.canSwitchTournament && setShowTournamentSwitcher(s => !s)} className="leading-none text-left group rounded-md px-2 py-1 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-1.5">
              <h1 className="font-orbitron text-sm font-black uppercase tracking-tight text-white">{tournament?.name || 'CHAMPIONSHIP TOUR'}</h1>
              {roleConfig.canSwitchTournament && tournamentList.length > 1 && <ChevronDown className="h-3 w-3 text-white/30 group-hover:text-[#9D5CFF] transition-colors" />}
            </div>
            <p className="font-mono text-[10px] text-white/40 tracking-wide mt-0.5">M{(tournament?.current_match_number || 0) + 1} · {tournament?.status?.toUpperCase() || 'ACTIVE'}</p>
          </button>
          {showTournamentSwitcher && roleConfig.canSwitchTournament && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTournamentSwitcher(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 w-72 nx-glass rounded-xl overflow-hidden shadow-2xl nx-scale-in">
                <div className="px-3 py-2 nx-divider"><span className="nx-section-label">SWITCH TOURNAMENT</span></div>
                <div className="max-h-64 overflow-y-auto">
                  {tournamentList.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-white/30">No tournaments found</div>
                  ) : tournamentList.map(t => (
                    <button key={t.id} onClick={() => handleSwitchTournament(t.id)} className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/[0.04] transition-all text-left nx-divider last:border-0 active:scale-[0.99]">
                      <div><p className="text-sm font-semibold text-white">{t.name || 'Untitled'}</p><p className="font-mono text-[10px] text-white/30">{t.team_count || 0} teams · {t.match_count || 0} matches</p></div>
                      {t.id === tournament?.id && <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="nx-badge" style={{ background: `${roleConfig.color}10`, color: roleConfig.color, border: `1px solid ${roleConfig.color}25` }}>{roleConfig.label.toUpperCase()}</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[rgba(124,58,237,0.15)] bg-[rgba(124,58,237,0.04)] px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C3AED] opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7C3AED]"></span>
            </span>
            <span className="font-mono text-[10px] font-semibold text-[#9D5CFF] tracking-wide">{currentScreen.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopyOBS} className="nx-btn-ghost text-[10px] px-3 py-1.5"><Copy className="h-3 w-3 text-[#9D5CFF]" />OBS</button>
          <button onClick={handleRefresh} disabled={refreshing} className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] text-white/40 hover:text-white hover:border-white/[0.12] transition-all active:scale-95 disabled:opacity-40">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#9D5CFF]' : ''}`} />
          </button>
        </div>
      </header>

      {/* TAB BAR */}
      <nav className="flex h-10 border-b border-white/[0.04] bg-[#070611] flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-active={isActive} className="nx-tab">
              <Icon className="h-3 w-3" />{tab.label}
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-white/5 border-t-[#7C3AED] animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'live' && (
              <SectionBoundary label="LIVE CONTROL">
                <LiveControlPanel data={data} overlayApi={overlayApi} refresh={refresh} teams={teams} players={players} currentMatch={currentMatch} tournament={tournament} />
              </SectionBoundary>
            )}

            {activeTab === 'overlay' && (
              <SectionBoundary label="OVERLAY MANAGER">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 nx-surface p-4">
                    <div className="mb-3 flex items-center justify-between nx-divider pb-3">
                      <div className="flex items-center gap-2">
                        <span className="nx-badge nx-badge-primary">SCENE SELECTOR</span>
                        {obsStatus === 'connected' && <span className="nx-badge nx-badge-green"><span className="h-1.5 w-1.5 bg-[#10B981] rounded-full" />OBS</span>}
                      </div>
                    </div>
                    {Object.entries(GROUP_LABELS).map(([groupKey, group]) => {
                      const items = SCREENS.filter(s => s.group === groupKey);
                      return (
                        <div key={groupKey} className="mb-3 last:mb-0">
                          <p className="nx-section-label mb-2" style={{ color: group.color }}>{group.label}</p>
                          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                            {items.map(s => {
                              const Icon = s.icon;
                              const isLive = currentScreen === s.key;
                              const isPreview = previewScreen === s.key;
                              return (
                                <button key={s.key} onClick={() => setPreviewScreen(s.key)} title={s.desc} className="flex flex-col items-start rounded-lg px-3 py-2.5 text-left transition-all active:scale-[0.98]"
                                  style={isLive ? { background: `${group.color}15`, border: `1px solid ${group.color}50` } : isPreview ? { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.4)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--nx-border)' }}>
                                  <div className="flex items-center gap-1.5 w-full">
                                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isLive ? group.color : isPreview ? '#60A5FA' : 'rgba(255,255,255,0.35)' }} />
                                    <span className="text-[10px] font-black tracking-wider truncate font-orbitron" style={{ color: isLive ? group.color : isPreview ? '#60A5FA' : 'rgba(255,255,255,0.6)' }}>{s.label}</span>
                                    {isLive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#10B981] flex-shrink-0" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-3 nx-divider">
                      <button onClick={handleTake} disabled={!previewScreen || takeBusy} className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-orbitron text-xs font-black tracking-widest text-white transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${previewScreen && !takeBusy ? 'bg-[#7C3AED] hover:bg-[#6D28D9]' : 'bg-white/[0.04] text-white/40'}`}>
                        {takeBusy ? <><RefreshCw className="h-4 w-4 animate-spin" /> TAKING...</> : previewScreen ? <><Play className="h-4 w-4" /> TAKE: {previewScreen.replace(/_/g, ' ').toUpperCase()}</> : <><Play className="h-4 w-4" /> SELECT A SCENE</>}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="nx-surface p-4">
                      <p className="nx-section-label text-[#9D5CFF] mb-2 flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full" />OBS SETUP</p>
                      <div className="space-y-1.5 text-xs text-white/50">
                        <p>1. OBS → <span className="text-white font-semibold">Browser Source</span> → paste URL</p>
                        <p>2. <span className="font-mono text-white/70">1920×1080</span></p>
                        <p>3. CSS: <code className="font-mono text-[#60A5FA] text-[10px]">body {'{ background: transparent !important; }'}</code></p>
                        <p>4. Uncheck <span className="text-white/70">"Shutdown when not visible"</span></p>
                      </div>
                    </div>
                    {shareToken && (
                      <div className="nx-surface p-4">
                        <p className="nx-section-label mb-2">SHARE TOKEN</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate rounded-md border border-white/[0.06] bg-black/20 px-3 py-2 font-mono text-xs text-[#60A5FA]">{shareToken}</code>
                          <CopyBtn text={shareToken} id="token" copied={copied} onCopy={copy} />
                        </div>
                      </div>
                    )}
                    <div className="nx-surface p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full" /><span className="nx-section-label text-[#60A5FA]">OVERLAY URLS</span></div>
                        <a href="/overlay-links" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.06)] px-2.5 py-1.5 font-orbitron text-[10px] font-black text-[#60A5FA] hover:bg-[rgba(59,130,246,0.12)] transition-all active:scale-[0.98]"><ExternalLink className="h-3 w-3" />OPEN</a>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionBoundary>
            )}

            {activeTab === 'match' && (
              <SectionBoundary label="MATCH CONTROL">
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="nx-surface p-5">
                    <div className="mb-5 flex items-center gap-2 nx-divider pb-3"><span className="nx-badge nx-badge-primary">MATCH CONTROL</span></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="nx-section-label block mb-2">SELECT MAP</label>
                        <select value={mapSelect} onChange={(e) => setMapSelect(e.target.value)} className="nx-input">
                          {MAPS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col justify-end">
                        <button disabled={busy === 'start_match'} onClick={startMatch} className="nx-btn-primary w-full py-2.5"><Play className="h-4 w-4" />START MATCH #{(tournament?.current_match_number || 0) + 1}</button>
                      </div>
                    </div>
                    {currentMatch && (
                      <div className="mt-5 nx-divider pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="nx-badge nx-badge-muted font-mono">MATCH #{currentMatch.match_number}</span>
                          <span className="nx-badge nx-badge-blue">{currentMatch.state?.toUpperCase()}</span>
                          <span className="nx-badge nx-badge-muted font-mono">{currentMatch.map_name}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['warmup', 'ongoing', 'completed'].map((st) => (
                            <button key={st} disabled={busy === 'match_status'} onClick={() => setMatchStatus(st)} className="nx-btn-ghost text-[10px] px-3 py-1.5">{st.toUpperCase()}</button>
                          ))}
                          <button onClick={handleResetMatch} className="nx-btn-danger text-[10px] px-3 py-1.5 ml-auto"><RotateCcw className="h-3 w-3" />RESET</button>
                        </div>
                      </div>
                    )}
                    {currentMatch && (
                      <div className="mt-5 nx-divider pt-4">
                        <span className="nx-section-label block mb-3">MVP CALCULATION</span>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <button disabled={mvpBusy === 'calc'} onClick={calculateMVP} className="nx-btn-ghost text-[10px] px-3 py-1.5">
                            {mvpBusy === 'calc' ? <><RefreshCw className="h-3 w-3 animate-spin" />CALC...</> : <><Star className="h-3 w-3" />CALCULATE MVP</>}
                          </button>
                          <button disabled={!mvp || mvpBusy === 'show'} onClick={triggerMVPOverlay} className="nx-btn-primary text-[10px] px-3 py-1.5">
                            {mvpBusy === 'show' ? <><RefreshCw className="h-3 w-3 animate-spin" />SHOWING...</> : <><Crown className="h-3 w-3" />SHOW MVP</>}
                          </button>
                        </div>
                        {mvp && (
                          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                            <Crown className="h-4 w-4 text-[#9D5CFF]" />
                            <span className="font-orbitron text-sm font-black text-white">{mvp.name}</span>
                            <span className="font-mono text-xs text-white/40">{mvp.team}</span>
                            <span className="nx-badge nx-badge-primary ml-auto">{mvp.kills} KILLS</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-5 nx-divider pt-4">
                      <span className="nx-section-label block mb-3">CHAMPIONS REVEAL</span>
                      <div className="space-y-1.5">
                        {sortedTeams.slice(0, 3).map((team, idx) => (
                          <button key={team.id} disabled={champBusy === team.id} onClick={() => revealChampions(team)} className="w-full flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2 text-left transition-all hover:border-white/[0.12] active:scale-[0.99] disabled:opacity-40">
                            <span className="font-orbitron text-xs font-black w-6 text-center" style={{ color: idx === 0 ? '#FBBF24' : idx === 1 ? '#A0A0B0' : '#B87333' }}>{idx + 1}</span>
                            <span className="font-orbitron text-sm font-bold text-white">{team.name}</span>
                            <span className="font-mono text-xs text-white/40 ml-auto">{team.total_tournament_points || 0} pts</span>
                            {champBusy === team.id && <RefreshCw className="h-3 w-3 animate-spin text-[#9D5CFF]" />}
                          </button>
                        ))}
                      </div>
                      <button disabled={champBusy === 'declare'} onClick={declareTournamentFinished} className="nx-btn-ghost w-full mt-3 text-[10px] py-2.5">
                        {champBusy === 'declare' ? 'CALCULATING...' : 'DECLARE CHAMPIONS & LOCK STANDINGS'}
                      </button>
                    </div>
                  </div>
                </div>
              </SectionBoundary>
            )}

            {activeTab === 'standings' && (
              <SectionBoundary label="STANDINGS & LEADERBOARD">
                <div className="max-w-5xl mx-auto nx-surface overflow-hidden">
                  <div className="p-5 nx-divider flex justify-between items-center">
                    <div>
                      <span className="nx-badge nx-badge-primary">LIVE LEADERBOARD</span>
                      <p className="font-mono text-[10px] text-white/30 mt-1.5">REAL-TIME TOURNAMENT STANDINGS</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-white/30">PPK: {tournament?.points_per_kill || 1}</span>
                      <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
                        <span className="font-mono text-[10px] text-white/40">PPT + Kills×PPK = Total</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="nx-divider font-orbitron text-[9px] font-black tracking-widest text-white/40">
                          <th className="py-2.5 px-4 text-center">POS</th>
                          <th className="py-2.5 px-4">TEAM</th>
                          <th className="py-2.5 px-4 text-center">MATCHES</th>
                          <th className="py-2.5 px-4 text-center">BOOYAH</th>
                          <th className="py-2.5 px-4 text-center font-mono text-[#60A5FA]">PPT</th>
                          <th className="py-2.5 px-4 text-center font-mono text-[#10B981]">KILL PTS</th>
                          <th className="py-2.5 px-4 text-center font-mono text-[#FBBF24]">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-xs">
                        {sortedTeams.map((team, index) => {
                          const ppk = tournament?.points_per_kill || 1;
                          const totalKills = team.total_tournament_kills || 0;
                          const killPts = totalKills * ppk;
                          const totalPts = team.total_tournament_points || 0;
                          const placementPts = totalPts - killPts;
                          return (
                          <tr key={team.id} className={`hover:bg-white/[0.02] transition-colors ${index === 0 ? 'bg-[rgba(251,191,36,0.03)]' : ''}`}>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-white/40">{index + 1}</td>
                            <td className="py-2.5 px-4 font-orbitron font-black text-white">{team.name}</td>
                            <td className="py-2.5 px-4 text-center font-mono text-white/50">{standings.filter(s => s.team_id === team.id).length || 0}</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-[#9D5CFF]">{standings.filter(s => s.team_id === team.id && s.placement === 1).length || 0}</td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#60A5FA]">{placementPts}</td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#10B981]" title={`${totalKills} kills × ${ppk} PPK`}>{totalKills}×{ppk}={killPts}</td>
                            <td className="py-2.5 px-4 text-center font-orbitron font-black text-[#FBBF24]">{totalPts}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionBoundary>
            )}

            {activeTab === 'design' && (<SectionBoundary label="OVERLAY DESIGN STUDIO"><DesignStudio overlayState={state} tournament={tournament} teams={teams} players={players} onAction={refresh} /></SectionBoundary>)}
            {activeTab === 'assets' && (<SectionBoundary label="STUDIO ASSET LIBRARY"><AssetManager data={data} refresh={refresh} overlayApi={overlayApi} /></SectionBoundary>)}
            {activeTab === 'sound' && (<SectionBoundary label="SOUND MANAGER"><SoundManager data={data} overlayApi={overlayApi} refresh={refresh} /></SectionBoundary>)}
            {activeTab === 'animations' && (<SectionBoundary label="ANIMATION LIBRARY"><AnimationLibrary data={data} overlayApi={overlayApi} refresh={refresh} /></SectionBoundary>)}
            {activeTab === 'dashboard' && (<SectionBoundary label="BROADCAST DASHBOARD"><BroadcastDashboard data={data} refresh={refresh} overlayApi={overlayApi} /></SectionBoundary>)}
            {activeTab === 'players' && (<SectionBoundary label="PLAYER MANAGEMENT"><PlayerManager data={data} refresh={refresh} overlayApi={overlayApi} /></SectionBoundary>)}
            {activeTab === 'theme' && (
              <SectionBoundary label="THEME MANAGER">
                <ThemeManager currentTheme={(data?.design?.theme_id || 'nexplay')} onApplyTheme={async (theme) => { try { await overlayApi.saveDesign({ theme_id: theme.id, primaryColor: theme.primary, secondaryColor: theme.secondary, bgColor: theme.bg, cardColor: theme.card, accentColor: theme.accent }); toast.success(`Theme: ${theme.name} applied!`); refresh(); } catch (e) { toast.error(e.message); } }} tournament={data?.tournament} />
              </SectionBoundary>
            )}
            {activeTab === 'timeline' && (<SectionBoundary label="EVENT TIMELINE"><EventTimeline killEvents={data?.killFeed || []} eliminationEvents={data?.eliminations || []} matchEvents={[]} teams={data?.teams || []} /></SectionBoundary>)}
            {activeTab === 'setup' && (
              <SectionBoundary label="TOURNAMENT CONFIGURATION">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="nx-surface p-5">
                    <div className="mb-3 flex items-center justify-between nx-divider pb-3">
                      <div className="flex items-center gap-2"><Download className="h-4 w-4 text-[#9D5CFF]" /><span className="nx-section-label">BACKUP & PORT DATA</span></div>
                    </div>
                    <p className="text-xs text-white/50 mb-4">Download the entire tournament database as a JSON file. Restore on any machine or use as backup.</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleDownloadJSON} className="nx-btn-primary flex-1 min-w-[200px]"><Download className="h-4 w-4" />EXPORT JSON</button>
                      <button onClick={handleCopyToClipboard} className="nx-btn-ghost flex-1 min-w-[200px]"><Copy className="h-4 w-4" />COPY TO CLIPBOARD</button>
                    </div>
                  </div>
                  <TournamentManager />
                  <div className="nx-surface p-5">
                    <span className="nx-section-label text-[#9D5CFF] mb-4 block">USER ROLE & PERMISSIONS</span>
                    <div className="mb-3">
                      <p className="text-xs text-white/40 mb-1">Current role: <span className="font-semibold" style={{ color: roleConfig.color }}>{roleConfig.label}</span></p>
                      <p className="text-[11px] text-white/30">{roleConfig.description}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(ROLES).map(([key, r]) => (
                        <button key={key} onClick={async () => { if (!isOwner) { toast.error('Only the owner can change roles'); return; } try { await overlayApi.setUserRole(key); setUserRole(key); toast.success(`Role changed to ${r.label}`); } catch (e) { toast.error('Failed to change role'); } }}
                          className="flex items-center justify-between p-3 rounded-lg border transition-all text-left active:scale-[0.99]"
                          style={userRole === key ? { borderColor: r.color + '50', background: r.color + '08' } : { borderColor: 'rgba(255,255,255,0.04)', background: 'transparent' }}>
                          <div><p className="text-sm font-semibold" style={{ color: r.color }}>{r.label}</p><p className="text-[10px] text-white/30">{r.description}</p></div>
                          <div className="flex items-center gap-2"><span className="text-[9px] font-mono text-white/20">{r.tabs.length} tabs</span>{userRole === key && <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />}</div>
                        </button>
                      ))}
                    </div>
                    {!isOwner && <p className="mt-3 text-[10px] text-white/20">Only the owner can change roles.</p>}
                  </div>
                  <OrsConfigSection />
                  <div className="nx-surface p-5 border-red-500/20" style={{ background: 'rgba(239,68,68,0.03)' }}>
                    <span className="nx-section-label text-red-400 mb-3 block">DANGER ZONE</span>
                    <p className="text-xs text-white/40 mb-3">Permanently delete all tournament data. This cannot be undone.</p>
                    <button onClick={handleResetDatabase} className="nx-btn-danger"><Trash2 className="h-3.5 w-3.5" />RESET ENTIRE DATABASE</button>
                  </div>
                </div>
              </SectionBoundary>
            )}
          </>
        )}
      </main>
    </div>
  );
}
