import React, { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

export default function ChampionsCard({ teams, onAction }) {
  const [busy, setBusy] = useState(false);

  const top3 = useMemo(() => {
    return [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0)).slice(0, 3);
  }, [teams]);

  const handleShow = async () => {
    setBusy(true);
    try {
      const topTeam = top3[0];
      await overlayApi.setChampionAndShowScreen({
        team_id: topTeam?.id || topTeam?._id,
      });
      toast.success('BOOYAH screen shown!');
      onAction?.();
    } catch (err) {
      toast.error(`Champions: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-yellow-500/20 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <h3 className="font-orbitron text-sm font-bold text-white">CHAMPIONS</h3>
      </div>
      <div className="mb-3 space-y-1.5">
        {top3.length === 0 && <p className="text-center text-xs text-gray-600">No teams yet</p>}
        {top3.map((team, i) => (
          <div key={team.id || team._id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
            i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-black/30'
          }`}>
            <div className="flex items-center gap-2">
              <Trophy className={`h-4 w-4 ${MEDAL_COLORS[i] || 'text-gray-500'}`} />
              <span className="text-sm font-semibold text-white">{team.name}</span>
            </div>
            <span className="text-sm font-bold text-orange-400">{team.total_tournament_points || 0} pts</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleShow}
        disabled={busy || top3.length === 0}
        className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 py-2 text-xs font-black text-white hover:opacity-90 disabled:opacity-40"
      >
        {busy ? 'Showing...' : '🏆 SHOW BOOYAH SCREEN'}
      </button>
    </div>
  );
}