/**
 * FFWSOverlays.jsx — FFWS-style broadcast overlay components
 * New screens: GameIntroBanner, MatchScheduleGrid, PointRushStandings
 * Upgrades: FFBoardV2, MatchInfoChip
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';
import { safeArray } from '@/components/ErrorBoundary';
import { MAPS, getMapImages } from '@/lib/maps';

/* ═══ FFWS SCOREBOARD — right panel, rebuilt from reference ═══ */

/* ─── Eliminated Team Banner ─── */
export function EliminatedTeamBanner({ team }) {
  // Shows for 5 seconds then disappears. team = { name, logo_url }
  const orange = '#FF6B00';
  return (
    <AnimatePresence>
      {team && (
        <motion.div
          key={team.name}
          initial={{ x: -120, opacity: 0, skewX: -6 }}
          animate={{ x: 0,    opacity: 1, skewX: -6 }}
          exit={{   x: -120, opacity: 0, skewX: -6 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            bottom: 90,
            left: 0,
            zIndex: 40,
            width: 620,
            height: 130,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* diagonal slash background */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(102deg, #FF6B00 0%, #FF6B00 38%, #111214 38%, #111214 100%)',
            clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)',
          }} />
          {/* dark right block */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(102deg, transparent 0%, transparent 36%, #0D0E10 36%, #0D0E10 100%)',
          }} />
          {/* left: ELIMINATED TEAM text */}
          <div style={{
            position: 'absolute', left: 28, top: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            width: 220,
            transform: 'skewX(6deg)',
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: 28, fontWeight: 900,
              color: '#000', lineHeight: 1.05, letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              ELIMINATED<br/>TEAM
            </div>
          </div>
          {/* divider */}
          <div style={{
            position: 'absolute', left: 254, top: 16, bottom: 16,
            width: 2, background: 'rgba(255,255,255,0.15)',
          }} />
          {/* right: team name + logo */}
          <div style={{
            position: 'absolute', left: 268, top: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8,
            transform: 'skewX(6deg)',
          }}>
            {team.logo_url && (
              <img src={team.logo_url} alt=""
                style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 22, fontWeight: 700,
              color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {team.name}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FFBoardV2({ teams = [], players = [], currentMatch, design }) {

  const prevElimRef   = useRef({});   // tracks which teams were already eliminated
  const [elimBanner, setElimBanner] = useState(null);   // { name, logo_url }
  const elimTimerRef  = useRef(null);

  const rows = useMemo(() => {
    return [...safeArray(teams)]
      .map(team => {
        const tp = safeArray(players).filter(p => p.team_id === team.id);
        const slots = [];
        for (let i = 0; i < 4; i++) {
          if (tp[i]) slots.push({ name: tp[i].name, alive: tp[i].is_alive });
          else slots.push({ name: null, alive: false });
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

  // Detect newly eliminated teams → show banner for 5s
  useEffect(() => {
    const queue = [];
    rows.forEach(team => {
      const wasElim = prevElimRef.current[team.id];
      const isElim  = team.aliveCount === 0 && team.totalPlayers > 0;
      if (!wasElim && isElim) queue.push({ name: team.name, logo_url: team.logo_url });
      prevElimRef.current[team.id] = isElim;
    });
    if (queue.length > 0) {
      if (elimTimerRef.current) clearTimeout(elimTimerRef.current);
      setElimBanner(queue[queue.length - 1]);
      elimTimerRef.current = setTimeout(() => setElimBanner(null), 5000);
    }
  }, [rows]);

  const matchLabel  = currentMatch?.match_number ? 'MATCH ' + currentMatch.match_number : (design?.matchLabel || 'MATCH 1');
  const dayLabel    = (design?.dayLabel || 'DAY 1').toUpperCase();
  const brandLabel  = (design?.scoreboardBrand || 'EWC').toUpperCase();
  const stageLabel  = (design?.stageLabel || 'GROUP STAGE').toUpperCase();

  const orange    = '#FF6B00';
  const green     = '#7BC043';
  const greenGlow = '#7BC04388';

  // ── FIXED DIMENSIONS matching the reference ──
  // Reference: right-side panel, ~240px wide, rows ~38px each, 12 rows = 456px
  const HEADER_H = 28;
  const ROW_H    = 38;   // compact — 12 × 38 = 456px
  const FOOTER_H = 28;
  const PANEL_W  = 242;

  const displayRows = rows.length > 0
    ? rows
    : [...Array(12)].map((_, i) => ({
        id: 'ghost_' + i, name: null, logo_url: null,
        slots: [{name:null,alive:false},{name:null,alive:false},{name:null,alive:false},{name:null,alive:false}],
        aliveCount: 0, totalPlayers: 0,
        total_tournament_points: null, total_tournament_kills: null,
        _isGhost: true,
      }));

  return (
    <>
      {/* Eliminated team banner — rendered outside the panel, centred */}
      <EliminatedTeamBanner team={elimBanner} />

      <motion.div
        initial={{ x: PANEL_W + 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          right: 0,
          top: 60,
          width: PANEL_W,
          height: HEADER_H + ROW_H * 12 + FOOTER_H,  // 28+456+28 = 512px
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ══ ORANGE HEADER ══ */}
        <div style={{
          width: '100%', height: HEADER_H, background: orange,
          display: 'flex', alignItems: 'center', flexShrink: 0,
          padding: '0 8px 0 6px', boxSizing: 'border-box',
        }}>
          <div style={{ width: 20, flexShrink: 0 }} />
          <div style={{ width: 20, flexShrink: 0 }} />
          <div style={{ flex: 1, fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: '0.1em' }}>TEAM</div>
          <div style={{ width: 58, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: '0.09em' }}>ALIVE</div>
          <div style={{ width: 26, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: '0.09em' }}>PTS</div>
          <div style={{ width: 26, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: '0.07em' }}>ELMS</div>
        </div>

        {/* ══ ROWS ══ */}
        {displayRows.map((team, idx) => {
          const rank      = idx + 1;
          const isGhost   = !!team._isGhost;
          const isElim    = !isGhost && team.aliveCount === 0 && team.totalPlayers > 0;
          const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.3)';

          return (
            <motion.div
              key={team.id || idx}
              initial={!isGhost ? { x: 50, opacity: 0 } : false}
              animate={!isGhost ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: 0.05 + idx * 0.025, ease: 'easeOut' }}
              style={{
                width: '100%', height: ROW_H, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                background: '#0A0B0F',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                borderLeft: rank <= 3 ? '3px solid ' + rankColor : '3px solid transparent',
                padding: '0 8px 0 5px', boxSizing: 'border-box',
                opacity: isElim ? 0.28 : isGhost ? 0.2 : 1,
                transition: 'opacity 0.4s ease',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Rank */}
              <div style={{
                width: 20, flexShrink: 0, textAlign: 'center',
                fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700,
                color: isGhost ? 'rgba(255,255,255,0.1)' : rankColor,
              }}>{rank}</div>

              {/* Logo */}
              <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                {!isGhost && team.logo_url ? (
                  <img src={team.logo_url} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 2 }}
                    onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{
                    width: 16, height: 16, borderRadius: 2,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!isGhost && (
                      <span style={{ fontFamily: 'Orbitron', fontSize: 6, fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>
                        {(team.name || 'T').charAt(0)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Team name */}
              <div style={{
                flex: 1, paddingLeft: 3,
                fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700,
                color: isGhost ? 'transparent' : isElim ? 'rgba(255,255,255,0.18)' : '#D8E4F5',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                position: 'relative',
              }}>
                {isGhost ? '' : (team.name || 'TEAM')}
                {isElim && !isGhost && (
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', left: 3, right: 0, top: '50%', height: 1, background: '#ff4444', transformOrigin: 'left', opacity: 0.45 }} />
                )}
              </div>

              {/* Alive bars */}
              <div style={{ width: 58, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                {team.slots.map((slot, si) => {
                  const bg = isGhost
                    ? 'rgba(255,255,255,0.04)'
                    : slot.alive
                      ? green
                      : slot.name === null
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.09)';
                  return (
                    <motion.div key={si} animate={{ backgroundColor: bg }} transition={{ duration: 0.25 }}
                      style={{
                        width: 9, height: 18, borderRadius: 2, flexShrink: 0,
                        boxShadow: !isGhost && slot.alive ? '0 0 4px ' + greenGlow : 'none',
                      }}
                    />
                  );
                })}
              </div>

              {/* PTS */}
              <div style={{
                width: 26, textAlign: 'center', flexShrink: 0,
                fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 700,
                color: isGhost ? 'rgba(255,255,255,0.06)' : isElim ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
              }}>
                {isGhost ? '' : (team.total_tournament_points ?? 0)}
              </div>

              {/* ELIMS */}
              <div style={{
                width: 26, textAlign: 'center', flexShrink: 0,
                fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 700,
                color: isGhost ? 'rgba(255,255,255,0.04)' : isElim ? 'rgba(255,107,0,0.18)' : orange,
              }}>
                {isGhost ? '' : (team.total_tournament_kills ?? 0)}
              </div>
            </motion.div>
          );
        })}

        {/* ══ FOOTER ══ */}
        <div style={{
          width: '100%', height: FOOTER_H, background: '#06070A', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px', boxSizing: 'border-box',
          borderTop: '2px solid ' + orange,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {design?.logoUrl
              ? <img src={design.logoUrl} alt="" style={{ height: 16, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              : <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: orange, letterSpacing: '0.12em' }}>{brandLabel}</span>
            }
            <span style={{ fontFamily: 'Orbitron', fontSize: 6, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em' }}>{stageLabel}</span>
          </div>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
            {dayLabel} · {matchLabel.toUpperCase()}
          </span>
        </div>
      </motion.div>
    </>
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
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
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
          background: 'transparent',
          backdropFilter: 'none',
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
