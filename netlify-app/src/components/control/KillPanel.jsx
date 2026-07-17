import React, { useState } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { Skull, Crosshair, ChevronDown, Calculator } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

function PlayerRow({ player, team, currentMatch, onAction }) {
  const [busy, setBusy] = useState(false);

  const handleKill = async () => {
    if (!currentMatch?.id) { toast.error('No active match'); return; }
    setBusy(true);
    try {
      await overlayApi.addKill({
        killer_player_id:  player.id,
        killer_name:       player.name,
        killer_team_name:  team?.name || '',
        match_id:          currentMatch.id,
        tournament_id:     currentMatch.tournament_id || '',
        killed_player_name: 'Opponent',
        killed_team_name:   '',
      });
      onAction?.();
    } catch (err) { toast.error(`Kill: ${err.message}`); } finally { setBusy(false); }
  };

  const handleElim = async () => {
    if (!currentMatch?.id) { toast.error('No active match'); return; }
    setBusy(true);
    try {
      const res = await overlayApi.eliminatePlayer({
        player_id:     player.id,
        match_id:      currentMatch.id,
        player_name:   player.name,
        team_name:     team?.name || '',
        tournament_id: currentMatch.tournament_id || '',
      });
      // Check if auto-placement was triggered (team fully eliminated)
      if (res?.auto_placement) {
        toast.success(`${team?.name}: ELIMINATED → #${res.auto_placement} (${res.auto_standing?.placement_points_awarded || 0} pts)`);
      } else {
        toast.success(`${player.name} eliminated`);
      }
      onAction?.();
    } catch (err) { toast.error(`Elim: ${err.message}`); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${player.is_alive ? 'bg-green-500' : 'bg-red-500/50'}`} />
        <span className="truncate text-xs text-gray-200">{player.name}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400">
          <Skull className="h-2.5 w-2.5" />{player.current_match_kills || 0}
        </span>
        <button onClick={handleKill} disabled={busy || !player.is_alive}
          className="rounded bg-orange-500/80 px-2 py-0.5 text-[10px] font-bold text-black hover:bg-orange-400 disabled:opacity-30">
          {busy ? '...' : '+KILL'}
        </button>
        <button onClick={handleElim} disabled={busy || !player.is_alive}
          className="rounded bg-red-600/80 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-500 disabled:opacity-30">
          ELIM
        </button>
      </div>
    </div>
  );
}

function TeamCard({ team, players, currentMatch, tournament, onAction }) {
  const [placement, setPlacement] = useState(1);
  const [busy, setBusy] = useState(false);
  const teamPlayers = players.filter(p => p.team_id === team.id);

  // Auto-calculate: placement points + kills × ppk = total
  const ppk = tournament?.points_per_kill || 1;
  let placementConfig = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };
  try {
    if (tournament?.placement_points_config) {
      placementConfig = typeof tournament.placement_points_config === 'string'
        ? JSON.parse(tournament.placement_points_config)
        : tournament.placement_points_config;
    }
  } catch (_) {}
  const placementPts = placementConfig[placement] || 0;
  const totalKills = teamPlayers.reduce((sum, p) => sum + (p.current_match_kills || 0), 0);
  const killPts = totalKills * ppk;
  const autoTotal = placementPts + killPts;

  const handlePlacement = async () => {
    if (!currentMatch?.id) { toast.error('No active match'); return; }
    setBusy(true);
    try {
      await overlayApi.setTeamPlacement({
        team_id:       team.id,
        team_name:     team.name,
        match_id:      currentMatch.id,
        placement:     Number(placement),
        tournament_id: tournament?.id || currentMatch.tournament_id || '',
      });
      toast.success(`${team.name}: #${placement} → ${autoTotal} pts`);
      onAction?.();
    } catch (err) { toast.error(`Placement: ${err.message}`); } finally { setBusy(false); }
  };

  const allDead = teamPlayers.length > 0 && teamPlayers.every(p => p.is_alive === false);

  return (
    <div className={`rounded-lg border bg-black/30 p-3 ${allDead ? 'border-red-500/30' : 'border-white/10'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-sm font-bold ${allDead ? 'text-red-400' : 'text-orange-400'}`}>{team.name}</span>
        <span className="text-[10px] text-gray-500">
          {allDead ? (
            <span className="font-orbitron font-black text-red-400">ELIMINATED #{placement}</span>
          ) : (
            <span>{teamPlayers.filter(p => p.is_alive).length} alive</span>
          )}
        </span>
      </div>
      <div className="space-y-0.5">
        {teamPlayers.length === 0 && <p className="text-xs text-gray-600">No players</p>}
        {safeArray(teamPlayers).map(p => <PlayerRow key={p.id} player={p} team={team} currentMatch={currentMatch} onAction={onAction} />)}
      </div>

      {/* Auto-calc preview: PPT + Kills×PPK = Total */}
      <div className="mt-2 rounded-md border border-[#ff4e00]/20 bg-[#ff4e00]/5 px-2.5 py-2">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Calculator className="h-3 w-3 text-[#ff4e00]" />
          <span className="font-orbitron text-[8px] font-black uppercase tracking-wider text-[#ff4e00]">AUTO CALC</span>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="text-cyan-400" title="Placement points">{placementPts}P</span>
          <span className="text-gray-500">+</span>
          <span className="text-green-400" title="Kills × points per kill">{totalKills}×{ppk}={killPts}K</span>
          <span className="text-gray-500">=</span>
          <span className="font-bold text-[#ffaa00] text-xs">{autoTotal}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 border-t border-white/5 pt-2">
        <div className="relative flex-1">
          <select value={placement} onChange={e => setPlacement(Number(e.target.value))}
            className="w-full appearance-none rounded-md border border-white/10 bg-black/50 px-2 py-1 text-xs text-white outline-none focus:border-orange-500">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>#{n}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
        </div>
        <button onClick={handlePlacement} disabled={busy}
          className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40">
          {busy ? '...' : 'SET'}
        </button>
      </div>
    </div>
  );
}

export default function KillPanel({ tournament, teams, players, currentMatch, onAction }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Crosshair className="h-4 w-4 text-orange-500" />
        <h2 className="font-orbitron text-sm font-bold text-white">KILL CONTROL</h2>
      </div>
      {!currentMatch ? (
        <p className="py-6 text-center text-xs text-gray-600">Start a match to enable kill tracking</p>
      ) : teams.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-600">Add teams to enable kill tracking</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {safeArray(teams).map(team => <TeamCard key={team.id} team={team} players={players} currentMatch={currentMatch} tournament={tournament} onAction={onAction} />)}
        </div>
      )}
    </div>
  );
}