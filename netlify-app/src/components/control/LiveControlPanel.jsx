import React, { useState, useMemo, useCallback } from 'react';
import {
  Play, Pause, Square, RotateCcw, AlertTriangle, Plus, Minus,
  Skull, Heart, Crosshair, Trophy, Zap, Radio, Users, Target,
  ChevronDown, ChevronUp, Eye, EyeOff, Star, Crown, Bell,
  Activity, Gamepad2, Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { overlayApi } from '@/lib/overlayApi';

/* ═══ Constants ═══ */
const MAPS = ['Bermuda', 'Bermuda Remastered', 'Purgatory', 'Alpine', 'Kalahari', 'Nexterra', 'Solara'];
const WEAPONS = ['AK', 'M4A1', 'AWM', 'M1887', 'MP40', 'UMP', 'XM1014', 'GROZA', 'SCAR', 'FAMAS', 'M14', 'SKS', 'Kar98k', 'Desert Eagle', 'P90', ' Thompson'];
const SCENES = [
  { key: 'setup_blank', label: 'STARTING SOON', icon: Radio, group: 'pre' },
  { key: 'countdown', label: 'COUNTDOWN', icon: Activity, group: 'pre' },
  { key: 'casters', label: 'CASTERS', icon: Users, group: 'pre' },
  { key: 'sponsor', label: 'SPONSOR', icon: Star, group: 'pre' },
  { key: 'game-intro', label: 'MATCH INTRO', icon: Gamepad2, group: 'pre' },
  { key: 'maplabel', label: 'MAP INTRO', icon: Target, group: 'pre' },
  { key: 'ff-scoreboard', label: 'LIVE', icon: Zap, group: 'live' },
  { key: 'standings', label: 'SCOREBOARD', icon: Trophy, group: 'live' },
  { key: 'teams', label: 'TEAMS TODAY', icon: Users, group: 'live' },
  { key: 'mvp', label: 'MVP', icon: Star, group: 'post' },
  { key: 'champions', label: 'WINNER', icon: Crown, group: 'post' },
  { key: 'break', label: 'BREAK', icon: Pause, group: 'post' },
];

const EVENTS = [
  { key: 'first_blood', label: 'FIRST BLOOD', color: '#ef4444' },
  { key: 'double_kill', label: 'DOUBLE KILL', color: '#f59e0b' },
  { key: 'triple_kill', label: 'TRIPLE KILL', color: '#8b5cf6' },
  { key: 'quadra_kill', label: 'QUADRA KILL', color: '#3B82F6' },
  { key: 'penta_kill', label: 'PENTA KILL', color: '#7C3AED' },
  { key: 'team_wipe', label: 'TEAM WIPE', color: '#ec4899' },
  { key: 'airdrop', label: 'AIRDROP', color: '#22c55e' },
  { key: 'final_circle', label: 'FINAL CIRCLE', color: '#ef4444' },
];

/* ═══ Match Control ═══ */
function MatchControl({ currentMatch, tournament, onStartMatch, onSetStatus }) {
  const [busy, setBusy] = useState(null);
  const [mapSelect, setMapSelect] = useState('Bermuda');

  const handleStart = async () => {
    setBusy('start');
    try {
      await onStartMatch({ map_name: mapSelect });
      toast.success('Match started!');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full" />
        <span className="font-orbitron text-[10px] font-black text-[#7C3AED] tracking-widest">MATCH CONTROL</span>
        {currentMatch && (
          <span className="ml-auto flex items-center gap-1.5 font-orbitron text-[9px] font-black text-red-400 tracking-wider">
            <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />LIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">MAP</label>
          <select
            value={mapSelect}
            onChange={e => setMapSelect(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 font-orbitron text-[11px] text-white focus:border-[#7C3AED]/50 outline-none"
          >
            {MAPS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">MATCH #</label>
          <div className="flex items-center justify-center rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
            <span className="font-orbitron text-lg font-black text-white">{tournament?.current_match_number || 0}</span>
          </div>
        </div>
      </div>

      {/* Action buttons grid */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={handleStart} disabled={busy === 'start' || !!currentMatch}
          className="flex flex-col items-center gap-1 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 px-3 py-3 hover:bg-[#7C3AED]/25 disabled:opacity-30 transition-all">
          <Play className="h-4 w-4 text-[#7C3AED]" />
          <span className="font-orbitron text-[8px] font-black tracking-wider text-[#7C3AED]">START</span>
        </button>
        <button disabled={!currentMatch}
          onClick={() => onSetStatus('ongoing')}
          className="flex flex-col items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-3 hover:bg-white/10 disabled:opacity-30 transition-all">
          <Pause className="h-4 w-4 text-[#f59e0b]" />
          <span className="font-orbitron text-[8px] font-black tracking-wider text-gray-400">PAUSE</span>
        </button>
        <button disabled={!currentMatch}
          onClick={() => onSetStatus('ongoing')}
          className="flex flex-col items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-3 hover:bg-white/10 disabled:opacity-30 transition-all">
          <RefreshCw className="h-4 w-4 text-[#22c55e]" />
          <span className="font-orbitron text-[8px] font-black tracking-wider text-gray-400">RESUME</span>
        </button>
        <button disabled={!currentMatch}
          onClick={() => onSetStatus('completed')}
          className="flex flex-col items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-3 hover:bg-white/10 disabled:opacity-30 transition-all">
          <Square className="h-4 w-4 text-red-400" />
          <span className="font-orbitron text-[8px] font-black tracking-wider text-gray-400">END</span>
        </button>
        <button disabled={!currentMatch}
          className="flex flex-col items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-3 hover:bg-white/10 disabled:opacity-30 transition-all">
          <RotateCcw className="h-4 w-4 text-[#3B82F6]" />
          <span className="font-orbitron text-[8px] font-black tracking-wider text-gray-400">RESTART</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-3 hover:bg-red-500/20 transition-all">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="font-orbitron text-[8px] font-black tracking-wider text-red-400">EMERGENCY</span>
        </button>
      </div>
    </div>
  );
}

/* ═══ Alive Counter ═══ */
function AliveCounter({ teams, onEliminate, onRevive }) {
  const aliveCount = useMemo(() => {
    return (teams || []).reduce((sum, t) => {
      // Count alive players per team
      return sum + (t.aliveCount || 0);
    }, 0);
  }, [teams]);

  const totalCount = useMemo(() => {
    return (teams || []).reduce((sum, t) => sum + (t.totalPlayers || 0), 0);
  }, [teams]);

  const [localAlive, setLocalAlive] = useState(totalCount || 48);

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-[#22c55e] rounded-full animate-pulse" />
        <span className="font-orbitron text-[10px] font-black text-[#22c55e] tracking-widest">ALIVE COUNTER</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setLocalAlive(Math.max(0, localAlive - 1))}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          <Minus className="h-6 w-6 text-red-400" />
        </button>
        <div className="text-center">
          <div className="font-orbitron text-5xl font-black text-white leading-none">{localAlive}</div>
          <div className="font-orbitron text-[9px] font-black text-gray-500 tracking-widest mt-1">ALIVE / {totalCount || 48} TOTAL</div>
        </div>
        <button
          onClick={() => setLocalAlive(Math.min(totalCount || 48, localAlive + 1))}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 hover:bg-[#22c55e]/20 transition-all"
        >
          <Plus className="h-6 w-6 text-[#22c55e]" />
        </button>
      </div>
    </div>
  );
}

/* ═══ Team Control Grid ═══ */
function TeamControlGrid({ teams, players, onKill, onEliminate, onRevive, onPlacement }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const sortedTeams = useMemo(() => {
    return [...(teams || [])].sort((a, b) =>
      (b.total_tournament_points || 0) - (a.total_tournament_points || 0) ||
      (b.total_tournament_kills || 0) - (a.total_tournament_kills || 0)
    );
  }, [teams]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full" />
        <span className="font-orbitron text-[10px] font-black text-[#3B82F6] tracking-widest">TEAM CONTROL</span>
        <span className="ml-auto font-orbitron text-[9px] text-gray-500">{sortedTeams.length} TEAMS</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
        {sortedTeams.map((team, idx) => {
          const teamPlayers = (players || []).filter(p => p.team_id === team.id);
          const aliveCount = teamPlayers.filter(p => p.is_alive).length;
          const isElim = aliveCount === 0 && teamPlayers.length > 0;
          const isExpanded = expandedTeam === team.id;

          return (
            <div key={team.id} className="rounded-lg border border-white/5 bg-black/20 overflow-hidden">
              {/* Team row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Rank */}
                <span className="font-orbitron text-[10px] font-black w-6 text-center" style={{ color: idx < 3 ? '#7C3AED' : '#666' }}>
                  {idx + 1}
                </span>
                {/* Logo */}
                <div className="h-7 w-7 flex-shrink-0 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                  {team.logo_url
                    ? <img src={team.logo_url} alt="" className="h-5 w-5 object-contain" onError={e => e.target.style.display = 'none'} />
                    : <span className="font-orbitron text-[10px] font-black text-gray-500">{(team.name || 'T')[0]}</span>}
                </div>
                {/* Name */}
                <span className="flex-1 font-orbitron text-[11px] font-black text-white truncate"
                  style={{ opacity: isElim ? 0.4 : 1 }}>
                  {team.name}
                </span>
                {/* Alive indicators */}
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const p = teamPlayers[i];
                    const alive = p?.is_alive;
                    return (
                      <div key={i} className="h-4 w-2 rounded-sm"
                        style={{ background: alive ? '#22c55e' : 'rgba(255,255,255,0.08)', boxShadow: alive ? '0 0 3px #22c55e' : 'none' }} />
                    );
                  })}
                </div>
                {/* Kills + */}
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => onKill(team, teamPlayers.find(p => p.is_alive))}
                    disabled={!teamPlayers.some(p => p.is_alive)}
                    className="flex h-7 w-7 items-center justify-center rounded bg-[#22c55e]/10 border border-[#22c55e]/20 hover:bg-[#22c55e]/20 disabled:opacity-30 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#22c55e]" />
                  </button>
                  <span className="font-orbitron text-sm font-black text-[#3B82F6] w-6 text-center">{team.total_tournament_kills || 0}</span>
                  <button
                    onClick={() => {}} // TODO: decrement
                    className="flex h-7 w-7 items-center justify-center rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <Minus className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
                {/* Points */}
                <span className="font-orbitron text-sm font-black text-white w-10 text-center">{team.total_tournament_points || 0}</span>
                {/* Expand */}
                <button onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10 transition-all">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                </button>
              </div>

              {/* Expanded player controls */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-black/30 px-3 py-2 space-y-1">
                  {teamPlayers.map(p => (
                    <div key={p.id} className="flex items-center gap-2 py-1.5">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.is_alive ? '#22c55e' : '#666' }} />
                      <span className="flex-1 text-[11px] text-gray-300 truncate">{p.name}</span>
                      <span className="font-orbitron text-[9px] text-gray-500 w-6 text-center">{p.current_match_kills || 0}K</span>
                      <button
                        onClick={() => onEliminate(p)}
                        disabled={!p.is_alive}
                        className="flex h-6 w-6 items-center justify-center rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-20 transition-all"
                        title="Eliminate"
                      >
                        <Skull className="h-3 w-3 text-red-400" />
                      </button>
                      <button
                        onClick={() => onRevive(p)}
                        disabled={p.is_alive}
                        className="flex h-6 w-6 items-center justify-center rounded bg-[#22c55e]/10 border border-[#22c55e]/20 hover:bg-[#22c55e]/20 disabled:opacity-20 transition-all"
                        title="Revive"
                      >
                        <Heart className="h-3 w-3 text-[#22c55e]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {sortedTeams.length === 0 && (
          <div className="text-center py-8">
            <p className="font-orbitron text-[10px] text-gray-600 tracking-widest">NO TEAMS — ADD TEAMS IN SETUP TAB</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Kill Feed Creator ═══ */
function KillFeedCreator({ teams, players, onSubmit }) {
  const [killerTeamId, setKillerTeamId] = useState('');
  const [killerPlayerId, setKillerPlayerId] = useState('');
  const [weapon, setWeapon] = useState('AK');
  const [victimTeamId, setVictimTeamId] = useState('');
  const [victimPlayerId, setVictimPlayerId] = useState('');
  const [headshot, setHeadshot] = useState(false);
  const [busy, setBusy] = useState(false);

  const killerPlayers = useMemo(() => (players || []).filter(p => p.team_id === killerTeamId && p.is_alive), [players, killerTeamId]);
  const victimPlayers = useMemo(() => (players || []).filter(p => p.team_id === victimTeamId && p.is_alive), [players, victimTeamId]);

  const handleSubmit = async () => {
    if (!killerPlayerId || !victimPlayerId) { toast.error('Select killer and victim'); return; }
    setBusy(true);
    try {
      await onSubmit({
        killer_player_id: killerPlayerId,
        killed_player_id: victimPlayerId,
        weapon,
        headshot,
      });
      toast.success('Kill added to feed!');
      setHeadshot(false);
      setVictimPlayerId('');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const selectStyle = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 font-orbitron text-[11px] text-white focus:border-[#7C3AED]/50 outline-none";

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
        <span className="font-orbitron text-[10px] font-black text-red-400 tracking-widest">KILL FEED CREATOR</span>
      </div>

      <div className="space-y-3">
        {/* Killer team */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">KILLER TEAM</label>
            <select value={killerTeamId} onChange={e => { setKillerTeamId(e.target.value); setKillerPlayerId(''); }} className={selectStyle}>
              <option value="">SELECT...</option>
              {(teams || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">KILLER PLAYER</label>
            <select value={killerPlayerId} onChange={e => setKillerPlayerId(e.target.value)} className={selectStyle} disabled={!killerTeamId}>
              <option value="">SELECT...</option>
              {killerPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Weapon */}
        <div>
          <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">WEAPON</label>
          <select value={weapon} onChange={e => setWeapon(e.target.value)} className={selectStyle}>
            {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Victim team */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">VICTIM TEAM</label>
            <select value={victimTeamId} onChange={e => { setVictimTeamId(e.target.value); setVictimPlayerId(''); }} className={selectStyle}>
              <option value="">SELECT...</option>
              {(teams || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1.5">VICTIM PLAYER</label>
            <select value={victimPlayerId} onChange={e => setVictimPlayerId(e.target.value)} className={selectStyle} disabled={!victimTeamId}>
              <option value="">SELECT...</option>
              {victimPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Headshot toggle */}
        <button
          onClick={() => setHeadshot(!headshot)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 font-orbitron text-[10px] font-black tracking-wider transition-all w-full justify-center border ${
            headshot ? 'bg-[#7C3AED]/15 border-[#7C3AED]/40 text-[#7C3AED]' : 'bg-white/5 border-white/10 text-gray-400'
          }`}>
          <Crosshair className="h-3.5 w-3.5" />
          {headshot ? 'HEADSHOT: ON' : 'HEADSHOT: OFF'}
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={busy || !killerPlayerId || !victimPlayerId}
          className="w-full rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] px-4 py-3 font-orbitron text-[10px] font-black tracking-widest text-white hover:from-[#6D28D9] hover:to-[#2563EB] disabled:opacity-30 transition-all">
          {busy ? 'SUBMITTING...' : '▶ SUBMIT KILL'}
        </button>
      </div>
    </div>
  );
}

/* ═══ Event Buttons ═══ */
function EventButtons({ onEvent }) {
  const [busy, setBusy] = useState(null);
  const handleEvent = async (key) => {
    setBusy(key);
    try {
      await onEvent(key);
      toast.success(`${key.replace(/_/g, ' ').toUpperCase()} triggered!`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full" />
        <span className="font-orbitron text-[10px] font-black text-[#7C3AED] tracking-widest">EVENT TRIGGERS</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {EVENTS.map(ev => {
          const Icon = ev.icon || Zap;
          return (
            <button
              key={ev.key}
              onClick={() => handleEvent(ev.key)}
              disabled={busy === ev.key}
              className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 font-orbitron text-[9px] font-black tracking-wider transition-all hover:bg-white/5 disabled:opacity-50"
              style={{ borderColor: ev.color + '40', color: ev.color }}>
              {busy === ev.key ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
              {ev.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Scene Manager ═══ */
function SceneManager({ currentScreen, onSwitch, obsConnected }) {
  const [busy, setBusy] = useState(null);
  const handleSwitch = async (key) => {
    setBusy(key);
    try {
      await onSwitch(key);
      toast.success(`Scene: ${key.toUpperCase()}`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const groups = {
    pre: { label: 'PRE-MATCH', color: '#3B82F6' },
    live: { label: 'LIVE', color: '#22c55e' },
    post: { label: 'POST-MATCH', color: '#7C3AED' },
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full" />
        <span className="font-orbitron text-[10px] font-black text-[#7C3AED] tracking-widest">SCENE MANAGER</span>
        {obsConnected && (
          <span className="ml-auto flex items-center gap-1 font-orbitron text-[8px] text-[#22c55e] tracking-wider">
            <span className="h-1.5 w-1.5 bg-[#22c55e] rounded-full" />OBS
          </span>
        )}
      </div>

      {Object.entries(groups).map(([gk, group]) => {
        const items = SCENES.filter(s => s.group === gk);
        return (
          <div key={gk} className="mb-3 last:mb-0">
            <p className="font-orbitron text-[8px] font-black tracking-widest mb-2" style={{ color: group.color }}>{group.label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map(s => {
                const Icon = s.icon;
                const isLive = currentScreen === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleSwitch(s.key)}
                    disabled={busy === s.key}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-orbitron text-[8px] font-black tracking-wider transition-all disabled:opacity-50 border"
                    style={isLive
                      ? { background: group.color + '15', borderColor: group.color + '60', color: group.color, boxShadow: `0 0 8px ${group.color}30` }
                      : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{s.label}</span>
                    {isLive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#22c55e]" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ Safe Zone Controls ═══ */
function SafeZoneControls({ onZone }) {
  const [busy, setBusy] = useState(null);
  const zones = [
    { key: 1, label: 'ZONE 1', color: '#22c55e' },
    { key: 2, label: 'ZONE 2', color: '#84cc16' },
    { key: 3, label: 'ZONE 3', color: '#f59e0b' },
    { key: 4, label: 'ZONE 4', color: '#f97316' },
    { key: 5, label: 'ZONE 5', color: '#ef4444' },
    { key: 6, label: 'FINAL', color: '#dc2626' },
  ];

  const handleZone = async (key) => {
    setBusy(key);
    try {
      await onZone(key);
      toast.success(`Zone ${key} triggered`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#131127] p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <div className="h-1.5 w-1.5 bg-[#f59e0b] rounded-full" />
        <span className="font-orbitron text-[10px] font-black text-[#f59e0b] tracking-widest">SAFE ZONE</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {zones.map(z => (
          <button
            key={z.key}
            onClick={() => handleZone(z.key)}
            disabled={busy === z.key}
            className="rounded-lg border px-3 py-3 font-orbitron text-[9px] font-black tracking-wider transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: z.color + '40', color: z.color }}>
            {z.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══ Main LiveControlPanel ═══ */
export default function LiveControlPanel({
  data, refresh, overlayApi: api, obsConnected, onSwitchScene
}) {
  const tournament = data?.tournament;
  const currentMatch = data?.currentMatch;
  const teams = data?.teams || [];
  const players = data?.players || [];
  const currentScreen = data?.overlayState?.current_screen || 'setup_blank';

  const handleStartMatch = async (payload) => {
    await api.startNextMatch(payload);
    refresh();
  };

  const handleSetStatus = async (state) => {
    await api.updateMatchState({ match_id: currentMatch.id, state });
    refresh();
  };

  const handleKill = async (team, player) => {
    if (!player) { toast.error('No alive player on this team'); return; }
    if (!currentMatch) { toast.error('No active match'); return; }
    try {
      await api.addKill({
        match_id: currentMatch.id,
        killer_player_id: player.id,
        killed_player_id: null,
      });
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const handleEliminate = async (player) => {
    try {
      await api.eliminatePlayer({ player_id: player.id, match_id: currentMatch?.id });
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const handleRevive = async (player) => {
    try {
      await api.revivePlayer({ player_id: player.id });
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const handleKillFeedSubmit = async (payload) => {
    if (!currentMatch) throw new Error('No active match');
    await api.addKill({
      match_id: currentMatch.id,
      killer_player_id: payload.killer_player_id,
      killed_player_id: payload.killed_player_id,
      weapon: payload.weapon,
      headshot: payload.headshot,
    });
    refresh();
  };

  const handleEvent = async (key) => {
    // For now, switch overlay screen to match the event
    // Future: trigger specific animation overlays
    if (key === 'first_blood') await onSwitchScene('ff-scoreboard');
    else if (key === 'winner') await onSwitchScene('champions');
    else if (key === 'mvp') await onSwitchScene('mvp');
    else await onSwitchScene('ff-scoreboard');
  };

  const handleZone = async (zone) => {
    // Future: trigger zone animation overlay
    toast.info(`Zone ${zone} — animation overlay coming soon`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top row: Match + Alive + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <MatchControl
          currentMatch={currentMatch}
          tournament={tournament}
          onStartMatch={handleStartMatch}
          onSetStatus={handleSetStatus}
        />
        <AliveCounter teams={teams} onEliminate={handleEliminate} onRevive={handleRevive} />
        <EventButtons onEvent={handleEvent} />
      </div>

      {/* Middle row: Team Grid (2 cols) + Kill Feed (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <TeamControlGrid
            teams={teams}
            players={players}
            onKill={handleKill}
            onEliminate={handleEliminate}
            onRevive={handleRevive}
          />
        </div>
        <KillFeedCreator
          teams={teams}
          players={players}
          onSubmit={handleKillFeedSubmit}
        />
      </div>

      {/* Bottom row: Scene Manager + Safe Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SceneManager
          currentScreen={currentScreen}
          onSwitch={onSwitchScene}
          obsConnected={obsConnected}
        />
        <SafeZoneControls onZone={handleZone} />
      </div>
    </div>
  );
}
