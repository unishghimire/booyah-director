/**
 * OBS OVERLAY — Professional Free Fire Tournament Level
 * Screens: blank, pre_match_map, ff_scoreboard, scoreboard,
 *          kill_feed, elimination_alert, todays_matches,
 *          teams_today, casters, upcoming_map, mvp, champions
 *
 * ALL colors/fonts driven by Design Studio in real-time.
 * Canvas: 1920×1080 scaled to viewport.
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Star, Crown, Trophy, Crosshair, Zap, Heart, XCircle } from 'lucide-react';

/* ── Design helpers ── */
const d = {
  acc:  (x) => x?.accentColor  || '#f97316',
  acc2: (x) => x?.accentColor2 || '#ef4444',
  bg:   (x) => x?.bgColor      || '#0a0a0f',
  txt:  (x) => x?.textColor    || '#ffffff',
  name: (x) => x?.tournamentName    || 'BOOYAH CUP',
  sub:  (x) => x?.tournamentSubtitle || 'GRAND FINALS',
  game: (x) => x?.gameLabel    || 'GAME',
  font: (x) => {
    const f = x?.fontStyle || 'orbitron';
    if (f === 'rajdhani') return 'Rajdhani, sans-serif';
    if (f === 'impact')   return 'Impact, Arial Narrow, sans-serif';
    return 'Orbitron, sans-serif';
  },
};

/* ── Team colors ── */
const TEAM_COLORS = [
  '#f97316','#3b82f6','#10b981','#a855f7',
  '#ef4444','#06b6d4','#eab308','#ec4899',
  '#8b5cf6','#14b8a6','#f59e0b','#6366f1',
];

/* ═══════════════════════════════════════════════
   SHARED: BOTTOM BRANDING STRIP
═══════════════════════════════════════════════ */
function BrandingStrip({ design, matchNum }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-10 py-3"
      style={{ background: `linear-gradient(to top, ${d.bg(design)}ff, ${d.bg(design)}cc)`, borderTop: `1px solid ${d.acc(design)}33` }}>
      <div className="flex items-center gap-3">
        {design?.logoUrl && <img src={design.logoUrl} alt="" className="h-8 object-contain" onError={e => e.target.style.display='none'} />}
        <div>
          <p className="font-black text-sm leading-none" style={{ color: d.acc(design), fontFamily: d.font(design) }}>{d.name(design)}</p>
          <p className="text-xs" style={{ color: d.txt(design) + '88', fontFamily: d.font(design) }}>{d.sub(design)}</p>
        </div>
      </div>
      {matchNum && (
        <div className="flex items-center gap-2 rounded-full border px-4 py-1" style={{ borderColor: d.acc(design) + '44', background: d.acc(design) + '11' }}>
          <span className="font-black text-sm" style={{ color: d.acc(design), fontFamily: d.font(design) }}>
            {d.game(design)} {matchNum}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: SETUP BLANK
═══════════════════════════════════════════════ */
function SetupBlank({ design }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: d.bg(design) }}>
      {design?.logoUrl
        ? <img src={design.logoUrl} alt="" className="h-32 object-contain opacity-20" onError={e => e.target.style.display='none'} />
        : <p className="font-black tracking-[0.5em] opacity-10" style={{ fontSize: 32, color: d.acc(design), fontFamily: d.font(design) }}>BOOYAH DIRECTOR</p>
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: PRE-MATCH MAP INTRO
═══════════════════════════════════════════════ */
function PreMatchMap({ match, teams, players, design }) {
  const mapName  = (match?.map_name || 'BERMUDA').toUpperCase();
  const matchNum = match?.match_number || 1;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${d.acc(design)}22 0%, ${d.bg(design)} 65%)` }}>

      {/* Big scanline bg */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />

      {design?.logoUrl && (
        <img src={design.logoUrl} alt="" className="absolute right-12 top-10 h-20 object-contain opacity-80" onError={e => e.target.style.display='none'} />
      )}

      <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-4 font-black uppercase tracking-[0.6em]" style={{ fontSize: 20, color: d.acc(design), fontFamily: d.font(design) }}>
        {d.game(design)} {matchNum}
      </motion.p>

      <motion.h1 initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
        style={{ fontSize: 160, fontFamily: d.font(design), color: d.txt(design), lineHeight: 1,
          textShadow: `0 0 60px ${d.acc(design)}cc, 0 0 120px ${d.acc(design)}66`,
          WebkitTextStroke: `2px ${d.acc(design)}cc` }}>
        {mapName}
      </motion.h1>

      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-6 h-0.5 w-[700px] origin-center"
        style={{ background: `linear-gradient(to right, transparent, ${d.acc(design)}, transparent)` }} />

      {/* Teams row at bottom */}
      {(teams || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }}
          className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-3 px-10 py-5"
          style={{ background: `linear-gradient(to top, ${d.bg(design)}ff, transparent)`, borderTop: `1px solid ${d.acc(design)}22` }}>
          {teams.map((team, i) => {
            const tp = (players || []).filter(p => p.team_id === team.id);
            const color = TEAM_COLORS[i % TEAM_COLORS.length];
            return (
              <div key={team.id} className="flex items-center gap-2 rounded-xl border px-4 py-2"
                style={{ borderColor: color + '44', background: color + '11' }}>
                {team.logo_url
                  ? <img src={team.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                  : <div className="flex h-6 w-6 items-center justify-center rounded-full font-black text-[10px]" style={{ background: color + '33', color }}>{team.name.slice(0, 2)}</div>
                }
                <span className="font-black text-sm" style={{ color, fontFamily: d.font(design) }}>{team.name}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      <BrandingStrip design={design} matchNum={matchNum} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: FF SCOREBOARD (reference-image style)
   Right-side live panel: rank | logo | name | ELIMS | ALIVE bars
═══════════════════════════════════════════════ */
function FFScoreboard({ teams, players, currentMatch, design }) {
  const matchNum = currentMatch?.match_number || 1;

  const rows = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
      .map((team, i) => {
        const tp = (players || []).filter(p => p.team_id === team.id);
        const alive = tp.filter(p => p.is_alive).length;
        const total = tp.length || 4;
        return { team, rank: i + 1, alive, total, elims: team.total_tournament_kills || 0, pts: team.total_tournament_points || 0, isOut: alive === 0 && tp.length > 0 };
      });
  }, [teams, players]);

  const totalAlive = rows.filter(r => !r.isOut).length;
  const aliveHuman = (players || []).filter(p => p.is_alive).length;

  const primary = d.acc(design);
  const font    = d.font(design);

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: d.bg(design) }}>
      {/* Subtle gradient bg */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 50%, ${primary}08 0%, transparent 60%)` }} />

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-4"
        style={{ background: `linear-gradient(to bottom, ${d.bg(design)}ee, transparent)` }}>
        <div className="flex items-center gap-3">
          {design?.logoUrl && <img src={design.logoUrl} alt="" className="h-10 object-contain" onError={e => e.target.style.display='none'} />}
          <div>
            <p className="font-black text-base leading-none" style={{ color: primary, fontFamily: font }}>{d.name(design)}</p>
            <p className="text-xs" style={{ color: d.txt(design) + '88', fontFamily: font }}>{d.sub(design)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {[
            { label: 'TEAMS', value: totalAlive },
            { label: 'ALIVE', value: aliveHuman },
            { label: d.game(design), value: matchNum },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: primary + '44', background: primary + '11' }}>
              <span className="font-black text-lg" style={{ color: primary, fontFamily: font }}>{value}</span>
              <span className="text-xs text-gray-500 font-bold">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-full border px-4 py-1.5 border-red-600/60 bg-red-600/10">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-black text-sm text-red-400" style={{ fontFamily: font }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── SCOREBOARD TABLE (right-anchored panel like official FF overlay) ── */}
      <div className="absolute right-8 top-20 bottom-16 flex flex-col" style={{ width: 480 }}>
        {/* Column headers */}
        <div className="flex items-center mb-1.5 px-3 text-[10px] font-black uppercase tracking-widest" style={{ color: primary + '88' }}>
          <span className="w-10 text-center">#</span>
          <span className="flex-1 pl-2">TEAMS</span>
          <span className="w-24 text-center">ELIMS</span>
          <span className="w-20 text-right pr-1">ALIVE</span>
        </div>

        <div className="flex-1 space-y-1 overflow-hidden">
          {rows.map((row, idx) => {
            const isTop = idx === 0;
            const rowBg  = row.isOut ? `${d.bg(design)}80` : isTop ? `${primary}1a` : idx % 2 === 0 ? '#ffffff0d' : '#00000033';
            const border = row.isOut ? 'transparent' : isTop ? `${primary}44` : '#ffffff11';

            return (
              <motion.div key={row.team.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="flex items-center rounded-xl px-3 py-2"
                style={{ background: rowBg, border: `1px solid ${border}`, opacity: row.isOut ? 0.4 : 1 }}
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  {isTop
                    ? <span className="font-black text-base" style={{ color: primary, fontFamily: font }}>#{row.rank}</span>
                    : <span className="font-black text-sm text-gray-500" style={{ fontFamily: font }}>#{row.rank}</span>
                  }
                </div>

                {/* Top accent bar */}
                {isTop && <div className="mr-2 h-6 w-1 flex-shrink-0 rounded-full" style={{ background: primary }} />}

                {/* Team logo + name */}
                <div className="flex flex-1 items-center gap-2 pl-1 min-w-0">
                  {row.team.logo_url
                    ? <img src={row.team.logo_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                    : <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-black text-[10px]" style={{ background: row.isOut ? '#333' : primary + '33', color: row.isOut ? '#555' : primary }}>
                        {row.team.name.slice(0, 2).toUpperCase()}
                      </div>
                  }
                  <span className="font-black text-sm uppercase tracking-wider truncate" style={{ color: row.isOut ? '#555' : isTop ? primary : d.txt(design), fontFamily: font }}>
                    {row.team.name}
                  </span>
                </div>

                {/* ELIMS */}
                <div className="w-24 text-center">
                  <span className="font-black text-base" style={{ color: row.isOut ? '#555' : d.acc2(design), fontFamily: font }}>
                    {String(row.elims).padStart(2, '0')}
                  </span>
                </div>

                {/* ALIVE bars (tally style like FF) */}
                <div className="w-20 flex items-center justify-end gap-[3px] pr-1">
                  {row.isOut
                    ? <span className="text-xs font-black" style={{ color: d.acc2(design) + '55' }}>✗</span>
                    : Array.from({ length: row.total }).map((_, i) => (
                        <div key={i} className="rounded-sm transition-all"
                          style={{ width: 5, height: i < row.alive ? 16 : 8, background: i < row.alive ? primary : '#ffffff18', marginTop: i < row.alive ? 0 : 4 }} />
                      ))
                  }
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center gap-4 px-3 text-[10px] text-gray-600">
          <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-sm" style={{ background: primary }} /><span>ALIVE</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-sm" style={{ background: d.acc2(design) + '66' }} /><span>KNOCKED</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-sm bg-white/20" /><span>ELIM</span></div>
        </div>
      </div>

      {/* ── TOTAL POINTS mini table on left ── */}
      <div className="absolute left-8 top-20 bottom-16 flex flex-col" style={{ width: 320 }}>
        <p className="mb-2 font-black text-[10px] uppercase tracking-widest" style={{ color: primary + '88', fontFamily: font }}>TOTAL STANDINGS</p>
        <div className="flex-1 space-y-1 overflow-hidden">
          {rows.slice(0, 8).map((row, idx) => (
            <div key={row.team.id} className="flex items-center gap-3 rounded-lg px-3 py-1.5"
              style={{ background: idx === 0 ? primary + '18' : '#ffffff08', border: `1px solid ${idx === 0 ? primary + '33' : '#ffffff0a'}` }}>
              <span className="font-black text-sm w-6" style={{ color: idx === 0 ? primary : '#6b7280', fontFamily: font }}>{idx + 1}</span>
              <span className="flex-1 text-xs font-bold text-white truncate">{row.team.name}</span>
              <span className="font-black text-base" style={{ color: primary, fontFamily: font }}>{row.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: FULL STANDINGS TABLE
═══════════════════════════════════════════════ */
function FullStandings({ teams, design }) {
  const sorted = useMemo(() => [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0)), [teams]);
  const primary = d.acc(design); const font = d.font(design);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: d.bg(design) }}>
      <div className="flex items-center justify-between border-b px-12 py-6" style={{ borderColor: primary + '33' }}>
        <div>
          <p className="font-black text-xl" style={{ color: primary, fontFamily: font }}>{d.name(design)}</p>
          <p className="text-sm text-gray-400" style={{ fontFamily: font }}>{d.sub(design)} — Final Standings</p>
        </div>
        {design?.logoUrl && <img src={design.logoUrl} alt="" className="h-14 object-contain" onError={e => e.target.style.display='none'} />}
      </div>
      <div className="flex-1 px-12 py-6">
        <div className="grid gap-2" style={{ gridTemplateColumns: sorted.length > 8 ? '1fr 1fr' : '1fr' }}>
          {sorted.map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-2xl px-5 py-3"
              style={{ background: i === 0 ? primary + '22' : i < 3 ? '#ffffff0d' : '#ffffff06', border: `1px solid ${i === 0 ? primary + '44' : '#ffffff10'}` }}>
              <span className="font-black text-2xl w-10 text-center" style={{ color: i === 0 ? primary : i === 1 ? '#d1d5db' : i === 2 ? '#ea580c' : '#4b5563', fontFamily: font }}>
                {i + 1}
              </span>
              {team.logo_url
                ? <img src={team.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                : <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-black text-[11px]" style={{ background: primary + '22', color: primary }}>{team.name.slice(0, 2)}</div>
              }
              <span className="flex-1 font-black text-base text-white truncate" style={{ fontFamily: font }}>{team.name}</span>
              <span className="text-sm text-gray-400 w-16 text-right">{team.total_tournament_kills || 0} kills</span>
              <span className="font-black text-xl w-16 text-right" style={{ color: primary, fontFamily: font }}>{team.total_tournament_points || 0}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: KILL FEED
═══════════════════════════════════════════════ */
function KillFeedScreen({ killFeed, design }) {
  const recent = useMemo(() => [...(killFeed || [])].slice(0, 10), [killFeed]);
  const primary = d.acc(design); const font = d.font(design);
  return (
    <div className="flex h-full w-full flex-col justify-center px-16" style={{ background: d.bg(design) }}>
      <p className="mb-6 font-black text-2xl uppercase tracking-widest" style={{ color: primary, fontFamily: font }}>KILL FEED</p>
      <div className="space-y-3">
        {recent.length === 0 && <p className="text-gray-600">No kills recorded yet</p>}
        {recent.map((kill, i) => (
          <motion.div key={kill.id || i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 rounded-2xl border px-6 py-4"
            style={{ background: '#ffffff06', borderColor: '#ffffff10' }}>
            <Skull className="h-6 w-6 flex-shrink-0" style={{ color: primary }} />
            <span className="font-black text-xl" style={{ color: d.txt(design), fontFamily: font }}>{kill.killer_name}</span>
            <span className="text-gray-500 text-2xl">→</span>
            <span className="font-black text-xl" style={{ color: d.acc2(design), fontFamily: font }}>
              {kill.killed_player_name || '—'}
            </span>
            <span className="ml-auto text-sm text-gray-600">{kill.killer_team_name} vs {kill.killed_team_name}</span>
          </motion.div>
        ))}
      </div>
      <BrandingStrip design={design} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: ELIMINATION ALERT
═══════════════════════════════════════════════ */
function EliminationAlert({ eliminations, design }) {
  const latest = useMemo(() => {
    if (!eliminations?.length) return null;
    return [...eliminations].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }, [eliminations]);
  const primary = d.acc(design); const font = d.font(design);
  if (!latest) return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: d.bg(design) }}>
      <Skull className="h-24 w-24 opacity-10" style={{ color: d.acc2(design) }} />
    </div>
  );
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `radial-gradient(ellipse at 50% 50%, ${d.acc2(design)}18 0%, ${d.bg(design)} 65%)` }}>
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: 'spring' }} className="text-center">
        <motion.div animate={{ rotate: [0, -8, 8, -8, 0] }} transition={{ duration: 0.6, repeat: 2 }} className="mb-6 flex justify-center">
          <Skull className="h-28 w-28" style={{ color: d.acc2(design), filter: `drop-shadow(0 0 30px ${d.acc2(design)}cc)` }} />
        </motion.div>
        <div className="rounded-3xl border-4 px-20 py-10" style={{ borderColor: d.acc2(design), background: '#00000099', boxShadow: `0 0 80px ${d.acc2(design)}66` }}>
          <p className="mb-3 font-black text-base uppercase tracking-[0.5em]" style={{ color: d.acc2(design), fontFamily: font }}>ELIMINATED</p>
          <h2 className="font-black" style={{ fontSize: 80, color: d.txt(design), fontFamily: font, textShadow: `0 0 40px ${d.acc2(design)}88` }}>
            {latest.eliminated_player_name}
          </h2>
          {latest.eliminated_team_name && (
            <p className="mt-3 font-bold text-2xl" style={{ color: d.acc2(design), fontFamily: font }}>{latest.eliminated_team_name}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: TODAY'S MATCHES
═══════════════════════════════════════════════ */
function TodaysMatches({ tournament, design }) {
  const maps = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Bermuda', 'Kalahari'];
  const total = tournament?.total_matches || 6;
  const current = tournament?.current_match_number || 0;
  const primary = d.acc(design); const font = d.font(design);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: d.bg(design) }}>
      <div className="border-b px-12 py-8" style={{ borderColor: primary + '33' }}>
        <p className="font-black text-base uppercase tracking-widest mb-1" style={{ color: primary, fontFamily: font }}>TODAY'S MATCHES</p>
        <p className="font-black text-4xl" style={{ color: d.txt(design), fontFamily: font }}>{d.name(design)}</p>
      </div>
      <div className="flex-1 px-12 py-8">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: total }).map((_, i) => {
            const isDone = i < current;
            const isLive = i === current - 1;
            const mapName = maps[i] || 'Bermuda';
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl border p-6 text-center"
                style={{
                  borderColor: isLive ? primary + '88' : isDone ? primary + '33' : '#ffffff11',
                  background: isLive ? primary + '18' : isDone ? primary + '08' : '#ffffff06',
                  boxShadow: isLive ? `0 0 24px ${primary}44` : 'none',
                }}>
                <p className="font-black text-sm uppercase tracking-widest mb-2" style={{ color: primary + '88', fontFamily: font }}>
                  {d.game(design)} {i + 1}
                </p>
                <p className="font-black text-2xl mb-3" style={{ color: d.txt(design), fontFamily: font }}>{mapName}</p>
                {isLive && <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black" style={{ background: primary + '33', color: primary }}>● LIVE NOW</span>}
                {isDone && !isLive && <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black text-green-400 bg-green-500/10">✓ COMPLETE</span>}
                {!isDone && !isLive && <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-gray-600 bg-white/5">UPCOMING</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
      <BrandingStrip design={design} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: TEAMS TODAY
═══════════════════════════════════════════════ */
function TeamsToday({ teams, players, design }) {
  const primary = d.acc(design); const font = d.font(design);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: d.bg(design) }}>
      <div className="border-b px-12 py-6" style={{ borderColor: primary + '33' }}>
        <p className="font-black text-base uppercase tracking-widest mb-1" style={{ color: primary, fontFamily: font }}>COMPETING TEAMS</p>
        <p className="font-black text-3xl" style={{ color: d.txt(design), fontFamily: font }}>{d.name(design)} — {(teams || []).length} Teams</p>
      </div>
      <div className="flex-1 px-12 py-6 overflow-hidden">
        <div className="grid grid-cols-4 gap-4">
          {(teams || []).map((team, i) => {
            const tp = (players || []).filter(p => p.team_id === team.id);
            const color = TEAM_COLORS[i % TEAM_COLORS.length];
            return (
              <motion.div key={team.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border p-4" style={{ borderColor: color + '44', background: color + '0d' }}>
                <div className="flex items-center gap-3 mb-3">
                  {team.logo_url
                    ? <img src={team.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                    : <div className="flex h-10 w-10 items-center justify-center rounded-full font-black text-sm" style={{ background: color + '33', color }}>{team.name.slice(0, 2)}</div>
                  }
                  <p className="font-black text-sm text-white truncate" style={{ fontFamily: font }}>{team.name}</p>
                </div>
                <div className="space-y-1">
                  {tp.map(p => (
                    <p key={p.id} className="text-xs text-gray-400 truncate">{p.name}</p>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <BrandingStrip design={design} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: CASTERS
═══════════════════════════════════════════════ */
function CastersScreen({ design }) {
  const primary = d.acc(design); const font = d.font(design);
  const casters = [
    { role: 'PLAY-BY-PLAY', name: 'Add in Design Studio', handle: '@caster1' },
    { role: 'COLOR CASTER', name: 'Add in Design Studio', handle: '@caster2' },
    { role: 'HOST', name: 'Add in Design Studio', handle: '@host' },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: d.bg(design) }}>
      <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 font-black text-xl uppercase tracking-widest" style={{ color: primary, fontFamily: font }}>YOUR CASTERS</motion.p>
      <div className="flex gap-16">
        {(design?.casters || casters).map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="text-center">
            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-4 font-black text-3xl" style={{ borderColor: primary, background: primary + '22', color: primary }}>
              {(c.name || '?').slice(0, 1)}
            </div>
            <p className="font-black text-[11px] uppercase tracking-widest mb-1" style={{ color: primary + '88', fontFamily: font }}>{c.role}</p>
            <p className="font-black text-2xl text-white" style={{ fontFamily: font }}>{c.name}</p>
            <p className="text-sm text-gray-500">{c.handle}</p>
          </motion.div>
        ))}
      </div>
      <BrandingStrip design={design} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: UPCOMING MAP
═══════════════════════════════════════════════ */
function UpcomingMap({ tournament, design }) {
  const matchNum = (tournament?.current_match_number || 0) + 1;
  const maps = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra'];
  const mapName = maps[(matchNum - 1) % maps.length];
  const primary = d.acc(design); const font = d.font(design);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: `radial-gradient(ellipse at 50% 50%, ${primary}15 0%, ${d.bg(design)} 65%)` }}>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="mb-4 font-black text-xl uppercase tracking-widest" style={{ color: primary + '99', fontFamily: font }}>NEXT UP</motion.p>
      <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="mb-3 font-black text-2xl uppercase tracking-widest" style={{ color: primary, fontFamily: font }}>{d.game(design)} {matchNum}</motion.p>
      <motion.h1 initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
        style={{ fontSize: 180, fontFamily: font, color: d.txt(design), lineHeight: 1,
          textShadow: `0 0 60px ${primary}cc, 0 0 120px ${primary}44`,
          WebkitTextStroke: `2px ${primary}bb` }}>
        {mapName.toUpperCase()}
      </motion.h1>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6 }}
        className="mt-6 h-0.5 w-[600px]" style={{ background: `linear-gradient(to right, transparent, ${primary}, transparent)` }} />
      <BrandingStrip design={design} matchNum={matchNum} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: MVP
═══════════════════════════════════════════════ */
function MVPScreen({ overlayState, design }) {
  const name  = overlayState?.mvp_player_name || 'MVP';
  const team  = overlayState?.mvp_team_name   || '';
  const kills = overlayState?.mvp_kills       || 0;
  const primary = d.acc(design); const font = d.font(design);
  const particles = useMemo(() => Array.from({ length: 40 }, () => ({ left: Math.random() * 100, top: Math.random() * 100, delay: Math.random() * 3, size: 2 + Math.random() * 5 })), []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: `radial-gradient(ellipse at 50% 50%, ${primary}15 0%, ${d.bg(design)} 60%)` }}>
      {particles.map((p, i) => <div key={i} className="absolute rounded-full" style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, background: primary, animation: `float-particle 3s ease ${p.delay}s infinite`, opacity: 0.4 }} />)}
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: 'spring' }} className="relative z-10 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Star className="h-12 w-12" style={{ color: primary, filter: `drop-shadow(0 0 20px ${primary})` }} />
          <span className="font-black text-4xl tracking-[0.5em]" style={{ color: primary, fontFamily: font, textShadow: `0 0 30px ${primary}` }}>MVP</span>
          <Star className="h-12 w-12" style={{ color: primary, filter: `drop-shadow(0 0 20px ${primary})` }} />
        </div>
        <h1 style={{ fontSize: 120, fontFamily: font, color: d.txt(design), lineHeight: 1, textShadow: `0 0 40px ${primary}cc, 0 0 80px ${primary}55` }}>
          {name}
        </h1>
        {team && <p className="mt-4 font-bold text-3xl" style={{ color: primary + 'cc', fontFamily: font }}>{team}</p>}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Skull className="h-8 w-8" style={{ color: d.acc2(design) }} />
          <span className="font-black text-5xl" style={{ color: d.acc2(design), fontFamily: font }}>{kills}</span>
          <span className="text-2xl text-gray-400">KILLS</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCREEN: CHAMPIONS
═══════════════════════════════════════════════ */
function ChampionsScreen({ overlayState, teams, design }) {
  const sorted = useMemo(() => [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0)), [teams]);
  const teamName = overlayState?.champion_team_name || sorted[0]?.name || 'CHAMPION';
  const points   = overlayState?.champion_total_points || sorted[0]?.total_tournament_points || 0;
  const primary  = d.acc(design); const font = d.font(design);
  const confetti = useMemo(() => Array.from({ length: 80 }, () => ({
    left: Math.random() * 100, delay: Math.random() * 4, duration: 2 + Math.random() * 3,
    color: [primary, d.acc2(design), '#fbbf24', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 10,
  })), []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: d.bg(design) }}>
      {confetti.map((c, i) => <div key={i} className="absolute top-0" style={{ left: `${c.left}%`, width: c.size, height: c.size, background: c.color, animation: `confetti-fall ${c.duration}s linear ${c.delay}s infinite` }} />)}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 50%, ${primary}22 0%, transparent 60%)` }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, type: 'spring' }} className="relative z-10 text-center">
        <div className="mb-6 flex items-center justify-center gap-6">
          <Crown className="h-16 w-16" style={{ color: primary, filter: `drop-shadow(0 0 25px ${primary})` }} />
          <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ fontSize: 64, fontFamily: font, color: primary, textShadow: `0 0 40px ${primary}` }}>
            BOOYAH!
          </motion.span>
          <Crown className="h-16 w-16" style={{ color: primary, filter: `drop-shadow(0 0 25px ${primary})` }} />
        </div>
        <p className="mb-3 font-black text-base uppercase tracking-[0.5em] text-gray-400" style={{ fontFamily: font }}>TOURNAMENT CHAMPIONS</p>
        <h1 style={{ fontSize: 110, fontFamily: font, color: d.txt(design), lineHeight: 1, textShadow: `0 0 50px ${primary}88, 0 0 100px ${primary}33` }}>
          {teamName}
        </h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10" style={{ color: primary }} />
          <span className="font-black text-5xl" style={{ color: primary, fontFamily: font }}>{points}</span>
          <span className="text-2xl text-gray-400">POINTS</span>
        </div>
        {design?.logoUrl && <img src={design.logoUrl} alt="" className="mx-auto mt-8 h-16 object-contain" onError={e => e.target.style.display='none'} />}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN OVERLAY COMPONENT
═══════════════════════════════════════════════ */
export default function Overlay() {
  const { data, loading } = useOverlayData(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const upd = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  const screen = data?.overlay_state?.current_screen || 'setup_blank';
  const design = data?.design || {};

  const renderScreen = () => {
    if (!data) return <SetupBlank design={design} />;
    const { teams, players, current_match, kill_feed, eliminations, overlay_state, tournament } = data;
    switch (screen) {
      case 'pre_match_map':      return <PreMatchMap match={current_match} teams={teams} players={players} design={design} />;
      case 'ff_scoreboard':      return <FFScoreboard teams={teams} players={players} currentMatch={current_match} design={design} />;
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
      <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AnimatePresence mode="wait">
          <motion.div key={screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-full w-full">
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
