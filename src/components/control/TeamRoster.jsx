import React, { useState } from 'react';
import { ChevronDown, Users, Skull, Plus, Zap } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

function TeamRow({ team, players }) {
  const [expanded, setExpanded] = useState(false);
  const teamPlayers = players.filter(p => p.team_id === team.id);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-white/5">
        <div className="flex items-center gap-2">
          <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition ${expanded ? 'rotate-180' : ''}`} />
          <span className="text-sm font-semibold text-white">{team.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
            <Zap className="h-3 w-3" />{team.total_tournament_points || 0}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
            <Skull className="h-3 w-3" />{team.total_tournament_kills || 0}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-3 py-2">
          {teamPlayers.length === 0 && <p className="py-1 text-xs text-gray-500">No players</p>}
          {teamPlayers.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-300">{p.name}</span>
              <span className={`flex h-3 w-3 items-center justify-center rounded-full ${p.is_alive ? 'bg-green-500' : 'bg-red-500/40'}`}>
                {!p.is_alive && <span className="text-[8px] text-red-300">✕</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamRoster({ tournament, teams, players, onAction }) {
  const [showAdd, setShowAdd] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) { toast.error('Team name required'); return; }
    setSubmitting(true);
    try {
      await overlayApi.addTeam({
        tournament_id: tournament.id,
        team_name: teamName.trim(),
        player_names: playerNames.map(n => n.trim()).filter(Boolean),
      });
      toast.success(`${teamName} added!`);
      setTeamName('');
      setPlayerNames(['', '', '', '']);
      setShowAdd(false);
      onAction?.();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex w-full items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/20">
          <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Team</span>
          <ChevronDown className={`h-4 w-4 transition ${showAdd ? 'rotate-180' : ''}`} />
        </button>
        {showAdd && (
          <form onSubmit={handleAddTeam} className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/40 p-3">
            <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team Name"
              className="w-full rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 text-sm text-white outline-none focus:border-orange-500" />
            {playerNames.map((pn, i) => (
              <input key={i} value={pn} onChange={e => { const next = [...playerNames]; next[i] = e.target.value; setPlayerNames(next); }}
                placeholder={`Player ${i + 1}`}
                className="w-full rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 text-sm text-white outline-none focus:border-orange-500" />
            ))}
            <button type="submit" disabled={submitting}
              className="w-full rounded-md bg-orange-500 py-2 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50">
              {submitting ? 'Adding...' : 'ADD TEAM'}
            </button>
          </form>
        )}
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <Users className="h-3.5 w-3.5" />
        <span className="text-xs font-medium uppercase tracking-wide">Roster ({teams.length})</span>
      </div>
      <div className="space-y-1.5">
        {teams.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-gray-600">
            No teams yet. Add your first team above.
          </p>
        )}
        {teams.map(team => <TeamRow key={team.id} team={team} players={players} />)}
      </div>
    </div>
  );
}