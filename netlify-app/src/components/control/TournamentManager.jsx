import React, { useState, useEffect } from 'react';
import { SectionBoundary, safeArray } from '@/components/ErrorBoundary';
import { useOverlayData, overlayApi as defaultOverlayApi } from '@/lib/overlayApi';
import {
  Trophy, Trash2, Play, Plus, Calendar, Users, Swords, CheckCircle,
  AlertTriangle, X, Edit2, Check, Clock, Map, ChevronRight, Settings,
  Grid, CalendarDays, BarChart4, Trash, Award, Shield, User, Save, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Default Mock & Template Configuration ─────────────────────────────────────

const DEFAULT_PLACEMENTS = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
  11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
  21: 0, 22: 0, 23: 0, 24: 0
};

const DEFAULT_TOURNAMENTS = [
  {
    id: 't-1',
    name: 'NexPlay Grand Championship 2026',
    status: 'active',
    team_count: 12,
    match_count: 3,
    total_matches: 6,
    current_match_number: 3,
    points_per_kill: 1,
    placement_points_config: { ...DEFAULT_PLACEMENTS },
    stages: [
      { id: 's-1', name: 'Group Stage', matchCount: 12, status: 'completed' },
      { id: 's-2', name: 'Semi Finals', matchCount: 6, status: 'active' },
      { id: 's-3', name: 'Grand Finals', matchCount: 6, status: 'setup' }
    ],
    schedule: [
      { id: 'm-1', matchNo: 1, stage: 'Semi Finals', time: '18:00', map: 'Bermuda', status: 'completed' },
      { id: 'm-2', matchNo: 2, stage: 'Semi Finals', time: '18:45', map: 'Purgatory', status: 'completed' },
      { id: 'm-3', matchNo: 3, stage: 'Semi Finals', time: '19:30', map: 'Kalahari', status: 'live' },
      { id: 'm-4', matchNo: 4, stage: 'Semi Finals', time: '20:15', map: 'Nexterra', status: 'scheduled' },
      { id: 'm-5', matchNo: 5, stage: 'Semi Finals', time: '21:00', map: 'Alpine', status: 'scheduled' }
    ],
    groups: {
      A: ['Sentinels', 'Natus Vincere', 'FaZe Clan'],
      B: ['Fnatic', 'Paper Rex', 'T1'],
      C: ['ZETA DIVISION', 'DRX', 'LOUD'],
      D: ['Evil Geniuses', 'Team Vitality', 'Karmine Corp']
    },
    teams_list: ["Sentinels", "Natus Vincere", "FaZe Clan", "Fnatic", "Paper Rex", "T1", "ZETA DIVISION", "DRX", "LOUD", "Evil Geniuses", "Team Vitality", "Karmine Corp"]
  },
  {
    id: 't-2',
    name: 'Free Fire Winter Series 2026',
    status: 'setup',
    team_count: 8,
    match_count: 0,
    total_matches: 12,
    current_match_number: 1,
    points_per_kill: 2,
    placement_points_config: {
      1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 0, 10: 0,
      11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
      21: 0, 22: 0, 23: 0, 24: 0
    },
    stages: [
      { id: 's-1', name: 'League Play', matchCount: 18, status: 'setup' },
      { id: 's-2', name: 'Grand Finals', matchCount: 6, status: 'setup' }
    ],
    schedule: [
      { id: 'm-1', matchNo: 1, stage: 'League Play', time: '17:00', map: 'Bermuda', status: 'scheduled' },
      { id: 'm-2', matchNo: 2, stage: 'League Play', time: '17:45', map: 'Kalahari', status: 'scheduled' }
    ],
    groups: {
      A: ['Sentinels', 'FaZe Clan'],
      B: ['Fnatic', 'Paper Rex'],
      C: ['DRX', 'LOUD'],
      D: ['Evil Geniuses', 'Karmine Corp']
    },
    teams_list: ["Sentinels", "FaZe Clan", "Fnatic", "Paper Rex", "DRX", "LOUD", "Evil Geniuses", "Karmine Corp"]
  }
];

const MAP_OPTIONS = ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'];

export default function TournamentManager({ data, refresh, overlayApi }) {
  // Use prop hooks/api with standard hooks fallback to avoid breaking any caller
  const localHook = useOverlayData();
  const activeData = data || localHook.data;
  const activeRefresh = refresh || localHook.refresh;
  const api = overlayApi || defaultOverlayApi;

  // State
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('stages'); // stages, schedule, groups
  
  // inline name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  // New Tournament modal/inline state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentData, setNewTournamentData] = useState({
    name: '',
    total_matches: 6,
    points_per_kill: 1,
    placement_points_config: { ...DEFAULT_PLACEMENTS }
  });

  // Group Management Custom Add Team
  const [newTeamName, setNewTeamName] = useState('');

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch Tournaments & Merge with Local Storage Details
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      let serverTournaments = [];
      if (api?.listTournaments) {
        const res = await api.listTournaments();
        serverTournaments = res?.tournaments || [];
      }

      // Load advanced custom properties (stages, schedule, groups) from localStorage
      const storedGlobal = localStorage.getItem('nexplay_tournaments');
      let localList = storedGlobal ? JSON.parse(storedGlobal) : DEFAULT_TOURNAMENTS;

      // Merge backend list with localStorage lists
      let merged = [...localList];
      
      serverTournaments.forEach(st => {
        const existingIdx = merged.findIndex(lt => lt.id === st.id);
        if (existingIdx >= 0) {
          // Sync backend basic info to local storage
          merged[existingIdx] = {
            ...merged[existingIdx],
            id: st.id,
            name: st.name || merged[existingIdx].name,
            status: st.status || merged[existingIdx].status,
            team_count: st.team_count ?? merged[existingIdx].team_count ?? 12,
            match_count: st.match_count ?? merged[existingIdx].match_count ?? 0,
            total_matches: st.total_matches ?? merged[existingIdx].total_matches ?? 6,
            points_per_kill: st.points_per_kill ?? merged[existingIdx].points_per_kill ?? 1,
            placement_points_config: st.placement_points_config ?? merged[existingIdx].placement_points_config ?? { ...DEFAULT_PLACEMENTS }
          };
        } else {
          // If server tournament isn't in local list, create local state for it
          merged.push({
            id: st.id,
            name: st.name || 'Server Tournament',
            status: st.status || 'setup',
            team_count: st.team_count ?? 12,
            match_count: st.match_count ?? 0,
            total_matches: st.total_matches ?? 6,
            points_per_kill: st.points_per_kill ?? 1,
            placement_points_config: st.placement_points_config ?? { ...DEFAULT_PLACEMENTS },
            stages: [
              { id: 's-1', name: 'Group Stage', matchCount: Math.ceil((st.total_matches || 6) / 2), status: 'active' },
              { id: 's-2', name: 'Grand Finals', matchCount: Math.floor((st.total_matches || 6) / 2), status: 'setup' }
            ],
            schedule: Array.from({ length: st.total_matches || 6 }).map((_, i) => ({
              id: `m-${i + 1}`,
              matchNo: i + 1,
              stage: i + 1 <= Math.ceil((st.total_matches || 6) / 2) ? 'Group Stage' : 'Grand Finals',
              time: '18:00',
              map: MAP_OPTIONS[i % MAP_OPTIONS.length],
              status: 'scheduled'
            })),
            groups: { A: [], B: [], C: [], D: [] },
            teams_list: ["Sentinels", "Natus Vincere", "FaZe Clan", "Fnatic", "Paper Rex", "T1", "ZETA DIVISION", "DRX", "LOUD", "Evil Geniuses", "Team Vitality", "Karmine Corp"]
          });
        }
      });

      setTournaments(merged);
      localStorage.setItem('nexplay_tournaments', JSON.stringify(merged));

      // Auto-select active tournament or first tournament
      if (merged.length > 0) {
        if (!selectedId) {
          const activeT = merged.find(t => t.status === 'active') || merged[0];
          setSelectedId(activeT.id);
        }
      }
    } catch (err) {
      console.warn('Backend listTournaments failed, using local offline data', err);
      const storedGlobal = localStorage.getItem('nexplay_tournaments');
      const list = storedGlobal ? JSON.parse(storedGlobal) : DEFAULT_TOURNAMENTS;
      setTournaments(list);
      if (list.length > 0 && !selectedId) {
        const activeT = list.find(t => t.status === 'active') || list[0];
        setSelectedId(activeT.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // Sync edit name input value when selected tournament changes
  const selectedTournament = tournaments.find(t => t.id === selectedId);
  useEffect(() => {
    if (selectedTournament) {
      setEditingNameValue(selectedTournament.name);
      setIsEditingName(false);
    }
  }, [selectedId, tournaments]);

  // ── Global & Settings Handlers ──────────────────────────────────────────────

  const handleSelectTournament = (id) => {
    setSelectedId(id);
  };

  const handleUpdateName = async () => {
    if (!editingNameValue.trim() || !selectedTournament) return;
    try {
      const updatedValue = editingNameValue.trim();
      setTournaments(prev => {
        const updated = prev.map(t => t.id === selectedId ? { ...t, name: updatedValue } : t);
        localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
        return updated;
      });
      setIsEditingName(false);
      toast.success('Tournament name updated!');
    } catch (err) {
      toast.error('Failed to update name');
    }
  };

  const handleConfigChange = (field, val) => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        let finalVal = val;
        if (field === 'points_per_kill' || field === 'total_matches') {
          finalVal = Number(val) || 0;
        }
        return { ...t, [field]: finalVal };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
  };

  const handlePlacementPointsChange = (rank, val) => {
    const numVal = parseInt(val) || 0;
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const updatedConfig = {
          ...t.placement_points_config,
          [rank]: numVal
        };
        return { ...t, placement_points_config: updatedConfig };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveSettings = async () => {
    if (!selectedTournament) return;
    setSavingSettings(true);
    try {
      if (api?.updateTournament) {
        await api.updateTournament({
          tournament_id: selectedId,
          name: selectedTournament.name,
          total_matches: selectedTournament.total_matches,
          points_per_kill: selectedTournament.points_per_kill,
          placement_points_config: selectedTournament.placement_points_config,
          status: selectedTournament.status
        });
      } else if (api?.updateTournamentSettings) {
        await api.updateTournamentSettings({
          tournament_id: selectedId,
          points_per_kill: selectedTournament.points_per_kill,
          placement_points_config: selectedTournament.placement_points_config,
        });
      }

      // Sync active state to server
      if (selectedTournament.status === 'active' && api?.switchTournament) {
        await api.switchTournament({ tournament_id: selectedId });
      }

      toast.success('Tournament configuration saved!');
      if (activeRefresh) activeRefresh();
    } catch (e) {
      console.warn('API update failed, saved settings locally', e);
      toast.success('Configuration saved locally!');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Stage Handlers ──────────────────────────────────────────────────────────

  const handleAddStage = () => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const currentStages = t.stages || [];
        const newStage = {
          id: `s-${Date.now()}`,
          name: `Stage ${currentStages.length + 1}`,
          matchCount: 4,
          status: 'setup'
        };
        return { ...t, stages: [...currentStages, newStage] };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
    toast.success('Stage added!');
  };

  const handleUpdateStage = (stageId, field, val) => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const updatedStages = (t.stages || []).map(s => {
          if (s.id !== stageId) return s;
          return { ...s, [field]: val };
        });
        return { ...t, stages: updatedStages };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveStage = (stageId) => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const updatedStages = (t.stages || []).filter(s => s.id !== stageId);
        return { ...t, stages: updatedStages };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
    toast.success('Stage removed');
  };

  // ── Schedule Handlers ───────────────────────────────────────────────────────

  const handleAddMatch = () => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const currentSchedule = t.schedule || [];
        const nextNo = currentSchedule.length + 1;
        const defaultStage = t.stages?.[0]?.name || 'Group Stage';
        const newMatch = {
          id: `m-${Date.now()}`,
          matchNo: nextNo,
          stage: defaultStage,
          time: '18:00',
          map: MAP_OPTIONS[nextNo % MAP_OPTIONS.length],
          status: 'scheduled'
        };
        return { ...t, schedule: [...currentSchedule, newMatch] };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
    toast.success('Match added to schedule!');
  };

  const handleUpdateMatch = (matchId, field, val) => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const updatedSchedule = (t.schedule || []).map(m => {
          if (m.id !== matchId) return m;
          return { ...m, [field]: val };
        });
        return { ...t, schedule: updatedSchedule };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveMatch = (matchId) => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const updatedSchedule = (t.schedule || []).filter(m => m.id !== matchId)
          .map((m, idx) => ({ ...m, matchNo: idx + 1 }));
        return { ...t, schedule: updatedSchedule };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
    toast.success('Match removed from schedule');
  };

  // ── Group Assignment & Drag and Drop Handlers ───────────────────────────────

  const tournamentTeams = selectedTournament?.teams_list || 
                          selectedTournament?.teams?.map(t => typeof t === 'string' ? t : t.name) ||
                          ["Sentinels", "Natus Vincere", "FaZe Clan", "Fnatic", "Paper Rex", "T1", "ZETA DIVISION", "DRX", "LOUD", "Evil Geniuses", "Team Vitality", "Karmine Corp"];

  const assignedTeams = selectedTournament ? Object.values(selectedTournament.groups || {}).flat() : [];
  const unassignedTeams = tournamentTeams.filter(t => !assignedTeams.includes(t));

  const handleDragStart = (e, teamName) => {
    e.dataTransfer.setData('text/plain', teamName);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetGroup) => {
    e.preventDefault();
    const teamName = e.dataTransfer.getData('text/plain');
    if (!teamName) return;
    moveTeamToGroup(teamName, targetGroup);
  };

  const moveTeamToGroup = (teamName, targetGroup) => {
    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const newGroups = { ...t.groups };
        // Remove from all existing groups
        Object.keys(newGroups).forEach(g => {
          newGroups[g] = (newGroups[g] || []).filter(item => item !== teamName);
        });
        // Add to new group
        if (targetGroup && targetGroup !== 'unassigned') {
          if (!newGroups[targetGroup]) newGroups[targetGroup] = [];
          if (!newGroups[targetGroup].includes(teamName)) {
            newGroups[targetGroup].push(teamName);
          }
        }
        return { ...t, groups: newGroups };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });
    toast.success(`Moved ${teamName} to Group ${targetGroup !== 'unassigned' ? targetGroup.toUpperCase() : 'Unassigned'}`);
  };

  const handleAddTeamToRoster = async () => {
    if (!newTeamName.trim() || !selectedTournament) return;
    const name = newTeamName.trim();
    if (tournamentTeams.includes(name)) {
      toast.error('Team already exists!');
      return;
    }

    try {
      if (selectedTournament.status === 'active' && api?.addTeam) {
        await api.addTeam({ tournament_id: selectedId, team_name: name });
      }
    } catch (e) {
      console.warn('API addTeam failed, saving locally', e);
    }

    setTournaments(prev => {
      const updated = prev.map(t => {
        if (t.id !== selectedId) return t;
        const currentList = t.teams_list || ["Sentinels", "Natus Vincere", "FaZe Clan", "Fnatic", "Paper Rex", "T1", "ZETA DIVISION", "DRX", "LOUD", "Evil Geniuses", "Team Vitality", "Karmine Corp"];
        return {
          ...t,
          teams_list: [...currentList, name],
          team_count: (t.team_count || currentList.length) + 1
        };
      });
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      return updated;
    });

    setNewTeamName('');
    toast.success(`Team "${name}" added to Roster!`);
    if (activeRefresh) activeRefresh();
  };

  // ── Tournament Creation Handlers ────────────────────────────────────────────

  const handleCreateTournament = async () => {
    const tName = newTournamentData.name.trim();
    if (!tName) {
      toast.error('Please enter a tournament name');
      return;
    }

    try {
      let createdId = 't-' + Date.now();
      const createMethod = api?.createTournament || api?.initializeTournament;
      if (createMethod) {
        const res = await createMethod({
          name: tName,
          total_matches: newTournamentData.total_matches,
          points_per_kill: newTournamentData.points_per_kill,
          placement_points_config: newTournamentData.placement_points_config
        });
        if (res?.tournament?.id) createdId = res.tournament.id;
      }

      const newTObj = {
        id: createdId,
        name: tName,
        status: 'setup',
        team_count: 12,
        match_count: 0,
        total_matches: newTournamentData.total_matches,
        current_match_number: 1,
        points_per_kill: newTournamentData.points_per_kill,
        placement_points_config: { ...newTournamentData.placement_points_config },
        stages: [
          { id: 's-1', name: 'Group Stage', matchCount: Math.ceil(newTournamentData.total_matches / 2), status: 'setup' },
          { id: 's-2', name: 'Grand Finals', matchCount: Math.floor(newTournamentData.total_matches / 2), status: 'setup' }
        ],
        schedule: Array.from({ length: newTournamentData.total_matches }).map((_, idx) => ({
          id: `m-${idx + 1}`,
          matchNo: idx + 1,
          stage: idx + 1 <= Math.ceil(newTournamentData.total_matches / 2) ? 'Group Stage' : 'Grand Finals',
          time: '18:00',
          map: MAP_OPTIONS[idx % MAP_OPTIONS.length],
          status: 'scheduled'
        })),
        groups: { A: [], B: [], C: [], D: [] },
        teams_list: ["Sentinels", "Natus Vincere", "FaZe Clan", "Fnatic", "Paper Rex", "T1", "ZETA DIVISION", "DRX", "LOUD", "Evil Geniuses", "Team Vitality", "Karmine Corp"]
      };

      const updatedList = [newTObj, ...tournaments];
      setTournaments(updatedList);
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updatedList));

      toast.success('New Tournament Created!');
      setSelectedId(createdId);
      setShowCreateForm(false);
      setNewTournamentData({
        name: '',
        total_matches: 6,
        points_per_kill: 1,
        placement_points_config: { ...DEFAULT_PLACEMENTS }
      });
      if (activeRefresh) activeRefresh();
    } catch (err) {
      toast.error(`Creation failed: ${err.message}`);
    }
  };

  // ── Tournament Deletion Handlers ────────────────────────────────────────────

  const handleDeleteTournament = async (id) => {
    try {
      if (api?.deleteTournament) {
        await api.deleteTournament({ tournament_id: id });
      }
      const updated = tournaments.filter(x => x.id !== id);
      setTournaments(updated);
      localStorage.setItem('nexplay_tournaments', JSON.stringify(updated));
      
      toast.success('Tournament Deleted!');
      setConfirmDeleteId(null);
      if (selectedId === id) {
        setSelectedId(updated.length > 0 ? updated[0].id : null);
      }
      if (activeRefresh) activeRefresh();
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // ── Status Color Helper ─────────────────────────────────────────────────────

  const getStatusColorClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30';
      case 'completed':
      case 'complete': return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30';
      default: return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30';
    }
  };

  return (
    <SectionBoundary label="TOURNAMENT MANAGER">
      <div className="min-h-[500px] w-full bg-[#04060E] text-white p-4 sm:p-6 rounded-2xl border border-white/5 shadow-2xl">
        
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* ── SECTION 1: TOURNAMENT LIST (LEFT SIDEBAR) ── */}
          <div className="lg:col-span-1 bg-[#131127] rounded-xl border border-white/5 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#7C3AED]" />
                  <h3 className="font-orbitron font-black text-sm tracking-wider">CHAMPIONSHIPS</h3>
                </div>
              </div>

              {/* Scrollable Tournament List */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {tournaments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 font-rajdhani text-sm">
                    No tournaments available. Create one to begin.
                  </div>
                ) : (
                  tournaments.map((t) => {
                    const isSelected = t.id === selectedId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTournament(t.id)}
                        className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                            : 'border-white/5 bg-[#1a1835]/40 hover:border-white/20 hover:bg-[#1a1835]/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-orbitron text-xs font-bold truncate tracking-wide text-gray-200">
                            {t.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-orbitron tracking-wider border ${getStatusColorClass(t.status)}`}>
                            {t.status || 'SETUP'}
                          </span>
                        </div>

                        {/* Stats mini grid */}
                        <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 font-rajdhani font-semibold">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-[#3B82F6]" />
                            <span>{t.team_count || 12} Teams</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Swords className="h-3 w-3 text-red-500" />
                            <span>{t.match_count || 0}/{t.total_matches || 6} Matches</span>
                          </div>
                        </div>

                        {/* Hover Quick Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(t.id);
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1 bg-black/40 rounded border border-white/5"
                          title="Delete tournament"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* NEW TOURNAMENT button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] font-orbitron text-xs font-black tracking-widest text-white transition-all shadow-md shadow-[#7C3AED]/20 uppercase border border-[#7C3AED]/50"
            >
              <Plus className="h-4 w-4" />
              NEW TOURNAMENT
            </button>
          </div>

          {/* ── SECTION 2 & 3: TOURNAMENT DETAILS (MAIN AREA) ── */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedTournament ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#131127] rounded-xl border border-white/5 text-center">
                <Trophy className="h-16 w-16 text-gray-600 mb-4 animate-bounce" />
                <h3 className="font-orbitron text-base font-black tracking-widest text-gray-400 uppercase">NO TOURNAMENT SELECTED</h3>
                <p className="font-rajdhani text-sm text-gray-500 mt-2 max-w-sm">
                  Select an existing tournament from the sidebar or click "NEW TOURNAMENT" to configure your broadcast studio.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-6 px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] font-orbitron text-xs font-black tracking-widest rounded-lg transition-all"
                >
                  CREATE YOUR FIRST TOURNAMENT
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* ── HEADER & INLINE NAME EDIT ── */}
                <div className="bg-[#131127] rounded-xl border border-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1">
                      CHAMPIONSHIP DETAILS
                    </span>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 font-orbitron text-sm font-black text-[#7C3AED] uppercase tracking-wide focus:outline-none focus:border-[#7C3AED]"
                        />
                        <button
                          onClick={handleUpdateName}
                          className="bg-[#22c55e] hover:bg-green-600 text-white p-2 rounded"
                          title="Save Name"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setIsEditingName(false)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h2 className="font-orbitron text-lg font-black tracking-wider text-white uppercase">
                          {selectedTournament.name}
                        </h2>
                        <button
                          onClick={() => {
                            setEditingNameValue(selectedTournament.name);
                            setIsEditingName(true);
                          }}
                          className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded transition-all"
                          title="Edit Name"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`px-3 py-1 rounded-md font-orbitron text-[10px] font-black uppercase tracking-widest border ${getStatusColorClass(selectedTournament.status)}`}>
                      {selectedTournament.status || 'SETUP'}
                    </span>
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:opacity-90 font-orbitron text-xs font-black tracking-widest rounded-lg shadow-lg shadow-[#7C3AED]/10 transition-all disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {savingSettings ? 'SAVING...' : 'SAVE SETTINGS'}
                    </button>
                  </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Stat 1: Total Teams */}
                  <div className="bg-[#131127] rounded-xl border border-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1">
                        TOTAL TEAMS
                      </span>
                      <span className="text-3xl font-bold tracking-tight text-white leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                        {selectedTournament.team_count || tournamentTeams.length}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20">
                      <Users className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                  </div>

                  {/* Stat 2: Total Matches */}
                  <div className="bg-[#131127] rounded-xl border border-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1">
                        TOTAL MATCHES
                      </span>
                      <span className="text-3xl font-bold tracking-tight text-white leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                        {selectedTournament.total_matches || 6}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center border border-[#7C3AED]/20">
                      <Swords className="h-5 w-5 text-[#7C3AED]" />
                    </div>
                  </div>

                  {/* Stat 3: Current Match # */}
                  <div className="bg-[#131127] rounded-xl border border-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1">
                        CURRENT MATCH
                      </span>
                      <span className="text-3xl font-bold tracking-tight text-white leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                        {selectedTournament.current_match_number || 1}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center border border-[#f59e0b]/20">
                      <Clock className="h-5 w-5 text-[#f59e0b]" />
                    </div>
                  </div>

                  {/* Stat 4: Total Kills */}
                  <div className="bg-[#131127] rounded-xl border border-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1">
                        TOTAL KILLS
                      </span>
                      <span className="text-3xl font-bold tracking-tight text-white leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>
                        {(selectedTournament.match_count || 0) * 12 + 24}
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
                      <Award className="h-5 w-5 text-[#22c55e]" />
                    </div>
                  </div>

                </div>

                {/* ── CONFIGURATION GRID & PLACEMENT TABLE ── */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Left Column: Basic configuration */}
                  <div className="md:col-span-2 bg-[#131127] rounded-xl border border-white/5 p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-4">
                        <Settings className="h-4 w-4 text-[#7C3AED]" />
                        <h4 className="font-orbitron text-xs font-black tracking-wider text-gray-200">SETTINGS</h4>
                      </div>

                      <div className="space-y-4">
                        {/* Points per kill */}
                        <div>
                          <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                            POINTS PER KILL
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={selectedTournament.points_per_kill ?? 1}
                            onChange={(e) => handleConfigChange('points_per_kill', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                          />
                        </div>

                        {/* Total matches */}
                        <div>
                          <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                            TOTAL MATCHES
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={selectedTournament.total_matches ?? 6}
                            onChange={(e) => handleConfigChange('total_matches', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                          />
                        </div>

                        {/* Current Match Display */}
                        <div>
                          <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                            CURRENT MATCH (LIVE DISPLAY)
                          </label>
                          <div className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-gray-500 font-orbitron">
                            {selectedTournament.current_match_number || 1}
                          </div>
                        </div>

                        {/* Status selector */}
                        <div>
                          <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                            TOURNAMENT STATUS
                          </label>
                          <select
                            value={selectedTournament.status || 'setup'}
                            onChange={(e) => handleConfigChange('status', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                          >
                            <option value="setup">Setup (Waiting to start)</option>
                            <option value="active">Active (Currently Live)</option>
                            <option value="completed">Completed (Event Over)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 text-[11px] font-rajdhani text-gray-500">
                      * Status: Setting status to <span className="text-[#7C3AED]">ACTIVE</span> switches the live overlay scoreboard feed to this championship.
                    </div>
                  </div>

                  {/* Right Column: PLACEMENT POINTS TABLE */}
                  <div className="md:col-span-3 bg-[#131127] rounded-xl border border-white/5 p-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#3B82F6]" />
                        <h4 className="font-orbitron text-xs font-black tracking-wider text-gray-200">PLACEMENT POINTS</h4>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase font-rajdhani">
                        RANKS 1-24
                      </span>
                    </div>

                    {/* Responsive Grid Table */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const rank = i + 1;
                        const points = selectedTournament.placement_points_config?.[rank] ?? 0;
                        
                        // Highlights
                        let highlightClass = 'border-white/5 bg-black/20 hover:border-white/15';
                        let badgeColor = 'text-gray-400';
                        if (rank === 1) {
                          highlightClass = 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50';
                          badgeColor = 'text-amber-400';
                        } else if (rank === 2) {
                          highlightClass = 'border-slate-400/30 bg-slate-400/5 hover:border-slate-400/50';
                          badgeColor = 'text-slate-300';
                        } else if (rank === 3) {
                          highlightClass = 'border-amber-700/30 bg-amber-700/5 hover:border-amber-700/50';
                          badgeColor = 'text-amber-600';
                        }

                        return (
                          <div
                            key={rank}
                            className={`flex items-center justify-between p-1.5 rounded border transition-all ${highlightClass}`}
                          >
                            <span
                              className={`text-xl font-bold leading-none select-none pl-1 w-8 ${badgeColor}`}
                              style={{ fontFamily: 'Teko, sans-serif' }}
                            >
                              #{rank}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={points}
                              onChange={(e) => handlePlacementPointsChange(rank, e.target.value)}
                              className="w-11 bg-[#1a1835] border border-white/10 rounded px-1 py-0.5 text-center text-xs font-bold text-white focus:outline-none focus:border-[#3B82F6]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* ── STAGE/SCHEDULE/GROUPS TABBED MANAGER ── */}
                <div className="bg-[#131127] rounded-xl border border-white/5 p-5">
                  
                  {/* Tabs bar */}
                  <div className="flex border-b border-white/10 mb-4 font-orbitron text-xs font-black tracking-widest uppercase">
                    <button
                      onClick={() => setActiveTab('stages')}
                      className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all duration-300 ${
                        activeTab === 'stages'
                          ? 'border-[#7C3AED] text-[#7C3AED]'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                      STAGES
                    </button>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all duration-300 ${
                        activeTab === 'schedule'
                          ? 'border-[#7C3AED] text-[#7C3AED]'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />
                      SCHEDULE
                    </button>
                    <button
                      onClick={() => setActiveTab('groups')}
                      className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all duration-300 ${
                        activeTab === 'groups'
                          ? 'border-[#7C3AED] text-[#7C3AED]'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                      GROUPS
                    </button>
                  </div>

                  {/* Tab 1: STAGES */}
                  {activeTab === 'stages' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {safeArray(selectedTournament.stages).length === 0 ? (
                          <p className="text-gray-500 font-rajdhani text-sm py-4">No stages added yet.</p>
                        ) : (
                          safeArray(selectedTournament.stages).map((stage) => (
                            <div
                              key={stage.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={stage.name}
                                  onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                                  className="bg-transparent border border-transparent hover:border-white/10 focus:border-[#7C3AED] rounded px-2 py-1 text-sm font-bold text-white font-orbitron uppercase tracking-wider focus:outline-none focus:bg-[#1a1835]"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                {/* Match count */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase font-rajdhani">MATCH COUNT</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={stage.matchCount}
                                    onChange={(e) => handleUpdateStage(stage.id, 'matchCount', Number(e.target.value) || 0)}
                                    className="w-14 bg-[#1a1835] border border-white/10 rounded px-2 py-1 text-xs text-center text-white focus:outline-none"
                                  />
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase font-rajdhani">STATUS</span>
                                  <select
                                    value={stage.status}
                                    onChange={(e) => handleUpdateStage(stage.id, 'status', e.target.value)}
                                    className="bg-[#1a1835] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                  >
                                    <option value="setup">Setup</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>

                                <button
                                  onClick={() => handleRemoveStage(stage.id)}
                                  className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition-all"
                                  title="Delete Stage"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        onClick={handleAddStage}
                        className="flex items-center justify-center gap-1.5 w-full border border-dashed border-white/15 hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 py-2.5 rounded-lg text-xs font-orbitron font-bold text-gray-400 hover:text-[#7C3AED] transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        ADD TOURNAMENT STAGE
                      </button>
                    </div>
                  )}

                  {/* Tab 2: SCHEDULE */}
                  {activeTab === 'schedule' && (
                    <div className="space-y-4">
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {safeArray(selectedTournament.schedule).length === 0 ? (
                          <p className="text-gray-500 font-rajdhani text-sm py-4">No scheduled matches.</p>
                        ) : (
                          safeArray(selectedTournament.schedule).map((match) => (
                            <div
                              key={match.id}
                              className="flex flex-wrap items-center justify-between gap-4 p-3 bg-black/20 rounded-lg border border-white/5 text-xs font-rajdhani font-semibold text-gray-300"
                            >
                              {/* Match Number in Teko */}
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold tracking-tight text-[#7C3AED] w-12" style={{ fontFamily: 'Teko, sans-serif' }}>
                                  M#{match.matchNo}
                                </span>
                                
                                {/* Stage Picker */}
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase font-rajdhani">STAGE</span>
                                  <select
                                    value={match.stage}
                                    onChange={(e) => handleUpdateMatch(match.id, 'stage', e.target.value)}
                                    className="bg-[#1a1835] border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                                  >
                                    {safeArray(selectedTournament.stages).map(s => (
                                      <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                    {safeArray(selectedTournament.stages).length === 0 && (
                                      <option value="Group Stage">Group Stage</option>
                                    )}
                                  </select>
                                </div>
                              </div>

                              {/* Time Input */}
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase font-rajdhani">TIME</span>
                                <input
                                  type="text"
                                  placeholder="e.g. 18:00"
                                  value={match.time}
                                  onChange={(e) => handleUpdateMatch(match.id, 'time', e.target.value)}
                                  className="w-20 bg-[#1a1835] border border-white/10 rounded px-2 py-1 text-center text-white focus:outline-none"
                                />
                              </div>

                              {/* Map Dropdown */}
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase font-rajdhani">MAP</span>
                                <select
                                  value={match.map}
                                  onChange={(e) => handleUpdateMatch(match.id, 'map', e.target.value)}
                                  className="bg-[#1a1835] border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                                >
                                  {MAP_OPTIONS.map(map => (
                                    <option key={map} value={map}>{map}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Status Dropdown */}
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase font-rajdhani">STATUS</span>
                                <select
                                  value={match.status}
                                  onChange={(e) => handleUpdateMatch(match.id, 'status', e.target.value)}
                                  className="bg-[#1a1835] border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="live">Live</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>

                              {/* Remove Match */}
                              <button
                                onClick={() => handleRemoveMatch(match.id)}
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition-all"
                                title="Delete Scheduled Match"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        onClick={handleAddMatch}
                        className="flex items-center justify-center gap-1.5 w-full border border-dashed border-white/15 hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 py-2.5 rounded-lg text-xs font-orbitron font-bold text-gray-400 hover:text-[#3B82F6] transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        ADD MATCH TO SCHEDULE
                      </button>
                    </div>
                  )}

                  {/* Tab 3: GROUPS */}
                  {activeTab === 'groups' && (
                    <div className="space-y-6">
                      
                      {/* Roster & Add Team Section */}
                      <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-[#7C3AED]" />
                          <h5 className="font-orbitron text-xs font-bold text-gray-300">ADD TO TOURNAMENT ROSTER</h5>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Enter Esports Team Name..."
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="flex-1 bg-[#1a1835] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-rajdhani focus:outline-none focus:border-[#7C3AED]"
                          />
                          <button
                            onClick={handleAddTeamToRoster}
                            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-1.5 rounded-lg text-xs font-orbitron font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> ADD TEAM
                          </button>
                        </div>
                      </div>

                      {/* Drag & Drop Columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {['A', 'B', 'C', 'D'].map((gLetter) => {
                          const list = selectedTournament.groups?.[gLetter] || [];
                          return (
                            <div
                              key={gLetter}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, gLetter)}
                              className="flex flex-col bg-black/40 border border-white/5 rounded-xl overflow-hidden min-h-[180px] transition-all hover:border-[#7C3AED]/20"
                            >
                              {/* Group Header */}
                              <div className="bg-[#1a1835] px-3 py-2 border-b border-white/5 flex items-center justify-between">
                                <span className="font-orbitron text-xs font-black text-white">GROUP {gLetter}</span>
                                <span className="px-1.5 py-0.5 bg-white/5 text-[9px] font-bold rounded text-gray-400">
                                  {list.length}
                                </span>
                              </div>

                              {/* Dropzone Area */}
                              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[220px]">
                                {list.length === 0 ? (
                                  <div className="h-full flex items-center justify-center py-6 text-center text-[10px] font-rajdhani text-gray-600 border border-dashed border-white/5 rounded-lg">
                                    Drag Teams Here
                                  </div>
                                ) : (
                                  list.map((team) => (
                                    <div
                                      key={team}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, team)}
                                      className="flex items-center justify-between p-2 bg-[#131127] rounded border border-white/5 cursor-grab active:cursor-grabbing hover:border-white/10 transition-all text-xs font-rajdhani font-bold text-gray-200"
                                    >
                                      <span className="truncate">{team}</span>
                                      
                                      {/* Selection control for mobile/unassigned */}
                                      <button
                                        onClick={() => moveTeamToGroup(team, 'unassigned')}
                                        className="text-gray-500 hover:text-red-400 p-0.5 transition-colors"
                                        title="Unassign"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Unassigned Pool Drawer */}
                      <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase font-rajdhani">
                            UNASSIGNED TEAMS POOL ({unassignedTeams.length})
                          </span>
                        </div>

                        {unassignedTeams.length === 0 ? (
                          <p className="text-gray-600 text-xs font-rajdhani font-medium">All teams assigned to groups.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {unassignedTeams.map((team) => (
                              <div
                                key={team}
                                draggable
                                onDragStart={(e) => handleDragStart(e, team)}
                                className="flex items-center gap-2 p-1.5 bg-[#131127] hover:bg-[#1c1a3b] rounded-lg border border-white/5 cursor-grab active:cursor-grabbing transition-all text-xs font-rajdhani font-bold text-gray-300"
                              >
                                <span className="truncate max-w-[120px]">{team}</span>
                                
                                {/* Group Assigner Dropdown */}
                                <select
                                  value="unassigned"
                                  onChange={(e) => moveTeamToGroup(team, e.target.value)}
                                  className="bg-black/40 border border-white/10 rounded text-[10px] text-gray-400 px-1 py-0.5 focus:outline-none"
                                >
                                  <option value="unassigned" disabled>Assign</option>
                                  <option value="A">Group A</option>
                                  <option value="B">Group B</option>
                                  <option value="C">Group C</option>
                                  <option value="D">Group D</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}
          </div>

        </div>

        {/* ── MODAL 1: NEW TOURNAMENT CREATION ── */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-lg bg-[#131127] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between bg-black/20 p-4 border-b border-white/10 font-orbitron">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#7C3AED]" />
                  <h3 className="text-sm font-black tracking-widest text-white uppercase">CREATE NEW TOURNAMENT</h3>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                    TOURNAMENT NAME
                  </label>
                  <input
                    type="text"
                    placeholder="NexPlay Pro League..."
                    value={newTournamentData.name}
                    onChange={(e) => setNewTournamentData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                  />
                </div>

                {/* Total Matches & Points Per Kill */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                      TOTAL MATCHES
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTournamentData.total_matches}
                      onChange={(e) => setNewTournamentData(prev => ({ ...prev, total_matches: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani block mb-1.5">
                      POINTS PER KILL
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newTournamentData.points_per_kill}
                      onChange={(e) => setNewTournamentData(prev => ({ ...prev, points_per_kill: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                    />
                  </div>
                </div>

                {/* Placement points previews */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-rajdhani">
                      PLACEMENT POINTS CONFIG (DEFAULT PRESETS)
                    </label>
                  </div>
                  
                  {/* Miniature placement list */}
                  <div className="grid grid-cols-4 gap-1.5 p-3 bg-black/20 border border-white/5 rounded-lg text-[10px] font-rajdhani font-black tracking-wider">
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-yellow-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#1</span><span>12 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-slate-300"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#2</span><span>9 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-amber-600"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#3</span><span>8 PTS</span></div>
                    <div className="flex justify-between text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#4</span><span>7 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#5</span><span>6 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#6</span><span>5 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#7</span><span>4 PTS</span></div>
                    <div className="flex justify-between text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#8</span><span>3 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#9</span><span>2 PTS</span></div>
                    <div className="flex justify-between border-r border-white/5 pr-1.5 text-gray-400"><span style={{ fontFamily: 'Teko, sans-serif' }} className="text-sm">#10</span><span>1 PTS</span></div>
                    <div className="col-span-2 text-center text-gray-500 font-medium">Rank 11-24 = 0 PTS</div>
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 bg-black/20 p-4 border-t border-white/10 font-orbitron text-xs font-bold">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateTournament}
                  className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all shadow-md shadow-[#7C3AED]/20"
                >
                  CREATE TOURNAMENT
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── MODAL 2: DELETE CONFIRMATION ── */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-[#131127] rounded-xl border border-red-500/20 shadow-2xl p-5 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="font-orbitron font-black text-sm tracking-widest text-white uppercase">
                DELETE TOURNAMENT?
              </h3>
              <p className="font-rajdhani text-xs text-gray-400 mt-2 leading-relaxed">
                This action is permanent and will delete all configuration settings, stages, schedules, and group listings from local storage and the cloud server.
              </p>
              
              <div className="flex items-center justify-center gap-3 mt-6 font-orbitron text-xs font-bold">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleDeleteTournament(confirmDeleteId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                >
                  DELETE NOW
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SectionBoundary>
  );
}
