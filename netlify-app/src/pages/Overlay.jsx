/**
 * Overlay.jsx — 1080p OBS Browser Source Overlays
 *
 * Route: /overlay/:screen
 * PUBLIC route — no auth required. Reads data via shareToken from URL param
 * OR directly via the public overlay endpoint (no sensitive data exposed).
 *
 * Available screens:
 *   blank | scoreboard | standings | killfeed | maplabel |
 *   today-matches | teams | casters | upcoming-map |
 *   elim-alert | mvp | champions
 *
 * OBS setup: 1920×1080, "Shutdown source when not visible" OFF,
 *            Check "Transparent background" for overlay-type screens.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skull, Star, Crown, Zap, Video, Calendar, Users, MapPin, Award, XCircle } from 'lucide-react';
import { MAP_IMAGES } from '@/lib/maps';

/* ══════════════════════════════════════════════════
   DATA POLLING — calls public overlay API with optional shareToken
   No auth required — overlay data is intentionally public-read.
══════════════════════════════════════════════════ */
function useOverlayPoll(shareToken) {
  const [data, setData]     = useState({});
  const [error, setError]   = useState(null);
  const [ready, setReady]   = useState(false);
  const abortRef            = useRef(null);
  const timerRef            = useRef(null);
  const errCount            = useRef(0);
  const mounted             = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const poll = async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const qs = shareToken ? `?shareToken=${encodeURIComponent(shareToken)}` : '';
        const res = await fetch(`/api/getOverlayData${qs}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted.current || ctrl.signal.aborted) return;
        errCount.current = 0;
        setError(null);
        setReady(true);
        // Normalise keys
        setData({
          tournament:   json.tournament    ?? null,
          overlayState: json.overlay_state ?? null,
          design:       json.design        ?? null,
          teams:        Array.isArray(json.teams)        ? json.teams        : [],
          players:      Array.isArray(json.players)      ? json.players      : [],
          currentMatch: json.current_match ?? null,
          killFeed:     Array.isArray(json.kill_feed)    ? json.kill_feed    : [],
          eliminations: Array.isArray(json.eliminations) ? json.eliminations : [],
          standings:    Array.isArray(json.standings)    ? json.standings    : [],
        });
      } catch (e) {
        if (e?.name === 'AbortError' || !mounted.current) return;
        errCount.current++;
        if (errCount.current >= 3) setError(e.message);
        if (!ready) setReady(true); // still render with empty data
      }

      // Adaptive: slow down after repeated failures
      const delay = errCount.current > 5 ? 8000 : 2500;
      timerRef.current = setTimeout(poll, delay);
    };

    poll();
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
      clearTimeout(timerRef.current);
    };
  }, [shareToken]); // eslint-disable-line

  return { data, error, ready };
}

/* ══════════════════════════════════════════════════
   BACKGROUND — atmospheric gaming backdrop
══════════════════════════════════════════════════ */
function GamingBackground({ mapName, accent = '#FF6B00', accent2 = '#00D4FF' }) {
  const mapImg = MAP_IMAGES?.[mapName] || null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: '#060912' }} />
      {mapImg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${mapImg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.12, filter: 'blur(8px) saturate(0.6)',
        }} />
      )}
      {/* Carbon fiber */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(45deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 6px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 6px)`,
      }} />
      {/* Grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${accent}08 1px,transparent 1px),linear-gradient(90deg,${accent}08 1px,transparent 1px)`, backgroundSize:'80px 80px' }} />
      {/* Glow */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 1400px 900px at 50% 40%,${accent}22,transparent 70%)` }} />
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 600px 600px at 85% 80%,${accent2}15,transparent 60%)` }} />
      {/* Edges */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${accent},${accent2},${accent},transparent)` }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${accent}88,transparent)` }} />
      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 120% 120% at 50% 50%,transparent 30%,rgba(4,5,14,0.85) 100%)' }} />
      {/* Particles */}
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position:'absolute', width:i%3===0?3:2, height:i%3===0?3:2, borderRadius:'50%',
          background: i%2===0 ? accent : accent2,
          left:`${8+i*9}%`, top:`${10+(i*17)%80}%`, opacity:0.35,
          animation:`fprtcl ${3+(i%3)}s ease-in-out infinite alternate`,
          animationDelay:`${i*0.4}s`,
        }} />
      ))}
      <style>{`@keyframes fprtcl{from{transform:translateY(0) translateX(0);opacity:.2}to{transform:translateY(-20px) translateX(8px);opacity:.6}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════ */
const tok = {
  acc:  d => d?.accentColor        || '#FF6B00',
  acc2: d => d?.accentColor2       || '#00D4FF',
  bg:   d => d?.bgColor            || '#060915',
  txt:  d => d?.textColor          || '#ffffff',
  name: d => d?.tournamentName     || 'BOOYAH CHAMPIONSHIP',
  sub:  d => d?.tournamentSubtitle || 'GRAND FINALS',
  game: d => d?.gameLabel          || 'MATCH',
  logo: d => d?.logoUrl            || null,
  sponsorLogo: d => d?.sponsorLogoUrl || null,
  font: d => {
    const f = d?.fontStyle || 'orbitron';
    if (f === 'rajdhani') return 'Rajdhani, sans-serif';
    if (f === 'impact')   return 'Impact, Arial Narrow, sans-serif';
    return 'Orbitron, sans-serif';
  },
};

/* ══════════════════════════════════════════════════
   SHARED PANEL COMPONENTS
══════════════════════════════════════════════════ */
function FFPanel({ children, style }) {
  return (
    <div style={{
      background: 'rgba(6,9,21,0.93)',
      backdropFilter: 'blur(16px) saturate(180%)',
      borderTop: '2px solid #FF6B00', borderLeft: '2px solid #FF6B00',
      borderBottom: '2px solid #00D4FF', borderRight: '2px solid #00D4FF',
      borderRadius: 6,
      boxShadow: '0 0 40px rgba(255,107,0,0.12),0 0 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,107,0,0.2)',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      <div style={{ position:'absolute', top:0, left:0, width:12, height:12, borderTop:'3px solid #FF6B00', borderLeft:'3px solid #FF6B00', borderRadius:'2px 0 0 0', zIndex:10 }} />
      <div style={{ position:'absolute', top:0, right:0, width:12, height:12, borderTop:'3px solid #00D4FF', borderRight:'3px solid #00D4FF', borderRadius:'0 2px 0 0', zIndex:10 }} />
      <div style={{ position:'absolute', bottom:0, left:0, width:12, height:12, borderBottom:'3px solid #00D4FF', borderLeft:'3px solid #00D4FF', borderRadius:'0 0 0 2px', zIndex:10 }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, borderBottom:'3px solid #FF6B00', borderRight:'3px solid #FF6B00', borderRadius:'0 0 2px 0', zIndex:10 }} />
      {children}
    </div>
  );
}

function FFPanelHeader({ design, center, logoUrl }) {
  const tLogo = tok.logo(design);
  return (
    <div style={{
      height: 36, background: 'rgba(0,0,0,0.5)',
      borderBottom: '1px solid rgba(255,107,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', flexShrink: 0, zIndex: 2,
    }}>
      {/* Left: Tournament logo or Garena "G" */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {tLogo ? (
          <img src={tLogo} alt="logo"
            style={{ width:22, height:22, objectFit:'contain', borderRadius:3 }}
            onError={e => { e.target.style.display='none'; }}
          />
        ) : (
          <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(255,107,0,0.2)', border:'1px solid rgba(255,107,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:'#FF6B00', lineHeight:1 }}>G</span>
          </div>
        )}
        <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.2em' }}>
          {tok.name(design).split(' ')[0]}
        </span>
      </div>
      {/* Center */}
      <span style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:900, color:'rgba(255,255,255,0.7)', letterSpacing:'0.3em', textTransform:'uppercase' }}>
        {center || 'FF OFFICIAL'}
      </span>
      {/* Right: full tournament name */}
      <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
        {tok.sub(design)}
      </span>
    </div>
  );
}

/** Team logo — shows img if available, initials otherwise */
function TeamLogo({ team, size = 24 }) {
  const [imgErr, setImgErr] = useState(false);
  const url = team?.logo_url || team?.logo || null;
  if (url && !imgErr) {
    return (
      <img
        src={url} alt={team?.name || ''}
        style={{ width: size, height: size, objectFit:'contain', borderRadius: 3, display:'block' }}
        onError={() => setImgErr(true)}
      />
    );
  }
  // Initials fallback
  const initials = (team?.name || 'TM').replace(/[^A-Z0-9]/gi, '').substring(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 4,
      background: `linear-gradient(135deg,${team?.color||'#FF6B00'},${team?.color||'#FF6B00'}88)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.4, fontWeight:900, color:'#fff', fontFamily:'Orbitron',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 1: BLANK
══════════════════════════════════════════════════ */
function SetupBlank() {
  return <div style={{ width:'100%', height:'100%', background:'transparent' }} />;
}

/* ══════════════════════════════════════════════════
   SCREEN 2: SCOREBOARD (transparent overlay, right side)
══════════════════════════════════════════════════ */
function FFBoard({ teams = [], players = [], currentMatch, design }) {
  const rows = useMemo(() => {
    return [...teams]
      .map(team => {
        const tp = players.filter(p => p.team_id === team.id);
        const alive = tp.filter(p => p.is_alive).length;
        return { ...team, alive, totalPlayers: tp.length || 4 };
      })
      .sort((a, b) => (b.total_tournament_points||0) - (a.total_tournament_points||0) || (b.total_tournament_kills||0) - (a.total_tournament_kills||0))
      .slice(0, 12);
  }, [teams, players]);

  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const mapName = currentMatch?.map_name || currentMatch?.mapName || '';
  const matchNum = currentMatch?.match_number ? `MATCH ${String(currentMatch.match_number).padStart(2,'0')}` : 'STAND BY';

  return (
    <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', width:290, zIndex:10 }}>
      <FFPanel>
        <FFPanelHeader design={design} center="SCOREBOARD" />

        {/* Match info bar */}
        <div style={{
          height:28, background:'rgba(0,0,0,0.6)',
          borderBottom:`1px solid ${primary}33`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 12px',
        }}>
          <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:900, color:primary, letterSpacing:'0.15em' }}>{matchNum}</span>
          {mapName && <span style={{ fontFamily:'Orbitron', fontSize:8, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>{mapName.toUpperCase()}</span>}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#FF6B00', animation:'ping 1.5s infinite' }} />
            <span style={{ fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'#FF6B00' }}>LIVE</span>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display:'flex', alignItems:'center', height:22,
          background:'rgba(0,0,0,0.4)', borderBottom:`1px solid rgba(255,107,0,0.2)`,
          padding:'0 8px', flexShrink:0,
        }}>
          <div style={{ width:30, fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,255,255,0.35)', textAlign:'center' }}>#</div>
          <div style={{ width:26 }} />
          <div style={{ flex:1, fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,255,255,0.35)', paddingLeft:6, letterSpacing:'0.1em' }}>TEAM</div>
          <div style={{ width:28, textAlign:'center', fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,107,0,0.7)', letterSpacing:'0.05em' }}>⚡</div>
          <div style={{ width:28, textAlign:'center', fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(0,212,255,0.7)', letterSpacing:'0.05em' }}>💀</div>
          <div style={{ width:32, textAlign:'center', fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,255,255,0.35)' }}>ALIVE</div>
        </div>

        {/* Team rows */}
        <div style={{ display:'flex', flexDirection:'column', maxHeight:460, overflowY:'hidden' }}>
          {rows.map((team, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const rankColors = ['#FFB800','#C0C0C0','#CD7F32'];
            const rankColor = isTop3 ? rankColors[rank-1] : 'rgba(255,255,255,0.4)';
            const rowBg = rank === 1 ? 'rgba(255,184,0,0.06)' : idx%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent';

            return (
              <div key={team.id || idx} style={{
                display:'flex', alignItems:'center', height:34,
                background: rowBg,
                borderBottom:'1px solid rgba(255,255,255,0.03)',
                borderLeft: isTop3 ? `3px solid ${rankColors[rank-1]}` : '3px solid transparent',
                padding:'0 8px',
              }}>
                <div style={{ width:30, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:rankColor }}>
                  {rank}
                </div>
                <div style={{ width:26, display:'flex', justifyContent:'center' }}>
                  <TeamLogo team={team} size={20} />
                </div>
                <div style={{ flex:1, paddingLeft:6, fontFamily:'Orbitron', fontSize:10, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {team.name || 'TEAM'}
                </div>
                <div style={{ width:28, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:primary }}>
                  {team.total_tournament_kills || 0}
                </div>
                <div style={{ width:28, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:secondary }}>
                  {team.total_tournament_points || 0}
                </div>
                <div style={{ width:32, textAlign:'center', fontFamily:'Orbitron', fontSize:10, color: (team.alive||0) > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                  {team.alive !== undefined ? team.alive : '—'}/{team.totalPlayers||4}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ padding:'20px 0', textAlign:'center', fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em' }}>
              AWAITING TEAM DATA
            </div>
          )}
        </div>

        {/* Map strip */}
        <div style={{ background:'rgba(10,4,2,0.97)', borderTop:`1px solid ${primary}33`, display:'flex', alignItems:'center', minHeight:30, overflow:'hidden', flexShrink:0 }}>
          <div style={{ background:primary, padding:'0 8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, minWidth:56, height:'100%' }}>
            <span style={{ fontSize:7, fontWeight:900, color:'#000', letterSpacing:'0.06em', textAlign:'center', lineHeight:1.3 }}>MAP<br/>ROTATE</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', flex:1, padding:'0 4px', gap:2, overflowX:'hidden' }}>
            {['Bermuda','Purgatory','Kalahari','Bermuda','Purgatory','Kalahari'].map((map, i) => {
              const isCurr = currentMatch?.match_number === i+1;
              const isDone = currentMatch?.match_number > i+1;
              return (
                <div key={i} style={{
                  display:'flex', flexDirection:'column', alignItems:'center',
                  padding:'3px 4px', borderRadius:3, minWidth:32,
                  background: isCurr ? `${primary}20` : 'transparent',
                  border: isCurr ? `1px solid ${primary}60` : '1px solid transparent',
                  position:'relative',
                }}>
                  {isCurr && <span style={{ position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)', background:'#e53935', color:'#fff', fontSize:5, fontWeight:900, padding:'1px 3px', borderRadius:2 }}>LIVE</span>}
                  {isDone && <span style={{ position:'absolute', top:-5, left:'50%', transform:'translateX(-50%)', fontSize:7, color:'#4ade80' }}>✓</span>}
                  <span style={{ fontSize:7, fontWeight:700, color: isCurr ? primary : 'rgba(255,255,255,0.35)' }}>M{i+1}</span>
                  <span style={{ fontSize:6, fontWeight:700, color: isCurr ? '#fff' : 'rgba(255,255,255,0.4)', whiteSpace:'nowrap' }}>{map.substring(0,4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </FFPanel>
      <style>{`@keyframes ping{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 3: FULL STANDINGS (transparent, centered)
══════════════════════════════════════════════════ */
function FullStandings({ teams = [], design }) {
  const sorted = useMemo(() => [...teams].sort((a,b) => (b.total_tournament_points||0)-(a.total_tournament_points||0)||(b.total_tournament_kills||0)-(a.total_tournament_kills||0)), [teams]);
  const rankColors = ['#FFB800','#C0C0C0','#CD7F32'];

  return (
    <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:880 }}>
      <FFPanel>
        <FFPanelHeader design={design} center="OVERALL STANDINGS" />
        {/* Headers */}
        <div style={{ display:'flex', alignItems:'center', height:30, background:'rgba(0,0,0,0.4)', borderBottom:'2px solid rgba(255,107,0,0.3)', padding:'0 14px', flexShrink:0 }}>
          {[['RANK',40],['',30],['TEAM NAME',1],['KILLS',68],['BOOYAH',68],['PLACE PTS',78],['TOTAL PTS',86]].map(([label,w], i) => (
            <div key={i} style={{ width: typeof w==='number'&&w!==1 ? w : undefined, flex:w===1?1:undefined, textAlign:w===1?undefined:'center', paddingLeft: w===1?10:undefined, fontFamily:'Orbitron', fontSize:9, fontWeight:900, color: label==='TOTAL PTS'?'#00D4FF':'rgba(255,255,255,0.5)', letterSpacing:'0.12em' }}>
              {label}
            </div>
          ))}
        </div>
        {/* Rows */}
        <div style={{ display:'flex', flexDirection:'column', maxHeight:540, overflowY:'auto' }}>
          {sorted.map((team, idx) => {
            const rank = idx+1;
            const rc = rank<=3 ? rankColors[rank-1] : '#fff';
            const rowBg = rank===1 ? 'rgba(255,184,0,0.07)' : rank===2 ? 'rgba(148,163,184,0.04)' : rank===3 ? 'rgba(205,127,50,0.04)' : idx%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent';
            return (
              <div key={team.id||idx} style={{ display:'flex', alignItems:'center', height:38, background:rowBg, borderBottom:'1px solid rgba(255,255,255,0.03)', borderLeft:`3px solid ${rank<=3?rankColors[rank-1]:'transparent'}`, padding:'0 14px' }}>
                <div style={{ width:40, textAlign:'center', fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:rc }}>#{rank}</div>
                <div style={{ width:30, display:'flex', justifyContent:'center' }}>
                  <TeamLogo team={team} size={22} />
                </div>
                <div style={{ flex:1, paddingLeft:10, fontFamily:'Orbitron', fontSize:12, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{team.name||'—'}</div>
                <div style={{ width:68, textAlign:'center', fontFamily:'Orbitron', fontSize:12, color:'#FF6B00', fontWeight:700 }}>{team.total_tournament_kills||0}</div>
                <div style={{ width:68, textAlign:'center', fontFamily:'Orbitron', fontSize:12, color:'#00D4FF', fontWeight:700 }}>{team.booyahs||0}</div>
                <div style={{ width:78, textAlign:'center', fontFamily:'Orbitron', fontSize:12, color:'rgba(255,255,255,0.6)' }}>{team.placement_points||0}</div>
                <div style={{ width:86, textAlign:'center', fontFamily:'Orbitron', fontSize:15, fontWeight:900, color:'#fff' }}>{team.total_tournament_points||0}</div>
              </div>
            );
          })}
          {sorted.length===0 && (
            <div style={{ padding:'40px 0', textAlign:'center', fontFamily:'Orbitron', fontSize:11, color:'rgba(255,255,255,0.2)', letterSpacing:'0.2em' }}>NO STANDINGS DATA YET</div>
          )}
        </div>
      </FFPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 4: KILL FEED (transparent, bottom-left)
══════════════════════════════════════════════════ */
function KillFeedScreen({ killFeed = [], design }) {
  const activeKills = useMemo(() => [...killFeed].slice(-6).reverse(), [killFeed]);
  const primary = tok.acc(design);

  return (
    <div style={{ position:'absolute', left:24, bottom:60, width:360, zIndex:10 }}>
      <FFPanel>
        <FFPanelHeader design={design} center="BATTLE FEED" />
        <div style={{ display:'flex', flexDirection:'column', padding:'4px 0' }}>
          <AnimatePresence initial={false}>
            {activeKills.map((kill, idx) => (
              <motion.div
                key={kill.id || `${kill.killer_name}-${kill.timestamp}-${idx}`}
                initial={{ x:-40, opacity:0 }}
                animate={{ x:0, opacity:1 }}
                exit={{ x:40, opacity:0 }}
                transition={{ duration:0.25 }}
                style={{
                  display:'flex', alignItems:'center', padding:'5px 10px', gap:8,
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  background: idx===0 ? `${primary}08` : 'transparent',
                }}
              >
                <Skull size={12} style={{ color:primary, flexShrink:0 }} />
                <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#fff', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {kill.killer_name || kill.killer || '???'}
                </span>
                <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.35)', flexShrink:0 }}>
                  {kill.killer_team_name ? kill.killer_team_name.substring(0,8) : ''}
                </span>
                <span style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:800, color:primary, flexShrink:0 }}>
                  {kill.weapon || 'FRAG'}
                </span>
                <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>
                  {kill.killed_player_name || kill.killed || '???'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {activeKills.length===0 && (
            <div style={{ height:48, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em' }}>
              AWAITING COMBAT...
            </div>
          )}
        </div>
      </FFPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 5: PRE-MATCH MAP (solid bg)
══════════════════════════════════════════════════ */
function PreMatchMap({ match, teams = [], design }) {
  const mapName  = match?.map_name || match?.mapName || 'Bermuda';
  const matchNum = match?.match_number ? `MATCH ${String(match.match_number).padStart(2,'0')}` : 'UPCOMING MATCH';
  const primary  = tok.acc(design);
  const secondary = tok.acc2(design);
  const mapImg   = MAP_IMAGES?.[mapName] || null;
  const tLogo    = tok.logo(design);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <GamingBackground mapName={mapName} accent={primary} accent2={secondary} />
      <div style={{ position:'relative', zIndex:1, padding:'40px 60px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            {tLogo ? (
              <img src={tLogo} alt="logo" style={{ width:48, height:48, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            ) : (
              <div style={{ width:38, height:38, borderRadius:'50%', background:`${primary}22`, border:`1px solid ${primary}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'Orbitron', fontSize:16, fontWeight:900, color:primary }}>B</span>
              </div>
            )}
            <div>
              <div style={{ fontFamily:'Orbitron', fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'0.1em' }}>{tok.name(design)}</div>
              <div style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:700, color:secondary, letterSpacing:'0.2em' }}>{tok.sub(design)}</div>
            </div>
          </div>
          <div style={{ background:`${primary}15`, border:`1px solid ${primary}55`, padding:'6px 20px', borderRadius:4, fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:primary }}>
            {matchNum}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display:'flex', gap:60, alignItems:'center', flex:1, margin:'40px 0' }}>
          <div style={{ flex:1.2 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:secondary, letterSpacing:'0.4em' }}>NEXT MAP</span>
            <motion.h1 initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:120 }}
              style={{ fontFamily:'Orbitron', fontSize:96, fontWeight:900, color:'#fff', lineHeight:0.9, margin:'10px 0 30px', textShadow:`0 0 30px ${primary}40`, textTransform:'uppercase' }}>
              {mapName}
            </motion.h1>
            <div style={{ display:'flex', gap:30 }}>
              <div style={{ borderLeft:`3px solid ${primary}`, paddingLeft:12 }}>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>TEAMS IN LOBBY</div>
                <div style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff' }}>{teams.length||0} TEAMS</div>
              </div>
              <div style={{ borderLeft:`3px solid ${secondary}`, paddingLeft:12 }}>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>BATTLEGROUND</div>
                <div style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', textTransform:'uppercase' }}>{mapName}</div>
              </div>
            </div>
          </div>

          {/* Map image */}
          {mapImg && (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:480, height:480, borderRadius:16, overflow:'hidden', border:`1px solid ${primary}40`, boxShadow:`0 0 60px ${primary}30,0 0 120px ${primary}15` }}>
                <img src={mapImg} alt={mapName} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'saturate(1.2) contrast(1.05)' }} />
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${primary}20,transparent)` }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:14 }}>
          <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>OFFICIAL BROADCAST SYSTEM</span>
          <span style={{ fontFamily:'Orbitron', fontSize:9, color:primary, fontWeight:900, letterSpacing:'0.15em' }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 6: TODAY'S MATCHES
══════════════════════════════════════════════════ */
function TodaysMatches({ matches = [], design }) {
  const items = matches.length > 0 ? matches : [
    { matchNumber:'MATCH 01', mapName:'BERMUDA',   time:'16:00', status:'COMPLETED' },
    { matchNumber:'MATCH 02', mapName:'KALAHARI',  time:'16:45', status:'LIVE'      },
    { matchNumber:'MATCH 03', mapName:'PURGATORY', time:'17:30', status:'UPCOMING'  },
    { matchNumber:'MATCH 04', mapName:'BERMUDA',   time:'18:15', status:'UPCOMING'  },
    { matchNumber:'MATCH 05', mapName:'ALPINE',    time:'19:00', status:'UPCOMING'  },
  ];
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <div style={{ position:'relative', zIndex:1, padding:'40px 60px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Orbitron', fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'0.1em' }}>TODAY'S MATCH SCHEDULE</div>
            <div style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:700, color:secondary, letterSpacing:'0.2em' }}>{tok.name(design)}</div>
          </div>
          <Calendar style={{ color:primary }} size={30} />
        </div>

        <div style={{ display:'flex', gap:16, justifyContent:'center', margin:'40px 0' }}>
          {items.map((m, idx) => {
            const isLive = m.status==='LIVE';
            const isDone = m.status==='COMPLETED';
            return (
              <FFPanel key={idx} style={{ width:240, height:340, background: isLive ? `${primary}08` : 'rgba(6,9,21,0.9)' }}>
                <div style={{ padding:18, flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.4)' }}>{m.matchNumber||`MATCH 0${idx+1}`}</span>
                    <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:900, padding:'2px 8px', borderRadius:3, background: isLive ? primary : isDone ? 'rgba(255,255,255,0.08)' : `${secondary}18`, color: isLive ? '#000' : isDone ? 'rgba(255,255,255,0.5)' : secondary }}>
                      {m.status||'UPCOMING'}
                    </span>
                  </div>
                  <div style={{ textAlign:'center', margin:'20px 0' }}>
                    <MapPin size={28} style={{ color: isLive ? primary : secondary, margin:'0 auto 10px' }} />
                    <h3 style={{ fontFamily:'Orbitron', fontSize:20, fontWeight:900, color:'#fff', margin:0, textTransform:'uppercase' }}>{m.mapName||'BERMUDA'}</h3>
                  </div>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)' }}>EST START</span>
                    <span style={{ fontFamily:'Orbitron', fontSize:14, fontWeight:900, color: isLive ? primary : '#fff' }}>{m.time||'18:00'}</span>
                  </div>
                </div>
              </FFPanel>
            );
          })}
        </div>

        <div style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.04)', padding:'12px 24px', borderRadius:6, display:'flex', justifyContent:'space-between', fontFamily:'Orbitron', fontSize:9 }}>
          <span style={{ color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>ALL TIMINGS ARE LOCAL</span>
          <span style={{ color:secondary, fontWeight:700 }}>OFFICIAL BROADCAST</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 7: TEAMS SHOWCASE (solid bg)
══════════════════════════════════════════════════ */
function TeamsToday({ teams = [], design }) {
  const displayTeams = useMemo(() => {
    if (teams.length > 0) return teams.slice(0, 12);
    return Array.from({length:12}, (_,i) => ({ name:`TEAM ${i+1}`, color:'#FF6B00' }));
  }, [teams]);
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const tLogo = tok.logo(design);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <div style={{ position:'relative', zIndex:1, padding:'40px 60px', height:'100%', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {tLogo && <img src={tLogo} alt="logo" style={{ width:48, height:48, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />}
            <div>
              <div style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:secondary, letterSpacing:'0.3em' }}>{tok.sub(design)}</div>
              <div style={{ fontFamily:'Orbitron', fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'0.06em' }}>MEET THE TEAMS</div>
            </div>
          </div>
          <Users style={{ color:primary }} size={32} />
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14, flex:1 }}>
          {displayTeams.map((team, idx) => (
            <FFPanel key={idx} style={{ padding:0 }}>
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:12, textAlign:'center', gap:8 }}>
                {/* Logo ring */}
                <div style={{ width:60, height:60, borderRadius:'50%', border:`2px solid ${primary}`, boxShadow:`0 0 14px ${primary}44`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)' }}>
                  <TeamLogo team={team} size={40} />
                </div>
                <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>
                  {team.name||'TEAM'}
                </span>
                <span style={{ fontFamily:'Orbitron', fontSize:8, color:secondary, letterSpacing:'0.1em' }}>QUALIFIED</span>
              </div>
            </FFPanel>
          ))}
        </div>

        <div style={{ marginTop:20, height:34, background:`${primary}12`, border:`1px solid ${primary}33`, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontFamily:'Orbitron', fontSize:10, color:'#fff' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:primary }} />
          LOBBY READY — <strong style={{ color:secondary }}>{displayTeams.length} ACTIVE CONTENDERS</strong>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 8: CASTERS (solid bg)
══════════════════════════════════════════════════ */
function CastersScreen({ design }) {
  const casters = design?.casters?.length ? design.casters : [
    { name:'CASTER ONE',   role:'PLAY-BY-PLAY', handle:'@caster1', photo:'' },
    { name:'CASTER TWO',   role:'COLOR CASTER',  handle:'@caster2', photo:'' },
    { name:'HOST',         role:'TOURNAMENT HOST', handle:'@host',  photo:'' },
  ];
  const primary   = tok.acc(design);
  const secondary = tok.acc2(design);
  const tLogo     = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <div style={{ position:'relative', zIndex:1, padding:'40px 60px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Orbitron', fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'0.1em' }}>ON THE DESK</div>
            <div style={{ fontFamily:'Orbitron', fontSize:10, color:secondary, letterSpacing:'0.25em' }}>BROADCAST TEAM — {tok.name(design)}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {sponsorLogo && <img src={sponsorLogo} alt="sponsor" style={{ height:40, objectFit:'contain', opacity:0.8 }} onError={e=>e.target.style.display='none'} />}
            {tLogo && <img src={tLogo} alt="logo" style={{ height:40, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />}
            <Mic2 style={{ color:primary }} size={28} />
          </div>
        </div>

        {/* Caster cards */}
        <div style={{ display:'flex', gap:30, justifyContent:'center', flex:1, alignItems:'center' }}>
          {casters.map((c, i) => (
            <FFPanel key={i} style={{ width:360, padding:0 }}>
              <div style={{ padding:'30px 28px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                {/* Photo or initials */}
                <div style={{ width:110, height:110, borderRadius:'50%', border:`3px solid ${i===0?primary:secondary}`, boxShadow:`0 0 30px ${i===0?primary:secondary}44`, overflow:'hidden', marginBottom:20, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                  ) : (
                    <span style={{ fontFamily:'Orbitron', fontSize:36, fontWeight:900, color: i===0 ? primary : secondary }}>
                      {(c.name||'C').charAt(0)}
                    </span>
                  )}
                </div>
                <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color: i===0?primary:secondary, letterSpacing:'0.2em', marginBottom:6 }}>{c.role||'CASTER'}</span>
                <span style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', marginBottom:8 }}>{c.name||'—'}</span>
                <span style={{ fontFamily:'Orbitron', fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>{c.handle||''}</span>
              </div>
            </FFPanel>
          ))}
        </div>

        <div style={{ textAlign:'center', fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.2em' }}>
          {tok.name(design)} · {tok.sub(design)} · OFFICIAL BROADCAST
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 9: UPCOMING MAP BANNER (transparent overlay)
══════════════════════════════════════════════════ */
function UpcomingMap({ match, design }) {
  const mapName = match?.map_name || match?.mapName || 'Bermuda';
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const mapImg = MAP_IMAGES?.[mapName] || null;

  return (
    <div style={{ position:'absolute', left:'50%', bottom:30, transform:'translateX(-50%)', width:700, zIndex:10 }}>
      <FFPanel>
        <div style={{ display:'flex', alignItems:'center', padding:'0 20px', height:72, gap:20 }}>
          {mapImg && (
            <div style={{ width:80, height:52, borderRadius:6, overflow:'hidden', border:`1px solid ${primary}44`, flexShrink:0 }}>
              <img src={mapImg} alt={mapName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', marginBottom:4 }}>UPCOMING MAP</div>
            <div style={{ fontFamily:'Orbitron', fontSize:28, fontWeight:900, color:'#fff', textTransform:'uppercase', lineHeight:1 }}>{mapName}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:9, color:secondary, letterSpacing:'0.15em' }}>MATCH {match?.match_number||'—'}</span>
            <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:primary }}>PREPARING LOBBY</span>
          </div>
        </div>
      </FFPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 10: ELIMINATION ALERT (transparent, bottom center)
══════════════════════════════════════════════════ */
function EliminationAlert({ eliminations = [], design }) {
  const latest = eliminations.length > 0 ? eliminations[eliminations.length - 1] : null;
  const primary = tok.acc(design);

  if (!latest) return (
    <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)' }}>
      <FFPanel style={{ padding:'10px 24px' }}>
        <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em' }}>AWAITING ELIMINATIONS</span>
      </FFPanel>
    </div>
  );

  return (
    <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)', width:560, zIndex:10 }}>
      <AnimatePresence mode="wait">
        <motion.div key={latest.id || latest.timestamp}
          initial={{ y:30, opacity:0, scale:0.95 }}
          animate={{ y:0, opacity:1, scale:1 }}
          exit={{ y:-20, opacity:0, scale:1.02 }}
          transition={{ duration:0.3, type:'spring' }}
        >
          <FFPanel>
            <div style={{ display:'flex', alignItems:'center', padding:'10px 20px', gap:16 }}>
              <XCircle size={28} style={{ color:'#ef4444', flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em', marginBottom:2 }}>ELIMINATION</div>
                <div style={{ fontFamily:'Orbitron', fontSize:20, fontWeight:900, color:'#fff' }}>
                  {latest.eliminated_player_name || latest.player_name || '???'}
                </div>
                <div style={{ fontFamily:'Orbitron', fontSize:10, color:primary, letterSpacing:'0.1em' }}>
                  {latest.eliminated_team_name || latest.team_name || ''}
                </div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.3)' }}>TEAM ELIMINATED</div>
                <div style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:'#ef4444' }}>OUT</div>
              </div>
            </div>
          </FFPanel>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 11: MVP (solid bg)
══════════════════════════════════════════════════ */
function MVPScreen({ players = [], teams = [], design, overlayState }) {
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const tLogo = tok.logo(design);

  // Try overlayState first, then derive from players
  const mvpName   = overlayState?.mvp_player_name || overlayState?.mvpPlayerName || '—';
  const mvpTeam   = overlayState?.mvp_team_name   || overlayState?.mvpTeamName   || '—';
  const mvpKills  = overlayState?.mvp_kills        || overlayState?.mvpKills       || 0;
  const mvpPlayer = players.find(p => p.name === mvpName);
  const mvpTeamObj = teams.find(t => t.name === mvpTeam);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <style>{`@keyframes starPulse{0%,100%{transform:scale(1) rotate(0deg);filter:drop-shadow(0 0 10px ${primary}88)}50%{transform:scale(1.12) rotate(5deg);filter:drop-shadow(0 0 30px ${primary})}}`}</style>

      {/* Gold ambient */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 900px 700px at 50% 40%,${primary}18,transparent)`, zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:40 }}>
        {/* Trophy + header */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <div style={{ animation:'starPulse 2.5s infinite ease-in-out' }}>
            <Star size={60} style={{ color: primary }} fill={primary} />
          </div>
          <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:secondary, letterSpacing:'0.5em' }}>MATCH MVP</span>
        </div>

        {/* MVP card */}
        <FFPanel style={{ width:520, padding:0 }}>
          <div style={{ padding:'28px 32px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            {/* Team logo */}
            <div style={{ width:80, height:80, borderRadius:'50%', border:`3px solid ${primary}`, boxShadow:`0 0 30px ${primary}55`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', marginBottom:16 }}>
              <TeamLogo team={mvpTeamObj} size={56} />
            </div>
            <span style={{ fontFamily:'Orbitron', fontSize:11, color:primary, letterSpacing:'0.2em', marginBottom:4 }}>{mvpTeam}</span>
            <span style={{ fontFamily:'Orbitron', fontSize:36, fontWeight:900, color:'#fff', marginBottom:20 }}>{mvpName}</span>
            {/* Stats row */}
            <div style={{ display:'flex', gap:0, width:'100%', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:18, justifyContent:'space-around' }}>
              <div>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:primary, letterSpacing:'0.1em' }}>KILLS</div>
                <div style={{ fontFamily:'Orbitron', fontSize:28, fontWeight:900, color:'#fff', marginTop:4 }}>{mvpKills}</div>
              </div>
              <div style={{ width:1, background:'rgba(255,255,255,0.06)' }} />
              <div>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:secondary, letterSpacing:'0.1em' }}>TEAM</div>
                <div style={{ fontFamily:'Orbitron', fontSize:18, fontWeight:900, color:'#fff', marginTop:4 }}>{mvpTeam}</div>
              </div>
            </div>
          </div>
        </FFPanel>

        {tLogo && <img src={tLogo} alt="logo" style={{ height:36, objectFit:'contain', opacity:0.6, marginTop:8 }} onError={e=>e.target.style.display='none'} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 12: CHAMPIONS / BOOYAH (solid bg)
══════════════════════════════════════════════════ */
function ChampionsScreen({ teams = [], design, overlayState }) {
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const tLogo = tok.logo(design);

  const winnerName   = overlayState?.champion_team_name   || teams[0]?.name || '—';
  const totalPoints  = overlayState?.champion_total_points || teams[0]?.total_tournament_points || 0;
  const winnerTeamObj = teams.find(t=>t.name===winnerName) || teams[0];
  const totalKills   = winnerTeamObj?.total_tournament_kills || 0;

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <style>{`
        @keyframes confettiFall{0%{transform:translateY(-60px) rotate(0deg);opacity:1}100%{transform:translateY(1120px) rotate(360deg);opacity:0}}
        @keyframes crownPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 15px #FFB80099)}50%{transform:scale(1.08);filter:drop-shadow(0 0 35px #FFB800)}}
      `}</style>

      {/* Gold glow */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle,rgba(255,184,0,0.13) 0%,transparent 72%)', zIndex:0 }} />

      {/* Confetti */}
      {Array.from({length:28}).map((_,i) => {
        const colors = ['#FFB800','#FF6B00','#00D4FF','#ffffff','#4ade80'];
        return (
          <div key={i} style={{
            position:'absolute', top:-20, left:`${(i*7.14)%100}%`,
            width: 6+i%8, height: 6+i%8,
            background: colors[i%colors.length],
            borderRadius: i%2===0?'50%':2, opacity:0.85, zIndex:1,
            animation:`confettiFall ${4+i%4}s linear infinite`,
            animationDelay:`${i*0.22}s`,
          }} />
        );
      })}

      <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:16, maxWidth:960 }}>
        <div style={{ animation:'crownPulse 2.5s infinite ease-in-out', marginBottom:4 }}>
          <Crown size={76} style={{ color:'#FFB800' }} />
        </div>

        <h1 style={{ fontFamily:'Orbitron', fontSize:108, fontWeight:900, background:'linear-gradient(135deg,#FFB800,#FF6B00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:0.9, margin:0, letterSpacing:'0.04em', filter:'drop-shadow(0 0 30px rgba(255,107,0,0.4))' }}>
          BOOYAH!
        </h1>

        <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:secondary, letterSpacing:'0.5em', textTransform:'uppercase' }}>
          TOURNAMENT CHAMPION DECLARED
        </span>

        <FFPanel style={{ width:540, padding:0 }}>
          <div style={{ padding:'24px 30px', display:'flex', flexDirection:'column', alignItems:'center' }}>
            {/* Winner logo */}
            <div style={{ width:76, height:76, borderRadius:'50%', border:`3px solid #FFB800`, boxShadow:'0 0 30px rgba(255,184,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', marginBottom:14 }}>
              <TeamLogo team={winnerTeamObj} size={54} />
            </div>
            <span style={{ fontFamily:'Orbitron', fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', marginBottom:6 }}>MATCH WINNER</span>
            <span style={{ fontFamily:'Orbitron', fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'0.04em', textTransform:'uppercase' }}>{winnerName}</span>
            <div style={{ display:'flex', width:'100%', marginTop:18, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)', justifyContent:'space-around' }}>
              <div>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'#FF6B00', letterSpacing:'0.1em' }}>TOTAL KILLS</div>
                <div style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', marginTop:3 }}>{totalKills}</div>
              </div>
              <div style={{ width:1, background:'rgba(255,255,255,0.06)' }} />
              <div>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'#00D4FF', letterSpacing:'0.1em' }}>TOTAL POINTS</div>
                <div style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', marginTop:3 }}>{totalPoints}</div>
              </div>
            </div>
          </div>
        </FFPanel>

        {tLogo && <img src={tLogo} alt="logo" style={{ height:40, objectFit:'contain', opacity:0.65, marginTop:4 }} onError={e=>e.target.style.display='none'} />}

        <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', marginTop:8 }}>
          CONGRATULATIONS TO ALL COMPETING TEAMS — {tok.name(design)}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LOADING & ERROR STATES
══════════════════════════════════════════════════ */
function OverlayLoading() {
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#060912' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(255,107,0,0.15)', borderTop:'4px solid #FF6B00', animation:'spin 0.8s linear infinite' }} />
        <span style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.3em' }}>CONNECTING TO OVERLAY...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════ */
export default function Overlay() {
  const { screen }         = useParams();
  const [searchParams]     = useSearchParams();
  const shareToken         = searchParams.get('token') || searchParams.get('shareToken') || '';

  const { data, error, ready } = useOverlayPoll(shareToken);

  const {
    teams        = [],
    players      = [],
    killFeed     = [],
    eliminations = [],
    currentMatch,
    overlayState,
    design,
  } = data;

  if (!ready) return <div style={{ width:1920, height:1080, position:'relative', overflow:'hidden' }}><OverlayLoading /></div>;

  const screens = {
    blank:           <SetupBlank />,
    setup_blank:     <SetupBlank />,
    scoreboard:      <FFBoard       teams={teams} players={players} currentMatch={currentMatch} design={design} />,
    ff_scoreboard:   <FFBoard       teams={teams} players={players} currentMatch={currentMatch} design={design} />,
    standings:       <FullStandings teams={teams} design={design} />,
    full_standings:  <FullStandings teams={teams} design={design} />,
    killfeed:        <KillFeedScreen killFeed={killFeed} design={design} />,
    kill_feed:       <KillFeedScreen killFeed={killFeed} design={design} />,
    maplabel:        <PreMatchMap   match={currentMatch} teams={teams} design={design} />,
    map_label:       <PreMatchMap   match={currentMatch} teams={teams} design={design} />,
    'today-matches': <TodaysMatches matches={[]} design={design} />,
    today_matches:   <TodaysMatches matches={[]} design={design} />,
    teams:           <TeamsToday    teams={teams} design={design} />,
    teams_today:     <TeamsToday    teams={teams} design={design} />,
    casters:         <CastersScreen design={design} />,
    casters_screen:  <CastersScreen design={design} />,
    'upcoming-map':  <UpcomingMap   match={currentMatch} design={design} />,
    upcoming_map:    <UpcomingMap   match={currentMatch} design={design} />,
    'elim-alert':    <EliminationAlert eliminations={eliminations} design={design} />,
    elim_alert:      <EliminationAlert eliminations={eliminations} design={design} />,
    elimination:     <EliminationAlert eliminations={eliminations} design={design} />,
    mvp:             <MVPScreen     players={players} teams={teams} design={design} overlayState={overlayState} />,
    mvp_screen:      <MVPScreen     players={players} teams={teams} design={design} overlayState={overlayState} />,
    champions:       <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />,
    champion:        <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />,
    booyah:          <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />,
  };

  const component = screens[screen] ?? screens[screen?.replace(/-/g,'_')] ?? <SetupBlank />;

  return (
    <div style={{ width:1920, height:1080, position:'relative', overflow:'hidden', background:'transparent' }}>
      {component}
      {/* Connection error badge — subtle, doesn't block OBS */}
      {error && (
        <div style={{ position:'absolute', top:8, left:8, zIndex:999, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:4, padding:'3px 8px', fontFamily:'Orbitron', fontSize:8, color:'#f87171', letterSpacing:'0.1em' }}>
          RECONNECTING...
        </div>
      )}
    </div>
  );
}
