import React, { useMemo } from 'react';
import { Medal } from 'lucide-react';

export default function Scoreboard({ tournament, currentMatch, teams, players, killFeed }) {
  const matchNumber = currentMatch?.match_number || tournament?.current_match_number || 1;

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  }, [teams]);

  const topKillers = useMemo(() => {
    return [...players]
      .filter(p => (p.current_match_kills || 0) > 0)
      .sort((a, b) => (b.current_match_kills || 0) - (a.current_match_kills || 0))
      .slice(0, 5);
  }, [players]);

  const teamsAlive = useMemo(() => {
    return teams.filter(t => {
      const tp = players.filter(p => (p.team_id === t.id || p.team_id === t._id) && p.is_alive);
      return tp.length > 0;
    }).length;
  }, [teams, players]);

  const tickerKills = useMemo(() => {
    return [...killFeed].slice(-10).reverse();
  }, [killFeed]);

  return (
    <div className="relative flex h-full w-full bg-[#050508]">
      {/* Left: Standings */}
      <div className="w-[650px] p-8">
        <div className="mb-1 border-b-2 border-orange-500 pb-2">
          <h2 className="font-orbitron text-2xl font-black uppercase tracking-wide text-white">Tournament Standings</h2>
        </div>
        <div className="mt-3">
          {sortedTeams.map((team, i) => (
            <div
              key={team.id || team._id}
              className={`flex items-center justify-between px-4 py-2 ${
                i % 2 === 0 ? 'bg-white/5' : 'bg-black/30'
              }`}
              style={{ borderLeft: i < 3 ? `4px solid ${i === 0 ? '#fbbf24' : i === 1 ? '#d1d5db' : '#cd7f32'}` : '4px solid transparent' }}
            >
              <div className="flex items-center gap-3">
                {i < 3 ? (
                  <Medal className={`h-5 w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`} />
                ) : (
                  <span className="w-5 text-center font-orbitron text-sm font-bold text-gray-500">{i + 1}</span>
                )}
                <span className="font-rajdhani text-lg font-semibold text-white">{team.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-rajdhani text-base text-gray-400">💀 {team.total_tournament_kills || 0}</span>
                <span className="font-rajdhani text-lg font-bold text-orange-400">⭐ {team.total_tournament_points || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Match Info */}
      <div className="flex-1 p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-red-600/20 px-4 py-1.5" style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}>
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" style={{ animation: 'pulse-glow 1s ease-in-out infinite' }} />
          <span className="font-orbitron text-base font-bold uppercase text-red-400">Match {matchNumber} Live</span>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-orbitron text-lg font-bold uppercase tracking-wide text-orange-500">Kill Leaders</h3>
          <div className="space-y-1.5">
            {topKillers.length === 0 && <p className="text-sm text-gray-600">No kills yet</p>}
            {topKillers.map((p, i) => (
              <div key={p.id || p._id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="font-orbitron text-sm font-bold text-orange-400">#{i + 1}</span>
                  <span className="font-rajdhani text-base font-semibold text-white">{p.name}</span>
                </div>
                <span className="font-rajdhani text-lg font-bold text-orange-400">💀 {p.current_match_kills || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2">
          <span className="font-rajdhani text-sm font-semibold text-green-400">Teams Alive: {teamsAlive}/{teams.length}</span>
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden border-t border-orange-500/30 bg-black/80">
        <div className="flex h-full items-center" style={{ animation: 'ticker-scroll 30s linear infinite' }}>
          {tickerKills.length === 0 && (
            <span className="px-8 font-rajdhani text-sm text-gray-600">Waiting for action...</span>
          )}
          {tickerKills.map((kill, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap px-8 font-rajdhani text-sm">
              <span className="font-semibold text-orange-400">{kill.killer_name || '?'}</span>
              <span className="text-gray-500">eliminated</span>
              <span className="font-semibold text-white">{kill.killed_player_name || '?'}</span>
              <span className="text-gray-700">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}