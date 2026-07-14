import React, { useState } from 'react';
import { SectionBoundary, PanelBoundary, safeArray, safeNumber } from '@/components/ErrorBoundary';
import { Copy, CheckCircle2, ExternalLink, Monitor, Crosshair, Layers, Star, Crown, Mic2, Zap, Shield, Play, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

export const OVERLAYS = [
  // Transparent overlays — sit on top of gameplay
  { id: 'scoreboard',    label: 'FF SCOREBOARD',    icon: Monitor,    transparent: true,  desc: 'Live ranked board during match' },
  { id: 'standings',     label: 'FULL STANDINGS',    icon: Layers,     transparent: true,  desc: 'Full tournament points table' },
  // Full-scene replacements — solid background
  { id: 'casters',       label: 'CASTERS',           icon: Mic2,       transparent: false, desc: 'Caster & analyst profiles' },
  { id: 'mvp',           label: 'MVP REVEAL',        icon: Star,       transparent: false, desc: 'Match MVP player full-screen' },
  { id: 'champions',     label: 'BOOYAH! CHAMPION',  icon: Crown,      transparent: false, desc: 'Tournament winner reveal' },
  { id: 'maplabel',      label: 'MAP INTRO',         icon: Zap,        transparent: false, desc: 'Map name + teams pre-match' },
  { id: 'teams',         label: 'TEAMS TODAY',       icon: Layers,     transparent: false, desc: 'All competing teams display' },
  { id: 'team_roster',   label: 'TEAM ROSTER',       icon: Users,      transparent: false, desc: 'Full team + player photo roster, auto-slides every 6s' },
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
      toast.success('Copied!');
      setTimeout(() => setCopied(null), 2000);
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
            <span className="h-2 w-2 rounded-full bg-[#00D4FF] animate-pulse" />
            OBS OVERLAY URLs
          </h1>
          <p className="font-orbitron text-[10px] text-gray-500 mt-1">ADD EACH AS A BROWSER SOURCE IN OBS STUDIO</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-[#00D4FF] animate-pulse" />
          <span className="font-orbitron text-[9px] font-black text-[#00D4FF]">1920×1080 FIXED</span>
        </div>
      </div>

      {/* OBS Setup Tip */}
      <div className="rounded-xl border border-[#FF6B00]/20 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
        <p className="font-orbitron text-[10px] font-black text-[#FF6B00] tracking-wider mb-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-[#FF6B00] rounded-full" />
          OBS SETUP — DO THIS ONCE PER SOURCE
        </p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>1. OBS → <span className="text-white font-bold">Add → Browser Source</span> → paste the URL below</p>
          <p>2. Width: <span className="text-white font-bold font-mono">1920</span> · Height: <span className="text-white font-bold font-mono">1080</span></p>
          <p>3. For transparent overlays: enable <span className="text-white font-bold">Custom CSS</span> → <code className="text-[#00D4FF] font-mono">body {'{ background: transparent !important; }'}</code></p>
          <p>4. Uncheck <span className="text-white font-bold">"Shutdown source when not visible"</span></p>
        </div>
      </div>

      {/* Your Share Token */}
      {shareToken && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl">
          <p className="font-orbitron text-[10px] font-black text-gray-400 tracking-wider mb-2">YOUR UNIQUE SHARE TOKEN</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 truncate rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-mono text-xs text-[#00D4FF]">{shareToken}</code>
            <CopyBtn text={shareToken} id="token" copied={copied} onCopy={copy} />
          </div>
        </div>
      )}

      {/* Transparent Overlays */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1.5 w-1.5 bg-[#00D4FF] rounded-full animate-pulse" />
          <span className="font-orbitron text-[10px] font-black text-[#00D4FF] tracking-widest">TRANSPARENT — LAYER OVER GAMEPLAY</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transparent.map((ov) => {
            const url = overlayUrl(ov.id);
            const Icon = ov.icon;
            return (
              <div
                key={ov.id}
                className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-[12px] p-4 hover:border-[#00D4FF]/30 hover:shadow-[0_0_15px_rgba(0,212,255,0.05)] transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 group-hover:bg-[#00D4FF]/20 transition-all">
                      <Icon className="h-4 w-4 text-[#00D4FF]" />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-xs font-black text-white tracking-wider">{ov.label}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ov.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-2 font-mono text-[10px] text-[#00D4FF]/80 truncate">
                    {url}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <span className="font-orbitron text-[9px] font-bold text-gray-500 tracking-wider">1920×1080</span>
                  <div className="flex gap-2">
                    <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all"
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
          <div className="h-1.5 w-1.5 bg-[#00D4FF] rounded-full animate-pulse" />
          <span className="font-orbitron text-[10px] font-black text-[#00D4FF] tracking-widest">FULL SCENE — USE SOLID BACKGROUND</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solid.map((ov) => {
            const url = overlayUrl(ov.id);
            const Icon = ov.icon;
            return (
              <div
                key={ov.id}
                className="flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-[12px] p-4 hover:border-[#00D4FF]/30 hover:shadow-[0_0_15px_rgba(0,212,255,0.05)] transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 group-hover:bg-[#00D4FF]/20 transition-all">
                      <Icon className="h-4 w-4 text-[#00D4FF]" />
                    </div>
                    <div>
                      <h3 className="font-orbitron text-xs font-black text-white tracking-wider">{ov.label}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ov.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-2 font-mono text-[10px] text-[#00D4FF]/80 truncate">
                    {url}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <span className="font-orbitron text-[9px] font-bold text-gray-500 tracking-wider">1920×1080</span>
                  <div className="flex gap-2">
                    <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all"
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

    </div>
  );
}