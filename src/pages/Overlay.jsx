import { useState, useEffect, useCallback } from "react";

const getData = () =>
  fetch("/functions/getOverlayData").then((r) => r.json());

function SetupBlank() {
  return (
    <div className="absolute inset-0 bg-black flex items-end justify-end">
      <span style={{color:"rgba(255,255,255,0.08)",fontSize:"12px",padding:"8px",fontFamily:"monospace"}}>BOOYAH DIRECTOR</span>
    </div>
  );
}

function PreMatchMap({ data }) {
  const { tournament, teams, players, current_match } = data;
  return (
    <div className="absolute inset-0 bg-[#050508] overflow-hidden">
      {/* Background diagonal lines */}
      <div className="absolute inset-0" style={{background:"repeating-linear-gradient(45deg,transparent,transparent 80px,rgba(255,100,0,0.03) 80px,rgba(255,100,0,0.03) 82px)"}}></div>
      {/* Top section */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500"></div>
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center" style={{paddingTop:"40px"}}>
        <div className="text-center">
          <div className="text-orange-400 text-lg font-bold tracking-[0.5em]" style={{fontFamily:"'Rajdhani',sans-serif"}}>FREE FIRE TOURNAMENT</div>
          <div className="text-white text-4xl font-black tracking-[0.3em]" style={{fontFamily:"'Orbitron',sans-serif"}}>MATCH {current_match?.match_number||"?"}</div>
        </div>
      </div>
      {/* Map Name */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center" style={{animation:"pulse 2s infinite"}}>
          <div className="text-orange-500 text-xs font-bold tracking-[0.8em] mb-2" style={{fontFamily:"'Rajdhani',sans-serif"}}>UPCOMING MAP</div>
          <div className="font-black" style={{
            fontFamily:"'Orbitron',sans-serif",
            fontSize:"120px",
            lineHeight:1,
            color:"transparent",
            WebkitTextStroke:"2px #f97316",
            textShadow:"0 0 60px rgba(249,115,22,0.4)",
            letterSpacing:"0.15em",
            animation:"mapPulse 2s ease-in-out infinite"
          }}>{(current_match?.map_name||"BERMUDA").toUpperCase()}</div>
        </div>
      </div>
      {/* Teams grid */}
      <div className="absolute bottom-0 left-0 right-0" style={{padding:"0 40px 40px"}}>
        <div className="grid gap-2" style={{gridTemplateColumns:`repeat(${Math.min(teams.length,6)},1fr)`}}>
          {teams.map(team=>{
            const tp = players.filter(p=>p.team_id===team.id);
            return (
              <div key={team.id} style={{background:"rgba(13,13,24,0.9)",border:"1px solid rgba(249,115,22,0.4)",borderRadius:"6px",padding:"10px",animation:"slideIn 0.5s ease-out"}}>
                <div style={{color:"#f97316",fontFamily:"'Rajdhani',sans-serif",fontWeight:"bold",fontSize:"14px",marginBottom:"4px",borderBottom:"1px solid rgba(249,115,22,0.2)",paddingBottom:"4px"}}>{team.name}</div>
                {tp.map(p=>(
                  <div key={p.id} style={{color:"rgba(255,255,255,0.7)",fontSize:"11px",padding:"1px 0"}}>{p.name}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes mapPulse { 0%,100%{text-shadow:0 0 60px rgba(249,115,22,0.4)} 50%{text-shadow:0 0 100px rgba(249,115,22,0.8),0 0 40px rgba(249,115,22,0.6)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

function Scoreboard({ data }) {
  const { tournament, teams, players, current_match, kill_feed } = data;
  const ranked = [...(teams||[])].sort((a,b)=>(b.total_tournament_points||0)-(a.total_tournament_points||0));
  const aliveTeams = (teams||[]).filter(t=>(players||[]).some(p=>p.team_id===t.id&&p.is_alive)).length;
  const playerKills = {};
  (players||[]).forEach(p=>{ if(p.current_match_kills>0) playerKills[p.id]={name:p.name,team:p.team_id,kills:p.current_match_kills}; });
  const topPlayers = Object.values(playerKills).sort((a,b)=>b.kills-a.kills).slice(0,5);

  return (
    <div className="absolute inset-0 bg-[#050508] overflow-hidden">
      <div className="absolute inset-0" style={{background:"repeating-linear-gradient(45deg,transparent,transparent 100px,rgba(255,100,0,0.02) 100px,rgba(255,100,0,0.02) 102px)"}}></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>

      {/* Left standings */}
      <div className="absolute top-0 left-0 bottom-0" style={{width:"600px",padding:"20px 20px 80px"}}>
        <div style={{background:"rgba(13,13,24,0.95)",border:"1px solid rgba(249,115,22,0.3)",borderRadius:"8px",height:"100%",overflow:"hidden"}}>
          <div style={{background:"rgba(249,115,22,0.15)",borderBottom:"2px solid #f97316",padding:"12px 16px"}}>
            <div style={{color:"#f97316",fontFamily:"'Orbitron',sans-serif",fontSize:"14px",fontWeight:"bold",letterSpacing:"0.2em"}}>TOURNAMENT STANDINGS</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:"11px",marginTop:"2px"}}>{tournament?.name} • {current_match?.map_name} MATCH {current_match?.match_number}</div>
          </div>
          <div style={{padding:"8px"}}>
            {/* Table header */}
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr 60px 70px 80px",padding:"6px 8px",color:"rgba(255,255,255,0.4)",fontSize:"11px",fontFamily:"'Rajdhani',sans-serif",letterSpacing:"0.1em"}}>
              <span>#</span><span>TEAM</span><span style={{textAlign:"right"}}>KILLS</span><span style={{textAlign:"right"}}>PLACE</span><span style={{textAlign:"right"}}>TOTAL</span>
            </div>
            {ranked.map((team,idx)=>{
              const medals=["🥇","🥈","🥉"];
              const borderColors=["#ffd700","#c0c0c0","#cd7f32"];
              const bgColors=["rgba(255,215,0,0.06)","rgba(192,192,192,0.04)","rgba(205,127,50,0.04)"];
              return (
                <div key={team.id} style={{
                  display:"grid",gridTemplateColumns:"40px 1fr 60px 70px 80px",
                  padding:"8px",marginBottom:"2px",borderRadius:"4px",
                  background:idx<3?bgColors[idx]:"rgba(255,255,255,0.02)",
                  borderLeft:idx<3?`3px solid ${borderColors[idx]}`:"3px solid transparent",
                  transition:"all 0.3s ease"
                }}>
                  <span style={{color:idx<3?borderColors[idx]:"rgba(255,255,255,0.5)",fontSize:"14px"}}>{medals[idx]||`#${idx+1}`}</span>
                  <span style={{color:"white",fontWeight:"bold",fontFamily:"'Rajdhani',sans-serif",fontSize:"15px"}}>{team.name}</span>
                  <span style={{textAlign:"right",color:"#f97316",fontSize:"13px"}}>💀{team.total_tournament_kills||0}</span>
                  <span style={{textAlign:"right",color:"#60a5fa",fontSize:"13px"}}>—</span>
                  <span style={{textAlign:"right",color:"#fbbf24",fontWeight:"black",fontSize:"16px",fontFamily:"'Orbitron',sans-serif"}}>{team.total_tournament_points||0}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="absolute top-0 right-0 bottom-0" style={{left:"620px",padding:"20px 20px 80px"}}>
        <div style={{display:"grid",gridTemplateRows:"auto auto 1fr",gap:"12px",height:"100%"}}>
          {/* Live badge */}
          <div style={{background:"rgba(13,13,24,0.95)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:"8px",padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"12px",height:"12px",borderRadius:"50%",background:"#ef4444",animation:"blink 1s infinite"}}></div>
            <div>
              <div style={{color:"#ef4444",fontFamily:"'Orbitron',sans-serif",fontSize:"16px",fontWeight:"bold"}}>MATCH {current_match?.match_number} LIVE</div>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:"11px"}}>{current_match?.map_name} • {aliveTeams} TEAMS ALIVE</div>
            </div>
          </div>
          {/* Top killers */}
          {topPlayers.length > 0 && (
            <div style={{background:"rgba(13,13,24,0.95)",border:"1px solid rgba(249,115,22,0.3)",borderRadius:"8px",padding:"12px 16px"}}>
              <div style={{color:"#f97316",fontFamily:"'Rajdhani',sans-serif",fontSize:"12px",fontWeight:"bold",letterSpacing:"0.2em",marginBottom:"8px"}}>🔥 KILL LEADERS</div>
              {topPlayers.map((p,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{color:"rgba(255,255,255,0.8)",fontSize:"13px"}}>#{i+1} {p.name}</span>
                  <span style={{color:"#f97316",fontWeight:"bold",fontSize:"14px"}}>💀 {p.kills}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom kill ticker */}
      <div className="absolute bottom-0 left-0 right-0" style={{height:"56px",background:"rgba(249,115,22,0.1)",borderTop:"1px solid rgba(249,115,22,0.3)",display:"flex",alignItems:"center",overflow:"hidden"}}>
        <div style={{background:"#f97316",padding:"0 16px",height:"100%",display:"flex",alignItems:"center",flexShrink:0}}>
          <span style={{color:"black",fontWeight:"bold",fontSize:"13px",letterSpacing:"0.1em"}}>KILL FEED</span>
        </div>
        <div style={{overflow:"hidden",flex:1}}>
          <div style={{
            display:"flex",gap:"48px",padding:"0 24px",
            animation:`ticker ${Math.max(20, (kill_feed||[]).length * 8)}s linear infinite`,
            whiteSpace:"nowrap"
          }}>
            {[...(kill_feed||[]),...(kill_feed||[])].map((k,i)=>(
              <span key={i} style={{color:"white",fontSize:"13px"}}>
                <span style={{color:"#f97316",fontWeight:"bold"}}>{k.killer_name}</span>
                <span style={{color:"rgba(255,255,255,0.5)"}}> [{k.killer_team_name}]</span>
                <span style={{color:"#ef4444"}}> 💀 </span>
                <span style={{color:"rgba(255,255,255,0.7)"}}>{k.killed_player_name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
}

function KillFeedScreen({ data }) {
  const { kill_feed } = data;
  const recent = (kill_feed||[]).slice(0,8);
  return (
    <div className="absolute inset-0 bg-[#050508] flex flex-col justify-center" style={{padding:"60px"}}>
      <div style={{color:"#f97316",fontFamily:"'Orbitron',sans-serif",fontSize:"20px",fontWeight:"bold",letterSpacing:"0.3em",marginBottom:"24px"}}>💀 KILL FEED</div>
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        {recent.map((k,i)=>(
          <div key={k.id||i} style={{
            display:"flex",alignItems:"center",gap:"16px",
            background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.25)",
            borderRadius:"6px",padding:"14px 20px",
            animation:`slideRight 0.4s ease-out ${i*0.1}s both`
          }}>
            <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"rgba(249,115,22,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"#f97316",fontWeight:"bold",fontSize:"16px",flexShrink:0}}>
              {(k.killer_name||"?")[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <span style={{color:"#f97316",fontWeight:"bold",fontFamily:"'Rajdhani',sans-serif",fontSize:"18px"}}>{k.killer_name}</span>
              <span style={{color:"rgba(255,255,255,0.5)",fontSize:"13px"}}> [{k.killer_team_name}]</span>
            </div>
            <div style={{color:"#ef4444",fontSize:"22px"}}>💀</div>
            <div style={{flex:1,textAlign:"right"}}>
              <span style={{color:"rgba(255,255,255,0.7)",fontSize:"16px"}}>{k.killed_player_name}</span>
              <span style={{color:"rgba(255,255,255,0.4)",fontSize:"13px"}}> [{k.killed_team_name}]</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideRight { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }`}</style>
    </div>
  );
}

function EliminationAlert({ data }) {
  const { eliminations } = data;
  const latest = (eliminations||[])[0];
  return (
    <div className="absolute inset-0 bg-[#050508] flex items-center justify-center">
      <div style={{textAlign:"center",animation:"elimDrop 0.5s ease-out"}}>
        <div style={{
          background:"linear-gradient(135deg,#7f1d1d,#991b1b,#dc2626)",
          border:"2px solid rgba(239,68,68,0.6)",
          borderRadius:"12px",padding:"48px 80px",
          boxShadow:"0 0 80px rgba(239,68,68,0.4)"
        }}>
          <div style={{fontSize:"80px",marginBottom:"8px"}}>☠️</div>
          <div style={{color:"#fca5a5",fontFamily:"'Orbitron',sans-serif",fontSize:"20px",letterSpacing:"0.5em",marginBottom:"8px"}}>ELIMINATED</div>
          {latest && <>
            <div style={{color:"white",fontFamily:"'Rajdhani',sans-serif",fontSize:"48px",fontWeight:"black",lineHeight:1.1}}>{latest.eliminated_player_name}</div>
            <div style={{color:"rgba(255,200,200,0.7)",fontSize:"20px",marginTop:"8px"}}>{latest.eliminated_team_name}</div>
          </>}
        </div>
      </div>
      <style>{`@keyframes elimDrop { from{opacity:0;transform:translateY(-60px) scale(0.8)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
    </div>
  );
}

function MVPScreen({ data }) {
  const { overlay_state } = data;
  const { mvp_player_name, mvp_team_name, mvp_kills } = overlay_state||{};
  return (
    <div className="absolute inset-0 overflow-hidden" style={{background:"linear-gradient(135deg,#1a0040,#2d0060,#1a0040)"}}>
      {/* Particles */}
      {Array.from({length:20},(_,i)=>(
        <div key={i} style={{
          position:"absolute",width:"4px",height:"4px",borderRadius:"50%",
          background:i%2===0?"#f97316":"#fbbf24",
          left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,
          animation:`float ${3+Math.random()*4}s ease-in-out ${Math.random()*2}s infinite alternate`
        }}/>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div style={{textAlign:"center",animation:"mvpReveal 0.8s cubic-bezier(0.175,0.885,0.32,1.275)"}}>
          <div style={{color:"#fbbf24",fontSize:"32px",letterSpacing:"0.6em",fontFamily:"'Orbitron',sans-serif",marginBottom:"8px"}}>⭐ MATCH MVP ⭐</div>
          <div style={{fontSize:"24px",marginBottom:"16px"}}>🎖️</div>
          <div style={{
            color:"white",fontFamily:"'Orbitron',sans-serif",fontSize:"80px",fontWeight:"black",
            lineHeight:1,letterSpacing:"0.05em",
            textShadow:"0 0 40px rgba(249,115,22,0.8),0 0 80px rgba(249,115,22,0.4)"
          }}>{mvp_player_name||"—"}</div>
          <div style={{color:"#f97316",fontFamily:"'Rajdhani',sans-serif",fontSize:"28px",fontWeight:"bold",marginTop:"12px",letterSpacing:"0.2em"}}>{mvp_team_name||""}</div>
          <div style={{
            marginTop:"24px",display:"inline-block",
            background:"linear-gradient(135deg,#f97316,#fbbf24)",
            borderRadius:"50px",padding:"12px 40px",
            color:"black",fontFamily:"'Orbitron',sans-serif",fontSize:"24px",fontWeight:"black"
          }}>⭐ {mvp_kills||0} KILLS</div>
        </div>
      </div>
      <style>{`
        @keyframes float { from{transform:translateY(0) scale(1)} to{transform:translateY(-20px) scale(1.3)} }
        @keyframes mvpReveal { from{opacity:0;transform:scale(0.5) translateY(50px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}

function ChampionsScreen({ data }) {
  const { overlay_state } = data;
  const { champion_team_name, champion_total_points } = overlay_state||{};
  return (
    <div className="absolute inset-0 overflow-hidden" style={{background:"linear-gradient(135deg,#1a1200,#2d1f00,#1a1200)"}}>
      {/* Confetti */}
      {Array.from({length:40},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          width:`${4+Math.random()*8}px`,height:`${8+Math.random()*12}px`,
          background:["#f97316","#fbbf24","#ef4444","#ffffff","#ffd700"][i%5],
          left:`${Math.random()*100}%`,top:"-20px",
          animation:`confetti ${2+Math.random()*3}s linear ${Math.random()*3}s infinite`,
          opacity:0.8,borderRadius:"2px"
        }}/>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"80px",animation:"bounce 1s ease-in-out infinite alternate"}}>🏆</div>
          <div style={{
            color:"#fbbf24",fontFamily:"'Orbitron',sans-serif",fontSize:"36px",
            fontWeight:"black",letterSpacing:"0.4em",
            textShadow:"0 0 30px rgba(251,191,36,0.8)",
            animation:"glow 1.5s ease-in-out infinite alternate"
          }}>BOOYAH!</div>
          <div style={{color:"rgba(255,255,255,0.6)",fontFamily:"'Rajdhani',sans-serif",fontSize:"18px",letterSpacing:"0.5em",marginTop:"8px",marginBottom:"24px"}}>TOURNAMENT CHAMPIONS</div>
          <div style={{
            color:"white",fontFamily:"'Orbitron',sans-serif",fontSize:"72px",fontWeight:"black",
            lineHeight:1,
            background:"linear-gradient(135deg,#fbbf24,#f97316,#fbbf24)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            textShadow:"none",filter:"drop-shadow(0 0 20px rgba(251,191,36,0.6))",
            animation:"teamReveal 1s cubic-bezier(0.175,0.885,0.32,1.275)"
          }}>{champion_team_name||"—"}</div>
          <div style={{
            marginTop:"20px",color:"rgba(255,255,255,0.7)",
            fontFamily:"'Rajdhani',sans-serif",fontSize:"24px"
          }}>⭐ {champion_total_points||0} TOTAL POINTS ⭐</div>
        </div>
      </div>
      <style>{`
        @keyframes confetti { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(1100px) rotate(720deg);opacity:0} }
        @keyframes bounce { from{transform:scale(1) translateY(0)} to{transform:scale(1.2) translateY(-20px)} }
        @keyframes glow { from{text-shadow:0 0 30px rgba(251,191,36,0.8)} to{text-shadow:0 0 60px rgba(251,191,36,1),0 0 100px rgba(249,115,22,0.6)} }
        @keyframes teamReveal { from{opacity:0;transform:scale(0.3)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}

export default function Overlay() {
  const [data, setData] = useState(null);
  const [screen, setScreen] = useState("setup_blank");
  const [prevScreen, setPrevScreen] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const d = await getData();
      setData(d);
      const newScreen = d?.overlay_state?.current_screen || "setup_blank";
      if (newScreen !== screen) {
        setTransitioning(true);
        setTimeout(() => {
          setScreen(newScreen);
          setTransitioning(false);
        }, 300);
      }
    } catch {}
  }, [screen]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 500);
    return () => clearInterval(iv);
  }, [refresh]);

  const renderScreen = () => {
    if (!data) return <SetupBlank />;
    switch (screen) {
      case "pre_match_map": return <PreMatchMap data={data} />;
      case "scoreboard": return <Scoreboard data={data} />;
      case "kill_feed": return <KillFeedScreen data={data} />;
      case "elimination_alert": return <EliminationAlert data={data} />;
      case "mvp": return <MVPScreen data={data} />;
      case "champions": return <ChampionsScreen data={data} />;
      default: return <SetupBlank />;
    }
  };

  return (
    <div style={{
      width:"1920px",height:"1080px",position:"relative",overflow:"hidden",
      background:"#050508",
      fontFamily:"'Rajdhani','Orbitron',sans-serif"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{
        position:"absolute",inset:0,
        opacity:transitioning?0:1,
        transition:"opacity 0.3s ease-in-out"
      }}>
        {renderScreen()}
      </div>
    </div>
  );
}
