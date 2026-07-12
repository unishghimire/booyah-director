/**
 * TeamRoster — Add teams with logo upload + manage players
 * Each team gets a logo upload slot (ImgBB CDN).
 * Logo shows in the team row and in all overlay screens live.
 */
import React, { useState } from 'react';
import { ChevronDown, Users, Skull, Plus, Zap, Image as ImageIcon, Trash2 } from 'lucide-react';
import { overlayApi } from '@/lib/overlayApi';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';

/* ── Single team row ────────────────────────────────────────── */
function TeamRow({ team, players, onAction }) {
  const [expanded, setExpanded]   = useState(false);
  const [showLogo, setShowLogo]   = useState(false);
  const [logoUrl, setLogoUrl]     = useState(team.logo_url || '');
  const [savingLogo, setSavingLogo] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const teamPlayers = players.filter(p => p.team_id === team.id);
  const alive       = teamPlayers.filter(p => p.is_alive).length;

  const saveLogo = async (url) => {
    setLogoUrl(url);
    setSavingLogo(true);
    try {
      await overlayApi.updateTeamLogo({ team_id: team.id, logo_url: url });
      toast.success('Logo updated on overlay!');
      onAction?.();
    } catch (e) {
      toast.error('Logo save failed: ' + e.message);
    } finally {
      setSavingLogo(false);
    }
  };

  const deleteTeam = async () => {
    if (!window.confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await overlayApi.deleteTeam({ team_id: team.id });
      toast.success(`${team.name} deleted`);
      onAction?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Logo thumbnail */}
        <div
          className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/50 hover:border-orange-500/40 transition-all"
          onClick={() => setShowLogo(!showLogo)}
          title="Click to change team logo"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={team.name} className="h-full w-full object-contain"
              onError={e => { e.target.style.display='none'; }} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-3.5 w-3.5 text-gray-600" />
            </div>
          )}
          {/* Camera overlay hint */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
            <ImageIcon className="h-3 w-3 text-orange-400" />
          </div>
        </div>

        {/* Name + expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          <span className="text-sm font-semibold text-white">{team.name}</span>
        </button>

        {/* Stats */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 rounded-md bg-orange-500/20 px-2 py-0.5 font-orbitron text-[10px] font-black text-orange-400">
            <Zap className="h-3 w-3" />{team.total_tournament_points || 0}
          </span>
          <span className="flex items-center gap-1 font-orbitron text-[10px] text-gray-500">
            <Skull className="h-3 w-3" />{team.total_tournament_kills || 0}
          </span>
          <span className={`font-orbitron text-[10px] ${alive > 0 ? 'text-green-400' : 'text-gray-600'}`}>
            {alive}/{teamPlayers.length || 0} ↑
          </span>
          <button
            onClick={deleteTeam}
            disabled={deleting}
            className="rounded p-1 text-gray-700 hover:text-red-400 transition-colors disabled:opacity-40"
            title="Delete team"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Logo upload panel */}
      {showLogo && (
        <div className="border-t border-white/5 bg-black/20 p-3">
          <ImageUpload
            value={logoUrl}
            onChange={(url) => saveLogo(url)}
            label="TEAM LOGO"
            name={`logo-${team.name.replace(/\s+/g,'-').toLowerCase()}`}
          />
          {savingLogo && (
            <p className="mt-1 font-orbitron text-[9px] text-orange-400 tracking-wider">SAVING TO OVERLAY...</p>
          )}
          <button
            onClick={() => setShowLogo(false)}
            className="mt-2 font-orbitron text-[9px] text-gray-600 hover:text-gray-400 tracking-wider"
          >
            CLOSE ▲
          </button>
        </div>
      )}

      {/* Player list */}
      {expanded && (
        <div className="border-t border-white/5 px-3 py-2">
          {teamPlayers.length === 0 && (
            <p className="py-1 font-orbitron text-[10px] text-gray-600">No players registered</p>
          )}
          {teamPlayers.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-xs text-gray-300">{p.name}</span>
              <span className={`h-2 w-2 rounded-full ${p.is_alive ? 'bg-green-500' : 'bg-red-500/50'}`} title={p.is_alive ? 'Alive' : 'Eliminated'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function TeamRoster({ tournament, teams, players, onAction }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [teamName, setTeamName]     = useState('');
  const [logoUrl, setLogoUrl]       = useState('');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTeamName('');
    setLogoUrl('');
    setPlayerNames(['', '', '', '']);
    setShowAdd(false);
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) { toast.error('Team name is required'); return; }
    setSubmitting(true);
    try {
      await overlayApi.addTeam({
        tournament_id: tournament?.id,
        team_name:     teamName.trim(),
        logo_url:      logoUrl || '',
        player_names:  playerNames.map(n => n.trim()).filter(Boolean),
      });
      toast.success(`✅ ${teamName} added to tournament!`);
      reset();
      onAction?.();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Add team toggle */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex w-full items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-black text-orange-400 hover:bg-orange-500/20 transition-all font-orbitron tracking-wider"
      >
        <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> ADD TEAM</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showAdd ? 'rotate-180' : ''}`} />
      </button>

      {/* Add team form */}
      {showAdd && (
        <form onSubmit={handleAddTeam} className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
          {/* Team name */}
          <div>
            <label className="mb-1.5 block font-orbitron text-[10px] font-black text-gray-400 tracking-wider">TEAM NAME *</label>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value.substring(0, 40))}
              placeholder="e.g. GLORY ESPORTS"
              maxLength={40}
              required
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 font-orbitron tracking-wide"
            />
          </div>

          {/* Team logo upload */}
          <ImageUpload
            value={logoUrl}
            onChange={(url) => setLogoUrl(url)}
            label="TEAM LOGO (shows in all overlays)"
            name={`team-${teamName.replace(/\s+/g,'-').toLowerCase() || 'logo'}`}
          />

          {/* Players */}
          <div>
            <label className="mb-1.5 block font-orbitron text-[10px] font-black text-gray-400 tracking-wider">PLAYERS (up to 4)</label>
            <div className="space-y-1.5">
              {playerNames.map((pn, i) => (
                <input
                  key={i}
                  value={pn}
                  onChange={e => {
                    const next = [...playerNames];
                    next[i] = e.target.value.substring(0, 30);
                    setPlayerNames(next);
                  }}
                  placeholder={`Player ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                  maxLength={30}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/60"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-lg border border-white/10 py-2 font-orbitron text-[11px] font-black text-gray-500 hover:text-white transition-colors tracking-wider"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting || !teamName.trim()}
              className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 py-2 font-orbitron text-[11px] font-black text-black tracking-wider hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {submitting ? 'ADDING...' : 'ADD TEAM'}
            </button>
          </div>
        </form>
      )}

      {/* Roster header */}
      <div className="flex items-center gap-2 text-gray-500">
        <Users className="h-3.5 w-3.5" />
        <span className="font-orbitron text-[10px] font-black uppercase tracking-widest">
          ROSTER — {teams.length} TEAM{teams.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Team list */}
      <div className="space-y-2">
        {teams.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-gray-700" />
            <p className="font-orbitron text-[10px] text-gray-600 tracking-wider">NO TEAMS YET</p>
            <p className="mt-1 text-xs text-gray-700">Click ADD TEAM above to register your first team</p>
          </div>
        )}
        {teams.map(team => (
          <TeamRow key={team.id} team={team} players={players} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
