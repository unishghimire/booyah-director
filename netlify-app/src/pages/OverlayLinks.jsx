import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Monitor, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const OVERLAYS = [
  // Transparent (OBS Browser Source — enable transparent background)
  { key: 'scoreboard',    label: 'FF SCOREBOARD',    desc: 'Live ranked board during match',    transparent: true  },
  { key: 'standings',     label: 'FULL STANDINGS',   desc: 'Tournament points table',           transparent: true  },
  { key: 'killfeed',      label: 'KILL FEED',        desc: 'Bottom-left live kill events',      transparent: true  },
  { key: 'elim-alert',    label: 'ELIM ALERT',       desc: 'Elimination pop-up flash',         transparent: true  },
  // Solid background (full scene replacement)
  { key: 'blank',         label: 'BLANK / IDLE',     desc: 'Black idle screen',                transparent: false },
  { key: 'maplabel',      label: 'MAP INTRO',        desc: 'Map name + teams pre-match',       transparent: false },
  { key: 'today-matches', label: 'TODAY\'S MATCHES', desc: 'Match schedule for the day',       transparent: false },
  { key: 'teams',         label: 'TEAMS TODAY',      desc: 'All competing teams display',      transparent: false },
  { key: 'casters',       label: 'CASTERS',          desc: 'Caster & analyst introduction',    transparent: false },
  { key: 'upcoming-map',  label: 'UPCOMING MAP',     desc: 'Next map announcement',            transparent: false },
  { key: 'mvp',           label: 'MVP REVEAL',       desc: 'Match MVP player reveal',          transparent: false },
  { key: 'champions',     label: 'BOOYAH! CHAMPION', desc: 'Tournament champion reveal',       transparent: false },
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:border-[#FF6B00]/40 hover:text-white transition-all text-[10px] font-orbitron">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'COPIED' : 'COPY'}
    </button>
  );
}

export default function OverlayLinks() {
  const base = window.location.origin;
  const transparent = OVERLAYS.filter(o => o.transparent);
  const solid       = OVERLAYS.filter(o => !o.transparent);

  const Section = ({ title, items, accent, note }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
        <h2 className="font-orbitron text-[11px] font-black tracking-widest" style={{ color: accent }}>{title}</h2>
        <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accent}, transparent)` }} />
      </div>
      {note && <p className="font-orbitron text-[9px] text-gray-500 tracking-wider mb-3 text-center">{note}</p>}
      <div className="space-y-2">
        {items.map(o => {
          const url = `${base}/overlay/${o.key}`;
          return (
            <div key={o.key} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0a0e1a] px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} />
                <div>
                  <p className="font-orbitron text-[11px] font-black text-white">{o.label}</p>
                  <p className="font-orbitron text-[9px] text-gray-500 mt-0.5">{o.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-gray-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 max-w-xs truncate">
                  {url}
                </span>
                <CopyBtn text={url} />
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-orbitron font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent})` }}>
                  <ExternalLink className="w-3 h-3" /> OPEN
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-orbitron text-lg font-black text-white tracking-wider">OVERLAY LINKS</h1>
            <p className="font-orbitron text-[9px] text-gray-500 mt-1">ADD EACH URL AS AN OBS BROWSER SOURCE AT 1920×1080</p>
          </div>
          <div className="rounded-lg border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-2 text-center">
            <p className="font-orbitron text-[8px] text-[#FF6B00] tracking-wider">BASE URL</p>
            <p className="font-mono text-[11px] text-white">{base}</p>
          </div>
        </div>

        {/* OBS Setup Instructions */}
        <div className="mb-6 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-4">
          <p className="font-orbitron text-[10px] font-black text-[#00D4FF] mb-2">OBS SETUP GUIDE</p>
          <div className="grid grid-cols-2 gap-4 text-[9px] font-orbitron text-gray-400">
            <div>
              <p className="text-white mb-1">TRANSPARENT OVERLAYS (game on top):</p>
              <p>1. Add Browser Source → paste URL</p>
              <p>2. Set Width: 1920, Height: 1080</p>
              <p>3. ✅ Enable "Page Background Colour" → transparent</p>
              <p>4. ❌ Disable "Shutdown source when not visible"</p>
            </div>
            <div>
              <p className="text-white mb-1">SOLID SCENES (full screen replacement):</p>
              <p>1. Create new Scene for each</p>
              <p>2. Add Browser Source → paste URL</p>
              <p>3. Set Width: 1920, Height: 1080</p>
              <p>4. No transparency needed</p>
            </div>
          </div>
        </div>

        <Section
          title="TRANSPARENT OVERLAYS — LAYER OVER GAMEPLAY"
          accent="#00D4FF"
          note="Enable 'Page Background Colour → Transparent' in OBS Browser Source settings"
          items={transparent}
        />
        <Section
          title="FULL-SCENE REPLACEMENTS — SOLID BACKGROUND"
          accent="#FF6B00"
          note="Add as a separate OBS Scene, switch to it during breaks"
          items={solid}
        />
      </div>
    </div>
  );
}
