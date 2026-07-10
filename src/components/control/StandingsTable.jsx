import React, { useMemo } from 'react';
import { Medal } from 'lucide-react';

export default function StandingsTable({ teams, players, standings }) {
  const rows = useMemo(() => {
    return teams.map(team => {
      const teamPlayers = players.filter(p => p.team_id === team.id || p.team_id === team._id);
      const killsThisMatch = teamPlayers.reduce((sum, p) => sum + (p.current_match_kills || 0), 0);
      const standing = standings.find(s => s.team_id === team.id || s.team_id === team._id);
      return {
        id: team.id || team._id,
        name: team.name,
        killsThisMatch,
        placementPts: standing?.placement_points_awarded || 0,
        totalPts: team.total_tournament_points || 0,
        totalKills: team.total_tournament_kills || 0,
      };
    }).sort((a, b) => b.totalPts - a.totalPts);
  }, [teams, players, standings]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-orbitron text-sm font-bold text-white">LIVE STANDINGS</h2>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Auto-refresh
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/5">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-black/40 text-gray-400">
              <th className="px-3 py-2 font-semibold">Rank</th>
              <th className="px-3 py-2 font-semibold">Team</th>
              <th className="px-3 py-2 text-center font-semibold">Kills</th>
              <th className="px-3 py-2 text-center font-semibold">Placement</th>
              <th className="px-3 py-2 text-right font-semibold">Total Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-600">No teams yet</td></tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-white/5 ${
                  i < 3 ? 'bg-orange-500/5' : i % 2 === 0 ? 'bg-black/20' : 'bg-black/10'
                }`}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {i < 3 && <Medal className={`h-3 w-3 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`} />}
                    <span className="font-bold text-white">{i + 1}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-medium text-gray-200">{row.name}</td>
                <td className="px-3 py-2 text-center text-gray-400">💀 {row.killsThisMatch}</td>
                <td className="px-3 py-2 text-center text-gray-400">{row.placementPts}</td>
                <td className="px-3 py-2 text-right font-bold text-orange-400">{row.totalPts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}