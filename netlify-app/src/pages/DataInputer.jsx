import ImageUpload from '@/components/ImageUpload';
import { SectionBoundary, safeArray } from '@/components/ErrorBoundary';
import React, { useState, useMemo } from 'react';
import SheetImport from '@/components/control/SheetImport';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import {
  Crosshair, Users, Clock, RefreshCw, Search, AlertTriangle,
  Skull, Shield, Trash2
} from 'lucide-react';

/* ─── Team colour palette ─── */
const COLORS = [
  '#ff4e00','#ff4e00','#7BC043','#ff4e00',
  '#ef4444','#06b6d4','#eab308','#ec4899',
  '#ffaa00','#ffaa00','#ffaa00','#ff4e00',
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
  const [newPlayerPhoto, setNewPlayerPhoto] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('');
  const [playerAdding, setPlayerAdding] = useState(false);

  // General busy state

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
    if (!newTeamName.trim()) return toast.error('Team name is required');
    if (!tournament?.id) return toast.error('Create a tournament first in the Director Panel');
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
    if (!newPlayerName.trim()) return toast.error('Player name is required');
    if (!tournament?.id) return toast.error('No active tournament found');
    setPlayerAdding(true);
    try {
      await overlayApi.addPlayer({ name: newPlayerName, team_id: playerTeamId, tournament_id: tournament?.id, photo_url: newPlayerPhoto || '', role: newPlayerRole || '' });
      toast.success(`Player "${newPlayerName}" added!`);
      setNewPlayerName('');
      setNewPlayerPhoto('');
      setNewPlayerRole('');
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
      <div className="relative flex h-[52px] items-center justify-between border-b border-[rgba(255,170,0,0.2)] bg-[#0c0c18] px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-5 w-[4px] bg-[#ffaa00]" />
          <div className="leading-none flex items-center gap-2">
            <span className="font-orbitron text-xs font-black uppercase text-white">
              {tournament?.name || 'CHAMPIONSHIP TOUR'}
            </span>
            <span className="text-gray-500 font-bold text-xs">//</span>
            <span className="font-orbitron text-[10px] font-bold text-[#ffaa00] tracking-wider uppercase">
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
        <div className="flex items-center gap-4 bg-[#09090f] border border-[rgba(255,170,0,0.3)] rounded-full px-4 py-1">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#ffaa00]" />
            <span className="font-orbitron text-[10px] font-black text-white">
              TEAMS ALIVE: <span className="text-[#ffaa00] font-mono">{totalAliveTeams}/{teams.length}</span>
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
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#ffaa00]' : ''}`} />
        </button>

        {/* Bottom strip gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#ffaa00] via-transparent to-[#ff4e00]" />
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
                      color: '#ffaa00',
                      background: 'rgba(255,170,0,0.05)',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ffaa00]" />
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
            <RefreshCw className="h-8 w-8 animate-spin text-[#ffaa00]" />
          </div>
        )}

        {!loading && (
          <>
            {/* LIVE INPUT TAB */}
            {activeTab === 'live' && (
              <SectionBoundary label="LIVE INPUT">
              <div className="space-y-6">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search team or player..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#0f0f1a] py-3.5 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-[#ffaa00]/40 focus:bg-[#13131f] transition-all"
                  />
                </div>

                {!currentMatch && (
                  <div className='rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center gap-3'>
                    <AlertTriangle className='h-5 w-5 text-yellow-400 flex-shrink-0' />
                    <div>
                      <p className='font-orbitron text-xs font-black text-yellow-400'>NO ACTIVE MATCH</p>
                      <p className='text-[10px] text-gray-500 mt-0.5'>Start a match in the Director Panel before logging kills or eliminations.</p>
                    </div>
                  </div>
                )}

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
              </SectionBoundary>
            )}

            {/* TEAMS TAB */}
            {activeTab === 'teams' && (
              <SectionBoundary label="TEAMS">
              <div className="grid grid-cols-12 gap-6">
                {/* Google Sheets Import */}
                <div className="col-span-12 mb-2">
                  <SheetImport tournamentId={tournament?.id} onImported={refresh} />
                </div>

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
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#ff4e00]/40"
                        />
                      </div>
                      <ImageUpload
                        value={newTeamLogo}
                        onChange={(url) => setNewTeamLogo(url)}
                        label="Team Logo"
                      />
                      <button
                        type="submit"
                        disabled={teamAdding}
                        className="w-full rounded-lg bg-gradient-to-r from-[#ff4e00] to-[#ffaa00] py-3 font-orbitron text-[10px] font-black tracking-widest text-black hover:brightness-110 shadow-[0_0_12px_rgba(255,78,0,0.2)] transition-all disabled:opacity-50"
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
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#ff4e00]/40"
                        >
                          <option value="">— select team —</option>
                          {safeArray(teams).map((t) => (
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
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#ff4e00]/40"
                        />
                      </div>
                      <div>
                        <label className="block font-orbitron text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">
                          Role / IGN <span className="text-gray-700 normal-case">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={newPlayerRole}
                          onChange={(e) => setNewPlayerRole(e.target.value)}
                          placeholder="e.g. Assaulter, IGL..."
                          className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#ff4e00]/40"
                        />
                      </div>
                      <ImageUpload
                        value={newPlayerPhoto}
                        onChange={(url) => setNewPlayerPhoto(url)}
                        label="Player Photo (optional — shows on MVP overlay)"
                        name={newPlayerName ? `player-${newPlayerName.toLowerCase()}` : 'player-photo'}
                        size="sm"
                      />
                      <button
                        type="submit"
                        disabled={playerAdding}
                        className="w-full rounded-lg bg-gradient-to-r from-[#ff4e00] to-[#ffaa00] py-3 font-orbitron text-[10px] font-black tracking-widest text-black hover:brightness-110 shadow-[0_0_12px_rgba(255,78,0,0.2)] transition-all disabled:opacity-50"
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
                      {safeArray(teams).map((t, idx) => {
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
                              {safeArray(teamPlayers).map((p) => (
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
              </SectionBoundary>
            )}

            {/* EVENT LOG TAB */}
            {activeTab === 'events' && (
              <SectionBoundary label="EVENT LOG">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* KILL LOG */}
                <div className="rounded-xl border border-white/5 bg-[#0f0f1a] p-5">
                  <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-orbitron text-xs font-black tracking-[0.25em] text-[#ff4e00]">
                      KILL LOG
                    </h3>
                    <Crosshair className="h-4 w-4 text-[#ff4e00]" />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {killFeed.length === 0 ? (
                      <p className="text-center text-[11px] text-gray-600 py-6">
                        No kills logged in this match yet
                      </p>
                    ) : (
                      safeArray(killFeed).map((k, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-bold text-[#ff4e00]">
                              {k.killer_name}
                            </span>
                            <span className="text-gray-500 font-medium">killed</span>
                            <span className="font-orbitron font-bold text-gray-400">
                              {k.killed_name || 'Opponent'}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-600">
                            {new Date(k.timestamp || k.created_at || Date.now()).toLocaleTimeString()}
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
                      safeArray(eliminations).map((e, idx) => (
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
                            {new Date(e.timestamp || e.created_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
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

  // Eliminate ALL players on this team (team wiped)
  const handleEliminateAll = async () => {
    if (!currentMatch?.id) return toast.error('Start a match first');
    setBusy(true);
    try {
      const alivePlayers = players.filter(p => p.is_alive);
      if (alivePlayers.length === 0) { toast('No alive players to eliminate', { icon: 'ℹ️' }); return; }
      for (const p of alivePlayers) {
        await overlayApi.eliminatePlayer({
          player_id: p.id, match_id: currentMatch.id,
          player_name: p.name, team_name: team.name,
          tournament_id: currentMatch.tournament_id || '',
        });
      }
      toast(`💀 ${team.name} wiped — all ${alivePlayers.length} players eliminated`, { icon: '💀' });
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error eliminating team');
    } finally {
      setBusy(false);
    }
  };

  // Revive ALL players on this team (full team revive)
  const handleReviveAll = async () => {
    setBusy(true);
    try {
      const deadPlayers = players.filter(p => !p.is_alive);
      if (deadPlayers.length === 0) { toast('All players already alive', { icon: 'ℹ️' }); return; }
      for (const p of deadPlayers) {
        await overlayApi.revivePlayer({ player_id: p.id });
      }
      toast.success(`✅ ${team.name} revived — ${deadPlayers.length} player${deadPlayers.length > 1 ? 's' : ''} back`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error reviving team');
    } finally {
      setBusy(false);
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

        {/* Alive indicator bars — match scoreboard style */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-1">
          <div className="flex gap-0.5">
            {Array.from({ length: Math.max(players.length, 4) }).map((_, i) => {
              const isAlive = players[i] ? players[i].is_alive : false;
              const isEmpty = !players[i];
              return (
                <div key={i} className="rounded-sm transition-all duration-300"
                  style={{
                    width: 5,
                    height: 18,
                    background: isEmpty
                      ? 'rgba(255,255,255,0.05)'
                      : isAlive
                      ? '#22c55e'
                      : 'rgba(255,255,255,0.15)',
                    boxShadow: isAlive ? '0 0 5px #22c55eaa' : 'none',
                  }}
                />
              );
            })}
          </div>
          <span className="font-orbitron text-[7px] font-black"
            style={{ color: aliveCount > 0 ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
            {aliveCount}/{Math.max(players.length, 4)}
          </span>
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
          safeArray(players).map((p) => (
            <PlayerInputCard
              key={p.id}
              player={p}
              team={team}
              teamColor={teamColor}
              currentMatch={currentMatch}
              onAction={onAction}
            />
          ))
        )}
      </div>

      {/* Quick Team Actions — Elim All / Revive All */}
      <div className="flex items-center gap-2 border-t border-white/[0.04] bg-black/10 px-3 py-2">
        <button
          onClick={handleEliminateAll}
          disabled={busy !== false || aliveCount === 0}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 py-1.5 font-orbitron text-[9px] font-black text-red-400 hover:bg-red-500/15 active:scale-95 transition-all disabled:opacity-30"
        >
          <span>💀</span> ELIM ALL
        </button>
        <button
          onClick={handleReviveAll}
          disabled={busy !== false || aliveCount === players.length}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 py-1.5 font-orbitron text-[9px] font-black text-emerald-400 hover:bg-emerald-500/15 active:scale-95 transition-all disabled:opacity-30"
        >
          <span>💚</span> REVIVE ALL
        </button>
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
          className="flex-1 rounded border border-white/10 bg-[#13131f] px-2 py-1 text-[11px] font-semibold text-white outline-none focus:border-[#ffaa00]/40"
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
function PlayerInputCard({ player, team, teamColor, currentMatch, onAction }) {
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
        killer_player_id: player.id,
        match_id: currentMatch.id,
        tournament_id: currentMatch.tournament_id || '',
        killer_name: player.name,
        killer_team_name: team?.name || '',
        killed_player_name: '',
        killed_team_name: '',
      });
      toast.success(`+1 Kill for ${player.name}!`);
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
        player_id:   player.id,
        match_id:    currentMatch.id,
        player_name: player.name,
        team_name:   team?.name || '',
        tournament_id: currentMatch.tournament_id || '',
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
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BC043] flex-shrink-0" />
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
        <span className="rounded bg-[#ff4e00]/10 border border-[#ff4e00]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#ff4e00] tabular-nums">
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
