import React from 'react';
import { Trophy } from 'lucide-react';

export default function Champions({ overlayState, teams }) {
  const championName = overlayState?.champion_team_name;
  const championPoints = overlayState?.champion_total_points;

  // Fallback: use top team if champion not set
  let displayName = championName;
  let displayPoints = championPoints;
  if (!displayName && teams && teams.length > 0) {
    const top = [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0];
    displayName = top?.name;
    displayPoints = top?.total_tournament_points;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050508]">
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => {
          const colors = ['#f97316', '#fbbf24', '#f59e0b', '#ef4444'];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              className="absolute h-3 w-2"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: color,
                animation: `confetti-fall ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          );
        })}
      </div>

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at center, rgba(251,191,36,0.12), transparent 60%)' }}
      />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center gap-4">
        <Trophy
          className="h-24 w-24 text-yellow-400"
          style={{ animation: 'pulse-glow 1.5s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.5))' }}
        />

        <h1
          className="font-orbitron text-6xl font-black text-yellow-400"
          style={{ textShadow: '0 0 40px rgba(251,191,36,0.6), 0 0 80px rgba(251,191,36,0.3)', animation: 'pulse-glow 2s ease-in-out infinite' }}
        >
          🏆 BOOYAH! 🏆
        </h1>

        <p className="font-rajdhani text-3xl font-semibold uppercase tracking-[0.3em] text-orange-500">
          Tournament Champions
        </p>

        <h2
          className="mt-4 font-orbitron text-7xl font-black uppercase text-transparent"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f97316)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: 'slide-in-up 0.8s ease-out',
          }}
        >
          {displayName || 'CHAMPIONS'}
        </h2>

        {displayPoints != null && (
          <p className="font-rajdhani text-4xl font-bold text-white">
            {displayPoints} Points
          </p>
        )}
      </div>
    </div>
  );
}