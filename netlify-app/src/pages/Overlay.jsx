import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayData } from '@/lib/overlayApi';
import { Skull, Crosshair, Trophy, Zap, Crown, Star } from 'lucide-react';

/* ──────────── DESIGN HELPERS ──────────── */
function acc(design) { return design?.accentColor || '#f97316'; }
function acc2(design) { return design?.accentColor2 || '#ef4444'; }
function bg(design)  { return design?.bgColor || '#0a0a0f'; }
function txt(design) { return design?.textColor || '#ffffff'; }
function fontFamily(design) {
  const f = design?.fontStyle || 'orbitron';
  if (f === 'rajdhani') return 'Rajdhani, sans-serif';
  if (f === 'impact') return 'Impact, Arial Narrow, sans-serif';
  return 'Orbitron, sans-serif';
}
function tName(design) { return design?.tournamentName || 'BOOYAH CUP'; }
function tSub(design)  { return design?.tournamentSubtitle || 'GRAND FINALS'; }
function gLabel(design){ return design?.gameLabel || 'GAME'; }

/* ──────────── Screen: Setup Blank ──────────── */
function SetupBlank({ design }) {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: bg(design) }}>
      <span className="font-orbitron text-2xl font-black tracking-[0.3em]" style={{ color: acc(design) + '1a', fontFamily: fontFamily(design) }}>
        BOOYAH DIRECTOR
      </span>
    </div>
  );
}

/* ──────────── Screen: Pre-Match Map ──────────── */
function PreMatchMap({ match, teams, players, design }) {
  const mapName = (match?.map_name || 'BERMUDA').toUpperCase();
  const matchNum = match?.match_number || 1;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${bg(design)}, ${acc(design)}22, ${bg(design)})` }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${acc(design)}55 0%, transparent 60%)` }} />
      {design?.logoUrl && (
        <img src={design.logoUrl} alt="logo" className="absolute top-10 right-10 h-16 w-16 object-contain" onError={e => e.target.style.display='none'} />
      )}
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 mb-4">
        <span className="text-xl font-bold tracking-[0.4em]" style={{ color: acc(design), fontFamily: fontFamily(design) }}>
          {gLabel(design)} {matchNum}
        </span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
        className="font-black leading-none"
        style={{ fontSize: '140px', color: txt(design), fontFamily: fontFamily(design), textShadow: `0 0 60px ${acc(design)}cc, 0 0 120px ${acc(design)}66`, WebkitTextStroke: `2px ${acc(design)}dd` }}
      >
        {mapName}
      </motion.h1>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-4 h-1 w-[600px] origin-center" style={{ background: `linear-gradient(to right, transparent, ${acc(design)}, transparent)` }} />
      {/* Branding footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm font-bold tracking-[0.3em]" style={{ color: acc(design), fontFamily: fontFamily(design) }}>{tName(design)}</p>
        <p className="text-xs tracking-widest" style={{ color: txt(design) + '66' }}>{tSub(design)}</p>
      </div>
      {teams && teams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-3 border-t px-8 py-4"
          style={{ borderColor: acc(design) + '33', background: '#00000099' }}>
          {teams.map((team, i) => {
            const teamPlayers = (players || []).filter(p => p.team_id === team.id);
            return (
              <div key={team.id} className="rounded-lg border px-4 py-2" style={{ borderColor: acc(design) + '33', background: acc(design) + '11' }}>
                <span className="text-sm font-bold" style={{ color: acc(design), fontFamily: fontFamily(design) }}>{team.name}</span>
                <div className="mt-0.5 flex gap-1">{teamPlayers.map(p => <span key={p.id} className="text-[10px] text-gray-400">{p.name}</span>)}</div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ──────────── FF Classic Scoreboard (the reference image style) ──────────── */
function FFClassicScoreboard({ teams, players, currentMatch, design, eliminations }) {
  const matchNum = currentMatch?.match_number || 1;

  // Build per-team alive/elim counts from current player data
  const teamRows = useMemo(() => {
    const sorted = [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
    return sorted.map((team, i) => {
      const teamPlayers = (players || []).filter(p => p.team_id === team.id);
      const alive = teamPlayers.filter(p => p.is_alive).length;
      const total = teamPlayers.length || 4;
      const elims = team.total_tournament_kills || 0;
      // status: alive > 0 = alive, alive === 0 and had players = eliminated
      const status = alive > 0 ? 'alive' : 'eliminated';
      return { team, rank: i + 1, alive, total, elims, status };
    });
  }, [teams, players]);

  const totalAlive = teamRows.filter(r => r.status === 'alive').length;
  const totalTeams = teamRows.length;

  const primary = acc(design);
  const secondary = acc2(design);
  const background = bg(design);
  const font = fontFamily(design);

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: background }}>
      {/* ── TOP HUD BAR (like FF: timer / flags / players) ── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center gap-8 py-2 px-8"
        style={{ background: `linear-gradient(to bottom, ${background}ff, ${background}aa)`, borderBottom: `2px solid ${primary}44` }}
      >
        {/* Timer mock */}
        <div className="flex items-center gap-2 rounded-full px-4 py-1" style={{ background: '#00000066', border: `1px solid ${primary}55` }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span className="font-orbitron text-sm font-black" style={{ color: primary }}>LIVE</span>
        </div>
        {/* Teams left */}
        <div className="flex items-center gap-2 rounded-full px-4 py-1" style={{ background: '#00000066', border: `1px solid ${primary}55` }}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={primary}><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/></svg>
          <span className="font-orbitron text-sm font-black" style={{ color: primary }}>{totalAlive}</span>
          <span className="text-xs text-gray-400">TEAMS</span>
        </div>
        {/* Total players alive */}
        <div className="flex items-center gap-2 rounded-full px-4 py-1" style={{ background: '#00000066', border: `1px solid ${primary}55` }}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={primary}><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5"/></svg>
          <span className="font-orbitron text-sm font-black" style={{ color: primary }}>
            {teamRows.reduce((s, r) => s + r.alive, 0)}
          </span>
          <span className="text-xs text-gray-400">ALIVE</span>
        </div>
        {/* Game number badge */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <span className="font-orbitron text-xs font-black tracking-wider" style={{ color: primary + 'aa' }}>
            {gLabel(design)} {matchNum}
          </span>
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '60px', paddingBottom: '70px' }}>
        <div className="w-full max-w-2xl px-4">
          {/* Column headers */}
          <div className="mb-1 flex items-center px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: primary + '99' }}>
            <span className="w-10 text-center">#</span>
            <span className="flex-1 pl-2" style={{ fontFamily: font }}>TEAMS</span>
            <span className="w-20 text-center">ELIMS</span>
            <span className="w-20 text-center">ALIVE</span>
          </div>

          {/* Team rows */}
          <div className="space-y-1">
            {teamRows.map((row, idx) => {
              const isElim = row.status === 'eliminated';
              const isTop = idx === 0;
              const rowBg = isElim
                ? '#ffffff08'
                : isTop
                ? `${primary}22`
                : idx % 2 === 0 ? '#ffffff0d' : '#00000033';
              const borderStyle = isElim ? 'none'
                : isTop ? `1px solid ${primary}55`
                : `1px solid #ffffff11`;

              return (
                <motion.div
                  key={row.team.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="flex items-center rounded-lg px-3 py-2"
                  style={{ background: rowBg, border: borderStyle, opacity: isElim ? 0.45 : 1 }}
                >
                  {/* Rank */}
                  <div className="w-10 text-center">
                    {isTop ? (
                      <span className="font-orbitron text-base font-black" style={{ color: primary, fontFamily: font }}>#{row.rank}</span>
                    ) : (
                      <span className="font-orbitron text-sm" style={{ color: isElim ? '#555' : '#aaa', fontFamily: font }}>#{row.rank}</span>
                    )}
                  </div>

                  {/* Diagonal accent bar for top team */}
                  {isTop && (
                    <div className="mr-1 h-6 w-1 rounded-full" style={{ background: primary }} />
                  )}

                  {/* Team name */}
                  <div className="flex flex-1 items-center gap-2 pl-1">
                    {row.team.logo_url ? (
                      <img src={row.team.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black" style={{ background: isElim ? '#333' : primary + '44', color: isElim ? '#555' : primary }}>
                        {row.team.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="text-sm font-black uppercase tracking-wider"
                      style={{ color: isElim ? '#555' : isTop ? primary : txt(design), fontFamily: font }}
                    >
                      {row.team.name}
                    </span>
                  </div>

                  {/* ELIMS */}
                  <div className="w-20 text-center">
                    <span className="font-orbitron text-sm font-black" style={{ color: isElim ? '#555' : secondary, fontFamily: font }}>
                      {row.elims.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* ALIVE — tally bars like FF */}
                  <div className="w-20 flex items-center justify-center gap-0.5">
                    {isElim ? (
                      <span className="font-orbitron text-xs" style={{ color: secondary + '66' }}>✗</span>
                    ) : (
                      Array.from({ length: row.total }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-sm"
                          style={{
                            width: '6px',
                            height: i < row.alive ? '14px' : '8px',
                            background: i < row.alive
                              ? (i === row.alive - 1 ? primary : primary + 'bb')
                              : '#ffffff22',
                            marginTop: i < row.alive ? '0' : '3px',
                          }}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BOTTOM FOOTER: legend + tournament branding ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-3"
        style={{ background: `linear-gradient(to top, ${background}ff, ${background}aa)`, borderTop: `2px solid ${primary}44` }}
      >
        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm" style={{ background: primary }} />
            <span>ALIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm" style={{ background: secondary + '66' }} />
            <span>KNOCK</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm bg-white/20" />
            <span>ELIMINATED</span>
          </div>
        </div>

        {/* Tournament Branding */}
        <div className="flex items-center gap-3">
          {design?.logoUrl && (
            <img src={design.logoUrl} alt="logo" className="h-8 w-8 object-contain" onError={e => e.target.style.display='none'} />
          )}
          <div className="text-right">
            <p className="text-xs font-black tracking-wider" style={{ color: txt(design), fontFamily: font }}>
              {tName(design)}
            </p>
            <p className="text-[10px] font-bold" style={{ color: primary, fontFamily: font }}>
              {tSub(design)} · {gLabel(design)} {matchNum}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────── Default Scoreboard ──────────── */
function Scoreboard({ teams, players, killFeed, design }) {
  const sortedTeams = useMemo(() => [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0)), [teams]);
  const killLeaders = useMemo(() => [...(players || [])].filter(p => (p.current_match_kills || 0) > 0).sort((a, b) => (b.current_match_kills || 0) - (a.current_match_kills || 0)).slice(0, 5), [players]);
  const tickerKills = useMemo(() => (killFeed || []).slice(0, 10), [killFeed]);
  const primary = acc(design); const font = fontFamily(design);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: `linear-gradient(to right, ${bg(design)}, ${bg(design)}ee)` }}>
      <div className="flex items-center justify-between border-b px-8 py-3" style={{ borderColor: primary + '44', background: '#00000066' }}>
        {design?.logoUrl ? (
          <img src={design.logoUrl} alt="logo" className="h-8 object-contain" onError={e => e.target.style.display='none'} />
        ) : (
          <span className="text-2xl font-black tracking-wider" style={{ color: primary, fontFamily: font }}>{tName(design)}</span>
        )}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full" style={{ background: acc2(design) }} />
          <span className="font-orbitron text-sm font-bold tracking-wider" style={{ color: acc2(design) }}>LIVE</span>
        </div>
      </div>
      <div className="flex flex-1 gap-4 p-6">
        <div className="flex-1">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400" style={{ fontFamily: font }}>Tournament Standings</h3>
          <div className="space-y-1">
            {sortedTeams.map((team, i) => (
              <div key={team.id} className="flex items-center gap-4 rounded-lg px-4 py-2"
                style={{ background: i === 0 ? primary + '22' : '#ffffff0d', border: i === 0 ? `1px solid ${primary}55` : '1px solid #ffffff11', animation: `slide-in-right 0.3s ease ${i * 0.05}s both` }}>
                <span className="text-lg font-black w-8" style={{ color: i === 0 ? primary : i < 3 ? '#fbbf24' : '#555', fontFamily: font }}>#{i + 1}</span>
                <span className="text-lg font-bold flex-1" style={{ color: txt(design), fontFamily: font }}>{team.name}</span>
                <span className="flex items-center gap-1 text-sm text-gray-400"><Skull className="h-3.5 w-3.5" />{team.total_tournament_kills || 0}</span>
                <span className="flex items-center gap-1 text-lg font-black w-12 text-right" style={{ color: primary, fontFamily: font }}>{team.total_tournament_points || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-72">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-400" style={{ fontFamily: font }}>Kill Leaders</h3>
          <div className="space-y-1">
            {killLeaders.length === 0 && <p className="text-sm text-gray-600">No kills recorded</p>}
            {killLeaders.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: '#ffffff0d' }}>
                <Crosshair className="h-4 w-4" style={{ color: primary }} />
                <span className="text-sm font-bold flex-1" style={{ color: txt(design), fontFamily: font }}>{p.name}</span>
                <span className="text-sm font-black" style={{ color: primary, fontFamily: font }}>{p.current_match_kills}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {tickerKills.length > 0 && (
        <div className="overflow-hidden border-t py-2" style={{ borderColor: primary + '33', background: '#00000099' }}>
          <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'ticker-scroll 20s linear infinite' }}>
            {[...tickerKills, ...tickerKills].map((kill, i) => (
              <span key={i} className="text-sm" style={{ color: '#cbd5e1' }}>
                <span className="font-bold" style={{ color: primary }}>{kill.killer_name}</span>
                {kill.killed_player_name ? <span> eliminated <span style={{ color: acc2(design) }}>{kill.killed_player_name}</span></span> : <span> got a kill</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────── Kill Feed Screen ──────────── */
function KillFeedScreen({ killFeed, design }) {
  const recent = useMemo(() => (killFeed || []).slice(0, 8), [killFeed]);
  const primary = acc(design); const font = fontFamily(design);
  return (
    <div className="flex h-full w-full flex-col justify-center p-12" style={{ background: `linear-gradient(135deg, ${bg(design)}, ${bg(design)}ee)` }}>
      <h3 className="mb-6 text-xl font-black uppercase tracking-wider" style={{ color: primary, fontFamily: font }}>Kill Feed</h3>
      <div className="space-y-3">
        {recent.length === 0 && <p className="text-sm text-gray-600">No kills recorded yet</p>}
        {recent.map((kill, i) => (
          <div key={kill.id || i} className="flex items-center gap-4 rounded-lg border px-6 py-3" style={{ borderColor: '#ffffff1a', background: '#00000066', animation: `slide-in-right 0.4s ease ${i * 0.08}s both` }}>
            <Skull className="h-6 w-6" style={{ color: primary }} />
            <span className="text-xl font-bold" style={{ color: txt(design), fontFamily: font }}>{kill.killer_name}</span>
            <span style={{ color: primary }}>→</span>
            {kill.killed_player_name ? <span className="text-xl font-bold" style={{ color: acc2(design), fontFamily: font }}>{kill.killed_player_name}</span> : <span className="text-xl text-gray-500">eliminated</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────── Elimination Alert ──────────── */
function EliminationAlert({ eliminations, design }) {
  const latest = useMemo(() => {
    if (!eliminations || eliminations.length === 0) return null;
    return [...eliminations].sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date))[0];
  }, [eliminations]);
  const primary = acc(design); const font = fontFamily(design);
  if (!latest) return <div className="flex h-full w-full items-center justify-center" style={{ background: bg(design) }}><Skull className="h-20 w-20 opacity-20" style={{ color: acc2(design) }} /></div>;
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: `radial-gradient(circle at 50% 50%, ${acc2(design)}22 0%, ${bg(design)} 70%)` }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, type: 'spring' }} className="text-center">
        <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3 }} className="mb-4 flex justify-center">
          <Skull className="h-24 w-24" style={{ color: acc2(design), filter: `drop-shadow(0 0 20px ${acc2(design)}cc)` }} />
        </motion.div>
        <div className="rounded-2xl border-4 px-16 py-8" style={{ borderColor: acc2(design), background: '#00000099', boxShadow: `0 0 60px ${acc2(design)}88` }}>
          <p className="text-sm font-bold uppercase tracking-[0.4em]" style={{ color: acc2(design), fontFamily: font }}>Eliminated</p>
          <h2 className="mt-2 text-6xl font-black" style={{ color: txt(design), fontFamily: font }}>{latest.eliminated_player_name}</h2>
          {latest.eliminated_team_name && <p className="mt-2 text-2xl font-bold" style={{ color: acc2(design) + 'cc', fontFamily: font }}>{latest.eliminated_team_name}</p>}
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────── MVP Screen ──────────── */
function MvpScreen({ overlayState, design }) {
  const name = overlayState?.mvp_player_name || 'MVP';
  const team = overlayState?.mvp_team_name || '';
  const kills = overlayState?.mvp_kills || 0;
  const primary = acc(design); const font = fontFamily(design);
  const particles = useMemo(() => Array.from({ length: 30 }, () => ({ left: Math.random() * 100, top: Math.random() * 100, delay: Math.random() * 3, size: 2 + Math.random() * 4 })), []);
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${bg(design)}, ${primary}11, ${bg(design)})` }}>
      {particles.map((p, i) => <div key={i} className="absolute rounded-full" style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, background: primary, animation: `float-particle 3s ease ${p.delay}s infinite` }} />)}
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${primary}22 0%, transparent 60%)` }} />
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: 'spring' }} className="relative z-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Star className="h-10 w-10" style={{ color: primary, filter: `drop-shadow(0 0 15px ${primary}cc)` }} />
          <span className="text-2xl font-black tracking-[0.4em]" style={{ color: primary, fontFamily: font }}>MVP</span>
          <Star className="h-10 w-10" style={{ color: primary, filter: `drop-shadow(0 0 15px ${primary}cc)` }} />
        </div>
        <h1 className="font-black leading-none" style={{ fontSize: '100px', color: txt(design), fontFamily: font, textShadow: `0 0 40px ${primary}cc, 0 0 80px ${primary}55` }}>{name}</h1>
        {team && <p className="mt-4 text-3xl font-bold" style={{ color: primary + 'cc', fontFamily: font }}>{team}</p>}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Crosshair className="h-6 w-6" style={{ color: acc2(design) }} />
          <span className="text-4xl font-black" style={{ color: acc2(design), fontFamily: font }}>{kills}</span>
          <span className="text-xl text-gray-400">KILLS</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────── Champions Screen ──────────── */
function Champions({ overlayState, teams, design }) {
  const teamName = overlayState?.champion_team_name || (teams && teams.length > 0 ? [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0].name : 'CHAMPION');
  const points = overlayState?.champion_total_points || (teams && teams.length > 0 ? [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0].total_tournament_points : 0);
  const primary = acc(design); const font = fontFamily(design);
  const confetti = useMemo(() => Array.from({ length: 60 }, () => ({ left: Math.random() * 100, delay: Math.random() * 3, duration: 2 + Math.random() * 3, color: [primary, acc2(design), '#fbbf24', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 5)], size: 6 + Math.random() * 8 })), []);
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: bg(design) }}>
      {confetti.map((c, i) => <div key={i} className="absolute top-0" style={{ left: `${c.left}%`, width: c.size, height: c.size, background: c.color, animation: `confetti-fall ${c.duration}s linear ${c.delay}s infinite` }} />)}
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${primary}33 0%, transparent 60%)` }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, type: 'spring' }} className="relative z-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <Crown className="h-12 w-12" style={{ color: primary, filter: `drop-shadow(0 0 20px ${primary}cc)` }} />
          <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-5xl font-black tracking-wider" style={{ color: primary, fontFamily: font, textShadow: `0 0 30px ${primary}cc` }}>
            BOOYAH!
          </motion.span>
          <Crown className="h-12 w-12" style={{ color: primary, filter: `drop-shadow(0 0 20px ${primary}cc)` }} />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-gray-400">Champions</p>
        <h1 className="mt-4 font-black leading-none" style={{ fontSize: '90px', color: txt(design), fontFamily: font, textShadow: `0 0 40px ${primary}99, 0 0 80px ${primary}44` }}>{teamName}</h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8" style={{ color: primary }} />
          <span className="text-4xl font-black" style={{ color: primary, fontFamily: font }}>{points}</span>
          <span className="text-xl text-gray-400">POINTS</span>
        </div>
        {design?.logoUrl && <img src={design.logoUrl} alt="" className="mx-auto mt-6 h-12 object-contain" onError={e => e.target.style.display='none'} />}
        <p className="mt-2 text-sm tracking-widest" style={{ color: primary + '88', fontFamily: font }}>{tName(design)} · {tSub(design)}</p>
      </motion.div>
    </div>
  );
}

/* ──────────── Main Overlay Component ──────────── */
export default function Overlay() {
  const { data, loading } = useOverlayData(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const screen = data?.overlay_state?.current_screen || 'setup_blank';
  const design = data?.design || {};
  const style = design?.overlayStyle || 'ff_classic';

  const renderScreen = () => {
    if (!data) return <SetupBlank design={design} />;
    switch (screen) {
      case 'pre_match_map':
        return <PreMatchMap match={data.current_match} teams={data.teams} players={data.players} design={design} />;
      case 'scoreboard':
      case 'ff_scoreboard':
        // Use FF Classic if style is set, else default
        return style === 'ff_classic'
          ? <FFClassicScoreboard teams={data.teams} players={data.players} currentMatch={data.current_match} design={design} eliminations={data.eliminations} />
          : <Scoreboard teams={data.teams} players={data.players} killFeed={data.kill_feed} design={design} />;
      case 'kill_feed':
        return <KillFeedScreen killFeed={data.kill_feed} design={design} />;
      case 'elimination_alert':
        return <EliminationAlert eliminations={data.eliminations} design={design} />;
      case 'mvp':
        return <MvpScreen overlayState={data.overlay_state} design={design} />;
      case 'champions':
        return <Champions overlayState={data.overlay_state} teams={data.teams} design={design} />;
      default:
        return <SetupBlank design={design} />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black overlay-canvas">
      <div style={{ width: '1920px', height: '1080px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AnimatePresence mode="wait">
          <motion.div key={screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
