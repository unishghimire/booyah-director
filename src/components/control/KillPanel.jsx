import React, { useState } from 'react';
import { Skull, Crosshair, ChevronDown } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

function PlayerRow({ player, onAction }) {
  const [busy, setBusy] = useState(false);

  const handleKill = async () => {
    setBusy(true);
    try {
      await overlayApi.addKill({ player_id: player.id || player._id });
      onAction?.();
    } catch (err) {
      toast.error(`Kill: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleElim = async () => {
    setBusy(true);
    try {
      await overlayApi.eliminatePlayer({ player_id: player.id || player._id });
      onAction?.();
    } catch (err) {
      toast.error(`Elim: ${err.message}`);
    } finally {
      setBusy(false);
    }
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
        <button
          onClick={handleKill}
          disabled={busy || !player.is_alive}
          className="rounded bg-orange-500/80 px-2 py-0.5 text-[10px] font-bold text-black hover:bg-orange-400 disabled:opacity-30"
        >
          +KILL 💀
        </button>
        <button
          onClick={handleElim}
          disabled={busy || !player.is_alive}
          className="rounded bg-red-600/80 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-500 disabled:opacity-30"
        >
          ELIM ☠️
        </button>
      </div>
    </div>
  );
}

function TeamCard({ team, players, onAction }) {
  const [placement, setPlacement] = useState(team.placement || 1);
  const [busy, setBusy] = useState(false);
  const teamPlayers = players.filter(p => p.team_id === team.id || p.team_id === team._id);

  const handleSetPlacement = async () => {
    setBusy(true);
    try {
      await overlayApi.setTeamPlacement({
        team_id: team.id || team._id,
        placement: Number(placement),
      });
      toast.success(`${team.name}: #${placement}`);
      onAction?.();
    } catch (err) {
      toast.error(`Placement: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-orange-400">{team.name}</span>
        <span className="text-[10px] text-gray-500">{teamPlayers.filter(p => p.is_alive).length} alive</span>
      </div>
      <div className="space-y-0.5">
        {teamPlayers.length === 0 && <p className="text-xs text-gray-600">No players</p>}
        {teamPlayers.map(p => (
          <PlayerRow key={p.id || p._id} player={p} onAction={onAction} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 border-t border-white/5 pt-2">
        <div className="relative flex-1">
          <select
            value={placement}
            onChange={e => setPlacement(e.target.value)}
            className="w-full appearance-none rounded-md border border-white/10 bg-black/50 px-2 py-1 text-xs text-white outline-none focus:border-orange-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>#{n}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
        </div>
        <button
          onClick={handleSetPlacement}
          disabled={busy}
          className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40"
        >
          {busy ? '...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}

export default function KillPanel({ teams, players, onAction }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Crosshair className="h-4 w-4 text-orange-500" />
        <h2 className="font-orbitron text-sm font-bold text-white">KILL CONTROL</h2>
      </div>
      {teams.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-600">Add teams to enable kill tracking</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {teams.map(team => (
            <TeamCard key={team.id || team._id} team={team} players={players} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
}