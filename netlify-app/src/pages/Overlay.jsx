import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Star, Crown, Zap, Video, Calendar, Users, MapPin, Award } from 'lucide-react';

/* ── Design tokens helper ── */
const tok = {
  acc:  x => x?.accentColor  || '#f97316',
  acc2: x => x?.accentColor2 || '#00d4ff',
  bg:   x => x?.bgColor      || '#060915',
  txt:  x => x?.textColor    || '#ffffff',
  name: x => x?.tournamentName    || 'BOOYAH CUP',
  sub:  x => x?.tournamentSubtitle || 'GRAND FINALS',
  game: x => x?.gameLabel    || 'GAME',
  font: x => {
    const f = x?.fontStyle || 'orbitron';
    if (f === 'rajdhani') return 'Rajdhani, sans-serif';
    if (f === 'impact')   return 'Impact, Arial Narrow, sans-serif';
    return 'Orbitron, sans-serif';
  },
};

const carbonFiberBg = `repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px), #060915`;

/* ── Garena-style Header Bar (For Solid BG Screens) ── */
function FFHeader({ design, title, right }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  return (
    <div className="relative flex h-14 w-full items-center justify-between px-6"
      style={{ 
        background: 'rgba(0,0,0,0.6)', 
        borderBottom: `1px solid ${primary}4d` 
      }}>
      {/* Left logo / Garena G */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/30" style={{ background: `radial-gradient(circle, ${primary}33 0%, transparent 100%)` }}>
          <span className="font-orbitron text-base font-black text-white" style={{ color: primary }}>G</span>
        </div>
        <div className="flex flex-col">
          <span className="font-orbitron text-[11px] font-black tracking-[0.2em] text-white">GARENA ESPORTS</span>
          <span className="font-orbitron text-[8px] font-bold tracking-[0.1em] text-gray-400">OFFICIAL PARTNER</span>
        </div>
      </div>
      {/* Center title */}
      <div className="flex items-center gap-4">
        <div className="h-[1px] w-16" style={{ background: `linear-gradient(to right, transparent, ${primary})` }} />
        <span className="font-orbitron text-base font-black tracking-[0.3em] text-white uppercase">{title || tok.name(design)}</span>
        <div className="h-[1px] w-16" style={{ background: `linear-gradient(to left, transparent, ${cyan})` }} />
      </div>
      {/* Right side banner */}
      <div className="flex flex-col items-end">
        <span className="font-orbitron text-xs font-black tracking-[0.2em]" style={{ color: primary }}>
          {right || tok.sub(design)}
        </span>
      </div>
      {/* Orange LED strip on very bottom */}
      <div className="absolute bottom-0 left-0 h-[1px] w-full" style={{ background: `linear-gradient(90deg, ${primary}, transparent, ${primary})` }} />
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
   2. FF BOARD / SCOREBOARD (Transparent OBS Overlay)
══════════════════════════════════════════════════ */
function FFBoard({ teams, players, currentMatch, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const matchNum = currentMatch?.match_number || 1;

  const rows = useMemo(() => {
    return [...(teams || [])]
      .sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
      .slice(0, 12)
      .map((team, i) => {
        const teamPlayers = (players || []).filter(p => p.team_id === team.id);
        const aliveCount = teamPlayers.filter(p => p.is_alive).length;
        const totalCount = teamPlayers.length || 4;
        return {
          team,
          rank: i + 1,
          alive: aliveCount,
          total: totalCount,
          kills: team.total_tournament_kills || 0,
          booyah: team.booyahs_count || 0,
          pts: team.total_tournament_points || 0,
          isOut: aliveCount === 0 && teamPlayers.length > 0,
        };
      });
  }, [teams, players]);

  return (
    <div className="absolute right-6 top-1/2 w-[420px] -translate-y-1/2 flex flex-col overflow-hidden rounded-lg"
      style={{ 
        background: 'rgba(5, 8, 20, 0.92)', 
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 0 60px rgba(249,115,22,0.08), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(249,115,22,0.3)`
      }}>
      
      {/* Top LED accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${primary}, ${cyan})` }} />

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          {design?.logoUrl ? (
            <img src={design.logoUrl} alt="" className="h-4 object-contain" />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500/20">
              <Zap className="h-2.5 w-2.5" style={{ color: primary }} />
            </div>
          )}
          <span className="font-orbitron text-[9px] font-black tracking-[0.3em] text-white">
            {tok.name(design).toUpperCase()}
          </span>
        </div>
        <span className="font-orbitron text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: primary }}>
          GAME {matchNum}
        </span>
      </div>

      {/* Column Titles */}
      <div className="grid grid-cols-[30px_35px_1fr_40px_40px_50px_40px] items-center px-4 py-1 text-[10px] font-black tracking-[0.15em] text-white/35 uppercase border-b border-white/5 bg-black/20">
        <div>#</div>
        <div>LOGO</div>
        <div>TEAM</div>
        <div className="text-right">K</div>
        <div className="text-right">BP</div>
        <div className="text-right">PTS</div>
        <div className="text-center">HP</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {rows.map((row, idx) => {
          const isTop3 = row.rank <= 3;
          const leftBarColor = row.rank === 1 ? '#fbbf24' : row.rank === 2 ? '#94a3b8' : row.rank === 3 ? '#b45309' : null;
          
          return (
            <motion.div 
              key={row.team.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: row.isOut ? 0.45 : 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="grid grid-cols-[30px_35px_1fr_40px_40px_50px_40px] items-center px-4 h-7 border-b border-white/5 relative"
              style={{
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                borderLeft: leftBarColor ? `3px solid ${leftBarColor}` : 'none',
                boxShadow: row.rank === 1 ? `inset 2px 0 0 ${primary}` : undefined
              }}
            >
              {/* Rank */}
              <div className="font-orbitron text-xs font-bold text-white/80">{row.rank}</div>
              
              {/* Team Logo / Initials */}
              <div>
                {row.team.logo_url ? (
                  <img src={row.team.logo_url} alt="" className="h-[18px] w-[18px] rounded-full object-cover" />
                ) : (
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-black text-white" style={{ background: primary }}>
                    {row.team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Team Name */}
              <div className="font-orbitron text-xs font-black truncate uppercase text-white tracking-wide">
                {row.team.name}
              </div>

              {/* Kills */}
              <div className="font-mono text-xs text-right font-bold" style={{ color: row.kills > 0 ? primary : 'rgba(255,255,255,0.6)' }}>
                {row.kills}
              </div>

              {/* Booyah / Placement points */}
              <div className="font-mono text-xs text-right font-bold" style={{ color: cyan }}>
                {row.booyah}
              </div>

              {/* Total points */}
              <div className="font-orbitron text-xs text-right font-black text-white">
                {row.pts}
              </div>

              {/* Status / Health bars */}
              <div className="flex justify-center gap-[2px]">
                {[...Array(4)].map((_, bIdx) => {
                  const active = bIdx < row.alive;
                  return (
                    <div 
                      key={bIdx} 
                      className="w-[3px] rounded-sm transition-all"
                      style={{ 
                        height: active ? 14 : 7,
                        background: active ? primary : 'rgba(255,255,255,0.1)'
                      }} 
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-center h-6 bg-black/40 border-t border-white/5">
        <span className="font-orbitron text-[8px] font-black tracking-[0.2em] flex items-center gap-1.5" style={{ color: primary }}>
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          ● LIVE
          <span className="text-white/60">|</span>
          <span className="text-white uppercase">{(currentMatch?.map_name || 'Bermuda')}</span>
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   3. SCOREBOARD / OVERALL STANDINGS (Transparent OBS Overlay)
══════════════════════════════════════════════════ */
function FullStandings({ teams, players, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  const rows = useMemo(() => {
    return [...(teams || [])]
      .sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
      .map((team, i) => {
        const teamPlayers = (players || []).filter(p => p.team_id === team.id);
        const alive = teamPlayers.filter(p => p.is_alive).length;
        return {
          team,
          rank: i + 1,
          kills: team.total_tournament_kills || 0,
          booyahs: team.booyahs_count || 0,
          points: team.total_tournament_points || 0,
          isOut: alive === 0 && teamPlayers.length > 0,
        };
      });
  }, [teams, players]);

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] max-h-[680px] flex flex-col overflow-hidden rounded-xl"
      style={{ 
        background: 'rgba(5, 8, 20, 0.92)', 
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)`
      }}>
      
      {/* Top gradient line */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${primary}, ${cyan}, ${primary})` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-yellow-500" />
          <div className="flex flex-col">
            <span className="font-orbitron text-lg font-black tracking-[0.2em] text-white">OVERALL STANDINGS</span>
            <span className="font-orbitron text-[10px] tracking-[0.15em] text-white/40 uppercase">TOURNAMENT LEADERS</span>
          </div>
        </div>
        <span className="font-orbitron text-xs font-bold tracking-[0.15em] text-white/60">
          {tok.name(design).toUpperCase()}
        </span>
      </div>

      {/* Columns Header */}
      <div className="grid grid-cols-[50px_60px_1fr_100px_100px_120px] items-center px-6 py-2 text-xs font-black tracking-[0.15em] text-white/35 uppercase border-b border-white/5 bg-black/40">
        <div>RANK</div>
        <div>LOGO</div>
        <div>TEAM</div>
        <div className="text-right">KILLS</div>
        <div className="text-right">BOOYAH</div>
        <div className="text-right">TOTAL PTS</div>
      </div>

      {/* Rows Container */}
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 460 }}>
        {rows.map((row, idx) => {
          const isTop3 = row.rank <= 3;
          const metalColor = row.rank === 1 ? '#fbbf24' : row.rank === 2 ? '#94a3b8' : row.rank === 3 ? '#b45309' : null;

          return (
            <motion.div
              key={row.team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="grid grid-cols-[50px_60px_1fr_100px_100px_120px] items-center px-6 h-8 border-b border-white/5 relative"
              style={{
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                borderLeft: metalColor ? `4px solid ${metalColor}` : 'none',
                boxShadow: row.rank === 1 ? `inset 0 0 20px rgba(251,191,36,0.05)` : undefined
              }}
            >
              {/* Rank */}
              <div className="font-orbitron text-sm font-black text-white/80">{row.rank}</div>

              {/* Logo */}
              <div>
                {row.team.logo_url ? (
                  <img src={row.team.logo_url} alt="" className="h-6 w-6 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: primary }}>
                    {row.team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Team Name */}
              <div className="font-orbitron text-sm font-black text-white uppercase tracking-wider">
                {row.team.name}
              </div>

              {/* Kills */}
              <div className="font-mono text-sm text-right font-bold text-white/80">{row.kills}</div>

              {/* Booyahs */}
              <div className="font-mono text-sm text-right font-bold" style={{ color: cyan }}>{row.booyahs}</div>

              {/* Total points */}
              <div className="font-orbitron text-sm text-right font-black text-white" style={{ color: isTop3 ? metalColor : '#ffffff' }}>
                {row.points}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   4. KILL FEED (Transparent OBS Overlay)
══════════════════════════════════════════════════ */
function KillFeedScreen({ killFeed, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  return (
    <div className="absolute left-6 bottom-20 w-[340px] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {(killFeed || []).slice(0, 5).map((kill, i) => {
          const ageOpacity = 1 - (i * 0.12);
          return (
            <motion.div
              key={kill.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: ageOpacity, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              className="flex items-center justify-between h-9 px-3 rounded-md border border-white/5 relative overflow-hidden"
              style={{
                background: 'rgba(6, 9, 21, 0.85)',
                backdropFilter: 'blur(12px)',
                boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
              }}
            >
              {/* Left design glow border */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: `linear-gradient(to bottom, ${primary}, ${cyan})` }} />

              {/* Killer Info */}
              <div className="font-orbitron text-xs font-black truncate max-w-[120px] uppercase" style={{ color: primary }}>
                {kill.killer_name}
              </div>

              {/* Weapon icon / Crosshair */}
              <div className="flex items-center gap-1 opacity-60">
                <Skull className="h-3.5 w-3.5 text-white/40" />
                <span className="font-mono text-[9px] text-white/40">🎯</span>
              </div>

              {/* Victim Info */}
              <div className="font-orbitron text-xs italic font-bold truncate max-w-[120px] uppercase text-white/50">
                {kill.killed_player_name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   5. PRE MATCH MAP (Solid BG)
══════════════════════════════════════════════════ */
function PreMatchMap({ match, teams, design }) {
  const mapName  = (match?.map_name || 'BERMUDA').toUpperCase();
  const matchNum = match?.match_number || 1;
  const primary  = tok.acc(design);
  const cyan     = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      {/* Background Grids and Glows */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 1200px 800px at 50% 40%, ${primary}18, transparent)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)` }} />

      <FFHeader design={design} title="PRE-MATCH BRIEF" right={`${tok.game(design)} ${matchNum}`} />

      {/* Center Hero Panel */}
      <div className="flex flex-1 flex-col items-center justify-center relative">
        <motion.p 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="font-orbitron text-[13px] font-black uppercase tracking-[0.5em]"
          style={{ color: cyan }}>
          UPCOMING MAP
        </motion.p>
        
        <span className="font-orbitron text-xs font-black tracking-[0.3em] text-white/30 uppercase mt-1">
          {tok.game(design)} {matchNum}
        </span>

        <motion.div 
          initial={{ scaleX: 0 }} 
          animate={{ scaleX: 1 }} 
          className="h-[1px] w-[300px] my-4"
          style={{ background: `linear-gradient(to right, transparent, ${primary}, transparent)` }}
        />

        <motion.h1 
          initial={{ opacity: 0, scale: 0.7 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          className="font-orbitron font-black leading-none text-white tracking-widest"
          style={{ 
            fontSize: 160, 
            textShadow: `0 0 80px ${primary}cc, 0 0 160px ${primary}33`,
            WebkitTextStroke: `1px rgba(249,115,22,0.5)`
          }}>
          {mapName}
        </motion.h1>

        <p className="font-orbitron text-[11px] tracking-[0.4em] text-white/40 uppercase mt-4">
          BATTLE ROYALE MODE
        </p>
      </div>

      {/* Bottom Participation strip */}
      <div className="h-24 w-full bg-black/70 border-t border-white/10 px-8 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-orbitron text-xs font-black tracking-[0.2em]" style={{ color: primary }}>PARTICIPANTS</span>
          <span className="font-orbitron text-[10px] text-white/40 tracking-[0.1em] uppercase">{(teams || []).length} TEAMS COMPETING</span>
        </div>
        <div className="flex items-center gap-2">
          {(teams || []).slice(0, 12).map((team, idx) => (
            <div key={team.id} className="relative group">
              {team.logo_url ? (
                <img src={team.logo_url} alt="" className="h-10 w-10 rounded-full object-cover border border-white/20 hover:scale-110 transition-transform" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-black text-white border border-white/20" style={{ background: primary }}>
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   6. TODAYS MATCHES (Solid BG)
══════════════════════════════════════════════════ */
function TodaysMatches({ matches, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      {/* Visual Depth Background */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 1200px 800px at 50% 40%, ${cyan}15, transparent)` }} />

      <FFHeader design={design} title="TODAYS SCHEDULE" right="BROADCAST RUN" />

      {/* Center Match Cards Grid */}
      <div className="flex-1 flex items-center justify-center px-12">
        <div className="grid grid-cols-3 gap-6 w-full max-w-[1100px]">
          {(matches || []).slice(0, 3).map((match, idx) => {
            const isLive = match.state === 'live';
            const isCompleted = match.state === 'ended';
            const statusColor = isLive ? '#ef4444' : isCompleted ? '#10b981' : '#6b7280';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-white/10 overflow-hidden relative"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  boxShadow: `0 10px 30px rgba(0,0,0,0.5)`
                }}
              >
                {/* Accent top line based on state */}
                <div className="h-[3px] w-full" style={{ background: statusColor }} />

                <div className="p-6 flex flex-col justify-between h-56">
                  {/* Card top */}
                  <div className="flex justify-between items-center">
                    <span className="font-orbitron text-xs font-black text-white/50 tracking-[0.1em]">
                      MATCH 0{match.match_number}
                    </span>
                    {/* Status badge */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/5 bg-black/40">
                      {isLive && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
                      <span className="font-orbitron text-[9px] font-black uppercase tracking-wider" style={{ color: statusColor }}>
                        {match.state}
                      </span>
                    </div>
                  </div>

                  {/* Card center (Map Name) */}
                  <div className="my-4">
                    <h2 className="font-orbitron text-3xl font-black text-white uppercase tracking-wider leading-none">
                      {match.map_name}
                    </h2>
                    <span className="font-orbitron text-[10px] text-white/30 tracking-[0.2em] uppercase block mt-1">
                      BATTLE ROYALE
                    </span>
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                    <span className="font-orbitron text-[10px] text-white/40 tracking-[0.1em]">COMPETING TEAMS</span>
                    <span className="font-orbitron text-xs font-bold text-white">12 TEAMS</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   7. TEAMS TODAY (Solid BG)
══════════════════════════════════════════════════ */
function TeamsToday({ teams, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 1200px 800px at 50% 50%, ${cyan}12, transparent)` }} />

      <FFHeader design={design} title="MEET THE TEAMS" right="TOURNAMENT LINEUP" />

      {/* Main Title Center */}
      <div className="flex flex-col items-center mt-8">
        <h1 className="font-orbitron text-4xl font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-cyan-400">
          CONTESTANTS
        </h1>
        <p className="font-orbitron text-[10px] tracking-[0.3em] text-white/40 uppercase mt-1">
          {tok.name(design)} | {tok.sub(design)}
        </p>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 flex items-center justify-center px-12 pb-10">
        <div className="grid grid-cols-4 gap-6 w-full max-w-[1000px]">
          {(teams || []).slice(0, 12).map((team, idx) => {
            const teamColor = idx % 2 === 0 ? primary : cyan;
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 90, damping: 14, delay: idx * 0.05 }}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 relative overflow-hidden h-36 bg-black/40"
              >
                {/* Logo circle with teamColor glow ring */}
                <div 
                  className="relative flex h-16 w-16 items-center justify-center rounded-full transition-transform"
                  style={{
                    boxShadow: `0 0 0 2px ${teamColor}, 0 0 20px ${teamColor}55`
                  }}
                >
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full text-base font-black text-white" style={{ background: teamColor }}>
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Team label */}
                <span className="font-orbitron text-xs font-black tracking-[0.2em] text-white uppercase text-center mt-4 truncate w-full">
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
   8. CASTERS (Solid BG)
══════════════════════════════════════════════════ */
function CastersScreen({ design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 1200px 800px at 20% 50%, ${primary}15, transparent)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 1200px 800px at 80% 50%, ${cyan}15, transparent)` }} />

      <FFHeader design={design} title="CASTER TALENT" right="ANALYSIS DESK" />

      {/* Main split display */}
      <div className="flex-1 flex items-center justify-center px-12 gap-12">
        
        {/* Caster 1 camera box */}
        <div className="w-[480px] h-[300px] border border-white/5 relative bg-black/40 rounded overflow-hidden">
          {/* HUD Brackets */}
          <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: primary }} />
          <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: primary }} />
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: primary }} />
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: primary }} />

          {/* Top Camera HUD bar inside frame */}
          <div className="absolute top-2 left-3 right-3 flex justify-between items-center">
            <span className="font-orbitron text-[9px] font-black text-red-500 animate-pulse">● REC</span>
            <span className="font-orbitron text-[9px] text-white/30">CAM 01</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="h-10 w-10 text-white/10" />
          </div>

          {/* Bottom name strip */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/90 border-t border-white/10 flex items-center justify-between px-4">
            <div className="flex flex-col">
              <span className="font-orbitron text-sm font-black text-white uppercase tracking-wider">CASTER ONE</span>
              <span className="font-orbitron text-[10px] uppercase tracking-wider" style={{ color: primary }}>@CASTER_HANDLE</span>
            </div>
            <span className="font-orbitron text-[10px] text-white/50 tracking-widest border border-white/15 px-2 py-0.5 rounded uppercase">LEAD HOST</span>
          </div>
        </div>

        {/* VS Divider center */}
        <div className="flex flex-col items-center">
          <div className="h-20 w-[1px]" style={{ background: `linear-gradient(to bottom, transparent, ${primary})` }} />
          <div className="relative flex items-center justify-center my-2 h-14 w-14 border border-white/20 rotate-45">
            <span className="font-orbitron text-xl font-black -rotate-45 text-white">VS</span>
          </div>
          <div className="h-20 w-[1px]" style={{ background: `linear-gradient(to top, transparent, ${cyan})` }} />
        </div>

        {/* Caster 2 camera box */}
        <div className="w-[480px] h-[300px] border border-white/5 relative bg-black/40 rounded overflow-hidden">
          {/* HUD Brackets */}
          <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: cyan }} />
          <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: cyan }} />
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: cyan }} />
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: cyan }} />

          {/* Top Camera HUD bar inside frame */}
          <div className="absolute top-2 left-3 right-3 flex justify-between items-center">
            <span className="font-orbitron text-[9px] font-black text-red-500 animate-pulse">● REC</span>
            <span className="font-orbitron text-[9px] text-white/30">CAM 02</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="h-10 w-10 text-white/10" />
          </div>

          {/* Bottom name strip */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/90 border-t border-white/10 flex items-center justify-between px-4">
            <div className="flex flex-col">
              <span className="font-orbitron text-sm font-black text-white uppercase tracking-wider">CASTER TWO</span>
              <span className="font-orbitron text-[10px] uppercase tracking-wider" style={{ color: cyan }}>@CASTER_HANDLE</span>
            </div>
            <span className="font-orbitron text-[10px] text-white/50 tracking-widest border border-white/15 px-2 py-0.5 rounded uppercase">CO-ANALYST</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   9. UPCOMING MAP (Solid BG)
══════════════════════════════════════════════════ */
function UpcomingMap({ match, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);
  const mapName = (match?.map_name || 'BERMUDA').toUpperCase();

  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      <FFHeader design={design} title="COUNTDOWN TO BATTLE" right="LOADING LOBBY" />

      {/* Main split content */}
      <div className="flex-1 flex items-center justify-between px-16">
        
        {/* Left info box */}
        <div className="flex flex-col max-w-[50%]">
          <span className="font-orbitron text-[12px] font-black tracking-[0.5em]" style={{ color: cyan }}>NEXT MATCH</span>
          <h1 className="font-orbitron text-7xl font-black text-white tracking-widest leading-none mt-2 drop-shadow-lg">
            {mapName}
          </h1>
          <span className="font-orbitron text-xs font-bold tracking-[0.3em] text-white/40 uppercase mt-1">BATTLE ROYALE LOBBY</span>
          
          <div className="mt-8">
            <span className="font-orbitron text-[10px] text-white/40 tracking-[0.1em]">MATCH STARTS IN</span>
            <div className="font-orbitron text-7xl font-black mt-1 animate-pulse" style={{ color: primary, textShadow: `0 0 30px ${primary}88` }}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Right Watermark style map block */}
        <div className="w-[420px] h-[280px] border border-white/5 relative bg-black/40 rounded flex items-center justify-center overflow-hidden">
          {/* Brackets */}
          <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: primary }} />
          <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: primary }} />
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: primary }} />
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: primary }} />
          
          <div className="absolute inset-0 opacity-10 flex flex-wrap gap-2 p-4 text-[24px] font-black pointer-events-none font-orbitron text-white">
            {Array(12).fill(mapName)}
          </div>
          <span className="font-orbitron text-5xl font-black tracking-widest text-white/20 uppercase">
            {mapName}
          </span>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   10. ELIMINATION ALERT (Full Screen Alert overlay style)
══════════════════════════════════════════════════ */
function EliminationAlert({ eliminations, design }) {
  const primary = tok.acc(design);
  const latestElim = eliminations?.[0];

  if (!latestElim) return <div className="h-full w-full" style={{ background: 'transparent' }} />;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        background: `radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, transparent 70%)`
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center"
      >
        <Skull className="h-16 w-16 text-red-500 mb-2 animate-bounce" />
        
        <h1 className="font-orbitron text-6xl font-black tracking-[0.3em] text-white"
          style={{ textShadow: `0 0 40px #ef4444` }}
        >
          ELIMINATED
        </h1>

        <span className="font-orbitron text-2xl font-black mt-2" style={{ color: primary }}>
          {latestElim.eliminated_player_name}
        </span>

        <span className="font-orbitron text-xs tracking-[0.1em] text-white/40 uppercase mt-1">
          {latestElim.eliminated_team_name}
        </span>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   11. MVP (Solid BG)
══════════════════════════════════════════════════ */
function MVPScreen({ players, teams, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  // Pick top player in tournament kills
  const topPlayer = useMemo(() => {
    return [...(players || [])].sort((a, b) => (b.total_tournament_kills || 0) - (a.total_tournament_kills || 0))[0] || null;
  }, [players]);

  const topTeam = useMemo(() => {
    if (!topPlayer) return null;
    return (teams || []).find(t => t.id === topPlayer.team_id) || null;
  }, [topPlayer, teams]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 1200px 800px at 50% 50%, ${primary}15, transparent)` }} />

      <FFHeader design={design} title="MATCH MVP" right="PERFORMANCE REVIEW" />

      {/* Main content display split */}
      <div className="flex-1 flex items-center justify-center gap-16 px-16">
        
        {/* Left Side: Avatar Display */}
        <div className="w-[340px] h-[400px] border border-white/5 relative bg-black/40 rounded flex items-center justify-center overflow-hidden">
          <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: primary }} />
          <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2" style={{ borderColor: primary }} />
          <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2" style={{ borderColor: primary }} />
          <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: primary }} />

          <div className="absolute inset-0 opacity-5 flex items-center justify-center text-[180px] font-black select-none pointer-events-none font-orbitron text-white">
            MVP
          </div>

          <div className="flex flex-col items-center">
            <Award className="h-20 w-20 text-yellow-500 mb-4" />
            <span className="font-orbitron text-2xl font-black text-white uppercase tracking-wider">
              {topPlayer?.name || 'PLAYER_ONE'}
            </span>
            <span className="font-orbitron text-sm uppercase tracking-widest mt-1" style={{ color: primary }}>
              {topTeam?.name || 'TEAM ALPHA'}
            </span>
          </div>
        </div>

        {/* Right Side: Performance stats */}
        <div className="flex flex-col max-w-[50%]">
          <span className="font-orbitron text-[12px] font-black tracking-[0.4em]" style={{ color: cyan }}>TOURNAMENT STANDOUT</span>
          <h1 className="font-orbitron text-8xl font-black text-white tracking-wider leading-none mt-2">
            MVP
          </h1>
          
          <div className="h-[2px] w-[300px] my-6" style={{ background: `linear-gradient(90deg, ${primary}, transparent)` }} />

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/5 rounded p-4 flex flex-col justify-between w-32 h-24">
              <span className="font-orbitron text-[10px] text-white/40 tracking-wider">TOTAL KILLS</span>
              <span className="font-orbitron text-3xl font-black text-white">{topPlayer?.total_tournament_kills || 0}</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded p-4 flex flex-col justify-between w-32 h-24">
              <span className="font-orbitron text-[10px] text-white/40 tracking-wider">MATCH KILLS</span>
              <span className="font-orbitron text-3xl font-black text-white">{topPlayer?.current_match_kills || 0}</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded p-4 flex flex-col justify-between w-32 h-24">
              <span className="font-orbitron text-[10px] text-white/40 tracking-wider">SURVIVAL</span>
              <span className="font-orbitron text-3xl font-black" style={{ color: cyan }}>ALIVE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   12. CHAMPIONS / BOOYAH (Solid BG)
══════════════════════════════════════════════════ */
function ChampionsScreen({ teams, design }) {
  const primary = tok.acc(design);
  const cyan    = tok.acc2(design);

  // Top ranking team
  const championTeam = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0] || null;
  }, [teams]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: carbonFiberBg }}>
      {/* Golden volumetric glows */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 800px 600px at 50% 40%, rgba(251,191,36,0.2), transparent)` }} />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

      {/* Confetti Particle System */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const delay = Math.random() * 4;
          const duration = 2 + Math.random() * 2;
          const colors = ['#f97316', '#00d4ff', '#fbbf24', '#ffffff'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const width = 2 + Math.random() * 4;
          const height = 4 + Math.random() * 6;

          return (
            <div
              key={i}
              className="absolute bg-white rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                width: width,
                height: height,
                background: randomColor,
                opacity: 0.8,
                animation: `confetti-fall ${duration}s linear infinite`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>

      <FFHeader design={design} title="VICTORY CEREMONY" right="FINAL STANDINGS" />

      {/* Hero center presentation */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          className="mb-2"
        >
          <Crown className="h-16 w-16 text-yellow-500" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          className="font-orbitron font-black text-9xl tracking-widest leading-none text-white uppercase"
          style={{
            textShadow: `0 0 60px #f97316cc, 0 0 120px #fbbf2455`,
            WebkitTextStroke: `1px rgba(251,191,36,0.4)`
          }}
        >
          BOOYAH!
        </motion.h1>

        <span className="font-orbitron text-lg font-black tracking-[0.6em] text-cyan-400 uppercase mt-4">
          CHAMPIONS
        </span>

        {/* Winner display card */}
        {championTeam && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-6 rounded-xl border border-yellow-500/30 w-[600px] flex items-center justify-between"
            style={{
              background: 'rgba(5, 8, 20, 0.92)',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 0 40px rgba(251,191,36,0.15)`
            }}
          >
            <div className="flex items-center gap-4">
              {championTeam.logo_url ? (
                <img src={championTeam.logo_url} alt="" className="h-14 w-14 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white" style={{ background: primary }}>
                  {championTeam.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-orbitron text-xl font-black text-white uppercase tracking-wide">
                  {championTeam.name}
                </span>
                <span className="font-orbitron text-[10px] tracking-wider text-yellow-500 uppercase font-black">
                  TOURNAMENT CHAMPION
                </span>
              </div>
            </div>

            {/* Performance numbers */}
            <div className="grid grid-cols-2 gap-4 border-l border-white/10 pl-6">
              <div className="flex flex-col">
                <span className="font-orbitron text-[9px] text-white/40">TOTAL POINTS</span>
                <span className="font-orbitron text-xl font-black text-white">{championTeam.total_tournament_points || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron text-[9px] text-white/40">TOTAL KILLS</span>
                <span className="font-orbitron text-xl font-black text-white">{championTeam.total_tournament_kills || 0}</span>
              </div>
            </div>
          </motion.div>
        )}
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
        return <FullStandings teams={teams} players={players} design={design} />;
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
        return <MVPScreen players={players} teams={teams} design={design} />;
      case 'champions':
        return <ChampionsScreen teams={teams} design={design} />;
      default:
        return <SetupBlank />;
    }
  };

  return (
    <div 
      className="relative overflow-hidden w-[1920px] h-[1080px] origin-top-left"
      style={{
        transform: `scale(${scale})`,
        background: isTransparent ? 'transparent' : '#060915',
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
