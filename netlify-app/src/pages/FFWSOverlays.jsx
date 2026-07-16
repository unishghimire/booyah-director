/**
 * FFWSOverlays.jsx — FFWS-style broadcast overlay components
 * New screens: GameIntroBanner, MatchScheduleGrid, PointRushStandings
 * Upgrades: FFBoardV2, MatchInfoChip
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';
import { safeArray } from '@/components/ErrorBoundary';
import { MAPS, getMapImages } from '@/lib/maps';

/* ═══ FFWS SCOREBOARD V2 — right panel, tighter rows, legend ═══ */
export function FFBoardV2({ teams = [], players = [], currentMatch, design }) {
  const t = getThemeInline(design);
  const primary = t.p;
  const secondary = t.s;

  // Track previous alive states to detect newly-eliminated players
  const prevAliveRef = useRef({});
  const [elimFlash, setElimFlash] = useState({}); // { teamId: { slotIdx: timestamp } }

  const rows = useMemo(() => {
    return [...safeArray(teams)]
      .map(team => {
        const tp = safeArray(players).filter(p => p.team_id === team.id);
        const slots = [];
        for (let i = 0; i < 4; i++) {
          if (tp[i]) slots.push({ name: tp[i].name, alive: tp[i].is_alive, playerId: tp[i].id });
          else slots.push({ name: null, alive: false, playerId: null });
        }
        const aliveCount = tp.filter(p => p.is_alive).length;
        return { ...team, slots, aliveCount, totalPlayers: tp.length };
      })
      .sort((a, b) =>
        (b.total_tournament_points || 0) - (a.total_tournament_points || 0) ||
        (b.total_tournament_kills || 0) - (a.total_tournament_kills || 0)
      )
      .slice(0, 12);
  }, [teams, players]);

  // Detect newly eliminated players and trigger flash animation
  useEffect(() => {
    const flashes = {};
    let hasNewElim = false;
    safeArray(rows).forEach(team => {
      team.slots.forEach((slot, si) => {
        const key = `${team.id}_${si}`;
        const wasAlive = prevAliveRef.current[key];
        if (wasAlive === true && !slot.alive && slot.name) {
          flashes[`${team.id}`] = { ...flashes[`${team.id}`], [si]: Date.now() };
          hasNewElim = true;
        }
        prevAliveRef.current[key] = slot.alive;
      });
    });
    if (hasNewElim) {
      setElimFlash(flashes);
      // Clear flashes after animation
      const timer = setTimeout(() => setElimFlash({}), 2000);
      return () => clearTimeout(timer);
    }
  }, [rows]);

  const matchNum = currentMatch?.match_number
    ? `GAME ${String(currentMatch.match_number).padStart(2, '0')}`
    : (design?.scoreboardSubtitle || 'STANDBY').toUpperCase();

  return (
    <motion.div
      initial={{ y: -1080, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'absolute', right: 0, top: 40, height: 'calc(100% - 80px)', width: 300, zIndex: 10 }}
    >
      {/* Panel with diagonal-cut top, glow lines, corner accents */}
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(8,10,18,0.95) 0%, rgba(6,8,16,0.92) 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        borderLeft: `1px solid ${primary}33`,
        borderRadius: '8px 0 0 8px',
        boxShadow: `-8px 0 40px rgba(0,0,0,0.5)`,
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${primary}, ${secondary}, ${primary}, transparent)`, boxShadow:`0 0 10px ${primary}66`, zIndex:5 }} />
        {/* Bottom accent line */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${secondary}88, transparent)`, zIndex:5 }} />
        {/* Top-left corner accent */}
        <div style={{ position:'absolute', top:0, left:0, width:16, height:16, borderTop:`2px solid ${primary}`, borderLeft:`2px solid ${primary}`, borderRadius:'8px 0 0 0', zIndex:6 }} />
        {/* Bottom-left corner accent */}
        <div style={{ position:'absolute', bottom:0, left:0, width:16, height:16, borderBottom:`2px solid ${secondary}`, borderLeft:`2px solid ${secondary}`, borderRadius:'0 0 0 8px', zIndex:6 }} />
        {/* Header — drops down first */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            height: 44, background: 'rgba(0,0,0,0.95)',
            borderBottom: `1px solid ${primary}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: primary, boxShadow: `0 0 8px ${primary}` }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.18em' }}>SCOREBOARD</span>
          </div>
          <span style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: secondary, letterSpacing: '0.15em' }}>{matchNum}</span>
        </motion.div>

        {/* Column Headers — drops down second */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          style={{
            display: 'flex', alignItems: 'center', height: 22,
            background: 'rgba(0,0,0,0.7)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '0 8px',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 32, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>RANK</div>
          <div style={{ width: 26 }} />
          <div style={{ flex: 1, fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.35)', paddingLeft: 4, letterSpacing: '0.1em' }}>TEAMS</div>
          <div style={{ width: 68, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>ALIVE</div>
          <div style={{ width: 32, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: primary, letterSpacing: '0.08em' }}>ELIMS</div>
          <div style={{ width: 38, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: secondary, letterSpacing: '0.08em' }}>TOTAL</div>
        </motion.div>

        {/* Rows — stagger drop-down */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {safeArray(rows).map((team, idx) => {
            const rank = idx + 1;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const rankColor = rank <= 3 ? rankColors[rank - 1] : 'rgba(255,255,255,0.5)';
            const isElim = team.aliveCount === 0 && team.totalPlayers > 0;
            const teamFlash = elimFlash[team.id] || {};
            const hasFlash = Object.keys(teamFlash).length > 0;
            const rowBg = rank === 1
              ? 'rgba(255,215,0,0.06)'
              : idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent';

            return (
              <motion.div
                key={team.id || idx}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + idx * 0.05, ease: 'easeOut' }}
                style={{
                  display: 'flex', alignItems: 'center', height: 36,
                  background: hasFlash ? 'rgba(255,0,0,0.12)' : rowBg,
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: rank <= 3 ? `2px solid ${rankColors[rank - 1]}` : '2px solid transparent',
                  padding: '0 8px',
                  opacity: isElim ? 0.35 : 1,
                  transition: 'opacity 0.4s ease, background 0.5s ease',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {/* Rank */}
                <div style={{ width: 32, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: rankColor }}>
                  {String(rank).padStart(2, '0')}
                </div>
                {/* Logo */}
                <div style={{ width: 26, display: 'flex', justifyContent: 'center' }}>
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }}
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 18, height: 18, borderRadius: 3, background: `${primary}22`, border: `1px solid ${primary}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: primary }}>{(team.name || 'T').charAt(0)}</span>
                    </div>
                  )}
                </div>
                {/* Name — with eliminated strike-through */}
                <div style={{ flex: 1, paddingLeft: 4, fontFamily: 'Orbitron', fontSize: 9, fontWeight: 900, color: isElim ? 'rgba(255,255,255,0.25)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em', position: 'relative' }}>
                  {team.name || 'TEAM'}
                  {isElim && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', left: 0, right: 0, top: '50%',
                        height: 1, background: '#ff4444',
                        transformOrigin: 'left',
                        opacity: 0.7,
                      }}
                    />
                  )}
                </div>
                {/* Alive bars — with elimination flash */}
                <div style={{ width: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  {team.slots.map((slot, si) => {
                    const isFlashing = teamFlash[si] !== undefined;
                    const wasAlive = prevAliveRef.current[`${team.id}_${si}`] === true;
                    const justEliminated = isFlashing && wasAlive && !slot.alive;

                    if (isFlashing) {
                      // Red flash animation on elimination
                      return (
                        <motion.div
                          key={si}
                          initial={{ backgroundColor: '#ff3333', boxShadow: '0 0 12px #ff3333' }}
                          animate={{ backgroundColor: '#333333', boxShadow: 'none' }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{
                            width: 8, height: 18, borderRadius: 2,
                          }}
                        />
                      );
                    }

                    const barColor = slot.alive ? '#00FF55' : slot.name === null ? 'rgba(255,255,255,0.06)' : '#333333';
                    return (
                      <motion.div
                        key={si}
                        initial={false}
                        animate={{
                          backgroundColor: barColor,
                          boxShadow: slot.alive ? '0 0 6px #00FF5588' : '0 0 0px transparent',
                        }}
                        transition={{ duration: 0.35 }}
                        style={{
                          width: 8, height: 18, borderRadius: 2,
                        }}
                      />
                    );
                  })}
                </div>
                {/* Elims */}
                <div style={{ width: 32, textAlign: 'center', fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 900, color: isElim ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                  {team.total_tournament_kills || 0}
                </div>
                {/* Total */}
                <div style={{ width: 38, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: isElim ? 'rgba(255,215,0,0.3)' : '#FFD700' }}>
                  {team.total_tournament_points || 0}
                </div>

                {/* Eliminated flash overlay — brief red sweep across row */}
                {hasFlash && (
                  <motion.div
                    initial={{ x: -300, opacity: 0.6 }}
                    animate={{ x: 300, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', top: 0, bottom: 0, left: 0,
                      width: 100,
                      background: 'linear-gradient(90deg, transparent, rgba(255,50,50,0.3), transparent)',
                      pointerEvents: 'none',
                      zIndex: 5,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>
              WAITING FOR DATA...
            </div>
          )}
        </div>

        {/* Legend bar — drops in last */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 + rows.length * 0.05 + 0.1 }}
          style={{
            height: 22, background: 'rgba(0,0,0,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 14, borderRadius: 2, background: '#00FF55', boxShadow: '0 0 4px #00FF5566' }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: 6, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>ALIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 14, borderRadius: 2, background: '#FFAA00' }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: 6, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>KNOCK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 14, borderRadius: 2, background: '#333' }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: 6, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>ELIMINATED</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══ MATCH INFO CHIP — bottom-left pill badge ═══ */
export function MatchInfoChip({ currentMatch, design }) {
  const t = getThemeInline(design);
  const primary = t.p;
  const secondary = t.s;
  const mapName = currentMatch?.map_name || 'Bermuda';
  const matchNum = currentMatch?.match_number || 1;
  const tLogo = design?.logoUrl || null;
  const tName = (design?.tournamentName || 'BOOYAH').toUpperCase();

  return (
    <motion.div
      initial={{ x: -120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'absolute', left: 24, bottom: 32, zIndex: 10 }}
    >
      {/* Container with diagonal-cut accent bar */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        height: 52,
        filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.6))',
      }}>
        {/* Gold accent bar — left edge */}
        <div style={{
          width: 5, background: '#f0a818',
          boxShadow: '0 0 12px rgba(240,168,24,0.6)',
          borderRadius: '3px 0 0 3px',
        }} />

        {/* Main glass panel */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(6,8,16,0.95) 0%, rgba(12,15,24,0.92) 100%)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          padding: '0 18px 0 14px',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle inner glow line at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${primary}44, transparent)`,
          }} />

          {/* Map icon with pulsing dot */}
          <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `${primary}15`,
              border: `1px solid ${primary}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Pulsing live indicator */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: primary,
                boxShadow: `0 0 8px ${primary}`,
                animation: 'chipPulse 2s ease-in-out infinite',
              }} />
            </div>
          </div>

          {/* Game number — gold bold */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em' }}>
              {(design?.matchInfoLabel || 'MATCH').toUpperCase()}
            </span>
            <span style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color: '#f0a818', letterSpacing: '0.06em', lineHeight: 1 }}>
              {String(matchNum).padStart(2, '0')}
            </span>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />

          {/* Map name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em' }}>
              {(design?.mapLabel || 'MAP').toUpperCase()}
            </span>
            <span style={{ fontFamily: 'Rajdhani', fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {mapName}
            </span>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />

          {/* Tournament branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tLogo ? (
              <img src={tLogo} alt="" style={{ height: 24, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
            ) : null}
            <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: secondary, letterSpacing: '0.12em' }}>
              {tName}
            </span>
          </div>
        </div>

        {/* Right diagonal accent — matching game intro style */}
        <div style={{
          width: 14, background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          borderRadius: '0 4px 4px 0',
          boxShadow: `0 0 10px ${primary}44`,
        }} />
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes chipPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </motion.div>
  );
}

/* ═══ GAME INTRO BANNER — full-scene, horizontal banner ═══ */
export function GameIntroBanner({ currentMatch, design }) {
  const matchNum = currentMatch?.match_number || 1;
  const mapName = currentMatch?.map_name || 'Bermuda';
  const tLogo = design?.logoUrl || null;
  const tName = design?.tournamentName || 'BOOYAH';
  const sponsorLogo = design?.sponsorLogoUrl || null;

  return (
    <div style={{
      width: 1920,
      height: 1080,
      position: 'relative',
      background: '#04050a',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 24, 40, 0.9) 0%, rgba(5, 6, 12, 0.98) 100%)',
      overflow: 'hidden',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Subtle particle / grid background layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.08,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      {/* Red ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800,
        height: 350,
        background: 'radial-gradient(ellipse at center, rgba(197, 15, 33, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Main Diagonal-Cut Banner with Framer Motion Entrance */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 950,
          height: 140,
          display: 'flex',
          position: 'relative',
          zIndex: 2,
          filter: 'drop-shadow(0px 15px 35px rgba(0, 0, 0, 0.65))',
          transformOrigin: 'center'
        }}
      >
        {/* LEFT PANEL: Black/Dark Diagonal Panel (~65% width) */}
        <div style={{
          width: '65%',
          height: '100%',
          background: 'linear-gradient(90deg, #090a0f 0%, #11131a 100%)',
          borderLeft: '4px solid #f0a818',
          clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 0% 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 60,
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          {/* Top small letter-spaced uppercase subtitle */}
          <span style={{
            fontFamily: 'Orbitron',
            fontSize: 12,
            fontWeight: 800,
            color: '#b0b6c2',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            marginBottom: 4
          }}>
            {(design?.gameIntroSubtitle || 'CHAMPION RUSH — GRAND').toUpperCase()}
          </span>
          {/* Massive Gold GAME X Title */}
          <span style={{
            fontFamily: 'Orbitron',
            fontSize: 64,
            fontWeight: 900,
            color: '#f0a818',
            backgroundImage: 'linear-gradient(to bottom, #ffe680 0%, #f0a818 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em',
            lineHeight: 1,
            textShadow: '0 0 15px rgba(240, 168, 24, 0.2)'
          }}>
            GAME {matchNum}
          </span>
        </div>

        {/* RIGHT PANEL: Red/Crimson Gradient Panel (~35% width) */}
        <div style={{
          width: '35%',
          height: '100%',
          background: 'linear-gradient(135deg, #a8101a 0%, #e61c2b 100%)',
          clipPath: 'polygon(22.5% 0%, 100% 0%, 100% 100%, 0% 100%)',
          marginLeft: '-10%', // overlap/align clip paths perfectly
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '12%',
          boxSizing: 'border-box'
        }}>
          {tLogo ? (
            <img 
              src={tLogo} 
              alt="" 
              style={{ 
                maxHeight: 75, 
                maxWidth: '85%', 
                objectFit: 'contain',
                filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))'
              }}
              onError={e => { e.target.style.display = 'none'; }} 
            />
          ) : (
            <span style={{ 
              fontFamily: 'Orbitron', 
              fontSize: 26, 
              fontWeight: 900, 
              color: '#fff',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {tName}
            </span>
          )}
        </div>
      </motion.div>

      {/* Map Badge Pill below the banner */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        style={{
          background: 'rgba(9, 10, 15, 0.85)',
          border: '2px solid rgba(240, 168, 24, 0.45)',
          borderRadius: 30,
          padding: '10px 45px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 35,
          zIndex: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#f0a818',
          boxShadow: '0 0 12px #f0a818'
        }} />
        <span style={{
          fontFamily: 'Orbitron',
          fontSize: 16,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '0.2em',
          textTransform: 'uppercase'
        }}>
          {mapName}
        </span>
      </motion.div>

      {/* Tournament Branding Logo/Name in Top Left Corner */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          position: 'absolute',
          top: 50,
          left: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 15,
          zIndex: 2
        }}
      >
        {tLogo ? (
          <img 
            src={tLogo} 
            alt="" 
            style={{ height: 50, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }} 
          />
        ) : (
          <span style={{ 
            fontFamily: 'Orbitron', 
            fontSize: 22, 
            fontWeight: 900, 
            color: '#fff',
            letterSpacing: '0.05em' 
          }}>
            {tName}
          </span>
        )}
      </motion.div>

      {/* Sponsor logo bottom-right */}
      {sponsorLogo && (
        <motion.img 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          src={sponsorLogo} 
          alt="" 
          style={{
            position: 'absolute', 
            bottom: 50, 
            right: 60, 
            height: 40, 
            objectFit: 'contain', 
            zIndex: 2,
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
          }} 
          onError={e => { e.target.style.display = 'none'; }} 
        />
      )}
    </div>
  );
}

export function MatchScheduleGrid({ design }) {
  const tLogo = design?.logoUrl || null;
  const tName = design?.tournamentName || 'BOOYAH TOURNAMENT';
  const sponsorLogo = design?.sponsorLogoUrl || null;
  const mapImages = getMapImages();
  const scheduleMaps = ['Bermuda', 'Purgatory', 'Kalahari', 'Nexterra', 'Solara', 'RANDOM'];

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.92 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15
      }
    }
  };

  return (
    <div style={{
      width: 1920,
      height: 1080,
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 40%, #150f3b 0%, #070514 80%, #030208 100%)',
      boxSizing: 'border-box',
    }}>
      {/* Hazard diagonal warning stripes in the corners */}
      {/* Top Left Corner */}
      <div style={{
        position: 'absolute',
        top: -40,
        left: -40,
        width: 180,
        height: 180,
        transform: 'rotate(-45deg)',
        zIndex: 5,
        backgroundImage: 'repeating-linear-gradient(-45deg, #FFC700, #FFC700 15px, #000 15px, #000 30px)',
        boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(255, 199, 0, 0.2)',
        borderBottom: '4px solid #fff'
      }} />

      {/* Top Right Corner */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        transform: 'rotate(45deg)',
        zIndex: 5,
        backgroundImage: 'repeating-linear-gradient(45deg, #FFC700, #FFC700 15px, #000 15px, #000 30px)',
        boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(255, 199, 0, 0.2)',
        borderBottom: '4px solid #fff'
      }} />

      {/* Bottom Left Corner */}
      <div style={{
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 180,
        height: 180,
        transform: 'rotate(45deg)',
        zIndex: 5,
        backgroundImage: 'repeating-linear-gradient(45deg, #FFC700, #FFC700 15px, #000 15px, #000 30px)',
        boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(255, 199, 0, 0.2)',
        borderTop: '4px solid #fff'
      }} />

      {/* Bottom Right Corner */}
      <div style={{
        position: 'absolute',
        bottom: -40,
        right: -40,
        width: 180,
        height: 180,
        transform: 'rotate(-45deg)',
        zIndex: 5,
        backgroundImage: 'repeating-linear-gradient(-45deg, #FFC700, #FFC700 15px, #000 15px, #000 30px)',
        boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(255, 199, 0, 0.2)',
        borderTop: '4px solid #fff'
      }} />

      {/* Technical Grid/Stripes Background Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 80px)',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      {/* Hexagon/Radial HUD patterns */}
      <div style={{
        position: 'absolute',
        left: '10%',
        top: '15%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(255, 199, 0, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        right: '10%',
        bottom: '15%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(0, 150, 255, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        padding: '80px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 24,
            marginBottom: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {tLogo ? (
              <img src={tLogo} alt="" style={{ height: 80, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))' }}
                onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{
                height: 80,
                width: 80,
                background: 'linear-gradient(135deg, #FFC700, #FF5500)',
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255,85,0,0.5)'
              }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color: '#000' }}>FF</span>
              </div>
            )}
            <div>
              <div style={{
                fontFamily: 'Orbitron',
                fontSize: 54,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '0.12em',
                lineHeight: 1.1,
                textShadow: '0 0 20px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.05)'
              }}>
                GAME SCHEDULE
              </div>
              <div style={{
                fontFamily: 'Orbitron',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFC700',
                letterSpacing: '0.3em',
                marginTop: 6,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span>{tName}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>//</span>
                <span style={{ color: '#fff' }}>{(design?.scheduleSubtitle || 'MATCH SCHEDULING GRID').toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          {sponsorLogo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>OFFICIAL SPONSOR</span>
              <img src={sponsorLogo} alt="" style={{ height: 50, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}
        </motion.div>

        {/* 6 Map Cards Horizontal Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 20,
            flex: 1,
            alignItems: 'center',
            padding: '20px 0'
          }}
        >
          {scheduleMaps.map((mapName, idx) => {
            const gameNum = idx + 1;
            const isRandom = mapName === 'RANDOM';
            const mapImg = mapImages?.[mapName] || null;

            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.04, 
                  y: -8, 
                  boxShadow: '0 15px 35px rgba(255, 199, 0, 0.25), 0 0 15px rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 199, 0, 0.8)'
                }}
                style={{
                  height: 480,
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  background: 'rgba(10, 8, 28, 0.6)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.03)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Background Image / Pattern */}
                {isRandom ? (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    background: 'radial-gradient(circle at center, #1a153b 0%, #0d0a1f 100%)',
                  }}>
                    {/* Animated grid overlay inside Random card */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 199, 0, 0.05) 0px, rgba(255, 199, 0, 0.05) 10px, transparent 10px, transparent 20px)',
                      opacity: 0.8
                    }} />
                    {/* Futuristic glowing crosshair or emblem center */}
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 80,
                      height: 80,
                      border: '2px dashed rgba(255, 199, 0, 0.3)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(255, 199, 0, 0.1)'
                    }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color: '#FFC700', opacity: 0.6 }}>?</span>
                    </div>
                  </div>
                ) : mapImg ? (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    backgroundImage: "url(" + mapImg + ")",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
                ) : (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    background: 'linear-gradient(135deg, #1b163d, #0d0a21)',
                  }} />
                )}

                {/* Cyberpunk grid overlay for premium visual texture */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                  backgroundImage: 'linear-gradient(rgba(18, 16, 35, 0) 60%, rgba(6, 4, 15, 0.95) 95%)',
                  pointerEvents: 'none',
                }} />

                {/* Subtle top edge highlighting glow */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  zIndex: 2,
                }} />

                {/* Header Badge */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '16px 16px 0 16px',
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #FFC700 0%, #FF8800 100%)',
                    borderRadius: 4,
                    padding: '6px 14px',
                    boxShadow: '0 4px 12px rgba(255, 136, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}>
                    <span style={{
                      fontFamily: 'Orbitron',
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#000',
                      letterSpacing: '0.12em',
                    }}>
                      GAME 0{gameNum}
                    </span>
                  </div>
                </div>

                {/* Bottom Text Label */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '0 16px 24px 16px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Orbitron',
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                  }}>
                    {isRandom ? 'DECIDING' : mapName}
                  </div>
                  
                  {/* Active Match status or Mode */}
                  <div style={{
                    fontFamily: 'Orbitron',
                    fontSize: 10,
                    fontWeight: 700,
                    color: isRandom ? '#FF8800' : '#00FFCC',
                    letterSpacing: '0.2em',
                    marginTop: 6,
                    textTransform: 'uppercase',
                    textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                  }}>
                    {isRandom ? 'RANDOM SELECT' : 'CLASSIC MODE'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 18,
            marginTop: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 12,
              height: 12,
              background: '#FFC700',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              boxShadow: '0 0 8px #FFC700'
            }} />
            <span style={{
              fontFamily: 'Orbitron',
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.25em'
            }}>
              {(design?.scheduleBrandText || 'FREE FIRE WORLD SERIES').toUpperCase()}
            </span>
          </div>

          <span style={{
            fontFamily: 'Orbitron',
            fontSize: 13,
            fontWeight: 800,
            color: '#FFC700',
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
          }}>
            {(design?.scheduleFooter || '#RISETOTHESUMMIT').toUpperCase()}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: 'Orbitron',
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.15em'
            }}>
              LIVE OVERLAY V2.0
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function PointRushStandings({ teams = [], design }) {
  const sorted = useMemo(() =>
    [...safeArray(teams)].sort((a, b) =>
      (b.total_tournament_points || 0) - (a.total_tournament_points || 0) ||
      (b.total_tournament_kills || 0) - (a.total_tournament_kills || 0)
    ), [teams]);

  const col1 = sorted.slice(0, 6);
  const col2 = sorted.slice(6, 12);
  const tLogo = design?.logoUrl || null;
  const tName = design?.tournamentName || 'BOOYAH TOURNAMENT';
  const sponsorLogo = design?.sponsorLogoUrl || null;
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  // Editable from Director panel — design.pointRush object
  const pr = design?.pointRush || {};
  const gradStart = pr.gradientStart || '#020B18';
  const gradMid   = pr.gradientMid   || '#040F2A';
  const gradEnd   = pr.gradientEnd   || '#061535';
  const footerText = pr.footerText || '#Rise to THE SUMMIT';
  const showHazard = pr.hazardTape !== false; // default true
  const headerText = pr.headerText || 'POINT RUSH STANDINGS';

  // Hazard tape corner component
  const HazardCorner = ({ position }) => {
    const posStyles = {
      topLeft:     { top: -40, left: -40, transform: 'rotate(-45deg)' },
      topRight:    { top: -40, right: -40, transform: 'rotate(45deg)' },
      bottomLeft:  { bottom: -40, left: -40, transform: 'rotate(45deg)' },
      bottomRight: { bottom: -40, right: -40, transform: 'rotate(-45deg)' },
    };
    return (
      <div style={{
        position: 'absolute', width: 180, height: 180, zIndex: 5,
        ...posStyles[position],
        backgroundImage: 'repeating-linear-gradient(-45deg, #FFC700, #FFC700 15px, #000 15px, #000 30px)',
        boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 30px rgba(255,199,0,0.2)',
        borderBottom: position.includes('top') ? '4px solid #fff' : 'none',
        borderTop: position.includes('bottom') ? '4px solid #fff' : 'none',
      }} />
    );
  };

  const renderRow = (team, idx, globalRank) => {
    const rank = globalRank;
    const isTop = rank <= 3;
    const rankColor = isTop ? rankColors[rank - 1] : '#fff';
    const rowBg = rank === 1
      ? 'linear-gradient(90deg, rgba(255,215,0,0.12), rgba(255,215,0,0.03))'
      : idx % 2 === 0
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(255,255,255,0.01)';

    return (
      <motion.div
        key={team.id || idx}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: idx * 0.05 }}
        style={{
          display: 'flex', alignItems: 'center', height: 56,
          background: rowBg,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6,
          padding: '0 14px',
          marginBottom: 4,
          backdropFilter: 'blur(4px)',
        }}>
        {/* Rank badge */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: rank === 1
            ? 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,215,0,0.05))'
            : 'rgba(0,0,0,0.5)',
          border: rank <= 3
            ? `1px solid ${rankColors[rank-1]}66`
            : '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: rankColor,
          flexShrink: 0,
          boxShadow: rank <= 3 ? `0 0 10px ${rankColors[rank-1]}33` : 'none',
        }}>
          {rank}
        </div>
        {/* Team logo */}
        <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
          {team.logo_url ? (
            <img src={team.logo_url} alt="" style={{
              width: 32, height: 32, objectFit: 'contain', borderRadius: '50%',
              border: rank === 1 ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.15)',
            }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>
                {(team.name || 'T').charAt(0)}
              </span>
            </div>
          )}
        </div>
        {/* Team name */}
        <div style={{
          flex: 1, paddingLeft: 12,
          fontFamily: 'Orbitron', fontSize: 15, fontWeight: 900,
          color: rank === 1 ? '#FFD700' : '#fff',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team.name || 'TEAM'}
        </div>
        {/* Placement Points (PPT) */}
        <div style={{
          fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700,
          color: '#00D4FF', minWidth: 36, textAlign: 'right',
        }}>
          {(() => { const kk=(team.total_tournament_kills||0); const tp=(team.total_tournament_points||0); return tp-kk; })()}
        </div>
        {/* Kills */}
        <div style={{
          fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700,
          color: 'rgba(255,255,255,0.4)', minWidth: 36, textAlign: 'right',
        }}>
          {team.total_tournament_kills || 0}
        </div>
        {/* Kill Points */}
        <div style={{
          fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700,
          color: '#22c55e', minWidth: 42, textAlign: 'right',
        }}>
          {team.total_tournament_kills || 0}
        </div>
        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
        {/* Total points */}
        <div style={{
          fontFamily: 'Rajdhani', fontSize: 24, fontWeight: 900,
          color: rank === 1 ? '#FFD700' : '#fff',
          minWidth: 56, textAlign: 'right',
          textShadow: rank === 1 ? '0 0 12px rgba(255,215,0,0.4)' : 'none',
        }}>
          {team.total_tournament_points || 0}
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${gradStart} 0%, ${gradMid} 50%, ${gradEnd} 100%)`,
    }}>
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.35)',
      }} />
      {/* Subtle grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 800px 400px at 50% 30%, ${gradMid}33, transparent 70%)`,
      }} />

      {/* Hazard tape corners */}
      {showHazard && (
        <>
          <HazardCorner position="topLeft" />
          <HazardCorner position="topRight" />
          <HazardCorner position="bottomLeft" />
          <HazardCorner position="bottomRight" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 10, width: '100%', height: '100%',
          padding: '56px 72px', display: 'flex', flexDirection: 'column',
        }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {tLogo && (
              <img src={tLogo} alt="" style={{ height: 48, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div>
              <div style={{
                fontFamily: 'Orbitron', fontSize: 52, fontWeight: 900, color: '#fff',
                letterSpacing: '0.12em', lineHeight: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}>
                {headerText}
              </div>
              <div style={{
                fontFamily: 'Orbitron', fontSize: 14, fontWeight: 700,
                color: 'rgba(255,255,255,0.6)', letterSpacing: '0.25em', marginTop: 8,
              }}>
                {tName} // GRAND FINALS
              </div>
            </div>
          </div>
          {sponsorLogo && (
            <img src={sponsorLogo} alt="" style={{
              height: 48, objectFit: 'contain', opacity: 0.85,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 8 }}>
          {col2.length > 0 ? (
            <>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '0 14px 8px 62px', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>TEAM</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.15em' }}>PPT</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>KILLS</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.15em' }}>K.PTS</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>PTS</span>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '0 14px 8px 62px', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>TEAM</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.15em' }}>PPT</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>KILLS</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.15em' }}>K.PTS</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>PTS</span>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '0 14px 8px 62px', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>TEAM</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.15em' }}>PPT</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>KILLS</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.15em' }}>K.PTS</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>PTS</span>
            </div>
          )}
        </div>

        {/* Two columns */}
        <div style={{ display: 'flex', gap: 40, flex: 1 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {col1.map((team, idx) => renderRow(team, idx, idx + 1))}
          </div>
          {col2.length > 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {col2.map((team, idx) => renderRow(team, idx, idx + 7))}
            </div>
          )}
        </div>

        {/* Footer — "#Rise to THE SUMMIT" */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 20, marginTop: 28,
          }}>
          {/* Left accent line */}
          <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,199,0,0.6))' }} />
          {tLogo && (
            <img src={tLogo} alt="" style={{ height: 28, objectFit: 'contain', opacity: 0.5 }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
          <span style={{
            fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900,
            color: '#FFC700', letterSpacing: '0.15em',
            textShadow: '0 2px 12px rgba(255,199,0,0.4)',
          }}>
            {footerText}
          </span>
          {sponsorLogo && (
            <img src={sponsorLogo} alt="" style={{ height: 28, objectFit: 'contain', opacity: 0.5 }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
          {/* Right accent line */}
          <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg, rgba(255,199,0,0.6), transparent)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ═══ THEME HELPER (inline copy to avoid circular deps) ═══ */
function getThemeInline(design) {
  const style = design?.overlayStyle || 'default';
  const userAcc = design?.accentColor || null;
  const userAcc2 = design?.accentColor2 || null;
  const presets = {
    default:  { p: '#00C8FF', s: '#1E90FF', glow: true },
    neon:     { p: '#00FF88', s: '#BF00FF', glow: true },
    military: { p: '#9ABF30', s: '#C8A850', glow: false },
    minimal:  { p: '#FFFFFF', s: '#888888', glow: false },
    retro:    { p: '#FF3030', s: '#FFD700', glow: true },
  };
  const t = { ...(presets[style] || presets.default) };
  if (userAcc && style === 'default') t.p = userAcc;
  if (userAcc2 && style === 'default') t.s = userAcc2;
  return t;
}
