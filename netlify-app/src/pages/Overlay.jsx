/**
 * Overlay.jsx — 1080p OBS Browser Source Overlays (AAA Broadcast Quality)
 *
 * Route: /overlay/:screen
 * PUBLIC route — no auth required. Reads data via shareToken from URL param
 * OR directly via the public overlay endpoint (no sensitive data exposed).
 *
 * Available screens:
 *   blank | scoreboard | standings | killfeed | maplabel |
 *   today-matches | teams | casters | upcoming-map |
 *   elim-alert | mvp | champions | game-intro | schedule |
 *   ff-scoreboard | team-roster | roadmap | event-details
 *
 * OBS setup: 1920×1080, \"Shutdown source when not visible\" OFF,
 *            Check \"Transparent background\" for overlay-type screens.
 */

import { useParams, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skull, Star, Crown, Zap, Calendar, Users, MapPin, Award, XCircle, Mic2, Shield, Flame } from 'lucide-react';
import { MAP_IMAGES, getMapImages, setCustomMapImages } from '@/lib/maps';
import { safeArray } from '@/components/ErrorBoundary';
import { FFBoardV2, MatchInfoChip, GameIntroBanner, MatchScheduleGrid, PointRushStandings, RoadmapOverlay, EventDetailsOverlay } from '@/pages/FFWSOverlays';

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
        // Push custom map images to the maps module for overlay rendering
        if (json.design?.mapImages) {
          // maps.js is already statically imported — call directly, no dynamic import needed
          try { setCustomMapImages(json.design.mapImages); } catch (_) {}
        }
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
          matches:      Array.isArray(json.matches)      ? json.matches      : [],
          nextScheduledMatch: json.next_scheduled_match ?? null,
          championRush: json.champion_rush ?? null,
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
   THEME SYSTEM — 4 design layouts
   Switch via design.overlayStyle:
     'default'  — Orange/Cyan dual-border glass (original)
     'neon'     — Neon green/purple cyber grid
     'military' — Olive/khaki tactical HUD
     'minimal'  — Clean white-on-dark editorial
     'retro'    — Red/gold arcade CRT scanline
══════════════════════════════════════════════════ */

// ── Theme token resolver
// Fix known typos in design text values from the database
const DESIGN_TEXT_FIXES = {
  standingsSubtitle: { 'LEDEARBOARD': 'LEADERBOARD' },
  standingsTitle:     { 'OVERALL STANDING': 'OVERALL STANDINGS' },
  championTitle:      { 'CHAMPIOON': 'CHAMPION' },
  castersSubtitle:   { 'OFFICAL CREW': 'OFFICIAL CREW' },
  elimAlertLabel:    { 'SQUAD ELIMINITED': 'SQUAD ELIMINATED' },
  gameIntroSubtitle:  { 'NEXPLAY CHAMPION SHIP GROUPSTAGE': 'NEXPLAY CHAMPIONSHIP GROUP STAGE' },
  scheduleBrandText:  { 'NEXPLAY CHAMIONSHIP': 'NEXPLAY CHAMPIONSHIP' },
  scoreboardSubtitle: { 'STANDING': 'STANDINGS' },
  todayScheduleTitle: { 'TODAY SCHUDULE': 'TODAY SCHEDULE' },
};

function fixDesignText(design) {
  if (!design) return design;
  const fixed = { ...design };
  for (const [key, fixes] of Object.entries(DESIGN_TEXT_FIXES)) {
    const val = fixed[key];
    if (typeof val === 'string' && fixes[val]) {
      fixed[key] = fixes[val];
    }
  }
  // Fix trailing spaces
  if (typeof fixed.rosterTitle === 'string') fixed.rosterTitle = fixed.rosterTitle.trim();
  return fixed;
}

function getTheme(design) {
  const style = design?.overlayStyle || 'default';
  const userAcc  = design?.accentColor  || null;
  const userAcc2 = design?.accentColor2 || null;

  const presets = {
    default:  { p:'#7C3AED', s:'#3B82F6', bg:'rgba(4,6,14,0.92)',  border:'rgba(124, 58, 237,0.28)',  headerBg:'rgba(2,4,12,0.88)',       rowEven:'rgba(124, 58, 237,0.02)', shine:'rgba(124, 58, 237,0.10)',  cornerStyle:'dual',     gridOpacity:0.05, scanlines:false, glow:true  },
    neon:     { p:'#7BC043', s:'#BF00FF', bg:'rgba(2,4,12,0.92)',   border:'rgba(124, 58, 237,0.35)',  headerBg:'rgba(0,0,0,0.90)',       rowEven:'rgba(124, 58, 237,0.02)',  shine:'rgba(124, 58, 237,0.10)', cornerStyle:'glow',     gridOpacity:0.10, scanlines:false, glow:true  },
    military: { p:'#9ABF30', s:'#C8A850', bg:'rgba(8,12,6,0.92)',   border:'rgba(154,191,48,0.28)', headerBg:'rgba(5,8,3,0.90)',       rowEven:'rgba(154,191,48,0.02)', shine:'rgba(154,191,48,0.08)',cornerStyle:'tick',     gridOpacity:0.04, scanlines:false, glow:false },
    minimal:  { p:'#FFFFFF', s:'#888888', bg:'rgba(10,10,12,0.94)', border:'rgba(255,255,255,0.12)',headerBg:'rgba(255,255,255,0.04)', rowEven:'rgba(255,255,255,0.02)',shine:'rgba(255,255,255,0.06)',cornerStyle:'none',     gridOpacity:0.00, scanlines:false, glow:false },
    retro:    { p:'#FF3030', s:'#3B82F6', bg:'rgba(6,2,2,0.92)',    border:'rgba(239, 68, 68,0.35)',  headerBg:'rgba(0,0,0,0.88)',       rowEven:'rgba(239, 68, 68,0.02)',  shine:'rgba(239, 68, 68,0.10)', cornerStyle:'rect',     gridOpacity:0.08, scanlines:true,  glow:true  },
  };

  const t = { ...(presets[style] || presets.default) };
  // Only allow custom colors for non-default styles — lock FFWS colors for default
  if (userAcc  && style !== 'default') t.p = userAcc;
  if (userAcc2 && style !== 'default') t.s = userAcc2;
  return t;
}

// ── Themed Panel ─────────────────────────────
function ThemedPanel({ children, style: extraStyle, design }) {
  const t = getTheme(design);

  const corners = () => {
    if (t.cornerStyle === 'none') return null;
    if (t.cornerStyle === 'dual') return (
      <>
        <div style={{ position:'absolute', top:0, left:0, width:14, height:14, borderTop:`3px solid ${t.p}`, borderLeft:`3px solid ${t.p}`, borderRadius:'4px 0 0 0', zIndex:10 }} />
        <div style={{ position:'absolute', top:0, right:0, width:14, height:14, borderTop:`3px solid ${t.s}`, borderRight:`3px solid ${t.s}`, borderRadius:'0 4px 0 0', zIndex:10 }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:14, height:14, borderBottom:`3px solid ${t.s}`, borderLeft:`3px solid ${t.s}`, borderRadius:'0 0 0 4px', zIndex:10 }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderBottom:`3px solid ${t.p}`, borderRight:`3px solid ${t.p}`, borderRadius:'0 0 4px 0', zIndex:10 }} />
      </>
    );
    if (t.cornerStyle === 'glow') return (
      <>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${t.p},${t.s},${t.p},transparent)`, boxShadow:`0 0 12px ${t.p}` }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${t.p}55,transparent)` }} />
      </>
    );
    if (t.cornerStyle === 'tick') return (
      <>
        <div style={{ position:'absolute', top:0, left:0, width:20, height:3, background:t.p }} />
        <div style={{ position:'absolute', top:0, left:0, width:3, height:20, background:t.p }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:20, height:3, background:t.s }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:3, height:20, background:t.s }} />
      </>
    );
    if (t.cornerStyle === 'rect') return (
      <>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:t.p, boxShadow:`0 0 8px ${t.p}` }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:t.s, boxShadow:`0 0 8px ${t.s}` }} />
      </>
    );
    return null;
  };

  return (
    <div style={{
      background: t.bg,
      backdropFilter:'blur(14px) saturate(160%)',
      border:`1px solid ${t.border}`,
      borderRadius: t.cornerStyle === 'none' ? 2 : 8,
      boxShadow: t.glow
        ? `0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)`
        : `0 8px 32px rgba(0,0,0,0.6)`,
      position:'relative', overflow:'hidden', display:'flex', flexDirection:'column',
      ...extraStyle,
    }}>
      {t.scanlines && (
        <div style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none', backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)' }} />
      )}
      {corners()}
      {children}
    </div>
  );
}

// ── Themed Background ────────────────────────
function ThemedBackground({ design, mapName, children }) {
  const t = getTheme(design);
  const style = design?.overlayStyle || 'default';
  const mapImages = getMapImages();
  const mapImg = mapName ? (mapImages?.[mapName] || null) : null;

  const grids = {
    default:  { img:`linear-gradient(${t.p}08 1px,transparent 1px),linear-gradient(90deg,${t.p}08 1px,transparent 1px)`, sz:'80px 80px' },
    neon:     { img:`linear-gradient(${t.p}12 1px,transparent 1px),linear-gradient(90deg,${t.p}12 1px,transparent 1px)`, sz:'60px 60px' },
    military: { img:`repeating-linear-gradient(0deg,${t.p}06 0,${t.p}06 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,${t.p}06 0,${t.p}06 1px,transparent 1px,transparent 20px)`, sz:'20px 20px' },
    minimal:  { img:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`, sz:'120px 120px' },
    retro:    { img:`repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(239, 68, 68,0.04) 3px,rgba(239, 68, 68,0.04) 4px)`, sz:'4px 4px' },
  };
  const g = grids[style] || grids.default;

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:design?.bgColor || '#0D0B1A' }} />
      {mapImg && <div style={{ position:'absolute', inset:0, backgroundImage:`url(${mapImg})`, backgroundSize:'cover', backgroundPosition:'center', opacity:style==='minimal'?0.05:0.12, filter:'blur(8px) saturate(0.6)' }} />}
      <div style={{ position:'absolute', inset:0, backgroundImage:g.img, backgroundSize:g.sz }} />
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 1400px 900px at 50% 40%,${t.p}20,transparent 70%)` }} />
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 700px 700px at 85% 80%,${t.s}15,transparent 60%)` }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${t.p},${t.s},${t.p},transparent)`, boxShadow:t.glow?`0 0 12px ${t.p}88`:'' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${t.p}88,transparent)` }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 120% 120% at 50% 50%,transparent 25%,rgba(4,5,14,0.9) 100%)' }} />
      {t.scanlines && <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px)' }} />}
      <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%' }}>{children}</div>
    </div>
  );
}

// ── Themed Header Bar ────────────────────────
function ThemedHeader({ design, center, rightText }) {
  const t = getTheme(design);
  const tLogo = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);
  return (
    <div style={{ height:52, background:t.headerBg, borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0, zIndex:2 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {tLogo ? (
          <img src={tLogo} alt="logo" style={{ width:28, height:28, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
        ) : (
          <div style={{ width:24, height:24, borderRadius:4, background:`${t.p}22`, border:`1px solid ${t.p}66`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:t.p }}>B</span>
          </div>
        )}
        <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#fff', letterSpacing:'0.15em' }}>{tok.name(design).split(' ')[0]}</span>
      </div>
      <span style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:t.p, letterSpacing:'0.25em', textShadow:t.glow?`0 0 20px ${t.p}`:'none' }}>
        {center || 'LIVE OVERLAY'}
      </span>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {sponsorLogo && <img src={sponsorLogo} alt="sponsor" style={{ height:20, objectFit:'contain', opacity:0.75 }} onError={e=>e.target.style.display='none'} />}
        <span style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:700, color:t.s, letterSpacing:'0.15em' }}>{rightText || tok.sub(design)}</span>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════
   BACKGROUND — atmospheric gaming backdrop
══════════════════════════════════════════════════ */
function GamingBackground({ mapName, accent = '#7C3AED', accent2 = '#3B82F6' }) {
  const mapImages = getMapImages();
  const mapImg = mapImages?.[mapName] || null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: '#0D0B1A' }} />
      {mapImg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${mapImg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15, filter: 'blur(6px) saturate(0.7) contrast(1.1)',
        }} />
      )}
      {/* Carbon fiber grid effect */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 6px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 6px)`,
      }} />
      {/* Dynamic Grid overlay */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${accent}08 1px,transparent 1px),linear-gradient(90deg,${accent}08 1px,transparent 1px)`, backgroundSize:'80px 80px' }} />
      {/* Premium Vignette & Ambient Glow */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 1400px 900px at 50% 40%,${accent}22,transparent 70%)` }} />
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 700px 700px at 85% 80%,${accent2}18,transparent 60%)` }} />
      {/* Framing Lines */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${accent},${accent2},${accent},transparent)` }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${accent}AA,transparent)` }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 120% 120% at 50% 50%,transparent 25%,rgba(4,5,14,0.92) 100%)' }} />
      {/* Micro-Particles */}
      {[...Array(15)].map((_, i) => (
        <div key={i} style={{
          position:'absolute', width:i%3===0?4:2, height:i%3===0?4:2, borderRadius:'50%',
          background: i%2===0 ? accent : accent2,
          left:`${5+i*6.5}%`, top:`${10+(i*19)%80}%`, opacity:0.4,
          animation:`fprtcl ${4+(i%3)}s ease-in-out infinite alternate`,
          animationDelay:`${i*0.3}s`,
        }} />
      ))}
      <style>{`@keyframes fprtcl{from{transform:translateY(0) translateX(0);opacity:.25}to{transform:translateY(-30px) translateX(12px);opacity:.75}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════ */
const tok = {
  acc:  d => d?.accentColor        || '#7C3AED',
  acc2: d => d?.accentColor2       || '#3B82F6',
  bg:   d => d?.bgColor            || '#0D0B1A',
  txt:  d => d?.textColor          || '#ffffff',
  name: d => d?.tournamentName     || 'NEXOVERLAYS CHAMPIONSHIP',
  sub:  d => d?.tournamentSubtitle || 'GRAND FINALS',
  game: d => d?.gameLabel          || 'MATCH',
  logo: d => d?.logoUrl            || null,
  sponsorLogo: d => d?.sponsorLogoUrl || null,
};

/* ══════════════════════════════════════════════════
   SHARED PANEL COMPONENTS (100% compliant with design system)
══════════════════════════════════════════════════ */
function FFPanel({ children, style }) {
  return (
    <div style={{
      background: 'rgba(6,9,18,0.85)',
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(124, 58, 237,0.3)',
      borderRadius: 8,
      boxShadow: '0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      {/* Corner accents */}
      <div style={{ position:'absolute', top:0, left:0, width:14, height:14, borderTop:'3px solid #7C3AED', borderLeft:'3px solid #7C3AED', borderRadius:'4px 0 0 0', zIndex:10 }} />
      <div style={{ position:'absolute', top:0, right:0, width:14, height:14, borderTop:'3px solid #3B82F6', borderRight:'3px solid #3B82F6', borderRadius:'0 4px 0 0', zIndex:10 }} />
      <div style={{ position:'absolute', bottom:0, left:0, width:14, height:14, borderBottom:'3px solid #3B82F6', borderLeft:'3px solid #3B82F6', borderRadius:'0 0 0 4px', zIndex:10 }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderBottom:'3px solid #7C3AED', borderRight:'3px solid #7C3AED', borderRadius:'0 0 4px 0', zIndex:10 }} />
      {children}
    </div>
  );
}

function FFPanelHeader({ design, center }) {
  const tLogo = tok.logo(design);
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;
  return (
    <div style={{
      height: 48, background: 'rgba(4,5,11,0.7)',
      borderBottom: '1px solid rgba(124, 58, 237,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0, zIndex: 2,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {tLogo ? (
          <img src={tLogo} alt="logo"
            style={{ width:24, height:24, objectFit:'contain' }}
            onError={e => { e.target.style.display='none'; }}
          />
        ) : (
          <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(124, 58, 237,0.15)', border:'1px solid rgba(124, 58, 237,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:primary }}>B</span>
          </div>
        )}
        <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#fff', letterSpacing:'0.15em' }}>
          {tok.name(design).split(' ')[0]}
        </span>
      </div>
      <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:primary, letterSpacing:'0.2em', textTransform:'uppercase' }}>
        {center || 'LIVE OVERLAY'}
      </span>
      <span style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:700, color:secondary, letterSpacing:'0.15em', textTransform:'uppercase' }}>
        {tok.sub(design)}
      </span>
    </div>
  );
}

function TeamLogo({ team, size = 32 }) {
  const [imgErr, setImgErr] = useState(false);
  const url = team?.logo_url || team?.logo || null;
  if (url && !imgErr) {
    return (
      <img
        src={url} alt={team?.name || ''}
        style={{ width: size, height: size, objectFit:'contain', borderRadius: 4, display:'block' }}
        onError={() => setImgErr(true)}
      />
    );
  }
  const initials = (team?.name || 'TM').replace(/[^A-Z0-9]/gi, '').substring(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      background: `linear-gradient(135deg, ${team?.color || '#7C3AED'}, ${team?.color || '#7C3AED'}88)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.4, fontWeight:900, color:'#fff', fontFamily:'Orbitron',
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {initials}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 1: BLANK
══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   SCREEN 2: SCOREBOARD — FF INDICATOR STYLE
   Each team shows 4 life-line bars: green=alive, gray=eliminated
   Live updates via poll — revive turns gray → green instantly
══════════════════════════════════════════════════ */
function FFBoard({ teams = [], players = [], currentMatch, design }) {
  const rows = useMemo(() => {
    return [...safeArray(teams)]
      .map(team => {
        const tp = safeArray(players).filter(p => p.team_id === team.id);
        // Build exactly 4 slots — pad with dead slots if fewer than 4 players
        const slots = [];
        for (let i = 0; i < 4; i++) {
          if (tp[i]) slots.push({ name: tp[i].name, alive: tp[i].is_alive });
          else       slots.push({ name: null, alive: false }); // empty slot
        }
        const aliveCount = tp.filter(p => p.is_alive).length;
        return { ...team, slots, aliveCount, totalPlayers: tp.length };
      })
      .sort((a, b) =>
        (b.total_tournament_points||0) - (a.total_tournament_points||0) ||
        (b.total_tournament_kills||0)  - (a.total_tournament_kills||0)
      )
      .slice(0, 12);
  }, [teams, players]);

  const t         = getTheme(design);
  const primary   = t.p;
  const secondary = t.s;
  const matchNum  = currentMatch?.match_number
    ? `MATCH ${String(currentMatch.match_number).padStart(2,'0')}`
    : 'STANDBY';

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ position:'absolute', right:40, top:80, width:400, zIndex:10 }}
    >
      <ThemedPanel design={design}>
        {/* ── Header ── */}
        <div style={{ height:48, background:t.headerBg, borderBottom:`1px solid ${primary}44`, display:'flex', overflow:'hidden' }}>
          <div style={{ flex:1, background:`linear-gradient(90deg,${primary}44,transparent)`, display:'flex', alignItems:'center', paddingLeft:16 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:primary, letterSpacing:'0.18em', textShadow:t.glow?`0 0 16px ${primary}`:'none' }}>SCOREBOARD</span>
          </div>
          <div style={{ flex:1, background:`linear-gradient(270deg,${secondary}33,transparent)`, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:16 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:700, color:secondary, letterSpacing:'0.15em' }}>{matchNum}</span>
          </div>
        </div>

        {/* ── Column Headers ── */}
        <div style={{ display:'flex', alignItems:'center', height:24, background:'rgba(0,0,0,0.6)', borderBottom:`1px solid rgba(255,255,255,0.04)`, padding:'0 12px 0 14px' }}>
          <div style={{ width:28, fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,255,255,0.35)', textAlign:'center', letterSpacing:'0.1em' }}>#</div>
          <div style={{ width:28 }} />
          <div style={{ flex:1, fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,255,255,0.35)', paddingLeft:6, letterSpacing:'0.12em' }}>SQUAD</div>
          <div style={{ width:82, fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:'rgba(255,255,255,0.35)', textAlign:'center', letterSpacing:'0.1em' }}>ALIVE</div>
          <div style={{ width:36, textAlign:'center', fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:primary, letterSpacing:'0.1em' }}>KLS</div>
          <div style={{ width:36, textAlign:'center', fontFamily:'Orbitron', fontSize:7, fontWeight:900, color:secondary, letterSpacing:'0.1em' }}>PTS</div>
        </div>

        {/* ── Rows ── */}
        <div style={{ display:'flex', flexDirection:'column' }}>
          {safeArray(rows).map((team, idx) => {
            const rank      = idx + 1;
            const rankColors = ['#3B82F6','#C0C0C0','#CD7F32'];
            const rankColor = rank <= 3 ? rankColors[rank-1] : 'rgba(255,255,255,0.45)';
            const rowBg     = rank === 1
              ? `linear-gradient(90deg, ${primary}12, transparent)`
              : rank === 2 ? `linear-gradient(90deg, rgba(192,192,192,0.04), transparent)`
              : idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
            const isEliminated = team.aliveCount === 0 && team.totalPlayers > 0;

            return (
              <div key={team.id || idx} style={{
                display:'flex', alignItems:'center', height:46,
                background: rowBg,
                borderBottom:'1px solid rgba(255,255,255,0.03)',
                borderLeft: rank <= 3 ? `3px solid ${rankColors[rank-1]}` : '3px solid transparent',
                padding:'0 12px 0 11px',
                opacity: isEliminated ? 0.45 : 1,
                transition:'opacity 0.4s ease',
              }}>
                {/* Rank */}
                <div style={{ width:28, textAlign:'center', fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:rankColor }}>
                  {String(rank).padStart(2,'0')}
                </div>

                {/* Team logo */}
                <div style={{ width:28, display:'flex', justifyContent:'center' }}>
                  <TeamLogo team={team} size={22} />
                </div>

                {/* Team name */}
                <div style={{ flex:1, paddingLeft:6, fontFamily:'Orbitron', fontSize:10, fontWeight:900, color: isEliminated ? 'rgba(255,255,255,0.3)' : '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  {team.name || 'TEAM'}
                </div>

                {/* ── 4 LIFE-LINE INDICATORS ── */}
                <div style={{ width:82, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  {team.slots.map((slot, si) => {
                    const isAlive   = slot.alive;
                    const isEmpty   = slot.name === null;
                    const barColor  = isAlive
                      ? '#7BC043'                        // green — alive
                      : isEmpty
                      ? 'rgba(255,255,255,0.06)'         // very faint — no player in slot
                      : 'rgba(255,255,255,0.18)';        // gray — eliminated

                    return (
                      <div key={si} style={{
                        width: 14,
                        height: 28,
                        borderRadius: 3,
                        background: barColor,
                        boxShadow: isAlive ? `0 0 8px #7BC043aa, 0 0 2px #7BC043` : 'none',
                        transition: 'background 0.35s ease, box-shadow 0.35s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {/* Alive shimmer stripe */}
                        {isAlive && (
                          <div style={{
                            position:'absolute', top:0, left:0, right:0, height:'40%',
                            background:'rgba(255,255,255,0.25)',
                            borderRadius:'3px 3px 0 0',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Kills */}
                <div style={{ width:36, textAlign:'center', fontFamily:'Rajdhani', fontSize:16, fontWeight:900, color: isEliminated ? 'rgba(124, 58, 237,0.4)' : primary }}>
                  {team.total_tournament_kills || 0}
                </div>

                {/* Points */}
                <div style={{ width:36, textAlign:'center', fontFamily:'Rajdhani', fontSize:16, fontWeight:900, color: isEliminated ? 'rgba(59,130,246,0.4)' : secondary }}>
                  {team.total_tournament_points || 0}
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div style={{ padding:'30px 0', textAlign:'center', fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em' }}>
              WAITING FOR TEAM DATA...
            </div>
          )}
        </div>

        {/* ── Footer legend ── */}
        <div style={{ height:26, background:t.headerBg, borderTop:`1px solid rgba(255,255,255,0.04)`, display:'flex', alignItems:'center', justifyContent:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:18, borderRadius:2, background:'#7BC043', boxShadow:t.glow?'0 0 6px #7BC043aa':'none' }} />
            <span style={{ fontFamily:'Orbitron', fontSize:7, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>ALIVE</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:18, borderRadius:2, background:'rgba(255,255,255,0.18)' }} />
            <span style={{ fontFamily:'Orbitron', fontSize:7, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>ELIMINATED</span>
          </div>
        </div>
      </ThemedPanel>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 3: STANDINGS (FULL TOURNAMENT TABLE)
══════════════════════════════════════════════════ */
function FullStandings({ teams = [], design }) {
  const sorted = useMemo(() => [...safeArray(teams)].sort((a,b) => (b.total_tournament_points||0)-(a.total_tournament_points||0)||(b.total_tournament_kills||0)-(a.total_tournament_kills||0)), [teams]);
  const rankColors = ['#3B82F6','#C0C0C0','#CD7F32'];
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;

  const tLogo2 = tok.logo(design);
  const sponsorLogo2 = tok.sponsorLogo(design);
  const bgUrl = design?.backgrounds?.standings || '';

  return (
    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary}>
      <ThemedBackground design={design}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
        
        {/* Giant header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, borderBottom:`2px solid ${primary}88`, paddingBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {tLogo2 && <img src={tLogo2} alt="logo" style={{ height:52, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />}
            <div>
              <div style={{ fontFamily:'Orbitron', fontSize:14, color:primary, letterSpacing:'0.4em', fontWeight:900, textShadow:t.glow?`0 0 20px ${primary}`:'none' }}>{(design?.standingsSubtitle || 'LEADERBOARD').toUpperCase()}</div>
              <div style={{ fontFamily:'Orbitron', fontSize:42, fontWeight:900, color:'#fff', letterSpacing:'0.15em' }}>{(design?.standingsTitle || 'OVERALL STANDINGS').toUpperCase()}</div>
            </div>
          </div>
          <div style={{ textAlign:'right', fontFamily:'Orbitron', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            {sponsorLogo2 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                <span style={{ fontFamily:'Orbitron', fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em' }}>SPONSORED BY</span>
                <img src={sponsorLogo2} alt="sponsor" style={{ height:28, objectFit:'contain', opacity:0.85 }} onError={e=>e.target.style.display='none'} />
              </div>
            )}
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em' }}>{tok.name(design)}</div>
            <div style={{ fontSize:14, color:secondary, fontWeight:900, letterSpacing:'0.15em' }}>{tok.sub(design)}</div>
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ThemedPanel design={design} style={{ width:'100%', maxHeight:700 }}>
            {/* Headers */}
            <div style={{ display:'flex', alignItems:'center', height:48, background:t.headerBg, borderBottom:`2px solid ${primary}44`, padding:'0 24px' }}>
              <div style={{ width:60, fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'rgba(255,255,255,0.4)', textAlign:'center', letterSpacing:'0.15em' }}>RANK</div>
              <div style={{ width:40 }} />
              <div style={{ flex:1, fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'rgba(255,255,255,0.4)', paddingLeft:16, letterSpacing:'0.15em' }}>TEAM NAME</div>
              <div style={{ width:100, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#3B82F6', letterSpacing:'0.15em' }}>PPT</div>
              <div style={{ width:100, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:primary, letterSpacing:'0.15em' }}>KILLS</div>
              <div style={{ width:120, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#7BC043', letterSpacing:'0.15em' }}>KILL PTS</div>
              <div style={{ width:150, textAlign:'center', fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:secondary, letterSpacing:'0.15em' }}>TOTAL PTS</div>
            </div>

            {/* Rows */}
            <div style={{ display:'flex', flexDirection:'column', overflowY:'auto' }}>
              {sorted.map((team, idx) => {
                const rank = idx+1;
                const rc = rank<=3 ? rankColors[rank-1] : '#fff';
                const rowBg = rank===1 ? 'rgba(124, 58, 237,0.06)' : rank===2 ? 'rgba(59,130,246,0.04)' : idx%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent';
                const crEligible = team.champion_rush_eligible;
                const crBorder = crEligible ? '4px solid #3B82F6' : `4px solid ${rank<=3?rankColors[rank-1]:'transparent'}`;
                const crBg = crEligible ? 'rgba(255, 199, 0, 0.08)' : rowBg;
                return (
                  <div key={team.id||idx} style={{ display:'flex', alignItems:'center', height:52, background:crBg, borderBottom:'1px solid rgba(255,255,255,0.03)', borderLeft:crBorder, padding:'0 24px', boxShadow: crEligible ? 'inset 0 0 10px rgba(255, 199, 0, 0.1)' : 'none' }}>
                    <div style={{ width:60, textAlign:'center', fontFamily:'Orbitron', fontSize:16, fontWeight:900, color:crEligible ? '#3B82F6' : rc, textShadow: crEligible ? '0 0 8px rgba(255, 199, 0, 0.5)' : 'none' }}>#{rank}{crEligible && <span style={{ fontSize: 9, marginLeft: 2 }}>🏆</span>}</div>
                    <div style={{ width:40, display:'flex', justifyContent:'center' }}>
                      <TeamLogo team={team} size={28} />
                    </div>
                    <div style={{ flex:1, paddingLeft:16, fontFamily:'Orbitron', fontSize:14, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.1em' }}>{team.name||'—'}</div>
                    {(() => {
                      const ppk = 1; // default; overlay doesn't have tournament config
                      const totalKills = team.total_tournament_kills || 0;
                      const totalPts = team.total_tournament_points || 0;
                      const killPts = totalKills * ppk;
                      const ppt = totalPts - killPts;
                      return (
                        <>
                          <div style={{ width:100, textAlign:'center', fontFamily:'Rajdhani', fontSize:18, fontWeight:900, color:'#3B82F6' }}>{ppt}</div>
                          <div style={{ width:100, textAlign:'center', fontFamily:'Rajdhani', fontSize:20, color:primary, fontWeight:900 }}>{totalKills}</div>
                          <div style={{ width:120, textAlign:'center', fontFamily:'Rajdhani', fontSize:18, fontWeight:900, color:'#7BC043' }}>{killPts}</div>
                          <div style={{ width:150, textAlign:'center', fontFamily:'Rajdhani', fontSize:24, fontWeight:900, color:secondary }}>{totalPts}</div>
                        </>
                      );
                    })()}
                  </div>
                );
              })}
              {sorted.length===0 && (
                <div style={{ padding:'60px 0', textAlign:'center', fontFamily:'Orbitron', fontSize:12, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em' }}>NO STANDINGS DATA YET</div>
              )}
            </div>
          </ThemedPanel>
        </motion.div>
      </div>
      </ThemedBackground>
    </ScreenBackground>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 4: KILLFEED (OBS SCROLLING LIVE FEED)
══════════════════════════════════════════════════ */
function KillFeedScreen({ killFeed = [], design }) {
  const activeKills = useMemo(() => [...safeArray(killFeed)].slice(-6).reverse(), [killFeed]);
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;

  return (
    <div style={{ position:'absolute', left:40, top:80, width:420, zIndex:10 }}>
      <ThemedPanel design={design}>
        <div style={{ height: 48, background: 'rgba(0,0,0,0.8)', borderBottom: `1px solid ${primary}44`, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <Skull size={18} style={{ color: primary, marginRight: 8 }} />
          <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:primary, letterSpacing:'0.15em' }}>BATTLE FEED</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', padding:'4px 0' }}>
          <AnimatePresence initial={false}>
            {activeKills.map((kill, idx) => (
              <motion.div
                key={kill.id || `${kill.killer_name}-${kill.timestamp}-${idx}`}
                initial={{ x:-40, opacity:0 }}
                animate={{ x:0, opacity:1 }}
                exit={{ x:40, opacity:0 }}
                transition={{ duration:0.3 }}
                style={{
                  display:'flex', alignItems:'center', padding:'10px 16px', gap:10,
                  borderBottom:'1px solid rgba(255,255,255,0.03)',
                  background: idx===0 ? `rgba(124, 58, 237,0.08)` : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Skull size={14} style={{ color: primary }} />
                  <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
                    {kill.killer_name || kill.killer || '???'}
                  </span>
                </div>
                
                {kill.killer_team_name && (
                  <span style={{ fontFamily:'Orbitron', fontSize:9, color:secondary, border:`1px solid ${secondary}40`, padding:'2px 6px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {kill.killer_team_name.substring(0,8)}
                  </span>
                )}

                <span style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:primary, flex:1, textAlign:'center', letterSpacing:'0.05em' }}>
                  [{kill.weapon?.toUpperCase() || 'FRAG'}]
                </span>

                <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
                  {kill.killed_player_name || kill.killed || '???'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {activeKills.length===0 && (
            <div style={{ height:60, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>
              WAITING FOR COMBAT...
            </div>
          )}
        </div>
      </ThemedPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 5: PRE-MATCH MAP LABEL
══════════════════════════════════════════════════ */
function PreMatchMap({ match, teams = [], design }) {
  const mapName  = match?.map_name || match?.mapName || 'Bermuda';
  const matchNum = match?.match_number ? `MATCH ${String(match.match_number).padStart(2,'0')}` : 'UPCOMING MATCH';
  const primary  = tok.acc(design);
  const secondary = tok.acc2(design);
  const mapImages2 = getMapImages();
  const mapImg   = mapImages2?.[mapName] || null;
  const tLogo    = tok.logo(design);

  return (
    <ThemedBackground design={design} mapName={mapName}>
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', height:'100%' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {tLogo ? (
              <img src={tLogo} alt="logo" style={{ width:48, height:48, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
            ) : (
              <div style={{ width:40, height:40, borderRadius:'50%', background:`${primary}22`, border:`1px solid ${primary}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'Orbitron', fontSize:18, fontWeight:900, color:primary }}>B</span>
              </div>
            )}
            <div>
              <div style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'0.1em' }}>{tok.name(design)}</div>
              <div style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:700, color:secondary, letterSpacing:'0.25em' }}>{tok.sub(design)}</div>
            </div>
          </div>
          <div style={{ background:`${primary}18`, border:`1px solid ${primary}66`, padding:'8px 24px', borderRadius:6, fontFamily:'Orbitron', fontSize:14, fontWeight:900, color:primary, letterSpacing:'0.1em' }}>
            {matchNum}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display:'flex', gap:80, alignItems:'center', flex:1, margin:'40px 0' }}>
          <div style={{ flex:1.2 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:14, fontWeight:900, color:secondary, letterSpacing:'0.4em' }}>NEXT MAP</span>
            <motion.h1
              initial={{ scale:0.85, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              transition={{ type:'spring', stiffness:120 }}
              style={{ fontFamily:'Orbitron', fontSize:110, fontWeight:900, color:'#fff', lineHeight:0.9, margin:'12px 0 32px', textShadow:`0 0 40px ${primary}50`, textTransform:'uppercase', letterSpacing:'0.05em' }}
            >
              {mapName}
            </motion.h1>
            <div style={{ display:'flex', gap:40 }}>
              <div style={{ borderLeft:`3px solid ${primary}`, paddingLeft:16 }}>
                <div style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.15em' }}>TEAMS IN LOBBY</div>
                <div style={{ fontFamily:'Orbitron', fontSize:24, fontWeight:900, color:'#fff', marginTop:4 }}>{teams.length||12} TEAMS</div>
              </div>
              <div style={{ borderLeft:`3px solid ${secondary}`, paddingLeft:16 }}>
                <div style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.15em' }}>BATTLEGROUND</div>
                <div style={{ fontFamily:'Orbitron', fontSize:24, fontWeight:900, color:'#fff', textTransform:'uppercase', marginTop:4 }}>{mapName}</div>
              </div>
            </div>
          </div>

          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:500, height:500, borderRadius:16, overflow:'hidden', border:`2px solid ${primary}44`, boxShadow:`0 0 60px ${primary}30, 0 0 120px rgba(0,0,0,0.6)`, position:'relative' }}>
              <div style={{ width:'100%', height:'100%', background:`linear-gradient(135deg,#131127,#131127)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                {mapImg && (
                  <img src={mapImg} alt={mapName}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'saturate(1.2) contrast(1.05)' }}
                    onError={e=>{ e.target.style.display='none'; }}
                  />
                )}
                <div style={{ position:'relative', zIndex:1, textAlign:'center', pointerEvents:'none' }}>
                  <div style={{ fontFamily:'Orbitron', fontSize:54, fontWeight:900, color:`${primary}30`, textTransform:'uppercase', letterSpacing:'0.05em' }}>{mapName}</div>
                  <div style={{ fontFamily:'Orbitron', fontSize:11, color:`${primary}50`, letterSpacing:'0.4em', marginTop:10 }}>{(design?.preMatchMapLabel || 'FREE FIRE MAP').toUpperCase()}</div>
                </div>
              </div>
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${primary}15,transparent)` }} />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
          <span style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em' }}>NEXOVERLAYS TOURNAMENT OVERLAY SYSTEM</span>
          <span style={{ fontFamily:'Orbitron', fontSize:10, color:primary, fontWeight:900, letterSpacing:'0.2em' }}>BROADCAST SOURCE READY</span>
        </div>
      </div>
    </div>
    </ThemedBackground>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 6: TODAY'S MATCH SCHEDULE
══════════════════════════════════════════════════ */
function TodaysMatches({ matches = [], design }) {
  const items = matches.length > 0 ? matches : [
    { matchNumber:'MATCH 01', mapName:'BERMUDA',   time:'16:00', status:'COMPLETED' },
    { matchNumber:'MATCH 02', mapName:'KALAHARI',  time:'16:45', status:'LIVE'      },
    { matchNumber:'MATCH 03', mapName:'PURGATORY', time:'17:30', status:'UPCOMING'  },
    { matchNumber:'MATCH 04', mapName:'BERMUDA',   time:'18:15', status:'UPCOMING'  },
    { matchNumber:'MATCH 05', mapName:'ALPINE',    time:'19:00', status:'UPCOMING'  },
  ];
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;

  return (
    <ThemedBackground design={design}>
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', height:'100%' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Orbitron', fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'0.15em' }}>{(design?.todayScheduleTitle || "TODAY'S SCHEDULE").toUpperCase()}</div>
            <div style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:700, color:secondary, letterSpacing:'0.25em', marginTop:4 }}>{tok.name(design)}</div>
          </div>
          <Calendar style={{ color:primary }} size={36} />
        </div>

        <div style={{ display:'flex', gap:24, justifyContent:'center', margin:'40px 0' }}>
          {safeArray(items).map((m, idx) => {
            const isLive = m.status==='LIVE';
            const isDone = m.status==='COMPLETED';
            return (
              <ThemedPanel design={design} key={idx} style={{ width:280, height:380, background: isLive ? 'rgba(124, 58, 237,0.06)' : 'rgba(6,9,18,0.85)' }}>
                <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>{m.matchNumber||`MATCH 0${idx+1}`}</span>
                    <span style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:4, background: isLive ? primary : isDone ? 'rgba(255,255,255,0.08)' : `${secondary}18`, color: isLive ? '#000' : isDone ? 'rgba(255,255,255,0.4)' : secondary }}>
                      {m.status||'UPCOMING'}
                    </span>
                  </div>
                  <div style={{ textAlign:'center', margin:'24px 0' }}>
                    <MapPin size={36} style={{ color: isLive ? primary : secondary, margin:'0 auto 12px' }} />
                    <h3 style={{ fontFamily:'Orbitron', fontSize:24, fontWeight:900, color:'#fff', margin:0, textTransform:'uppercase', letterSpacing:'0.05em' }}>{m.mapName||'BERMUDA'}</h3>
                  </div>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>EST TIME</span>
                    <span style={{ fontFamily:'Rajdhani', fontSize:20, fontWeight:900, color: isLive ? primary : '#fff' }}>{m.time||'18:00'}</span>
                  </div>
                </div>
              </ThemedPanel>
            );
          })}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
          <span style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.2em' }}>NEXOVERLAYS TOURNAMENT OVERLAY SYSTEM</span>
          <span style={{ fontFamily:'Orbitron', fontSize:10, color:primary, fontWeight:900, letterSpacing:'0.2em' }}>BROADCAST LIVE SCHEDULE</span>
        </div>
      </div>
    </div>
    </ThemedBackground>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 7: MEET THE TEAMS
══════════════════════════════════════════════════ */
function TeamsToday({ teams = [], design }) {
  const displayTeams = useMemo(() => {
    if (teams.length > 0) return teams.slice(0, 12);
    return Array.from({length:12}, (_,i) => ({ name:`TEAM ${i+1}`, color:'#7C3AED' }));
  }, [teams]);
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;
  const tLogo = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);
  const bgUrl = design?.backgrounds?.teams || '';

  return (
    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {tLogo && <img src={tLogo} alt="logo" style={{ width:48, height:48, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />}
            <div>
              <div style={{ fontFamily:'Orbitron', fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'0.1em' }}>MEET THE TEAMS</div>
              <div style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:700, color:secondary, letterSpacing:'0.3em', marginTop:4 }}>{tok.sub(design)}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {sponsorLogo && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <span style={{ fontFamily:'Orbitron', fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em' }}>SPONSORED BY</span>
                <img src={sponsorLogo} alt="sponsor" style={{ height:36, objectFit:'contain', opacity:0.9 }} onError={e=>e.target.style.display='none'} />
              </div>
            )}
            <Users style={{ color:primary }} size={36} />
          </div>
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:20, flex:1, margin:'40px 0', alignItems:'center' }}>
          {safeArray(displayTeams).map((team, idx) => (
            <ThemedPanel design={design} key={idx} style={{ height:180 }}>
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16, textAlign:'center', gap:12 }}>
                {/* Logo ring */}
                <div style={{ width:72, height:72, borderRadius:'50%', border:`2px solid ${primary}`, boxShadow:`0 0 20px ${primary}33`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)' }}>
                  <TeamLogo team={team} size={48} />
                </div>
                <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  {team.name||'TEAM'}
                </span>
                <span style={{ fontFamily:'Orbitron', fontSize:8, color:secondary, letterSpacing:'0.15em' }}>QUALIFIED</span>
              </div>
            </ThemedPanel>
          ))}
        </div>

        <div style={{ height: 44, background:`${primary}15`, border:`1px solid ${primary}44`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', gap:12, fontFamily:'Orbitron', fontSize:11, color:'#fff', letterSpacing:'0.1em' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:primary }} />
          LOBBY MATCH READY — <strong style={{ color:secondary }}>{displayTeams.length} CONTENDERS DETECTED</strong>
        </div>
      </div>
    </ScreenBackground>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 8: CASTERS (3 SIDE-BY-SIDE CARDS)
══════════════════════════════════════════════════ */
function CastersScreen({ design }) {
  const casters = design?.casters?.length ? design.casters : [
    { name:'CASTER ONE',   role:'PLAY-BY-PLAY', handle:'@caster1', photo:'' },
    { name:'CASTER TWO',   role:'COLOR CASTER',  handle:'@caster2', photo:'' },
    { name:'HOST',         role:'TOURNAMENT HOST', handle:'@host',  photo:'' },
  ];
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;
  const tLogo     = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);

  return (
    <ThemedBackground design={design}>
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Orbitron', fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'0.15em' }}>{(design?.castersTitle || 'ON THE ANALYST DESK').toUpperCase()}</div>
            <div style={{ fontFamily:'Orbitron', fontSize:11, color:secondary, letterSpacing:'0.3em', marginTop:4 }}>{(design?.castersSubtitle || 'OFFICIAL BROADCAST CREW').toUpperCase()}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {sponsorLogo && <img src={sponsorLogo} alt="sponsor" style={{ height:44, objectFit:'contain', opacity:0.9 }} onError={e=>e.target.style.display='none'} />}
            {tLogo && <img src={tLogo} alt="logo" style={{ height:44, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />}
            <Mic2 style={{ color:primary }} size={32} />
          </div>
        </div>

        {/* Caster cards */}
        <div style={{ display:'flex', gap:32, justifyContent:'center', flex:1, alignItems:'center', margin:'40px 0' }}>
          {safeArray(casters).map((c, i) => (
            <ThemedPanel design={design} key={i} style={{ width:400, height:480 }}>
              <div style={{ padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', flex:1, justifyContent:'center' }}>
                {/* Photo or initials */}
                {(() => {
                  const cColor = i===0 ? primary : i===1 ? secondary : primary;
                  return (
                    <div style={{ width:140, height:140, borderRadius:'50%', border:`3px solid ${cColor}`, boxShadow:`0 0 30px ${cColor}44`, overflow:'hidden', marginBottom:28, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {c.photo ? (
                        <img src={c.photo} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                      ) : (
                        <span style={{ fontFamily:'Orbitron', fontSize:48, fontWeight:900, color: cColor }}>
                          {(c.name||'C').charAt(0)}
                        </span>
                      )}
                    </div>
                  );
                })()}
                {(() => {
                  const cColor = i===0 ? primary : i===1 ? secondary : primary;
                  return <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color: cColor, letterSpacing:'0.25em', marginBottom:8, textTransform:'uppercase' }}>{c.role||'CASTER'}</span>;
                })()}
                <span style={{ fontFamily:'Orbitron', fontSize:26, fontWeight:900, color:'#fff', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>{c.name||'—'}</span>
                <span style={{ fontFamily:'Orbitron', fontSize:12, color:'rgba(255,255,255,0.4)', letterSpacing:'0.15em' }}>{c.handle||''}</span>
              </div>
            </ThemedPanel>
          ))}
        </div>

        <div style={{ textAlign:'center', fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.25em' }}>
          {tok.name(design)} · {tok.sub(design)} · OFFICIAL BROADCAST SOURCE
        </div>
      </div>
    </div>
    </ThemedBackground>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 9: UPCOMING MAP BANNER
══════════════════════════════════════════════════ */
function UpcomingMap({ match, design }) {
  const mapName = match?.map_name || match?.mapName || 'Bermuda';
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;
  const mapImages = getMapImages();
  const mapImg = mapImages?.[mapName] || null;

  return (
    <div style={{ position:'absolute', left:'50%', bottom:50, transform:'translateX(-50%)', width:800, zIndex:10 }}>
      <ThemedPanel design={design}>
        <div style={{ display:'flex', alignItems:'center', padding:'0 24px', height:90, gap:24 }}>
          <div style={{ width:110, height:64, borderRadius:8, overflow:'hidden', border:`1px solid ${primary}44`, flexShrink:0, background:'#131127' }}>
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 8px)', position:'relative', background:'#131127' }}>
              {mapImg && (
                <img src={mapImg} alt={mapName}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e=>{ e.target.style.display='none'; }}
                />
              )}
              <span style={{ position:'relative', zIndex:1, fontFamily:'Orbitron', fontSize:9, fontWeight:900, color:`${primary}80`, textAlign:'center' }}>{mapName}</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.25em', marginBottom:2 }}>{(design?.upcomingMapLabel || 'UPCOMING BATTLEGROUND').toUpperCase()}</div>
            <div style={{ fontFamily:'Orbitron', fontSize:32, fontWeight:900, color:'#fff', textTransform:'uppercase', lineHeight:1, letterSpacing:'0.05em' }}>{mapName}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:10, color:secondary, letterSpacing:'0.15em' }}>MATCH {match?.match_number||'01'}</span>
            <span style={{ fontFamily:'Orbitron', fontSize:14, fontWeight:900, color:primary, letterSpacing:'0.1em' }}>WAITING IN LOBBY</span>
          </div>
        </div>
      </ThemedPanel>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 10: ELIMINATION ALERT (TICKER)
══════════════════════════════════════════════════ */
function EliminationAlert({ eliminations = [], design }) {
  const latest = eliminations.length > 0 ? eliminations[eliminations.length - 1] : null;
  const primary = tok.acc(design);

  if (!latest) return (
    <div style={{ position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)' }}>
      <ThemedPanel design={design} style={{ padding:'12px 32px' }}>
        <span style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em' }}>MONITORING COMBAT...</span>
      </ThemedPanel>
    </div>
  );

  return (
    <div style={{ position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)', width:640, zIndex:10 }}>
      <AnimatePresence mode="wait">
        <motion.div key={latest.id || latest.timestamp}
          initial={{ y:30, opacity:0, scale:0.95 }}
          animate={{ y:0, opacity:1, scale:1 }}
          exit={{ y:-20, opacity:0, scale:1.02 }}
          transition={{ duration:0.3, type:'spring' }}
        >
          <ThemedPanel design={design}>
            <div style={{ display:'flex', alignItems:'center', padding:'12px 24px', gap:20 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #ef4444' }}>
                <Flame size={20} style={{ color:'#ef4444' }} />
              </div>
              <div>
                <div style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.25em', marginBottom:2 }}>{(design?.elimAlertLabel || 'TEAM SQUAD ELIMINATED').toUpperCase()}</div>
                <div style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#fff', textTransform:'uppercase' }}>
                  {latest.eliminated_player_name || latest.player_name || 'SQUAD'}
                </div>
                <div style={{ fontFamily:'Orbitron', fontSize:11, color:primary, letterSpacing:'0.15em' }}>
                  {latest.eliminated_team_name || latest.team_name || 'CONTENDER'}
                </div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>STATUS</div>
                <div style={{ fontFamily:'Orbitron', fontSize:16, fontWeight:900, color:'#ef4444', letterSpacing:'0.15em' }}>OUT</div>
              </div>
            </div>
          </ThemedPanel>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 11: MVP (MATCH REVEAL)
══════════════════════════════════════════════════ */
function MVPScreen({ players = [], teams = [], design, overlayState }) {
  const mvpName = overlayState?.mvp_player_name || overlayState?.mvpPlayerName || '';
  const mvpTeam = overlayState?.mvp_team_name   || overlayState?.mvpTeamName   || '';
  const mvpKills = overlayState?.mvp_kills      || overlayState?.mvpKills       || 0;
  
  // Extra stats if available, or randomized high-fidelity stats suitable for Free Fire esports matches
  const mvpDamage = overlayState?.mvp_damage || overlayState?.mvpDamage || 1450;
  const mvpHeadshots = overlayState?.mvp_headshots || overlayState?.mvpHeadshots || 4;

  const mvpTeamObj = safeArray(teams).find(t => t.name === mvpTeam) ?? null;
  const mvpPlayerObj = safeArray(players).find(p => p.id === overlayState?.mvp_player_id || p.name === mvpName) ?? null;
  const mvpPhoto = mvpPlayerObj?.photo_url || null;
  const tLogo = tok.logo(design);

  // Render elegant pending empty state if no MVP data is present
  if (!mvpName || mvpName === 'MVP PLAYER') {
    return (
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: 1920, height: 1080,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <style>{}</style>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: '#0D0B1A',
            border: '2px solid #7C3AED',
            clipPath: 'polygon(15px 0%, 100% 0%, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0% 100%, 0% 15px)',
            padding: '50px 80px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}
        >
          <div style={{
            fontFamily: 'Teko',
            fontSize: 72,
            letterSpacing: '2px',
            color: '#ffffff',
            lineHeight: 1,
            textTransform: 'uppercase',
            animation: 'glowPulse 3s infinite ease-in-out'
          }}>
            MVP PENDING
          </div>
          <div style={{
            fontFamily: 'Rajdhani',
            fontSize: 16,
            fontWeight: 600,
            color: '#7C3AED',
            letterSpacing: '3px',
            marginTop: 10,
            textTransform: 'uppercase'
          }}>
            AWAITING MATCH CONFIRMATION
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, width: 1920, height: 1080,
      background: 'transparent',
      overflow: 'hidden',
      color: '#ffffff'
    }}>
      <style>{}</style>

      {/* Grid background structure */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        {/* LEFT SIDE (45% width) */}
        <motion.div
          initial={{ x: -600, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '45%',
            height: '100%',
            background: 'linear-gradient(135deg, #0D0B1A 0%, #131127 100%)',
            borderRight: '4px solid #7C3AED',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 90px), calc(100% - 90px) 100%, 0% 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 100,
            paddingRight: 60,
            position: 'relative',
            boxShadow: '10px 0px 40px rgba(0,0,0,0.8)'
          }}
        >
          {/* Header Tag / Small Title */}
          <div style={{
            fontFamily: 'Rajdhani',
            fontSize: 14,
            fontWeight: 700,
            color: '#3B82F6',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ width: 8, height: 8, backgroundColor: '#7C3AED', display: 'inline-block' }}></span>
            MATCH MVP CHAMPION REVEAL
          </div>

          {/* Large MVP Text with Orange Gradient */}
          <h1 style={{
            fontFamily: 'Teko',
            fontSize: 100,
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 0.9,
            margin: '0 0 10px 0',
            letterSpacing: '2px',
            background: 'linear-gradient(to right, #ffffff 30%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))'
          }}>
            {mvpName}
          </h1>

          {/* Team Name Badge with clip-path */}
          <div style={{
            alignSelf: 'flex-start',
            background: '#7C3AED',
            color: '#0D0B1A',
            fontFamily: 'Teko',
            fontSize: 24,
            fontWeight: 600,
            padding: '4px 24px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
            marginBottom: 48
          }}>
            {mvpTeam}
          </div>

          {/* Statistics Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
            {/* KILLS STAT */}
            <div style={{
              background: '#131127',
              borderLeft: '4px solid #7C3AED',
              padding: '16px 24px',
              clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <span style={{
                fontFamily: 'Rajdhani',
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>KILLS</span>
              <span style={{
                fontFamily: 'Teko',
                fontSize: 54,
                fontWeight: 700,
                color: '#3B82F6',
                lineHeight: 1,
                letterSpacing: '1px'
              }}>{mvpKills}</span>
            </div>

            {/* DAMAGE STAT */}
            <div style={{
              background: '#131127',
              borderLeft: '4px solid #3B82F6',
              padding: '16px 24px',
              clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <span style={{
                fontFamily: 'Rajdhani',
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>DAMAGE</span>
              <span style={{
                fontFamily: 'Teko',
                fontSize: 44,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '1px'
              }}>{mvpDamage}</span>
            </div>

            {/* HEADSHOTS STAT */}
            <div style={{
              background: '#131127',
              borderLeft: '4px solid #7C3AED',
              padding: '16px 24px',
              clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}>
              <span style={{
                fontFamily: 'Rajdhani',
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>HEADSHOTS</span>
              <span style={{
                fontFamily: 'Teko',
                fontSize: 44,
                fontWeight: 700,
                color: '#7C3AED',
                lineHeight: 1,
                letterSpacing: '1px'
              }}>{mvpHeadshots}</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE (55% width) */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '55%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Slow-moving animated diagonal background glow */}
          <div style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: 'linear-gradient(90deg, transparent 30%, rgba(124,58,237,0.15) 50%, transparent 70%)',
            animation: 'diagonalGlow 4s infinite linear',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Photo Frame Container with angular cutouts */}
          <div style={{
            width: 600,
            height: 750,
            background: 'rgba(20,20,24,0.6)',
            border: '2px solid #7C3AED',
            clipPath: 'polygon(40px 0%, 100% 0%, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0% 100%, 0% 40px)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 50px rgba(124,58,237,0.2)',
            zIndex: 1
          }}>
            {/* Additional inner accent overlay lines */}
            <div style={{
              position: 'absolute',
              inset: 10,
              border: '1px solid rgba(59,130,246,0.2)',
              clipPath: 'polygon(35px 0%, 100% 0%, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0% 100%, 0% 35px)',
              pointerEvents: 'none'
            }} />

            {/* Display Team Logo as background watermark if loaded */}
            {mvpTeamObj && (
              <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                opacity: 0.15,
                zIndex: 1,
                transform: 'scale(1.8)'
              }}>
                <TeamLogo team={mvpTeamObj} size={200} />
              </div>
            )}

            {/* Main Player Image */}
            {mvpPhoto ? (
              <img
                src={mvpPhoto}
                alt={mvpName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'relative',
                  zIndex: 2
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                position: 'relative'
              }}>
                <div style={{ transform: 'scale(1.5)', marginBottom: 24 }}>
                  <TeamLogo team={mvpTeamObj} size={120} />
                </div>
                <div style={{
                  fontFamily: 'Teko',
                  fontSize: 24,
                  letterSpacing: '2px',
                  color: '#3B82F6'
                }}>
                  {mvpTeam} SQUAD REPRESENTATIVE
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Sponsor / Tournament Branding Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: 20,
          left: '5%',
          width: '90%',
          height: 60,
          background: '#131127',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '4px solid #7C3AED',
          clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 100%, 20px 100%, 0% 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          zIndex: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{
          fontFamily: 'Rajdhani',
          fontSize: 14,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          TOURNAMENT CHAMPIONSHIP SERIES
        </div>

        {/* Sponsor/Logo Display */}
        {tLogo ? (
          <img
            src={tLogo}
            alt="logo"
            style={{ height: 32, objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            fontFamily: 'Teko',
            fontSize: 20,
            color: '#3B82F6',
            letterSpacing: '2px'
          }}>
            FREE FIRE ESPORTS
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN 12: CHAMPIONS (WINNER REVEAL SCREEN)
══════════════════════════════════════════════════ */
function ChampionsScreen({ teams = [], design, overlayState, players = [] }) {
  const t = getTheme(design);
  const primary = t.p;
  const secondary = t.s;
  const tLogo = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);
  const bgUrl = design?.backgrounds?.champion || '';

  const allTeams = safeArray(teams);
  const allPlayers = safeArray(players);
  const sorted = [...allTeams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  const winnerName = overlayState?.champion_team_name || sorted[0]?.name || 'CHAMPIONS';
  const totalPoints = overlayState?.champion_total_points || sorted[0]?.total_tournament_points || 0;
  const winnerTeamObj = allTeams.find(t => t.name === winnerName) || sorted[0] || null;
  const totalKills = winnerTeamObj?.total_tournament_kills || 0;
  const ppk = design?.pointsPerKill || 1;
  const killPts = totalKills * ppk;
  const placementPts = Math.max(0, totalPoints - killPts);

  // Champion's players (up to 5 for the panel display)
  const champPlayers = winnerTeamObj
    ? allPlayers.filter(p => p.team_id === winnerTeamObj.id).slice(0, 5)
    : [];
  // Pad to 5 slots
  const panels = Array.from({ length: 5 }, (_, i) => champPlayers[i] || null);

  // Panel layout: heights and tilts for the W-fan shape (2nd, 4th shorter; 1st,5th angled; 3rd tallest)
  const panelConfig = [
    { height: 340, tilt: -8, zIdx: 1, delay: 0.4 },
    { height: 380, tilt: -4, zIdx: 2, delay: 0.25 },
    { height: 420, tilt:  0, zIdx: 3, delay: 0.1 },
    { height: 380, tilt:  4, zIdx: 2, delay: 0.25 },
    { height: 340, tilt:  8, zIdx: 1, delay: 0.4 },
  ];

  return (
    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary}>
    <ThemedBackground design={design}>
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <style>{`
        @keyframes cFall{0%{transform:translateY(-40px) rotate(0deg);opacity:1}100%{transform:translateY(1120px) rotate(720deg);opacity:0}}
        @keyframes cPanelUp{0%{transform:translateY(80px) rotate(var(--tilt));opacity:0}100%{transform:translateY(0) rotate(var(--tilt));opacity:1}}
        @keyframes cTitleIn{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes cGlow{0%,100%{text-shadow:0 0 30px #7C3AED88,0 0 60px #7C3AED44}50%{text-shadow:0 0 50px #7C3AEDCC,0 0 100px #7C3AED66}}
        @keyframes cLogoIn{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes cShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

      {/* Deep navy base with blue radial bloom */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, #0D0B1A 0%, #0D0B1A 50%, #0D0B1A 100%)', zIndex:0 }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 1400px 800px at 50% 35%, rgba(0,120,255,0.22) 0%, rgba(0,60,180,0.08) 40%, transparent 70%)', zIndex:0 }} />
      {/* Subtle bottom vignette */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:300, background:'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)', zIndex:0 }} />

      {/* Confetti — blue/cyan/white */}
      {Array.from({length:50}).map((_,i) => {
        const cols = ['#7C3AED','#3B82F6','#ffffff','#7C3AED','#7C3AED','#ffffff'];
        return (
          <div key={i} style={{
            position:'absolute', top:-30, left:`${(i*3.7)%100}%`,
            width:5+i%7, height:5+i%7,
            background:cols[i%cols.length],
            borderRadius:i%2===0?'50%':2, opacity:0.8, zIndex:1,
            animation:`cFall ${3.5+i%5}s linear infinite`,
            animationDelay:`${i*0.13}s`,
          }} />
        );
      })}

      {/* TOP LOGOS BAR */}
      <div style={{ position:'absolute', top:32, left:48, right:48, display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:10 }}>
        {tLogo
          ? <img src={tLogo} alt="logo" style={{ height:44, objectFit:'contain', filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }} onError={e=>e.target.style.display='none'} />
          : <div style={{ fontFamily:'Orbitron', fontSize:14, fontWeight:900, color:'#7C3AED', letterSpacing:'0.2em' }}>{(design?.tournamentName||'NEXOVERLAYS').toUpperCase()}</div>
        }
        {sponsorLogo
          ? <img src={sponsorLogo} alt="sponsor" style={{ height:44, objectFit:'contain', filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }} onError={e=>e.target.style.display='none'} />
          : <div style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>{(design?.tournamentSubtitle||'GRAND FINALS').toUpperCase()}</div>
        }
      </div>

      {/* MAIN CONTENT */}
      <div style={{ position:'relative', zIndex:2, height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0, paddingTop:60 }}>

        {/* ── PLAYER PANELS ── */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:14, marginBottom:28 }}>
          {panels.map((player, i) => {
            const cfg = panelConfig[i];
            return (
              <div key={i} style={{
                width:164, height:cfg.height,
                position:'relative', zIndex:cfg.zIdx,
                '--tilt': `${cfg.tilt}deg`,
                animation:`cPanelUp 0.7s cubic-bezier(0.22,1,0.36,1) ${cfg.delay}s both`,
                transform:`rotate(${cfg.tilt}deg)`,
                borderRadius:'10px 10px 6px 6px',
                overflow:'hidden',
                background:'linear-gradient(180deg, rgba(0,100,220,0.18) 0%, rgba(0,50,140,0.08) 60%, rgba(0,0,0,0.6) 100%)',
                backdropFilter:'blur(8px)',
                border:'1px solid rgba(124, 58, 237,0.30)',
                boxShadow:`0 0 30px rgba(0,120,255,0.15), inset 0 1px 0 rgba(124, 58, 237,0.25)`,
              }}>
                {/* Top blue accent bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #7C3AED, #3B82F6)', borderRadius:'10px 10px 0 0' }} />
                {/* Corner accents */}
                <div style={{ position:'absolute', top:0, left:0, width:12, height:12, borderTop:'2px solid #7C3AED', borderLeft:'2px solid #7C3AED', borderRadius:'10px 0 0 0' }} />
                <div style={{ position:'absolute', top:0, right:0, width:12, height:12, borderTop:'2px solid #3B82F6', borderRight:'2px solid #3B82F6', borderRadius:'0 10px 0 0' }} />

                {/* Player photo or team logo fill */}
                {player?.photo_url ? (
                  <img src={player.photo_url} alt={player.name}
                    style={{ position:'absolute', top:0, left:0, right:0, bottom:48, width:'100%', objectFit:'cover', objectPosition:'top' }}
                    onError={e=>{ e.target.style.display='none'; }}
                  />
                ) : (
                  <div style={{ position:'absolute', top:0, left:0, right:0, bottom:48, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,40,120,0.2)' }}>
                    {winnerTeamObj?.logo_url
                      ? <img src={winnerTeamObj.logo_url} alt="" style={{ width:64, height:64, objectFit:'contain', opacity:0.6 }} onError={e=>e.target.style.display='none'} />
                      : <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(124, 58, 237,0.15)', border:'1px solid rgba(124, 58, 237,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#7C3AED' }}>{(winnerName||'C').charAt(0)}</span></div>
                    }
                  </div>
                )}

                {/* Photo gradient overlay */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, background:'linear-gradient(0deg, rgba(0,5,20,0.95) 0%, transparent 100%)' }} />

                {/* Bottom label */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.08em', lineHeight:1.2,
                    textShadow:'0 1px 4px rgba(0,0,0,0.8)' }}>
                    {player ? player.name : (winnerName||'').split(' ').slice(0,1).join('')}
                  </div>
                  <div style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:700, color:'#7C3AED', letterSpacing:'0.1em', marginTop:2, opacity:0.85 }}>
                    {(winnerName||'SQUAD').toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TEAM LOGO (below panels) ── */}
        <div style={{ animation:'cLogoIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.6s both', marginBottom:18 }}>
          <div style={{
            width:80, height:80, borderRadius:'50%',
            border:'3px solid #7C3AED',
            boxShadow:'0 0 40px rgba(124, 58, 237,0.5), 0 0 80px rgba(0,100,255,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(0,20,60,0.8)',
          }}>
            {winnerTeamObj?.logo_url
              ? <img src={winnerTeamObj.logo_url} alt="" style={{ width:56, height:56, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
              : <span style={{ fontFamily:'Orbitron', fontSize:26, fontWeight:900, color:'#7C3AED' }}>{(winnerName||'C').charAt(0)}</span>
            }
          </div>
        </div>

        {/* ── CHAMPIONS TITLE ── */}
        <div style={{ animation:'cTitleIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.55s both', textAlign:'center' }}>
          <h1 style={{
            fontFamily:'Orbitron', fontSize:100, fontWeight:900,
            margin:0, lineHeight:0.9, letterSpacing:'0.07em',
            background:'linear-gradient(90deg, #7C3AED 0%, #7C3AED 30%, #ffffff 50%, #7C3AED 70%, #3B82F6 100%)',
            backgroundSize:'200% auto',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            animation:'cShimmer 5s linear infinite, cGlow 3s ease-in-out infinite',
          }}>
            {(design?.championTitle || 'CHAMPIONS').toUpperCase()}
          </h1>
          <div style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:700, color:'rgba(124, 58, 237,0.7)', letterSpacing:'0.5em', marginTop:10, textTransform:'uppercase' }}>
            {(design?.championSubtitle || 'GRAND TOURNAMENT CHAMPION').toUpperCase()}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display:'flex', gap:40, marginTop:22, paddingTop:18, borderTop:'1px solid rgba(124, 58, 237,0.18)', animation:'cTitleIn 0.6s ease 0.8s both' }}>
          {[
            { label:'PPT',       value:placementPts, color:'#7C3AED' },
            { label:'KILLS',     value:totalKills,   color:'#3B82F6' },
            { label:'KILL PTS',  value:killPts,      color:'#7C3AED' },
            { label:'TOTAL',     value:totalPoints,  color:'#ffffff', big:true },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Orbitron', fontSize:9, fontWeight:700, color:s.color, letterSpacing:'0.2em', opacity:0.85 }}>{s.label}</div>
              <div style={{ fontFamily:'Rajdhani', fontSize:s.big?34:26, fontWeight:900, color:s.color, marginTop:2, textShadow:s.big?`0 0 20px ${s.color}88`:'' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM SPONSOR BAR ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10 }}>
        <div style={{ height:1, background:'linear-gradient(90deg, transparent, rgba(124, 58, 237,0.4), transparent)' }} />
        <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center', padding:'14px 60px', background:'rgba(1,5,16,0.85)', backdropFilter:'blur(8px)' }}>
          {[
            { label:'HOSTED BY',    value: design?.hostedBy     || tok.name(design) },
            { label:'SCHEDULED BY', value: design?.scheduledBy  || tok.sub(design)  },
            { label:'VISUALS BY',   value: design?.visualsBy    || 'NEXOVERLAYS' },
          ].map(item => (
            <div key={item.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:700, color:'rgba(124, 58, 237,0.5)', letterSpacing:'0.2em' }}>{item.label}</div>
              <div style={{ fontFamily:'Orbitron', fontSize:11, fontWeight:900, color:'#fff', letterSpacing:'0.1em', marginTop:3, textTransform:'uppercase' }}>{(item.value||'').toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </ThemedBackground>
    </ScreenBackground>
  );
}

/* ══════════════════════════════════════════════════
   LOADING & ERROR STATES
══════════════════════════════════════════════════ */
function OverlayLoading() {
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D0B1A' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(124, 58, 237,0.15)', borderTop:'4px solid #7C3AED', animation:'spin 0.8s linear infinite' }} />
        <span style={{ fontFamily:'Orbitron', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.3em' }}>CONNECTING TO OVERLAY...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HELPER: SCREEN BACKGROUND (custom bg image or animated gradient)
══════════════════════════════════════════════════ */
function ScreenBackground({ bgUrl, accent, accent2, children }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      {bgUrl && (
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${bgUrl})`,
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'brightness(0.45) saturate(1.1)',
          zIndex:0,
        }} />
      )}
      <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%' }}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCREEN: TEAM ROSTER (6 teams per slide, auto-cycles)
══════════════════════════════════════════════════ */
function TeamRosterCard({ team, primary, secondary, design }) {
  const playerPhotos = design?.playerPhotos || {};
  const teamLogoUrl  = design?.teamLogos?.[team.id] || team.logo_url || '';
  const roster       = safeArray(team.roster || []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        borderRadius: 12,
        border: '1.5px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Corner hazard accent (subtle top-right) */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 60,
        background: 'repeating-linear-gradient(45deg, #3B82F6, #3B82F6 5px, #000 5px, #000 10px)',
        opacity: 0.15,
        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        pointerEvents: 'none',
      }} />

      {/* Team header block */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px 16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Team logo circular container */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
          flexShrink: 0,
        }}>
          {teamLogoUrl ? (
            <img
              src={teamLogoUrl}
              alt={team.name}
              style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#fff' }}>
              {(team.name || 'T').charAt(0)}
            </span>
          )}
        </div>

        {/* Team Name and Rank info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Orbitron',
            fontSize: 22,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}>
            {team.name || 'TEAM'}
          </div>
          {team.rank && (
            <div style={{
              display: 'inline-block',
              fontFamily: 'Rajdhani',
              fontSize: 12,
              fontWeight: 700,
              color: '#3B82F6',
              letterSpacing: '0.1em',
              marginTop: 2,
              textTransform: 'uppercase',
            }}>
              RANK #{team.rank}
            </div>
          )}
        </div>
      </div>

      {/* Players Row container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 8,
        padding: '24px 16px',
        flex: 1,
      }}>
        {[0, 1, 2, 3, 4].map(i => {
          const player = roster[i];
          if (!player && i >= 4) return null; // Only show 5th slot if there's a player, otherwise show exactly 4
          const photoUrl = player ? (playerPhotos[player.id] || player.photo_url || '') : '';
          
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* Circular Avatar Border wrapper */}
              <div style={{
                position: 'relative',
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: player ? '2.5px solid #ffffff' : '2.5px dashed rgba(255, 255, 255, 0.15)',
                background: player ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                boxShadow: player ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}>
                {player ? (
                  photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={player.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: player.is_alive !== false ? 1 : 0.4,
                      }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{
                      fontFamily: 'Orbitron',
                      fontSize: 20,
                      fontWeight: 900,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      {(player.name || 'P').charAt(0).toUpperCase()}
                    </span>
                  )
                ) : (
                  <span style={{
                    fontFamily: 'Rajdhani',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.15)',
                  }}>
                    +
                  </span>
                )}

                {/* Dead overlay indicator */}
                {player && player.is_alive === false && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      fontFamily: 'Orbitron',
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#ffffff',
                      textShadow: '0 0 4px #000',
                    }}>
                      ELIM
                    </span>
                  </div>
                )}
              </div>

              {/* Player Nickname */}
              <div style={{
                fontFamily: 'Rajdhani',
                fontSize: 14,
                fontWeight: 700,
                color: player ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {player ? (player.name || 'PLAYER') : 'EMPTY'}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TeamRosterScreen({ teams = [], players = [], design }) {
  const primary   = tok.acc(design);
  const secondary = tok.acc2(design);
  const bgUrl     = design?.backgrounds?.teams || '';
  const tLogo     = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);
  const tournamentName = design?.tournamentName || tok.name(design);

  const enriched = useMemo(() => {
    const teamsArr   = safeArray(teams);
    const playersArr = safeArray(players);
    return teamsArr.map(t => ({
      ...t,
      roster: playersArr.filter(p => p.team_id === t.id || p.teamId === t.id).slice(0, 5),
    }));
  }, [teams, players]);

  const TEAMS_PER_SLIDE = 6;
  const slides = [];
  for (let i = 0; i < Math.max(enriched.length, 1); i += TEAMS_PER_SLIDE) {
    slides.push(enriched.slice(i, i + TEAMS_PER_SLIDE));
  }
  if (slides.length === 0) slides.push([]);

  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const currentSlide = slides[slideIdx] || [];

  return (
    <div style={{
      width: 1920,
      height: 1080,
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 50%, #7C3AED 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      {/* Yellow/Black hazard diagonal stripes top-left */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        background: 'repeating-linear-gradient(45deg, #3B82F6, #3B82F6 15px, #000 15px, #000 30px)',
        transform: 'rotate(-15deg)',
        opacity: 0.35,
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        zIndex: 1,
      }} />

      {/* Yellow/Black hazard stripes bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: 300,
        height: 300,
        background: 'repeating-linear-gradient(45deg, #3B82F6, #3B82F6 15px, #000 15px, #000 30px)',
        transform: 'rotate(-15deg)',
        opacity: 0.35,
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        zIndex: 1,
      }} />

      {/* Subtle overlay grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 80px',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        {/* Header Block */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Tournament & Section Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {tLogo ? (
              <img
                src={tLogo}
                alt="logo"
                style={{ height: 75, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                onError={e => e.target.style.display = 'none'}
              />
            ) : (
              design?.logoUrl && (
                <img
                  src={design.logoUrl}
                  alt="logo"
                  style={{ height: 75, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                  onError={e => e.target.style.display = 'none'}
                />
              )
            )}
            <div>
              <div style={{
                fontFamily: 'Orbitron',
                fontSize: 36,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 4px 10px rgba(0,0,0,0.4)',
              }}>
                {tournamentName || 'FREE FIRE TOURNAMENT'}
              </div>
              <div style={{
                fontFamily: 'Orbitron',
                fontSize: 16,
                fontWeight: 700,
                color: '#3B82F6',
                letterSpacing: '0.3em',
                marginTop: 4,
                textTransform: 'uppercase',
                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }}>
                {(design?.rosterTitle || 'TEAMS ROSTER').toUpperCase()}
              </div>
            </div>
          </div>

          {/* Indicators & Slides Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {slides.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {slides.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === slideIdx ? 32 : 10,
                      height: 10,
                      borderRadius: 5,
                      background: i === slideIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      boxShadow: i === slideIdx ? '0 0 10px #ffffff' : 'none',
                      transition: 'all 0.4s ease',
                    }}
                  />
                ))}
              </div>
            )}
            <div style={{
              fontFamily: 'Orbitron',
              fontSize: 14,
              fontWeight: 900,
              color: '#3B82F6',
              letterSpacing: '0.15em',
              border: '2px solid #3B82F6',
              padding: '8px 20px',
              borderRadius: 6,
              background: 'rgba(252, 211, 77, 0.1)',
              boxShadow: '0 0 15px rgba(252, 211, 77, 0.2)',
            }}>
              {enriched.length} TEAMS
            </div>
          </div>
        </div>

        {/* 3×2 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 30,
          flex: 1,
          margin: '40px 0',
        }}>
          <AnimatePresence mode="wait">
            {currentSlide.map((team, idx) => (
              <TeamRosterCard
                key={`${slideIdx}-${team.id || idx}`}
                team={team}
                primary={primary}
                secondary={secondary}
                design={design}
              />
            ))}
            {Array.from({ length: Math.max(0, TEAMS_PER_SLIDE - currentSlide.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  borderRadius: 12,
                  border: '1.5px dashed rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Sponsor/Tournament Branding Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: 20,
        }}>
          <div style={{
            fontFamily: 'Rajdhani',
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.15em',
          }}>
            OFFICIAL ESPORTS BROADCAST
          </div>
          {(sponsorLogo || design?.sponsorLogoUrl) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: 'Orbitron',
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.2em',
                fontWeight: 700,
              }}>
                SPONSORED BY
              </span>
              <img
                src={sponsorLogo || design?.sponsorLogoUrl}
                alt="sponsor"
                style={{ height: 32, objectFit: 'contain' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Overlay() {
  const { screen }         = useParams();
  const [searchParams]     = useSearchParams();
  const shareToken         = searchParams.get('token') || searchParams.get('shareToken') || '';

  // Force transparent background for OBS browser source compatibility
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  const { data, error, ready } = useOverlayPoll(shareToken);

  const {
    teams:        _teams        = [],
    players:      _players      = [],
    killFeed:     _killFeed     = [],
    eliminations: _eliminations = [],
    currentMatch,
    overlayState,
    design:       _design,
    tournament,
    matches:      _matches      = [],
    nextScheduledMatch,
    championRush,
  } = data || {};
  const design = fixDesignText(_design);

  const teams        = safeArray(_teams);
  const players      = safeArray(_players);
  const killFeed     = safeArray(_killFeed);
  const eliminations = safeArray(_eliminations);
  const matches      = safeArray(_matches);

  if (!ready) return <div style={{ width:1920, height:1080, position:'relative', overflow:'hidden' }}><OverlayLoading /></div>;

  const screens = {
    scoreboard: (
      <>
        <FFBoardV2 teams={teams} players={players} currentMatch={currentMatch} design={design} />
        <MatchInfoChip currentMatch={currentMatch} design={design} />
      </>
    ),
    standings:       <FullStandings teams={teams} design={design} />,
    full_standings:  <FullStandings teams={teams} design={design} />,
    maplabel:        <PreMatchMap   match={currentMatch} teams={teams} design={design} />,
    map_label:       <PreMatchMap   match={currentMatch} teams={teams} design={design} />,
    'today-matches': <TodaysMatches matches={currentMatch ? [currentMatch] : []} design={design} />,
    today_matches:   <TodaysMatches matches={currentMatch ? [currentMatch] : []} design={design} />,
    teams:           <PointRushStandings teams={teams} design={design} />,
    teams_today:     <PointRushStandings teams={teams} design={design} />,
    casters:         <CastersScreen design={design} />,
    casters_screen:  <CastersScreen design={design} />,
    'upcoming-map':  <UpcomingMap   match={currentMatch} design={design} />,
    upcoming_map:    <UpcomingMap   match={currentMatch} design={design} />,
    'elim-alert':    <EliminationAlert eliminations={eliminations} design={design} />,
    elim_alert:      <EliminationAlert eliminations={eliminations} design={design} />,
    elimination:     <EliminationAlert eliminations={eliminations} design={design} />,
    elimination_alert: <EliminationAlert eliminations={eliminations} design={design} />,
    pre_match_map:   <PreMatchMap   match={currentMatch} teams={teams} design={design} />,
    mvp:             <MVPScreen     players={players} teams={teams} design={design} overlayState={overlayState} />,
    mvp_screen:      <MVPScreen     players={players} teams={teams} design={design} overlayState={overlayState} />,
    champions:       <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />,
    champion:        <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />,
    booyah:          <ChampionsScreen teams={teams} design={design} overlayState={overlayState} />,
    team_roster:     <TeamRosterScreen teams={teams} players={players} design={design} />,
    teamroster:      <TeamRosterScreen teams={teams} players={players} design={design} />,
    'game-intro':    <GameIntroBanner currentMatch={currentMatch} design={design} />,
    game_intro:      <GameIntroBanner currentMatch={currentMatch} design={design} />,
    schedule:        <MatchScheduleGrid design={design} />,
    match_schedule:  <MatchScheduleGrid design={design} />,
    'ff-scoreboard': (
      <>
        <FFBoardV2 teams={teams} players={players} currentMatch={currentMatch} design={design} />
        <MatchInfoChip currentMatch={currentMatch} design={design} />
      </>
    ),
    ff_scoreboard: (
      <>
        <FFBoardV2 teams={teams} players={players} currentMatch={currentMatch} design={design} />
        <MatchInfoChip currentMatch={currentMatch} design={design} />
      </>
    ),
    roadmap:         <RoadmapOverlay tournament={tournament} matches={matches} currentMatch={currentMatch} design={design} />,
    'event-details': <EventDetailsOverlay tournament={tournament} currentMatch={currentMatch} nextScheduledMatch={nextScheduledMatch} design={design} championRush={championRush} />,
    event_details:   <EventDetailsOverlay tournament={tournament} currentMatch={currentMatch} nextScheduledMatch={nextScheduledMatch} design={design} championRush={championRush} />,
  };

  const component = screens[screen] ?? screens[screen?.replace(/-/g,'_')] ?? null;

  return (
    <div style={{ width:1920, height:1080, position:'relative', overflow:'hidden', background: 'transparent' }}>
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
