import React, { useMemo } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { ScrollText } from 'lucide-react';

export default function KillFeedLog({ killFeed }) {
  const recent = useMemo(() => {
    return [...(killFeed || [])]
      .sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date))
      .slice(0, 10);
  }, [killFeed]);

  const fmtTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-3">
      <div className="mb-2 flex items-center gap-2">
        <ScrollText className="h-3.5 w-3.5 text-orange-500" />
        <h3 className="font-orbitron text-xs font-bold text-white">KILL FEED</h3>
      </div>
      {recent.length === 0 ? (
        <p className="py-3 text-center text-[10px] text-gray-600">No kills recorded</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {safeArray(recent).map((kill, i) => (
            <div key={kill.id || i} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-[10px]">
              <span className="text-gray-500">{fmtTime(kill.timestamp || kill.created_date)}</span>
              <span className="font-bold text-orange-400">{kill.killer_name}</span>
              {kill.killed_player_name ? (
                <><span className="text-gray-600">→</span><span className="text-red-400">{kill.killed_player_name}</span></>
              ) : (
                <span className="text-gray-600">got a kill</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}