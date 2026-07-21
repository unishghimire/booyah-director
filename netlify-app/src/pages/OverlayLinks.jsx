import React, { useState } from 'react';
import { SectionBoundary, PanelBoundary, safeArray, safeNumber } from '@/components/ErrorBoundary';
import { Copy, CheckCircle2, ExternalLink, Monitor, Crosshair, Layers, Star, Crown, Mic2, Zap, Shield, Play, Users, Gamepad2, Grid3x3, Eye, EyeOff, Map, Info, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useObsStore } from '@/lib/obsStore';
import { obsService } from '@/lib/obsWebSocket';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

/* ═══ Overlay Preview Thumbnail ═══ */
function OverlayPreview({ url, label }) {
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-1.5 font-orbitron text-[9px] font-black text-gray-400 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-all"
      >
        <Eye className="h-3 w-3" />
        {showPreview ? 'HIDE PREVIEW' : 'PREVIEW'}
      </button>
      {showPreview && (
        <div className="mt-2 overflow-hidden rounded-lg border border-[#3B82F6]/20 bg-black" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={url}
            title={label}
            className="pointer-events-none"
            style={{
              width: '1920px',
              height: '1080px',
              transform: 'scale(0.22)',
              transformOrigin: 'top left',
              border: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ═══ Masked Token Display ═══ */
function MaskedToken({ token }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-mono text-xs text-[#3B82F6]">
        {revealed ? token : '••••••••••••••••'}
      </code>
      <button
        onClick={() => setRevealed(!revealed)}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
        title={revealed ? 'Hide' : 'Reveal'}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(token).then(() => {
            setCopied(true);
            toast.success('Token copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
          }).catch(() => toast.error('Failed to copy'));
        }}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
        title="Copy Token"
      >
        {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ═══ OBS Connection Card ═══ */
function OBSConnectionCard() {
  const connectionStatus = useObsStore(s => s.connectionStatus);
  const obsAddress = useObsStore(s => s.obsAddress);
  const obsPassword = useObsStore(s => s.obsPassword);
  const setObsConfig = useObsStore(s => s.setObsConfig);
  const saveSettings = useObsStore(s => s.saveSettings);
  const [addr, setAddr] = useState(obsAddress || 'localhost:4444');
  const [pass, setPass] = useState(obsPassword || '');
  const [connecting, setConnecting] = useState(false);

  const statusColor = {
    connected: '#22c55e',
    connecting: '#f59e0b',
    disconnected: '#ef4444',
    error: '#ef4444',
  }[connectionStatus] || '#ef4444';

  const statusLabel = {
    connected: 'CONNECTED',
    connecting: 'CONNECTING...',
    disconnected: 'DISCONNECTED',
    error: 'ERROR',
  }[connectionStatus] || 'DISCONNECTED';

  const handleConnect = async () => {
    setConnecting(true);
    setObsConfig(addr, pass);
    saveSettings();
    try {
      await obsService.connect(addr, pass);
      toast.success('OBS WebSocket connected!');
    } catch (err) {
      toast.error('OBS connection failed: ' + (err.message || 'unknown'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    obsService.disconnect();
    toast('OBS WebSocket disconnected');
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? <Wifi className="h-4 w-4 text-[#22c55e]" /> : <WifiOff className="h-4 w-4" style={{ color: statusColor }} />}
          <span className="font-orbitron text-[10px] font-black text-gray-400 tracking-wider">OBS WEBSOCKET</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: statusColor }} />
          <span className="font-orbitron text-[9px] font-black tracking-widest" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1">ADDRESS</label>
          <input
            value={addr}
            onChange={e => setAddr(e.target.value)}
            placeholder="localhost:4444"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#7C3AED]/50"
          />
        </div>
        <div>
          <label className="block font-orbitron text-[8px] font-black text-gray-500 tracking-widest mb-1">PASSWORD</label>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#7C3AED]/50"
          />
        </div>
      </div>
      {connectionStatus === 'connected' ? (
        <button onClick={handleDisconnect} className="w-full rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-2.5 font-orbitron text-[10px] font-black tracking-widest text-[#ef4444] hover:bg-[#ef4444]/20 transition-all">
          DISCONNECT
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] px-4 py-2.5 font-orbitron text-[10px] font-black tracking-widest text-white hover:from-[#6D28D9] hover:to-[#2563EB] transition-all disabled:opacity-50"
        >
          {connecting ? 'CONNECTING...' : 'CONNECT TO OBS'}
        </button>
      )}
    </div>
  );
}

/* ═══ OBS Source Toggles ═══ */
function OBSSourceToggles() {
  const connectionStatus = useObsStore(s => s.connectionStatus);
  const availableScenes = useObsStore(s => s.availableScenes);
  const sources = useObsStore(s => s.sources);
  const currentProgramScene = useObsStore(s => s.currentProgramScene);
  const [expandedScene, setExpandedScene] = useState(null);

  if (connectionStatus !== 'connected') {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 text-center">
        <WifiOff className="h-8 w-8 text-gray-600 mx-auto mb-2" />
        <p className="font-orbitron text-[10px] font-black text-gray-500 tracking-widest">OBS NOT CONNECTED</p>
        <p className="text-xs text-gray-600 mt-1">Connect to OBS WebSocket above to control source visibility</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#22c55e]/20 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-[#22c55e]" />
          <span className="font-orbitron text-[10px] font-black text-[#22c55e] tracking-widest">OBS SOURCE CONTROLS</span>
        </div>
        <button
          onClick={() => obsService.refreshScenes()}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-orbitron text-[9px] font-black text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="h-3 w-3" /> REFRESH
        </button>
      </div>
      <div className="space-y-2">
        {availableScenes.map(scene => {
          const sceneSources = sources[scene] || [];
          const isLive = currentProgramScene === scene;
          const isExpanded = expandedScene === scene;
          return (
            <div key={scene} className="rounded-lg border border-white/5 bg-black/20 overflow-hidden">
              <button
                onClick={() => setExpandedScene(isExpanded ? null : scene)}
                className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-2">
                  {isLive && <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />}
                  <span className="font-orbitron text-[10px] font-black tracking-wider" style={{ color: isLive ? '#22c55e' : 'rgba(255,255,255,0.7)' }}>
                    {scene}
                  </span>
                  <span className="font-orbitron text-[8px] text-gray-600">({sceneSources.length} sources)</span>
                </div>
                <Eye className="h-3 w-3 text-gray-600" />
              </button>
              {isExpanded && sceneSources.length > 0 && (
                <div className="border-t border-white/5 px-3 py-2 space-y-1">
                  {sceneSources.map(src => (
                    <button
                      key={src.name}
                      onClick={() => obsService.toggleSourceVisibility(scene, src.name)}
                      className="flex w-full items-center justify-between py-1.5 hover:bg-white/5 rounded px-2 transition-all"
                    >
                      <span className="text-[11px] text-gray-400">{src.name}</span>
                      {src.visible
                        ? <Eye className="h-3.5 w-3.5 text-[#22c55e]" />
                        : <EyeOff className="h-3.5 w-3.5 text-gray-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const OVERLAYS = [
  // Transparent overlays — sit on top of gameplay
  { id: 'ff-scoreboard', label: 'FF SCOREBOARD',    icon: Monitor,    transparent: true,  desc: 'NexOverlays scoreboard + match info chip (dropdown + elim animations)' },
  { id: 'standings',     label: 'FULL STANDINGS',   icon: Layers,     transparent: true,  desc: 'Full tournament points table' },
  // Full-scene replacements — solid background
  { id: 'game-intro',    label: 'GAME INTRO',       icon: Gamepad2,   transparent: false, desc: 'NexOverlays game intro banner with map + match number' },
  { id: 'schedule',      label: 'MAP SCHEDULE',     icon: Grid3x3,    transparent: false, desc: 'NexOverlays match schedule grid with all maps' },
  { id: 'teams',         label: 'TEAMS TODAY',      icon: Layers,     transparent: false, desc: 'Point Rush standings — dual column' },
  { id: 'casters',       label: 'CASTERS',           icon: Mic2,       transparent: false, desc: 'Caster & analyst profiles' },
  { id: 'mvp',           label: 'MVP REVEAL',        icon: Star,       transparent: false, desc: 'Match MVP player full-screen' },
  { id: 'champions',     label: 'NEXOVERLAYS! CHAMPION',  icon: Crown,      transparent: false, desc: 'Tournament winner reveal' },
  { id: 'maplabel',      label: 'MAP INTRO',         icon: Zap,        transparent: false, desc: 'Map name + teams pre-match' },
  { id: 'team_roster',   label: 'TEAM ROSTER',       icon: Users,      transparent: false, desc: 'Full team + player photo roster, auto-slides every 6s' },
  { id: 'roadmap',      label: 'TOURNAMENT ROADMAP', icon: Map,        transparent: false, desc: 'Full tournament schedule — stages, days, matches with live progress' },
  { id: 'event-details', label: 'EVENT DETAILS',     icon: Info,      transparent: false, desc: 'Tournament info card — current match, format stats, placement points' },
];

export function CopyBtn({ text, id, copied, onCopy }) {
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
    >
      {copied === id
        ? <CheckCircle2 className="h-4 w-4 text-green-400" />
        : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function OverlayLinks() {
  const { shareToken } = useAuth();
  const [copied, setCopied] = useState(null);
  const base = window.location.origin;

  const overlayUrl = (screen) =>
    shareToken
      ? `${base}/overlay/${screen}?token=${shareToken}`
      : `${base}/overlay/${screen}`;

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const transparent = OVERLAYS.filter(o => o.transparent);
  const solid       = OVERLAYS.filter(o => !o.transparent);

  return (
    <div className="min-h-screen bg-[#09090f] text-white flex flex-col gap-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="font-orbitron text-lg font-black text-white tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
            OBS OVERLAY URLs
          </h1>
          <p className="font-orbitron text-[10px] text-gray-500 mt-1">ADD EACH AS A BROWSER SOURCE IN OBS STUDIO</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#3B82F6]/20 bg-[#3B82F6]/5 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="font-orbitron text-[9px] font-black text-[#3B82F6]">1920×1080 FIXED</span>
        </div>
      </div>

      {/* OBS Setup Tip */}
      <div className="rounded-xl border border-[#7C3AED]/20 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
        <p className="font-orbitron text-[10px] font-black text-[#7C3AED] tracking-wider mb-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full" />
          OBS SETUP — DO THIS ONCE PER SOURCE
        </p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>1. OBS → <span className="text-white font-bold">Add → Browser Source</span> → paste the URL below</p>
          <p>2. Width: <span className="text-white font-bold font-mono">1920</span> · Height: <span className="text-white font-bold font-mono">1080</span></p>
          <p>3. For transparent overlays: enable <span className="text-white font-bold">Custom CSS</span> → <code className="text-[#3B82F6] font-mono">body {'{ background: transparent !important; }'}</code></p>
          <p>4. Uncheck <span className="text-white font-bold">"Shutdown source when not visible"</span></p>
        </div>
      </div>

      {/* OBS WebSocket Connection */}
      <OBSConnectionCard />

      {/* Your Share Token (masked) */}
      {shareToken && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
          <p className="font-orbitron text-[10px] font-black text-gray-400 tracking-wider mb-2">YOUR UNIQUE SHARE TOKEN</p>
          <MaskedToken token={shareToken} />
        </div>
      )}

      {/* Transparent Overlays */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full animate-pulse" />
          <span className="font-orbitron text-[10px] font-black text-[#3B82F6] tracking-widest">TRANSPARENT — LAYER OVER GAMEPLAY</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transparent.map((ov) => {
            const url = overlayUrl(ov.id);
            const Icon = ov.icon;
            return (
              <div
                key={ov.id}
                className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-[12px] p-4 hover:border-[#3B82F6]/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.05)] transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 group-hover:bg-[#3B82F6]/20 transition-all">
                      <Icon className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-xs font-black text-white tracking-wider">{ov.label}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ov.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-2 font-mono text-[10px] text-[#3B82F6]/80 truncate">
                    {url}
                  </div>
                </div>
                <div className="mt-3">
                  <OverlayPreview url={url} label={ov.label} />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <span className="font-orbitron text-[9px] font-bold text-gray-500 tracking-wider">1920×1080</span>
                  <div className="flex gap-2">
                    <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-all"
                      title="Open Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 px-3 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/30 transition-all font-orbitron text-[9px] font-black tracking-wider"
                    >
                      <Play className="h-3 w-3 mr-1" /> TEST
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solid Scene Overlays */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 bg-[#3B82F6] rounded-full animate-pulse" />
          <span className="font-orbitron text-[10px] font-black text-[#3B82F6] tracking-widest">FULL SCENE — USE SOLID BACKGROUND</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solid.map((ov) => {
            const url = overlayUrl(ov.id);
            const Icon = ov.icon;
            return (
              <div
                key={ov.id}
                className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-[12px] p-4 hover:border-[#3B82F6]/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.05)] transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 group-hover:bg-[#3B82F6]/20 transition-all">
                      <Icon className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-xs font-black text-white tracking-wider">{ov.label}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ov.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-2 font-mono text-[10px] text-[#3B82F6]/80 truncate">
                    {url}
                  </div>
                </div>
                <div className="mt-3">
                  <OverlayPreview url={url} label={ov.label} />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <span className="font-orbitron text-[9px] font-bold text-gray-500 tracking-wider">1920×1080</span>
                  <div className="flex gap-2">
                    <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-all"
                      title="Open Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 px-3 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/30 transition-all font-orbitron text-[9px] font-black tracking-wider"
                    >
                      <Play className="h-3 w-3 mr-1" /> TEST
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OBS Source Visibility Controls */}
      <OBSSourceToggles />

    </div>
  );
}