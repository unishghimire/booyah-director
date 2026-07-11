/**
 * DATA INPUTER PANEL
 * Role: Live game operator — adds teams/players, logs kills,
 * eliminations, placements. Everything that happens in the game.
 *
 * Tabs:
 *  1. LIVE INPUT  — per-player kill/elim buttons organised by team
 *  2. TEAMS       — add / manage teams & players
 *  3. EVENT LOG   — live kill + elimination feed
 */
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import {
  Crosshair, Users, Clock, RefreshCw, Search, Plus,
  ChevronDown, AlertTriangle, XCircle, Heart, Skull,
  Shield, Trash2, RotateCcw, CheckCircle2
} from 'lucide-react';

/* ─── Team colour palette ─── */
const COLORS = [
  '#f97316','#3b82f6','#10b981','#a855f7',
  '#ef4444','#06b6d4','#eab308','#ec4899',
  '#8b5cf6','#14b8a6','#f59e0b','#6366f1',
];

/* ════════════════════════════════════════
   PLAYER CARD — Kill + Elim buttons
════════════════════════════════════════ */
function PlayerCard({ player, teamColor, currentMatch, onAction }) {
  const [busy, setBusy] = useState(null);
  const alive = player.is_alive;
  const kills = player.current_match_kills || 0;

  const addKill = async () => {
    if (!currentMatch?.id) return toast.error('Start a match first (Director panel → Match Control)');
    setBusy('kill');
    try {
      const r = await overlayApi.addKill({ player_id: player.id, match_id: currentMatch.id, killed_player_name: '', killed_team_name: '' });
      toast.success(`+1 kill — ${player.name} now has ${r.player.current_match_kills} kills`);
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const eliminate = async () => {
    if (!currentMatch?.id) return toast.error('Start a match first');
    setBusy('elim');
    try {
      await overlayApi.eliminatePlayer({ player_id: player.id, match_id: currentMatch.id });
      toast(`${player.name} eliminated`, { icon: '💀' });
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const revive = async () => {
    setBusy('revive');
    try {
      await overlayApi.revivePlayer({ player_id: player.id });
      toast.success(`${player.name} revived`);
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <div className={`rounded-xl border p-3 transition-all ${alive ? 'border-white/10 bg-[#13131e]' : 'border-red-900/20 bg-red-950/10 opacity-60'}`}>
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-orbitron text-[9px] font-black"
          style={{ background: alive ? teamColor + '33' : '#1a1a1a', color: alive ? teamColor : '#555' }}>
          {player.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-black truncate ${alive ? 'text-white' : 'text-gray-600 line-through'}`}>{player.name}</p>
        </div>
        {/* Kill counter */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2 py-0.5">
          <Skull className="h-2.5 w-2.5 text-orange-400" />
          <span className="font-orbitron text-xs font-black text-orange-400">{kills}</span>
        </div>
        {/* Status dot */}
        {alive
          ? <Heart className="h-3 w-3 flex-shrink-0 text-green-400" />
          : <XCircle className="h-3 w-3 flex-shrink-0 text-red-600" />
        }
      </div>

      {/* Buttons */}
      {alive ? (
        <div className="flex gap-1.5">
          <button onClick={addKill} disabled={!!busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-black transition-all active:scale-95 disabled:opacity-40"
            style={{ background: busy === 'kill' ? teamColor + 'aa' : teamColor }}>
            {busy === 'kill'
              ? <div className="h-3 w-3 animate-spin rounded-full border border-black border-t-transparent" />
              : <><Crosshair className="h-3 w-3" />+KILL</>
            }
          </button>
          <button onClick={eliminate} disabled={!!busy}
            className="flex items-center justify-center gap-1 rounded-lg border border-red-700 bg-red-900/30 px-2.5 py-2 text-xs font-black text-red-400 hover:bg-red-700 hover:text-white disabled:opacity-40 transition-all active:scale-95">
            {busy === 'elim' ? '…' : <><XCircle className="h-3 w-3" />ELIM</>}
          </button>
        </div>
      ) : (
        <button onClick={revive} disabled={!!busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-[10px] font-bold text-gray-500 hover:border-green-500/30 hover:text-green-400 disabled:opacity-40 transition-all">
          {busy === 'revive' ? '…' : <><RotateCcw className="h-3 w-3" />REVIVE</>}
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   TEAM CARD — groups all players
════════════════════════════════════════ */
function TeamCard({ team, allPlayers, currentMatch, tournament, onAction, colorIndex }) {
  const [placement, setPlacement] = useState('');
  const [busy, setBusy]           = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const color      = COLORS[colorIndex % COLORS.length];
  const teamPlayers = allPlayers.filter(p => p.team_id === team.id);
  const alive       = teamPlayers.filter(p => p.is_alive).length;
  const totalPts    = team.total_tournament_points || 0;
  const totalKills  = team.total_tournament_kills  || 0;

  const setPlace = async () => {
    if (!placement)           return toast.error('Select a placement first');
    if (!currentMatch?.id)    return toast.error('No active match');
    setBusy(true);
    try {
      const r = await overlayApi.setTeamPlacement({ team_id: team.id, match_id: currentMatch.id, placement: Number(placement), tournament_id: tournament.id });
      toast.success(`${team.name}: #${placement} placement (+${r.placement_points ?? '?'} pts)`);
      setPlacement('');
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const deleteTeam = async () => {
    setBusy(true);
    try {
      await overlayApi.deleteTeam({ team_id: team.id });
      toast.success(`${team.name} removed`);
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); setConfirmDel(false); }
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: color + '33', background: '#0f0f1a' }}>
      {/* Team header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: color + '12', borderBottom: `1px solid ${color}22` }}>
        {team.logo_url
          ? <img src={team.logo_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover border-2" style={{ borderColor: color + '66' }} onError={e => e.target.style.display = 'none'} />
          : <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 font-orbitron text-[10px] font-black" style={{ borderColor: color + '55', background: color + '22', color }}>{team.name.slice(0, 2).toUpperCase()}</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-orbitron text-sm font-black text-white truncate">{team.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-gray-500">{alive}/{teamPlayers.length} alive</span>
            <span className="text-[10px] font-bold" style={{ color }}>{totalKills} kills</span>
            <span className="text-[10px] font-black text-orange-400">{totalPts} pts</span>
          </div>
        </div>
        {/* Alive tally */}
        <div className="flex gap-0.5 flex-shrink-0">
          {Array.from({ length: teamPlayers.length || 4 }).map((_, i) => (
            <div key={i} className="rounded-sm" style={{ width: 5, height: i < alive ? 14 : 7, background: i < alive ? color : '#374151', marginTop: i < alive ? 0 : 4 }} />
          ))}
        </div>
        {/* Delete */}
        {!confirmDel
          ? <button onClick={() => setConfirmDel(true)} className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
          : <div className="ml-2 flex gap-1">
              <button onClick={deleteTeam} disabled={busy} className="rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black text-white hover:bg-red-500">DEL</button>
              <button onClick={() => setConfirmDel(false)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-gray-400">NO</button>
            </div>
        }
      </div>

      {/* Players grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {teamPlayers.length === 0
          ? <p className="col-span-2 py-3 text-center text-[10px] text-gray-600">No players added</p>
          : teamPlayers.map(p => <PlayerCard key={p.id} player={p} teamColor={color} currentMatch={currentMatch} onAction={onAction} />)
        }
      </div>

      {/* Placement row */}
      <div className="flex items-center gap-2 border-t border-white/5 bg-black/20 px-3 py-2">
        <Shield className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
        <span className="text-[10px] font-bold text-gray-600 flex-shrink-0">PLACEMENT:</span>
        <div className="relative flex-1">
          <select value={placement} onChange={e => setPlacement(e.target.value)}
            className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-orange-500/40">
            <option value="">— rank —</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>#{n}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
        </div>
        <button onClick={setPlace} disabled={busy || !placement}
          className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-black text-black hover:bg-orange-400 disabled:opacity-40 transition-all">
          {busy ? '…' : 'SET'}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ADD TEAM FORM
════════════════════════════════════════ */
function AddTeamForm({ tournament, onAdded }) {
  const [open, setOpen]               = useState(false);
  const [teamName, setTeamName]       = useState('');
  const [logoUrl, setLogoUrl]         = useState('');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [busy, setBusy]               = useState(false);

  const updatePlayer = (i, val) => {
    const arr = [...playerNames];
    arr[i] = val;
    setPlayerNames(arr);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!teamName.trim())  return toast.error('Team name is required');
    if (!tournament?.id)   return toast.error('No active tournament — go to Director → Setup tab to create one first');
    setBusy(true);
    try {
      const r = await overlayApi.addTeam({
        tournament_id: tournament.id,
        team_name:     teamName.trim(),
        logo_url:      logoUrl.trim() || null,
        player_names:  playerNames.filter(p => p.trim()),
      });
      toast.success(`✅ ${teamName} added with ${r.players?.length || 0} players!`);
      setTeamName(''); setLogoUrl(''); setPlayerNames(['', '', '', '']); setOpen(false);
      onAdded?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!tournament) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-400" />
        <p className="text-sm font-bold text-yellow-300">
          No tournament yet — go to the <span className="text-orange-400">Director</span> panel → Setup tab to create a tournament first.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
      {/* Toggle */}
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-all">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10">
          <Plus className="h-4 w-4 text-green-400" />
        </div>
        <div>
          <p className="font-orbitron text-sm font-black text-white">ADD NEW TEAM</p>
          <p className="text-[10px] text-gray-600">{tournament.name} · up to 12 teams</p>
        </div>
        <ChevronDown className={`ml-auto h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-white/10 p-5 space-y-4">
          {/* Team name + logo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">Team Name *</label>
              <input value={teamName} onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. BTR Zuxxy" autoFocus
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">Team Logo URL</label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://img.png (optional)"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-orange-500/50 transition-colors" />
            </div>
          </div>

          {/* Logo preview */}
          {logoUrl.trim() && (
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="preview" className="h-10 w-10 rounded-full object-cover border border-white/20" onError={e => e.target.style.display='none'} />
              <span className="text-[10px] text-gray-500">Logo preview</span>
            </div>
          )}

          {/* Players */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">Players (up to 4)</label>
            <div className="grid grid-cols-2 gap-2">
              {playerNames.map((p, i) => (
                <input key={i} value={p} onChange={e => updatePlayer(i, e.target.value)}
                  placeholder={`Player ${i + 1} name`}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-bold text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors" />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-black text-white hover:bg-green-500 disabled:opacity-40 transition-all">
              {busy ? 'Adding…' : '+ Add Team'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   MATCH STATUS BAR
════════════════════════════════════════ */
function MatchStatusBar({ tournament, currentMatch, teams, players }) {
  if (!tournament) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <p className="text-sm font-bold text-yellow-300">No tournament — create one in Director panel first</p>
      </div>
    );
  }

  const matchState  = currentMatch?.state || 'idle';
  const aliveTeams  = (teams  || []).filter(t => (players || []).filter(p => p.team_id === t.id).some(p => p.is_alive)).length;
  const totalAlive  = (players || []).filter(p => p.is_alive).length;
  const stateColors = { live:'#ef4444', pre_match:'#3b82f6', ended:'#6b7280', idle:'#4b5563' };
  const stateLabels = { live:'● LIVE', pre_match:'◐ PRE-MATCH', ended:'■ ENDED', idle:'○ IDLE' };

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-[#0f0f1a]">
      {[
        { label:'TOURNAMENT', value: tournament.name, wide: true },
        { label:'MATCH #',    value: currentMatch?.match_number || '—', accent: true },
        { label:'MAP',        value: currentMatch?.map_name || '—' },
        { label:'TEAMS ALIVE',value: `${aliveTeams} / ${(teams||[]).length}` },
        { label:'PLAYERS',    value: `${totalAlive} alive` },
      ].map(({ label, value, accent, wide }) => (
        <div key={label} className={`flex flex-col border-r border-white/10 px-4 py-3 ${wide ? 'flex-1' : 'min-w-[100px]'}`}>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">{label}</p>
          <p className={`font-orbitron text-sm font-black truncate ${accent ? 'text-orange-400' : 'text-white'}`}>{value}</p>
        </div>
      ))}
      <div className="flex flex-col px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">STATUS</p>
        <p className="font-orbitron text-sm font-black" style={{ color: stateColors[matchState] || '#6b7280' }}>
          {stateLabels[matchState] || 'IDLE'}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   EVENT FEED
════════════════════════════════════════ */
function EventFeed({ killFeed, eliminations }) {
  const kills = useMemo(() => [...(killFeed || [])].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,15), [killFeed]);
  const elims = useMemo(() => [...(eliminations || [])].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,8), [eliminations]);
  const fmt   = ts => { try { return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }); } catch { return ''; } };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Kill feed */}
      <div className="rounded-2xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Crosshair className="h-4 w-4 text-orange-400" />
          <h3 className="font-orbitron text-xs font-black text-white">KILL LOG</h3>
          <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black text-black">{kills.length}</span>
        </div>
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {kills.length === 0 && <p className="py-6 text-center text-xs text-gray-600">No kills recorded yet</p>}
          {kills.map((k, i) => (
            <div key={k.id || i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="flex-shrink-0 font-mono text-[9px] text-gray-600">{fmt(k.timestamp)}</span>
              <span className="font-bold text-xs text-orange-400 truncate">{k.killer_name}</span>
              <Skull className="h-3 w-3 flex-shrink-0 text-gray-600" />
              <span className="text-xs text-red-400 truncate">{k.killed_player_name || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Elimination feed */}
      <div className="rounded-2xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <XCircle className="h-4 w-4 text-red-400" />
          <h3 className="font-orbitron text-xs font-black text-white">ELIMINATION LOG</h3>
          <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white">{elims.length}</span>
        </div>
        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {elims.length === 0 && <p className="py-6 text-center text-xs text-gray-600">No eliminations recorded</p>}
          {elims.map((e, i) => (
            <div key={e.id || i} className="flex items-center gap-2 rounded-lg border border-red-900/20 bg-red-950/20 px-3 py-2">
              <XCircle className="h-3 w-3 flex-shrink-0 text-red-500" />
              <span className="font-bold text-xs text-red-400 truncate flex-1">{e.eliminated_player_name}</span>
              <span className="flex-shrink-0 text-[9px] text-gray-600 truncate">{e.eliminated_team_name}</span>
              <span className="flex-shrink-0 font-mono text-[9px] text-gray-700">{fmt(e.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════ */
const TABS = [
  { key: 'live',   label: 'Live Input',    icon: Crosshair },
  { key: 'teams',  label: 'Teams',         icon: Users },
  { key: 'events', label: 'Event Log',     icon: Clock },
];

export default function DataInputer() {
  const { data, loading, error, refresh } = useOverlayData(true);
  const [tab, setTab]     = useState('live');
  const [search, setSearch] = useState('');

  /* Never get stuck on loading — show error UI instead */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="font-orbitron text-sm text-gray-500">Loading Data Inputer…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <p className="font-orbitron text-sm text-white mb-2">API Connection Error</p>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button onClick={refresh} className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-black text-black hover:bg-orange-400">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { tournament, teams, players, current_match, kill_feed, eliminations } = data || {};

  const filteredTeams = useMemo(() => {
    const all = teams || [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (players || []).filter(p => p.team_id === t.id).some(p => p.name.toLowerCase().includes(q))
    );
  }, [teams, players, search]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Status bar */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0c14] px-5 py-3">
        <MatchStatusBar tournament={tournament} currentMatch={current_match} teams={teams} players={players} />
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center border-b border-white/10 bg-[#0c0c14] px-5">
        <div className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === key ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-600 hover:text-gray-300'
              }`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] text-gray-600 hover:text-gray-300 transition-all">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#09090f] p-5">

        {/* ── LIVE INPUT ── */}
        {tab === 'live' && (
          <>
            {!current_match && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-400" />
                <p className="text-sm text-blue-300">
                  <strong>Tip:</strong> Go to <span className="text-orange-400 font-bold">Director → Match Control</span> to start a match before logging kills.
                </p>
              </div>
            )}
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search team or player name…"
                className="w-full rounded-xl border border-white/10 bg-[#0f0f1a] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/30" />
            </div>

            {filteredTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Users className="h-12 w-12 text-gray-700" />
                <p className="font-orbitron text-sm text-gray-600">
                  {(teams || []).length === 0 ? 'No teams yet — go to Teams tab to add some' : `No results for "${search}"`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredTeams.map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    allPlayers={players || []}
                    currentMatch={current_match}
                    tournament={tournament}
                    onAction={refresh}
                    colorIndex={(teams || []).findIndex(t => t.id === team.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TEAMS MANAGEMENT ── */}
        {tab === 'teams' && (
          <div className="max-w-3xl space-y-4">
            <AddTeamForm tournament={tournament} onAdded={refresh} />
            <div className="space-y-3">
              {(teams || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-14">
                  <Users className="h-10 w-10 text-gray-700" />
                  <p className="font-orbitron text-sm text-gray-600">No teams yet — add the first team above</p>
                </div>
              ) : (
                (teams || []).map((team, i) => {
                  const tp    = (players || []).filter(p => p.team_id === team.id);
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={team.id} className="rounded-2xl border bg-[#0f0f1a] p-4" style={{ borderColor: color + '33' }}>
                      <div className="flex items-center gap-3">
                        {team.logo_url
                          ? <img src={team.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" onError={e=>e.target.style.display='none'} />
                          : <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 font-orbitron text-xs font-black" style={{ borderColor: color + '55', background: color + '22', color }}>{team.name.slice(0,2)}</div>
                        }
                        <div>
                          <p className="font-orbitron text-sm font-black text-white">{team.name}</p>
                          <p className="text-xs text-gray-500">{tp.length} players · {team.total_tournament_kills||0} kills · {team.total_tournament_points||0} pts</p>
                        </div>
                      </div>
                      {tp.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tp.map(p => (
                            <span key={p.id} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${p.is_alive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-700/20 bg-red-950/20 text-red-600'}`}>
                              {p.is_alive ? <Heart className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                              {p.name}
                              {(p.current_match_kills||0) > 0 && <span className="text-orange-400">({p.current_match_kills}💀)</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── EVENT LOG ── */}
        {tab === 'events' && (
          <div className="max-w-5xl">
            <EventFeed killFeed={kill_feed} eliminations={eliminations} />
          </div>
        )}
      </div>
    </div>
  );
}
