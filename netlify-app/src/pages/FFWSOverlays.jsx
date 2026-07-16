/**
 * FFWSOverlays.jsx — FFWS-style broadcast overlay components
 * New screens: GameIntroBanner, MatchScheduleGrid, PointRushStandings
 * Upgrades: FFBoardV2, MatchInfoChip
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';
import { safeArray } from '@/components/ErrorBoundary';
import { MAPS, getMapImages } from '@/lib/maps';


/* ─── Eliminated Team Banner — 4-player panel ─── */
export function EliminatedTeamBanner({ team, design }) {
  // team = { name, logo_url, players: [{name, is_alive}, ...] }
  const players = (team?.players || []).slice(0, 4);
  // pad to 4 slots
  while (players.length < 4) players.push({ name: null });

  return (
    <AnimatePresence>
      {team && (
        <motion.div
          key={team.name}
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0,    opacity: 1 }}
          exit={{   x: -200, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            bottom: 100,
            left: 20,
            zIndex: 40,
            display: 'flex',
            pointerEvents: 'none',
          }}
        >
          {/* ── LEFT panel: angular clip-path diagonal with 'ELIMINATED' on orange background ── */}
          <div style={{
            width: 180,
            height: 160,
            position: 'relative',
            overflow: 'hidden',
            marginRight: -1,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: '#ff4e00',
              clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              paddingLeft: 20, paddingRight: 40,
            }}>
              <div style={{
                fontFamily: 'Teko, sans-serif', fontSize: 28, fontWeight: 900,
                color: '#0c0c0e', lineHeight: 0.95, letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                ELIMINATED
              </div>
              <div style={{
                fontFamily: 'Teko, sans-serif', fontSize: 16, fontWeight: 700,
                color: 'rgba(12,12,14,0.65)', marginTop: 2,
                letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                TEAM
              </div>
            </div>
          </div>

          {/* ── RIGHT panel: dark gunmetal panel with team name + 4 player cards in 2x2 grid ── */}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 380,
              height: 160,
              background: '#141418',
              borderLeft: '3px solid #ff4e00',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 18px',
              transformOrigin: 'left',
            }}
          >
            {/* Team name header row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 8,
            }}>
              {team.logo_url && (
                <img src={team.logo_url} alt=""
                  style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 0, flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              {!team.logo_url && (
                <div style={{
                  width: 28, height: 28, borderRadius: 0, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'Teko', fontSize: 14, fontWeight: 900, color: '#ff4e00' }}>
                    {(team.name || 'T').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700,
                color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '2px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {team.name}
              </span>
              {/* red elim dot */}
              <div style={{
                marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                background: '#ff4e00', boxShadow: '0 0 8px rgba(255,78,0,0.8)', flexShrink: 0,
              }} />
            </div>

            {/* 4 player panels (2x2 grid) */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px',
              flex: 1,
            }}>
              {players.map((p, i) => {
                const hasName = !!p.name;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 + i * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px',
                      background: hasName ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: hasName ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    }}
                  >
                    {/* skull / cross icon */}
                    {hasName && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M12 2C7.6 2 4 5.6 4 10v4l-2 2v2h4v2h4v-2h4v-2h4v-2l-2-2v-4c0-4.4-3.6-8-8-8z" fill="#ff4e00" opacity="0.9"/>
                        <circle cx="9" cy="10" r="1.5" fill="#000"/>
                        <circle cx="15" cy="10" r="1.5" fill="#000"/>
                      </svg>
                    )}
                    <span style={{
                      fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 600,
                      color: hasName ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)',
                      textTransform: 'uppercase', letterSpacing: '1px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: hasName ? 'line-through' : 'none',
                    }}>
                      {hasName ? p.name : '—'}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* bottom accent bar */}
            <div style={{
              height: 2, marginTop: 6,
              background: 'linear-gradient(90deg, #ff4e00, #ffaa00, transparent)',
            }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FFBoardV2({ teams = [], players = [], currentMatch, design }) {

  const prevElimRef   = useRef({});
  const shownElimRef  = useRef(new Set());  // team IDs that already showed banner this match
  const [elimBanner, setElimBanner] = useState(null);
  const elimTimerRef  = useRef(null);

  // Design tokens (kept for safety / custom color matching where needed, but we follow spec exactly)
  const accent  = '#ff4e00';
  const txtCol  = '#FFFFFF';

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
        return { ...team, slots, aliveCount, totalPlayers: tp.length,
          // carry the player objects for the elim banner
          _players: tp.map(p => ({ name: p.name, is_alive: p.is_alive })),
        };
      })
      .sort((a, b) =>
        (b.total_tournament_points || 0) - (a.total_tournament_points || 0) ||
        (b.total_tournament_kills || 0) - (a.total_tournament_kills || 0)
      )
      .slice(0, 12);
  }, [teams, players]);

  // Reset elim tracking when match changes
  const matchId = currentMatch?.id;
  useEffect(() => {
    shownElimRef.current = new Set();
    prevElimRef.current = {};
    setElimBanner(null);
  }, [matchId]);

  // Detect newly eliminated teams → show banner ONCE per team per match
  useEffect(() => {
    const queue = [];
    rows.forEach(team => {
      const wasElim = prevElimRef.current[team.id];
      const isElim  = team.aliveCount === 0 && team.totalPlayers > 0;
      if (!wasElim && isElim && !shownElimRef.current.has(team.id)) {
        shownElimRef.current.add(team.id);
        queue.push({
          name: team.name,
          logo_url: team.logo_url,
          players: team._players,
        });
      }
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

  const green     = '#7BC043';

  // ── FIXED DIMENSIONS FROM SPEC ──
  const HEADER_H = 34; // height of SCOREBOARD header banner
  const ROW_H    = 38; // 38px row height
  const FOOTER_H = 28;
  const PANEL_W  = 280; // wider 280px

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
      {/* Eliminated team banner */}
      <EliminatedTeamBanner team={elimBanner} design={design} />

      <motion.div
        initial={{ x: PANEL_W + 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: PANEL_W + 20, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          right: 20,
          top: 60,
          width: PANEL_W,
          height: HEADER_H + ROW_H * 12 + FOOTER_H,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent',
        }}
      >
        {/* ══ ACCENT HEADER: angular clip-path banner with SCOREBOARD ══ */}
        <div style={{
          width: '100%',
          height: HEADER_H,
          background: '#ff4e00',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          padding: '0 12px',
          boxSizing: 'border-box',
          clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)',
        }}>
          <div style={{
            flex: 1,
            fontFamily: 'Teko, sans-serif',
            fontSize: 22,
            fontWeight: 800,
            color: '#0c0c0e',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            paddingLeft: 10,
          }}>
            SCOREBOARD
          </div>
          <div style={{ width: 44, textAlign: 'center', fontFamily: 'Teko, sans-serif', fontSize: 13, fontWeight: 700, color: '#0c0c0e', letterSpacing: '1px' }}>ALIVE</div>
          <div style={{ width: 32, textAlign: 'center', fontFamily: 'Teko, sans-serif', fontSize: 13, fontWeight: 700, color: '#0c0c0e', letterSpacing: '1px' }}>PTS</div>
          <div style={{ width: 32, textAlign: 'center', fontFamily: 'Teko, sans-serif', fontSize: 13, fontWeight: 700, color: '#0c0c0e', letterSpacing: '1px' }}>ELM</div>
        </div>

        {/* ══ ROWS ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {displayRows.map((team, idx) => {
            const rank      = idx + 1;
            const isGhost   = !!team._isGhost;
            const isElim    = !isGhost && team.aliveCount === 0 && team.totalPlayers > 0;

            // Rank 1-3 get gold/silver/bronze left accent border.
            // Champion rush eligible teams get gold border with subtle glow.
            const rankColor = rank === 1 ? '#ffaa00' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'transparent';
            const isChampionRush = team.champion_rush_eligible === true;
            
            let borderLeftStyle = '3px solid transparent';
            let boxShadowStyle = 'none';
            if (isChampionRush && !isElim && !isGhost) {
              borderLeftStyle = '4px solid #ffaa00';
              boxShadowStyle = '0 0 10px rgba(255,170,0,0.25)';
            } else if (rank <= 3 && !isGhost) {
              borderLeftStyle = `3.5px solid ${rankColor}`;
            }

            return (
              <motion.div
                key={team.id || idx}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: isElim ? 0.28 : isGhost ? 0.15 : 1 }}
                transition={{ duration: 0.35, delay: idx * 0.025, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: '100%',
                  height: ROW_H,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0c0c0e',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: borderLeftStyle,
                  boxShadow: boxShadowStyle,
                  padding: '0 12px 0 8px',
                  boxSizing: 'border-box',
                  clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 20, flexShrink: 0, textAlign: 'center',
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 700,
                  color: isGhost ? 'rgba(255,255,255,0.15)' : isChampionRush ? '#ffaa00' : rank <= 3 ? rankColor : '#888888',
                  textShadow: isChampionRush && !isGhost ? '0 0 6px rgba(255, 170, 0, 0.6)' : 'none',
                }}>{rank}</div>

                {/* Logo */}
                <div style={{ width: 26, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {!isGhost && team.logo_url ? (
                    <img src={team.logo_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 0 }}
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{
                      width: 20, height: 20, borderRadius: 0,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!isGhost && (
                        <span style={{ fontFamily: 'Teko', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>
                          {(team.name || 'T').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Team name */}
                <div style={{
                  flex: 1, paddingLeft: 6,
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700,
                  color: isGhost ? 'rgba(255,255,255,0.15)' : isElim ? 'rgba(255,255,255,0.3)' : txtCol,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  position: 'relative',
                }}>
                  {isGhost ? 'GHOST TEAM' : (team.name || 'TEAM')}
                  {isElim && !isGhost && (
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }}
                      style={{ position: 'absolute', left: 6, right: 0, top: '50%', height: 1.5, background: '#ff4e00', transformOrigin: 'left', opacity: 0.8 }} />
                  )}
                </div>

                {/* Alive bars */}
                <div style={{ width: 44, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexShrink: 0 }}>
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
                          width: 8, height: 18, borderRadius: 0, flexShrink: 0,
                          boxShadow: !isGhost && slot.alive ? '0 0 4px ' + green : 'none',
                        }}
                      />
                    );
                  })}
                </div>

                {/* PTS */}
                <div style={{
                  width: 32, textAlign: 'center', flexShrink: 0,
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 700,
                  color: isGhost ? 'rgba(255,255,255,0.1)' : isElim ? 'rgba(255,255,255,0.3)' : txtCol,
                }}>
                  {isGhost ? '0' : (team.total_tournament_points ?? 0)}
                </div>

                {/* ELIMS */}
                <div style={{
                  width: 32, textAlign: 'center', flexShrink: 0,
                  fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 700,
                  color: isGhost ? 'rgba(255,255,255,0.1)' : isElim ? 'rgba(255,255,255,0.3)' : '#ff4e00',
                }}>
                  {isGhost ? '0' : (team.total_tournament_kills ?? 0)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ══ FOOTER ══ */}
        <div style={{
          width: '100%', height: FOOTER_H, background: '#141418', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', boxSizing: 'border-box',
          borderTop: '2px solid #ff4e00',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {design?.logoUrl
              ? <img src={design.logoUrl} alt="" style={{ height: 16, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              : <span style={{ fontFamily: 'Teko, sans-serif', fontSize: 16, fontWeight: 900, color: '#ff4e00', letterSpacing: '1px' }}>{brandLabel}</span>
            }
            <span style={{ fontFamily: 'Teko, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>{stageLabel}</span>
          </div>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
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

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      pointerEvents: 'none',
      position: 'relative'
    }}>
      {/* Outer Centered Board Container */}
      <div style={{
        width: 740,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'auto'
      }}>
        
        {/* Main Content: Dual-Column side-by-side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20
        }}>
          {/* LEFT COLUMN: STANDINGS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Left Header */}
            <div style={{
              background: '#ff4e00',
              padding: '6px 16px',
              clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 0% 100%)',
              height: 34,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}>
              <span style={{
                fontFamily: 'Teko, sans-serif',
                fontSize: 22,
                fontWeight: 600,
                color: '#0c0c0e',
                letterSpacing: '2px',
                lineHeight: 1,
                textTransform: 'uppercase'
              }}>
                STANDINGS
              </span>
            </div>

            {/* Left Column Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {col1.map((team, idx) => {
                const rank = idx + 1;
                const isRushEligible = team.champion_rush_eligible === true;
                
                // Rank Badges Styled Gradients
                let rankBadgeBg = 'rgba(255, 255, 255, 0.05)';
                let rankBadgeColor = '#ffffff';
                let rankBadgeBorder = '1px solid rgba(255, 255, 255, 0.1)';
                
                if (rank === 1) {
                  rankBadgeBg = 'linear-gradient(135deg, #ffaa00, #ff8800)';
                  rankBadgeColor = '#0c0c0e';
                  rankBadgeBorder = 'none';
                } else if (rank === 2) {
                  rankBadgeBg = 'linear-gradient(135deg, #C0C0C0, #909090)';
                  rankBadgeColor = '#0c0c0e';
                  rankBadgeBorder = 'none';
                } else if (rank === 3) {
                  rankBadgeBg = 'linear-gradient(135deg, #CD7F32, #8B4513)';
                  rankBadgeColor = '#ffffff';
                  rankBadgeBorder = 'none';
                }

                return (
                  <motion.div
                    key={team.id || idx}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 18,
                      delay: idx * 0.05
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: 46,
                      background: '#141418',
                      clipPath: 'polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)',
                      border: isRushEligible ? '1.5px solid #ffaa00' : 'none',
                      boxShadow: isRushEligible ? 'inset 0 0 8px rgba(255, 170, 0, 0.25)' : 'none',
                      padding: '0 12px 0 16px',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{
                      width: 24,
                      height: 24,
                      background: rankBadgeBg,
                      border: rankBadgeBorder,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Teko, sans-serif',
                      fontSize: 16,
                      fontWeight: 700,
                      color: rankBadgeColor,
                      marginRight: 10,
                      flexShrink: 0
                    }}>
                      {rank}
                    </div>

                    {/* Team Logo */}
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" style={{
                        width: 24,
                        height: 24,
                        objectFit: 'contain',
                        marginRight: 10,
                        flexShrink: 0
                      }} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{
                        width: 24,
                        height: 24,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        flexShrink: 0
                      }}>
                        <span style={{ fontFamily: 'Rajdhani', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                          {(team.name || 'T').charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Team Name */}
                    <div style={{
                      flex: 1,
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {team.name || 'TEAM'}
                    </div>

                    {/* Kills */}
                    <div style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.6)',
                      marginRight: 16,
                      textAlign: 'right',
                      minWidth: 32
                    }}>
                      {team.total_tournament_kills || 0} K
                    </div>

                    {/* Total Points */}
                    <div style={{
                      fontFamily: 'Teko, sans-serif',
                      fontSize: 26,
                      fontWeight: 600,
                      color: '#ff4e00',
                      textAlign: 'right',
                      minWidth: 36
                    }}>
                      {team.total_tournament_points || 0}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: RANKS 7-12 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Right Header */}
            <div style={{
              background: '#0c0c0e',
              padding: '6px 16px',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 12% 100%)',
              height: 34,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              borderLeft: '2px solid #ff4e00'
            }}>
              <span style={{
                fontFamily: 'Teko, sans-serif',
                fontSize: 22,
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '2px',
                lineHeight: 1,
                textTransform: 'uppercase',
                marginLeft: '12%'
              }}>
                LEADERBOARD
              </span>
            </div>

            {/* Right Column Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {col2.map((team, idx) => {
                const rank = idx + 7;
                const isRushEligible = team.champion_rush_eligible === true;
                
                return (
                  <motion.div
                    key={team.id || idx}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 18,
                      delay: (idx + 6) * 0.05
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: 46,
                      background: '#141418',
                      clipPath: 'polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)',
                      border: isRushEligible ? '1.5px solid #ffaa00' : 'none',
                      boxShadow: isRushEligible ? 'inset 0 0 8px rgba(255, 170, 0, 0.25)' : 'none',
                      padding: '0 12px 0 16px',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{
                      width: 24,
                      height: 24,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Teko, sans-serif',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#ffffff',
                      marginRight: 10,
                      flexShrink: 0
                    }}>
                      {rank}
                    </div>

                    {/* Team Logo */}
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" style={{
                        width: 24,
                        height: 24,
                        objectFit: 'contain',
                        marginRight: 10,
                        flexShrink: 0
                      }} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{
                        width: 24,
                        height: 24,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        flexShrink: 0
                      }}>
                        <span style={{ fontFamily: 'Rajdhani', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                          {(team.name || 'T').charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Team Name */}
                    <div style={{
                      flex: 1,
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {team.name || 'TEAM'}
                    </div>

                    {/* Kills */}
                    <div style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.6)',
                      marginRight: 16,
                      textAlign: 'right',
                      minWidth: 32
                    }}>
                      {team.total_tournament_kills || 0} K
                    </div>

                    {/* Total Points */}
                    <div style={{
                      fontFamily: 'Teko, sans-serif',
                      fontSize: 26,
                      fontWeight: 600,
                      color: '#ff4e00',
                      textAlign: 'right',
                      minWidth: 36
                    }}>
                      {team.total_tournament_points || 0}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM BRANDING BAR with angular edges */}
        <div style={{
          background: '#0c0c0e',
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)',
          borderTop: '2px solid #ff4e00',
          boxSizing: 'border-box'
        }}>
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#ffaa00',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            FREE FIRE WORLD SERIES
          </span>
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            POINT RUSH STANDINGS
          </span>
        </div>

      </div>
    </div>
  );
}

export function RoadmapOverlay({ tournament, matches = [], currentMatch, design }) {
  const tLogo = design?.logoUrl || null;
  const tName = design?.tournamentName || 'BOOYAH TOURNAMENT';
  const sponsorLogo = design?.sponsorLogoUrl || null;
  const sponsorLabel = design?.sponsorLabel || 'OFFICIAL SPONSOR';
  const accent = '#00C8FF';
  const accent2 = '#0055FF';
  const gold = '#FFC700';

  // Parse format_config to build the roadmap
  let formatConfig = null;
  try {
    if (tournament?.format_config) {
      formatConfig = typeof tournament.format_config === 'string'
        ? JSON.parse(tournament.format_config)
        : tournament.format_config;
    }
  } catch (_) {}

  // If no format_config, build from matches
  const stages = useMemo(() => {
    if (formatConfig?.stages) {
      return formatConfig.stages.map((stage, si) => {
        const stageMatches = [];
        for (const day of (stage.days || [])) {
          for (const m of (day.matches || [])) {
            stageMatches.push({
              map: m.map,
              day: day.label,
              dayNumber: day.day
            });
          }
        }
        // Find which of these matches are completed
        const matchNumOffset = formatConfig.stages.slice(0, si).reduce((acc, s) => {
          return acc + (s.days || []).reduce((a, d) => a + (d.matches || []).length, 0);
        }, 0);
        return {
          name: stage.name || 'Stage ' + (si + 1),
          order: si,
          matches: stageMatches.map((m, mi) => {
            const globalNum = matchNumOffset + mi + 1;
            const dbMatch = matches.find(dm => dm.match_number === globalNum);
            return {
              ...m,
              matchNumber: globalNum,
              state: dbMatch?.state || 'scheduled',
              isCurrent: currentMatch?.match_number === globalNum
            };
          })
        };
      });
    }
    // Fallback: build from matches array
    const byStage = {};
    for (const m of matches) {
      const sn = m.stage_name || 'Tournament';
      if (!byStage[sn]) byStage[sn] = { name: sn, order: m.stage_order || 0, matches: [] };
      byStage[sn].matches.push({
        map: m.map_name || 'Bermuda',
        day: m.day_label || '',
        matchNumber: m.match_number,
        state: m.state || 'scheduled',
        isCurrent: currentMatch?.match_number === m.match_number
      });
    }
    return Object.values(byStage).sort((a, b) => a.order - b.order);
  }, [formatConfig, matches, currentMatch]);

  const totalMatches = stages.reduce((a, s) => a + s.matches.length, 0);
  const completedMatches = stages.reduce((a, s) => a + s.matches.filter(m => m.state === 'post_match' || m.state === 'completed').length, 0);
  const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 30%, #0a1130 0%, #04060E 70%, #02030a 100%)',
      boxSizing: 'border-box', color: '#fff'
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 1200, height: 400, background: `radial-gradient(ellipse, ${accent}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '20%', width: 600, height: 300, background: `radial-gradient(ellipse, ${accent2}10 0%, transparent 70%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* Grid texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0px, transparent 1px, transparent 80px)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '60px 80px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${accent}30`, paddingBottom: 20, marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {tLogo ? (
              <img src={tLogo} alt="" style={{ height: 64, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ height: 64, width: 64, background: `linear-gradient(135deg, ${accent}, ${accent2})`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${accent}40` }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: '#fff' }}>FF</span>
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 800, color: accent, letterSpacing: '0.4em', textTransform: 'uppercase' }}>TOURNAMENT ROADMAP</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', lineHeight: 1.1, marginTop: 4 }}>{tName.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {sponsorLogo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>{sponsorLabel.toUpperCase()}</span>
                <img src={sponsorLogo} alt="" style={{ height: 40, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 200, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, delay: 0.5 }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${accent2})`, borderRadius: 4, boxShadow: `0 0 10px ${accent}80` }} />
              </div>
              <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 800, color: accent }}>{completedMatches}/{totalMatches}</span>
            </div>
          </div>
        </motion.div>

        {/* Stage columns */}
        <div style={{ flex: 1, display: 'flex', gap: 24, alignItems: 'stretch' }}>
          {stages.map((stage, si) => (
            <motion.div key={si}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 + si * 0.15 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Stage header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                paddingBottom: 12, borderBottom: `2px solid ${si === 0 ? accent : si === stages.length - 1 ? gold : accent2}40`
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${si === 0 ? accent : si === stages.length - 1 ? gold : accent2}, ${si === 0 ? accent2 : si === stages.length - 1 ? '#ff8800' : accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: '#fff',
                  boxShadow: `0 0 15px ${si === 0 ? accent : si === stages.length - 1 ? gold : accent2}60`
                }}>{si + 1}</div>
                <div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stage.name}</div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>{stage.matches.length} MATCHES</div>
                </div>
              </div>

              {/* Day groups */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const dayGroups = {};
                  for (const m of stage.matches) {
                    const dk = m.day || 'Day 1';
                    if (!dayGroups[dk]) dayGroups[dk] = [];
                    dayGroups[dk].push(m);
                  }
                  return Object.entries(dayGroups).map(([dayName, dayMatches], di) => (
                    <div key={di} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 12 }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 10 }}>{dayName}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dayMatches.map((m, mi) => {
                          const isDone = m.state === 'post_match' || m.state === 'completed';
                          const isCurrent = m.isCurrent;
                          const isScheduled = m.state === 'scheduled';
                          return (
                            <div key={mi} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                              background: isCurrent ? `${accent}15` : isDone ? 'rgba(0,255,100,0.05)' : 'rgba(255,255,255,0.01)',
                              border: isCurrent ? `1px solid ${accent}80` : isDone ? '1px solid rgba(0,255,100,0.2)' : '1px solid rgba(255,255,255,0.06)',
                              boxShadow: isCurrent ? `0 0 15px ${accent}30` : 'none',
                            }}>
                              {/* Status dot */}
                              <div style={{
                                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                background: isDone ? '#00ff64' : isCurrent ? accent : 'rgba(255,255,255,0.15)',
                                boxShadow: isDone ? '0 0 8px #00ff6480' : isCurrent ? `0 0 8px ${accent}80` : 'none',
                              }} />
                              {/* Match number */}
                              <span style={{
                                fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900,
                                color: isDone ? 'rgba(255,255,255,0.4)' : isCurrent ? accent : '#fff',
                                width: 32, flexShrink: 0
                              }}>M{m.matchNumber}</span>
                              {/* Map name */}
                              <span style={{
                                fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700,
                                color: isDone ? 'rgba(255,255,255,0.3)' : isCurrent ? '#fff' : 'rgba(255,255,255,0.7)',
                                flex: 1, letterSpacing: '0.05em'
                              }}>{m.map}</span>
                              {/* State badge */}
                              {isCurrent && <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, color: accent, letterSpacing: '0.15em', background: `${accent}15`, padding: '2px 8px', borderRadius: 4 }}>LIVE</span>}
                              {isDone && <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, color: '#00ff64', letterSpacing: '0.15em' }}>DONE</span>}
                              {isScheduled && <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' }}>—</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>
            {stages.length} STAGES · {totalMatches} MATCHES · {completedMatches} COMPLETED
          </span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.2em' }}>
            BOOYAH DIRECTOR · TOURNAMENT ROADMAP
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT DETAILS OVERLAY — Shows tournament info, current/next match, format
// A full-screen "info card" overlay for breaks between matches
// ─────────────────────────────────────────────────────────────────────────────
export function EventDetailsOverlay({ tournament, currentMatch, nextScheduledMatch, design, championRush }) {
  const tLogo = design?.logoUrl || null;
  const tName = design?.tournamentName || 'BOOYAH TOURNAMENT';
  const tSubtitle = design?.tournamentSubtitle || 'FREE FIRE ESPORTS';
  const sponsorLogo = design?.sponsorLogoUrl || null;
  const sponsorLabel = design?.sponsorLabel || 'OFFICIAL SPONSOR';
  const accent = '#00C8FF';
  const accent2 = '#0055FF';
  const gold = '#FFC700';

  // Parse format config for stats
  let formatConfig = null;
  let totalMatches = 0;
  let totalStages = 0;
  let totalDays = 0;
  let ppk = 1;
  try {
    if (tournament?.format_config) {
      formatConfig = typeof tournament.format_config === 'string'
        ? JSON.parse(tournament.format_config)
        : tournament.format_config;
      totalStages = formatConfig.stages?.length || 0;
      for (const s of (formatConfig.stages || [])) {
        totalDays += (s.days || []).length;
        for (const d of (s.days || [])) totalMatches += (d.matches || []).length;
      }
    }
    ppk = tournament?.points_per_kill || 1;
  } catch (_) {}

  // Current match info
  const currentMatchNum = currentMatch?.match_number || tournament?.current_match_number || 0;
  const currentStage = currentMatch?.stage_name || '';
  const currentDay = currentMatch?.day_label || '';
  const currentMap = currentMatch?.map_name || '';
  const currentState = currentMatch?.state || 'idle';

  // Next match info
  const nextNum = nextScheduledMatch?.match_number || (currentMatchNum + 1);
  const nextMap = nextScheduledMatch?.map_name || '';
  const nextStage = nextScheduledMatch?.stage_name || '';
  const nextDay = nextScheduledMatch?.day_label || '';

  // Parse placement points config
  let placementConfig = {};
  try {
    if (tournament?.placement_points_config) {
      placementConfig = typeof tournament.placement_points_config === 'string'
        ? JSON.parse(tournament.placement_points_config)
        : tournament.placement_points_config;
    }
  } catch (_) {}

  const topPlacements = Object.entries(placementConfig).sort((a, b) => Number(a[0]) - Number(b[0])).slice(0, 4);

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 30% 20%, #0a1130 0%, #04060E 60%, #02030a 100%)',
      boxSizing: 'border-box', color: '#fff'
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '15%', right: '10%', width: 500, height: 500, background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, background: `radial-gradient(circle, ${accent2}10 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Diagonal accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: `linear-gradient(90deg, ${accent}, ${accent2}, ${gold})`, boxShadow: `0 0 20px ${accent}50` }} />

      {/* Content */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: '80px 100px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

        {/* Top section: Logo + Tournament name + Sponsor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {tLogo ? (
              <img src={tLogo} alt="" style={{ height: 90, objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.25))' }} onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ height: 90, width: 90, background: `linear-gradient(135deg, ${accent}, ${accent2})`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 25px ${accent}40` }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#fff' }}>FF</span>
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 800, color: accent, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 6 }}>{tSubtitle.toUpperCase()}</div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 56, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', lineHeight: 1, textShadow: '0 0 30px rgba(255,255,255,0.1)' }}>{tName.toUpperCase()}</div>
            </div>
          </div>
          {sponsorLogo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em' }}>{sponsorLabel.toUpperCase()}</span>
              <img src={sponsorLogo} alt="" style={{ height: 55, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))' }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}
        </div>

        {/* Main content grid: Left = Current match, Right = Tournament format stats */}
        <div style={{ display: 'flex', gap: 40, flex: 1 }}>
          {/* Left: Current match card */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Current Match Card */}
            <div style={{
              borderRadius: 20, border: `1px solid ${accent}30`, background: 'rgba(0, 200, 255, 0.04)',
              padding: 32, position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow effect */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 800, color: accent, letterSpacing: '0.4em', marginBottom: 16, textTransform: 'uppercase' }}>
                {currentState === 'in_game' ? '🔴 LIVE NOW' : 'CURRENT MATCH'}
              </div>

              {currentMatch ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1 }}>M{currentMatchNum}</span>
                    {currentStage && <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 800, color: accent, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{currentStage}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                    <div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', marginBottom: 6 }}>MAP</div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>{currentMap}</div>
                    </div>
                    {currentDay && (
                      <div>
                        <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', marginBottom: 6 }}>DAY</div>
                        <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>{currentDay}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', marginBottom: 6 }}>STATUS</div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: currentState === 'in_game' ? '#00ff64' : accent, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{currentState.replace('_', ' ')}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>No active match</div>
              )}

              {/* Up Next */}
              {nextScheduledMatch && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3em', marginBottom: 8 }}>UP NEXT</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color: accent2 }}>M{nextNum}</span>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{nextMap}</span>
                    {nextStage && <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>· {nextStage}</span>}
                    {nextDay && <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>· {nextDay}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Tournament stats */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Format stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <StatCard label="STAGES" value={totalStages || '—'} accent={accent} />
              <StatCard label="DAYS" value={totalDays || '—'} accent={accent2} />
              <StatCard label="TOTAL MATCHES" value={totalMatches || tournament?.total_matches || '—'} accent={gold} />
              <StatCard label="POINTS PER KILL" value={ppk} accent={accent} />
              <StatCard label="RUSH THRESHOLD" value={(tournament?.champion_rush_threshold || 0) > 0 ? tournament.champion_rush_threshold : 'OFF'} accent={gold} />
            </div>

            {/* Top placement points */}
            {topPlacements.length > 0 && (
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 800, color: accent, letterSpacing: '0.3em', marginBottom: 16 }}>PLACEMENT POINTS</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {topPlacements.map(([pos, pts]) => (
                    <div key={pos} style={{ flex: 1, textAlign: 'center', borderRadius: 10, padding: '12px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: pos === '1' ? gold : pos === '2' ? '#c0c0c0' : pos === '3' ? '#cd7f32' : '#fff' }}>#{pos}</div>
                      <div style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{pts} PTS</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Champion Rush eligible teams */}
            {championRush?.eligible_teams?.length > 0 && (
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,199,0,0.2)', background: 'rgba(255,199,0,0.04)', padding: 20 }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 800, color: gold, letterSpacing: '0.3em', marginBottom: 12 }}>🏆 CHAMPION RUSH ELIGIBLE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {championRush.eligible_teams.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,199,0,0.05)', border: '1px solid rgba(255,199,0,0.1)' }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 800, color: '#fff' }}>{t.name}</span>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color: gold }}>{t.points} PTS</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress indicator */}
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 800, color: accent, letterSpacing: '0.3em', marginBottom: 12 }}>TOURNAMENT PROGRESS</div>
              <div style={{ fontSize: 56, fontFamily: 'Orbitron', fontWeight: 900, color: '#fff' }}>
                {currentMatchNum}<span style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}> / {totalMatches || tournament?.total_matches || '?'}</span>
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginTop: 6 }}>MATCHES PLAYED</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.3em' }}>
            BOOYAH DIRECTOR · EVENT DETAILS
          </span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.3em' }}>
            FREE FIRE ESPORTS BROADCAST
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Small stat card helper for EventDetails
function StatCard({ label, value, accent }) {
  return (
    <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 20, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Orbitron', fontSize: 32, fontWeight: 900, color: accent }}>{value}</div>
    </div>
  );
}
