import React, { useMemo } from 'react';
import { Skull } from 'lucide-react';

export default function EliminationAlert({ eliminations }) {
  const latest = useMemo(() => {
    if (!eliminations || eliminations.length === 0) return null;
    return [...eliminations]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))[0];
  }, [eliminations]);

  if (!latest) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050508]">
        <p className="font-rajdhani text-2xl text-gray-700">Waiting for elimination...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#050508]">
      {/* Gradient banner */}
      <div
        className="flex flex-col items-center gap-4 px-20 py-12"
        style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.9), rgba(249,115,22,0.9))',
          animation: 'slide-down 0.5s ease-out',
          clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
        }}
      >
        <Skull className="h-20 w-20 text-white" style={{ animation: 'pulse-glow 1s ease-in-out infinite' }} />
        <h1 className="font-orbitron text-7xl font-black uppercase tracking-wider text-white" style={{ textShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
          ELIMINATED
        </h1>
        <p className="font-rajdhani text-4xl font-bold text-white">{latest.eliminated_player_name || 'Unknown'}</p>
        {latest.eliminated_team_name && (
          <p className="font-rajdhani text-2xl font-medium text-white/80">[{latest.eliminated_team_name}]</p>
        )}
      </div>
    </div>
  );
}