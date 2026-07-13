import React, { useState } from 'react';
import { SectionBoundary } from '@/components/ErrorBoundary';
import { Star } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

export default function MVPCard({ tournament, currentMatch, overlayState, onAction }) {
  const [mvp, setMvp] = useState(null);
  const [busy, setBusy] = useState(null);

  // `mvp` comes from calculateMVP: { player_id, name, team, kills }
  // Fallback: show whatever is persisted in overlayState
  const displayMvp = mvp || (overlayState?.mvp_player_name ? {
    player_id:   overlayState.mvp_player_id,
    name:        overlayState.mvp_player_name,
    team:        overlayState.mvp_team_name,
    kills:       overlayState.mvp_kills,
  } : null);

  const handleCalculate = async () => {
    if (!currentMatch?.id) { toast.error('No active match'); return; }
    setBusy('calc');
    try {
      const result = await overlayApi.calculateMVP({ match_id: currentMatch.id });
      // Backend returns { mvp: { player_id, name, team, kills }, tied, max_kills }
      if (!result.mvp) {
        toast('No kills recorded this match yet', { icon: '⚠️' });
        return;
      }
      setMvp(result.mvp);
      toast.success(`MVP: ${result.mvp.name} (${result.mvp.kills} kill${result.mvp.kills !== 1 ? 's' : ''})`);
    } catch (err) {
      toast.error(`Calculate failed: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleShow = async () => {
    if (!currentMatch?.id || !displayMvp?.player_id) {
      toast.error('Calculate MVP first');
      return;
    }
    setBusy('show');
    try {
      await overlayApi.setMVPAndShowScreen({
        match_id:    currentMatch.id,
        player_id:   displayMvp.player_id,
        player_name: displayMvp.name,
        team_name:   displayMvp.team,
        kills:       displayMvp.kills,
      });
      toast.success('MVP shown on overlay!');
      onAction?.();
    } catch (err) {
      toast.error(`Show failed: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <SectionBoundary label="MVP">
      <div className="rounded-xl border border-white/10 bg-[#11111a] p-3">
        <div className="mb-2 flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-purple-400" />
          <h3 className="font-orbitron text-xs font-bold text-white">MVP</h3>
        </div>

        {displayMvp ? (
          <div className="mb-2 rounded-lg border border-purple-500/20 bg-purple-500/5 p-2 text-center">
            <p className="font-orbitron text-sm font-black text-purple-300">{displayMvp.name}</p>
            <p className="text-[10px] text-gray-400">{displayMvp.team}</p>
            <p className="text-xs font-bold text-orange-400">{displayMvp.kills} kills</p>
          </div>
        ) : (
          <p className="mb-2 text-center text-[10px] text-gray-600">No MVP calculated yet</p>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={handleCalculate}
            disabled={busy !== null || !currentMatch}
            className="flex-1 rounded-md bg-purple-600 py-1.5 font-orbitron text-[10px] font-bold text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
          >
            {busy === 'calc' ? '...' : 'CALCULATE'}
          </button>
          <button
            onClick={handleShow}
            disabled={busy !== null || !displayMvp?.player_id}
            className="flex-1 rounded-md bg-orange-500 py-1.5 font-orbitron text-[10px] font-bold text-black hover:bg-orange-400 disabled:opacity-40 transition-colors"
          >
            {busy === 'show' ? '...' : 'SHOW OVERLAY'}
          </button>
        </div>
      </div>
    </SectionBoundary>
  );
}
