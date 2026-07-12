import React, { useState } from 'react';
import { SectionBoundary, safeArray, safeNumber, safeString } from '@/components/ErrorBoundary';
import { Crown, Trophy } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import toast from 'react-hot-toast';

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-orange-600'];

export default function ChampionsCard({ tournament, teams, onAction }) {
  const [busy, setBusy] = useState(null);

  const top3 = [...(teams || [])]
    .sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))
    .slice(0, 3);

  const handleReveal = async (team) => {
    if (!tournament?.id) { toast.error('No tournament'); return; }
    setBusy(team.id);
    try {
      await overlayApi.setChampionAndShowScreen({
        team_id: team.id,
        team_name: team.name,
        total_points: team.total_tournament_points || 0,
        tournament_id: tournament.id,
      });
      toast.success(`${team.name} revealed as champions!`);
      onAction?.();
    } catch (err) { toast.error(`Reveal: ${err.message}`); } finally { setBusy(null); }
  };

  const handleBooyah = async () => {
    if (!tournament?.id) { toast.error('No tournament'); return; }
    setBusy('declare');
    try {
      await overlayApi.declareChampions({ tournament_id: tournament.id });
      toast.success('BOOYAH! Champions declared!');
      onAction?.();
    } catch (err) { toast.error(`Declare: ${err.message}`); } finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#11111a] p-3">
      <div className="mb-2 flex items-center gap-2">
        <Crown className="h-3.5 w-3.5 text-yellow-400" />
        <h3 className="font-orbitron text-xs font-bold text-white">CHAMPIONS</h3>
      </div>
      {top3.length === 0 ? (
        <p className="py-3 text-center text-[10px] text-gray-600">No teams yet</p>
      ) : (
        <div className="mb-2 space-y-1">
          {safeArray(top3).map((team, i) => (
            <button key={team.id} onClick={() => handleReveal(team)} disabled={busy !== null}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition ${
                i === 0 ? 'border border-yellow-500/30 bg-yellow-500/10' : 'bg-white/5'
              } hover:bg-white/10 disabled:opacity-40`}>
              <div className="flex items-center gap-2">
                <Trophy className={`h-3 w-3 ${MEDAL_COLORS[i] || 'text-gray-600'}`} />
                <span className="text-xs font-bold text-white">{team.name}</span>
              </div>
              <span className="text-xs font-black text-orange-400">{team.total_tournament_points || 0}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={handleBooyah} disabled={busy !== null}
        className="w-full rounded-md bg-gradient-to-r from-yellow-500 to-orange-600 py-1.5 text-[10px] font-black text-black hover:opacity-90 disabled:opacity-40">
        {busy === 'declare' ? '...' : '🏆 BOOYAH!'}
      </button>
    </div>
  );
}