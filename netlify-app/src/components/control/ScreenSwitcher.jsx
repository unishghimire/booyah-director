import React, { useState } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import {
  Monitor, Map, Crosshair, AlertTriangle, Star, Trophy,
  LayoutList, Users, Mic2, Flag, Calendar, Eye
} from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const SCREENS = [
  // ── Full-scene replacements (solid background) ──
  { key: 'setup_blank',       label: 'STANDBY',      icon: Monitor,      desc: 'Black hold screen',         group: 'scene' },
  { key: 'maplabel',          label: 'MAP INTRO',     icon: Map,          desc: 'Map reveal + team list',    group: 'scene' },
  { key: 'teams',             label: 'TEAMS TODAY',   icon: Users,        desc: 'All teams grid',            group: 'scene' },
  { key: 'casters',           label: 'CASTERS',       icon: Mic2,         desc: 'Caster introduction',       group: 'scene' },
  { key: 'mvp',               label: 'MVP',           icon: Star,         desc: 'MVP spotlight screen',      group: 'scene' },
  { key: 'champions',         label: 'BOOYAH!',       icon: Trophy,       desc: 'Champions reveal',          group: 'scene' },
  // ── Transparent overlays (layer over gameplay) ──
  { key: 'scoreboard',        label: 'SCOREBOARD',    icon: LayoutList,   desc: 'Live scoreboard overlay',   group: 'overlay' },
  { key: 'standings',         label: 'STANDINGS',     icon: Trophy,       desc: 'Full tournament standings', group: 'overlay' },
  { key: 'kill_feed',         label: 'KILL FEED',     icon: Crosshair,    desc: 'Live kill events',          group: 'overlay' },
  { key: 'elim_alert',        label: 'ELIM ALERT',    icon: AlertTriangle,desc: 'Last elimination popup',   group: 'overlay' },
];

const GROUP_LABELS = {
  scene:   { label: 'FULL SCENES',      color: '#FF6B00' },
  overlay: { label: 'LIVE OVERLAYS',    color: '#00D4FF' },
};

export default function ScreenSwitcher({ currentScreen, onAction }) {
  const [busy, setBusy] = useState(null);

  const handleSwitch = async (screen) => {
    if (busy) return;
    setBusy(screen);
    try {
      await overlayApi.switchOverlayScreen({ screen });
      toast.success(`▶ ${screen.replace(/_/g, ' ').toUpperCase()}`, { icon: '🎬' });
      onAction?.();
    } catch (err) {
      toast.error(`Switch failed: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const scenes   = SCREENS.filter(s => s.group === 'scene');
  const overlays = SCREENS.filter(s => s.group === 'overlay');

  const renderGroup = (items, groupKey) => {
    const { label, color } = GROUP_LABELS[groupKey];
    return (
      <div className="space-y-1.5">
        <p className="font-orbitron text-[9px] font-black tracking-widest" style={{ color }}>
          {label}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map(s => {
            const Icon = s.icon;
            const isActive = currentScreen === s.key;
            const isBusy   = busy === s.key;
            return (
              <button
                key={s.key}
                onClick={() => handleSwitch(s.key)}
                disabled={busy !== null}
                title={s.desc}
                className="flex flex-col items-start rounded-lg px-2.5 py-2 text-left transition-all disabled:opacity-40"
                style={
                  isActive
                    ? { background: `${color}22`, border: `1px solid ${color}88`, boxShadow: `0 0 10px ${color}44` }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                <div className="flex items-center gap-1.5 w-full">
                  <Icon
                    className="h-3 w-3 flex-shrink-0"
                    style={{ color: isActive ? color : 'rgba(255,255,255,0.4)' }}
                  />
                  <span
                    className="text-[10px] font-black tracking-wider truncate"
                    style={{ color: isActive ? color : 'rgba(255,255,255,0.7)' }}
                  >
                    {isBusy ? '···' : s.label}
                  </span>
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: color }}
                    />
                  )}
                </div>
                {isActive && (
                  <span className="mt-0.5 text-[9px] opacity-50" style={{ color }}>
                    {s.desc}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SectionBoundary label="SCREEN SWITCHER">
      <div className="rounded-xl border border-white/10 bg-[#11111a] p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-xs font-bold text-white">OVERLAY SCREEN</h3>
          <span className="font-orbitron text-[9px] text-gray-500 tracking-widest">
            LIVE: <span className="text-[#FF6B00]">{(currentScreen || 'STANDBY').replace(/_/g, ' ').toUpperCase()}</span>
          </span>
        </div>
        {renderGroup(scenes, 'scene')}
        <div className="h-px bg-white/5" />
        {renderGroup(overlays, 'overlay')}
      </div>
    </SectionBoundary>
  );
}
