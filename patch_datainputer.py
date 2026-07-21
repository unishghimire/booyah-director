import sys

filepath = 'netlify-app/src/pages/DataInputer.jsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Add import
old_import = "import { useOverlayData, overlayApi } from '@/lib/overlayApi';"
new_import = """import { useOverlayData, overlayApi } from '@/lib/overlayApi';
import { useObsStore } from '@/lib/obsStore';"""

if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("Import added.")
else:
    print("WARNING: old import not found!")

# 2. Add stagedData state, hasStagedChanges, and push/discard handlers
old_state_marker = """  // General busy state

  const state = data?.overlayState || {};"""

new_state_replacement = """  // General busy state

  // Staged vs Live data architecture
  const [stagedData, setStagedData] = useState({
    kills: {},      // { playerId: stagedKillCount }
    placements: {}, // { teamId: stagedPlacement }
    eliminations: [], // array of { playerId, timestamp }
  });
  const [pushingLive, setPushingLive] = useState(false);

  const hasStagedChanges = useMemo(() => {
    const hasKillDiff = players.some(p => {
      const stagedKill = stagedData.kills[p.id];
      return stagedKill !== undefined && stagedKill !== (p.current_match_kills || 0);
    });
    const hasPlacementDiff = Object.keys(stagedData.placements).length > 0;
    const hasEliminationDiff = stagedData.eliminations.length > 0;
    return hasKillDiff || hasPlacementDiff || hasEliminationDiff;
  }, [stagedData, players]);

  const handleDiscardChanges = () => {
    setStagedData({
      kills: {},
      placements: {},
      eliminations: [],
    });
    toast('Staged changes discarded', { icon: '🗑️' });
  };

  const handlePushToLive = async () => {
    if (!currentMatch?.id) return toast.error('No active match');
    setPushingLive(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      // 1. Push staged kills
      for (const p of players) {
        const liveKills = p.current_match_kills || 0;
        const stagedKills = stagedData.kills[p.id] !== undefined ? stagedData.kills[p.id] : liveKills;
        if (stagedKills > liveKills) {
          const diff = stagedKills - liveKills;
          const team = teams.find(t => t.id === p.team_id);
          for (let i = 0; i < diff; i++) {
            try {
              await overlayApi.addKill({
                killer_player_id: p.id,
                match_id: currentMatch.id,
                tournament_id: currentMatch.tournament_id || '',
                killer_name: p.name,
                killer_team_name: team?.name || '',
                killed_player_name: '',
                killed_team_name: '',
              });
              successCount++;
            } catch (err) {
              console.error(err);
              errorCount++;
            }
          }
        }
      }

      // 2. Push staged eliminations
      for (const elimItem of stagedData.eliminations) {
        const p = players.find(x => x.id === elimItem.playerId);
        if (p && p.is_alive) {
          const team = teams.find(t => t.id === p.team_id);
          try {
            await overlayApi.eliminatePlayer({
              player_id:   p.id,
              match_id:    currentMatch.id,
              player_name: p.name,
              team_name:   team?.name || '',
              tournament_id: currentMatch.tournament_id || '',
            });
            successCount++;
          } catch (err) {
            console.error(err);
            errorCount++;
          }
        }
      }

      // 3. Push staged placements
      for (const teamId of Object.keys(stagedData.placements)) {
        const placementVal = stagedData.placements[teamId];
        if (placementVal) {
          try {
            await overlayApi.setTeamPlacement({
              team_id: teamId,
              match_id: currentMatch.id,
              placement: Number(placementVal),
              tournament_id: tournament?.id,
            });
            successCount++;
          } catch (err) {
            console.error(err);
            errorCount++;
          }
        }
      }

      if (errorCount > 0) {
        toast.error(`Pushed changes: ${successCount} succeeded, ${errorCount} failed.`);
      } else if (successCount > 0) {
        toast.success(`Successfully pushed ${successCount} changes to live!`);
      }

      // Reset staged data after successful push
      setStagedData({
        kills: {},
        placements: {},
        eliminations: [],
      });
      refresh();
    } catch (err) {
      toast.error(err.message || 'Error pushing to live');
    } finally {
      setPushingLive(false);
    }
  };

  const state = data?.overlayState || {};"""

if old_state_marker in content:
    content = content.replace(old_state_marker, new_state_replacement, 1)
    print("State variables and handlers added.")
else:
    print("WARNING: old state marker not found!")

# 3. Add visual indicator badge to live tab
old_tab_button = """            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-6 font-orbitron text-[11px] font-black tracking-[0.15em] transition-all relative border-r border-white/5"
              style={
                isActive
                  ? {
                      color: '#3B82F6',
                      background: 'rgba(59,130,246,0.05)',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
              )}
            </button>"""

new_tab_button = """            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-6 font-orbitron text-[11px] font-black tracking-[0.15em] transition-all relative border-r border-white/5"
              style={
                isActive
                  ? {
                      color: '#3B82F6',
                      background: 'rgba(59,130,246,0.05)',
                    }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex items-center gap-1.5">
                {t.label}
                {t.id === 'live' && hasStagedChanges && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Staged changes pending" />
                )}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
              )}
            </button>"""

if old_tab_button in content:
    content = content.replace(old_tab_button, new_tab_button, 1)
    print("Visual indicator badge added to tab button.")
else:
    print("WARNING: old tab button not found!")

# 4. Insert Staged Data action bar
old_search_bar = """            {/* LIVE INPUT TAB */}
            {activeTab === 'live' && (
              <SectionBoundary label="LIVE INPUT">
              <div className="space-y-6">
                {/* Search bar */}"""

new_search_bar = """            {/* LIVE INPUT TAB */}
            {activeTab === 'live' && (
              <SectionBoundary label="LIVE INPUT">
              <div className="space-y-6">
                {/* Staged Data Action Bar */}
                {hasStagedChanges && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      <div>
                        <h4 className="font-orbitron text-xs font-black text-amber-500 uppercase tracking-wider">
                          Staged Changes Pending
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          You have modified player kills, eliminations, or placements. Push to make them live.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDiscardChanges}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-orbitron text-[10px] font-black text-gray-300 hover:bg-white/10 transition-all"
                      >
                        DISCARD
                      </button>
                      <button
                        onClick={handlePushToLive}
                        disabled={pushingLive}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 font-orbitron text-[10px] font-black text-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                      >
                        {pushingLive ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          'PUSH TO LIVE'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Search bar */}"""

if old_search_bar in content:
    content = content.replace(old_search_bar, new_search_bar, 1)
    print("Staged action banner inserted.")
else:
    print("WARNING: old search bar not found!")

# 5. TeamInputCard Instantiation
old_team_card_inst = """                      <TeamInputCard
                        key={team.id}
                        team={team}
                        players={teamPlayers}
                        aliveCount={aliveCount}
                        teamColor={teamColor}
                        currentMatch={currentMatch}
                        tournament={tournament}
                        onAction={refresh}
                      />"""

new_team_card_inst = """                      <TeamInputCard
                        key={team.id}
                        team={team}
                        players={teamPlayers}
                        aliveCount={aliveCount}
                        teamColor={teamColor}
                        currentMatch={currentMatch}
                        tournament={tournament}
                        onAction={refresh}
                        stagedData={stagedData}
                        setStagedData={setStagedData}
                      />"""

if old_team_card_inst in content:
    content = content.replace(old_team_card_inst, new_team_card_inst, 1)
    print("TeamInputCard instantiation updated with staged props.")
else:
    print("WARNING: old team card instantiation not found!")

# 6. Elimination Log tab pending list
old_elim_log_marker = """                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {eliminations.length === 0 ? (
                      <p className="text-center text-[11px] text-gray-600 py-6">
                        No eliminations logged in this match yet
                      </p>
                    ) : (
                      safeArray(eliminations).map((e, idx) => ("""

new_elim_log_replacement = """                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {stagedData.eliminations.length === 0 && eliminations.length === 0 ? (
                      <p className="text-center text-[11px] text-gray-600 py-6">
                        No eliminations logged in this match yet
                      </p>
                    ) : (
                      <>
                        {/* Staged Eliminations */}
                        {stagedData.eliminations.map((se) => {
                          const player = players.find(p => p.id === se.playerId);
                          if (!player) return null;
                          return (
                            <div
                              key={`staged-${se.playerId}`}
                              className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg text-xs animate-pulse"
                            >
                              <div className="flex items-center gap-2">
                                <Skull className="h-3.5 w-3.5 text-amber-500" />
                                <span className="font-orbitron font-bold text-white">
                                  {player.name}
                                </span>
                                <span className="text-gray-600 font-bold">//</span>
                                <span className="font-orbitron text-[10px] font-black text-amber-500">
                                  PENDING ELIMINATION
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-amber-500 font-bold">
                                PENDING
                              </span>
                            </div>
                          );
                        })}

                        {/* Live Eliminations */}
                        {safeArray(eliminations).map((e, idx) => ("""

# Replace from the end of maps:
# We need to make sure we also add the closing tag of the fragment and the fallback condition.
# Wait, let's find the closing tag.
old_elim_log_end = """                          <span className="text-[9px] font-mono text-gray-600">
                            {new Date(e.timestamp || e.created_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>"""

new_elim_log_end = """                          <span className="text-[9px] font-mono text-gray-600">
                            {new Date(e.timestamp || e.created_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      </>
                    )}
                  </div>"""

if old_elim_log_marker in content and old_elim_log_end in content:
    content = content.replace(old_elim_log_marker, new_elim_log_replacement, 1)
    content = content.replace(old_elim_log_end, new_elim_log_end, 1)
    print("Elimination log tab updated to support staged eliminations.")
else:
    print("WARNING: old elimination log marker or end not found!")

# 7. TeamInputCard Component definition and body
old_team_card_def = """function TeamInputCard({
  team,
  players,
  aliveCount,
  teamColor,
  currentMatch,
  tournament,
  onAction,
}) {
  const [placement, setPlacement] = useState('');
  const [busy, setBusy] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSetPlacement = async () => {
    if (!placement) return toast.error('Select placement rank');
    if (!currentMatch?.id) return toast.error('Start a match first');
    setBusy(true);
    try {
      const r = await overlayApi.setTeamPlacement({
        team_id: team.id,
        match_id: currentMatch.id,
        placement: Number(placement),
        tournament_id: tournament?.id,
      });
      toast.success(
        `${team.name}: Placement #${placement} (+${r.placement_points || 0} pts)`
      );
      setPlacement('');
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error setting placement');
    } finally {
      setBusy(false);
    }
  };"""

new_team_card_def = """function TeamInputCard({
  team,
  players,
  aliveCount,
  teamColor,
  currentMatch,
  tournament,
  onAction,
  stagedData,
  setStagedData,
}) {
  const [busy, setBusy] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const stagedPlacement = stagedData.placements[team.id] || '';
  const isStagedPlacementDiff = stagedPlacement !== '';

  const handleSelectPlacement = (val) => {
    setStagedData(prev => {
      const nextPlacements = { ...prev.placements };
      if (!val) {
        delete nextPlacements[team.id];
      } else {
        nextPlacements[team.id] = Number(val);
      }
      return { ...prev, placements: nextPlacements };
    });
  };"""

if old_team_card_def in content:
    content = content.replace(old_team_card_def, new_team_card_def, 1)
    print("TeamInputCard definition updated.")
else:
    print("WARNING: TeamInputCard definition not found!")

# 8. TeamInputCard: player input instantiation pass staged props
old_player_card_inst = """          safeArray(players).map((p) => (
            <PlayerInputCard
              key={p.id}
              player={p}
              team={team}
              teamColor={teamColor}
              currentMatch={currentMatch}
              onAction={onAction}
            />
          ))"""

new_player_card_inst = """          safeArray(players).map((p) => (
            <PlayerInputCard
              key={p.id}
              player={p}
              team={team}
              teamColor={teamColor}
              currentMatch={currentMatch}
              onAction={onAction}
              stagedData={stagedData}
              setStagedData={setStagedData}
            />
          ))"""

if old_player_card_inst in content:
    content = content.replace(old_player_card_inst, new_player_card_inst, 1)
    print("PlayerInputCard instantiation within TeamInputCard updated.")
else:
    print("WARNING: PlayerInputCard instantiation not found!")

# 9. TeamInputCard placement row replacement
old_placement_row = """      {/* Placement row (bottom) */}
      <div className="flex items-center gap-2 border-t border-white/[0.04] bg-black/20 px-3 py-2">
        <Shield className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
        <span className="text-[9px] font-orbitron font-black text-gray-500 flex-shrink-0">
          PLACEMENT
        </span>
        <select
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          className="flex-1 rounded border border-white/10 bg-[#13131f] px-2 py-1 text-[11px] font-semibold text-white outline-none focus:border-[#3B82F6]/40"
        >
          <option value="">— rank —</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              #{n}
            </option>
          ))}
        </select>
        <button
          onClick={handleSetPlacement}
          disabled={busy || !placement}
          className="rounded px-3 py-1 font-orbitron text-[10px] font-black text-black tracking-wider transition-all"
          style={{ background: teamColor }}
        >
          SET
        </button>
      </div>"""

new_placement_row = """      {/* Placement row (bottom) */}
      <div className="flex items-center gap-2 border-t border-white/[0.04] bg-black/20 px-3 py-2">
        <Shield className={`h-3.5 w-3.5 flex-shrink-0 ${isStagedPlacementDiff ? 'text-amber-500' : 'text-gray-500'}`} />
        <span className={`text-[9px] font-orbitron font-black flex-shrink-0 ${isStagedPlacementDiff ? 'text-amber-500' : 'text-gray-500'}`}>
          PLACEMENT {isStagedPlacementDiff && '(STAGED)'}
        </span>
        <select
          value={stagedPlacement}
          onChange={(e) => handleSelectPlacement(e.target.value)}
          className={`flex-1 rounded border px-2 py-1 text-[11px] font-semibold outline-none transition-all ${
            isStagedPlacementDiff
              ? 'border-amber-500/30 bg-amber-500/5 text-amber-400 focus:border-amber-500/50'
              : 'border-white/10 bg-[#13131f] text-white focus:border-[#3B82F6]/40'
          }`}
        >
          <option value="">— rank —</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              #{n}
            </option>
          ))}
        </select>
        {isStagedPlacementDiff && (
          <button
            onClick={() => handleSelectPlacement('')}
            className="rounded px-2 py-1 font-orbitron text-[9px] font-black border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            CLEAR
          </button>
        )}
      </div>"""

if old_placement_row in content:
    content = content.replace(old_placement_row, new_placement_row, 1)
    print("Placement row in TeamInputCard updated.")
else:
    print("WARNING: placement row in TeamInputCard not found!")

# 10. Replace PlayerInputCard completely
player_input_card_old = """function PlayerInputCard({ player, team, teamColor, currentMatch, onAction }) {
  const [busy, setBusy] = useState(null);
  const alive = player.is_alive;
  const kills = player.current_match_kills || 0;

  const handleKill = async () => {
    if (!currentMatch?.id) {
      return toast.error('Start a match first in Director Panel');
    }
    setBusy('kill');
    try {
      const r = await overlayApi.addKill({
        killer_player_id: player.id,
        match_id: currentMatch.id,
        tournament_id: currentMatch.tournament_id || '',
        killer_name: player.name,
        killer_team_name: team?.name || '',
        killed_player_name: '',
        killed_team_name: '',
      });
      toast.success(`+1 Kill for ${player.name}!`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error adding kill');
    } finally {
      setBusy(null);
    }
  };

  const handleEliminate = async () => {
    if (!currentMatch?.id) return toast.error('No active match');
    setBusy('elim');
    try {
      await overlayApi.eliminatePlayer({
        player_id:   player.id,
        match_id:    currentMatch.id,
        player_name: player.name,
        team_name:   team?.name || '',
        tournament_id: currentMatch.tournament_id || '',
      });
      toast(`Player "${player.name}" has been eliminated.`, { icon: '💀' });
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error eliminating player');
    } finally {
      setBusy(null);
    }
  };

  const handleRevive = async () => {
    setBusy('revive');
    try {
      await overlayApi.revivePlayer({ player_id: player.id });
      toast.success(`Player "${player.name}" revived!`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error reviving player');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="rounded-lg border p-2.5 transition-all flex flex-col justify-between"
      style={{
        borderColor: alive ? 'rgba(255, 255, 255, 0.06)' : 'rgba(239, 68, 68, 0.1)',
        background: alive ? 'rgba(255, 255, 255, 0.02)' : 'rgba(239, 68, 68, 0.02)',
        opacity: alive ? 1 : 0.6,
      }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {alive ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BC043] flex-shrink-0" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
          )}
          <span
            className={`font-orbitron text-[10px] font-black truncate ${
              alive ? 'text-white' : 'text-gray-500 line-through'
            }`}
          >
            {player.name}
          </span>
        </div>
        <span className="rounded bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#7C3AED] tabular-nums">
          {kills} K
        </span>
      </div>

      {alive ? (
        <div className="flex gap-1">
          <button
            onClick={handleKill}
            disabled={busy !== null}
            className="flex-1 rounded py-1 font-orbitron text-[9px] font-black text-black hover:brightness-110 active:scale-95 transition-all"
            style={{ background: teamColor }}
          >
            {busy === 'kill' ? '...' : '+KILL'}
          </button>
          <button
            onClick={handleEliminate}
            disabled={busy !== null}
            className="rounded border border-red-500/30 hover:bg-red-500/10 px-2 py-1 font-orbitron text-[9px] font-black text-[#ef4444] active:scale-95 transition-all"
          >
            {busy === 'elim' ? '...' : 'ELIM'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleRevive}
          disabled={busy !== null}
          className="w-full rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] py-1 font-orbitron text-[9px] font-black text-gray-400 active:scale-95 transition-all"
        >
          {busy === 'revive' ? '...' : 'REVIVE'}
        </button>
      )}
    </div>
  );
}"""

player_input_card_new = """function PlayerInputCard({ player, team, teamColor, currentMatch, onAction, stagedData, setStagedData }) {
  const [busy, setBusy] = useState(null);

  const liveKills = player.current_match_kills || 0;
  const stagedKills = stagedData.kills[player.id] !== undefined ? stagedData.kills[player.id] : liveKills;
  const isStagedKillDiff = stagedKills !== liveKills;

  const isPendingElim = stagedData.eliminations.some(e => e.playerId === player.id);
  const stagedAlive = player.is_alive && !isPendingElim;

  const handleEliminate = () => {
    setStagedData(prev => {
      if (prev.eliminations.some(e => e.playerId === player.id)) return prev;
      return {
        ...prev,
        eliminations: [...prev.eliminations, { playerId: player.id, timestamp: Date.now() }]
      };
    });
    toast(`Staged elimination for ${player.name}`, { icon: '💀' });
  };

  const handleRevive = async () => {
    setBusy('revive');
    try {
      await overlayApi.revivePlayer({ player_id: player.id });
      toast.success(`Player "${player.name}" revived!`);
      onAction();
    } catch (err) {
      toast.error(err.message || 'Error reviving player');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="rounded-lg border p-2.5 transition-all flex flex-col justify-between"
      style={{
        borderColor: stagedAlive ? 'rgba(255, 255, 255, 0.06)' : 'rgba(239, 68, 68, 0.1)',
        background: stagedAlive ? 'rgba(255, 255, 255, 0.02)' : 'rgba(239, 68, 68, 0.02)',
        opacity: stagedAlive ? 1 : 0.6,
      }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {stagedAlive ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BC043] flex-shrink-0" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
          )}
          <span
            className={`font-orbitron text-[10px] font-black truncate ${
              stagedAlive ? 'text-white' : 'text-gray-500 line-through'
            }`}
          >
            {player.name}
          </span>
        </div>
        <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums border transition-all ${
          isStagedKillDiff
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-[#7C3AED]/10 border-[#7C3AED]/20 text-[#7C3AED]'
        }`}>
          {stagedKills} K {isStagedKillDiff && <span className="text-[8px] text-amber-500 font-normal">({liveKills})</span>}
        </span>
      </div>

      {stagedAlive ? (
        <div className="flex gap-1">
          {/* Kill Stepper */}
          <div className="flex-1 flex items-center bg-black/20 rounded border border-white/5 overflow-hidden">
            <button
              onClick={() => {
                if (stagedKills > 0) {
                  setStagedData(prev => {
                    const nextKills = stagedKills - 1;
                    const newKills = { ...prev.kills };
                    if (nextKills === liveKills) {
                      delete newKills[player.id];
                    } else {
                      newKills[player.id] = nextKills;
                    }
                    return { ...prev, kills: newKills };
                  });
                }
              }}
              disabled={stagedKills <= 0}
              className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all font-bold text-xs"
            >
              -
            </button>
            <span className={`flex-1 text-center font-orbitron text-[10px] font-black ${isStagedKillDiff ? 'text-amber-400' : 'text-white'}`}>
              {stagedKills}
            </span>
            <button
              onClick={() => {
                setStagedData(prev => {
                  const nextKills = stagedKills + 1;
                  const newKills = { ...prev.kills };
                  if (nextKills === liveKills) {
                    delete newKills[player.id];
                  } else {
                    newKills[player.id] = nextKills;
                  }
                  return { ...prev, kills: newKills };
                });
              }}
              className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all font-bold text-xs"
            >
              +
            </button>
          </div>
          <button
            onClick={handleEliminate}
            className="rounded border border-red-500/30 hover:bg-red-500/10 px-2 py-1 font-orbitron text-[9px] font-black text-[#ef4444] active:scale-95 transition-all"
          >
            ELIM
          </button>
        </div>
      ) : (
        <div className="w-full">
          {isPendingElim ? (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between text-[9px] text-amber-500 font-orbitron font-bold px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded">
                <span>💀 PENDING ELIM</span>
                <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <button
                onClick={() => {
                  setStagedData(prev => ({
                    ...prev,
                    eliminations: prev.eliminations.filter(e => e.playerId !== player.id)
                  }));
                  toast(`Cancelled staged elimination for ${player.name}`);
                }}
                className="w-full rounded border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 py-1 font-orbitron text-[9px] font-black text-amber-400 active:scale-95 transition-all"
              >
                UNDO ELIM
              </button>
            </div>
          ) : (
            <button
              onClick={handleRevive}
              disabled={busy !== null}
              className="w-full rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] py-1 font-orbitron text-[9px] font-black text-gray-400 active:scale-95 transition-all"
            >
              {busy === 'revive' ? '...' : 'REVIVE'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}"""

# Normalise whitespaces just in case to be sure it matches
# Wait, standard replace works if the strings are identical in file. Let's try direct replace.
if player_input_card_old in content:
    content = content.replace(player_input_card_old, player_input_card_new, 1)
    print("PlayerInputCard completely updated.")
else:
    # Let's try replacing line by line or a broader match
    print("WARNING: PlayerInputCard old structure not found!")

# Write file back
with open(filepath, 'w') as f:
    f.write(content)
print("Write back complete.")
