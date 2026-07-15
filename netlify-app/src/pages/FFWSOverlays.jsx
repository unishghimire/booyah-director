/**
 * FFWSOverlays.jsx — FFWS-style broadcast overlay components
 * New screens: GameIntroBanner, MatchScheduleGrid, PointRushStandings
 * Upgrades: FFBoardV2, MatchInfoChip
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { safeArray } from '@/components/ErrorBoundary';
import { MAPS, getMapImages } from '@/lib/maps';

/* ═══ FFWS SCOREBOARD V2 — right panel, tighter rows, legend ═══ */
export function FFBoardV2({ teams = [], players = [], currentMatch, design }) {
  const t = getThemeInline(design);
  const primary = t.p;
  const secondary = t.s;

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

  const matchNum = currentMatch?.match_number
    ? `GAME ${String(currentMatch.match_number).padStart(2, '0')}`
    : 'STANDBY';

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 300, zIndex: 10 }}
    >
      {/* Panel with no left border-radius */}
      <div style={{
        width: '100%', height: '100%',
        background: 'rgba(6,8,16,0.92)',
        backdropFilter: 'blur(16px) saturate(180%)',
        borderLeft: `1px solid ${primary}33`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          height: 44, background: 'rgba(0,0,0,0.95)',
          borderBottom: `1px solid ${primary}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: primary, boxShadow: `0 0 8px ${primary}` }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.18em' }}>SCOREBOARD</span>
          </div>
          <span style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: secondary, letterSpacing: '0.15em' }}>{matchNum}</span>
        </div>

        {/* Column Headers */}
        <div style={{
          display: 'flex', alignItems: 'center', height: 22,
          background: 'rgba(0,0,0,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '0 8px',
          flexShrink: 0,
        }}>
          <div style={{ width: 32, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>RANK</div>
          <div style={{ width: 26 }} />
          <div style={{ flex: 1, fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.35)', paddingLeft: 4, letterSpacing: '0.1em' }}>TEAMS</div>
          <div style={{ width: 68, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>ALIVE</div>
          <div style={{ width: 32, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: primary, letterSpacing: '0.08em' }}>ELIMS</div>
          <div style={{ width: 38, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 7, fontWeight: 900, color: secondary, letterSpacing: '0.08em' }}>TOTAL</div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {safeArray(rows).map((team, idx) => {
            const rank = idx + 1;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const rankColor = rank <= 3 ? rankColors[rank - 1] : 'rgba(255,255,255,0.5)';
            const isElim = team.aliveCount === 0 && team.totalPlayers > 0;
            const rowBg = rank === 1
              ? 'rgba(255,215,0,0.06)'
              : idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent';

            return (
              <div key={team.id || idx} style={{
                display: 'flex', alignItems: 'center', height: 36,
                background: rowBg,
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                borderLeft: rank <= 3 ? `2px solid ${rankColors[rank - 1]}` : '2px solid transparent',
                padding: '0 8px',
                opacity: isElim ? 0.35 : 1,
                transition: 'opacity 0.4s ease',
                flexShrink: 0,
              }}>
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
                {/* Name */}
                <div style={{ flex: 1, paddingLeft: 4, fontFamily: 'Orbitron', fontSize: 9, fontWeight: 900, color: isElim ? 'rgba(255,255,255,0.25)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {team.name || 'TEAM'}
                </div>
                {/* Alive bars */}
                <div style={{ width: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  {team.slots.map((slot, si) => {
                    const barColor = slot.alive ? '#00FF55' : slot.name === null ? 'rgba(255,255,255,0.06)' : '#333333';
                    return (
                      <div key={si} style={{
                        width: 8, height: 18, borderRadius: 2,
                        background: barColor,
                        boxShadow: slot.alive ? '0 0 6px #00FF5588' : 'none',
                        transition: 'background 0.35s ease',
                      }} />
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
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>
              WAITING FOR DATA...
            </div>
          )}
        </div>

        {/* Legend bar */}
        <div style={{
          height: 22, background: 'rgba(0,0,0,0.9)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          flexShrink: 0,
        }}>
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
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ MATCH INFO CHIP — bottom-left pill badge ═══ */
export function MatchInfoChip({ currentMatch, design }) {
  const t = getThemeInline(design);
  const primary = t.p;
  const mapName = currentMatch?.map_name || 'Bermuda';
  const matchNum = currentMatch?.match_number || 1;
  const tLogo = design?.logoUrl || null;

  return (
    <div style={{
      position: 'absolute', left: 24, bottom: 24, zIndex: 10,
      display: 'flex', alignItems: 'center',
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8,
      padding: '0 16px', height: 44,
      backdropFilter: 'blur(10px)',
      gap: 12,
    }}>
      {/* Map color dot */}
      <div style={{ width: 10, height: 10, borderRadius: 2, background: primary, boxShadow: `0 0 6px ${primary}` }} />
      {/* Game number */}
      <span style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: '#FFD700', letterSpacing: '0.08em' }}>
        GAME {String(matchNum).padStart(2, '0')}
      </span>
      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)' }} />
      {/* Map name */}
      <span style={{ fontFamily: 'Rajdhani', fontSize: 15, fontWeight: 700, color: '#fff' }}>
        {mapName}
      </span>
      {/* Tournament logo */}
      {tLogo && (
        <img src={tLogo} alt="" style={{ height: 20, objectFit: 'contain', opacity: 0.7 }}
          onError={e => { e.target.style.display = 'none'; }} />
      )}
    </div>
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
            CHAMPION RUSH — GRAND
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

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a1a3e 100%)',
    }}>
      {/* Diagonal stripe texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)',
      }} />
      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 1000px 600px at 50% 30%, rgba(255,215,0,0.08), transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '48px 64px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {tLogo && (
              <img src={tLogo} alt="" style={{ height: 48, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '0.15em', lineHeight: 1 }}>
                GAME SCHEDULE
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 700, color: '#FFD700', letterSpacing: '0.25em', marginTop: 8 }}>
                {tName} // CHAMPION RUSH // GRAND FINALS
              </div>
            </div>
          </div>
          {sponsorLogo && (
            <img src={sponsorLogo} alt="" style={{ height: 48, objectFit: 'contain', opacity: 0.8 }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>

        {/* 6-card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18, flex: 1, alignItems: 'center' }}>
          {scheduleMaps.map((mapName, idx) => {
            const gameNum = idx + 1;
            const isRandom = mapName === 'RANDOM';
            const mapImg = mapImages?.[mapName] || null;

            return (
              <div key={idx} style={{
                borderRadius: 12, overflow: 'hidden', height: 280,
                border: '1px solid rgba(255,255,255,0.15)',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transition: 'transform 0.3s ease',
              }}>
                {/* Background */}
                {isRandom ? (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(45deg, #1a1a2e, #1a1a2e 20px, #2a2a4e 20px, #2a2a4e 40px)',
                  }} />
                ) : mapImg ? (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${mapImg})`, backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, #1a1a3e, #2a1a4e)`,
                  }} />
                )}
                {/* Dark overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.85))' }} />

                {/* Game number badge top */}
                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  background: 'rgba(0,0,0,0.7)', borderRadius: 6,
                  padding: '4px 12px',
                  fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900,
                  color: '#FFD700', letterSpacing: '0.1em',
                }}>
                  GAME {gameNum}
                </div>

                {/* Bottom label */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.88)',
                  padding: '12px 16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isRandom ? 'TBA' : mapName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          marginTop: 32,
        }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', letterSpacing: '0.1em' }}>
            #RiseToTheSummit
          </span>
          {tLogo && (
            <img src={tLogo} alt="" style={{ height: 24, objectFit: 'contain', opacity: 0.4 }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ POINT RUSH STANDINGS — dual column, FFWS style ═══ */
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
  const rankColors = ['#FFD700', '#E5E4E2', '#CD7F32'];

  const renderRow = (team, idx, globalRank) => {
    const rank = globalRank;
    const isTop = rank <= 3;
    const rankColor = isTop ? rankColors[rank - 1] : '#fff';
    const rowBg = rank === 1 ? 'rgba(255,215,0,0.08)' : idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent';

    return (
      <div key={team.id || idx} style={{
        display: 'flex', alignItems: 'center', height: 48,
        background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.03)',
        padding: '0 12px',
      }}>
        {/* Rank badge */}
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: rank === 1 ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.4)',
          border: rank <= 3 ? `1px solid ${rankColors[rank-1]}44` : '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: rankColor,
          flexShrink: 0,
        }}>
          {rank}
        </div>
        {/* Team logo */}
        <div style={{ width: 36, display: 'flex', justifyContent: 'center' }}>
          {team.logo_url ? (
            <img src={team.logo_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: '50%', border: rank === 1 ? '2px solid #FFD700' : 'none' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: '#FF6B00' }}>{(team.name || 'T').charAt(0)}</span>
            </div>
          )}
        </div>
        {/* Team name */}
        <div style={{ flex: 1, paddingLeft: 10, fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {team.name || 'TEAM'}
        </div>
        {/* Points */}
        <div style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 900, color: '#fff', minWidth: 50, textAlign: 'right' }}>
          {team.total_tournament_points || 0}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #06060f 0%, #0a0a1e 50%, #06060f 100%)',
    }}>
      {/* Subtle blue-purple glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 1200px 600px at 50% 20%, rgba(100,80,255,0.08), transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '48px 64px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {tLogo && (
              <img src={tLogo} alt="" style={{ height: 44, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '0.15em', lineHeight: 1 }}>
                POINT RUSH STANDINGS
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color: '#FFD700', letterSpacing: '0.25em', marginTop: 6 }}>
                {tName} // CHAMPION RUSH // GRAND FINALS
              </div>
            </div>
          </div>
          {sponsorLogo && (
            <img src={sponsorLogo} alt="" style={{ height: 44, objectFit: 'contain', opacity: 0.8 }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>

        {/* Two columns */}
        <div style={{ display: 'flex', gap: 40, flex: 1 }}>
          {/* Column 1 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {col1.map((team, idx) => renderRow(team, idx, idx + 1))}
          </div>
          {/* Divider */}
          {col2.length > 0 && (
            <div style={{ width: 1, background: 'linear-gradient(transparent, rgba(255,255,255,0.1), transparent)' }} />
          )}
          {/* Column 2 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {col2.map((team, idx) => renderRow(team, idx, idx + 7))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          {tLogo && (
            <img src={tLogo} alt="" style={{ height: 24, objectFit: 'contain', opacity: 0.4 }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>
            OFFICIAL BROADCAST STANDINGS
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══ THEME HELPER (inline copy to avoid circular deps) ═══ */
function getThemeInline(design) {
  const style = design?.overlayStyle || 'default';
  const userAcc = design?.accentColor || null;
  const userAcc2 = design?.accentColor2 || null;
  const presets = {
    default:  { p: '#FF6B00', s: '#00D4FF', glow: true },
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
