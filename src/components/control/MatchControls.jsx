import React, { useState } from 'react';
import { MapPin, Flag, Play, Square, Star, SkipForward, Trophy } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const STATE_BUTTONS = [
  { key: 'pre_match', label: 'PRE-MATCH', state: 'pre_match', color: 'bg-blue-600 hover:bg-blue-500', icon: Flag },
  { key: 'go_live', label: 'GO LIVE', action: 'start', color: 'bg-green-600 hover:bg-green-500', icon: Play },
  { key: 'end_match', label: 'END MATCH', state: 'post_match', color: 'bg-orange-600 hover:bg-orange-500', icon: Square },
  { key: 'show_mvp', label: 'SHOW MVP', state: 'mvp', color: 'bg-purple-600 hover:bg-purple-500', icon: Star },
  { key: 'next_match', label: 'NEXT MATCH', action: 'start', color: 'bg-teal-600 hover:bg-teal-500', icon: SkipForward },
];

export default function MatchControls({ tournament, currentMatch, onAction }) {
  const [mapName, setMapName] = useState('');
  const [busy, setBusy] = useState(null);

  const matchState = currentMatch?.state || 'idle';
  const matchNumber = currentMatch?.match_number || tournament?.current_match_number || 0;

  const handleClick = async (btn) => {
    setBusy(btn.key);
    try {
      if (btn.action === 'start') {
        await overlayApi.startNextMatch({
          tournament_id: tournament?.id || tournament?._id,
          map_name: mapName.trim() || 'Bermuda',
        });
        setMapName('');
        toast.success('Match started!');
      } else {
        await overlayApi.updateMatchState({
          tournament_id: tournament?.id || tournament?._id,
          state: btn.state,
        });
        toast.success(`${btn.label} activated`);
      }
      onAction?.();
    } catch (err) {
      toast.error(`${btn.label}: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDeclare = async () => {
    setBusy('declare');
    try {
      await overlayApi.declareChampions({ tournament_id: tournament?.id || tournament?._id });
      toast.success('Champions declared!');
      onAction?.();
    } catch (err) {
      toast.error(`Declare: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-orbitron text-sm font-bold text-white">MATCH CONTROL</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-400">Match #{matchNumber}</span>
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
            matchState === 'in_game' ? 'bg-green-500/20 text-green-400' :
            matchState === 'post_match' ? 'bg-orange-500/20 text-orange-400' :
            matchState === 'mvp' ? 'bg-purple-500/20 text-purple-400' :
            matchState === 'pre_match' ? 'bg-blue-500/20 text-blue-400' :
            'bg-white/5 text-gray-500'
          }`}>{matchState}</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-400">Map Name</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={mapName}
            onChange={e => setMapName(e.target.value)}
            placeholder="e.g. Bermuda, Purgatory, Kalahari"
            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATE_BUTTONS.map(btn => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.key}
              onClick={() => handleClick(btn)}
              disabled={busy !== null}
              className={`flex items-center gap-1.5 rounded-lg ${btn.color} px-3 py-2 text-xs font-bold text-white transition disabled:opacity-40`}
            >
              <Icon className="h-3.5 w-3.5" />
              {busy === btn.key ? '...' : btn.label}
            </button>
          );
        })}
        <button
          onClick={handleDeclare}
          disabled={busy !== null}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
        >
          <Trophy className="h-3.5 w-3.5" />
          {busy === 'declare' ? '...' : '🏆 DECLARE CHAMPIONS'}
        </button>
      </div>
    </div>
  );
}