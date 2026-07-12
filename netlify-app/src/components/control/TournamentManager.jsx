import React, { useState, useEffect } from 'react';
import { SectionBoundary } from '@/components/ErrorBoundary';
import { overlayApi } from '@/lib/overlayApi';
import TournamentSetup from './TournamentSetup';
import { Trophy, Trash2, Play, Plus, Calendar, Users, Swords, CheckCircle, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchTournaments = async () => {
    try {
      const res = await overlayApi.listTournaments();
      setTournaments(res.tournaments || []);
    } catch (err) {
      toast.error(`Failed to load tournaments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleActivate = async (id) => {
    const t = tournaments.find(x => x.id === id);
    if (!t) return;
    try {
      await overlayApi.switchTournament({ tournament_id: id });
      toast.success(`Activated: ${t.name}`);
      fetchTournaments();
      // Force reload or trigger refresh to update parent components
      window.location.reload();
    } catch (err) {
      toast.error(`Failed to activate: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const t = tournaments.find(x => x.id === confirmDeleteId);
    try {
      await overlayApi.deleteTournament({ tournament_id: confirmDeleteId });
      toast.success(`Deleted: ${t?.name || 'Tournament'}`);
      setConfirmDeleteId(null);
      fetchTournaments();
      // If the deleted tournament was active, we reload to sync the interface with the new active tournament
      if (t?.status === 'active') {
        window.location.reload();
      }
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <SectionBoundary>
      <div className="space-y-6 rounded-xl border border-white/5 bg-[#0a0e1a]/95 p-6 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-orange-500 animate-pulse" />
            <div>
              <h2 className="font-orbitron text-lg font-black tracking-wider text-white uppercase">TOURNAMENT HISTORY</h2>
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">Manage, switch, and persist your championships</p>
            </div>
          </div>
          {!showSetup && (
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 font-orbitron text-xs font-bold text-white tracking-widest hover:opacity-90 transition-all shadow-md shadow-orange-500/20"
            >
              <Plus className="h-4 w-4" />
              CREATE NEW
            </button>
          )}
        </div>

        {/* Inline Tournament Creation Setup */}
        {showSetup && (
          <div className="relative rounded-lg border border-orange-500/30 bg-[#0f1426] p-5 shadow-lg shadow-orange-500/5 animate-fadeIn">
            <button
              onClick={() => setShowSetup(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <TournamentSetup
              onCreated={() => {
                setShowSetup(false);
                fetchTournaments();
                // reload page to immediately synchronize
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Tournament Cards List */}
        {loading ? (
          <div className="flex py-10 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-white/10 bg-black/20 text-center">
            <Trophy className="h-12 w-12 text-gray-600 mb-3" />
            <h3 className="font-orbitron text-sm font-bold text-gray-400 uppercase tracking-wider">No Tournaments Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">Create your first tournament using the setup form above to begin tracking live stats.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map((t) => {
              const isActive = t.status === 'active';
              return (
                <div
                  key={t.id}
                  className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg p-5 transition-all duration-300 border backdrop-blur-sm ${
                    isActive
                      ? 'border-orange-500 bg-[#161224]/80 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-orange-500/50'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Left Column: Info & Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-orbitron text-base font-black tracking-wide text-white uppercase">
                        {t.name}
                      </h3>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 font-orbitron text-[9px] font-black tracking-wider text-orange-500 border border-orange-500/30 animate-pulse">
                          <CheckCircle className="h-2.5 w-2.5" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 font-orbitron text-[9px] font-bold tracking-wider text-gray-400 border border-white/10">
                          COMPLETED
                        </span>
                      )}
                    </div>

                    {/* Meta stats row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        <span>{formatDate(t.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-500" />
                        <span>{t.team_count || 0} Teams</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Swords className="h-3.5 w-3.5 text-gray-500" />
                        <span>{t.match_count || 0} / {t.total_matches || 1} Matches</span>
                      </div>
                    </div>

                    {/* Final Standings Summary */}
                    {t.standings && t.standings.length > 0 && (
                      <div className="mt-3 rounded border border-white/5 bg-black/20 p-2.5 max-w-xl">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Top Standings</span>
                        <div className="flex flex-wrap gap-4">
                          {t.standings.map((st, sidx) => (
                            <div key={st.id} className="flex items-center gap-1.5 text-xs">
                              <span className={`font-black font-orbitron ${sidx === 0 ? 'text-yellow-500' : sidx === 1 ? 'text-gray-300' : 'text-amber-700'}`}>
                                #{sidx + 1}
                              </span>
                              <span className="font-bold text-white uppercase">{st.name}</span>
                              <span className="text-gray-400 font-mono">({st.total_points} pts)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => handleActivate(t.id)}
                        className="flex items-center gap-1.5 rounded bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 font-orbitron text-[10px] font-black tracking-wider text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
                      >
                        <Play className="h-3 w-3" />
                        ACTIVATE
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-white/5 bg-white/5 text-gray-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                      title="Delete Tournament"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-[#0d0912] p-6 shadow-2xl shadow-red-500/5">
              <div className="flex items-center gap-3 text-red-500 mb-3">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="font-orbitron text-sm font-black uppercase tracking-wider">CRITICAL ACTIONS REQUIRED</h3>
              </div>
              <p className="text-sm text-gray-300">
                Are you absolutely sure you want to delete this tournament? This will permanently remove its historical metadata. This action is irreversible.
              </p>
              <div className="mt-6 flex justify-end gap-3 font-orbitron text-xs font-bold tracking-wider">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded border border-white/10 px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded bg-gradient-to-r from-red-600 to-rose-700 px-4 py-2 text-white hover:opacity-90 transition shadow-md shadow-red-600/20"
                >
                  CONFIRM PERMANENT DELETE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SectionBoundary>
  );
}
