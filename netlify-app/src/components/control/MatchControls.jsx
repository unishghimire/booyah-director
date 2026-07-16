import React, { useState, useMemo } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { MapPin, Flag, Play, Square, SkipForward, Trophy, Calendar, Layers, Clock } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import { MAPS } from '@/lib/maps';
import toast from 'react-hot-toast';

export default function MatchControls({ tournament, currentMatch, onAction }) {
  const [mapName, setMapName] = useState('');
  const [busy, setBusy] = useState(null);

  const tid = tournament?.id;
  const mid = currentMatch?.id;
  const matchState = currentMatch?.state || 'idle';
  const matchNumber = currentMatch?.match_number || tournament?.current_match_number || 0;

  // Stage/Day context from match
  const stageName = currentMatch?.stage_name || null;
  const dayLabel = currentMatch?.day_label || null;
  const dayNumber = currentMatch?.day_number || null;
  const scheduledMap = currentMatch?.map_name || null;

  // Next scheduled match (for "up next" preview)
  const formatConfig = useMemo(() => {
    try { return tournament?.format_config ? (typeof tournament.format_config === 'string' ? JSON.parse(tournament.format_config) : tournament.format_config) : null; }
    catch { return null; }
  }, [tournament]);

  const nextMatchNumber = matchNumber + 1;
  const nextScheduled = formatConfig?.stages?.flatMap(s => s.days?.flatMap(d => d.matches?.map(m => ({ ...m, stage: s.name, day: d.label }))) || [])?.[nextMatchNumber - 1] || null;

  const handleStart = async () => {
    if (!tid) { toast.error('No tournament'); return; }
    setBusy('start');
    try {
      await overlayApi.startNextMatch({ tournament_id: tid, map_name: mapName.trim() || scheduledMap || 'Bermuda' });
      setMapName('');
      toast.success('Match started!');
      onAction?.();
    } catch (err) { toast.error(`Start: ${err.message}`); } finally { setBusy(null); }
  };

  const handleState = async (state, label) => {
    if (!mid) { toast.error('No active match'); return; }
    setBusy(state);
    try {
      await overlayApi.updateMatchState({ match_id: mid, state });
      toast.success(`${label} activated`);
      onAction?.();
    } catch (err) { toast.error(`${label}: ${err.message}`); } finally { setBusy(null); }
  };

  const handleDeclare = async () => {
    if (!tid) { toast.error('No tournament'); return; }
    setBusy('declare');
    try {
      await overlayApi.declareChampions({ tournament_id: tid });
      toast.success('Champions declared!');
      onAction?.();
    } catch (err) { toast.error(`Declare: ${err.message}`); } finally { setBusy(null); }
  };

  const stateColor = (state) => {
    const colors = {
      in_game: 'bg-green-500/20 text-green-400',
      post_match: 'bg-orange-500/20 text-orange-400',
      pre_match: 'bg-blue-500/20 text-blue-400',
      scheduled: 'bg-gray-500/20 text-gray-400',
      mvp: 'bg-purple-500/20 text-purple-400',
    };
    return colors[state] || 'bg-white/5 text-gray-500';
  };

  const buttons = [
    { key: 'start', label: 'START MATCH', color: 'bg-teal-600 hover:bg-teal-500', icon: SkipForward, handler: handleStart },
    { key: 'pre_match', label: 'PRE-MATCH', color: 'bg-blue-600 hover:bg-blue-500', icon: Flag, handler: () => handleState('pre_match', 'Pre-Match') },
    { key: 'in_game', label: 'GO LIVE', color: 'bg-green-600 hover:bg-green-500', icon: Play, handler: () => handleState('in_game', 'Go Live') },
    { key: 'post_match', label: 'END MATCH', color: 'bg-orange-600 hover:bg-orange-500', icon: Square, handler: () => handleState('post_match', 'End Match') },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-4">
      {/* Header with stage + day context */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-orbitron text-sm font-bold text-white">MATCH CONTROL</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-400">Match #{matchNumber}</span>
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${stateColor(matchState)}`}>{matchState}</span>
        </div>
      </div>

      {/* Stage / Day / Map context bar */}
      {(stageName || dayLabel) && (
        <div className="mb-3 flex items-center gap-2 flex-wrap rounded-lg border border-[#FF6B00]/15 bg-[#FF6B00]/5 px-3 py-2">
          {stageName && (
            <div className="flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-[#FF6B00]" />
              <span className="font-orbitron text-[10px] font-bold text-[#FF6B00] tracking-wider">{stageName.toUpperCase()}</span>
            </div>
          )}
          {dayLabel && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="font-orbitron text-[10px] font-bold text-gray-300 tracking-wider">{dayLabel.toUpperCase()}</span>
            </div>
          )}
          {scheduledMap && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="font-orbitron text-[10px] font-bold text-gray-300">{scheduledMap}</span>
            </div>
          )}
        </div>
      )}

      {/* Up next preview */}
      {nextScheduled && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/8 bg-black/30 px-3 py-1.5">
          <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <span className="text-[10px] font-orbitron font-bold text-gray-500 tracking-wider">UP NEXT:</span>
          <span className="text-[10px] font-bold text-gray-300">M{nextMatchNumber}</span>
          <span className="text-[10px] text-gray-500">·</span>
          <span className="text-[10px] font-bold text-gray-400">{nextScheduled.map}</span>
          {nextScheduled.stage && <><span className="text-[10px] text-gray-600">·</span><span className="text-[10px] text-gray-500">{nextScheduled.stage}</span></>}
          {nextScheduled.day && <><span className="text-[10px] text-gray-600">·</span><span className="text-[10px] text-gray-500">{nextScheduled.day}</span></>}
        </div>
      )}

      {/* Map override input */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-400">Map Override (leave empty to use schedule)</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select value={mapName || scheduledMap || ''} onChange={e => setMapName(e.target.value)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-8 text-sm text-white outline-none focus:border-orange-500">
              <option value="">Use scheduled map</option>
              {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {buttons.map(btn => {
          const Icon = btn.icon;
          return (
            <button key={btn.key} onClick={btn.handler} disabled={busy !== null}
              className={`flex items-center gap-1.5 rounded-lg ${btn.color} px-3 py-2 text-xs font-bold text-white transition disabled:opacity-40`}>
              <Icon className="h-3.5 w-3.5" />{busy === btn.key ? '...' : btn.label}
            </button>
          );
        })}
        <button onClick={handleDeclare} disabled={busy !== null}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-40">
          <Trophy className="h-3.5 w-3.5" />{busy === 'declare' ? '...' : 'DECLARE CHAMPIONS'}
        </button>
      </div>
    </div>
  );
}
