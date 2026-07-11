import React, { useState } from 'react';
import { Monitor, Map, Crosshair, AlertTriangle, Star, Trophy, LayoutList } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const SCREENS = [
  { key: 'setup_blank',      label: 'SETUP',        icon: Monitor,     desc: 'Black screen' },
  { key: 'pre_match_map',    label: 'MAP INTRO',     icon: Map,         desc: 'Map + team list' },
  { key: 'ff_scoreboard',    label: 'FF BOARD',      icon: LayoutList,  desc: 'Free Fire style' },
  { key: 'scoreboard',       label: 'SCOREBOARD',    icon: Trophy,      desc: 'Default board' },
  { key: 'kill_feed',        label: 'KILL FEED',     icon: Crosshair,   desc: 'Recent kills' },
  { key: 'elimination_alert',label: 'ELIM ALERT',    icon: AlertTriangle,desc: 'Last elimination' },
  { key: 'mvp',              label: 'MVP',           icon: Star,        desc: 'MVP screen' },
  { key: 'champions',        label: 'CHAMPIONS',     icon: Trophy,      desc: 'Booyah!' },
];

export default function ScreenSwitcher({ currentScreen, onAction }) {
  const [busy, setBusy] = useState(null);

  const handleSwitch = async (screen) => {
    setBusy(screen);
    try {
      await overlayApi.switchOverlayScreen({ screen });
      toast.success(`→ ${screen.replace(/_/g, ' ').toUpperCase()}`);
      onAction?.();
    } catch (err) {
      toast.error(`Switch failed: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-3">
      <h3 className="mb-2 font-orbitron text-xs font-bold text-white">OVERLAY SCREEN</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {SCREENS.map(s => {
          const Icon = s.icon;
          const isActive = currentScreen === s.key;
          return (
            <button
              key={s.key}
              onClick={() => handleSwitch(s.key)}
              disabled={busy !== null}
              title={s.desc}
              className={`flex flex-col items-start rounded-lg px-2 py-2 text-left transition ${
                isActive
                  ? 'bg-orange-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              } disabled:opacity-40`}
              style={isActive ? { boxShadow: '0 0 12px rgba(249,115,22,0.6)' } : {}}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" />
                <span className="text-[10px] font-black tracking-wider">
                  {busy === s.key ? '...' : s.label}
                </span>
              </div>
              {isActive && (
                <span className="mt-0.5 text-[9px] font-medium opacity-70">{s.desc}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
