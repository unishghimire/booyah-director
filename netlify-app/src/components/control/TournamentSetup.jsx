import React, { useState } from 'react';
import { SectionBoundary, safeArray } from '@/components/ErrorBoundary';
import { ChevronDown, ChevronUp, Trophy, Plus, X, Image as ImageIcon } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';

const DEFAULT_PLACEMENTS = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };
const EMPTY_TEAM = { name: '', logoUrl: '' };

export default function TournamentSetup({ onCreated }) {
  const [name, setName]           = useState('');
  const [totalMatches, setTotalMatches] = useState(6);
  const [pointsPerKill, setPointsPerKill] = useState(1);
  const [placements, setPlacements]  = useState(DEFAULT_PLACEMENTS);
  const [showPlacements, setShowPlacements] = useState(false);
  const [teams, setTeams]         = useState([{ ...EMPTY_TEAM }]);
  const [submitting, setSubmitting] = useState(false);

  const updateTeam = (i, field, val) => setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  const addTeam    = () => setTeams(prev => [...prev, { ...EMPTY_TEAM }]);
  const removeTeam = (i) => setTeams(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Tournament name is required'); return; }
    setSubmitting(true);
    try {
      const res = await overlayApi.initializeTournament({
        name: name.trim(),
        total_matches: Number(totalMatches),
        points_per_kill: Number(pointsPerKill),
        placement_points_config: placements,
      });

      const tid = res?.tournament?.id;
      if (tid) {
        const validTeams = teams.filter(t => t.name.trim());
        for (const team of validTeams) {
          await overlayApi.addTeam({ tournament_id: tid, team_name: team.name.trim(), logo_url: team.logoUrl || '' });
        }
      }

      toast.success('Tournament created!');
      onCreated?.();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tournament Info */}
      <div className="rounded-xl border border-white/8 bg-[#0a0e1a] p-4 space-y-4">
        <div className="flex items-center gap-2 text-[#FF6B00]">
          <Trophy className="h-4 w-4" />
          <h3 className="font-orbitron text-sm font-black tracking-wider">TOURNAMENT INFO</h3>
        </div>
        <div>
          <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">TOURNAMENT NAME</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BOOYAH CUP 2026"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B00]/60 font-orbitron tracking-wider" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">TOTAL MATCHES</label>
            <input type="number" min={1} value={totalMatches} onChange={e => setTotalMatches(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/60" />
          </div>
          <div>
            <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">POINTS / KILL</label>
            <input type="number" min={0} value={pointsPerKill} onChange={e => setPointsPerKill(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/60" />
          </div>
        </div>
        <div>
          <button type="button" onClick={() => setShowPlacements(!showPlacements)}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-orbitron font-black text-gray-400 hover:text-white tracking-wider">
            PLACEMENT POINTS CONFIG
            {showPlacements ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showPlacements && (
            <div className="mt-2 grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(pos => (
                <div key={pos}>
                  <label className="font-orbitron text-[9px] text-gray-500 block mb-0.5">#{pos}</label>
                  <input type="number" min={0} value={placements[pos] ?? 0}
                    onChange={e => setPlacements(prev => ({ ...prev, [pos]: Number(e.target.value) || 0 }))}
                    className="w-full rounded border border-white/10 bg-black/50 px-1.5 py-1 text-xs text-white outline-none focus:border-[#FF6B00]/50" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="rounded-xl border border-white/8 bg-[#0a0e1a] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-sm font-black text-white tracking-wider">ADD TEAMS <span className="text-gray-600 text-[10px] font-normal ml-1">(optional)</span></h3>
          <button type="button" onClick={addTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] font-orbitron text-[10px] font-black tracking-wider hover:bg-[#FF6B00]/20 transition-all">
            <Plus className="h-3 w-3" /> ADD TEAM
          </button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {teams.map((team, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-black/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={team.name}
                  onChange={e => updateTeam(i, 'name', e.target.value)}
                  placeholder={`Team ${i + 1} name`}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B00]/50"
                />
                {teams.length > 1 && (
                  <button type="button" onClick={() => removeTeam(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <ImageUpload
                value={team.logoUrl}
                onChange={(url) => updateTeam(i, 'logoUrl', url)}
                label="Team Logo"
                name={`team-${i + 1}-logo`}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl py-3 font-orbitron text-sm font-black text-white tracking-widest transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #FF6B00, #ff4500)', boxShadow: submitting ? 'none' : '0 4px 20px rgba(255,107,0,0.35)' }}>
        {submitting ? 'CREATING TOURNAMENT...' : 'CREATE TOURNAMENT'}
      </button>
    </form>
  );
}
