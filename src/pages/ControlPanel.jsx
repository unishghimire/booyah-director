import { useState, useEffect, useCallback } from "react";

const API_BASE = "/functions";

const call = (fn, body) =>
  fetch(`${API_BASE}/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const getData = () =>
  fetch(`${API_BASE}/getOverlayData`).then((r) => r.json());

const SCREENS = [
  { id: "setup_blank", label: "BLANK", icon: "🖥️" },
  { id: "pre_match_map", label: "MAP REVEAL", icon: "🗺️" },
  { id: "scoreboard", label: "SCOREBOARD", icon: "📊" },
  { id: "kill_feed", label: "KILL FEED", icon: "💀" },
  { id: "elimination_alert", label: "ELIM ALERT", icon: "⚡" },
  { id: "mvp", label: "MVP SCREEN", icon: "⭐" },
  { id: "champions", label: "CHAMPIONS", icon: "🏆" },
];

const MAPS = ["Bermuda", "Kalahari", "Purgatory", "Alpine", "Nexterra"];

const DEFAULT_PLACEMENT = { 1:15,2:12,3:10,4:8,5:6,6:4,7:2,8:1,9:1,10:1,11:1,12:1 };

export default function ControlPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [overlayState, setOverlayState] = useState({ current_screen: "setup_blank" });
  const [killFeed, setKillFeed] = useState([]);
  const [standings, setStandings] = useState([]);

  // Setup form
  const [tName, setTName] = useState("");
  const [tMatches, setTMatches] = useState(6);
  const [tKillPts, setTKillPts] = useState(1);
  const [placementPts, setPlacementPts] = useState(DEFAULT_PLACEMENT);
  const [showPlacementConfig, setShowPlacementConfig] = useState(false);

  // Team form
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [placements, setPlacements] = useState({});
  const [mapName, setMapName] = useState("Bermuda");
  const [mvpData, setMvpData] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const withLoading = async (key, fn) => {
    setActionLoading((p) => ({ ...p, [key]: true }));
    try { await fn(); } catch (e) { showToast(e.message, "error"); }
    finally { setActionLoading((p) => ({ ...p, [key]: false })); }
  };

  const refresh = useCallback(async () => {
    try {
      const d = await getData();
      setData(d);
      if (d.tournament) setTournament(d.tournament);
      if (d.teams) setTeams(d.teams);
      if (d.players) setPlayers(d.players);
      if (d.current_match) setCurrentMatch(d.current_match);
      if (d.overlay_state) setOverlayState(d.overlay_state);
      if (d.kill_feed) setKillFeed(d.kill_feed);
      if (d.standings) setStandings(d.standings);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 500);
    return () => clearInterval(iv);
  }, [refresh]);

  const createTournament = async () => {
    if (!tName) return showToast("Enter tournament name", "error");
    await withLoading("create_t", async () => {
      const r = await call("initializeTournament", {
        name: tName, total_matches: tMatches,
        points_per_kill: tKillPts, placement_points_config: placementPts
      });
      if (r.error) throw new Error(r.error);
      showToast(`Tournament "${tName}" created!`);
      refresh();
    });
  };

  const addTeam = async () => {
    if (!teamName || !tournament) return showToast("Enter team name", "error");
    await withLoading("add_team", async () => {
      const r = await call("addTeam", {
        tournament_id: tournament.id, team_name: teamName,
        player_names: playerNames.filter(Boolean)
      });
      if (r.error) throw new Error(r.error);
      showToast(`Team "${teamName}" added!`);
      setTeamName(""); setPlayerNames(["", "", "", ""]);
      refresh();
    });
  };

  const startMatch = async () => {
    if (!tournament) return showToast("No tournament", "error");
    await withLoading("start_match", async () => {
      const r = await call("startNextMatch", { tournament_id: tournament.id, map_name: mapName });
      if (r.error) throw new Error(r.error);
      showToast(`Match ${r.match_number} started — ${mapName}`);
      refresh();
    });
  };

  const updateState = async (state) => {
    if (!currentMatch) return showToast("No active match", "error");
    await withLoading(`state_${state}`, async () => {
      const r = await call("updateMatchState", { match_id: currentMatch.id, state });
      if (r.error) throw new Error(r.error);
      showToast(`Match → ${state.replace("_", " ").toUpperCase()}`);
      refresh();
    });
  };

  const switchScreen = async (screen) => {
    await withLoading(`screen_${screen}`, async () => {
      const r = await call("switchOverlayScreen", { screen });
      if (r.error) throw new Error(r.error);
      refresh();
    });
  };

  const addKill = async (playerId, playerName, teamName) => {
    if (!currentMatch) return showToast("No active match", "error");
    await withLoading(`kill_${playerId}`, async () => {
      const r = await call("addKill", {
        player_id: playerId, match_id: currentMatch.id,
        killed_player_name: "Unknown", killed_team_name: "Unknown"
      });
      if (r.error) throw new Error(r.error);
      showToast(`+1 Kill — ${playerName}`);
      refresh();
    });
  };

  const elimPlayer = async (playerId, playerName) => {
    if (!currentMatch) return showToast("No active match", "error");
    await withLoading(`elim_${playerId}`, async () => {
      const r = await call("eliminatePlayer", { player_id: playerId, match_id: currentMatch.id });
      if (r.error) throw new Error(r.error);
      showToast(`${playerName} eliminated ☠️`, "warn");
      refresh();
    });
  };

  const setPlacement = async (teamId) => {
    if (!currentMatch || !placements[teamId]) return showToast("Select a placement", "error");
    await withLoading(`place_${teamId}`, async () => {
      const r = await call("setTeamPlacement", {
        team_id: teamId, match_id: currentMatch.id,
        placement: parseInt(placements[teamId]), tournament_id: tournament?.id
      });
      if (r.error) throw new Error(r.error);
      showToast(`Placement #${placements[teamId]} set`);
      refresh();
    });
  };

  const calcMVP = async () => {
    if (!currentMatch) return showToast("No active match", "error");
    const r = await call("calculateMVP", { match_id: currentMatch.id });
    if (r.error) return showToast(r.error, "error");
    setMvpData(r.mvp);
    if (!r.mvp) showToast("No kills recorded yet", "warn");
  };

  const showMVP = async () => {
    if (!mvpData) return showToast("Calculate MVP first", "error");
    await withLoading("show_mvp", async () => {
      const r = await call("setMVPAndShowScreen", {
        match_id: currentMatch?.id, player_id: mvpData.player_id,
        player_name: mvpData.name, team_name: mvpData.team, kills: mvpData.kills
      });
      if (r.error) throw new Error(r.error);
      showToast(`MVP: ${mvpData.name} — ${mvpData.kills} kills 🌟`);
      refresh();
    });
  };

  const showChampions = async () => {
    if (!tournament || teams.length === 0) return showToast("No teams", "error");
    const top = [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0))[0];
    await withLoading("show_champ", async () => {
      const r = await call("setChampionAndShowScreen", {
        team_id: top.id, team_name: top.name,
        total_points: top.total_tournament_points, tournament_id: tournament.id
      });
      if (r.error) throw new Error(r.error);
      showToast(`🏆 Champions: ${top.name}!`);
      refresh();
    });
  };

  const getPlayersForTeam = (teamId) => players.filter((p) => p.team_id === teamId);

  const rankedTeams = [...teams].sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0));

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-orange-400 text-2xl font-bold animate-pulse">LOADING DIRECTOR...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono" style={{fontFamily:"'Rajdhani',monospace"}}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-bold text-sm shadow-lg transition-all ${
          toast.type === "error" ? "bg-red-600 text-white" :
          toast.type === "warn" ? "bg-yellow-500 text-black" : "bg-orange-500 text-black"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <header className="bg-[#0d0d18] border-b border-orange-500/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-orange-400 text-xl font-black tracking-widest">⚡ BOOYAH DIRECTOR</div>
          {tournament && (
            <span className="bg-orange-500/20 border border-orange-500/50 text-orange-300 px-3 py-1 rounded text-sm">
              {tournament.name}
            </span>
          )}
          {currentMatch && (
            <span className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-3 py-1 rounded text-sm">
              MATCH {currentMatch.match_number} • {currentMatch.map_name} • {currentMatch.state?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-green-400 text-xs">OVERLAY LIVE</span>
          <a href="/overlay" target="_blank" className="ml-4 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-3 py-1 rounded text-xs hover:bg-orange-500/40 transition">
            OPEN OVERLAY ↗
          </a>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 bg-[#0d0d18] border-r border-orange-500/20 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            {!tournament ? (
              <div>
                <div className="text-orange-400 font-bold text-sm mb-3 tracking-widest">CREATE TOURNAMENT</div>
                <input className="w-full bg-[#1a1a2e] border border-orange-500/30 rounded px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:border-orange-400" placeholder="Tournament Name" value={tName} onChange={e=>setTName(e.target.value)} />
                <div className="flex gap-2 mb-2">
                  <input type="number" className="w-1/2 bg-[#1a1a2e] border border-orange-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-400" placeholder="Matches" value={tMatches} onChange={e=>setTMatches(e.target.value)} />
                  <input type="number" className="w-1/2 bg-[#1a1a2e] border border-orange-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-400" placeholder="Kill Pts" value={tKillPts} onChange={e=>setTKillPts(e.target.value)} />
                </div>
                <button onClick={()=>setShowPlacementConfig(!showPlacementConfig)} className="text-orange-400/70 text-xs mb-2 underline">
                  {showPlacementConfig ? "▼" : "▶"} Placement Points Config
                </button>
                {showPlacementConfig && (
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {Array.from({length:12},(_,i)=>i+1).map(pos=>(
                      <div key={pos} className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs w-4">#{pos}</span>
                        <input type="number" className="w-full bg-[#1a1a2e] border border-orange-500/20 rounded px-1 py-1 text-white text-xs focus:outline-none" value={placementPts[pos]||0} onChange={e=>setPlacementPts(p=>({...p,[pos]:parseInt(e.target.value)||0}))} />
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={createTournament} disabled={actionLoading.create_t} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black py-2 rounded text-sm tracking-widest transition">
                  {actionLoading.create_t ? "CREATING..." : "CREATE TOURNAMENT"}
                </button>
              </div>
            ) : (
              <div>
                <div className="text-orange-400 font-bold text-sm mb-3 tracking-widest">ADD TEAM ({teams.length}/12)</div>
                <input className="w-full bg-[#1a1a2e] border border-orange-500/30 rounded px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:border-orange-400" placeholder="Team Name" value={teamName} onChange={e=>setTeamName(e.target.value)} />
                {playerNames.map((n,i)=>(
                  <input key={i} className="w-full bg-[#1a1a2e] border border-orange-500/20 rounded px-3 py-1 text-white text-sm mb-1 focus:outline-none focus:border-orange-400" placeholder={`Player ${i+1}`} value={n} onChange={e=>{const c=[...playerNames];c[i]=e.target.value;setPlayerNames(c)}} />
                ))}
                <button onClick={addTeam} disabled={actionLoading.add_team} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black py-2 rounded text-sm tracking-widest mt-2 transition">
                  {actionLoading.add_team ? "ADDING..." : "+ ADD TEAM"}
                </button>
              </div>
            )}

            {/* Team Roster */}
            {teams.length > 0 && (
              <div className="mt-4">
                <div className="text-orange-400 font-bold text-xs mb-2 tracking-widest border-t border-orange-500/20 pt-3">TEAM ROSTER</div>
                {rankedTeams.map((team, idx) => {
                  const teamPlayers = getPlayersForTeam(team.id);
                  const alive = teamPlayers.filter(p=>p.is_alive).length;
                  return (
                    <div key={team.id} className="mb-1 border border-orange-500/20 rounded overflow-hidden">
                      <button onClick={()=>setExpandedTeam(expandedTeam===team.id?null:team.id)} className="w-full flex items-center justify-between px-3 py-2 bg-[#1a1a2e] hover:bg-[#1f1f3a] transition text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500 text-xs font-bold">#{idx+1}</span>
                          <span className="text-white text-sm font-bold">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400 text-xs font-bold">{team.total_tournament_points||0}pts</span>
                          <span className="text-gray-400 text-xs">💀{team.total_tournament_kills||0}</span>
                        </div>
                      </button>
                      {expandedTeam===team.id && (
                        <div className="bg-[#111120] px-3 py-2">
                          <div className="text-xs text-gray-400 mb-1">Alive: {alive}/{teamPlayers.length}</div>
                          {teamPlayers.map(p=>(
                            <div key={p.id} className="flex items-center justify-between py-1 border-b border-gray-800">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${p.is_alive?"bg-green-400":"bg-red-500"}`}></div>
                                <span className={`text-xs ${p.is_alive?"text-white":"text-gray-500 line-through"}`}>{p.name}</span>
                              </div>
                              <span className="text-orange-400 text-xs">💀{p.current_match_kills||0}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Match State Controls */}
            {tournament && (
              <div className="bg-[#0d0d18] border border-orange-500/20 rounded-lg p-4 mb-4">
                <div className="text-orange-400 font-bold text-xs tracking-widest mb-3">MATCH CONTROL</div>
                <div className="flex flex-wrap gap-2 items-center mb-3">
                  <select className="bg-[#1a1a2e] border border-orange-500/30 text-white px-3 py-2 rounded text-sm focus:outline-none" value={mapName} onChange={e=>setMapName(e.target.value)}>
                    {MAPS.map(m=><option key={m}>{m}</option>)}
                  </select>
                  <button onClick={startMatch} disabled={actionLoading.start_match} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-sm tracking-widest transition">
                    {actionLoading.start_match?"...":`🚀 START MATCH ${(tournament.current_match_number||0)+1}`}
                  </button>
                  <button onClick={()=>updateState("in_game")} disabled={actionLoading.state_in_game||!currentMatch} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-sm tracking-widest transition">
                    {actionLoading.state_in_game?"...":"🎮 GO LIVE"}
                  </button>
                  <button onClick={()=>updateState("post_match")} disabled={actionLoading.state_post_match||!currentMatch} className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-sm tracking-widest transition">
                    {actionLoading.state_post_match?"...":"🏁 END MATCH"}
                  </button>
                  <button onClick={showChampions} disabled={actionLoading.show_champ} className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-sm tracking-widest transition">
                    {actionLoading.show_champ?"...":"🏆 DECLARE CHAMPIONS"}
                  </button>
                </div>
              </div>
            )}

            {/* Kill Control Grid */}
            {currentMatch && teams.length > 0 && (
              <div>
                <div className="text-orange-400 font-bold text-xs tracking-widest mb-3">⚡ KILL CONTROL — {currentMatch.map_name} MATCH {currentMatch.match_number}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                  {teams.map(team => {
                    const teamPlayers = getPlayersForTeam(team.id);
                    const teamStanding = standings.find(s=>s.team_id===team.id);
                    const aliveCount = teamPlayers.filter(p=>p.is_alive).length;
                    const teamKills = teamPlayers.reduce((acc,p)=>acc+(p.current_match_kills||0),0);
                    return (
                      <div key={team.id} className={`border rounded-lg overflow-hidden ${aliveCount===0?"border-red-800/50 opacity-60":"border-orange-500/30"} bg-[#0d0d18]`}>
                        <div className="bg-[#1a1a2e] px-3 py-2 flex items-center justify-between">
                          <div>
                            <span className="text-orange-400 font-black text-sm">{team.name}</span>
                            <span className="ml-2 text-gray-400 text-xs">{aliveCount}/{teamPlayers.length} alive</span>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-300 text-xs">💀 {teamKills} kills</div>
                            <div className="text-yellow-400 text-xs">{team.total_tournament_points||0} pts</div>
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          {teamPlayers.map(player => (
                            <div key={player.id} className={`flex items-center justify-between py-1 px-2 rounded ${!player.is_alive?"bg-red-900/20":""}`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${player.is_alive?"bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]":"bg-red-500"}`}></div>
                                <span className={`text-sm truncate ${player.is_alive?"text-white":"text-gray-500 line-through"}`}>{player.name}</span>
                                <span className="text-orange-400 text-xs ml-auto flex-shrink-0">💀{player.current_match_kills||0}</span>
                              </div>
                              <div className="flex gap-1 ml-2 flex-shrink-0">
                                <button
                                  onClick={()=>addKill(player.id, player.name, team.name)}
                                  disabled={!player.is_alive||actionLoading[`kill_${player.id}`]}
                                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold px-2 py-1 rounded transition"
                                >+KILL</button>
                                <button
                                  onClick={()=>elimPlayer(player.id, player.name)}
                                  disabled={!player.is_alive||actionLoading[`elim_${player.id}`]}
                                  className="bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold px-2 py-1 rounded transition"
                                >☠️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Placement */}
                        <div className="px-3 py-2 border-t border-orange-500/20 flex items-center gap-2">
                          <select
                            className="flex-1 bg-[#1a1a2e] border border-orange-500/30 text-white px-2 py-1 rounded text-xs focus:outline-none"
                            value={placements[team.id]||""}
                            onChange={e=>setPlacements(p=>({...p,[team.id]:e.target.value}))}
                          >
                            <option value="">Set Placement</option>
                            {Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>#{n} (+{placementPts[n]||DEFAULT_PLACEMENT[n]||0}pts)</option>)}
                          </select>
                          {teamStanding && <span className="text-green-400 text-xs font-bold">✓ #{teamStanding.placement}</span>}
                          <button
                            onClick={()=>setPlacement(team.id)}
                            disabled={actionLoading[`place_${team.id}`]}
                            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1 rounded transition"
                          >SET</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Standings Table */}
                <div className="bg-[#0d0d18] border border-orange-500/20 rounded-lg overflow-hidden">
                  <div className="bg-[#1a1a2e] px-4 py-2 text-orange-400 font-bold text-xs tracking-widest">📊 LIVE STANDINGS</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-500/20">
                        <th className="text-left px-4 py-2 text-gray-400 text-xs">RANK</th>
                        <th className="text-left px-4 py-2 text-gray-400 text-xs">TEAM</th>
                        <th className="text-right px-4 py-2 text-gray-400 text-xs">KILLS</th>
                        <th className="text-right px-4 py-2 text-gray-400 text-xs">PLACE PTS</th>
                        <th className="text-right px-4 py-2 text-gray-400 text-xs">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedTeams.map((team, idx) => {
                        const standing = standings.find(s=>s.team_id===team.id);
                        const medals = ["🥇","🥈","🥉"];
                        return (
                          <tr key={team.id} className={`border-b border-gray-800 ${idx===0?"bg-yellow-900/10":idx===1?"bg-gray-700/10":idx===2?"bg-orange-900/10":""}`}>
                            <td className="px-4 py-2 text-sm">{medals[idx]||`#${idx+1}`}</td>
                            <td className="px-4 py-2 font-bold text-white">{team.name}</td>
                            <td className="px-4 py-2 text-right text-orange-400">{standing?.team_kills_this_match||0}</td>
                            <td className="px-4 py-2 text-right text-blue-400">{standing?.placement_points_awarded||0}</td>
                            <td className="px-4 py-2 text-right text-yellow-400 font-black">{team.total_tournament_points||0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!tournament && (
              <div className="flex items-center justify-center h-64 text-gray-600">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <div className="text-xl font-bold">Create a tournament to get started</div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="w-72 bg-[#0d0d18] border-l border-orange-500/20 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <div className="text-orange-400 font-bold text-xs tracking-widest mb-3">OBS OVERLAY CONTROL</div>
            <div className="space-y-1 mb-4">
              {SCREENS.map(s=>(
                <button
                  key={s.id}
                  onClick={()=>switchScreen(s.id)}
                  disabled={actionLoading[`screen_${s.id}`]}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-bold transition ${
                    overlayState.current_screen===s.id
                      ?"bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.6)]"
                      :"bg-[#1a1a2e] text-gray-300 hover:bg-[#1f1f3a] border border-orange-500/20"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="tracking-widest">{s.label}</span>
                  {overlayState.current_screen===s.id && <span className="ml-auto text-xs">● LIVE</span>}
                </button>
              ))}
            </div>

            {/* OBS URL */}
            <div className="bg-[#111120] border border-blue-500/30 rounded p-3 mb-4">
              <div className="text-blue-400 text-xs font-bold mb-1">OBS BROWSER SOURCE</div>
              <div className="text-xs text-gray-300 break-all">{window.location.origin}/overlay</div>
              <div className="text-gray-500 text-xs mt-1">1920 × 1080</div>
            </div>

            {/* MVP */}
            <div className="bg-[#111120] border border-purple-500/30 rounded p-3 mb-3">
              <div className="text-purple-400 text-xs font-bold mb-2">⭐ MVP REVEAL</div>
              <button onClick={calcMVP} className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold py-2 rounded mb-2 transition">CALCULATE MVP</button>
              {mvpData ? (
                <div className="mb-2 text-center">
                  <div className="text-white font-bold">{mvpData.name}</div>
                  <div className="text-purple-300 text-xs">{mvpData.team}</div>
                  <div className="text-yellow-400 text-sm font-black">{mvpData.kills} KILLS</div>
                </div>
              ) : <div className="text-gray-500 text-xs text-center mb-2">Not calculated yet</div>}
              <button onClick={showMVP} disabled={!mvpData||actionLoading.show_mvp} className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-black font-black text-xs py-2 rounded transition">
                {actionLoading.show_mvp?"...":"🌟 SHOW MVP ON OVERLAY"}
              </button>
            </div>

            {/* Champions */}
            <div className="bg-[#111120] border border-yellow-500/30 rounded p-3 mb-3">
              <div className="text-yellow-400 text-xs font-bold mb-2">🏆 CHAMPIONS</div>
              <div className="space-y-1 mb-2">
                {rankedTeams.slice(0,3).map((t,i)=>{
                  const medals=["🥇","🥈","🥉"];
                  return (
                    <div key={t.id} className="flex justify-between text-xs">
                      <span>{medals[i]} {t.name}</span>
                      <span className="text-yellow-400 font-bold">{t.total_tournament_points||0}pts</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={showChampions} disabled={actionLoading.show_champ||teams.length===0} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-black text-xs py-2 rounded transition">
                {actionLoading.show_champ?"...":"🏆 BOOYAH SCREEN"}
              </button>
            </div>

            {/* Kill Feed Log */}
            <div className="bg-[#111120] border border-orange-500/20 rounded p-3">
              <div className="text-orange-400 text-xs font-bold mb-2">KILL FEED LOG</div>
              {killFeed.length===0 && <div className="text-gray-600 text-xs">No kills yet</div>}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {killFeed.map(k=>(
                  <div key={k.id} className="text-xs py-1 border-b border-gray-800">
                    <span className="text-orange-400 font-bold">{k.killer_name}</span>
                    <span className="text-gray-400"> [{k.killer_team_name}]</span>
                    <span className="text-red-400"> 💀 </span>
                    <span className="text-gray-300">{k.killed_player_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
