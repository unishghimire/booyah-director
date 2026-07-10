import React, { useMemo } from 'react';
import { Trophy, Skull, Zap } from 'lucide-react';

export default function StandingsTable({ teams, standings }) {
  const sortedTeams = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  }, [teams]);

  const standingMap = useMemo(() => {
    const map = {};
    (standings || []).forEach(s => { map[s.team_id] = s; });
    return map;
  }, [standings]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-orange-500" />
        <h2 className="font-orbitron text-sm font-bold text-white">STANDINGS</h2>
      </div>
      {sortedTeams.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-600">No teams yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-gray-500">
              <th className="pb-2 pl-1">#</th>
              <th className="pb-2">Team</th>
              <th className="pb-2 text-center">Match Pts</th>
              <th className="pb-2 text-center"><Skull className="inline h-3 w-3" /></th>
              <th className="pb-2 pr-1 text-right"><Zap className="inline h-3 w-3" /></th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, i) => {
              const standing = standingMap[team.id];
              return (
                <tr key={team.id} className={`border-b border-white/5 ${i === 0 ? 'bg-orange-500/5' : ''}`}>
                  <td className="py-2 pl-1">
                    <span className={`font-orbitron text-sm font-black ${i === 0 ? 'text-orange-400' : i < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>{i + 1}</span>
                  </td>
                  <td className="py-2 text-sm font-semibold text-white">{team.name}</td>
                  <td className="py-2 text-center text-xs text-gray-400">{standing?.total_match_points ?? '—'}</td>
                  <td className="py-2 text-center text-xs text-gray-400">{team.total_tournament_kills || 0}</td>
                  <td className="py-2 pr-1 text-right font-orbitron text-sm font-black text-orange-400">{team.total_tournament_points || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}