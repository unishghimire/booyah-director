/**
 * DATA INPUTER PANEL
 * Role: Game operator — adds teams/players, logs kills, eliminations,
 * sets placements, manages all live in-game data during a match.
 */
import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import {
  Skull, Crosshair, ChevronDown, Users, Plus, Shield,
  Zap, AlertTriangle, Clock, RefreshCw, Search,
  CheckCircle, XCircle, Heart, Target, Sword
} from 'lucide-react';

/* ─────────────────────────────────────────
   QUICK KILL BUTTON — big, tappable
───────────────────────────────────────── */
function KillButton({ player, teamName, teamColor, currentMatch, onAction }) {
  const [busy, setBusy] = useState(null);

  const handleKill = async () => {
    if (!currentMatch?.id) return toast.error('No active match — start a match first');
    if (!player.is_alive) return toast.error(`${player.name} is already eliminated`);
    setBusy('kill');
    try {
      const r = await overlayApi.addKill({
        player_id: player.id,
        match_id: currentMatch.id,
        killed_player_name: '',
        killed_team_name: '',
      });
      toast.success(`+1 kill for ${player.name}! (${r.player.current_match_kills} this match)`);
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const handleElim = async () => {
    if (!currentMatch?.id) return toast.error('No active match');
    if (!player.is_alive) return toast.error(`${player.name} already eliminated`);
    setBusy('elim');
    try {
      await overlayApi.eliminatePlayer({ player_id: player.id, match_id: currentMatch.id });
      toast(`${player.name} eliminated`, { icon: '💀' });
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const kills = player.current_match_kills || 0;
  const alive = player.is_alive;

  return (
    <div className={`rounded-xl border p-3 transition-all ${alive ? 'border-white/10 bg-[#13131e]' : 'border-red-900/30 bg-red-900/5 opacity-60'}`}>
      {/* Player info row */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-orbitron text-[10px] font-black"
          style={{ background: alive ? teamColor + '33' : '#1f1f1f', color: alive ? teamColor : '#555' }}>
          {player.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black truncate ${alive ? 'text-white' : 'text-gray-600 line-through'}`}>{player.name}</p>
          <p className="text-[9px] text-gray-600 truncate">{teamName}</p>
        </div>
        {/* Kill count badge */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1">
          <Skull className="h-3 w-3 text-orange-400" />
          <span className="font-orbitron text-sm font-black text-orange-400">{kills}</span>
        </div>
        {/* Status */}
        {alive
          ? <Heart className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
          : <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
        }
      </div>

      {/* Action buttons */}
      {alive && (
        <div className="flex gap-2">
          <button onClick={handleKill} disabled={!!busy}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-xs font-black text-black hover:bg-orange-400 disabled:opacity-50 transition-all active:scale-95">
            {busy === 'kill' ? <div className="h-3 w-3 animate-spin rounded-full border border-black border-t-transparent" /> : <><Crosshair className="h-3.5 w-3.5" /> +KILL</>}
          </button>
          <button onClick={handleElim} disabled={!!busy}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-700 bg-red-900/30 px-3 py-2.5 text-xs font-black text-red-400 hover:bg-red-700 hover:text-white disabled:opacity-50 transition-all active:scale-95">
            {busy === 'elim' ? '…' : <><AlertTriangle className="h-3 w-3" /> ELIM</>}
          </button>
        </div>
      )}
      {!alive && (
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-red-900/20 py-2">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          <span className="text-xs font-bold text-red-700">ELIMINATED</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   TEAM CARD — shows all players + placement
───────────────────────────────────────── */
const TEAM_COLORS = [
  '#f97316','#3b82f6','#10b981','#a855f7',
  '#ef4444','#06b6d4','#eab308','#ec4899',
  '#8b5cf6','#14b8a6','#f59e0b','#6366f1',
];

function TeamCard({ team, players, currentMatch, tournament, onAction, colorIndex }) {
  const [placement, setPlacement] = useState('');
  const [busy, setBusy] = useState(false);
  const color = TEAM_COLORS[colorIndex % TEAM_COLORS.length];
  const teamPlayers = players.filter(p => p.team_id === team.id);
  const alive = teamPlayers.filter(p => p.is_alive).length;
  const total = teamPlayers.length;
  const teamKills = team.total_tournament_kills || 0;
  const teamPts = team.total_tournament_points || 0;

  const setPlace = async () => {
    if (!placement) return toast.error('Select a placement');
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy(true);
    try {
      const r = await overlayApi.setTeamPlacement({
        team_id: team.id,
        match_id: currentMatch.id,
        placement: Number(placement),
        tournament_id: tournament.id,
      });
      toast.success(`${team.name}: #${placement} (${r.placement_points}pts)`);
      setPlacement('');
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border bg-[#0f0f1a] overflow-hidden" style={{ borderColor: color + '33' }}>
      {/* Team header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: color + '15', borderBottom: `1px solid ${color}22` }}>
        {team.logo_url ? (
          <img src={team.logo_url} alt="" className="h-8 w-8 rounded-full object-cover border" style={{ borderColor: color + '66' }} onError={e => e.target.style.display='none'} />
        ) : (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border font-orbitron text-[10px] font-black" style={{ background: color + '22', borderColor: color + '55', color }}>
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-orbitron text-sm font-black text-white truncate">{team.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-gray-500">{alive}/{total} alive</span>
            <span className="text-[10px]" style={{ color }}>{teamKills} kills</span>
            <span className="text-[10px] font-bold text-orange-400">{teamPts} pts</span>
          </div>
        </div>
        {/* Alive dots */}
        <div className="flex gap-0.5">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="h-3 w-1.5 rounded-sm" style={{
              background: i < alive ? color : '#374151',
              opacity: i < alive ? 1 : 0.3,
            }} />
          ))}
        </div>
      </div>

      {/* Players grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {teamPlayers.length === 0 && (
          <p className="col-span-2 py-3 text-center text-xs text-gray-600">No players</p>
        )}
        {teamPlayers.map(p => (
          <KillButton key={p.id} player={p} teamName={team.name} teamColor={color} currentMatch={currentMatch} onAction={onAction} />
        ))}
      </div>

      {/* Placement setter */}
      <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2.5" style={{ background: '#00000033' }}>
        <Shield className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-[10px] font-bold text-gray-500 flex-shrink-0">PLACE:</span>
        <div className="relative flex-1">
          <select value={placement} onChange={e => setPlacement(e.target.value)}
            className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-orange-500/50">
            <option value="">— pick rank —</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>#{n}</option>
            ))}
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

/* ─────────────────────────────────────────
   ADD TEAM FORM
───────────────────────────────────────── */
function AddTeamForm({ tournament, onAdded }) {
  const [open, setOpen]   = useState(false);
  const [name, setName]   = useState('');
  const [logo, setLogo]   = useState('');
  const [players, setPlayers] = useState(['', '', '', '']);
  const [busy, setBusy]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Team name required');
    if (!tournament?.id) return toast.error('Create a tournament first (Director panel)');
    setBusy(true);
    try {
      await overlayApi.addTeam({
        tournament_id: tournament.id,
        team_name: name.trim(),
        logo_url: logo.trim() || null,
        player_names: players.filter(p => p.trim()),
      });
      toast.success(`${name} added!`);
      setName(''); setLogo(''); setPlayers(['', '', '', '']); setOpen(false);
      onAdded?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
          <Plus className="h-3.5 w-3.5 text-green-400" />
        </div>
        <span className="font-orbitron text-xs font-black text-white">ADD NEW TEAM</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <form onSubmit={submit} className="border-t border-white/10 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Team Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BTR Zuxxy"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Logo URL</label>
              <input value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://…"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Players (up to 4)</label>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p, i) => (
                <input key={i} value={p} onChange={e => { const arr = [...players]; arr[i] = e.target.value; setPlayers(arr); }}
                  placeholder={`Player ${i + 1}`}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50" />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 rounded-lg bg-green-600 py-2.5 text-xs font-black text-white hover:bg-green-500 disabled:opacity-40 transition-all">
              {busy ? 'Adding…' : 'Add Team'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   LIVE KILL FEED (real-time log)
───────────────────────────────────────── */
function LiveKillFeed({ killFeed, eliminations }) {
  const recentKills = useMemo(() =>
    [...(killFeed || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 12)
  , [killFeed]);

  const recentElims = useMemo(() =>
    [...(eliminations || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6)
  , [eliminations]);

  const fmt = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-white/10">
        {/* Kill feed */}
        <div>
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <Crosshair className="h-3.5 w-3.5 text-orange-400" />
            <h3 className="font-orbitron text-[10px] font-black text-white">KILL FEED</h3>
            <span className="ml-auto rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-black text-black">{recentKills.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {recentKills.length === 0 && <p className="py-4 text-center text-[10px] text-gray-600">No kills yet</p>}
            {recentKills.map((k, i) => (
              <div key={k.id || i} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                <span className="text-[9px] text-gray-600 flex-shrink-0 font-mono">{fmt(k.timestamp)}</span>
                <span className="font-bold text-[11px] text-orange-400 truncate">{k.killer_name}</span>
                {k.killed_player_name && (
                  <>
                    <Skull className="h-3 w-3 text-gray-600 flex-shrink-0" />
                    <span className="text-[11px] text-red-400 truncate">{k.killed_player_name}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Elimination feed */}
        <div>
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <h3 className="font-orbitron text-[10px] font-black text-white">ELIMINATIONS</h3>
            <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">{recentElims.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {recentElims.length === 0 && <p className="py-4 text-center text-[10px] text-gray-600">No eliminations</p>}
            {recentElims.map((e, i) => (
              <div key={e.id || i} className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-900/30 px-2 py-1.5">
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="font-bold text-[11px] text-red-400 truncate">{e.eliminated_player_name}</span>
                <span className="text-[9px] text-gray-600 truncate ml-auto">{e.eliminated_team_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MATCH STATUS HEADER
───────────────────────────────────────── */
function MatchStatusBar({ tournament, currentMatch, teams, players }) {
  if (!tournament) return (
    <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-yellow-400" />
      <p className="text-sm font-bold text-yellow-300">No tournament — go to Director panel to create one first</p>
    </div>
  );

  const matchState = currentMatch?.state || 'idle';
  const aliveTeams = (teams || []).filter(t => {
    const tp = (players || []).filter(p => p.team_id === t.id);
    return tp.length === 0 || tp.some(p => p.is_alive);
  }).length;
  const totalAlive = (players || []).filter(p => p.is_alive).length;
  const totalPlayers = (players || []).length;

  const stateColor = { live: '#ef4444', pre_match: '#3b82f6', ended: '#6b7280', idle: '#4b5563' };
  const stateLabel = { live: '● LIVE', pre_match: '◐ PRE-MATCH', ended: '■ ENDED', idle: '○ IDLE' };

  return (
    <div className="flex items-center gap-0 rounded-xl border border-white/10 bg-[#0f0f1a] overflow-hidden">
      {[
        { label: 'MATCH', value: `#${currentMatch?.match_number || 0}`, accent: true },
        { label: 'MAP', value: currentMatch?.map_name || '—' },
        { label: 'TEAMS ALIVE', value: `${aliveTeams} / ${teams?.length || 0}` },
        { label: 'PLAYERS ALIVE', value: `${totalAlive} / ${totalPlayers}` },
      ].map(({ label, value, accent }) => (
        <div key={label} className="flex flex-1 flex-col border-r border-white/10 px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">{label}</p>
          <p className={`font-orbitron text-sm font-black ${accent ? 'text-orange-400' : 'text-white'}`}>{value}</p>
        </div>
      ))}
      <div className="flex flex-col px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">STATUS</p>
        <p className="font-orbitron text-sm font-black" style={{ color: stateColor[matchState] || '#6b7280' }}>
          {stateLabel[matchState] || 'IDLE'}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: DATA INPUTER PANEL
═══════════════════════════════════════════ */
const INPUT_TABS = [
  { key: 'live',   label: 'Live Game Input', icon: Crosshair },
  { key: 'teams',  label: 'Teams & Players', icon: Users },
  { key: 'feed',   label: 'Event Feed',       icon: Clock },
];

export default function DataInputer() {
  const { data, loading, refresh } = useOverlayData(true);
  const [tab, setTab] = useState('live');
  const [search, setSearch] = useState('');

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="font-orbitron text-sm text-gray-500">Loading Data Inputer…</p>
        </div>
      </div>
    );
  }

  const { tournament, teams, players, current_match, kill_feed, eliminations } = data;

  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams || [];
    const q = search.toLowerCase();
    return (teams || []).filter(t =>
      t.name.toLowerCase().includes(q) ||
      (players || []).filter(p => p.team_id === t.id).some(p => p.name.toLowerCase().includes(q))
    );
  }, [teams, players, search]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Match status bar */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0c14] px-5 py-3">
        <MatchStatusBar tournament={tournament} currentMatch={current_match} teams={teams} players={players} />
      </div>

      {/* Tab nav */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0c14] px-5">
        <div className="flex gap-0">
          {INPUT_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === key
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-600 hover:text-gray-300 hover:border-white/20'
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-1">
            <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] text-gray-600 hover:text-gray-300 transition-all">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#09090f] p-5">

        {/* LIVE GAME INPUT */}
        {tab === 'live' && (
          <div>
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search player or team name…"
                className="w-full rounded-xl border border-white/10 bg-[#0f0f1a] py-3 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/40" />
            </div>

            {/* Teams grid */}
            {filteredTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Users className="h-12 w-12 text-gray-700" />
                <p className="font-orbitron text-sm text-gray-500">
                  {(teams || []).length === 0 ? 'No teams yet' : 'No results for "' + search + '"'}
                </p>
                {(teams || []).length === 0 && (
                  <p className="text-xs text-gray-700">Switch to Teams & Players tab to add teams</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredTeams.map((team, i) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    players={players || []}
                    currentMatch={current_match}
                    tournament={tournament}
                    onAction={refresh}
                    colorIndex={(teams || []).indexOf(team)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAMS & PLAYERS MANAGEMENT */}
        {tab === 'teams' && (
          <div className="max-w-3xl space-y-4">
            <AddTeamForm tournament={tournament} onAdded={refresh} />
            <div className="space-y-3">
              {(teams || []).length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-12">
                  <Users className="h-10 w-10 text-gray-700" />
                  <p className="text-sm text-gray-600">No teams yet — add the first team above</p>
                </div>
              )}
              {(teams || []).map((team, i) => {
                const tp = (players || []).filter(p => p.team_id === team.id);
                const color = TEAM_COLORS[i % TEAM_COLORS.length];
                return (
                  <div key={team.id} className="rounded-xl border bg-[#0f0f1a] p-4" style={{ borderColor: color + '33' }}>
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border font-orbitron text-xs font-black" style={{ background: color + '22', borderColor: color + '55', color }}>
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-orbitron text-sm font-black text-white">{team.name}</p>
                        <p className="text-xs text-gray-500">{tp.length} players · {team.total_tournament_kills || 0} kills · {team.total_tournament_points || 0} pts</p>
                      </div>
                    </div>
                    {tp.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tp.map(p => (
                          <span key={p.id} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${p.is_alive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-700/30 bg-red-900/10 text-red-600 line-through'}`}>
                            {p.is_alive ? <Heart className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                            {p.name}
                            {(p.current_match_kills || 0) > 0 && <span className="text-orange-400">({p.current_match_kills})</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EVENT FEED */}
        {tab === 'feed' && (
          <div className="max-w-3xl">
            <LiveKillFeed killFeed={kill_feed} eliminations={eliminations} />
          </div>
        )}
      </div>
    </div>
  );
}
