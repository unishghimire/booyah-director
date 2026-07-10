import React, { useState } from 'react';
import { Monitor, Map, Crosshair, AlertTriangle, Star, Trophy } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const SCREENS = [
  { key: 'setup_blank', label: 'SETUP', icon: Monitor },
  { key: 'pre_match_map', label: 'MAP', icon: Map },
  { key: 'scoreboard', label: 'SCOREBOARD', icon: Trophy },
  { key: 'kill_feed', label: 'KILL FEED', icon: Crosshair },
  { key: 'elimination_alert', label: 'ELIM ALERT', icon: AlertTriangle },
  { key: 'mvp', label: 'MVP', icon: Star },
  { key: 'champions', label: 'CHAMPIONS', icon: Trophy },
];

export default function ScreenSwitcher({ currentScreen, onAction }) {
  const [busy, setBusy] = useState(null);

  const handleSwitch = async (screen) => {
    setBusy(screen);
    try {
      await overlayApi.switchOverlayScreen({ screen });
      onAction?.();
    } catch (err) { toast.error(`Switch: ${err.message}`); } finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-3">
      <h3 className="mb-2 font-orbitron text-xs font-bold text-white">OVERLAY SCREEN</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {SCREENS.map(s => {
          const Icon = s.icon;
          const isActive = currentScreen === s.key;
          return (
            <button key={s.key} onClick={() => handleSwitch(s.key)} disabled={busy !== null}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold transition ${
                isActive
                  ? 'bg-orange-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              } disabled:opacity-40`}
              style={isActive ? { boxShadow: '0 0 12px rgba(249,115,22,0.6)' } : {}}>
              <Icon className="h-3 w-3" />
              {busy === s.key ? '...' : s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}