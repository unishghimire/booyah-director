/**
 * DIRECTOR PANEL
 * Role: Tournament director — sets up tournament, manages overlay scenes,
 * controls MVP/Champions reveal, monitors standings, exports data.
 */
import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import DesignStudio from '@/components/control/DesignStudio';
import TournamentSetup from '@/components/control/TournamentSetup';
import {
  Eye, Paintbrush, Settings2, Trophy, Star, Crown,
  Monitor, Copy, Radio, CheckCircle2, ChevronRight,
  Layers, Map, Crosshair, AlertTriangle, LayoutList,
  Download, RefreshCw, Users, Sword, Shield, Flag,
  Zap, Calendar, Mic2, Clock, BarChart2
} from 'lucide-react';

/* ─────────────────────────────────────────
   SCREEN DEFINITIONS
───────────────────────────────────────── */
const SCREENS = [
  { key: 'setup_blank',        label: 'BLANK',         icon: Monitor,       color: '#374151', desc: 'Idle / black screen' },
  { key: 'pre_match_map',      label: 'MAP INTRO',      icon: Map,           color: '#3b82f6', desc: 'Map name + team list' },
  { key: 'ff_scoreboard',      label: 'FF BOARD',       icon: LayoutList,    color: '#f97316', desc: 'FF-style ranked table (LIVE)' },
  { key: 'scoreboard',         label: 'STANDINGS',      icon: Trophy,        color: '#eab308', desc: 'Full tournament standings' },
  { key: 'kill_feed',          label: 'KILL FEED',      icon: Crosshair,     color: '#ef4444', desc: 'Recent kill events list' },
  { key: 'elimination_alert',  label: 'ELIM ALERT',     icon: AlertTriangle, color: '#dc2626', desc: 'Last elimination pop-up' },
  { key: 'todays_matches',     label: 'TODAY\'S MATCHES',icon: Calendar,     color: '#06b6d4', desc: 'All matches of the day' },
  { key: 'teams_today',        label: 'TEAMS TODAY',    icon: Users,         color: '#8b5cf6', desc: 'Competing teams roster' },
  { key: 'casters',            label: 'CASTERS',        icon: Mic2,          color: '#10b981', desc: 'Caster / host info' },
  { key: 'upcoming_map',       label: 'UPCOMING MAP',   icon: Flag,          color: '#0ea5e9', desc: 'Next map announcement' },
  { key: 'mvp',                label: 'MVP',            icon: Star,          color: '#a855f7', desc: 'MVP of the match' },
  { key: 'champions',          label: 'BOOYAH!',        icon: Crown,         color: '#fbbf24', desc: 'Champions reveal' },
];

/* ─────────────────────────────────────────
   SCENE SWITCHER
───────────────────────────────────────── */
function SceneSwitcher({ currentScreen, onSwitch, busy }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SCREENS.map(s => {
        const Icon = s.icon;
        const isActive = currentScreen === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSwitch(s.key)}
            disabled={!!busy}
            title={s.desc}
            className="group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all disabled:opacity-50 hover:scale-[1.02]"
            style={isActive
              ? { borderColor: s.color, background: s.color + '22', boxShadow: `0 0 16px ${s.color}44` }
              : { borderColor: '#ffffff12', background: '#ffffff06' }
            }
          >
            {isActive && (
              <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: s.color }}>
                <Radio className="h-2 w-2 text-white" />
              </span>
            )}
            <Icon className="h-5 w-5" style={{ color: isActive ? s.color : '#6b7280' }} />
            <span className="font-orbitron text-[9px] font-black leading-tight" style={{ color: isActive ? s.color : '#d1d5db' }}>
              {busy === s.key ? '…' : s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   LIVE NOW BANNER
───────────────────────────────────────── */
function LiveNowBanner({ currentScreen }) {
  const s = SCREENS.find(x => x.key === currentScreen);
  if (!s) return null;
  const Icon = s.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-2.5"
      style={{ borderColor: s.color + '44', background: s.color + '11' }}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: s.color }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
      </span>
      <Icon className="h-4 w-4" style={{ color: s.color }} />
      <span className="font-orbitron text-xs font-black" style={{ color: s.color }}>LIVE ON OVERLAY:</span>
      <span className="text-xs font-bold text-white">{s.label}</span>
      <span className="text-[10px] text-gray-500 ml-1">— {s.desc}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   MVP CONTROL
───────────────────────────────────────── */
function MVPControl({ currentMatch, overlayState, onAction }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy]   = useState(null);

  const stored = overlayState?.mvp_player_name ? {
    player_id: overlayState.mvp_player_id,
    name: overlayState.mvp_player_name,
    team: overlayState.mvp_team_name,
    kills: overlayState.mvp_kills,
  } : null;
  const mvp = result?.mvp || stored;

  const calc = async () => {
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy('calc');
    try {
      const r = await overlayApi.calculateMVP({ match_id: currentMatch.id });
      setResult(r);
      if (r.mvp) toast.success(`MVP → ${r.mvp.name} (${r.mvp.kills} kills)`);
      else toast('No kills this match yet', { icon: '⚠️' });
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const show = async () => {
    if (!mvp?.player_id) return toast.error('Calculate MVP first');
    setBusy('show');
    try {
      await overlayApi.setMVPAndShowScreen({
        player_id: mvp.player_id,
        player_name: mvp.name,
        team_name: mvp.team,
        kills: mvp.kills,
      });
      toast.success('MVP screen is LIVE!');
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
        <Star className="h-4 w-4 text-purple-400" />
        <h3 className="font-orbitron text-xs font-black text-white">MVP OF THE MATCH</h3>
      </div>

      {mvp ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 font-orbitron text-sm font-black text-white">
            {(mvp.name || '??').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-orbitron text-sm font-black text-purple-300 truncate">{mvp.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{mvp.team}</p>
          </div>
          <div className="text-right">
            <p className="font-orbitron text-2xl font-black text-orange-400">{mvp.kills}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">kills</p>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-center rounded-xl border border-dashed border-white/10 py-6">
          <p className="text-xs text-gray-600">Press Calculate to find match MVP</p>
        </div>
      )}

      {result?.tied && (
        <p className="mb-2 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-[11px] font-bold text-yellow-400">
          ⚠ TIE — {result.tied_players?.map(p => p.name).join(' & ')} ({result.max_kills} kills each)
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={calc} disabled={!!busy || !currentMatch}
          className="flex-1 rounded-lg border border-purple-500/30 bg-purple-600/20 py-2.5 text-xs font-black text-purple-300 hover:bg-purple-600/30 disabled:opacity-40 transition-all">
          {busy === 'calc' ? 'Calculating…' : '⟳ CALCULATE'}
        </button>
        <button onClick={show} disabled={!!busy || !mvp?.player_id}
          className="flex-1 rounded-lg bg-purple-600 py-2.5 text-xs font-black text-white hover:bg-purple-500 disabled:opacity-40 transition-all">
          {busy === 'show' ? 'Sending…' : '▶ SHOW LIVE'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CHAMPIONS CONTROL
───────────────────────────────────────── */
function ChampionsControl({ tournament, teams, onAction }) {
  const [busy, setBusy] = useState(null);
  const ranked = [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  const medals = [{ icon: '🥇', color: '#fbbf24' }, { icon: '🥈', color: '#9ca3af' }, { icon: '🥉', color: '#ea580c' }];

  const reveal = async (team) => {
    setBusy(team.id);
    try {
      await overlayApi.setChampionAndShowScreen({ team_id: team.id, team_name: team.name, total_points: team.total_tournament_points || 0 });
      toast.success(`🏆 ${team.name} revealed as Champions!`);
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const declare = async () => {
    if (!tournament?.id) return toast.error('No active tournament');
    setBusy('declare');
    try {
      await overlayApi.declareChampions({ tournament_id: tournament.id });
      toast.success('BOOYAH! Tournament complete!');
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
        <Crown className="h-4 w-4 text-yellow-400" />
        <h3 className="font-orbitron text-xs font-black text-white">CHAMPIONS REVEAL</h3>
      </div>
      <div className="mb-3 space-y-2">
        {ranked.slice(0, 3).map((team, i) => (
          <button key={team.id} onClick={() => reveal(team)} disabled={!!busy}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:border-yellow-500/30 hover:bg-yellow-500/5 disabled:opacity-40 transition-all group">
            <span className="text-xl">{medals[i]?.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">{team.name}</p>
              <p className="text-[10px] text-gray-500">{team.total_tournament_kills || 0} total kills</p>
            </div>
            <div className="text-right">
              <p className="font-orbitron text-xl font-black text-orange-400">{team.total_tournament_points || 0}</p>
              <p className="text-[9px] text-gray-500">PTS</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-yellow-400 transition-colors" />
          </button>
        ))}
        {ranked.length === 0 && <p className="py-4 text-center text-xs text-gray-600">No teams registered yet</p>}
      </div>
      <button onClick={declare} disabled={!!busy || !tournament}
        className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 py-3 text-sm font-black text-black hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-orange-500/20">
        {busy === 'declare' ? 'Finalizing…' : '🏆 DECLARE BOOYAH! (End Tournament)'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   FULL STANDINGS TABLE
───────────────────────────────────────── */
function StandingsTable({ teams }) {
  const sorted = [...(teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));
  const rankColor = (i) => i === 0 ? '#f97316' : i === 1 ? '#fbbf24' : i === 2 ? '#ea580c' : '#6b7280';

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-orange-400" />
          <h3 className="font-orbitron text-xs font-black text-white">TOURNAMENT STANDINGS</h3>
        </div>
        <span className="text-[10px] text-gray-600">{sorted.length} teams</span>
      </div>
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-600">No teams yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left">
                {['#', 'TEAM', 'KILLS', 'PTS'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((team, i) => (
                <tr key={team.id} className={`border-b border-white/5 transition-colors ${i === 0 ? 'bg-orange-500/5' : 'hover:bg-white/5'}`}>
                  <td className="px-4 py-3">
                    <span className="font-orbitron text-base font-black" style={{ color: rankColor(i) }}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-orbitron text-[9px] font-black text-gray-400">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-bold text-white">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-300">{team.total_tournament_kills || 0}</td>
                  <td className="px-4 py-3">
                    <span className="font-orbitron text-sm font-black text-orange-400">{team.total_tournament_points || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   EXPORT DATA
───────────────────────────────────────── */
function ExportPanel({ data }) {
  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booyah-tournament-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tournament data exported!');
  };

  const exportCSV = () => {
    if (!data?.teams?.length) return toast.error('No team data to export');
    const rows = [['Rank', 'Team', 'Total Points', 'Total Kills']];
    [...(data.teams || [])].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
      .forEach((t, i) => rows.push([i + 1, t.name, t.total_tournament_points || 0, t.total_tournament_kills || 0]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booyah-standings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Standings CSV exported!');
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
        <Download className="h-4 w-4 text-green-400" />
        <h3 className="font-orbitron text-xs font-black text-white">EXPORT DATA</h3>
      </div>
      <div className="flex gap-2">
        <button onClick={exportJSON}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 py-2.5 text-xs font-black text-green-300 hover:bg-green-500/20 transition-all">
          <Download className="h-3.5 w-3.5" /> JSON (full)
        </button>
        <button onClick={exportCSV}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 py-2.5 text-xs font-black text-blue-300 hover:bg-blue-500/20 transition-all">
          <Download className="h-3.5 w-3.5" /> CSV (standings)
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TOURNAMENT INFO BAR
───────────────────────────────────────── */
function TournamentInfoBar({ tournament, currentMatch, teams }) {
  const matchState = currentMatch?.state || 'idle';
  const stateColors = { pre_match: '#3b82f6', live: '#ef4444', ended: '#6b7280', idle: '#4b5563' };
  const stateLabels = { pre_match: 'PRE-MATCH', live: 'LIVE', ended: 'ENDED', idle: 'IDLE' };
  const aliveTeams = (teams || []).length;

  return (
    <div className="flex items-center gap-0 rounded-xl border border-orange-500/20 bg-orange-500/5 overflow-hidden">
      {[
        { label: 'TOURNAMENT', value: tournament.name, wide: true },
        { label: 'MATCH', value: `${tournament.current_match_number || 0} / ${tournament.total_matches}`, accent: true },
        { label: 'MAP', value: currentMatch?.map_name || '—' },
        { label: 'TEAMS', value: aliveTeams },
        { label: 'PTS/KILL', value: tournament.points_per_kill || 1 },
      ].map(({ label, value, wide, accent }, i) => (
        <div key={label} className={`flex flex-col justify-center border-r border-white/10 px-5 py-3 ${wide ? 'flex-1' : 'min-w-[90px]'}`}>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">{label}</p>
          <p className={`font-orbitron text-sm font-black ${accent ? 'text-orange-400' : 'text-white'} truncate`}>{value}</p>
        </div>
      ))}
      <div className="flex items-center gap-2 px-5 py-3">
        <span className="h-2 w-2 rounded-full" style={{ background: stateColors[matchState], boxShadow: matchState === 'live' ? `0 0 8px ${stateColors[matchState]}` : 'none' }} />
        <span className="font-orbitron text-xs font-black" style={{ color: stateColors[matchState] }}>
          {stateLabels[matchState] || 'IDLE'}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MATCH CONTROLS (director)
───────────────────────────────────────── */
function DirectorMatchControls({ tournament, currentMatch, onAction }) {
  const [mapName, setMapName] = useState('');
  const [busy, setBusy] = useState(null);
  const maps = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra'];

  const startNext = async () => {
    if (!tournament?.id) return toast.error('No tournament');
    setBusy('start');
    try {
      await overlayApi.startNextMatch({ tournament_id: tournament.id, map_name: mapName || 'Bermuda' });
      setMapName('');
      toast.success('Match started!');
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const setState = async (state, label) => {
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy(state);
    try {
      await overlayApi.updateMatchState({ match_id: currentMatch.id, state });
      toast.success(`Match → ${label}`);
      onAction?.();
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  const matchState = currentMatch?.state;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
        <Shield className="h-4 w-4 text-blue-400" />
        <h3 className="font-orbitron text-xs font-black text-white">MATCH CONTROLS</h3>
      </div>

      {/* Map picker */}
      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Map</label>
        <div className="flex flex-wrap gap-1.5">
          {maps.map(m => (
            <button key={m} onClick={() => setMapName(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${mapName === m ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              {m}
            </button>
          ))}
          <input value={mapName} onChange={e => setMapName(e.target.value)} placeholder="Custom map…"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50 flex-1 min-w-[120px]" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={startNext} disabled={!!busy || !tournament}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-40 transition-all">
          {busy === 'start' ? 'Starting…' : '▶ START NEXT MATCH'}
        </button>
        <button onClick={() => setState('live', 'LIVE')} disabled={!!busy || !currentMatch || matchState === 'live'}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-black text-white hover:bg-red-500 disabled:opacity-40 transition-all">
          🔴 GO LIVE
        </button>
        <button onClick={() => setState('ended', 'ENDED')} disabled={!!busy || !currentMatch || matchState === 'ended'}
          className="flex items-center justify-center gap-2 rounded-xl bg-gray-700 py-2.5 text-xs font-black text-white hover:bg-gray-600 disabled:opacity-40 transition-all">
          ⏹ END MATCH
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   OBS URL BOX
───────────────────────────────────────── */
function OBSBox() {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/overlay` : '/overlay';
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Monitor className="h-3.5 w-3.5 text-gray-400" />
        <h3 className="font-orbitron text-[10px] font-black text-white">OBS BROWSER SOURCE</h3>
      </div>
      <div className="flex gap-2">
        <input readOnly value={url}
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-gray-400 outline-none font-mono" />
        <button onClick={() => { navigator.clipboard?.writeText(url); toast.success('Copied to clipboard!'); }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-black text-black hover:bg-orange-400 transition-all">
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <p className="mt-1.5 text-[9px] text-gray-600">Resolution: 1920×1080 · Refresh rate: 500ms polling</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: DIRECTOR PANEL
═══════════════════════════════════════════ */
const TABS = [
  { key: 'overlay',   label: 'Overlay Control', icon: Eye },
  { key: 'match',     label: 'Match Control',   icon: Shield },
  { key: 'standings', label: 'Standings',        icon: BarChart2 },
  { key: 'design',    label: 'Design Studio',    icon: Paintbrush },
  { key: 'setup',     label: 'Setup',            icon: Settings2 },
];

export default function DirectorPanel() {
  const { data, loading, refresh } = useOverlayData(true);
  const [tab, setTab]               = useState('overlay');
  const [screenBusy, setScreenBusy] = useState(null);

  const switchScreen = async (screen) => {
    setScreenBusy(screen);
    try {
      await overlayApi.switchOverlayScreen({ screen });
      refresh();
    } catch (e) { toast.error(e.message); } finally { setScreenBusy(null); }
  };

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="font-orbitron text-sm text-gray-500">Loading Director Panel…</p>
        </div>
      </div>
    );
  }

  const { tournament, overlay_state, teams, players, current_match } = data;
  const currentScreen = overlay_state?.current_screen || 'setup_blank';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Status bar ── */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0c14] px-5 py-3">
        {tournament ? (
          <div className="flex items-start gap-3">
            <TournamentInfoBar tournament={tournament} currentMatch={current_match} teams={teams} />
            <LiveNowBanner currentScreen={currentScreen} />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
            <Settings2 className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <p className="text-sm font-bold text-yellow-300">No tournament active — go to Setup tab to create one</p>
          </div>
        )}
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0c14] px-5">
        <div className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-[11px] font-black uppercase tracking-wider transition-all ${
                tab === key
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-600 hover:text-gray-300 hover:border-white/20'
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-1">
            <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] text-gray-600 hover:text-gray-300 transition-all">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#09090f]">

        {/* OVERLAY CONTROL TAB */}
        {tab === 'overlay' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Scene switcher */}
            <div className="col-span-5 space-y-4">
              <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
                <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
                  <Layers className="h-4 w-4 text-orange-400" />
                  <h3 className="font-orbitron text-xs font-black text-white">SCENE SWITCHER</h3>
                  <span className="ml-auto text-[9px] text-gray-600">Click any scene to go live</span>
                </div>
                <SceneSwitcher currentScreen={currentScreen} onSwitch={switchScreen} busy={screenBusy} />
              </div>
              <OBSBox />
            </div>

            {/* Right: MVP + Champions */}
            <div className="col-span-7 space-y-4">
              <MVPControl currentMatch={current_match} overlayState={overlay_state} onAction={refresh} />
              <ChampionsControl tournament={tournament} teams={teams} onAction={refresh} />
              <ExportPanel data={data} />
            </div>
          </div>
        )}

        {/* MATCH CONTROL TAB */}
        {tab === 'match' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <DirectorMatchControls tournament={tournament} currentMatch={current_match} onAction={refresh} />
            <MVPControl currentMatch={current_match} overlayState={overlay_state} onAction={refresh} />
          </div>
        )}

        {/* STANDINGS TAB */}
        {tab === 'standings' && (
          <div className="space-y-4">
            <StandingsTable teams={teams} />
            <ExportPanel data={data} />
          </div>
        )}

        {/* DESIGN STUDIO TAB */}
        {tab === 'design' && (
          <div className="max-w-2xl mx-auto">
            <DesignStudio onAction={refresh} />
          </div>
        )}

        {/* SETUP TAB */}
        {tab === 'setup' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {tournament ? (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-orbitron text-sm font-black text-white">{tournament.name}</p>
                    <p className="text-xs text-gray-400">{tournament.total_matches} matches · {tournament.points_per_kill} pt/kill · Status: {tournament.status}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f0f1a] p-4">
                  <h3 className="mb-3 font-orbitron text-xs font-black text-white">REGISTERED TEAMS ({teams?.length || 0} / 12)</h3>
                  <div className="space-y-2">
                    {(teams || []).map(team => {
                      const tp = (players || []).filter(p => p.team_id === team.id);
                      return (
                        <div key={team.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center gap-2 justify-between">
                            <p className="text-sm font-black text-orange-400">{team.name}</p>
                            <p className="text-[10px] text-gray-500">{tp.length} players</p>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">{tp.map(p => p.name).join(' · ') || 'No players'}</p>
                        </div>
                      );
                    })}
                    {(!teams || teams.length === 0) && (
                      <p className="py-4 text-center text-xs text-gray-600">No teams yet — add them in the Data Inputer view</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <TournamentSetup onCreated={refresh} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
