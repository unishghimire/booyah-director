import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';

export default function KillFeedLog({ killFeed }) {
  const recent = useMemo(() => {
    return [...killFeed]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 10);
  }, [killFeed]);

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-orange-500" />
        <h3 className="font-orbitron text-sm font-bold text-white">KILL FEED LOG</h3>
      </div>
      <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '300px' }}>
        {recent.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-600">No kills recorded yet</p>
        )}
        {recent.map((kill, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md bg-black/30 px-2 py-1.5 text-xs">
            <span className="flex-shrink-0 text-[10px] text-gray-600">{formatTime(kill.timestamp)}</span>
            <span className="truncate font-semibold text-orange-400">{kill.killer_name || '?'}</span>
            <span className="flex-shrink-0 text-gray-600">💀</span>
            <span className="truncate text-gray-300">{kill.killed_player_name || '?'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}