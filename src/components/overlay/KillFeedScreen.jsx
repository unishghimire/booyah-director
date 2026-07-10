import React, { useMemo } from 'react';

export default function KillFeedScreen({ killFeed }) {
  const recent = useMemo(() => {
    return [...killFeed]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 10);
  }, [killFeed]);

  const getInitial = (name) => (name && name.length > 0 ? name[0].toUpperCase() : '?');

  return (
    <div className="relative h-full w-full bg-[#050508]">
      <div className="absolute left-0 top-0 bottom-0 w-[600px] p-8">
        <h2 className="mb-4 font-orbitron text-2xl font-black uppercase tracking-wider text-orange-500">Kill Feed</h2>
        <div className="space-y-2">
          {recent.length === 0 && (
            <p className="font-rajdhani text-lg text-gray-600">No eliminations yet...</p>
          )}
          {recent.map((kill, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-orange-500/20 bg-black/60 px-4 py-3"
              style={{ animation: `slide-in-right 0.4s ease-out ${i * 0.05}s both` }}
            >
              {/* Killer avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 font-orbitron text-sm font-bold text-black">
                {getInitial(kill.killer_name)}
              </div>
              <div className="flex flex-1 items-center gap-2">
                <div className="flex flex-col">
                  <span className="font-rajdhani text-base font-bold text-orange-400">{kill.killer_name || '?'}</span>
                  {kill.killer_team_name && <span className="text-xs text-gray-500">[{kill.killer_team_name}]</span>}
                </div>
                <span className="text-2xl">💀</span>
                <div className="flex flex-col">
                  <span className="font-rajdhani text-base font-bold text-white">{kill.killed_player_name || '?'}</span>
                  {kill.killed_team_name && <span className="text-xs text-gray-500">[{kill.killed_team_name}]</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}