import React, { useState } from 'react';
import { Copy, CheckCircle2, ExternalLink, Monitor, Crosshair, Layers, Star, Crown, Mic2, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

const OVERLAYS = [
  // Transparent overlays — sit on top of gameplay
  { id: 'scoreboard',    label: 'FF SCOREBOARD',    icon: Monitor,    transparent: true,  desc: 'Live ranked board during match' },
  { id: 'killfeed',      label: 'KILL FEED',         icon: Crosshair,  transparent: true,  desc: 'Bottom-left live kill events' },
  { id: 'standings',     label: 'FULL STANDINGS',    icon: Layers,     transparent: true,  desc: 'Full tournament points table' },
  // Full-scene replacements — solid background
  { id: 'blank',         label: 'BLANK / IDLE',      icon: Shield,     transparent: false, desc: 'Black holding screen' },
  { id: 'casters',       label: 'CASTERS',           icon: Mic2,       transparent: false, desc: 'Caster & analyst profiles' },
  { id: 'mvp',           label: 'MVP REVEAL',        icon: Star,       transparent: false, desc: 'Match MVP player full-screen' },
  { id: 'champions',     label: 'BOOYAH! CHAMPION',  icon: Crown,      transparent: false, desc: 'Tournament winner reveal' },
  { id: 'maplabel',      label: 'MAP INTRO',         icon: Zap,        transparent: false, desc: 'Map name + teams pre-match' },
  { id: 'teams',         label: 'TEAMS TODAY',       icon: Layers,     transparent: false, desc: 'All competing teams display' },
];

function CopyBtn({ text, id, copied, onCopy }) {
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
    <div className="flex flex-col gap-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-base font-black text-white tracking-wider">OBS OVERLAY URLs</h1>
          <p className="font-orbitron text-[9px] text-gray-500 mt-1">ADD EACH AS A BROWSER SOURCE IN OBS STUDIO</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-[#00D4FF] animate-pulse" />
          <span className="font-orbitron text-[9px] font-black text-[#00D4FF]">1920×1080 FIXED</span>
        </div>
      </div>

      {/* OBS Setup Tip */}
      <div className="rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/5 p-4">
        <p className="font-orbitron text-[9px] font-black text-[#FF6B00] tracking-wider mb-2">OBS SETUP — DO THIS ONCE PER SOURCE</p>
        <div className="space-y-1 text-[11px] text-gray-400">
          <p>1. OBS → <span className="text-white font-bold">Add → Browser Source</span> → paste the URL below</p>
          <p>2. Width: <span className="text-white font-bold">1920</span> · Height: <span className="text-white font-bold">1080</span></p>
          <p>3. For transparent overlays: enable <span className="text-white font-bold">Custom CSS</span> → <code className="text-[#00D4FF]">body {'{ background: transparent !important; }'}</code></p>
          <p>4. Uncheck <span className="text-white font-bold">"Shutdown source when not visible"</span></p>
        </div>
      </div>

      {/* Your Share Token */}
      {shareToken && (
        <div className="rounded-xl border border-white/5 bg-[#0a0e1a] p-4">
          <p className="font-orbitron text-[9px] font-black text-gray-400 tracking-wider mb-2">YOUR UNIQUE SHARE TOKEN</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 truncate rounded-lg border border-white/5 bg-black/40 px-3 py-2 font-mono text-xs text-[#00D4FF]">{shareToken}</code>
            <CopyBtn text={shareToken} id="token" copied={copied} onCopy={copy} />
          </div>
        </div>
      )}

      {/* Transparent Overlays */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="font-orbitron text-[9px] font-black text-[#00D4FF] tracking-widest">TRANSPARENT — LAYER OVER GAMEPLAY</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="flex flex-col gap-2">
          {transparent.map((ov) => {
            const url = overlayUrl(ov.id);
            const Icon = ov.icon;
            return (
              <div key={ov.id} className="flex items-center gap-3 rounded-xl border border-[#00D4FF]/10 bg-[#0a0e1a] p-3 hover:border-[#00D4FF]/30 transition-all">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20">
                  <Icon className="h-4 w-4 text-[#00D4FF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-orbitron text-[10px] font-black text-white tracking-wider">{ov.label}</p>
                  <p className="text-[9px] text-gray-600">{ov.desc}</p>
                  <code className="block truncate font-mono text-[9px] text-[#00D4FF]/70 mt-0.5">{url}</code>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                  <a href={url} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#00D4FF] transition-all">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solid Scene Overlays */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="font-orbitron text-[9px] font-black text-[#FF6B00] tracking-widest">FULL SCENE — REPLACE ENTIRE SCREEN</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="flex flex-col gap-2">
          {solid.map((ov) => {
            const url = overlayUrl(ov.id);
            const Icon = ov.icon;
            return (
              <div key={ov.id} className="flex items-center gap-3 rounded-xl border border-[#FF6B00]/10 bg-[#0a0e1a] p-3 hover:border-[#FF6B00]/30 transition-all">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/20">
                  <Icon className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-orbitron text-[10px] font-black text-white tracking-wider">{ov.label}</p>
                  <p className="text-[9px] text-gray-600">{ov.desc}</p>
                  <code className="block truncate font-mono text-[9px] text-[#FF6B00]/70 mt-0.5">{url}</code>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <CopyBtn text={url} id={ov.id} copied={copied} onCopy={copy} />
                  <a href={url} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-[#FF6B00] transition-all">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
