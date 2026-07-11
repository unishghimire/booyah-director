/**
 * OBS OVERLAY — Professional Free Fire Official Tournament Style
 * Matches the reference images exactly:
 * - Dark navy/black bg with orange+cyan accent borders
 * - Garena-style header bar with logo left, title center, branding right
 * - Ranked table: RANK | TEAM LOGO | TEAM NAME | KILLS | BOOYAH | TOTAL POINTS
 * - FF Board with alive bars | Full standings | Today's Matches with clocks
 * - Meet the Teams with circular logos | MVP with player photo frame
 * - BOOYAH! champions with fire effect | Casters side-by-side | Upcoming Map countdown
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Star, Crown, Trophy, Crosshair, Zap, Clock } from 'lucide-react';

/* ── Design tokens ── */
const tok = {
  acc:  x => x?.accentColor  || '#f97316',
  acc2: x => x?.accentColor2 || '#00d4ff',
  bg:   x => x?.bgColor      || '#0a0c1a',
  txt:  x => x?.textColor    || '#ffffff',
  name: x => x?.tournamentName    || 'FF OFFICIAL',
  sub:  x => x?.tournamentSubtitle || 'GRAND FINALS',
  game: x => x?.gameLabel    || 'MATCH',
  font: x => {
    const f = x?.fontStyle || 'orbitron';
    if (f === 'rajdhani') return 'Rajdhani, sans-serif';
    if (f === 'impact')   return 'Impact, Arial Narrow, sans-serif';
    return 'Orbitron, sans-serif';
  },
};

/* ── Official FF header bar ── */
function FFHeader({ design, title, right }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  return (
    <div className="flex items-center justify-between px-4 py-2"
      style={{ background: `linear-gradient(135deg, ${primary}22 0%, ${tok.bg(design)} 50%, ${cyan}22 100%)`, borderBottom: `1px solid ${primary}44` }}>
      {/* Left: logo */}
      <div className="flex items-center gap-2">
        {design?.logoUrl
          ? <img src={design.logoUrl} alt="" className="h-6 object-contain" onError={e=>e.target.style.display='none'} />
          : <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: primary + '44' }}>
              <Zap className="h-3.5 w-3.5" style={{ color: primary }} />
            </div>
        }
        <span className="font-orbitron text-[10px] font-black" style={{ color: primary }}>GARENA</span>
      </div>
      {/* Center title */}
      <div className="flex items-center gap-3">
        <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${primary})` }} />
        <span className="font-orbitron text-xs font-black tracking-widest text-white">{title || tok.name(design)}</span>
        <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${cyan})` }} />
      </div>
      {/* Right */}
      <span className="font-orbitron text-[10px] font-black" style={{ color: cyan }}>
        {right || tok.name(design)}
      </span>
    </div>
  );
}

/* ── Corner bracket decoration ── */
function Brackets({ design, children, className = '' }) {
  const c = tok.acc(design);
  const c2 = tok.acc2(design);
  return (
    <div className={`relative ${className}`}>
      {/* TL */}
      <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: c }} />
      {/* TR */}
      <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: c2 }} />
      {/* BL */}
      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: c2 }} />
      {/* BR */}
      <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: c }} />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: SETUP BLANK
══════════════════════════════════════════════════ */
function SetupBlank({ design }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: tok.bg(design) }}>
      <div className="opacity-10 text-center">
        {design?.logoUrl
          ? <img src={design.logoUrl} alt="" className="h-40 object-contain" onError={e=>e.target.style.display='none'} />
          : <p className="font-orbitron text-3xl font-black tracking-[0.5em]" style={{ color: tok.acc(design) }}>BOOYAH DIRECTOR</p>
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: PRE-MATCH MAP
══════════════════════════════════════════════════ */
function PreMatchMap({ match, teams, players, design }) {
  const mapName  = (match?.map_name || 'BERMUDA').toUpperCase();
  const matchNum = match?.match_number || 1;
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Animated grid bg */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}22 1px, transparent 1px), linear-gradient(90deg, ${primary}22 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 30%, ${primary}22, transparent 65%)` }} />

      {/* Header */}
      <FFHeader design={design} title={tok.name(design)} />

      {/* Center content */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 font-orbitron font-black uppercase tracking-[0.5em]"
          style={{ fontSize: 18, color: cyan }}>
          {tok.game(design)} {matchNum}
        </motion.p>

        <motion.h1 initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 80 }}
          className="font-orbitron font-black leading-none"
          style={{ fontSize: 180, color: tok.txt(design),
            textShadow: `0 0 60px ${primary}cc, 0 0 120px ${primary}55`,
            WebkitTextStroke: `2px ${primary}` }}>
          {mapName}
        </motion.h1>

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6 }}
          className="mt-4 h-0.5 w-[700px]"
          style={{ background: `linear-gradient(to right, transparent, ${primary}, ${cyan}, transparent)` }} />
      </div>

      {/* Teams strip */}
      {(teams || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-3 border-t px-10 py-4"
          style={{ borderColor: primary + '33', background: tok.bg(design) + 'ee' }}>
          {teams.map((team, i) => {
            const tp = (players || []).filter(p => p.team_id === team.id);
            const hue = [primary, cyan, '#a855f7', '#10b981', '#ef4444', '#eab308'][i % 6];
            return (
              <div key={team.id} className="flex items-center gap-2 rounded-xl border px-4 py-2"
                style={{ borderColor: hue + '55', background: hue + '11' }}>
                {team.logo_url
                  ? <img src={team.logo_url} alt="" className="h-6 w-6 rounded-full" onError={e=>e.target.style.display='none'} />
                  : <div className="flex h-6 w-6 items-center justify-center rounded-full font-black text-[10px]" style={{ background: hue + '33', color: hue }}>{team.name.slice(0,2)}</div>}
                <span className="font-orbitron text-xs font-black" style={{ color: hue }}>{team.name}</span>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: FF BOARD (Official FF style — reference image top-left)
   Columns: RANK | TEAM LOGO | TEAM NAME | KILLS | BOOYAH | TOTAL POINTS
   Right side: alive tally bars
══════════════════════════════════════════════════ */
function FFBoard({ teams, players, currentMatch, design }) {
  const matchNum = currentMatch?.match_number || 1;
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);
  const font     = tok.font(design);

  const rows = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
      .map((team, i) => {
        const tp = (players || []).filter(p => p.team_id === team.id);
        const alive = tp.filter(p => p.is_alive).length;
        const total = tp.length || 4;
        return {
          team, rank: i + 1, alive, total,
          kills: team.total_tournament_kills || 0,
          booyah: 0, // placement wins — could track separately
          pts: team.total_tournament_points || 0,
          isOut: alive === 0 && tp.length > 0,
        };
      });
  }, [teams, players]);

  const totalAlive = rows.filter(r => !r.isOut).length;
  const humanAlive = (players || []).filter(p => p.is_alive).length;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* bg grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${primary}44 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      {/* lightning accent */}
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-5"
        style={{ background: `linear-gradient(135deg, ${cyan}00, ${cyan}aa, ${cyan}00)` }} />

      {/* Header */}
      <FFHeader design={design} title="FF BOARD" right={tok.name(design)} />

      {/* HUD stats */}
      <div className="flex items-center gap-3 border-b px-6 py-2" style={{ borderColor: primary + '33', background: primary + '08' }}>
        {[
          { label: 'TEAMS ALIVE', val: totalAlive },
          { label: 'PLAYERS ALIVE', val: humanAlive },
          { label: tok.game(design), val: matchNum },
        ].map(({ label, val }) => (
          <div key={label} className="flex items-center gap-2 rounded-full border px-4 py-1" style={{ borderColor: primary + '44', background: primary + '11' }}>
            <span className="font-orbitron text-base font-black" style={{ color: primary }}>{val}</span>
            <span className="text-[10px] font-bold text-gray-500">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-4 py-1">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-orbitron text-xs font-black text-red-400">LIVE</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: primary + '99', background: primary + '08', borderBottom: `1px solid ${primary}22` }}>
        <span className="w-12 text-center">RANK</span>
        <span className="w-10 text-center">LOGO</span>
        <span className="flex-1 pl-2">TEAM NAME</span>
        <span className="w-20 text-center">KILLS</span>
        <span className="w-20 text-center">BOOYAH</span>
        <span className="w-28 text-center">TOTAL POINTS</span>
        <span className="w-24 text-center">ALIVE</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-hidden px-2 py-1 space-y-0.5">
        {rows.map((row, idx) => {
          const isTop   = idx === 0;
          const rowBg   = row.isOut ? 'transparent' : isTop ? `${primary}18` : idx % 2 === 0 ? `${primary}08` : 'transparent';
          const border  = isTop ? `1px solid ${primary}44` : row.isOut ? 'none' : `1px solid ${primary}11`;
          const rankCol = isTop ? primary : idx === 1 ? '#d1d5db' : idx === 2 ? '#ea580c' : '#6b7280';

          return (
            <motion.div key={row.team.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
              className="flex items-center rounded-lg px-2 py-1.5"
              style={{ background: rowBg, border, opacity: row.isOut ? 0.35 : 1 }}>

              {/* Rank */}
              <div className="w-12 text-center">
                <span className="font-orbitron text-base font-black" style={{ color: rankCol, fontFamily: font }}>{row.rank}</span>
              </div>

              {/* Team logo */}
              <div className="w-10 flex justify-center">
                {row.team.logo_url
                  ? <img src={row.team.logo_url} alt="" className="h-7 w-7 rounded-full object-cover border" style={{ borderColor: isTop ? primary + '77' : '#ffffff22' }} onError={e=>e.target.style.display='none'} />
                  : <div className="flex h-7 w-7 items-center justify-center rounded-full font-black text-[9px]" style={{ background: isTop ? primary + '33' : '#ffffff11', color: isTop ? primary : '#9ca3af' }}>
                      {row.team.name.slice(0,2).toUpperCase()}
                    </div>
                }
              </div>

              {/* Name */}
              <div className="flex flex-1 items-center gap-2 pl-2">
                {isTop && <div className="h-5 w-0.5 rounded-full flex-shrink-0" style={{ background: primary }} />}
                <span className="font-orbitron text-xs font-black uppercase truncate" style={{ color: row.isOut ? '#555' : isTop ? primary : tok.txt(design), fontFamily: font }}>
                  {row.team.name}
                </span>
              </div>

              {/* Kills */}
              <div className="w-20 text-center">
                <span className="font-orbitron text-sm font-black" style={{ color: row.isOut ? '#555' : tok.acc2(design), fontFamily: font }}>
                  {String(row.kills).padStart(2, '0')}
                </span>
              </div>

              {/* Booyah (wins) */}
              <div className="w-20 text-center">
                <span className="font-orbitron text-sm font-black" style={{ color: row.isOut ? '#555' : '#fbbf24', fontFamily: font }}>
                  {row.booyah}
                </span>
              </div>

              {/* Total points */}
              <div className="w-28 text-center">
                <span className="font-orbitron text-base font-black" style={{ color: row.isOut ? '#555' : primary, fontFamily: font }}>
                  {row.pts}
                </span>
              </div>

              {/* Alive tally bars */}
              <div className="w-24 flex items-center justify-center gap-[3px]">
                {row.isOut
                  ? <span className="font-orbitron text-xs text-red-700">ELIM</span>
                  : Array.from({ length: row.total }).map((_, i) => (
                      <div key={i} className="rounded-sm" style={{
                        width: 5,
                        height: i < row.alive ? 16 : 8,
                        background: i < row.alive ? (i === row.alive - 1 ? primary : primary + 'cc') : '#ffffff18',
                        marginTop: i < row.alive ? 0 : 4,
                      }} />
                    ))
                }
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t px-6 py-2 text-[9px] font-bold text-gray-600" style={{ borderColor: primary + '22' }}>
        <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-sm" style={{ background: primary }} /> ALIVE</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-sm" style={{ background: cyan + '66' }} /> KNOCKED</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-sm bg-white/20" /> ELIMINATED</div>
        <div className="ml-auto font-orbitron text-[9px]" style={{ color: primary + '66' }}>{tok.name(design)} · {tok.sub(design)}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: FULL STANDINGS (same columns as FF Board)
══════════════════════════════════════════════════ */
function FullStandings({ teams, design }) {
  const sorted  = useMemo(() => [...(teams || [])].sort((a,b) => (b.total_tournament_points||0) - (a.total_tournament_points||0)), [teams]);
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${primary}44 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="STANDINGS" right={tok.name(design)} />

      {/* Column headers */}
      <div className="flex items-center px-6 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: primary + '99', background: primary + '08', borderBottom: `1px solid ${primary}22` }}>
        <span className="w-12 text-center">RANK</span>
        <span className="w-12 text-center">LOGO</span>
        <span className="flex-1">TEAM NAME</span>
        <span className="w-24 text-center">KILLS</span>
        <span className="w-24 text-center">BOOYAH</span>
        <span className="w-32 text-center">TOTAL POINTS</span>
      </div>

      <div className="flex-1 overflow-hidden px-4 py-2 space-y-1">
        {sorted.map((team, i) => {
          const isTop = i === 0;
          const rankCol = i === 0 ? primary : i === 1 ? '#d1d5db' : i === 2 ? '#ea580c' : '#6b7280';
          return (
            <motion.div key={team.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center rounded-xl px-4 py-2"
              style={{ background: isTop ? `${primary}18` : i % 2 === 0 ? `${primary}06` : 'transparent', border: `1px solid ${isTop ? primary + '44' : primary + '11'}` }}>
              <div className="w-12 text-center"><span className="font-orbitron text-lg font-black" style={{ color: rankCol }}>{i + 1}</span></div>
              <div className="w-12 flex justify-center">
                {team.logo_url
                  ? <img src={team.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" onError={e=>e.target.style.display='none'} />
                  : <div className="flex h-8 w-8 items-center justify-center rounded-full font-black text-xs" style={{ background: primary + '22', color: primary }}>{team.name.slice(0,2)}</div>
                }
              </div>
              <div className="flex flex-1 items-center gap-2 pl-2">
                {isTop && <div className="h-6 w-0.5 rounded-full" style={{ background: primary }} />}
                <span className="font-orbitron text-sm font-black text-white truncate" style={{ fontFamily: font }}>{team.name}</span>
              </div>
              <div className="w-24 text-center"><span className="font-orbitron text-base font-black" style={{ color: cyan }}>{team.total_tournament_kills || 0}</span></div>
              <div className="w-24 text-center"><span className="font-orbitron text-base font-black text-yellow-400">0</span></div>
              <div className="w-32 text-center"><span className="font-orbitron text-xl font-black" style={{ color: primary }}>{team.total_tournament_points || 0}</span></div>
            </motion.div>
          );
        })}
        {sorted.length === 0 && <p className="py-8 text-center text-sm text-gray-600">No teams registered</p>}
      </div>

      <div className="border-t px-6 py-2 text-right" style={{ borderColor: primary + '22' }}>
        <span className="font-orbitron text-[10px]" style={{ color: primary + '55' }}>{tok.name(design)} · {tok.sub(design)}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: TODAY'S MATCHES (with schedule times & map images)
══════════════════════════════════════════════════ */
const MAP_COLORS = { Bermuda:'#10b981', Kalahari:'#f59e0b', Purgatory:'#a855f7', Alpine:'#3b82f6', Nexterra:'#06b6d4' };

function TodaysMatches({ tournament, design }) {
  const total   = tournament?.total_matches || 5;
  const current = tournament?.current_match_number || 0;
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);
  const maps    = ['Bermuda','Kalahari','Purgatory','Bermuda','Purgatory'];
  const times   = ['14:00','15:00','18:00','—','—'];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="TODAY'S MATCHES" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-center gap-6 px-10 py-6">
        {Array.from({ length: total }).map((_, i) => {
          const map     = maps[i] || 'Bermuda';
          const time    = times[i] || '—';
          const isDone  = i < current - 1;
          const isLive  = i === current - 1;
          const mapCol  = MAP_COLORS[map] || primary;

          return (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center"
              style={{ flex: 1 }}>
              <Brackets design={design}
                className="w-full rounded-xl border overflow-hidden"
                style={{ borderColor: isLive ? primary + '88' : '#ffffff15', background: isLive ? primary + '15' : '#ffffff06' }}>
                {/* Match label */}
                <div className="border-b py-1 text-center" style={{ borderColor: '#ffffff11', background: '#00000033' }}>
                  <p className="font-orbitron text-[10px] font-black" style={{ color: isLive ? primary : '#9ca3af' }}>
                    {tok.game(design)} {i + 1}
                  </p>
                </div>
                {/* Map visual */}
                <div className="flex flex-col items-center py-4">
                  <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2"
                    style={{ borderColor: mapCol + '66', background: mapCol + '22' }}>
                    <span className="font-orbitron text-[9px] font-black text-center leading-tight" style={{ color: mapCol }}>{map.toUpperCase()}</span>
                  </div>
                  <p className="font-orbitron text-xs font-black text-white">{map.toUpperCase()}</p>
                </div>
                {/* Time */}
                <div className="border-t py-2 text-center" style={{ borderColor: '#ffffff11' }}>
                  <p className="font-orbitron text-lg font-black" style={{ color: isLive ? primary : isDone ? '#4b5563' : cyan }}>
                    {isLive ? 'LIVE' : time}
                  </p>
                </div>
              </Brackets>
              {/* Status badge */}
              <div className="mt-2">
                {isLive && <span className="rounded-full px-3 py-1 text-[10px] font-black" style={{ background: primary + '33', color: primary }}>● LIVE NOW</span>}
                {isDone && <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black text-green-400">✓ DONE</span>}
                {!isDone && !isLive && <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-gray-600">UPCOMING</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: MEET THE TEAMS (circular logos grid)
══════════════════════════════════════════════════ */
function TeamsToday({ teams, players, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);
  const colors  = [primary, cyan, '#a855f7', '#10b981', '#ef4444', '#eab308', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#6366f1', '#06b6d4'];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}33 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="MEET THE TEAMS" right={tok.name(design)} />

      <div className="flex flex-1 flex-col items-center justify-center px-16">
        {/* Top row */}
        <div className="flex items-center gap-10 mb-10">
          {(teams || []).slice(0, Math.ceil((teams?.length || 0) / 2)).map((team, i) => {
            const col = colors[i % colors.length];
            return (
              <motion.div key={team.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1, type: 'spring' }}
                className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-30" style={{ background: col, filter: 'blur(8px)' }} />
                  {team.logo_url
                    ? <img src={team.logo_url} alt="" className="relative h-20 w-20 rounded-full object-cover border-3" style={{ border: `3px solid ${col}` }} onError={e=>e.target.style.display='none'} />
                    : <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-3 font-orbitron text-xl font-black" style={{ border: `3px solid ${col}`, background: col + '22', color: col }}>
                        {team.name.slice(0,2)}
                      </div>
                  }
                </div>
                <span className="font-orbitron text-[11px] font-black text-white text-center leading-tight">{team.name}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px w-40" style={{ background: `linear-gradient(to right, transparent, ${primary})` }} />
          <span className="font-orbitron text-sm font-black text-white tracking-widest">MEET THE TEAMS</span>
          <div className="h-px w-40" style={{ background: `linear-gradient(to left, transparent, ${cyan})` }} />
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-10">
          {(teams || []).slice(Math.ceil((teams?.length || 0) / 2)).map((team, i) => {
            const realIdx = Math.ceil((teams?.length || 0) / 2) + i;
            const col = colors[realIdx % colors.length];
            return (
              <motion.div key={team.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-30" style={{ background: col, filter: 'blur(8px)' }} />
                  {team.logo_url
                    ? <img src={team.logo_url} alt="" className="relative h-20 w-20 rounded-full object-cover border-3" style={{ border: `3px solid ${col}` }} onError={e=>e.target.style.display='none'} />
                    : <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-3 font-orbitron text-xl font-black" style={{ border: `3px solid ${col}`, background: col + '22', color: col }}>
                        {team.name.slice(0,2)}
                      </div>
                  }
                </div>
                <span className="font-orbitron text-[11px] font-black text-white text-center leading-tight">{team.name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: CASTERS (side-by-side with VS divider)
══════════════════════════════════════════════════ */
function CastersScreen({ design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);
  const casters = design?.casters || [
    { name: 'CASTER 1', handle: '@GANGSPEEK', role: 'PLAY-BY-PLAY' },
    { name: 'CASTER 2', handle: '@THE SAUCE', role: 'COLOR CASTER' },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="CASTERS" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-center gap-0">
        {casters.slice(0, 2).map((caster, i) => {
          const col   = i === 0 ? primary : cyan;
          const side  = i === 0 ? 'left' : 'right';
          return (
            <React.Fragment key={i}>
              <motion.div initial={{ opacity: 0, x: i === 0 ? -60 : 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2, type: 'spring' }}
                className="flex flex-col" style={{ flex: 1, maxWidth: 500 }}>
                <Brackets design={i === 0 ? design : { ...design, accentColor: cyan, accentColor2: primary }}
                  className="mx-8 rounded-2xl border overflow-hidden"
                  style={{ borderColor: col + '55' }}>
                  {/* "Camera" frame */}
                  <div className="relative flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${tok.bg(design)}, ${col}18)`, minHeight: 280 }}>
                    {/* Screen/monitor bg effect */}
                    <div className="absolute inset-4 rounded-xl border opacity-20" style={{ borderColor: col }} />
                    <div className="absolute inset-8 rounded-lg border opacity-10" style={{ borderColor: col }} />
                    {/* Corner bracket HUD elements */}
                    <div className="absolute left-6 top-6 text-[8px] font-mono text-gray-600">REC ●</div>
                    <div className="absolute right-6 top-6 text-[8px] font-mono text-gray-600">HD 1080p</div>
                    {/* Caster avatar placeholder */}
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4"
                      style={{ borderColor: col, background: col + '18' }}>
                      <span className="font-orbitron text-3xl font-black" style={{ color: col }}>
                        {(caster.name || '?').slice(0,1)}
                      </span>
                    </div>
                    {/* Role label bottom left */}
                    <div className="absolute bottom-4 left-4 rounded border px-2 py-1 text-[9px] font-black uppercase" style={{ borderColor: col + '66', background: tok.bg(design) + 'cc', color: col }}>
                      {caster.role || (i === 0 ? 'PLAY-BY-PLAY' : 'COLOR CASTER')}
                    </div>
                  </div>
                  {/* Name strip */}
                  <div className="border-t px-4 py-3" style={{ borderColor: col + '44', background: col + '11' }}>
                    <p className="font-orbitron text-base font-black text-white">{caster.name}</p>
                    <p className="text-xs" style={{ color: col }}>{caster.handle}</p>
                  </div>
                </Brackets>
              </motion.div>

              {/* VS divider */}
              {i === 0 && (
                <div className="flex flex-col items-center gap-2 px-4">
                  <div className="h-20 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${primary}, transparent)` }} />
                  <span className="font-orbitron text-xl font-black text-white">VS</span>
                  <div className="h-20 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${cyan}, transparent)` }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: UPCOMING MAP (with countdown)
══════════════════════════════════════════════════ */
function UpcomingMap({ tournament, design }) {
  const [secs, setSecs] = useState(300);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm  = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss  = String(secs % 60).padStart(2, '0');
  const matchNum = (tournament?.current_match_number || 0) + 1;
  const maps     = ['Bermuda','Kalahari','Purgatory','Alpine','Nexterra'];
  const mapName  = maps[(matchNum - 1) % maps.length];
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);
  const font     = tok.font(design);
  const mapCol   = MAP_COLORS[mapName] || primary;

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="UPCOMING MAP" right={tok.name(design)} />

      <div className="flex flex-1 items-center" style={{ marginTop: 56 }}>
        {/* Left: text info */}
        <div className="flex flex-1 flex-col items-start justify-center pl-16">
          <motion.p initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
            className="mb-2 font-orbitron font-black uppercase tracking-widest"
            style={{ fontSize: 14, color: cyan }}>
            {tok.game(design)} {matchNum} — NEXT MAP
          </motion.p>
          <motion.h1 initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.2 }}
            className="font-orbitron font-black leading-none mb-6"
            style={{ fontSize: 96, color: tok.txt(design),
              textShadow: `0 0 40px ${mapCol}cc`,
              WebkitTextStroke: `2px ${mapCol}88` }}>
            {mapName.toUpperCase()}
          </motion.h1>
          <div className="flex items-center gap-4">
            <p className="font-orbitron text-sm font-bold text-gray-400 uppercase tracking-widest">MATCH STARTS IN</p>
          </div>
          <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay: 0.4 }}
            className="mt-3 rounded-2xl border-2 px-8 py-4 text-center"
            style={{ borderColor: primary + '66', background: primary + '11', boxShadow: `0 0 30px ${primary}44` }}>
            <p className="font-orbitron text-6xl font-black" style={{ color: primary, fontFamily: font }}>
              {mm}:{ss}
            </p>
          </motion.div>
        </div>

        {/* Right: map visual */}
        <div className="flex flex-1 items-center justify-center pr-16">
          <motion.div initial={{ opacity:0, scale:0.7, rotate:-10 }} animate={{ opacity:1, scale:1, rotate:0 }} transition={{ delay: 0.3, type:'spring' }}>
            <Brackets design={design} className="rounded-2xl border-2 p-8" style={{ borderColor: mapCol + '66', background: mapCol + '08' }}>
              <div className="flex h-64 w-64 flex-col items-center justify-center rounded-xl border" style={{ borderColor: mapCol + '44', background: mapCol + '11' }}>
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4" style={{ borderColor: mapCol, background: mapCol + '22' }}>
                  <span className="font-orbitron text-lg font-black text-center leading-tight" style={{ color: mapCol }}>{mapName.toUpperCase()}</span>
                </div>
                <p className="mt-4 font-orbitron text-xs font-bold text-gray-500">FREE FIRE MAP</p>
              </div>
            </Brackets>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: KILL FEED
══════════════════════════════════════════════════ */
function KillFeedScreen({ killFeed, design }) {
  const recent  = useMemo(() => [...(killFeed || [])].slice(0, 8), [killFeed]);
  const primary = tok.acc(design);
  const font    = tok.font(design);
  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      <FFHeader design={design} title="KILL FEED" right={tok.name(design)} />
      <div className="flex-1 flex flex-col justify-center px-16 py-6 gap-3">
        {recent.length === 0 && <p className="text-center text-gray-600">No kills yet</p>}
        {recent.map((kill, i) => (
          <motion.div key={kill.id || i} initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.06 }}
            className="flex items-center gap-4 rounded-2xl border px-6 py-4"
            style={{ background: `${primary}08`, borderColor: `${primary}22` }}>
            <Skull className="h-6 w-6 flex-shrink-0" style={{ color: primary }} />
            <span className="font-orbitron text-xl font-black" style={{ color: tok.txt(design), fontFamily: font }}>{kill.killer_name}</span>
            <div className="h-0.5 flex-1" style={{ background: `linear-gradient(to right, ${primary}, ${tok.acc2(design)})` }} />
            <span className="font-orbitron text-xl font-black" style={{ color: tok.acc2(design), fontFamily: font }}>{kill.killed_player_name || '—'}</span>
            <span className="text-xs text-gray-600 ml-2">{kill.killed_team_name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: ELIMINATION ALERT
══════════════════════════════════════════════════ */
function EliminationAlert({ eliminations, design }) {
  const latest  = useMemo(() => {
    if (!eliminations?.length) return null;
    return [...eliminations].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
  }, [eliminations]);
  const primary = tok.acc(design);
  const font    = tok.font(design);

  if (!latest) return <div className="flex h-full w-full items-center justify-center" style={{ background: tok.bg(design) }}><Skull className="h-24 w-24 opacity-10" style={{ color: '#ef4444' }} /></div>;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 50%, #ef444418, ${tok.bg(design)} 65%)` }}>
      <motion.div initial={{ scale:0.3, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:0.5, type:'spring' }} className="text-center">
        <motion.div animate={{ rotate:[0,-8,8,-8,0] }} transition={{ duration:0.6, repeat:2 }} className="mb-6 flex justify-center">
          <Skull className="h-28 w-28" style={{ color:'#ef4444', filter:'drop-shadow(0 0 30px #ef4444cc)' }} />
        </motion.div>
        <Brackets design={{ ...design, accentColor:'#ef4444', accentColor2:'#dc2626' }}
          className="inline-block rounded-3xl border-4 px-20 py-10"
          style={{ borderColor:'#ef4444', background:'#00000099', boxShadow:'0 0 80px #ef444466' }}>
          <p className="mb-3 font-orbitron text-sm font-black uppercase tracking-[0.5em] text-red-400">ELIMINATED</p>
          <h2 className="font-orbitron font-black leading-none" style={{ fontSize:80, color:tok.txt(design), textShadow:'0 0 40px #ef444488', fontFamily:font }}>
            {latest.eliminated_player_name}
          </h2>
          {latest.eliminated_team_name && (
            <p className="mt-3 font-orbitron text-2xl font-bold text-red-400" style={{ fontFamily:font }}>{latest.eliminated_team_name}</p>
          )}
        </Brackets>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: MVP (with player card frame like reference)
══════════════════════════════════════════════════ */
function MVPScreen({ overlayState, design }) {
  const name   = overlayState?.mvp_player_name || 'PLAYER NAME';
  const team   = overlayState?.mvp_team_name   || 'TEAM';
  const kills  = overlayState?.mvp_kills       || 0;
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);

  const particles = useMemo(() => Array.from({length:40},()=>({ left:Math.random()*100, top:Math.random()*100, delay:Math.random()*3, size:2+Math.random()*5 })),[]);

  return (
    <div className="relative flex h-full w-full overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      {particles.map((p,i) => <div key={i} className="absolute rounded-full" style={{ left:`${p.left}%`,top:`${p.top}%`,width:p.size,height:p.size,background:primary,opacity:0.3,animation:`float-particle 3s ease ${p.delay}s infinite` }} />)}

      <FFHeader design={design} title="MVP" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-center gap-16" style={{ marginTop: 56 }}>
        {/* Player card — like reference image left box */}
        <Brackets design={design} className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: primary + '66', width: 320 }}>
          <div className="flex flex-col items-center justify-center p-8" style={{ background: `linear-gradient(135deg, ${primary}11, ${tok.bg(design)})`, minHeight: 360 }}>
            {/* Player avatar frame */}
            <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-xl border-4"
              style={{ borderColor: primary, background: primary + '18', boxShadow: `0 0 30px ${primary}66` }}>
              <span className="font-orbitron text-4xl font-black" style={{ color: primary }}>
                {(name || 'P').slice(0,1)}
              </span>
            </div>
            {/* Name strip */}
            <div className="w-full border-t pt-3 text-center" style={{ borderColor: primary + '44' }}>
              <p className="font-orbitron text-base font-black uppercase text-white">{name}</p>
              <p className="text-xs" style={{ color: primary }}>{team}</p>
            </div>
          </div>
        </Brackets>

        {/* Stats */}
        <div className="flex flex-col items-start gap-6">
          <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} className="flex items-center gap-4">
            <Star className="h-16 w-16" style={{ color: primary, filter:`drop-shadow(0 0 20px ${primary})` }} />
            <span className="font-orbitron font-black" style={{ fontSize:96, color:primary, fontFamily:font, textShadow:`0 0 40px ${primary}cc`, WebkitTextStroke:`2px ${cyan}66` }}>
              MVP
            </span>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="flex gap-8">
            {[
              { label:'KILLS', val: kills },
              { label:'DAMAGE', val: '—' },
              { label:'ASSISTS', val: '—' },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                <p className="font-orbitron text-4xl font-black" style={{ color: primary, fontFamily: font }}>{val}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: BOOYAH! CHAMPIONS (fire effect)
══════════════════════════════════════════════════ */
function ChampionsScreen({ overlayState, teams, design }) {
  const sorted   = useMemo(() => [...(teams||[])].sort((a,b)=>(b.total_tournament_points||0)-(a.total_tournament_points||0)),[teams]);
  const teamName = overlayState?.champion_team_name || sorted[0]?.name || 'CHAMPION';
  const teamTag  = sorted[0]?.name?.toUpperCase().slice(0,3) || 'WIN';
  const points   = overlayState?.champion_total_points || sorted[0]?.total_tournament_points || 0;
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);
  const font     = tok.font(design);

  const confetti = useMemo(() => Array.from({length:80},()=>({ left:Math.random()*100, delay:Math.random()*4, duration:2+Math.random()*3, color:[primary,cyan,'#fbbf24','#a855f7','#10b981'][Math.floor(Math.random()*5)], size:6+Math.random()*10 })),[]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Confetti */}
      {confetti.map((c,i) => <div key={i} className="absolute top-0" style={{ left:`${c.left}%`,width:c.size,height:c.size,background:c.color,animation:`confetti-fall ${c.duration}s linear ${c.delay}s infinite` }} />)}

      {/* Fire/glow bg */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 60%, ${primary}33 0%, ${tok.bg(design)} 60%)` }} />
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-40" style={{ background: `linear-gradient(to top, ${primary}88, transparent)` }} />

      <FFHeader design={design} title="BOOYAH!" right={tok.name(design)} />

      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: 40 }}>
        {/* Crown */}
        <motion.div initial={{ y:-30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.6 }}>
          <Crown className="mb-2 h-20 w-20" style={{ color:primary, filter:`drop-shadow(0 0 30px ${primary})` }} />
        </motion.div>

        {/* BOOYAH text */}
        <motion.h1 initial={{ scale:0.3, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:0.8, type:'spring', stiffness:70 }}
          className="font-orbitron font-black leading-none"
          style={{ fontSize:160, color:primary, fontFamily:font,
            textShadow:`0 0 60px ${primary}cc, 0 0 120px ${primary}55, 0 0 200px ${primary}22`,
            WebkitTextStroke:`3px ${cyan}88` }}>
          BOOYAH!
        </motion.h1>

        {/* Team strip */}
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          className="mt-4 flex w-[600px] items-center gap-4 rounded-2xl border-2 px-8 py-4"
          style={{ borderColor: primary + '66', background: '#00000088', boxShadow:`0 0 40px ${primary}44` }}>
          {sorted[0]?.logo_url
            ? <img src={sorted[0].logo_url} alt="" className="h-10 w-10 rounded-full" onError={e=>e.target.style.display='none'} />
            : <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 font-black text-sm" style={{ borderColor:primary, background:primary+'22', color:primary }}>{teamTag}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-orbitron text-xl font-black text-white truncate" style={{ fontFamily:font }}>{teamName}</p>
            <p className="text-xs text-gray-400">{sorted[0]?.name?.toUpperCase() || ''}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">TOTAL KILLS</p>
            <p className="font-orbitron text-xl font-black" style={{ color:primary }}>{sorted[0]?.total_tournament_kills || 0}</p>
          </div>
          <div className="text-right pl-4 border-l border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider">POINTS</p>
            <p className="font-orbitron text-xl font-black" style={{ color:primary }}>{points}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN OVERLAY ROUTER
══════════════════════════════════════════════════ */
export default function Overlay() {
  const { data } = useOverlayData(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const upd = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  const screen = data?.overlay_state?.current_screen || 'setup_blank';
  const design = data?.design || {};
  const { teams, players, current_match, kill_feed, eliminations, overlay_state, tournament } = data || {};

  const renderScreen = () => {
    switch (screen) {
      case 'pre_match_map':      return <PreMatchMap match={current_match} teams={teams} players={players} design={design} />;
      case 'ff_scoreboard':      return <FFBoard teams={teams} players={players} currentMatch={current_match} design={design} />;
      case 'scoreboard':         return <FullStandings teams={teams} design={design} />;
      case 'kill_feed':          return <KillFeedScreen killFeed={kill_feed} design={design} />;
      case 'elimination_alert':  return <EliminationAlert eliminations={eliminations} design={design} />;
      case 'todays_matches':     return <TodaysMatches tournament={tournament} design={design} />;
      case 'teams_today':        return <TeamsToday teams={teams} players={players} design={design} />;
      case 'casters':            return <CastersScreen design={design} />;
      case 'upcoming_map':       return <UpcomingMap tournament={tournament} design={design} />;
      case 'mvp':                return <MVPScreen overlayState={overlay_state} design={design} />;
      case 'champions':          return <ChampionsScreen overlayState={overlay_state} teams={teams} design={design} />;
      default:                   return <SetupBlank design={design} />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div style={{ width:1920, height:1080, transform:`scale(${scale})`, transformOrigin:'top left' }}>
        <AnimatePresence mode="wait">
          <motion.div key={screen} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }} className="relative h-full w-full">
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
