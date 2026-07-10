import React from 'react';
import { Star } from 'lucide-react';

export default function MvpScreen({ overlayState }) {
  const playerName = overlayState?.mvp_player_name || 'MVP';
  const teamName = overlayState?.mvp_team_name || '';
  const kills = overlayState?.mvp_kills || 0;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050508]">
      {/* Particle background */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-orange-500/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at center, rgba(249,115,22,0.15), transparent 60%)' }}
      />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className="h-8 w-8 text-orange-500"
              style={{ animation: `pulse-glow 1.5s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>

        <h1
          className="font-orbitron text-5xl font-black uppercase tracking-[0.3em] text-orange-500"
          style={{ textShadow: '0 0 30px rgba(249,115,22,0.6), 0 0 60px rgba(249,115,22,0.3)' }}
        >
          MATCH MVP
        </h1>

        <div className="my-4" style={{ animation: 'slide-in-up 0.8s ease-out' }}>
          <h2 className="text-center font-orbitron text-8xl font-black uppercase text-white" style={{ textShadow: '0 0 40px rgba(249,115,22,0.5)' }}>
            {playerName}
          </h2>
        </div>

        {teamName && (
          <p className="font-rajdhani text-3xl font-bold uppercase tracking-widest text-orange-400">
            [{teamName}]
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Star className="h-8 w-8 fill-orange-500 text-orange-500" />
          <span className="font-orbitron text-4xl font-black text-white">{kills} KILLS THIS MATCH</span>
          <Star className="h-8 w-8 fill-orange-500 text-orange-500" />
        </div>
      </div>
    </div>
  );
}