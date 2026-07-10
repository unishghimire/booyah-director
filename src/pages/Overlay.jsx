import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Crosshair, Trophy, Zap, Crown, Star } from 'lucide-react';

/* ========== Screen: Setup Blank ========== */
function SetupBlank() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <span className="font-orbitron text-2xl font-black tracking-[0.3em] text-white/5">BOOYAH DIRECTOR</span>
    </div>
  );
}

/* ========== Screen: Pre-Match Map ========== */
function PreMatchMap({ match, teams, players }) {
  const mapName = (match?.map_name || 'BERMUDA').toUpperCase();
  const matchNum = match?.match_number || 1;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a0a05] to-[#0a0a0f]">
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.3) 0%, transparent 60%)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-4"
      >
        <span className="font-orbitron text-xl font-bold tracking-[0.4em] text-orange-500">MATCH {matchNum}</span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="font-orbitron text-[140px] font-black leading-none text-white"
        style={{ textShadow: '0 0 60px rgba(249,115,22,0.8), 0 0 120px rgba(249,115,22,0.4)', WebkitTextStroke: '2px rgba(249,115,22,0.9)' }}
      >
        {mapName}
      </motion.h1>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-4 h-1 w-[600px] origin-center bg-gradient-to-r from-transparent via-orange-500 to-transparent"
      />

      {/* Team grid at bottom */}
      {teams && teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-3 border-t border-orange-500/20 bg-black/60 px-8 py-4"
        >
          {teams.map((team, i) => {
            const teamPlayers = (players || []).filter(p => p.team_id === team.id);
            return (
              <div key={team.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2" style={{ animation: `slide-in-up 0.4s ease ${i * 0.05}s both` }}>
                <span className="font-rajdhani text-sm font-bold text-orange-400">{team.name}</span>
                <div className="mt-0.5 flex gap-1">
                  {teamPlayers.map(p => (
                    <span key={p.id} className="text-[10px] text-gray-400">{p.name}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ========== Screen: Scoreboard ========== */
function Scoreboard({ teams, players, killFeed }) {
  const sortedTeams = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  }, [teams]);

  const killLeaders = useMemo(() => {
    return [...(players || [])]
      .filter(p => (p.current_match_kills || 0) > 0)
      .sort((a, b) => (b.current_match_kills || 0) - (a.current_match_kills || 0))
      .slice(0, 5);
  }, [players]);

  const tickerKills = useMemo(() => (killFeed || []).slice(0, 10), [killFeed]);

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-r from-[#0a0a0f] to-[#11111a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-500/30 bg-black/40 px-8 py-3">
        <span className="font-orbitron text-2xl font-black tracking-wider text-orange-500">BOOYAH</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="font-orbitron text-sm font-bold tracking-wider text-red-400">LIVE</span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 p-6">
        {/* Left: standings */}
        <div className="flex-1">
          <h3 className="mb-2 font-orbitron text-sm font-bold uppercase tracking-wider text-gray-400">Tournament Standings</h3>
          <div className="space-y-1">
            {sortedTeams.map((team, i) => (
              <div
                key={team.id}
                className={`flex items-center gap-4 rounded-lg px-4 py-2 ${i === 0 ? 'bg-orange-500/20 border border-orange-500/40' : 'bg-white/5'}`}
                style={{ animation: `slide-in-right 0.3s ease ${i * 0.05}s both` }}
              >
                <span className={`font-orbitron text-lg font-black w-8 ${i === 0 ? 'text-orange-400' : i < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>#{i + 1}</span>
                <span className="font-rajdhani text-lg font-bold text-white flex-1">{team.name}</span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Skull className="h-3.5 w-3.5" />{team.total_tournament_kills || 0}
                </span>
                <span className="flex items-center gap-1 font-orbitron text-lg font-black text-orange-400 w-12 text-right">
                  <Zap className="h-3.5 w-3.5" />{team.total_tournament_points || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: kill leaders */}
        <div className="w-72">
          <h3 className="mb-2 font-orbitron text-sm font-bold uppercase tracking-wider text-gray-400">Kill Leaders</h3>
          <div className="space-y-1">
            {killLeaders.length === 0 && <p className="text-sm text-gray-600">No kills recorded</p>}
            {killLeaders.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2" style={{ animation: `slide-in-right 0.3s ease ${i * 0.05}s both` }}>
                <Crosshair className="h-4 w-4 text-orange-500" />
                <span className="font-rajdhani text-sm font-bold text-white flex-1">{p.name}</span>
                <span className="font-orbitron text-sm font-black text-orange-400">{p.current_match_kills}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: scrolling kill ticker */}
      {tickerKills.length > 0 && (
        <div className="overflow-hidden border-t border-orange-500/20 bg-black/60 py-2">
          <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'ticker-scroll 20s linear infinite' }}>
            {[...tickerKills, ...tickerKills].map((kill, i) => (
              <span key={i} className="font-rajdhani text-sm text-gray-300">
                <span className="font-bold text-orange-400">{kill.killer_name}</span>
                {kill.killed_player_name ? (
                  <span> eliminated <span className="text-red-400">{kill.killed_player_name}</span></span>
                ) : (
                  <span> got a kill</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== Screen: Kill Feed ========== */
function KillFeedScreen({ killFeed }) {
  const recent = useMemo(() => (killFeed || []).slice(0, 8), [killFeed]);
  return (
    <div className="flex h-full w-full flex-col justify-center bg-gradient-to-br from-[#0a0a0f] to-[#11111a] p-12">
      <h3 className="mb-6 font-orbitron text-xl font-black uppercase tracking-wider text-orange-500">Kill Feed</h3>
      <div className="space-y-3">
        {recent.length === 0 && <p className="text-gray-600">No kills recorded yet</p>}
        {recent.map((kill, i) => (
          <div
            key={kill.id || i}
            className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/40 px-6 py-3"
            style={{ animation: `slide-in-right 0.4s ease ${i * 0.08}s both` }}
          >
            <Skull className="h-6 w-6 text-orange-500" />
            <span className="font-rajdhani text-xl font-bold text-white">{kill.killer_name}</span>
            <span className="text-orange-500">→</span>
            {kill.killed_player_name ? (
              <span className="font-rajdhani text-xl font-bold text-red-400">{kill.killed_player_name}</span>
            ) : (
              <span className="font-rajdhani text-xl text-gray-500">eliminated</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== Screen: Elimination Alert ========== */
function EliminationAlert({ eliminations }) {
  const latest = useMemo(() => {
    if (!eliminations || eliminations.length === 0) return null;
    return [...eliminations].sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date))[0];
  }, [eliminations]);

  if (!latest) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <Skull className="h-20 w-20 text-red-500/30" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a0000] via-[#0a0a0f] to-[#1a0000]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
          className="mb-4 flex justify-center"
        >
          <Skull className="h-24 w-24 text-red-500" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.8))' }} />
        </motion.div>
        <div className="rounded-2xl border-4 border-red-600 bg-black/60 px-16 py-8" style={{ boxShadow: '0 0 60px rgba(239,68,68,0.5)' }}>
          <p className="font-orbitron text-sm font-bold uppercase tracking-[0.4em] text-red-500">Eliminated</p>
          <h2 className="mt-2 font-orbitron text-6xl font-black text-white">{latest.eliminated_player_name}</h2>
          {latest.eliminated_team_name && (
            <p className="mt-2 font-rajdhani text-2xl font-bold text-red-400">{latest.eliminated_team_name}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ========== Screen: MVP ========== */
function MvpScreen({ overlayState }) {
  const name = overlayState?.mvp_player_name || 'MVP';
  const team = overlayState?.mvp_team_name || '';
  const kills = overlayState?.mvp_kills || 0;

  const particles = useMemo(() => Array.from({ length: 30 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 3,
    size: 2 + Math.random() * 4,
  })), []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#0a0a0f] to-[#2e1a0a]">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-yellow-400"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animation: `float-particle 3s ease ${p.delay}s infinite` }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="relative z-10 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-3">
          <Star className="h-10 w-10 text-yellow-400" style={{ filter: 'drop-shadow(0 0 15px rgba(250,204,21,0.8))' }} />
          <span className="font-orbitron text-2xl font-black tracking-[0.4em] text-yellow-400">MVP</span>
          <Star className="h-10 w-10 text-yellow-400" style={{ filter: 'drop-shadow(0 0 15px rgba(250,204,21,0.8))' }} />
        </div>
        <h1
          className="font-orbitron text-[100px] font-black leading-none text-white"
          style={{ textShadow: '0 0 40px rgba(168,85,247,0.8), 0 0 80px rgba(250,204,21,0.4)' }}
        >
          {name}
        </h1>
        {team && <p className="mt-4 font-rajdhani text-3xl font-bold text-purple-400">{team}</p>}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Crosshair className="h-6 w-6 text-orange-400" />
          <span className="font-orbitron text-4xl font-black text-orange-400">{kills}</span>
          <span className="font-rajdhani text-xl text-gray-400">KILLS</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ========== Screen: Champions ========== */
function Champions({ overlayState, teams }) {
  const teamName = overlayState?.champion_team_name ||
    (teams && teams.length > 0 ? [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0].name : 'CHAMPION');
  const points = overlayState?.champion_total_points ||
    (teams && teams.length > 0 ? [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0].total_tournament_points : 0);

  const confetti = useMemo(() => Array.from({ length: 60 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    color: ['#f97316', '#fbbf24', '#ef4444', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 8,
  })), []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a1205] via-[#0a0a0f] to-[#1a1205]">
      {confetti.map((c, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size,
            background: c.color,
            animation: `confetti-fall ${c.duration}s linear ${c.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(250,204,21,0.2) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="relative z-10 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-4">
          <Crown className="h-12 w-12 text-yellow-400" style={{ filter: 'drop-shadow(0 0 20px rgba(250,204,21,0.8))' }} />
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="font-orbitron text-5xl font-black tracking-wider text-yellow-400"
            style={{ textShadow: '0 0 30px rgba(250,204,21,0.8)' }}
          >
            BOOYAH!
          </motion.span>
          <Crown className="h-12 w-12 text-yellow-400" style={{ filter: 'drop-shadow(0 0 20px rgba(250,204,21,0.8))' }} />
        </div>
        <p className="font-orbitron text-sm font-bold uppercase tracking-[0.4em] text-gray-400">Champions</p>
        <h1
          className="mt-4 font-orbitron text-[90px] font-black leading-none text-white"
          style={{ textShadow: '0 0 40px rgba(250,204,21,0.6), 0 0 80px rgba(249,115,22,0.3)' }}
        >
          {teamName}
        </h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <span className="font-orbitron text-4xl font-black text-yellow-400">{points}</span>
          <span className="font-rajdhani text-xl text-gray-400">POINTS</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ========== Main Overlay Component ========== */
export default function Overlay() {
  const { data, loading } = useOverlayData(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const screen = data?.overlay_state?.current_screen || 'setup_blank';

  const renderScreen = () => {
    if (!data) return <SetupBlank />;
    switch (screen) {
      case 'pre_match_map':
        return <PreMatchMap match={data.current_match} teams={data.teams} players={data.players} />;
      case 'scoreboard':
        return <Scoreboard teams={data.teams} players={data.players} killFeed={data.kill_feed} />;
      case 'kill_feed':
        return <KillFeedScreen killFeed={data.kill_feed} />;
      case 'elimination_alert':
        return <EliminationAlert eliminations={data.eliminations} />;
      case 'mvp':
        return <MvpScreen overlayState={data.overlay_state} />;
      case 'champions':
        return <Champions overlayState={data.overlay_state} teams={data.teams} />;
      default:
        return <SetupBlank />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black overlay-canvas">
      <div style={{ width: '1920px', height: '1080px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}