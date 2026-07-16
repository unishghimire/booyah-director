import React, { useMemo } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { Trophy, Skull, Zap } from 'lucide-react';

export default function StandingsTable({ teams, standings, tournament }) {
  const sortedTeams = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  }, [teams]);

  const standingMap = useMemo(() => {
    const map = {};
    (standings || []).forEach(s => { map[s.team_id] = s; });
    return map;
  }, [standings]);

  const ppk = tournament?.points_per_kill || 1;

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-orange-500" />
        <h2 className="font-orbitron text-sm font-bold text-white">STANDINGS</h2>
        <span className="ml-auto text-[9px] font-mono text-gray-500">PPK: {ppk}</span>
      </div>
      {sortedTeams.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-600">No teams yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-gray-500">
              <th className="pb-2 pl-1">#</th>
              <th className="pb-2">Team</th>
              <th className="pb-2 text-center" title="Placement Points">PPT</th>
              <th className="pb-2 text-center" title="Kills × Points Per Kill"><Skull className="inline h-3 w-3" /></th>
              <th className="pb-2 pr-1 text-right"><Zap className="inline h-3 w-3" /> Total</th>
            </tr>
          </thead>
          <tbody>
            {safeArray(sortedTeams).map((team, i) => {
              const standing = standingMap[team.id];
              const totalKills = team.total_tournament_kills || 0;
              const killPts = totalKills * ppk;
              const totalPts = team.total_tournament_points || 0;
              const placementPts = totalPts - killPts;
              return (
                <tr key={team.id} className={`border-b border-white/5 ${i === 0 ? 'bg-orange-500/5' : ''}`}>
                  <td className="py-2 pl-1">
                    <span className={`font-orbitron text-sm font-black ${i === 0 ? 'text-orange-400' : i < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>{i + 1}</span>
                  </td>
                  <td className="py-2 text-sm font-semibold text-white">{team.name}</td>
                  <td className="py-2 text-center text-xs text-cyan-400" title="Placement points from standings">
                    {standing?.placement_points_awarded ?? placementPts ?? '—'}
                  </td>
                  <td className="py-2 text-center text-xs text-green-400" title={`${totalKills} kills × ${ppk} ppk = ${killPts}`}>
                    {totalKills}×{ppk}={killPts}
                  </td>
                  <td className="py-2 pr-1 text-right font-orbitron text-sm font-black text-orange-400" title={`${placementPts}PPT + ${killPts} Kill Pts = ${totalPts}`}>
                    {totalPts}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Auto-calc formula footer */}
          <tfoot>
            <tr className="border-t border-white/10">
              <td colSpan={5} className="pt-2 text-center text-[9px] text-gray-600">
                <span className="text-cyan-500">PPT</span> + <span className="text-green-500">Kills × PPK</span> = <span className="text-orange-500">Total Points</span>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}