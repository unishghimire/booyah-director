import React, { useEffect, useState, useMemo } from 'react';

import { MAP_IMAGES } from '@/lib/maps';

function GamingBackground({ mapName, accent = '#f97316', accent2 = '#00d4ff' }) {
  const mapImg = MAP_IMAGES[mapName] || null;
  
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Base: deep dark */}
      <div style={{ position: 'absolute', inset: 0, background: '#060912' }} />
      
      {/* Map image — blurred, darkened, used as atmospheric backdrop */}
      {mapImg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(' + mapImg + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
          filter: 'blur(8px) saturate(0.6)',
        }} />
      )}
      
      {/* Carbon fiber texture overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 6px)',
      }} />
      
      {/* Hex grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(' + accent + '08 1px, transparent 1px), linear-gradient(90deg, ' + accent + '08 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
      
      {/* Diagonal scan lines — subtle */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
      }} />
      
      {/* Radial center glow — primary accent */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 1400px 900px at 50% 40%, ' + accent + '22, transparent 70%)',
      }} />
      
      {/* Secondary accent glow — opposite corner */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 600px 600px at 85% 80%, ' + accent2 + '15, transparent 60%)',
      }} />
      
      {/* Top edge LED strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, ' + accent + ', ' + accent2 + ', ' + accent + ', transparent)',
      }} />
      
      {/* Bottom edge LED strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, ' + accent + '88, transparent)',
      }} />
      
      {/* Left edge glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '1px',
        background: 'linear-gradient(180deg, transparent, ' + accent + '66, transparent)',
      }} />
      
      {/* Right edge glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '1px',
        background: 'linear-gradient(180deg, transparent, ' + accent2 + '66, transparent)',
      }} />
      
      {/* Dark vignette — keeps corners very dark */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 30%, rgba(4,5,14,0.85) 100%)',
      }} />
      
      {/* Floating particles — CSS animation via keyframes in style tag */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? '3px' : '2px',
          height: i % 3 === 0 ? '3px' : '2px',
          borderRadius: '50%',
          background: i % 2 === 0 ? accent : accent2,
          left: (8 + i * 8) + '%',
          top: (10 + (i * 17) % 80) + '%',
          opacity: 0.4,
          animation: 'floatParticle ' + (3 + (i % 3)) + 's ease-in-out infinite alternate',
          animationDelay: (i * 0.4) + 's',
        }} />
      ))}
      
      <style>{'
        @keyframes floatParticle {
          from { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          to   { transform: translateY(-20px) translateX(8px); opacity: 0.6; }
        }
      '}</style>
    </div>
  );
}


import { MAP_IMAGES } from '@/lib/maps';

function GamingBackground({ mapName, accent = '#f97316', accent2 = '#00d4ff' }) {
  const mapImg = MAP_IMAGES[mapName] || null;
  
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Base: deep dark */}
      <div style={{ position: 'absolute', inset: 0, background: '#060912' }} />
      
      {/* Map image — blurred, darkened, used as atmospheric backdrop */}
      {mapImg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${mapImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
          filter: 'blur(8px) saturate(0.6)',
        }} />
      )}
      
      {/* Carbon fiber texture overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 6px),
          repeating-linear-gradient(-45deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 6px)
        `,
      }} />
      
      {/* Hex grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${accent}08 1px, transparent 1px),
          linear-gradient(90deg, ${accent}08 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />
      
      {/* Diagonal scan lines — subtle */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 3px,
          rgba(255,255,255,0.008) 3px,
          rgba(255,255,255,0.008) 4px
        )`,
      }} />
      
      {/* Radial center glow — primary accent */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 1400px 900px at 50% 40%, ${accent}22, transparent 70%)`,
      }} />
      
      {/* Secondary accent glow — opposite corner */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 600px 600px at 85% 80%, ${accent2}15, transparent 60%)`,
      }} />
      
      {/* Top edge LED strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}, ${accent2}, ${accent}, transparent)`,
      }} />
      
      {/* Bottom edge LED strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
      }} />
      
      {/* Left edge glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '1px',
        background: `linear-gradient(180deg, transparent, ${accent}66, transparent)`,
      }} />
      
      {/* Right edge glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '1px',
        background: `linear-gradient(180deg, transparent, ${accent2}66, transparent)`,
      }} />
      
      {/* Dark vignette — keeps corners very dark */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 30%, rgba(4,5,14,0.85) 100%)',
      }} />
      
      {/* Floating particles — CSS animation via keyframes in style tag */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? '3px' : '2px',
          height: i % 3 === 0 ? '3px' : '2px',
          borderRadius: '50%',
          background: i % 2 === 0 ? accent : accent2,
          left: `${8 + i * 8}%`,
          top: `${10 + (i * 17) % 80}%`,
          opacity: 0.4,
          animation: `floatParticle ${3 + (i % 3)}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}
      
      <style>{`
        @keyframes floatParticle {
          from { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          to   { transform: translateY(-20px) translateX(8px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Star, Crown, Zap, Video, Calendar, Users, MapPin, Award, XCircle } from 'lucide-react';

/* ── Design tokens helper ── */
const tok = {
  acc:  x => x?.accentColor  || '#FF6B00',
  acc2: x => x?.accentColor2 || '#00D4FF',
  bg:   x => x?.bgColor      || '#060915',
  txt:  x => x?.textColor    || '#ffffff',
  name: x => x?.tournamentName    || 'FF GLOBAL CHAMPIONSHIP',
  sub:  x => x?.tournamentSubtitle || 'GRAND FINALS',
  game: x => x?.gameLabel    || 'MATCH',
  font: x => {
    const f = x?.fontStyle || 'orbitron';
    if (f === 'rajdhani') return 'Rajdhani, sans-serif';
    if (f === 'impact')   return 'Impact, Arial Narrow, sans-serif';
    return 'Orbitron, sans-serif';
  },
};

/* ── FF Global Grid Background ── */
function GridBg({ design }) {
  return (
    <>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(rgba(255,107,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 1400px 700px at 50% 50%, rgba(255,107,0,0.08), transparent)`,
        zIndex: 0
      }} />
    </>
  );
}

/* ── FF Reusable Panel Component ── */
function FFPanel({ children, style, className }) {
  return (
    <div style={{
      background: 'rgba(6,9,21,0.93)',
      backdropFilter: 'blur(16px) saturate(180%)',
      borderTop: '2px solid #FF6B00',
      borderLeft: '2px solid #FF6B00',
      borderBottom: '2px solid #00D4FF',
      borderRight: '2px solid #00D4FF',
      borderRadius: 6,
      boxShadow: '0 0 40px rgba(255,107,0,0.12), 0 0 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,107,0,0.2)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }} className={className}>
      {/* Corner accent marks — orange diagonal slashes */}
      <div style={{ position:'absolute', top:0, left:0, width:12, height:12, borderTop:'3px solid #FF6B00', borderLeft:'3px solid #FF6B00', borderRadius:'2px 0 0 0', zIndex: 10 }} />
      <div style={{ position:'absolute', top:0, right:0, width:12, height:12, borderTop:'3px solid #00D4FF', borderRight:'3px solid #00D4FF', borderRadius:'0 2px 0 0', zIndex: 10 }} />
      <div style={{ position:'absolute', bottom:0, left:0, width:12, height:12, borderBottom:'3px solid #00D4FF', borderLeft:'3px solid #00D4FF', borderRadius:'0 0 0 2px', zIndex: 10 }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, borderBottom:'3px solid #FF6B00', borderRight:'3px solid #FF6B00', borderRadius:'0 0 2px 0', zIndex: 10 }} />
      {children}
    </div>
  );
}

/* ── FF Panel Header Component ── */
function FFPanelHeader({ design, center }) {
  return (
    <div style={{
      height: 36,
      background: 'rgba(0,0,0,0.5)',
      borderBottom: '1px solid rgba(255,107,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      flexShrink: 0,
      zIndex: 2
    }}>
      {/* Left: Garena logo */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,107,0,0.2)', border:'1px solid rgba(255,107,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:'#FF6B00', lineHeight: 1 }}>G</span>
        </div>
        <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.2em' }}>GARENA</span>
      </div>
      {/* Center */}
      <span style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:900, color:'rgba(255,255,255,0.7)', letterSpacing:'0.3em', textTransform:'uppercase' }}>
        {center || 'FF OFFICIAL'}
      </span>
      {/* Right: tournament name */}
      <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
        {tok.name(design)}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   1. SETUP_BLANK (TRANSPARENT SCREEN)
────────────────────────────────────────────────── */
function SetupBlank() {
  return <div style={{ width: '100%', height: '100%', background: 'transparent' }} />;
}

/* ──────────────────────────────────────────────────
   2. FF_SCOREBOARD (TRANSPARENT OVERLAY - RIGHT SIDE)
────────────────────────────────────────────────── */
function FFBoard({ teams = [], players = [], currentMatch, design }) {

  // Build enriched team rows with real live data
  const rows = useMemo(() => {
    return [...teams]
      .map(team => {
        const teamPlayers = players.filter(p => p.team_id === team.id);
        const totalPlayers = teamPlayers.length || 4;
        const alivePlayers = teamPlayers.filter(p => p.is_alive).length;
        const kills = team.total_tournament_kills || 0;
        const pts   = team.total_tournament_points || 0;
        return { ...team, totalPlayers, alivePlayers, kills, pts };
      })
      .sort((a, b) => b.pts - a.pts || b.kills - a.kills)
      .slice(0, 12);
  }, [teams, players]);

  const primary = '#FF6B00';
  const mapName = currentMatch?.map_name || currentMatch?.mapName || 'Bermuda';

  return (
    <div style={{
      position: 'absolute',
      top: 60,
      right: 28,
      width: 310,
      background: 'transparent',
      fontFamily: 'Orbitron, sans-serif',
    }}>

      {/* ── POINTS TABLE HEADER ─────────────────── */}
      <div style={{
        background: primary,
        padding: '7px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          POINTS TABLE
        </span>
        {currentMatch && (
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>
            MATCH {currentMatch.match_number || 1}
          </span>
        )}
      </div>

      {/* ── COLUMN HEADERS ─────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 22,
        background: 'rgba(20,8,4,0.97)',
        borderBottom: '1px solid rgba(255,107,0,0.25)',
        padding: '0 8px',
        fontSize: 8,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.12em',
      }}>
        <div style={{ width: 18, textAlign: 'center' }}>#</div>
        <div style={{ width: 26 }} />{/* logo */}
        <div style={{ flex: 1 }}>TEAM</div>
        <div style={{ width: 48, textAlign: 'center' }}>ALIVE</div>
        <div style={{ width: 34, textAlign: 'center' }}>KILL</div>
        <div style={{ width: 36, textAlign: 'right', paddingRight: 4 }}>TOTAL</div>
      </div>

      {/* ── TEAM ROWS ──────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((team, idx) => {
          const rank = idx + 1;
          const isTop1 = rank === 1;
          const rowBg = isTop1
            ? 'rgba(180,60,0,0.55)'
            : idx % 2 === 0
              ? 'rgba(14,6,2,0.96)'
              : 'rgba(22,10,4,0.96)';

          return (
            <div key={team.id || idx} style={{
              display: 'flex',
              alignItems: 'center',
              height: 30,
              background: rowBg,
              borderBottom: '1px solid rgba(255,107,0,0.1)',
              borderLeft: isTop1 ? `3px solid ${primary}` : '3px solid transparent',
              padding: '0 8px',
              transition: 'background 0.3s',
            }}>

              {/* Rank */}
              <div style={{
                width: 18,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 900,
                color: isTop1 ? primary : 'rgba(255,255,255,0.5)',
              }}>
                {rank}
              </div>

              {/* Logo */}
              <div style={{ width: 26, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                ) : (
                  <div style={{
                    width: 20, height: 20, borderRadius: 3,
                    background: isTop1 ? 'rgba(255,107,0,0.3)' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, fontWeight: 900, color: isTop1 ? primary : 'rgba(255,255,255,0.6)',
                    border: `1px solid ${isTop1 ? 'rgba(255,107,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {(team.name || 'T').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Team Name */}
              <div style={{
                flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontSize: 10, fontWeight: 700,
                color: isTop1 ? '#fff' : 'rgba(255,255,255,0.85)',
                letterSpacing: '0.04em',
              }}>
                {team.name || 'TEAM'}
              </div>

              {/* Alive dots */}
              <div style={{ width: 48, display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center' }}>
                {Array.from({ length: team.totalPlayers || 4 }).map((_, i) => {
                  const alive = i < team.alivePlayers;
                  return (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: alive ? '#00e676' : 'rgba(255,255,255,0.12)',
                      boxShadow: alive ? '0 0 4px #00e676' : 'none',
                      transition: 'all 0.3s',
                    }} />
                  );
                })}
              </div>

              {/* Kills */}
              <div style={{
                width: 34, textAlign: 'center',
                fontSize: 12, fontWeight: 900,
                color: team.kills > 0 ? primary : 'rgba(255,255,255,0.35)',
              }}>
                {team.kills}
              </div>

              {/* Total Points */}
              <div style={{
                width: 36, textAlign: 'right', paddingRight: 4,
                fontSize: 12, fontWeight: 900,
                color: isTop1 ? primary : 'rgba(255,255,255,0.9)',
              }}>
                {team.pts}
              </div>

            </div>
          );
        })}

        {rows.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.15em' }}>
            AWAITING TEAM DATA
          </div>
        )}
      </div>

      {/* ── MAP ROTATION STRIP ─────────────────── */}
      <div style={{
        background: 'rgba(10,4,2,0.97)',
        borderTop: '1px solid rgba(255,107,0,0.3)',
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 38,
        overflow: 'hidden',
      }}>
        {/* MAP ROTATION label */}
        <div style={{
          background: primary,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          minWidth: 72,
        }}>
          <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.3 }}>
            MAP<br/>ROTATION
          </span>
        </div>

        {/* Match slots */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 6px', gap: 4, overflowX: 'hidden' }}>
          {['Bermuda','Purgatory','Kalahari','Bermuda','Purgatory','Kalahari'].map((map, i) => {
            const matchNum = i + 1;
            const isCurrent = currentMatch && currentMatch.match_number === matchNum;
            const isCompleted = currentMatch && currentMatch.match_number > matchNum;
            return (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '3px 5px',
                borderRadius: 3,
                background: isCurrent ? 'rgba(255,107,0,0.2)' : 'transparent',
                border: isCurrent ? `1px solid rgba(255,107,0,0.6)` : '1px solid transparent',
                minWidth: 36,
                position: 'relative',
              }}>
                {/* MT# */}
                <span style={{ fontSize: 7, fontWeight: 700, color: isCurrent ? primary : 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
                  MT{matchNum}
                </span>
                {/* LIVE badge */}
                {isCurrent && (
                  <span style={{
                    position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                    background: '#e53935', color: '#fff', fontSize: 6, fontWeight: 900,
                    padding: '1px 4px', borderRadius: 2, letterSpacing: '0.05em',
                  }}>
                    LIVE
                  </span>
                )}
                {/* Checkmark if completed */}
                {isCompleted && (
                  <span style={{ fontSize: 7, color: '#00e676', position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)' }}>✓</span>
                )}
                {/* Map name */}
                <span style={{
                  fontSize: 7, fontWeight: 700,
                  color: isCurrent ? '#fff' : 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.03em',
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                }}>
                  {map}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ──────────────────────────────────────────────────
   3. SCOREBOARD / FULL STANDINGS (TRANSPARENT OVERLAY - CENTERED)
────────────────────────────────────────────────── */
function FullStandings({ teams = [], design }) {
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const aPts = (a.kills || 0) + (a.placementPoints || 0) + (a.booyahPoints || 0);
      const bPts = (b.kills || 0) + (b.placementPoints || 0) + (b.booyahPoints || 0);
      return bPts - aPts;
    });
  }, [teams]);

  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 840, background: 'transparent' }}>
      <FFPanel style={{ width: 840 }}>
        <FFPanelHeader design={design} center="OVERALL TOURNAMENT STANDINGS" />

        {/* Table Headers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: 32,
          background: 'rgba(0,0,0,0.4)',
          borderBottom: '2px solid rgba(255,107,0,0.3)',
          padding: '0 16px',
          fontSize: 9,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Orbitron',
          letterSpacing: '0.15em'
        }}>
          <div style={{ width: 40, textAlign: 'center' }}>RANK</div>
          <div style={{ width: 32 }} />
          <div style={{ flex: 1, paddingLeft: 12 }}>TEAM NAME</div>
          <div style={{ width: 70, textAlign: 'center' }}>MATCHES</div>
          <div style={{ width: 70, textAlign: 'center' }}>KILLS</div>
          <div style={{ width: 70, textAlign: 'center' }}>BOOYAH</div>
          <div style={{ width: 80, textAlign: 'center' }}>PLACE PTS</div>
          <div style={{ width: 90, textAlign: 'center', color: '#00D4FF' }}>TOTAL PTS</div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 520, overflowY: 'auto' }}>
          {sortedTeams.map((team, idx) => {
            const rank = idx + 1;
            const kills = team.kills || 0;
            const booyahs = team.booyahs || 0;
            const placementPts = team.placementPoints || 0;
            const totalPoints = kills + placementPts + (team.booyahPoints || 0);

            let rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.15)';
            let rankColor = '#ffffff';
            let leftBorder = '3px solid transparent';

            if (rank === 1) {
              rowBg = 'rgba(255,184,0,0.08)';
              rankColor = '#FFB800';
              leftBorder = '3px solid #FFB800';
            } else if (rank === 2) {
              rowBg = 'rgba(148,163,184,0.06)';
              rankColor = '#E2E8F0';
              leftBorder = '3px solid #94A3B8';
            } else if (rank === 3) {
              rowBg = 'rgba(180,83,9,0.06)';
              rankColor = '#F59E0B';
              leftBorder = '3px solid #B45309';
            }

            return (
              <div key={team.id || idx} style={{
                display: 'flex',
                alignItems: 'center',
                height: 38,
                background: rowBg,
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                borderLeft: leftBorder,
                padding: '0 16px',
                transition: 'all 0.2s'
              }}>
                {/* Rank */}
                <div style={{ width: 40, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: rankColor }}>
                  #{rank}
                </div>

                {/* Logo */}
                <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                  {team.logo ? (
                    <img src={team.logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: team.color || '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#000' }}>
                      {(team.name || 'T').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div style={{ flex: 1, paddingLeft: 12, fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                  {team.name || 'UNKNOWN TEAM'}
                </div>

                {/* Matches */}
                <div style={{ width: 70, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  {team.matchesPlayed || 5}
                </div>

                {/* Kills */}
                <div style={{ width: 70, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 11, color: '#FF6B00', fontWeight: 600 }}>
                  {kills}
                </div>

                {/* Booyah */}
                <div style={{ width: 70, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 11, color: '#00D4FF', fontWeight: 600 }}>
                  {booyahs}
                </div>

                {/* Placement Points */}
                <div style={{ width: 80, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  {placementPts}
                </div>

                {/* Total Points */}
                <div style={{ width: 90, textAlign: 'center', fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#ffffff' }}>
                  {totalPoints}
                </div>
              </div>
            );
          })}
        </div>
      </FFPanel>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   4. KILL_FEED (TRANSPARENT OVERLAY - BOTTOM-LEFT)
────────────────────────────────────────────────── */
function KillFeedScreen({ killFeed = [], design }) {
  // Take last 5 kills
  const activeKills = useMemo(() => {
    return [...killFeed].slice(-5).reverse();
  }, [killFeed]);

  return (
    <div style={{ position: 'absolute', left: 30, bottom: 60, width: 340, background: 'transparent' }}>
      <FFPanel style={{ width: 340 }}>
        <FFPanelHeader design={design} center="BATTLE FEED" />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 0' }}>
          <AnimatePresence initial={false}>
            {activeKills.map((kill, idx) => (
              <motion.div
                key={kill.id || idx}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 34,
                  padding: '0 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: 'rgba(0,0,0,0.1)'
                }}
              >
                {/* Orange crosshair arrow */}
                <span style={{ color: '#FF6B00', marginRight: 8, fontSize: 12, fontWeight: 900 }}>▸</span>
                
                {/* Killer */}
                <span style={{
                  fontFamily: 'Orbitron',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#FF6B00',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 110
                }}>
                  {kill.killer || 'KILLER'}
                </span>

                {/* Bullet/Skull icon */}
                <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
                  <Skull size={11} style={{ color: '#00D4FF' }} />
                </span>

                {/* Victim */}
                <span style={{
                  fontFamily: 'Orbitron',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 110
                }}>
                  {kill.victim || 'VICTIM'}
                </span>

                {/* Weapon Badge */}
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,107,0,0.15)',
                  border: '1px solid rgba(255,107,0,0.3)',
                  borderRadius: 3,
                  padding: '1px 5px',
                  fontFamily: 'Orbitron',
                  fontSize: 8,
                  fontWeight: 800,
                  color: '#FF6B00',
                  textTransform: 'uppercase'
                }}>
                  {kill.weapon || 'M1887'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {activeKills.length === 0 && (
            <div style={{
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Orbitron',
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em'
            }}>
              AWAITING COMBAT ENGAGEMENT...
            </div>
          )}
        </div>
      </FFPanel>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   5. PRE_MATCH_MAP (SOLID BG)
────────────────────────────────────────────────── */
function PreMatchMap({ match, teams = [], design }) {
  const mapName = match?.map_name || match?.mapName || 'Bermuda';
  const matchNum = match?.matchNumber || 'MATCH 01';
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const mapImg = MAP_IMAGES[mapName];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GamingBackground mapName={mapName} accent={primary} accent2={secondary} />

      {/* Main Container */}
      <div style={{ position: 'relative', zIndex: 1, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,107,0,0.2)', border: '1px solid #FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#FF6B00' }}>G</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.1em' }}>
                {tok.name(design)}
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.2em' }}>
                {tok.sub(design)}
              </div>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,107,0,0.1)',
            border: '1px solid rgba(255,107,0,0.4)',
            padding: '4px 16px',
            borderRadius: 4,
            fontFamily: 'Orbitron',
            fontSize: 12,
            fontWeight: 900,
            color: '#FF6B00'
          }}>
            {matchNum}
          </div>
        </div>

        {/* Center Split View */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flex: 1, margin: '40px 0' }}>
          {/* Left Text Detail */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#00D4FF', letterSpacing: '0.4em', marginBottom: 10 }}>
              NEXT MAP SELECTION
            </span>
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120 }}
              style={{
                fontFamily: 'Orbitron',
                fontSize: 100,
                fontWeight: 950,
                color: '#ffffff',
                lineHeight: 0.9,
                margin: 0,
                textShadow: '0 0 30px rgba(255,107,0,0.4)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              {mapName}
            </motion.h1>
            <div style={{ display: 'flex', gap: 24, marginTop: 30 }}>
              <div style={{ borderLeft: '3px solid #FF6B00', paddingLeft: 12 }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>TEAMS REMAINING</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color: '#ffffff' }}>{teams.length || 12} TEAMS</div>
              </div>
              <div style={{ borderLeft: '3px solid #00D4FF', paddingLeft: 12 }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>BATTLEGROUND</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>{mapName}</div>
              </div>
            </div>
          </div>

          {/* Right Side: Map Image with Frame */}
          <div style={{ flex: 1, position: 'relative', height: '100%', minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {mapImg && (
              <div style={{
                position: 'absolute', right: 60, top: '50%', 
                transform: 'translateY(-50%)',
                width: 520, height: 520,
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid ' + primary + '40',
                boxShadow: '0 0 60px ' + primary + '30, 0 0 120px ' + primary + '15, inset 0 0 60px rgba(0,0,0,0.5)',
              }}>
                <img src={mapImg} alt={mapName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2) contrast(1.05)' }} />
                {/* Overlay gradient on map image */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, ' + primary + '20, transparent 50%, ' + primary + '10)',
                }} />
                {/* Corner brackets */}
                {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']
                ].map(([pos, border], i) => (
                  <div key={i} className={'absolute ' + pos + ' w-8 h-8 ' + border} style={{ borderColor: primary }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>
            OFFICIAL BROADCAST OVERLAY SYSTEM
          </span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#FF6B00', fontWeight: 900, letterSpacing: '0.15em' }}>
            LIVE DEPLOYMENT PREPARATION
          </span>
        </div>
      </div>
    </div>
  );
}
/* ──────────────────────────────────────────────────
   6. TODAYS_MATCHES (SOLID BG)
────────────────────────────────────────────────── */
function TodaysMatches({ matches = [], design }) {
  // Mock standard schedule matches if none supplied
  const items = matches.length > 0 ? matches : [
    { matchNumber: 'MATCH 01', mapName: 'BERMUDA', time: '16:00', status: 'COMPLETED' },
    { matchNumber: 'MATCH 02', mapName: 'KALAHARE', time: '16:45', status: 'LIVE' },
    { matchNumber: 'MATCH 03', mapName: 'PURGATORY', time: '17:30', status: 'UPCOMING' },
    { matchNumber: 'MATCH 04', mapName: 'ALPINE', time: '18:15', status: 'UPCOMING' },
    { matchNumber: 'MATCH 05', mapName: 'NEXTERRA', time: '19:00', status: 'UPCOMING' }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GamingBackground accent={tok.acc(design)} accent2={tok.acc2(design)} />

      <div style={{ position: 'relative', zIndex: 1, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 950, color: '#ffffff', letterSpacing: '0.1em' }}>
              TODAY'S MATCH SCHEDULE
            </div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.2em' }}>
              GRAND CHAMPIONSHIP STREAM GRID
            </div>
          </div>
          <Calendar style={{ color: '#FF6B00' }} size={28} />
        </div>

        {/* Row of Cards */}
        <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center', margin: '40px 0' }}>
          {items.map((m, idx) => {
            const isLive = m.status === 'LIVE';
            const isCompleted = m.status === 'COMPLETED';

            return (
              <FFPanel key={idx} style={{
                width: 280,
                height: 380,
                background: isLive ? 'rgba(255,107,0,0.06)' : 'rgba(6,9,21,0.9)',
                borderColor: isLive ? '#FF6B00' : 'rgba(255,255,255,0.08)'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 20
                }}>
                  {/* Top: Match Num + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>
                      {m.matchNumber || `MATCH 0${idx + 1}`}
                    </span>
                    <span style={{
                      fontFamily: 'Orbitron',
                      fontSize: 8,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 3,
                      background: isLive ? '#FF6B00' : isCompleted ? 'rgba(255,255,255,0.1)' : 'rgba(0,212,255,0.1)',
                      color: isLive ? '#000000' : isCompleted ? 'rgba(255,255,255,0.6)' : '#00D4FF'
                    }}>
                      {m.status || 'UPCOMING'}
                    </span>
                  </div>

                  {/* Mid: Map Info */}
                  <div style={{ textAlign: 'center', margin: '40px 0' }}>
                    <MapPin size={32} style={{ color: isLive ? '#FF6B00' : '#00D4FF', margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
                      {m.mapName || 'BERMUDA'}
                    </h3>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                      ROUND {idx + 1}
                    </span>
                  </div>

                  {/* Bottom: Match Time */}
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>EST START</span>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: isLive ? '#FF6B00' : '#ffffff' }}>
                      {m.time || '18:00'}
                    </span>
                  </div>
                </div>
              </FFPanel>
            );
          })}
        </div>

        {/* Footer info banner */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: '12px 24px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Orbitron',
          fontSize: 9
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>STREAM EVENT: ALL TIMINGS LISTED IN YOUR LOCAL ZONE</span>
          <span style={{ color: '#00D4FF', fontWeight: 700 }}>GARENA OFFICIAL FEED</span>
        </div>

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   7. TEAMS_TODAY (SOLID BG)
────────────────────────────────────────────────── */
function TeamsToday({ teams = [], design }) {
  // Pad with placeholders if no teams found
  const displayTeams = useMemo(() => {
    if (teams.length > 0) return teams.slice(0, 12);
    return Array.from({ length: 12 }, (_, i) => ({
      name: 'TEAM ALPHA ' + (i + 1),
      color: '#FF6B00',
      logo: null
    }));
  }, [teams]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GamingBackground accent={tok.acc(design)} accent2={tok.acc2(design)} />

      <div style={{ position: 'relative', zIndex: 1, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', justify_content: 'space-between' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: '#00D4FF', letterSpacing: '0.3em' }}>FF CHAMPIONSHIPS</span>
            <div style={{ fontFamily: 'Orbitron', fontSize: 26, fontWeight: 950, color: '#ffffff', letterSpacing: '0.1em', marginTop: 4 }}>
              MEET THE TEAMS CONTENDING TODAY
            </div>
          </div>
          <Users style={{ color: '#FF6B00' }} size={28} />
        </div>

        {/* Teams Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 16,
          margin: '30px 0'
        }}>
          {displayTeams.map((team, idx) => (
            <FFPanel key={idx} style={{ height: 160, padding: 4 }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'rgba(10,14,30,0.8)',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
                textAlign: 'center'
              }}>
                {/* Team Glow Ring */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: `2px solid ${team.color || '#FF6B00'}`,
                  boxShadow: `0 0 15px ${team.color || '#FF6B00'}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  background: 'rgba(0,0,0,0.4)'
                }}>
                  {team.logo ? (
                    <img src={team.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#ffffff' }}>
                      {(team.name || 'T').substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {team.name || 'TEAM'}
                </span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: '#00D4FF', letterSpacing: '0.1em', marginTop: 2 }}>
                  QUALIFIED
                </span>
              </div>
            </FFPanel>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          height: 36,
          background: 'rgba(255,107,0,0.1)',
          border: '1px solid rgba(255,107,0,0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: 'Orbitron',
          fontSize: 10,
          color: '#ffffff'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B00' }} />
          <span>LOBBY READY STATUS: <strong style={{ color: '#00D4FF' }}>ACTIVE CONTENDERS IN LOBBY</strong></span>
        </div>

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   8. CASTERS (SOLID BG)
────────────────────────────────────────────────── */
function CastersScreen({ design }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GamingBackground accent={tok.acc(design)} accent2={tok.acc2(design)} />

      <div style={{ position: 'relative', zIndex: 1, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 950, color: '#ffffff', letterSpacing: '0.1em' }}>
              OFFICIAL BROADCAST DESK
            </div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.2em' }}>
              MATCH COMMENTARY & SHOUTCAST
            </div>
          </div>
          <Video style={{ color: '#FF6B00' }} size={28} />
        </div>

        {/* Caster Split Screen Area */}
        <div style={{ display: 'flex', gap: 30, alignItems: 'center', justifyContent: 'center', flex: 1, margin: '20px 0' }}>
          
          {/* Caster 1 Webcam Frame */}
          <div style={{ flex: 1, height: 380, display: 'flex', flexDirection: 'column' }}>
            <FFPanel style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em' }}>CAM 01 // FEED ACTIVE</span>
                
                {/* Red Record indicator */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF2020', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, color: '#FF2020' }}>REC</span>
                </div>
              </div>
            </FFPanel>
            {/* Caster 1 Handle Label */}
            <div style={{
              background: '#060915',
              borderLeft: '4px solid #FF6B00',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10
            }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#ffffff' }}>OMNIPEAK</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: '#FF6B00', letterSpacing: '0.1em' }}>ANALYST</span>
            </div>
          </div>

          {/* VS Center Marker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 1, height: 80, background: 'linear-gradient(transparent, #FF6B00, transparent)' }} />
            <div style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(6,9,21,0.9)',
              border: '2px solid #FF6B00',
              boxShadow: '0 0 15px rgba(255,107,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color: '#FF6B00' }}>VS</span>
            </div>
            <div style={{ width: 1, height: 80, background: 'linear-gradient(transparent, #00D4FF, transparent)' }} />
          </div>

          {/* Caster 2 Webcam Frame */}
          <div style={{ flex: 1, height: 380, display: 'flex', flexDirection: 'column' }}>
            <FFPanel style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em' }}>CAM 02 // FEED ACTIVE</span>
                
                {/* Red Record indicator */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF2020', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, color: '#FF2020' }}>REC</span>
                </div>
              </div>
            </FFPanel>
            {/* Caster 2 Handle Label */}
            <div style={{
              background: '#060915',
              borderLeft: '4px solid #00D4FF',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10
            }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#ffffff' }}>THE SHRE</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.1em' }}>SHOUTCASTER</span>
            </div>
          </div>

        </div>

        {/* Garena footer line */}
        <div style={{ textAlign: 'center', fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em' }}>
          GARENA FREE FIRE ESPORTS NETWORK — LIVE PRE-MATCH TALK
        </div>

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   9. UPCOMING_MAP (SOLID BG)
────────────────────────────────────────────────── */
function UpcomingMap({ match, design }) {
  const mapName = match?.map_name || match?.mapName || 'Kalahari';
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const mapImg = MAP_IMAGES[mapName];
  
  // Timer State for 5:00 countdown
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GamingBackground mapName={mapName} accent={primary} accent2={secondary} />

      <div style={{ position: 'relative', zIndex: 1, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: '#FF6B00', letterSpacing: '0.3em' }}>UPCOMING DEPLOYMENT</span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>STATUS: LOBBY LOCKDOWN</span>
        </div>

        {/* Center Split Grid */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flex: 1, margin: '40px 0' }}>
          
          {/* Left Text Detail */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: '#00D4FF', letterSpacing: '0.4em', marginBottom: 12 }}>
              UPCOMING ARENA
            </span>
            <h1 style={{
              fontFamily: 'Orbitron',
              fontSize: 84,
              fontWeight: 950,
              color: '#ffffff',
              lineHeight: 0.9,
              margin: 0,
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              {mapName}
            </h1>

            {/* Timer Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
              <div style={{
                background: 'rgba(255,107,0,0.1)',
                border: '1px solid rgba(255,107,0,0.3)',
                padding: '12px 24px',
                borderRadius: 8,
                display: 'inline-flex',
                flexDirection: 'column'
              }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: '#FF6B00', fontWeight: 800, letterSpacing: '0.2em' }}>ESTIMATED START</span>
                <span style={{ fontFamily: 'Orbitron', fontSize: 32, fontWeight: 900, color: '#ffffff', marginTop: 4, letterSpacing: '0.05em' }}>
                  {formatTime(seconds)}
                </span>
              </div>
              <div style={{ maxWidth: 220 }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>WARM-UP COUNTDOWN</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>
                  All players must connect to custom lobby. Live feed streams once counter hits zero.
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Centered map image card with dramatic reveal */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {mapImg && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 60 }}
                style={{
                  width: 480, height: 480,
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '2px solid ' + primary + '60',
                  boxShadow: '0 0 80px ' + primary + '40, 0 40px 80px rgba(0,0,0,0.8)',
                  margin: '40px auto 0',
                }}
              >
                <img src={mapImg} alt={mapName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>
            {tok.name(design)}
          </span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#00D4FF', fontWeight: 900, letterSpacing: '0.15em' }}>
            {tok.sub(design)}
          </span>
        </div>
      </div>
    </div>
  );
}
/* ──────────────────────────────────────────────────
   10. ELIMINATION_ALERT (SOLID BG / FLASH)
────────────────────────────────────────────────── */
function EliminationAlert({ eliminations = [], design }) {
  const latestElim = eliminations[eliminations.length - 1];
  const teamName = latestElim?.teamName || 'TEAM TITANS';
  const reason = latestElim?.reason || 'WIPED OUT';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <GamingBackground accent="#ef4444" accent2={tok.acc2(design)} />
    }}>
      {/* Red Radial Alert Glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle, rgba(255,32,32,0.18) 0%, transparent 70%)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 800 }}>
        
        {/* Animated Skull / Crosshair Icon with shaking motion effect */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -3, 3, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ marginBottom: 30 }}
        >
          <XCircle size={90} style={{ color: '#FF2020', filter: 'drop-shadow(0 0 20px rgba(255,32,32,0.6))' }} />
        </motion.div>

        {/* Main Alert Sub-label */}
        <span style={{
          fontFamily: 'Orbitron',
          fontSize: 14,
          fontWeight: 900,
          color: '#FF2020',
          letterSpacing: '0.6em',
          textTransform: 'uppercase',
          marginBottom: 12
        }}>
          SQUAD ELIMINATED
        </span>

        {/* Team Name */}
        <h1 style={{
          fontFamily: 'Orbitron',
          fontSize: 72,
          fontWeight: 950,
          color: '#ffffff',
          lineHeight: 1,
          margin: '0 0 16px 0',
          letterSpacing: '0.02em',
          textShadow: '0 0 30px rgba(255,32,32,0.4)',
          textTransform: 'uppercase'
        }}>
          {teamName}
        </h1>

        {/* Team Status Reason */}
        <div style={{
          background: 'rgba(255,32,32,0.12)',
          border: '1px solid rgba(255,32,32,0.3)',
          borderRadius: 4,
          padding: '8px 24px',
          fontFamily: 'Orbitron',
          fontSize: 12,
          fontWeight: 900,
          color: '#FF2020',
          letterSpacing: '0.2em'
        }}>
          {reason} // SQUAD DISMISSED
        </div>

        <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 40 }}>
          RANK ASSIGNED AT TIME OF TERMINATION
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   11. MVP (SOLID BG)
────────────────────────────────────────────────── */
function MVPScreen({ players = [], teams = [], design, overlayState }) {
  // Use overlayState data set by Director; fallback to first player by kills
  const mvpPlayerName = overlayState?.mvp_player_name || (players.length ? players.reduce((a,b) => (a.total_tournament_kills||0) > (b.total_tournament_kills||0) ? a : b).name : 'TBD');
  const teamName = overlayState?.mvp_team_name || '—';
  const kills = overlayState?.mvp_kills || 0;
  const damage = 0;
  const assists = 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GamingBackground accent={tok.acc(design)} accent2={tok.acc2(design)} />

      <div style={{ position: 'relative', zIndex: 1, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 950, color: '#ffffff', letterSpacing: '0.1em' }}>
              MATCH MVP PERFORMA
            </div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.2em' }}>
              MOST VALUABLE PLAYER PROFILE
            </div>
          </div>
          <Award style={{ color: '#FF6B00' }} size={28} />
        </div>

        {/* Center Split Grid */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flex: 1, margin: '30px 0' }}>
          
          {/* Left Player Avatar Silhouette Box */}
          <div style={{ flex: 1, height: '100%', minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FFPanel style={{ width: '100%', height: '100%', minHeight: 380, padding: 6, background: 'rgba(0,0,0,0.5)' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: 'rgba(10,14,30,0.9)',
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(#FF6B00 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                  opacity: 0.1
                }} />
                {/* Silhouette placeholder graphic */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: 'rgba(255,107,0,0.1)',
                    border: '2px solid #FF6B00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={48} style={{ color: '#FF6B00' }} />
                  </div>
                  <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color: '#ffffff', letterSpacing: '0.2em' }}>PHOTO SECURE</span>
                </div>
              </div>
            </FFPanel>
          </div>

          {/* Right Stats Frame */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 950, color: '#00D4FF', letterSpacing: '0.3em', marginBottom: 6 }}>
              MATCH CHAMPION MVP
            </span>
            <h1 style={{
              fontFamily: 'Orbitron',
              fontSize: 64,
              fontWeight: 950,
              color: '#ffffff',
              lineHeight: 0.9,
              margin: '0 0 4px 0',
              textShadow: '0 0 20px rgba(255,107,0,0.3)',
              textTransform: 'uppercase'
            }}>
              {mvpPlayerName}
            </h1>
            <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 700, color: '#FF6B00', letterSpacing: '0.1em', marginBottom: 30 }}>
              {teamName}
            </span>

            {/* Stat Cards Row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                flex: 1,
                background: 'rgba(255,107,0,0.1)',
                border: '1px solid rgba(255,107,0,0.3)',
                padding: 16,
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 9, color: '#FF6B00', letterSpacing: '0.1em', fontWeight: 900 }}>TOTAL KILLS</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 32, fontWeight: 950, color: '#ffffff', marginTop: 4 }}>{kills}</div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.3)',
                padding: 16,
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 9, color: '#00D4FF', letterSpacing: '0.1em', fontWeight: 900 }}>DAMAGE DEAL</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 32, fontWeight: 950, color: '#ffffff', marginTop: 4 }}>{damage}</div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 16,
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', fontWeight: 900 }}>ASSISTS</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 32, fontWeight: 950, color: '#ffffff', marginTop: 4 }}>{assists}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>LOBBY DATA INTEGRATION STATUS: SECURE</span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 8, color: '#00D4FF', fontWeight: 700 }}>GARENA OFFICIAL DESIGN PACK</span>
        </div>

      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   12. CHAMPIONS / BOOYAH (SOLID BG)
────────────────────────────────────────────────── */
function ChampionsScreen({ teams = [], design, overlayState }) {
  const winnerTeam = overlayState?.champion_team_name || teams[0]?.name || 'GLORY ESPORTS';
  const totalPoints = overlayState?.champion_total_points || teams[0]?.total_tournament_points || 0;
  
  // Confetti array
  const confettiParticles = Array.from({ length: 30 });

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <GamingBackground accent={tok.acc(design)} accent2={tok.acc2(design)} />
    }}>
      {/* Fallback CSS Confetti Style Tags */}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(1100px) rotate(360deg); opacity: 0; }
        }
        @keyframes crownPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255,184,0,0.6)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 35px rgba(255,184,0,0.9)); }
        }
      `}</style>

      {/* Gold Ambient Glow Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle, rgba(255,184,0,0.12) 0%, transparent 75%)',
        zIndex: 0
      }} />

      {/* Confetti Particles */}
      {confettiParticles.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const duration = 4 + Math.random() * 4;
        const size = 6 + Math.random() * 10;
        const color = ['#FFB800', '#FF6B00', '#00D4FF', '#ffffff'][Math.floor(Math.random() * 4)];
        return (
          <div key={i} style={{
            position: 'absolute',
            top: -20,
            left: `${left}%`,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            opacity: 0.8,
            zIndex: 1,
            animation: `confettiFall ${duration}s linear infinite`,
            animationDelay: `${delay}s`
          }} />
        );
      })}

      {/* Main Champions Container */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 900 }}>
        
        {/* Crown Icon */}
        <div style={{
          animation: 'crownPulse 2.5s infinite ease-in-out',
          marginBottom: 16
        }}>
          <Crown size={72} style={{ color: '#FFB800' }} />
        </div>

        {/* Big Booyah Text */}
        <h1 style={{
          fontFamily: 'Orbitron',
          fontSize: 104,
          fontWeight: 950,
          background: 'linear-gradient(135deg, #FFB800 0%, #FF6B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 0.9,
          margin: '0 0 16px 0',
          letterSpacing: '0.04em',
          filter: 'drop-shadow(0 0 30px rgba(255,107,0,0.35))'
        }}>
          BOOYAH!
        </h1>

        {/* Sub label */}
        <span style={{
          fontFamily: 'Orbitron',
          fontSize: 12,
          fontWeight: 900,
          color: '#00D4FF',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          marginBottom: 24
        }}>
          TOURNAMENT CHAMPION DECLARED
        </span>

        {/* Winner Card Panel */}
        <FFPanel style={{ width: 500, padding: 24, background: 'rgba(6,9,21,0.96)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>MATCH WINNER</span>
            
            <span style={{
              fontFamily: 'Orbitron',
              fontSize: 32,
              fontWeight: 950,
              color: '#ffffff',
              marginTop: 10,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {winnerTeam}
            </span>

            {/* Micro Stats inside Card */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              marginTop: 20,
              paddingTop: 16,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-around',
              fontFamily: 'Orbitron'
            }}>
              <div>
                <div style={{ fontSize: 9, color: '#FF6B00', letterSpacing: '0.1em' }}>TOTAL KILLS</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>24 KILLS</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div>
                <div style={{ fontSize: 9, color: '#00D4FF', letterSpacing: '0.1em' }}>MATCH POINT</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>+32 PTS</div>
              </div>
            </div>
          </div>
        </FFPanel>

        <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginTop: 40 }}>
          CONGRATULATIONS TO ALL TEAMS AND CONTENDERS
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN OVERLAY APP CANVAS COMPONENT
══════════════════════════════════════════════════ */
export default function Overlay() {
  const { overlayState, design, teams, players, currentMatch, killFeed, eliminations } = useOverlayData();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth / 1920);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const screen = overlayState?.current_screen || 'setup_blank';

  // Transparent screens list
  const isTransparent = ['setup_blank', 'ff_scoreboard', 'scoreboard', 'kill_feed'].includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'setup_blank':
        return <SetupBlank />;
      case 'pre_match_map':
        return <PreMatchMap match={currentMatch} teams={teams} design={design} />;
      case 'ff_scoreboard':
        return <FFBoard teams={teams} players={players} currentMatch={currentMatch} design={design} />;
      case 'scoreboard':
        return <FullStandings teams={teams} design={design} />;
      case 'kill_feed':
        return <KillFeedScreen killFeed={killFeed} design={design} />;
      case 'todays_matches':
        return <TodaysMatches matches={currentMatch ? [currentMatch] : []} design={design} />;
      case 'teams_today':
        return <TeamsToday teams={teams} design={design} />;
      case 'casters':
        return <CastersScreen design={design} />;
      case 'upcoming_map':
        return <UpcomingMap match={currentMatch} design={design} />;
      case 'elimination_alert':
        return <EliminationAlert eliminations={eliminations} design={design} />;
      case 'mvp':
        return <MVPScreen players={players} teams={teams} design={design} overlayState={overlayState} />;
      case 'champions':
        return <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />;
      default:
        return <SetupBlank />;
    }
  };

  return (
    <div 
      className="relative overflow-hidden w-[1920px] h-[1080px] origin-top-left"
      style={{
        transform: `scale(${scale})`,
        background: isTransparent ? 'transparent' : 'transparent',
        width: 1920,
        height: 1080
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full relative"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
