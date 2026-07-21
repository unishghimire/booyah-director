import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Search, Plus, Edit2, Trash2, X, Download, Upload,
  Heart, Skull, Award, TrendingUp, Instagram, Youtube, Twitter,
  Flag, ChevronDown, ChevronUp, Filter, Grid3x3, List
} from 'lucide-react';

export default function PlayerManager({ data, refresh, overlayApi }) {
  const players = data?.players || [];
  const teams = data?.teams || [];
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('kills');
  const [viewMode, setViewMode] = useState('grid');
  const [showAdd, setShowAdd] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);

  const teamMap = useMemo(() => {
    const m = {};
    teams.forEach(t => { m[t.id] = t; });
    return m;
  }, [teams]);

  const filtered = useMemo(() => {
    let list = [...players];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.real_name || '').toLowerCase().includes(q));
    }
    if (teamFilter !== 'all') list = list.filter(p => p.team_id === teamFilter);
    if (statusFilter === 'alive') list = list.filter(p => p.is_alive);
    if (statusFilter === 'dead') list = list.filter(p => !p.is_alive);
    list.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'team') return (teamMap[a.team_id]?.name || '').localeCompare(teamMap[b.team_id]?.name || '');
      return (b.total_tournament_kills || 0) - (a.total_tournament_kills || 0);
    });
    return list;
  }, [players, search, teamFilter, statusFilter, sortBy, teamMap]);

  const groupedByTeam = useMemo(() => {
    const groups = {};
    teams.forEach(t => { groups[t.id] = { team: t, players: [] }; });
    filtered.forEach(p => {
      if (groups[p.team_id]) groups[p.team_id].players.push(p);
      else groups['_unassigned'] = groups['_unassigned'] || { team: { name: 'Unassigned' }, players: [] };
      groups['_unassigned']?.players.push(p);
    });
    return Object.values(groups).filter(g => g.players.length > 0);
  }, [filtered, teams]);

  const handleExport = () => {
    const csv = ['Nickname,Real Name,Team,Kills,Status'];
    filtered.forEach(p => {
      csv.push(`${p.name || ''},${p.real_name || ''},${teamMap[p.team_id]?.name || ''},${p.total_tournament_kills || 0},${p.is_alive ? 'Alive' : 'Eliminated'}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Players exported to CSV');
  };

  return (
    <div className="flex flex-col gap-3 p-4 h-full overflow-y-auto" style={{ background: '#04060E' }}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="font-orbitron text-[10px] font-black tracking-widest text-white">PLAYER MANAGEMENT</span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-orbitron font-bold text-white/40">{players.length} TOTAL</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-orbitron text-[9px] font-bold tracking-wider hover:bg-purple-500/25 transition-all">
            <Plus className="w-3 h-3" /> ADD PLAYER
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-orbitron text-[9px] font-bold tracking-wider hover:bg-blue-500/25 transition-all">
            <Download className="w-3 h-3" /> EXPORT
          </button>
          <button onClick={() => toast('Import feature coming soon', { icon: 'ℹ️' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/60 font-orbitron text-[9px] font-bold tracking-wider hover:bg-white/10 transition-all">
            <Upload className="w-3 h-3" /> IMPORT
          </button>
          <div className="flex rounded border border-white/10 overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:bg-white/5'}`}><Grid3x3 className="w-3 h-3" /></button>
            <button onClick={() => setViewMode('roster')} className={`p-1.5 ${viewMode === 'roster' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:bg-white/5'}`}><List className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg border border-white/10" style={{ background: '#131127' }}>
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..." className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder-white/20" />
        </div>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-white/10 text-[10px] font-orbitron font-bold text-white outline-none cursor-pointer" style={{ background: '#131127' }}>
          <option value="all" className="bg-[#131127]">ALL TEAMS</option>
          {teams.map(t => <option key={t.id} value={t.id} className="bg-[#131127]">{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-white/10 text-[10px] font-orbitron font-bold text-white outline-none cursor-pointer" style={{ background: '#131127' }}>
          <option value="all" className="bg-[#131127]">ALL STATUS</option>
          <option value="alive" className="bg-[#131127]">ALIVE</option>
          <option value="dead" className="bg-[#131127]">ELIMINATED</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-white/10 text-[10px] font-orbitron font-bold text-white outline-none cursor-pointer" style={{ background: '#131127' }}>
          <option value="kills" className="bg-[#131127]">SORT: KILLS</option>
          <option value="name" className="bg-[#131127]">SORT: NAME</option>
          <option value="team" className="bg-[#131127]">SORT: TEAM</option>
        </select>
      </div>

      {/* CONTENT */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Users className="w-12 h-12 text-white/10" />
          <span className="font-orbitron text-[11px] font-bold tracking-widest text-white/30">NO PLAYERS YET</span>
          <span className="text-[10px] text-white/20">Add players from the SETUP tab or use the ADD PLAYER button</span>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-3">
          {filtered.map(p => (
            <PlayerCard key={p.id} player={p} team={teamMap[p.team_id]} onEdit={() => setEditPlayer(p)} onEliminate={async () => {
              try {
                if (p.is_alive) { await overlayApi.eliminatePlayer({ player_id: p.id }); toast.success(`${p.name} eliminated`); }
                else { await overlayApi.revivePlayer({ player_id: p.id }); toast.success(`${p.name} revived`); }
                refresh?.();
              } catch (e) { toast.error(e.message); }
            }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groupedByTeam.map(({ team, players: tPlayers }) => (
            <div key={team.id || '_unassigned'} className="rounded-lg border border-white/5 overflow-hidden" style={{ background: '#131127' }}>
              <button
                onClick={() => setExpandedTeam(expandedTeam === (team.id || '_unassigned') ? null : (team.id || '_unassigned'))}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedTeam === (team.id || '_unassigned') ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  <span className="font-orbitron text-[10px] font-black tracking-widest text-white">{team.name || 'UNASSIGNED'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-orbitron font-bold text-white/40">{tPlayers.length}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-orbitron font-bold">
                  <span className="text-blue-400">{tPlayers.reduce((s, p) => s + (p.total_tournament_kills || 0), 0)} KILLS</span>
                  <span className="text-green-400">{tPlayers.filter(p => p.is_alive).length} ALIVE</span>
                </div>
              </button>
              {expandedTeam === (team.id || '_unassigned') && (
                <div className="border-t border-white/5">
                  {tPlayers.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-6 py-2 border-b border-white/5 hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-orbitron text-[10px] font-bold" style={{ background: p.is_alive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: p.is_alive ? '#22c55e' : '#ef4444' }}>
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-white flex-1">{p.name}</span>
                      <span className="text-[10px] text-white/40">{p.current_match_kills || 0} match kills</span>
                      <span className="text-[10px] text-blue-400 font-orbitron font-bold">{p.total_tournament_kills || 0} total</span>
                      <span className={`w-2 h-2 rounded-full ${p.is_alive ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD PLAYER MODAL */}
      {showAdd && (
        <PlayerFormModal
          teams={teams}
          onClose={() => setShowAdd(false)}
          onSave={async (formData) => {
            try {
              await overlayApi.addPlayer(formData);
              toast.success('Player added successfully');
              setShowAdd(false);
              refresh?.();
            } catch (e) { toast.error(e.message); }
          }}
        />
      )}

      {/* EDIT PLAYER MODAL */}
      {editPlayer && (
        <PlayerDetailModal
          player={editPlayer}
          team={teamMap[editPlayer.team_id]}
          onClose={() => setEditPlayer(null)}
          onSave={async (formData) => {
            try {
              await overlayApi.updatePlayer({ player_id: editPlayer.id, ...formData });
              toast.success('Player updated');
              setEditPlayer(null);
              refresh?.();
            } catch (e) { toast.error(e.message); }
          }}
          onDelete={async () => {
            if (!confirm(`Delete ${editPlayer.name}?`)) return;
            try {
              await overlayApi.updatePlayer({ player_id: editPlayer.id, is_deleted: true });
              toast.success('Player deleted');
              setEditPlayer(null);
              refresh?.();
            } catch (e) { toast.error(e.message); }
          }}
        />
      )}
    </div>
  );
}

function PlayerCard({ player, team, onEdit, onEliminate }) {
  return (
    <div className="group rounded-lg border border-white/5 p-3 transition-all hover:border-purple-500/30" style={{ background: '#131127' }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-orbitron text-sm font-bold flex-shrink-0" style={{
          background: player.is_alive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: player.is_alive ? '#22c55e' : '#ef4444',
          border: `2px solid ${player.is_alive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {(player.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{player.name}</p>
          {player.real_name && <p className="text-[10px] text-white/40 truncate">{player.real_name}</p>}
          <div className="flex items-center gap-1.5 mt-1">
            {team && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                {team.name}
              </span>
            )}
            <span className="font-orbitron text-[16px] font-bold text-blue-400" style={{ fontFamily: 'Teko, sans-serif' }}>
              {player.total_tournament_kills || 0}
            </span>
            <span className="text-[8px] font-orbitron text-white/30">KILLS</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-white/5 text-white/60 hover:bg-white/10 transition-all text-[9px] font-bold">
          <Edit2 className="w-2.5 h-2.5" /> EDIT
        </button>
        <button onClick={onEliminate} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded transition-all text-[9px] font-bold" style={{
          background: player.is_alive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          color: player.is_alive ? '#ef4444' : '#22c55e',
        }}>
          {player.is_alive ? <><Skull className="w-2.5 h-2.5" /> ELIM</> : <><Heart className="w-2.5 h-2.5" /> REVIVE</>}
        </button>
      </div>
    </div>
  );
}

function PlayerFormModal({ teams, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', real_name: '', team_id: teams[0]?.id || '', nationality: '', portrait_url: '' });
  return (
    <Modal onClose={onClose} title="ADD PLAYER">
      <div className="flex flex-col gap-3">
        <Field label="NICKNAME *">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="PlayerNICK" className="form-input" />
        </Field>
        <Field label="REAL NAME">
          <input value={form.real_name} onChange={e => setForm({...form, real_name: e.target.value})} placeholder="John Doe" className="form-input" />
        </Field>
        <Field label="TEAM">
          <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})} className="form-input">
            {teams.map(t => <option key={t.id} value={t.id} className="bg-[#131127]">{t.name}</option>)}
          </select>
        </Field>
        <Field label="NATIONALITY">
          <input value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} placeholder="Nepal" className="form-input" />
        </Field>
        <Field label="PORTRAIT URL">
          <input value={form.portrait_url} onChange={e => setForm({...form, portrait_url: e.target.value})} placeholder="https://..." className="form-input" />
        </Field>
        <button onClick={() => form.name && onSave(form)} disabled={!form.name} className="mt-2 px-4 py-2.5 rounded-lg font-orbitron text-[10px] font-black tracking-widest disabled:opacity-40" style={{ background: '#7C3AED', color: '#fff' }}>
          CREATE PLAYER
        </button>
      </div>
    </Modal>
  );
}

function PlayerDetailModal({ player, team, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    name: player.name || '', real_name: player.real_name || '', nationality: player.nationality || '',
    team_id: player.team_id || '', instagram: player.instagram || '', youtube: player.youtube || '', twitter: player.twitter || '',
  });
  return (
    <Modal onClose={onClose} title="PLAYER DETAILS">
      <div className="flex flex-col gap-4">
        {/* Portrait + Name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-orbitron text-xl font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '2px solid rgba(124,58,237,0.3)' }}>
            {(player.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-white">{player.name}</p>
            {team && <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>{team.name}</span>}
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${player.is_alive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-white/40">{player.is_alive ? 'ALIVE' : 'ELIMINATED'}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="TOURNAMENT KILLS" value={player.total_tournament_kills || 0} color="#3B82F6" />
          <StatBox label="MATCH KILLS" value={player.current_match_kills || 0} color="#7C3AED" />
          <StatBox label="STATUS" value={player.is_alive ? 'ALIVE' : 'OUT'} color={player.is_alive ? '#22c55e' : '#ef4444'} />
        </div>

        {/* Editable Fields */}
        <div className="flex flex-col gap-3">
          <Field label="NICKNAME"><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" /></Field>
          <Field label="REAL NAME"><input value={form.real_name} onChange={e => setForm({...form, real_name: e.target.value})} className="form-input" /></Field>
          <Field label="NATIONALITY"><input value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} className="form-input" /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="INSTAGRAM"><input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="@handle" className="form-input" /></Field>
            <Field label="YOUTUBE"><input value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} placeholder="@channel" className="form-input" /></Field>
            <Field label="TWITTER/X"><input value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})} placeholder="@handle" className="form-input" /></Field>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 px-4 py-2.5 rounded-lg font-orbitron text-[10px] font-black tracking-widest" style={{ background: '#7C3AED', color: '#fff' }}>SAVE CHANGES</button>
          <button onClick={onDelete} className="px-4 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-orbitron text-[10px] font-black tracking-widest hover:bg-red-500/25">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-lg border border-white/5 p-2.5 text-center" style={{ background: '#0F1127' }}>
      <p className="font-orbitron text-[7px] font-black tracking-widest text-white/40 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color, fontFamily: 'Teko, sans-serif' }}>{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-orbitron text-[8px] font-black tracking-widest text-white/40">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl border border-white/10 p-5" style={{ background: '#131127' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-orbitron text-[10px] font-black tracking-widest text-white">{title}</span>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
