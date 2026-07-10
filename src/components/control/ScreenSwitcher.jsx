import React, { useState } from 'react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const SCREENS = [
  { id: 'setup_blank', icon: '🖥️', label: 'BLANK' },
  { id: 'pre_match_map', icon: '🗺️', label: 'MAP REVEAL' },
  { id: 'scoreboard', icon: '📊', label: 'SCOREBOARD' },
  { id: 'kill_feed', icon: '💀', label: 'KILL FEED' },
  { id: 'elimination_alert', icon: '⚡', label: 'ELIM ALERT' },
  { id: 'mvp', icon: '⭐', label: 'MVP SCREEN' },
  { id: 'champions', icon: '🏆', label: 'CHAMPIONS' },
];

export default function ScreenSwitcher({ overlayState, onAction }) {
  const currentScreen = overlayState?.current_screen || 'setup_blank';
  const [busyId, setBusyId] = useState(null);

  const handleClick = async (screenId) => {
    setBusyId(screenId);
    try {
      await overlayApi.switchOverlayScreen({ screen: screenId });
      onAction?.();
    } catch (err) {
      toast.error(`Screen: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <h2 className="mb-3 font-orbitron text-sm font-bold text-white">OBS OVERLAY CONTROL</h2>
      <div className="grid grid-cols-2 gap-2">
        {SCREENS.map(screen => {
          const active = currentScreen === screen.id;
          return (
            <button
              key={screen.id}
              onClick={() => handleClick(screen.id)}
              disabled={busyId !== null}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition ${
                active
                  ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                  : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{screen.icon}</span>
              <span className={`text-[10px] font-bold ${active ? 'text-orange-400' : 'text-gray-400'}`}>{screen.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}