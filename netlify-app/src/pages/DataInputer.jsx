import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import {
  Crosshair, Users, Clock, RefreshCw, Search, Plus,
  ChevronDown, AlertTriangle, XCircle, Heart, Skull,
  Shield, Trash2, RotateCcw, CheckCircle2, MapPin
} from 'lucide-react';

/* ─── Team colour palette ─── */
const COLORS = [
  '#f97316','#3b82f6','#10b981','#a855f7',
  '#ef4444','#06b6d4','#eab308','#ec4899',
  '#8b5cf6','#14b8a6','#f59e0b','#6366f1',
];

export default function DataInputer() {
  const { data, loading, refresh } = useOverlayData(true);
  const [activeTab, setActiveTab] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Add Team state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [teamAdding, setTeamAdding] = useState(false);

  // Add Player state
  const [playerTeamId, setPlayerTeamId] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playerAdding, setPlayerAdding] = useState(false);

  // General busy state
  const [busyState, setBusyState] = useState(null);

  const state = data?.overlayState || {};
  const currentMatch = data?.currentMatch;
  const tournament = data?.tournament;
  const teams = data?.teams || [];
  const players = data?.players || [];
  const killFeed = data?.killFeed || [];
  const eliminations = data?.eliminations || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Live database synchronized!');
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return toast.error('Team name is required');
    setTeamAdding(true);
    try {
      await overlayApi.addTeam({ tournament_id: tournament?.id, team_name: newTeamName, logo_url: newTeamLogo || '' });
      toast.success(`Team "${newTeamName}" added successfully!`);
      setNewTeamName('');
      setNewTeamLogo('');
      refresh();
    } catch (err) {
      toast.error(err.message || 'Error adding team');
    } finally {
      setTeamAdding(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerTeamId) return toast.error('Please select a team');
    if (!newPlayerName) return toast.error('Player name is required');
    setPlayerAdding(true);
    try {
      await overlayApi.addPlayer({ name: newPlayerName, team_id: playerTeamId });
      toast.success(`Player "${newPlayerName}" added!`);
      setNewPlayerName('');
      refresh();
    } catch (err) {
      toast.error(err.message || 'Error adding player');
    } finally {
      setPlayerAdding(false);
    }
  };

  // Filtered teams based on search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter((team) => {
      const matchTeam = team.name.toLowerCase().includes(query);
      const teamPlayers = players.filter((p) => p.team_id === team.id);
      const matchPlayer = teamPlayers.some((p) =>
        p.name.toLowerCase().includes(query)
      );
      return matchTeam || matchPlayer;
    });
  }, [teams, players, searchQuery]);

  // Alive states count
  const totalAlivePlayers = players.filter((p) => p.is_alive).length;
  const totalAliveTeams = useMemo(() => {
    return teams.filter((team) => {
      const teamPlayers = players.filter((p) => p.team_id === team.id);
      return teamPlayers.length > 0 && teamPlayers.some((p) => p.is_alive);
    }).length;
  }, [teams, players]);

  return (
    <div className="flex h-full flex-col bg-[#09090f] text-white">
      {/* ─────────────────────────────────────────
         STATUS BAR — 52px
      ───────────────────────────────────────── */}
      <div className="relative flex h-[52px] items-center justify-between border-b border-[rgba(0,212,255,0.2)] bg-[#0c0c18] px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-5 w-[4px] bg-[#00D4FF]" />
          <div className="leading-none flex items-center gap-2">
            <span className="font-orbitron text-xs font-black uppercase text-white">
              {tournament?.name || 'CHAMPIONSHIP TOUR'}
            </span>
            <span className="text-gray-500 font-bold text-xs">//</span>
            <span className="font-orbitron text-[10px] font-bold text-[#00D4FF] tracking-wider uppercase">
              {currentMatch ? `MATCH #${currentMatch.match_number}` : 'NO ACTIVE MATCH'}
            </span>
            {currentMatch?.map && (
              <>
                <span className="text-gray-500 font-bold text-xs">//</span>
                <span className="font-orbitron text-[10px] font-bold text-white tracking-wider uppercase">
                  {currentMatch.map}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center: Live statistics pill */}
        <div className="flex items-center gap-4 bg-[#09090f] border border-[rgba(0,212,255,0.3)] rounded-full px-4 py-1">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#00D4FF]" />
            <span className="font-orbitron text-[10px] font-black text-white">
              TEAMS ALIVE: <span className="text-[#00D4FF] font-mono">{totalAliveTeams}/{teams.length}</span>
            </span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Skull className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-orbitron text-[10px] font-black text-white">
              PLAYERS ALIVE: <span className="text-orange-400 font-mono">{totalAlivePlayers}/{players.length}</span>
            </span>
          </div>
        </div>

        {/* Right Action */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-[#13131f] text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#00D4FF]' : ''}`} />
        </button>

        {/* Bottom strip gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#00D4FF] via-transparent to-[#FF6B00]" />
      </div>

      {/* ─────────────────────────────────────────
         TAB BAR — 44px
      ───────────────────────────────────────── */}
      <nav className="flex h-11 border-b border-white/5 bg-[#0c0c18] flex-shrink-0">
        {[
          { id: 'live', label: 'LIVE INPUT', icon: Crosshair },
          { id: 'teams', label: 'TEAMS / PLAYERS', icon: Users },
          { id: 'events', label: 'EVENT LOG', icon: Clock },
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
                      color: '#00D4FF',
                      background: 'rgba(0,212,255,0.05)',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00D4FF]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────
         CONTENT — flex-1
      ───────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading && (
          <div className="flex h-40 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00D4FF]" />
          </div>
        )}

        {!loading && (
          <>
            {/* LIVE INPUT TAB */}
            {activeTab === 'live' && (
              <div className="space-y-6">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search team or player..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#0f0f1a] py-3.5 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-[#00D4FF]/40 focus:bg-[#13131f] transition-all"
                  />
                </div>

                {/* Team cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTeams.map((team, idx) => {
                    const teamColor = COLORS[idx % COLORS.length];
                    const teamPlayers = players.filter((p) => p.team_id === team.id);
                    const aliveCount = teamPlayers.filter((p) => p.is_alive).length;

                    return (
                      <TeamInputCard
                        key={team.id}
                        team={team}
                        players={teamPlayers}
                        aliveCount={aliveCount}
                        teamColor={teamColor}
                        currentMatch={currentMatch}
                        tournament={tournament}
                        onAction={refresh}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* TEAMS TAB */}
            {activeTab === 'teams' && (
              <div className="grid grid-cols-12 gap-6">
                {/* Add Team form */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-white mb-4">
                      ADD NEW TEAM
                    </h3>
                    <form onSubmit={handleAddTeam} className="space-y-4">
                      <div>
                        <label className="block font-orbitron text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">
                          Team Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="e.g. TEAM LIQUID"
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FF6B00]/40"
                        />
                      </div>
                      <div>
                        <label className="block font-orbitron text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">
                          Logo URL
                        </label>
                        <input
                          type="url"
                          value={newTeamLogo}
                          onChange={(e) => setNewTeamLogo(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FF6B00]/40"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={teamAdding}
                        className="w-full rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] py-3 font-orbitron text-[10px] font-black tracking-widest text-black hover:brightness-110 shadow-[0_0_12px_rgba(255,107,0,0.2)] transition-all disabled:opacity-50"
                      >
                        {teamAdding ? 'ADDING TEAM...' : 'CREATE TEAM'}
                      </button>
                    </form>
                  </div>

                  {/* Add Player form */}
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-white mb-4">
                      ADD PLAYER TO TEAM
                    </h3>
                    <form onSubmit={handleAddPlayer} className="space-y-4">
                      <div>
                        <label className="block font-orbitron text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">
                          Select Team *
                        </label>
                        <select
                          required
                          value={playerTeamId}
                          onChange={(e) => setPlayerTeamId(e.target.value)}
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FF6B00]/40"
                        >
                          <option value="">— select team —</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-orbitron text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">
                          Player Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="e.g. TSUNAMI"
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FF6B00]/40"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={playerAdding}
                        className="w-full rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] py-3 font-orbitron text-[10px] font-black tracking-widest text-black hover:brightness-110 shadow-[0_0_12px_rgba(255,107,0,0.2)] transition-all disabled:opacity-50"
                      >
                        {playerAdding ? 'ADDING PLAYER...' : 'ADD PLAYER'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Team roster view */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                  <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-white mb-4">
                      TEAMS LIST & ROSTERS
                    </h3>
                    <div className="space-y-4">
                      {teams.map((t, idx) => {
                        const teamColor = COLORS[idx % COLORS.length];
                        const teamPlayers = players.filter((p) => p.team_id === t.id);

                        return (
                          <div
                            key={t.id}
                            className="rounded-lg border border-white/5 bg-black/20 p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              {t.logo_url ? (
                                <img
                                  src={t.logo_url}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover border-2"
                                  style={{ borderColor: teamColor }}
                                />
                              ) : (
                                <div
                                  className="h-10 w-10 rounded-full border-2 flex items-center justify-center font-orbitron text-[10px] font-black"
                                  style={{ borderColor: teamColor, color: teamColor }}
                                >
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-orbitron text-xs font-black text-white">
                                  {t.name}
                                </p>
                                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                                  {teamPlayers.length} players registered
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1.5 flex-wrap max-w-xs">
                              {teamPlayers.map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-block rounded-md bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold text-gray-400 border border-white/5"
                                >
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EVENT LOG TAB */}
            {activeTab === 'events' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KILL LOG */}
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                  <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-[#FF6B00]">
                      KILL LOG
                    </h3>
                    <Crosshair className="h-4 w-4 text-[#FF6B00]" />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {killFeed.length === 0 ? (
                      <p className="text-center text-[11px] text-gray-600 py-6">
                        No kills logged in this match yet
                      </p>
                    ) : (
                      killFeed.map((k, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-bold text-[#FF6B00]">
                              {k.killer_name}
                            </span>
                            <span className="text-gray-500 font-medium">killed</span>
                            <span className="font-orbitron font-bold text-gray-400">
                              {k.killed_name || 'Opponent'}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-600">
                            {new Date(k.created_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ELIMINATION LOG */}
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                  <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-[#ef4444]">
                      ELIMINATION LOG
                    </h3>
                    <Skull className="h-4 w-4 text-[#ef4444]" />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {eliminations.length === 0 ? (
                      <p className="text-center text-[11px] text-gray-600 py-6">
                        No eliminations logged in this match yet
                      </p>
                    ) : (
                      eliminations.map((e, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-red-950/5 border border-red-900/10 p-3 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Skull className="h-3.5 w-3.5 text-[#ef4444]" />
                            <span className="font-orbitron font-bold text-white">
                              {e.player_name}
                            </span>
                            <span className="text-gray-600 font-bold">//</span>
                            <span className="font-orbitron text-[10px] font-black text-gray-500">
                              ELIMINATED
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-600">
                            {new Date(e.created_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────
   TEAM INPUT CARD COMPONENT
───────────────────────────────────────── */
function TeamInputCard({
  team,
  players,
  aliveCount,
  teamColor,
  currentMatch,
  tournament,
  onAction,
}) {
  const [placement, setPlacement] = useState('');
  const [busy, setBusy] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSetPlacement = async () => {
    if (!placement) return toast.error('Select placement rank');
    if (!currentMatch?.id) return toast.error('Start a match first');
    setBusy(true);
    try {
      const r = await overlayApi.setTeamPlacement({
        team_id: team.id,
        match_id: currentMatch.id,
        placement: Number(placement),
        tournament_id: tournament?.id,
      });
      toast.success(
        `${team.name}: Placement #${placement} (+${r.placement_points || 0} pts)`
      );
      setPlacement('');
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error setting placement');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTeam = async () => {
    setBusy(true);
    try {
      await overlayApi.deleteTeam({ team_id: team.id });
      toast.success(`Team "${team.name}" has been removed.`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error deleting team');
    } finally {
      setBusy(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col justify-between"
      style={{
        borderTop: `2px solid ${teamColor}`,
        borderLeft: `1px solid rgba(255, 255, 255, 0.05)`,
        borderRight: `1px solid rgba(255, 255, 255, 0.05)`,
        borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
        background: '#0f0f1a',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt=""
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover border-2"
            style={{ borderColor: teamColor }}
          />
        ) : (
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 font-orbitron text-[10px] font-black"
            style={{ borderColor: teamColor, background: `${teamColor}1a`, color: teamColor }}
          >
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-orbitron text-sm font-black text-white truncate">
            {team.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold" style={{ color: teamColor }}>
              KILLS: {team.total_tournament_kills || 0}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">//</span>
            <span className="text-[10px] font-black text-orange-400">
              PTS: {team.total_tournament_points || 0}
            </span>
          </div>
        </div>

        {/* Alive vertical tally bars */}
        <div className="flex gap-0.5 flex-shrink-0 ml-1">
          {Array.from({ length: Math.max(players.length, 4) }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: 3,
                height: 14,
                background: i < aliveCount ? teamColor : 'rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>

        {/* Delete button */}
        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="ml-2 flex-shrink-0 rounded p-1 text-gray-600 hover:text-red-400 hover:bg-red-950/20 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="ml-2 flex gap-1">
            <button
              onClick={handleDeleteTeam}
              className="rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white"
            >
              YES
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="rounded border border-white/10 px-1.5 py-0.5 text-[8px] font-bold text-gray-400"
            >
              NO
            </button>
          </div>
        )}
      </div>

      {/* Players list */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {players.length === 0 ? (
          <p className="col-span-2 py-3 text-center text-[10px] text-gray-600 font-medium">
            No players registered
          </p>
        ) : (
          players.map((p) => (
            <PlayerInputCard
              key={p.id}
              player={p}
              teamColor={teamColor}
              currentMatch={currentMatch}
              onAction={onAction}
            />
          ))
        )}
      </div>

      {/* Placement row (bottom) */}
      <div className="flex items-center gap-2 border-t border-white/[0.04] bg-black/20 px-3 py-2">
        <Shield className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
        <span className="text-[9px] font-orbitron font-black text-gray-500 flex-shrink-0">
          PLACEMENT
        </span>
        <select
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          className="flex-1 rounded border border-white/10 bg-[#13131f] px-2 py-1 text-[11px] font-semibold text-white outline-none focus:border-[#00D4FF]/40"
        >
          <option value="">— rank —</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              #{n}
            </option>
          ))}
        </select>
        <button
          onClick={handleSetPlacement}
          disabled={busy || !placement}
          className="rounded px-3 py-1 font-orbitron text-[10px] font-black text-black tracking-wider transition-all"
          style={{ background: teamColor }}
        >
          SET
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAYER INPUT CARD COMPONENT
───────────────────────────────────────── */
function PlayerInputCard({ player, teamColor, currentMatch, onAction }) {
  const [busy, setBusy] = useState(null);
  const alive = player.is_alive;
  const kills = player.current_match_kills || 0;

  const handleKill = async () => {
    if (!currentMatch?.id) {
      return toast.error('Start a match first in Director Panel');
    }
    setBusy('kill');
    try {
      const r = await overlayApi.addKill({
        player_id: player.id,
        match_id: currentMatch.id,
        killed_player_name: '',
        killed_team_name: '',
      });
      toast.success(`+1 Kill for ${player.name}! (${r.player.current_match_kills || 0} total)`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error adding kill');
    } finally {
      setBusy(null);
    }
  };

  const handleEliminate = async () => {
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy('elim');
    try {
      await overlayApi.eliminatePlayer({
        player_id: player.id,
        match_id: currentMatch.id,
      });
      toast(`Player "${player.name}" has been eliminated.`, { icon: '💀' });
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error eliminating player');
    } finally {
      setBusy(null);
    }
  };

  const handleRevive = async () => {
    setBusy('revive');
    try {
      await overlayApi.revivePlayer({ player_id: player.id });
      toast.success(`Player "${player.name}" revived!`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error reviving player');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="rounded-lg border p-2.5 transition-all flex flex-col justify-between"
      style={{
        borderColor: alive ? 'rgba(255, 255, 255, 0.06)' : 'rgba(239, 68, 68, 0.1)',
        background: alive ? 'rgba(255, 255, 255, 0.02)' : 'rgba(239, 68, 68, 0.02)',
        opacity: alive ? 1 : 0.6,
      }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {alive ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] flex-shrink-0" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
          )}
          <span
            className={`font-orbitron text-[10px] font-black truncate ${
              alive ? 'text-white' : 'text-gray-500 line-through'
            }`}
          >
            {player.name}
          </span>
        </div>
        <span className="rounded bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#FF6B00] tabular-nums">
          {kills} K
        </span>
      </div>

      {alive ? (
        <div className="flex gap-1">
          <button
            onClick={handleKill}
            disabled={busy !== null}
            className="flex-1 rounded py-1 font-orbitron text-[9px] font-black text-black hover:brightness-110 active:scale-95 transition-all"
            style={{ background: teamColor }}
          >
            {busy === 'kill' ? '...' : '+KILL'}
          </button>
          <button
            onClick={handleEliminate}
            disabled={busy !== null}
            className="rounded border border-red-500/30 hover:bg-red-500/10 px-2 py-1 font-orbitron text-[9px] font-black text-[#ef4444] active:scale-95 transition-all"
          >
            {busy === 'elim' ? '...' : 'ELIM'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleRevive}
          disabled={busy !== null}
          className="w-full rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] py-1 font-orbitron text-[9px] font-black text-gray-400 active:scale-95 transition-all"
        >
          {busy === 'revive' ? '...' : 'REVIVE'}
        </button>
      )}
    </div>
  );
}
