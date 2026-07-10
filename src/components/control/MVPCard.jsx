import React, { useState } from 'react';
import { Star, Calculator } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

export default function MVPCard({ currentMatch, overlayState, onAction }) {
  const [mvpResult, setMvpResult] = useState(null);
  const [calcBusy, setCalcBusy] = useState(false);
  const [showBusy, setShowBusy] = useState(false);

  const displayedMvp = mvpResult || {
    name: overlayState?.mvp_player_name,
    team: overlayState?.mvp_team_name,
    kills: overlayState?.mvp_kills,
  };

  const hasMvp = displayedMvp.name || displayedMvp.kills != null;

  const handleCalc = async () => {
    setCalcBusy(true);
    try {
      const result = await overlayApi.calculateMVP({
        match_id: currentMatch?.id || currentMatch?._id,
      });
      setMvpResult(result);
      toast.success('MVP calculated!');
    } catch (err) {
      toast.error(`MVP: ${err.message}`);
    } finally {
      setCalcBusy(false);
    }
  };

  const handleShow = async () => {
    setShowBusy(true);
    try {
      await overlayApi.setMVPAndShowScreen({
        match_id: currentMatch?.id || currentMatch?._id,
        player_id: mvpResult?.player_id || mvpResult?.id || overlayState?.mvp_player_id,
      });
      toast.success('MVP shown on overlay!');
      onAction?.();
    } catch (err) {
      toast.error(`Show MVP: ${err.message}`);
    } finally {
      setShowBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/20 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-purple-400" />
        <h3 className="font-orbitron text-sm font-bold text-white">MVP REVEAL</h3>
      </div>
      <div className="mb-3 rounded-lg border border-white/5 bg-black/40 p-3">
        {hasMvp ? (
          <div className="text-center">
            <p className="font-orbitron text-lg font-bold text-purple-400">{displayedMvp.name || '—'}</p>
            <p className="text-xs text-gray-400">{displayedMvp.team || '—'}</p>
            <p className="mt-1 text-sm font-bold text-orange-400">⭐ {displayedMvp.kills || 0} Kills</p>
          </div>
        ) : (
          <p className="text-center text-xs text-gray-600">No MVP calculated yet</p>
        )}
      </div>
      <div className="space-y-2">
        <button
          onClick={handleCalc}
          disabled={calcBusy || !currentMatch}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-40"
        >
          <Calculator className="h-3.5 w-3.5" />
          {calcBusy ? 'Calculating...' : 'CALCULATE MVP'}
        </button>
        <button
          onClick={handleShow}
          disabled={showBusy || !hasMvp}
          className="w-full rounded-lg border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-bold text-purple-400 hover:bg-purple-500/20 disabled:opacity-40"
        >
          {showBusy ? 'Showing...' : 'SHOW MVP ON OVERLAY'}
        </button>
      </div>
    </div>
  );
}