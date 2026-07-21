import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Radio, Activity, Users, Wifi, Eye, Monitor, Skull, Heart,
  Play, Square, Clock, ArrowRight, RefreshCw, Tv, Settings,
  Zap, Link2, AlertCircle, ChevronRight, Layers, Power
} from 'lucide-react';
import { useObsStore } from '@/lib/obsStore';
import { obsService } from '@/lib/obsWebSocket';

/* ────────────────────────────────────────────────────────────────────────
   BROADCAST DASHBOARD — OBS CONTROLLER + DATA OVERVIEW

   Architecture:
   - This panel CONTROLS OBS via WebSocket (scene switching, source toggles)
   - It does NOT render overlays itself — OBS handles all live production
   - It shows a data overview (tournament/match/team stats) for the operator
   - Scene buttons map to OBS scenes → SetCurrentPreviewScene + TAKE button
   - Source visibility toggles fire SetSceneItemEnabled to OBS
──────────────────────────────────────────────────────────────────────────── */

export default function BroadcastDashboard({ data, refresh, overlayApi, obsConnected, onSwitchScene }) {
  const {
    connectionStatus,
    currentProgramScene,
    currentPreviewScene,
    availableScenes,
    sources,
    obsAddress,
    obsPassword,
    setObsConfig,
  } = useObsStore();

  const [showObsConfig, setShowObsConfig] = useState(false);
  const [addrInput, setAddrInput] = useState(obsAddress);
  const [passInput, setPassInput] = useState(obsPassword);
  const [takeBusy, setTakeBusy] = useState(false);
  const [selectedScene, setSelectedScene] = useState('');

  // Tournament data for operator overview
  const tournament = data?.tournament || {};
  const overlayState = data?.overlayState || {};
  const currentMatch = data?.currentMatch || {};
  const teams = data?.teams || [];
  const players = data?.players || [];
  const killEvents = data?.killFeed || [];
  const eliminations = data?.eliminations || [];
  const alivePlayers = players.filter(p => p.is_alive);

  /* ── OBS ACTIONS ── */

  const handleConnect = async () => {
    try {
      setObsConfig(addrInput, passInput);
      await obsService.connect(addrInput, passInput);
      toast.success('OBS connected');
      setShowObsConfig(false);
    } catch (err) {
      toast.error(`OBS connection failed: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    await obsService.disconnect();
    toast.success('OBS disconnected');
  };

  const handleSetPreview = async (sceneName) => {
    if (connectionStatus !== 'connected') {
      toast.error('OBS not connected');
      return;
    }
    try {
      await obsService.setPreviewScene(sceneName);
    } catch (err) {
      toast.error(`Failed to set preview: ${err.message}`);
    }
  };

  const handleTake = async () => {
    if (!currentPreviewScene || takeBusy) {
      if (!currentPreviewScene) toast.error('Select a scene in Preview first');
      return;
    }
    setTakeBusy(true);
    try {
      await obsService.takeScene(currentPreviewScene);
      toast.success(`>> ${currentPreviewScene} is now PROGRAM`);
    } catch (err) {
      toast.error(`TAKE failed: ${err.message}`);
    } finally {
      setTakeBusy(false);
    }
  };

  const handleToggleSource = async (sceneName, sourceName) => {
    try {
      await obsService.toggleSourceVisibility(sceneName, sourceName);
    } catch (err) {
      toast.error(`Toggle failed: ${err.message}`);
    }
  };

  const handleRefreshObs = async () => {
    if (connectionStatus !== 'connected') return;
    try {
      await obsService.refreshScenes();
      toast.success('OBS scenes refreshed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ── DATA OVERVIEW STATS ── */

  const matchState = currentMatch?.state || 'IDLE';
  const matchStateColor = matchState === 'live' ? '#22c55e' : matchState === 'paused' ? '#f59e0b' : '#6b7280';
  const tournamentStatus = tournament?.status || 'setup';
  const tournamentStatusColor = tournamentStatus === 'active' ? '#22c55e' : tournamentStatus === 'completed' ? '#3b82f6' : '#f59e0b';

  const recentEvents = useMemo(() => {
    const kills = (killEvents || []).map(k => ({
      type: 'kill', ts: k.timestamp || k.created_date, icon: Skull, color: '#ef4444',
      text: `${k.killer_name || '?'} eliminated ${k.killed_player_name || '?'}`,
      team: k.killer_team_name,
    }));
    const elims = (eliminations || []).map(e => ({
      type: 'elim', ts: e.timestamp || e.created_date, icon: Heart, color: '#f59e0b',
      text: `${e.eliminated_player_name || '?'} was eliminated`,
      team: e.eliminated_team_name,
    }));
    return [...kills, ...elims].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);
  }, [killEvents, eliminations]);

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour12: false }); }
    catch { return '--:--'; }
  };

  const selectedSceneSources = selectedScene ? (sources[selectedScene] || []) : (sources[currentProgramScene] || []);

  return (
    <div className="flex flex-col gap-3 p-4 h-full overflow-y-auto" style={{ background: '#04060E' }}>
      {/* ── STATUS BAR ── */}
      <div className="grid grid-cols-4 gap-3">
        <StatusCard icon={Tv} label="OBS STATUS" value={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'} badge={connectionStatus.toUpperCase()} badgeColor={connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444'} />
        <StatusCard icon={Activity} label="PROGRAM" value={currentProgramScene || '—'} badge="ON AIR" badgeColor="#ef4444" />
        <StatusCard icon={Eye} label="PREVIEW" value={currentPreviewScene || '—'} badge="READY" badgeColor="#3b82f6" />
        <StatusCard icon={Users} label="ALIVE PLAYERS" value={`${alivePlayers.length}/${players.length}`} badge={`${teams.length} TEAMS`} badgeColor="#7C3AED" />
      </div>

      {/* ── OBS CONNECTION BAR ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{
        background: '#131127',
        borderColor: connectionStatus === 'connected' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
      }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{
            background: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444',
            animation: connectionStatus === 'connecting' ? 'pulse 1s infinite' : 'none',
          }} />
          <span className="font-orbitron text-[10px] font-black tracking-widest text-white">OBS WEBSOCKET</span>
        </div>
        <span className="text-[11px] text-white/40">{obsAddress}</span>
        <div className="flex-1" />
        {connectionStatus === 'connected' ? (
          <>
            <button onClick={handleRefreshObs} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 text-white/60 hover:bg-white/10 transition-all text-[10px] font-orbitron font-bold tracking-wider">
              <RefreshCw className="w-3 h-3" /> REFRESH SCENES
            </button>
            <button onClick={handleDisconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all text-[10px] font-orbitron font-bold tracking-wider">
              <Power className="w-3 h-3" /> DISCONNECT
            </button>
          </>
        ) : (
          <button onClick={() => setShowObsConfig(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all text-[10px] font-orbitron font-bold tracking-wider">
            <Link2 className="w-3 h-3" /> CONNECT OBS
          </button>
        )}
      </div>

      {/* ── MAIN GRID: SCENE SELECTOR + SOURCE PANEL ── */}
      {connectionStatus === 'connected' ? (
        <div className="grid grid-cols-3 gap-3">
          {/* OBS SCENE LIST */}
          <div className="col-span-2 rounded-lg border border-white/5 overflow-hidden" style={{ background: '#131127' }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-orbitron text-[9px] font-black tracking-widest text-white">OBS SCENES</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-orbitron font-bold text-white/40">{availableScenes.length}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3 max-h-[200px] overflow-y-auto">
              {availableScenes.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center py-8 gap-2">
                  <Tv className="w-8 h-8 text-white/10" />
                  <span className="text-[10px] text-white/30">No scenes found in OBS</span>
                </div>
              ) : availableScenes.map(scene => {
                const isProgram = scene === currentProgramScene;
                const isPreview = scene === currentPreviewScene;
                return (
                  <button
                    key={scene}
                    onClick={() => handleSetPreview(scene)}
                    onDoubleClick={() => obsService.takeScene(scene).then(() => toast.success(`>> ${scene} is now PROGRAM`)).catch(e => toast.error(e.message))}
                    onContextMenu={(e) => { e.preventDefault(); setSelectedScene(scene); }}
                    className={`relative px-3 py-3 rounded-lg text-[10px] font-orbitron font-bold tracking-wider transition-all border ${
                      isProgram
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : isPreview
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                        : 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                    title="Click = Preview, Double-click = Take to Program"
                  >
                    {isProgram && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {isPreview && !isProgram && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    <span className="block truncate">{scene}</span>
                    {isProgram && <span className="block text-[7px] text-red-400/60 mt-0.5">PROGRAM</span>}
                    {isPreview && !isProgram && <span className="block text-[7px] text-blue-400/60 mt-0.5">PREVIEW</span>}
                  </button>
                );
              })}
            </div>
            {/* TAKE BUTTON */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <span className="font-orbitron text-[8px] font-bold tracking-widest">PREVIEW:</span>
                <span className="font-orbitron text-[10px] font-bold text-blue-400">{currentPreviewScene || '—'}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-orbitron text-[8px] font-bold tracking-widest">PROGRAM:</span>
                <span className="font-orbitron text-[10px] font-bold text-red-400">{currentProgramScene || '—'}</span>
              </div>
              <button
                onClick={handleTake}
                disabled={takeBusy || !currentPreviewScene || currentPreviewScene === currentProgramScene}
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-orbitron text-[10px] font-black tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 0 15px rgba(34,197,94,0.3)' }}
              >
                {takeBusy ? <><Clock className="w-3 h-3 animate-spin" /><span>TAKING...</span></> : <><Zap className="w-3 h-3" /><span>TAKE</span></>}
              </button>
            </div>
          </div>

          {/* SOURCE VISIBILITY PANEL */}
          <div className="rounded-lg border border-white/5 overflow-hidden" style={{ background: '#131127' }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Settings className="w-3 h-3 text-white/40" />
                <span className="font-orbitron text-[9px] font-black tracking-widest text-white">SOURCES</span>
              </div>
              <select
                value={selectedScene || currentProgramScene || ''}
                onChange={(e) => setSelectedScene(e.target.value)}
                className="bg-transparent text-[9px] font-orbitron font-bold text-white border border-white/10 rounded px-2 py-1 outline-none cursor-pointer max-w-[120px]"
              >
                <option value="" className="bg-[#131127]">— Select Scene —</option>
                {availableScenes.map(s => <option key={s} value={s} className="bg-[#131127]">{s}</option>)}
              </select>
            </div>
            <div className="max-h-[230px] overflow-y-auto">
              {selectedSceneSources.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Layers className="w-6 h-6 text-white/10" />
                  <span className="text-[10px] text-white/30">Select a scene to see sources</span>
                </div>
              ) : selectedSceneSources.map(src => (
                <button
                  key={src.id || src.name}
                  onClick={() => handleToggleSource(selectedScene || currentProgramScene, src.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: src.visible ? '#22c55e' : '#6b7280' }} />
                  <span className={`text-[11px] font-medium flex-1 text-left ${src.visible ? 'text-white' : 'text-white/30 line-through'}`}>{src.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-orbitron font-bold ${src.visible ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    {src.visible ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── DISCONNECTED STATE ── */
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-lg border border-white/5" style={{ background: '#131127' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <Wifi className="w-8 h-8 text-red-500/50" />
          </div>
          <div className="text-center">
            <p className="font-orbitron text-[12px] font-black tracking-widest text-white mb-1">OBS NOT CONNECTED</p>
            <p className="text-[11px] text-white/40 max-w-[300px]">Connect to OBS WebSocket to control scenes, sources, and live production. All live production is handled by OBS — this panel is your controller.</p>
          </div>
          <button onClick={() => setShowObsConfig(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-orbitron text-[10px] font-black tracking-widest hover:bg-purple-500/25 transition-all">
            <Link2 className="w-3.5 h-3.5" /> CONNECT TO OBS
          </button>
        </div>
      )}

      {/* ── DATA OVERVIEW (always visible) ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* TOURNAMENT + MATCH STATS */}
        <div className="rounded-lg border border-white/5 p-3" style={{ background: '#131127' }}>
          <span className="font-orbitron text-[9px] font-black tracking-widest text-white/40 mb-2 block">TOURNAMENT DATA</span>
          <div className="grid grid-cols-2 gap-2">
            <DataStat label="TOURNAMENT" value={tournament?.name || 'None'} badge={tournamentStatus.toUpperCase()} badgeColor={tournamentStatusColor} />
            <DataStat label="MATCH #" value={tournament?.current_match_number || 0} badge={matchState.toUpperCase()} badgeColor={matchStateColor} />
            <DataStat label="TEAMS" value={teams.length} badge={`${alivePlayers.length} ALIVE`} badgeColor="#22c55e" />
            <DataStat label="TOTAL KILLS" value={killEvents.length} badge={`${eliminations.length} ELIMS`} badgeColor="#f59e0b" />
          </div>
          {/* MATCH CONTROLS */}
          <div className="flex gap-2 mt-3">
            <button onClick={() => overlayApi?.startNextMatch?.({}).then(() => { toast.success('Match started'); refresh?.(); }).catch(e => toast.error(e.message))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-green-500/15 border border-green-500/30 text-green-400 font-orbitron text-[9px] font-bold tracking-wider hover:bg-green-500/25 transition-all">
              <Play className="w-3 h-3" /> START MATCH
            </button>
            <button onClick={() => overlayApi?.updateMatchState?.({ state: 'ended' }).then(() => { toast.success('Match ended'); refresh?.(); }).catch(e => toast.error(e.message))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-red-500/15 border border-red-500/30 text-red-400 font-orbitron text-[9px] font-bold tracking-wider hover:bg-red-500/25 transition-all">
              <Square className="w-3 h-3" /> END MATCH
            </button>
            <button onClick={refresh} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-orbitron text-[9px] font-bold tracking-wider hover:bg-blue-500/25 transition-all">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RECENT EVENTS FEED */}
        <div className="rounded-lg border border-white/5 overflow-hidden" style={{ background: '#131127' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="font-orbitron text-[9px] font-black tracking-widest text-white">RECENT EVENTS</span>
            </div>
            <span className="font-orbitron text-[8px] font-bold text-white/30">{recentEvents.length}</span>
          </div>
          <div className="max-h-[160px] overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Clock className="w-6 h-6 text-white/10" />
                <span className="font-orbitron text-[9px] font-bold tracking-widest text-white/20">NO EVENTS</span>
              </div>
            ) : recentEvents.map((evt, i) => {
              const Icon = evt.icon;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
                  <span className="font-orbitron text-[8px] font-bold text-white/30 w-12">{formatTime(evt.ts)}</span>
                  <div className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: `${evt.color}20` }}>
                    <Icon className="w-2.5 h-2.5" style={{ color: evt.color }} />
                  </div>
                  <span className="text-[10px] text-white/70 flex-1 truncate">{evt.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── OBS CONNECTION MODAL ── */}
      {showObsConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowObsConfig(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 p-5" style={{ background: '#131127' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-orbitron text-[10px] font-black tracking-widest text-white">CONNECT TO OBS WEBSOCKET</span>
              <button onClick={() => setShowObsConfig(false)} className="text-white/40 hover:text-white text-lg">x</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-orbitron text-[8px] font-black tracking-widest text-white/40">OBS ADDRESS (IP:PORT)</label>
                <input value={addrInput} onChange={e => setAddrInput(e.target.value)} placeholder="localhost:4455" className="w-full px-3 py-2 rounded-lg border border-white/10 text-[11px] text-white outline-none" style={{ background: '#0F1127' }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-orbitron text-[8px] font-black tracking-widest text-white/40">PASSWORD (optional)</label>
                <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)} placeholder="OBS WebSocket password" className="w-full px-3 py-2 rounded-lg border border-white/10 text-[11px] text-white outline-none" style={{ background: '#0F1127' }} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-[10px] text-white/50">Enable WebSocket Server in OBS → Tools → WebSocket Server Settings. Default port is 4455 for OBS 30+.</span>
              </div>
              <button onClick={handleConnect} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-orbitron text-[10px] font-black tracking-widest" style={{ background: '#7C3AED', color: '#fff' }}>
                <Link2 className="w-3.5 h-3.5" /> CONNECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, badge, badgeColor }) {
  return (
    <div className="rounded-lg border border-white/5 p-3" style={{ background: '#131127' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3 h-3 text-white/30" />
        <span className="font-orbitron text-[8px] font-black tracking-widest text-white/40">{label}</span>
      </div>
      <p className="text-sm font-bold text-white truncate mb-1">{value}</p>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: badgeColor }} />
        <span className="font-orbitron text-[8px] font-bold tracking-widest" style={{ color: badgeColor }}>{badge}</span>
      </div>
    </div>
  );
}

function DataStat({ label, value, badge, badgeColor }) {
  return (
    <div className="rounded-lg border border-white/5 p-2.5" style={{ background: '#0F1127' }}>
      <p className="font-orbitron text-[7px] font-black tracking-widest text-white/40 mb-1">{label}</p>
      <p className="text-sm font-bold text-white truncate">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className="w-1 h-1 rounded-full" style={{ background: badgeColor }} />
        <span className="font-orbitron text-[7px] font-bold" style={{ color: badgeColor }}>{badge}</span>
      </div>
    </div>
  );
}
