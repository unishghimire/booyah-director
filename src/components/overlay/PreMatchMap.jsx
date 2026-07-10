import React from 'react';

export default function PreMatchMap({ tournament, currentMatch, teams, players }) {
  const matchNumber = currentMatch?.match_number || tournament?.current_match_number || 1;
  const mapName = currentMatch?.map_name || 'BERMUDA';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050508]">
      {/* Diagonal accent lines */}
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-0 h-full w-2 -rotate-12 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
        <div className="absolute -left-40 top-0 h-full w-1 -rotate-12 bg-gradient-to-b from-transparent via-orange-500/10 to-transparent" />
        <div className="absolute -right-20 top-0 h-full w-2 rotate-12 bg-gradient-to-b from-transparent via-red-600/20 to-transparent" />
        <div className="absolute -right-40 top-0 h-full w-1 rotate-12 bg-gradient-to-b from-transparent via-red-600/10 to-transparent" />
      </div>

      {/* Top header */}
      <div className="relative pt-10 text-center">
        <h1 className="font-orbitron text-5xl font-black tracking-wider text-white">MATCH {matchNumber}</h1>
        <p className="mt-1 font-rajdhani text-xl font-medium uppercase tracking-[0.4em] text-orange-500">Free Fire Tournament</p>
      </div>

      {/* Center map name */}
      <div className="relative mt-8 flex justify-center">
        <h2 className="font-orbitron text-8xl font-black uppercase text-transparent" style={{
          WebkitTextStroke: '3px #f97316',
          textShadow: '0 0 40px rgba(249,115,22,0.6), 0 0 80px rgba(249,115,22,0.3)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}>
          {mapName}
        </h2>
      </div>

      {/* Team grid */}
      <div className="absolute bottom-6 left-1/2 w-[1800px] -translate-x-1/2">
        <div className="grid grid-cols-4 gap-3">
          {teams.map((team, i) => {
            const teamPlayers = players.filter(p => p.team_id === team.id || p.team_id === team._id);
            return (
              <div
                key={team.id || team._id}
                className="rounded-lg border-2 border-orange-500/40 bg-black/70 p-3"
                style={{ animation: `slide-in-up 0.5s ease-out ${i * 0.08}s both` }}
              >
                <h3 className="mb-1 truncate font-rajdhani text-lg font-bold text-orange-400">{team.name}</h3>
                <div className="space-y-0.5">
                  {teamPlayers.map(p => (
                    <p key={p.id || p._id} className="text-xs text-gray-300">{p.name}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}