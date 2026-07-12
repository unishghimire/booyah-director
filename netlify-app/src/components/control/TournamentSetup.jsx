import React, { useState } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const DEFAULT_PLACEMENTS = { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1 };

export default function TournamentSetup({ onCreated }) {
  const [name, setName] = useState('');
  const [totalMatches, setTotalMatches] = useState(6);
  const [pointsPerKill, setPointsPerKill] = useState(1);
  const [placements, setPlacements] = useState(DEFAULT_PLACEMENTS);
  const [showPlacements, setShowPlacements] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Tournament name is required'); return; }
    setSubmitting(true);
    try {
      await overlayApi.initializeTournament({
        name: name.trim(),
        total_matches: Number(totalMatches),
        points_per_kill: Number(pointsPerKill),
        placement_points_config: placements,
      });
      toast.success('Tournament created!');
      onCreated?.();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-orange-500">
        <Trophy className="h-4 w-4" />
        <h3 className="font-orbitron text-sm font-bold">CREATE TOURNAMENT</h3>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">Tournament Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Booyah Championship 2026"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Total Matches</label>
          <input type="number" min={1} value={totalMatches} onChange={e => setTotalMatches(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Points / Kill</label>
          <input type="number" min={0} value={pointsPerKill} onChange={e => setPointsPerKill(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
        </div>
      </div>
      <div>
        <button type="button" onClick={() => setShowPlacements(!showPlacements)}
          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white">
          Placement Points
          {showPlacements ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showPlacements && (
          <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-3 sm:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(pos => (
              <div key={pos}>
                <label className="mb-0.5 block text-[10px] text-gray-500">#{pos}</label>
                <input type="number" min={0} value={placements[pos]} onChange={e => setPlacements(prev => ({ ...prev, [pos]: Number(e.target.value) || 0 }))}
                  className="w-full rounded border border-white/10 bg-black/50 px-1.5 py-1 text-xs text-white outline-none focus:border-orange-500" />
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="submit" disabled={submitting}
        className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
        {submitting ? 'Creating...' : 'CREATE TOURNAMENT'}
      </button>
    </form>
  );
}