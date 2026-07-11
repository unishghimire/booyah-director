/**
 * OBS OVERLAY — Professional Free Fire Official Tournament Style
 * Broadcast Industry Standard
 * 
 * OBS SETUP: In OBS Browser Source, check 'Transparent background' and uncheck 'Shutdown source when not visible'
 */
import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Star, Crown, Zap } from 'lucide-react';

/* ── Design tokens helper ── */
const tok = {
  acc:  x => x?.accentColor  || '#f97316',
  acc2: x => x?.accentColor2 || '#00d4ff',
  bg:   x => x?.bgColor      || '#050814',
  txt:  x => x?.textColor    || '#ffffff',
  name: x => x?.tournamentName    || 'FF CHAMPIONSHIP',
  sub:  x => x?.tournamentSubtitle || 'GRAND FINALS',
  game: x => x?.gameLabel    || 'MATCH',
  font: x => {
    const f = x?.fontStyle || 'orbitron';
    if (f === 'rajdhani') return 'Rajdhani, sans-serif';
    if (f === 'impact')   return 'Impact, Arial Narrow, sans-serif';
    return 'Orbitron, sans-serif';
  },
};

const MAP_COLORS = {
  Bermuda: '#10b981',
  Kalahari: '#f59e0b',
  Purgatory: '#a855f7',
  Alpine: '#3b82f6',
  Nexterra: '#06b6d4'
};

/* ── Garena-style Header Bar (For Solid BG Screens) ── */
function FFHeader({ design, title, right }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  return (
    <div className="flex items-center justify-between px-6 py-3"
      style={{ 
        background: `linear-gradient(135deg, ${primary}22 0%, ${tok.bg(design)} 50%, ${cyan}22 100%)`, 
        borderBottom: `2px solid ${primary}` 
      }}>
      {/* Left logo */}
      <div className="flex items-center gap-2">
        {design?.logoUrl ? (
          <img src={design.logoUrl} alt="" className="h-6 object-contain" onError={e => e.target.style.display = 'none'} />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: primary + '33' }}>
            <Zap className="h-3.5 w-3.5" style={{ color: primary }} />
          </div>
        )}
        <span className="font-orbitron text-[11px] font-black tracking-wider" style={{ color: primary }}>GARENA ESPORTS</span>
      </div>
      {/* Center title */}
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-12" style={{ background: `linear-gradient(to right, transparent, ${primary})` }} />
        <span className="font-orbitron text-sm font-black tracking-widest text-white uppercase">{title || tok.name(design)}</span>
        <div className="h-[2px] w-12" style={{ background: `linear-gradient(to left, transparent, ${cyan})` }} />
      </div>
      {/* Right side banner */}
      <span className="font-orbitron text-[11px] font-black tracking-wider" style={{ color: cyan }}>
        {right || tok.sub(design)}
      </span>
    </div>
  );
}

/* ── HUD Bracket Box ── */
function Brackets({ design, children, className = '', style = {} }) {
  const c = tok.acc(design);
  const c2 = tok.acc2(design);
  return (
    <div className={`relative ${className}`} style={style}>
      {/* Top Left */}
      <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: c }} />
      {/* Top Right */}
      <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: c2 }} />
      {/* Bottom Left */}
      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: c2 }} />
      {/* Bottom Right */}
      <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: c }} />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   1. SETUP BLANK SCREEN (Pure transparent backdrop)
══════════════════════════════════════════════════ */
function SetupBlank() {
  return <div className="h-full w-full" style={{ background: 'transparent' }} />;
}

/* ══════════════════════════════════════════════════
   2. PRE-MATCH MAP INTRO (Solid BG)
══════════════════════════════════════════════════ */
function PreMatchMap({ match, teams, players, design }) {
  const mapName  = (match?.map_name || 'BERMUDA').toUpperCase();
  const matchNum = match?.match_number || 1;
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Animated technical background grids */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}22 1px, transparent 1px), linear-gradient(90deg, ${primary}22 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 40%, ${primary}1e, transparent 70%)` }} />

      <FFHeader design={design} title="MAP SELECTION" right={`${tok.game(design)} ${matchNum}`} />

      {/* Dramatic Map Presentation */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.p 
          initial={{ opacity: 0, y: -30 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 font-orbitron font-black uppercase tracking-[0.6em]"
          style={{ fontSize: 20, color: cyan }}>
          {tok.game(design)} {matchNum}
        </motion.p>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.5 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: 'spring', stiffness: 90, damping: 15 }}
          className="font-orbitron font-black tracking-wider leading-none"
          style={{ 
            fontSize: 140, 
            color: '#ffffff',
            textShadow: `0 0 40px ${primary}88, 0 0 80px ${primary}33`,
            WebkitTextStroke: `1px ${primary}`
          }}>
          {mapName}
        </motion.h1>

        <motion.div 
          initial={{ scaleX: 0 }} 
          animate={{ scaleX: 1 }} 
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 h-1 w-[600px]"
          style={{ background: `linear-gradient(to right, transparent, ${primary}, ${cyan}, transparent)` }} />
      </div>

      {/* Grid of registered teams */}
      {(teams || []).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
          className="grid grid-cols-6 gap-3 px-12 py-6 border-t"
          style={{ borderColor: `${primary}33`, background: `${tok.bg(design)}cc`, backdropFilter: 'blur(8px)' }}>
          {teams.map((team, i) => {
            const teamColor = [primary, cyan, '#a855f7', '#10b981', '#ef4444', '#eab308'][i % 6];
            return (
              <div key={team.id} className="flex items-center gap-3 rounded-lg border p-2"
                style={{ borderColor: `${teamColor}44`, background: `${teamColor}0c` }}>
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full font-black text-xs" style={{ background: `${teamColor}33`, color: teamColor }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-orbitron text-[11px] font-black truncate text-white uppercase">{team.name}</span>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   3. FF BOARD / SCOREBOARD (Transparent OBS Overlay)
   - sits on bottom-right of the screen (width 480px max)
   - semi-transparent backdrop with blur
   - compact heights (28-32px) to guarantee fit for 12 teams
══════════════════════════════════════════════════ */
function FFBoard({ teams, players, currentMatch, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);

  const rows = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
      .map((team, i) => {
        const tp = (players || []).filter(p => p.team_id === team.id);
        const alive = tp.filter(p => p.is_alive).length;
        const total = tp.length || 4;
        return {
          team, rank: i + 1, alive, total,
          kills: team.total_tournament_kills || 0,
          booyah: team.booyahs_count || 0,
          pts: team.total_tournament_points || 0,
          isOut: alive === 0 && tp.length > 0,
        };
      });
  }, [teams, players]);

  return (
    <div className="absolute right-6 bottom-6 flex flex-col overflow-hidden rounded-xl border border-orange-500/30"
      style={{ 
        background: 'rgba(5, 8, 20, 0.88)', 
        backdropFilter: 'blur(12px)',
        width: 460,
        maxHeight: 520
      }}>
      
      {/* Garena-style top Orange strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${primary}, ${cyan})` }} />

      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: `${primary}33` }}>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-orbitron text-[10px] font-black text-white uppercase tracking-wider">FF LIVE SCOREBOARD</span>
        </div>
        <span className="font-orbitron text-[9px] font-bold text-gray-400">
          {tok.game(design)} {currentMatch?.match_number || 1}
        </span>
      </div>

      {/* Column Titles */}
      <div className="flex items-center px-3 py-1 text-[8px] font-black tracking-widest text-gray-400 uppercase"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${primary}22` }}>
        <span className="w-8 text-center">#</span>
        <span className="w-7 text-center">LOGO</span>
        <span className="flex-1 pl-1">TEAM</span>
        <span className="w-12 text-center">KILLS</span>
        <span className="w-12 text-center">BOOYAH</span>
        <span className="w-12 text-center">PTS</span>
        <span className="w-14 text-center">ALIVE</span>
      </div>

      {/* Team Rows */}
      <div className="flex-1 overflow-y-auto space-y-[2px] p-1.5 scrollbar-none">
        {rows.map((row, idx) => {
          const isTop3 = row.rank <= 3;
          const isRank1 = row.rank === 1;
          
          return (
            <motion.div 
              key={row.team.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-center rounded-md px-2"
              style={{ 
                height: 30,
                background: row.isOut 
                  ? 'rgba(255,255,255,0.02)' 
                  : isRank1 
                    ? `linear-gradient(90deg, ${primary}22, rgba(5,8,20,0.5))` 
                    : isTop3 
                      ? 'rgba(255,255,255,0.06)' 
                      : 'rgba(0,0,0,0.25)',
                borderLeft: isRank1 
                  ? `2px solid ${primary}` 
                  : isTop3 
                    ? `2px solid ${cyan}` 
                    : '2px solid transparent',
                opacity: row.isOut ? 0.4 : 1,
                boxShadow: isRank1 ? `0 0 8px ${primary}1e` : 'none'
              }}>
              
              {/* Rank */}
              <span className="w-8 text-center font-orbitron text-xs font-black" 
                style={{ color: isRank1 ? primary : isTop3 ? cyan : '#9ca3af', fontFamily: font }}>
                {row.rank}
              </span>

              {/* Logo */}
              <div className="w-7 flex justify-center">
                {row.team.logo_url ? (
                  <img src={row.team.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full font-black text-[8px]" 
                    style={{ background: isTop3 ? `${primary}33` : 'rgba(255,255,255,0.1)', color: isTop3 ? primary : '#9ca3af' }}>
                    {row.team.name.slice(0,2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Team Name */}
              <span className="flex-1 pl-1 font-orbitron text-[10px] font-black uppercase text-white truncate" style={{ fontFamily: font }}>
                {row.team.name}
              </span>

              {/* Kills */}
              <span className="w-12 text-center font-orbitron text-[11px] font-black" style={{ color: cyan, fontFamily: font }}>
                {row.kills}
              </span>

              {/* Booyah */}
              <span className="w-12 text-center font-orbitron text-[11px] font-black text-amber-400" style={{ fontFamily: font }}>
                {row.booyah}
              </span>

              {/* Points */}
              <span className="w-12 text-center font-orbitron text-xs font-black text-white" style={{ fontFamily: font }}>
                {row.pts}
              </span>

              {/* Alive bars */}
              <div className="w-14 flex items-center justify-center gap-[2px]">
                {row.isOut ? (
                  <span className="font-orbitron text-[8px] font-black text-red-500/80">ELIM</span>
                ) : (
                  Array.from({ length: row.total }).map((_, i) => (
                    <div key={i} className="w-[3px] h-3 rounded-full" 
                      style={{ background: i < row.alive ? primary : 'rgba(255,255,255,0.15)' }} />
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   4. FULL STANDINGS / TOURNAMENT TABLE (Transparent OBS Overlay)
   - Wide centered elegant leaderboards overlay
══════════════════════════════════════════════════ */
function FullStandings({ teams, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const font    = tok.font(design);

  const sorted = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  }, [teams]);

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-2xl border"
      style={{ 
        background: 'rgba(5, 8, 20, 0.9)', 
        backdropFilter: 'blur(16px)',
        borderColor: `${primary}33`,
        width: 740,
        height: 640
      }}>
      
      {/* Highlight Top bar */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${primary}, ${cyan})` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: `${primary}22` }}>
        <div className="flex flex-col">
          <span className="font-orbitron text-sm font-black text-white uppercase tracking-widest">{tok.name(design)}</span>
          <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase">{tok.sub(design)}</span>
        </div>
        <div className="rounded border border-orange-500/40 bg-orange-500/10 px-3 py-1 font-orbitron text-xs font-black text-orange-400">
          OVERALL STANDINGS
        </div>
      </div>

      {/* Table Headers */}
      <div className="flex items-center px-6 py-2.5 text-[9px] font-black tracking-widest text-gray-400 uppercase"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${primary}22` }}>
        <span className="w-12 text-center">RANK</span>
        <span className="w-12 text-center">LOGO</span>
        <span className="flex-1 pl-4">TEAM NAME</span>
        <span className="w-24 text-center">TOTAL KILLS</span>
        <span className="w-24 text-center">BOOYAH</span>
        <span className="w-32 text-center">TOTAL POINTS</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1 p-3 scrollbar-none">
        {sorted.map((team, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const medalColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#b45309' : null;

          return (
            <motion.div key={team.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center rounded-lg px-4 py-2"
              style={{ 
                background: isTop3 ? `linear-gradient(90deg, ${primary}15, rgba(255,255,255,0.02))` : 'rgba(0,0,0,0.2)',
                border: isTop3 ? `1px solid ${primary}22` : '1px solid rgba(255,255,255,0.05)'
              }}>
              
              {/* Rank column with Medal Accents */}
              <div className="w-12 text-center flex items-center justify-center relative">
                {isTop3 && (
                  <div className="absolute left-0 w-1 h-5 rounded-full" style={{ background: medalColor }} />
                )}
                <span className="font-orbitron text-base font-black" style={{ color: medalColor || '#ffffff', fontFamily: font }}>
                  {rank}
                </span>
              </div>

              {/* Logo */}
              <div className="w-12 flex justify-center">
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" className="h-8 w-8 rounded-full object-cover border" style={{ borderColor: medalColor || '#ffffff22' }} onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full font-black text-[10px]" 
                    style={{ background: isTop3 ? `${primary}33` : 'rgba(255,255,255,0.1)', color: isTop3 ? primary : '#9ca3af' }}>
                    {team.name.slice(0,2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Team Name */}
              <div className="flex flex-1 pl-4 items-center">
                <span className="font-orbitron text-xs font-black uppercase text-white" style={{ fontFamily: font }}>
                  {team.name}
                </span>
              </div>

              {/* Kills */}
              <span className="w-24 text-center font-orbitron text-sm font-black" style={{ color: cyan, fontFamily: font }}>
                {team.total_tournament_kills || 0}
              </span>

              {/* Booyah (placement wins) */}
              <span className="w-24 text-center font-orbitron text-sm font-black text-amber-400" style={{ fontFamily: font }}>
                {team.booyahs_count || 0}
              </span>

              {/* Total points */}
              <span className="w-32 text-center font-orbitron text-base font-black text-white" style={{ fontFamily: font }}>
                {team.total_tournament_points || 0}
              </span>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   5. TODAY'S MATCHES (Solid BG)
══════════════════════════════════════════════════ */
function TodaysMatches({ tournament, design }) {
  const total   = tournament?.total_matches || 5;
  const current = tournament?.current_match_number || 0;
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const maps    = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra'];
  const times   = ['14:00', '15:15', '16:30', '17:45', '19:00'];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Background Grids */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}22 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

      <FFHeader design={design} title="TODAY'S SCHEDULE" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-center gap-6 px-12 py-10">
        {Array.from({ length: total }).map((_, i) => {
          const mapName = maps[i % maps.length];
          const matchTime = times[i] || 'TBD';
          const isDone  = i < current - 1;
          const isLive  = i === current - 1;
          const mapCol  = MAP_COLORS[mapName] || primary;

          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center flex-1">
              
              <Brackets design={design} className="w-full rounded-2xl border overflow-hidden"
                style={{ borderColor: isLive ? primary : 'rgba(255,255,255,0.08)', background: isLive ? 'rgba(5, 8, 20, 0.8)' : 'rgba(0,0,0,0.4)' }}>
                
                {/* Match title header */}
                <div className="border-b py-2 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-wider" style={{ color: isLive ? primary : '#9ca3af' }}>
                    {tok.game(design)} {i + 1}
                  </span>
                </div>

                {/* Map Name Icon Block */}
                <div className="flex flex-col items-center py-6 px-4">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2"
                    style={{ borderColor: `${mapCol}55`, background: `${mapCol}11`, boxShadow: isLive ? `0 0 15px ${mapCol}33` : 'none' }}>
                    <span className="font-orbitron text-[10px] font-black tracking-wider text-center" style={{ color: mapCol }}>
                      {mapName.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-orbitron text-xs font-black text-white uppercase tracking-widest">{mapName}</h3>
                </div>

                {/* Status bottom bar */}
                <div className="border-t py-2.5 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {isLive ? (
                    <span className="font-orbitron text-sm font-black text-red-500 animate-pulse tracking-widest uppercase">LIVE</span>
                  ) : (
                    <span className="font-orbitron text-xs font-bold text-gray-400">{matchTime}</span>
                  )}
                </div>
              </Brackets>

              {/* Status Badge below */}
              <div className="mt-3">
                {isLive && (
                  <span className="rounded-full bg-red-500/10 border border-red-500/40 px-3 py-1 text-[9px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                    LIVE NOW
                  </span>
                )}
                {isDone && (
                  <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-[9px] font-black text-green-400 uppercase tracking-widest">
                    COMPLETED
                  </span>
                )}
                {!isDone && !isLive && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    UPCOMING
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   6. MEET THE TEAMS SCREEN (Solid BG)
══════════════════════════════════════════════════ */
function TeamsToday({ teams, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const colors  = [primary, cyan, '#a855f7', '#10b981', '#ef4444', '#eab308'];

  const rows = useMemo(() => {
    const list = teams || [];
    const mid = Math.ceil(list.length / 2);
    return [list.slice(0, mid), list.slice(mid)];
  }, [teams]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}33 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '70px 70px' }} />

      <FFHeader design={design} title="PARTICIPATING TEAMS" right={tok.name(design)} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-16">
        
        {/* Row 1 */}
        <div className="flex flex-wrap items-center justify-center gap-10">
          {rows[0].map((team, idx) => {
            const hue = colors[idx % colors.length];
            return (
              <motion.div key={team.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, delay: idx * 0.05 }}
                className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-20" style={{ background: hue, filter: 'blur(8px)' }} />
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" className="relative h-20 w-20 rounded-full object-cover border-2" style={{ borderColor: hue }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 font-orbitron text-xl font-black"
                      style={{ borderColor: hue, background: `${hue}22`, color: hue }}>
                      {team.name.slice(0,2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-orbitron text-[10px] font-black text-white uppercase tracking-wider text-center w-24 truncate">
                  {team.name}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Divider styling */}
        <div className="flex items-center gap-6 w-full max-w-[800px]">
          <div className="h-[1px] flex-1" style={{ background: `linear-gradient(to right, transparent, ${primary})` }} />
          <span className="font-orbitron text-xs font-black text-white tracking-[0.4em] uppercase">MEET THE TEAMS</span>
          <div className="h-[1px] flex-1" style={{ background: `linear-gradient(to left, transparent, ${cyan})` }} />
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center justify-center gap-10">
          {rows[1].map((team, idx) => {
            const hue = colors[(idx + rows[0].length) % colors.length];
            return (
              <motion.div key={team.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, delay: (idx + rows[0].length) * 0.05 }}
                className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-20" style={{ background: hue, filter: 'blur(8px)' }} />
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" className="relative h-20 w-20 rounded-full object-cover border-2" style={{ borderColor: hue }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 font-orbitron text-xl font-black"
                      style={{ borderColor: hue, background: `${hue}22`, color: hue }}>
                      {team.name.slice(0,2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-orbitron text-[10px] font-black text-white uppercase tracking-wider text-center w-24 truncate">
                  {team.name}
                </span>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   7. CASTERS SCREEN (Solid BG)
══════════════════════════════════════════════════ */
function CastersScreen({ design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const casters = design?.casters || [
    { name: 'SPECTRE', handle: '@spectre_ff', role: 'PLAY-BY-PLAY' },
    { name: 'CYPHER', handle: '@cypher_esports', role: 'COLOR COMMENTATOR' },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Visual backdrop grids */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="CASTER TALENT" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-center gap-10 px-16">
        {casters.slice(0, 2).map((caster, idx) => {
          const mainCol = idx === 0 ? primary : cyan;
          return (
            <motion.div key={idx}
              initial={{ opacity: 0, x: idx === 0 ? -100 : 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col w-[480px]">
              
              <Brackets design={idx === 0 ? design : { ...design, accentColor: cyan, accentColor2: primary }}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: `${mainCol}44`, background: 'rgba(0,0,0,0.5)' }}>
                
                {/* Simulated live feed camera screen */}
                <div className="relative flex flex-col items-center justify-center py-10"
                  style={{ background: `linear-gradient(135deg, rgba(5,8,20,0.9), ${mainCol}1e)`, minHeight: 260 }}>
                  
                  {/* Camera hud elements */}
                  <div className="absolute left-6 top-6 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-mono text-[9px] text-gray-500 tracking-wider">REC</span>
                  </div>
                  <div className="absolute right-6 top-6 text-gray-500 font-mono text-[9px]">
                    1080p HD
                  </div>

                  {/* Avatar box icon */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2"
                    style={{ borderColor: mainCol, background: `${mainCol}1a` }}>
                    <span className="font-orbitron text-2xl font-black" style={{ color: mainCol }}>
                      {(caster.name || '?').slice(0, 1)}
                    </span>
                  </div>

                  {/* Role label badge */}
                  <div className="absolute bottom-4 right-4 rounded border px-2 py-1 text-[8px] font-black uppercase tracking-widest"
                    style={{ borderColor: `${mainCol}44`, background: 'rgba(0,0,0,0.8)', color: mainCol }}>
                    {caster.role || (idx === 0 ? 'HOST / DESK' : 'ANALYSIS')}
                  </div>
                </div>

                {/* Presenter Name Banner */}
                <div className="px-6 py-4 border-t" style={{ borderColor: `${mainCol}33`, background: 'rgba(5, 8, 20, 0.95)' }}>
                  <h4 className="font-orbitron text-base font-black text-white uppercase tracking-wider">{caster.name}</h4>
                  <p className="font-mono text-xs mt-0.5" style={{ color: mainCol }}>{caster.handle}</p>
                </div>

              </Brackets>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   8. UPCOMING MAP SCREEN (Solid BG)
══════════════════════════════════════════════════ */
function UpcomingMap({ tournament, design }) {
  const [secs, setSecs] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => setSecs(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  const matchNum = (tournament?.current_match_number || 0) + 1;
  const maps     = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra'];
  const mapName  = maps[(matchNum - 1) % maps.length];
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);
  const mapCol   = MAP_COLORS[mapName] || primary;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: `linear-gradient(${primary}44 1px, transparent 1px), linear-gradient(90deg, ${cyan}22 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="UPCOMING MATCH INFO" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-between px-20">
        
        {/* Left Side: Countdown Map presentation */}
        <div className="flex flex-col items-start justify-center flex-1">
          <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="font-orbitron font-black text-xs uppercase tracking-[0.4em]" style={{ color: cyan }}>
            {tok.game(design)} {matchNum} — PREPARING
          </motion.p>
          <motion.h1 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="font-orbitron font-black text-7xl mt-2 leading-none uppercase"
            style={{ 
              color: '#ffffff',
              textShadow: `0 0 40px ${mapCol}88`,
              WebkitTextStroke: `1px ${mapCol}`
            }}>
            {mapName}
          </motion.h1>
          
          <span className="font-orbitron text-[10px] font-black uppercase text-gray-500 tracking-widest mt-8">
            MATCH COMENCING IN
          </span>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="mt-2 rounded-xl border px-8 py-3 bg-black/60"
            style={{ borderColor: `${primary}55`, boxShadow: `0 0 20px ${primary}22` }}>
            <span className="font-orbitron text-5xl font-black text-white tracking-widest">
              {mm}:{ss}
            </span>
          </motion.div>
        </div>

        {/* Right Side: Map HUD representation */}
        <div className="flex items-center justify-center flex-1">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Brackets design={design} className="p-8 rounded-2xl border" style={{ borderColor: `${mapCol}55`, background: `${mapCol}05` }}>
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl border bg-black/40" style={{ borderColor: `${mapCol}33` }}>
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2" style={{ borderColor: mapCol, background: `${mapCol}11` }}>
                  <span className="font-orbitron text-[11px] font-black text-center" style={{ color: mapCol }}>
                    {mapName.toUpperCase()}
                  </span>
                </div>
                <p className="mt-4 font-orbitron text-[10px] font-bold text-gray-500 uppercase tracking-widest">MAP SECTOR</p>
              </div>
            </Brackets>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   9. KILL FEED (Transparent OBS Overlay)
   - Bottom-left corner elegant HUD feed
   - Holds maximum of 5 recent logs
══════════════════════════════════════════════════ */
function KillFeedScreen({ killFeed, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const recent = useMemo(() => {
    return [...(killFeed || [])].slice(0, 5);
  }, [killFeed]);

  return (
    <div className="absolute left-6 bottom-6 flex flex-col gap-1.5"
      style={{ width: 360, background: 'transparent' }}>
      
      <AnimatePresence>
        {recent.map((kill, i) => (
          <motion.div key={kill.id || i}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="flex items-center gap-3 rounded-lg border px-3 py-1.5"
            style={{ 
              background: 'rgba(5, 8, 20, 0.82)', 
              borderColor: `${primary}33`,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
            
            <Skull className="h-4.5 w-4.5 flex-shrink-0 text-red-500 animate-pulse" />
            
            {/* Killer */}
            <span className="font-orbitron text-[10px] font-black text-white uppercase truncate max-w-[100px]">
              {kill.killer_name}
            </span>

            {/* Weapon / Icon */}
            <div className="flex flex-1 justify-center items-center">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500 to-red-500/20" />
              <span className="mx-1 px-1.5 py-0.5 rounded bg-red-600/20 text-[8px] font-black text-red-400 font-mono">
                {kill.weapon || 'ELIM'}
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-orange-500 to-red-500/20" />
            </div>

            {/* Victim */}
            <span className="font-orbitron text-[10px] font-black text-red-400 uppercase truncate max-w-[100px]">
              {kill.killed_player_name || 'PLAYER'}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   10. ELIMINATION ALERT (Full Screen dramatic Overlay)
══════════════════════════════════════════════════ */
function EliminationAlert({ eliminations, design }) {
  const latest = useMemo(() => {
    if (!eliminations?.length) return null;
    return [...eliminations].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }, [eliminations]);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timeout);
  }, [latest]);

  if (!latest || !visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, rgba(0,0,0,0.85) 80%)' }}>
      
      <motion.div 
        initial={{ scale: 0.3, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.5, opacity: 0 }}
        className="flex flex-col items-center">
        
        {/* Animated skull */}
        <motion.div 
          animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.05, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mb-4">
          <Skull className="h-24 w-24 text-red-500" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.8))' }} />
        </motion.div>

        {/* HUD Box text alert */}
        <Brackets design={{ ...design, accentColor: '#ef4444', accentColor2: '#ef4444' }}
          className="rounded-2xl border-2 px-12 py-6 text-center"
          style={{ borderColor: '#ef4444', background: 'rgba(5, 8, 20, 0.95)', boxShadow: '0 0 40px rgba(239,68,68,0.3)' }}>
          <span className="font-orbitron text-xs font-black uppercase tracking-[0.5em] text-red-500">
            TEAM ELIMINATED
          </span>
          <h2 className="font-orbitron text-3xl font-black text-white uppercase tracking-wider mt-1">
            {latest.eliminated_team_name || latest.eliminated_player_name || 'SPECTATOR'}
          </h2>
        </Brackets>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   11. MVP SCREEN (Solid BG)
══════════════════════════════════════════════════ */
function MVPScreen({ overlayState, design }) {
  const name   = overlayState?.mvp_player_name || 'SPECTRE';
  const team   = overlayState?.mvp_team_name   || 'ALPHA CLAN';
  const kills  = overlayState?.mvp_kills       || 8;
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: tok.bg(design) }}>
      
      {/* Dynamic tech grids */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}22 1px, transparent 1px), linear-gradient(90deg, ${cyan}11 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <FFHeader design={design} title="MOST VALUABLE PLAYER" right={tok.name(design)} />

      <div className="flex flex-1 items-center justify-center gap-16 px-20">
        
        {/* Left portrait card frame */}
        <Brackets design={design} className="rounded-2xl border-2 overflow-hidden w-72" style={{ borderColor: `${primary}44` }}>
          <div className="flex flex-col items-center justify-center p-8 bg-black/50" style={{ minHeight: 320 }}>
            {/* Player Frame placeholder */}
            <div className="flex h-28 w-28 items-center justify-center rounded-xl border-2 mb-4"
              style={{ borderColor: primary, background: `${primary}11`, boxShadow: `0 0 20px ${primary}33` }}>
              <Star className="h-10 w-10 text-orange-500 animate-pulse" />
            </div>
            {/* Details */}
            <div className="border-t pt-3 w-full text-center" style={{ borderColor: `${primary}22` }}>
              <h3 className="font-orbitron text-base font-black text-white uppercase tracking-wider truncate">{name}</h3>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">{team}</p>
            </div>
          </div>
        </Brackets>

        {/* Right MVP giant texts + stats */}
        <div className="flex flex-col items-start">
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3">
            <span className="font-orbitron text-7xl font-black text-orange-500 tracking-wider uppercase"
              style={{ textShadow: `0 0 30px ${primary}aa` }}>
              MVP
            </span>
          </motion.div>

          <span className="font-orbitron text-[10px] font-black tracking-widest text-gray-500 uppercase mt-4 mb-2">
            MATCH STATISTICS
          </span>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-10">
            {[
              { label: 'KILLS', value: kills },
              { label: 'DAMAGE', value: '1,450' },
              { label: 'HEADSHOTS', value: '3' }
            ].map((st, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-gray-500 text-[9px] font-bold tracking-widest uppercase">{st.label}</span>
                <span className="font-orbitron text-2xl font-black text-white mt-1">{st.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   12. BOOYAH / CHAMPIONS (Solid BG)
══════════════════════════════════════════════════ */
function ChampionsScreen({ overlayState, teams, design }) {
  const sorted   = useMemo(() => [...(teams||[])].sort((a,b)=>(b.total_tournament_points||0)-(a.total_tournament_points||0)),[teams]);
  const teamName = overlayState?.champion_team_name || sorted[0]?.name || 'CHAMPION';
  const teamTag  = sorted[0]?.name?.toUpperCase().slice(0,3) || 'WIN';
  const points   = overlayState?.champion_total_points || sorted[0]?.total_tournament_points || 0;
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden" style={{ background: tok.bg(design) }}>
      {/* Glow aura */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle, ${primary}33 0%, ${tok.bg(design)} 75%)` }} />

      <FFHeader design={design} title="VICTORY ROYAL" right={tok.name(design)} />

      <div className="relative flex flex-col items-center" style={{ marginTop: 20 }}>
        {/* Crown Icon */}
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Crown className="h-16 w-16 text-yellow-500" style={{ filter: `drop-shadow(0 0 15px ${primary})` }} />
        </motion.div>

        {/* Dramatic BOOYAH! title */}
        <motion.h1 
          initial={{ scale: 0.4, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ type: 'spring', stiffness: 80, delay: 0.1 }}
          className="font-orbitron font-black text-8xl mt-1 tracking-widest"
          style={{ 
            color: primary,
            textShadow: `0 0 40px ${primary}, 0 0 80px rgba(0,0,0,0.5)`,
            WebkitTextStroke: `2px ${cyan}`
          }}>
          BOOYAH!
        </motion.h1>

        {/* Champion Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="mt-6 flex w-[500px] items-center gap-4 rounded-xl border-2 px-6 py-3 bg-black/80"
          style={{ borderColor: `${primary}44`, boxShadow: `0 0 30px ${primary}22` }}>
          
          {sorted[0]?.logo_url ? (
            <img src={sorted[0].logo_url} alt="" className="h-10 w-10 rounded-full object-cover" onError={e => e.target.style.display = 'none'} />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-orange-500/20 font-black text-sm text-orange-500">
              {teamTag}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-orbitron text-lg font-black text-white uppercase truncate">{teamName}</h3>
            <p className="text-gray-500 text-[9px] font-bold tracking-wider uppercase">MATCH CHAMPIONS</p>
          </div>

          <div className="text-right">
            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">KILLS</span>
            <p className="font-orbitron text-base font-black text-white">{sorted[0]?.total_tournament_kills || 0}</p>
          </div>

          <div className="text-right pl-4 border-l border-white/10">
            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">PTS</span>
            <p className="font-orbitron text-base font-black" style={{ color: primary }}>{points}</p>
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
    const resizeHandler = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  const screen = data?.overlay_state?.current_screen || 'setup_blank';
  const design = data?.design || {};
  const { teams, players, current_match, kill_feed, eliminations, overlay_state, tournament } = data || {};

  const isTransparent = ['setup_blank', 'ff_scoreboard', 'scoreboard', 'kill_feed'].includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'pre_match_map':      return <PreMatchMap match={current_match} teams={teams} players={players} design={design} />;
      case 'ff_scoreboard':      return <FFBoard teams={teams} players={players} currentMatch={current_match} design={design} />;
      case 'scoreboard':         return <FullStandings teams={teams} design={design} />;
      case 'kill_feed':          return <KillFeedScreen killFeed={kill_feed} design={design} />;
      case 'elimination_alert':  return <EliminationAlert eliminations={eliminations} design={design} />;
      case 'todays_matches':     return <TodaysMatches tournament={tournament} design={design} />;
      case 'teams_today':        return <TeamsToday teams={teams} design={design} />;
      case 'casters':            return <CastersScreen design={design} />;
      case 'upcoming_map':       return <UpcomingMap tournament={tournament} design={design} />;
      case 'mvp':                return <MVPScreen overlayState={overlay_state} design={design} />;
      case 'champions':          return <ChampionsScreen overlayState={overlay_state} teams={teams} design={design} />;
      default:                   return <SetupBlank />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" 
      style={{ background: isTransparent ? 'transparent' : 'black' }}>
      <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={screen} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.3 }} 
            className="relative h-full w-full"
            style={{ background: 'transparent' }}>
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
