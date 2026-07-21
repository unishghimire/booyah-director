import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Radio, Activity, Users, Wifi, Eye, Monitor, Skull, Heart,
  Zap, Target, Play, Square, Clock, ChevronRight, LayoutGrid,
  Trophy, Star, AlertCircle, ArrowRight, RefreshCw
} from 'lucide-react';

const SCENE_OPTIONS = [
  { key: 'setup_blank', label: 'STARTING SOON' },
  { key: 'live', label: 'LIVE' },
  { key: 'scoreboard', label: 'SCOREBOARD' },
  { key: 'standings', label: 'STANDINGS' },
  { key: 'mvp', label: 'MVP' },
  { key: 'champion', label: 'WINNER' },
];

export default function BroadcastDashboard({ data, refresh, overlayApi, obsConnected, onSwitchScene }) {
  const [previewScreen, setPreviewScreen] = useState('live');
  const [takeBusy, setTakeBusy] = useState(false);

  const tournament = data?.tournament || {};
  const overlayState = data?.overlayState || {};
  const currentScreen = overlayState.current_screen || 'setup_blank';
  const currentMatch = data?.currentMatch || {};
  const teams = data?.teams || [];
  const players = data?.players || [];
  const killEvents = data?.killFeed || [];
  const eliminations = data?.eliminations || [];

  const alivePlayers = players.filter(p => p.is_alive);

  const allEvents = useMemo(() => {
    const kills = killEvents.map(k => ({
      type: 'kill',
      timestamp: k.timestamp || k.created_date,
      icon: Skull,
      color: '#ef4444',
      text: `${k.killer_name || 'Unknown'} eliminated ${k.killed_player_name || 'Unknown'}`,
      team: k.killer_team_name,
    }));
    const elims = eliminations.map(e => ({
      type: 'elim',
      timestamp: e.timestamp || e.created_date,
      icon: Heart,
      color: '#f59e0b',
      text: `${e.eliminated_player_name || 'Unknown'} was eliminated`,
      team: e.eliminated_team_name,
    }));
    return [...kills, ...elims].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);
  }, [killEvents, eliminations]);

  const handleTake = async () => {
    if (takeBusy) return;
    setTakeBusy(true);
    try {
      if (onSwitchScene) {
        await onSwitchScene(previewScreen);
      } else if (overlayApi?.switchOverlayScreen) {
        await overlayApi.switchOverlayScreen({ screen: previewScreen });
      }
      toast.success(`>> ${previewScreen.toUpperCase()} is now LIVE`);
      refresh?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTakeBusy(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '--:--:--';
    }
  };

  const matchStateLabel = currentMatch?.state || 'IDLE';
  const matchStateColor = matchStateLabel === 'live' ? '#22c55e' : matchStateLabel === 'paused' ? '#f59e0b' : '#6b7280';
  const tournamentStatus = tournament?.status || 'setup';
  const tournamentStatusColor = tournamentStatus === 'active' ? '#22c55e' : tournamentStatus === 'completed' ? '#3b82f6' : '#f59e0b';

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto" style={{ background: '#04060E' }}>
      {/* STATUS BAR */}
      <div className="grid grid-cols-4 gap-3">
        <StatusCard icon={Trophy} label="TOURNAMENT" value={tournament?.name || 'No Tournament'} badge={tournamentStatus.toUpperCase()} badgeColor={tournamentStatusColor} />
        <StatusCard icon={Activity} label="MATCH" value={`Match #${tournament?.current_match_number || 0}`} badge={matchStateLabel.toUpperCase()} badgeColor={matchStateColor} />
        <StatusCard icon={Users} label="TEAMS / ALIVE" value={`${teams.length} Teams`} badge={`${alivePlayers.length} ALIVE`} badgeColor="#22c55e" />
        <StatusCard icon={Wifi} label="OBS CONNECTION" value={obsConnected ? 'Connected' : 'Disconnected'} badge={obsConnected ? 'ONLINE' : 'OFFLINE'} badgeColor={obsConnected ? '#22c55e' : '#ef4444'} />
      </div>

      {/* PREVIEW + PROGRAM */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-blue-500/30 overflow-hidden" style={{ background: '#131127' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
            <span className="font-orbitron text-[9px] font-black tracking-widest text-blue-400">PREVIEW</span>
            <select
              value={previewScreen}
              onChange={(e) => setPreviewScreen(e.target.value)}
              className="bg-transparent text-[10px] font-orbitron font-bold text-white border border-white/10 rounded px-2 py-1 outline-none cursor-pointer"
            >
              {SCENE_OPTIONS.map(s => (
                <option key={s.key} value={s.key} className="bg-[#131127]">{s.label}</option>
              ))}
            </select>
          </div>
          <div className="relative" style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe src={`/overlay/${previewScreen}`} className="absolute inset-0 w-full h-full" title="Preview" style={{ pointerEvents: 'none' }} />
          </div>
        </div>

        <div className="rounded-lg border border-purple-500/40 overflow-hidden" style={{ background: '#131127' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
            <span className="font-orbitron text-[9px] font-black tracking-widest text-purple-400">PROGRAM</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-orbitron text-[8px] font-black tracking-widest text-red-400">LIVE</span>
            </span>
          </div>
          <div className="relative" style={{ aspectRatio: '16/9', background: '#000' }}>
            <iframe src={`/overlay/${currentScreen}`} className="absolute inset-0 w-full h-full" title="Program" style={{ pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* TAKE BUTTON */}
      <div className="flex justify-center">
        <button
          onClick={handleTake}
          disabled={takeBusy || previewScreen === currentScreen}
          className="flex items-center gap-3 px-12 py-3 rounded-lg font-orbitron text-xs font-black tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
        >
          {takeBusy ? (
            <><Clock className="w-4 h-4 animate-spin" /><span>TAKING...</span></>
          ) : (
            <><ArrowRight className="w-4 h-4" /><span>TAKE {previewScreen.toUpperCase()}</span></>
          )}
        </button>
      </div>

      {/* EVENT TIMELINE */}
      <div className="rounded-lg border border-white/5 overflow-hidden" style={{ background: '#131127' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-orbitron text-[9px] font-black tracking-widest text-white">EVENT TIMELINE</span>
          </div>
          <span className="font-orbitron text-[9px] font-bold text-white/30">{allEvents.length} EVENTS</span>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {allEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Clock className="w-8 h-8 text-white/20" />
              <span className="font-orbitron text-[10px] font-bold tracking-widest text-white/30">NO EVENTS YET</span>
              <span className="text-[10px] text-white/20">Events will appear here when matches are active</span>
            </div>
          ) : (
            allEvents.map((evt, i) => {
              const Icon = evt.icon;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <span className="font-orbitron text-[9px] font-bold text-white/30 w-16">{formatTime(evt.timestamp)}</span>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ background: `${evt.color}20` }}>
                    <Icon className="w-3 h-3" style={{ color: evt.color }} />
                  </div>
                  <span className="text-[11px] text-white/80 flex-1 truncate">{evt.text}</span>
                  {evt.team && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                      {evt.team}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QUICK CONTROLS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/5 p-3" style={{ background: '#131127' }}>
          <span className="font-orbitron text-[9px] font-black tracking-widest text-white/40 mb-2 block">QUICK SCENES</span>
          <div className="grid grid-cols-3 gap-2">
            {SCENE_OPTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => onSwitchScene ? onSwitchScene(s.key) : overlayApi?.switchOverlayScreen?.({ screen: s.key })}
                className={`px-2 py-2 rounded text-[9px] font-orbitron font-bold tracking-wider transition-all border ${
                  currentScreen === s.key
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 p-3" style={{ background: '#131127' }}>
          <span className="font-orbitron text-[9px] font-black tracking-widest text-white/40 mb-2 block">MATCH CONTROLS</span>
          <div className="flex gap-2">
            <button
              onClick={() => overlayApi?.startNextMatch?.({}).then(() => { toast.success('Match started!'); refresh?.(); }).catch(e => toast.error(e.message))}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-green-500/15 border border-green-500/30 text-green-400 font-orbitron text-[9px] font-bold tracking-wider hover:bg-green-500/25 transition-all"
            >
              <Play className="w-3 h-3" /> START
            </button>
            <button
              onClick={() => overlayApi?.updateMatchState?.({ state: 'ended' }).then(() => { toast.success('Match ended!'); refresh?.(); }).catch(e => toast.error(e.message))}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-red-500/15 border border-red-500/30 text-red-400 font-orbitron text-[9px] font-bold tracking-wider hover:bg-red-500/25 transition-all"
            >
              <Square className="w-3 h-3" /> END
            </button>
            <button
              onClick={refresh}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-orbitron text-[9px] font-bold tracking-wider hover:bg-blue-500/25 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
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
