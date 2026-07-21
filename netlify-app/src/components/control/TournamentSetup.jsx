import React, { useState, useMemo } from 'react';
import { SectionBoundary, safeArray } from '@/components/ErrorBoundary';
import { ChevronDown, ChevronUp, Trophy, Plus, X, Image as ImageIcon, Calendar, MapPin, Layers, Copy } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import ImageUpload from '@/components/ImageUpload';
import { MAPS } from '@/lib/maps';
import toast from 'react-hot-toast';

const DEFAULT_PLACEMENTS = { 1:15, 2:12, 3:10, 4:8, 5:6, 6:4, 7:2, 8:1, 9:1, 10:1, 11:1, 12:1 };
const EMPTY_TEAM = { name: '', logoUrl: '' };

const TEMPLATES = {
  'ewc_group': {
    label: 'EWC Group (2D × 3M)',
    stages: [{
      name: 'Group Stage',
      days: [
        { day: 1, label: 'Day 1', matches: [{ map: 'Bermuda' }, { map: 'Purgatory' }, { map: 'Kalahari' }] },
        { day: 2, label: 'Day 2', matches: [{ map: 'Alpine' }, { map: 'Bermuda' }, { map: 'Nexterra' }] }
      ]
    }]
  },
  'ewc_finals': {
    label: 'Grand Finals (1D × 6M)',
    stages: [{
      name: 'Grand Finals',
      days: [{ day: 1, label: 'Finals Day', matches: [
        { map: 'Bermuda' }, { map: 'Purgatory' }, { map: 'Kalahari' },
        { map: 'Alpine' }, { map: 'Bermuda' }, { map: 'Nexterra' }
      ]}]
    }]
  },
  'full_event': {
    label: 'Full Event: Groups → Finals',
    stages: [
      { name: 'Group Stage', days: [
        { day: 1, label: 'Day 1', matches: [{ map: 'Bermuda' }, { map: 'Purgatory' }, { map: 'Kalahari' }] },
        { day: 2, label: 'Day 2', matches: [{ map: 'Alpine' }, { map: 'Bermuda' }, { map: 'Nexterra' }] }
      ]},
      { name: 'Grand Finals', days: [
        { day: 3, label: 'Finals Day', matches: [
          { map: 'Bermuda' }, { map: 'Purgatory' }, { map: 'Kalahari' },
          { map: 'Alpine' }, { map: 'Bermuda' }, { map: 'Nexterra' }
        ]}
      ]}
    ]
  },
  'custom': {
    label: 'Custom',
    stages: [{ name: 'Group Stage', days: [{ day: 1, label: 'Day 1', matches: [{ map: 'Bermuda' }] }] }]
  }
};

function countMatches(stages) {
  let total = 0;
  for (const stage of stages) for (const day of (stage.days || [])) total += (day.matches || []).length;
  return total;
}

function FormatBuilder({ format, setFormat }) {
  const stages = format.stages || [];

  const updateStage = (si, field, val) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => i === si ? { ...s, [field]: val } : s)
  }));

  const addStage = () => setFormat(prev => ({
    ...prev, stages: [...prev.stages, {
      name: 'Stage ' + (prev.stages.length + 1),
      days: [{ day: prev.stages.length + 1, label: 'Day ' + (prev.stages.length + 1), matches: [{ map: 'Bermuda' }] }]
    }]
  }));

  const removeStage = (si) => setFormat(prev => ({ ...prev, stages: prev.stages.filter((_, i) => i !== si) }));

  const duplicateStage = (si) => setFormat(prev => {
    const copy = JSON.parse(JSON.stringify(prev.stages[si]));
    copy.name = (copy.name || 'Stage') + ' (Copy)';
    const ns = [...prev.stages]; ns.splice(si + 1, 0, copy);
    return { ...prev, stages: ns };
  });

  const addDay = (si) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => {
      if (i !== si) return s;
      const dn = (s.days || []).length + 1;
      return { ...s, days: [...(s.days || []), { day: dn, label: 'Day ' + dn, matches: [{ map: 'Bermuda' }] }] };
    })
  }));

  const removeDay = (si, di) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => i !== si ? s : { ...s, days: s.days.filter((_, j) => j !== di) })
  }));

  const addMatch = (si, di) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => i !== si ? s : {
      ...s, days: s.days.map((d, j) => j !== di ? d : { ...d, matches: [...d.matches, { map: 'Bermuda' }] })
    })
  }));

  const removeMatch = (si, di, mi) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => i !== si ? s : {
      ...s, days: s.days.map((d, j) => j !== di ? d : { ...d, matches: d.matches.filter((_, k) => k !== mi) })
    })
  }));

  const updateMap = (si, di, mi, mapName) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => i !== si ? s : {
      ...s, days: s.days.map((d, j) => j !== di ? d : { ...d, matches: d.matches.map((m, k) => k !== mi ? m : { ...m, map: mapName }) })
    })
  }));

  const updateDayLabel = (si, di, label) => setFormat(prev => ({
    ...prev, stages: prev.stages.map((s, i) => i !== si ? s : { ...s, days: s.days.map((d, j) => j !== di ? d : { ...d, label }) })
  }));

  let gmn = 0;

  return (
    <div className="space-y-3">
      {stages.map((stage, si) => (
        <div key={si} className="rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#7C3AED] flex-shrink-0" />
            <input value={stage.name} onChange={e => updateStage(si, 'name', e.target.value)}
              className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs font-orbitron font-bold text-[#7C3AED] outline-none focus:border-[#7C3AED]/50" placeholder="Stage name" />
            <button type="button" onClick={() => duplicateStage(si)} title="Duplicate" className="rounded p-1 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"><Copy className="h-3 w-3" /></button>
            {stages.length > 1 && <button type="button" onClick={() => removeStage(si)} title="Remove" className="rounded p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X className="h-3 w-3" /></button>}
          </div>
          {stage.days && stage.days.map((day, di) => (
            <div key={di} className="ml-5 rounded border border-white/8 bg-black/30 p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <input value={day.label} onChange={e => updateDayLabel(si, di, e.target.value)}
                  className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-gray-300 outline-none focus:border-white/30" placeholder="Day label" />
                {stage.days.length > 1 && <button type="button" onClick={() => removeDay(si, di)} className="rounded p-0.5 text-gray-600 hover:text-red-400 transition-colors"><X className="h-3 w-3" /></button>}
              </div>
              <div className="ml-5 space-y-1.5">
                {day.matches && day.matches.map((m, mi) => {
                  gmn++;
                  return (
                    <div key={mi} className="flex items-center gap-1.5">
                      <span className="font-orbitron text-[9px] font-black text-gray-600 w-6 text-right">M{gmn}</span>
                      <MapPin className="h-3 w-3 text-gray-600 flex-shrink-0" />
                      <select value={m.map} onChange={e => updateMap(si, di, mi, e.target.value)}
                        className="flex-1 rounded border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white outline-none focus:border-[#7C3AED]/40">
                        {MAPS.map(map => <option key={map} value={map}>{map}</option>)}
                      </select>
                      {day.matches.length > 1 && <button type="button" onClick={() => removeMatch(si, di, mi)} className="rounded p-0.5 text-gray-600 hover:text-red-400 transition-colors"><X className="h-3 w-3" /></button>}
                    </div>
                  );
                })}
                <button type="button" onClick={() => addMatch(si, di)} className="flex items-center gap-1 ml-7 text-[9px] font-orbitron font-bold text-gray-500 hover:text-[#7C3AED] transition-colors"><Plus className="h-2.5 w-2.5" /> ADD MAP</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addDay(si)} className="flex items-center gap-1 ml-5 text-[10px] font-orbitron font-bold text-gray-500 hover:text-white transition-colors"><Plus className="h-3 w-3" /> ADD DAY</button>
        </div>
      ))}
      <button type="button" onClick={addStage} className="flex items-center gap-1.5 w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-orbitron font-bold text-gray-500 hover:text-[#7C3AED] hover:border-[#7C3AED]/30 transition-all"><Plus className="h-3.5 w-3.5" /> ADD STAGE</button>
    </div>
  );
}

export default function TournamentSetup({ onCreated }) {
  const [name, setName] = useState('');
  const [pointsPerKill, setPointsPerKill] = useState(1);
  const [championRushThreshold, setChampionRushThreshold] = useState(80);
  const [placements, setPlacements] = useState(DEFAULT_PLACEMENTS);
  const [showPlacements, setShowPlacements] = useState(false);
  const [teams, setTeams] = useState([{ ...EMPTY_TEAM }]);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState('full_event');
  const [showFormat, setShowFormat] = useState(true);
  const [format, setFormat] = useState(JSON.parse(JSON.stringify(TEMPLATES['full_event'])));

  const totalMatches = useMemo(() => countMatches(format.stages || []), [format]);

  const applyTemplate = (key) => { setTemplate(key); setFormat(JSON.parse(JSON.stringify(TEMPLATES[key]))); };

  const updateTeam = (i, field, val) => setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  const addTeam = () => setTeams(prev => [...prev, { ...EMPTY_TEAM }]);
  const removeTeam = (i) => setTeams(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Tournament name is required'); return; }
    if (totalMatches === 0) { toast.error('Add at least one match to the format'); return; }
    setSubmitting(true);
    try {
      const res = await overlayApi.initializeTournament({
        name: name.trim(), total_matches: totalMatches, points_per_kill: Number(pointsPerKill),
        placement_points_config: placements, format_config: format,
        champion_rush_threshold: Number(championRushThreshold) || 0,
      });
      const tid = res?.tournament?.id;
      if (tid) {
        const validTeams = teams.filter(t => t.name.trim());
        for (const team of validTeams) {
          await overlayApi.addTeam({ tournament_id: tid, team_name: team.name.trim(), logo_url: team.logoUrl || '' });
        }
      }
      toast.success(`Tournament created! ${totalMatches} matches across ${format.stages.length} stage(s)`);
      onCreated?.();
    } catch (err) { toast.error(`Failed: ${err.message}`); } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-white/8 bg-[#0a0e1a] p-4 space-y-4">
        <div className="flex items-center gap-2 text-[#7C3AED]">
          <Trophy className="h-4 w-4" />
          <h3 className="font-orbitron text-sm font-black tracking-wider">TOURNAMENT INFO</h3>
        </div>
        <div>
          <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">TOURNAMENT NAME</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NEXOVERLAYS CUP 2026"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/60 font-orbitron tracking-wider" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">POINTS / KILL</label>
            <input type="number" min={0} value={pointsPerKill} onChange={e => setPointsPerKill(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]/60" />
          </div>
          <div>
            <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">TOTAL MATCHES</label>
            <div className="flex items-center gap-2">
              <input type="number" value={totalMatches} disabled className="w-full rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/5 px-3 py-2 text-sm text-[#7C3AED] font-bold outline-none" />
              <span className="text-[9px] font-orbitron text-gray-500 whitespace-nowrap">AUTO</span>
            </div>
          </div>
          <div>
            <label className="font-orbitron text-[10px] text-gray-500 tracking-wider block mb-1.5">CHAMPION RUSH 🏆</label>
            <select value={championRushThreshold} onChange={e => setChampionRushThreshold(Number(e.target.value))}
              className="w-full rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/5 px-2 py-2 text-sm text-[#7C3AED] font-bold outline-none focus:border-[#7C3AED]/60">
              <option value={0}>Disabled</option>
              <option value={80}>80 Points</option>
              <option value={90}>90 Points</option>
              <option value={100}>100 Points</option>
            </select>
          </div>
        </div>
        {championRushThreshold > 0 && (
          <div className="rounded-lg border border-[#3B82F6]/20 bg-[#3B82F6]/5 p-2.5 text-[10px] text-gray-400">
            <span className="font-orbitron font-bold text-[#3B82F6] tracking-wider">CHAMPION RUSH ACTIVE:</span> Once a team crosses {championRushThreshold} pts, they must win a Booyah (1st place) to be crowned champions. Point Rush carryovers from previous stages are added to totals.
          </div>
        )}
        <div>
          <button type="button" onClick={() => setShowPlacements(!showPlacements)}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-orbitron font-black text-gray-400 hover:text-white tracking-wider">
            PLACEMENT POINTS CONFIG {showPlacements ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showPlacements && (
            <div className="mt-2 grid grid-cols-4 gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(pos => (
                <div key={pos}>
                  <label className="font-orbitron text-[9px] text-gray-500 block mb-0.5">#{pos}</label>
                  <input type="number" min={0} value={placements[pos] ?? 0}
                    onChange={e => setPlacements(prev => ({ ...prev, [pos]: Number(e.target.value) || 0 }))}
                    className="w-full rounded border border-white/10 bg-black/50 px-1.5 py-1 text-xs text-white outline-none focus:border-[#7C3AED]/50" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-[#0a0e1a] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7C3AED]">
            <Layers className="h-4 w-4" />
            <h3 className="font-orbitron text-sm font-black tracking-wider">TOURNAMENT FORMAT</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-orbitron font-black text-[#7C3AED]">{totalMatches} MATCHES</span>
            <button type="button" onClick={() => setShowFormat(!showFormat)} className="text-gray-500 hover:text-white">{showFormat ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <button key={key} type="button" onClick={() => applyTemplate(key)}
              className={`rounded-lg border px-3 py-1.5 font-orbitron text-[10px] font-bold tracking-wider transition-all ${template === key ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED]' : 'border-white/10 bg-black/30 text-gray-500 hover:text-white hover:border-white/20'}`}>
              {tmpl.label}
            </button>
          ))}
        </div>
        {showFormat && <FormatBuilder format={format} setFormat={setFormat} />}
      </div>

      <div className="rounded-xl border border-white/8 bg-[#0a0e1a] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-sm font-black text-white tracking-wider">ADD TEAMS <span className="text-gray-600 text-[10px] font-normal ml-1">(optional)</span></h3>
          <button type="button" onClick={addTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#7C3AED] font-orbitron text-[10px] font-black tracking-wider hover:bg-[#7C3AED]/20 transition-all">
            <Plus className="h-3 w-3" /> ADD TEAM
          </button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {teams.map((team, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-black/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={team.name} onChange={e => updateTeam(i, 'name', e.target.value)} placeholder={`Team ${i + 1} name`}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]/50" />
                {teams.length > 1 && <button type="button" onClick={() => removeTeam(i)} className="text-gray-600 hover:text-red-400 transition-colors"><X className="h-4 w-4" /></button>}
              </div>
              <ImageUpload value={team.logoUrl} onChange={(url) => updateTeam(i, 'logoUrl', url)} label="Team Logo" name={`team-${i + 1}-logo`} size="sm" />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl py-3 font-orbitron text-sm font-black text-white tracking-widest transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #7C3AED)', boxShadow: submitting ? 'none' : '0 4px 20px rgba(124,58,237,0.35)' }}>
        {submitting ? 'CREATING TOURNAMENT...' : 'CREATE TOURNAMENT'}
      </button>
    </form>
  );
}
