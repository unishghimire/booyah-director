import re

# Read Overlay.jsx
with open('netlify-app/src/pages/Overlay.jsx', 'r') as f:
    content = f.read()

# Define ScreenBackground component text
screen_bg_component = """
function ScreenBackground({ bgUrl, accent, accent2, children, style = {} }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', ...style }}>
      {bgUrl ? (
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${bgUrl})`,
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'brightness(0.55) saturate(1.1)',
          zIndex:0
        }} />
      ) : (
        <GamingBackground accent={accent} accent2={accent2} />
      )}
      <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%' }}>
        {children}
      </div>
    </div>
  );
}
"""

# CHANGE 1: Add ScreenBackground RIGHT AFTER GamingBackground function
# GamingBackground function ends with: <style>{`@keyframes fprtcl{from{transform:translateY(0) translateX(0);opacity:.25}to{transform:translateY(-30px) translateX(12px);opacity:.75}}`}</style>\n    </div>\n  );\n}
gaming_bg_pattern = r"(function GamingBackground\(\{.*?\}\).*?return\s*\(\s*<div style=\{\{\s*position:\s*'absolute',.*?\}\).*?</style>.*?</div>\s*\);\s*\})"
# Let's find where GamingBackground ends in a more robust way
idx = content.find("function GamingBackground")
if idx == -1:
    print("Error: GamingBackground not found")
    exit(1)

# We can locate the end of GamingBackground by matching the custom keyframe style:
search_str = "<style>{`@keyframes fprtcl{from{transform:translateY(0) translateX(0);opacity:.25}to{transform:translateY(-30px) translateX(12px);opacity:.75}}`}</style>\n    </div>\n  );\n}"
end_idx = content.find(search_str, idx)
if end_idx == -1:
    print("Error: End of GamingBackground not found")
    exit(1)

insert_idx = end_idx + len(search_str)
content = content[:insert_idx] + "\n" + screen_bg_component + content[insert_idx:]

print("Successfully inserted ScreenBackground component.")

# CHANGE 2: Apply ScreenBackground to FullStandings, ChampionsScreen, TeamsToday
# Let's write robust regex or replacement logic for each:

# 2.1 FullStandings
# Find function FullStandings({ teams = [], design }) {
# Inside, we have:
#   return (
#     <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
#       <GamingBackground accent={primary} accent2={secondary} />
#       <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
# ...
#       </div>
#     </div>
#   );
# }

full_standings_old = """  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>"""

full_standings_new = """  const bgUrl = design?.backgrounds?.standings || '';

  return (
    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>"""

if full_standings_old in content:
    content = content.replace(full_standings_old, full_standings_new)
    # Now we need to replace the closing </div> of the outermost div.
    # The end of FullStandings function is:
    #       </div>
    #     </div>
    #   );
    # }
    # Let's find full standings start:
    fs_idx = content.find("function FullStandings")
    fs_end = content.find("/* ══════════════════════════════════════════════════", fs_idx) # wait, standings is followed by KILLFEED or whatever, let's search for "return (" inside fs:
    fs_ret_idx = content.find("return (", fs_idx)
    # Let's replace the matching sequence of the return statement
    fs_ret_end = content.find("  );\n}", fs_idx)
    # The block before ');\n}' is '      </div>\n    </div>'
    old_end = "      </div>\n    </div>\n  );"
    new_end = "      </div>\n    </ScreenBackground>\n  );"
    # Let's do a precise replace in that region
    fs_region = content[fs_idx:fs_ret_end+10]
    if old_end in fs_region:
        fs_region_new = fs_region.replace(old_end, new_end, 1)
        content = content[:fs_idx] + fs_region_new + content[fs_idx + len(fs_region):]
        print("Updated FullStandings component wrapper.")
    else:
        print("Error: Could not find end of FullStandings")
else:
    print("Error: FullStandings old wrapper match not found")

# 2.2 TeamsToday
teams_today_old = """  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      <GamingBackground accent={primary} accent2={secondary} />
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>"""

teams_today_new = """  const bgUrl = design?.backgrounds?.teams || '';

  return (
    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary}>
      <div style={{ position:'relative', zIndex:1, padding:'60px 80px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>"""

if teams_today_old in content:
    content = content.replace(teams_today_old, teams_today_new)
    tt_idx = content.find("function TeamsToday")
    tt_ret_end = content.find("  );\n}", tt_idx)
    tt_region = content[tt_idx:tt_ret_end+10]
    old_end = "      </div>\n    </div>\n  );"
    new_end = "      </div>\n    </ScreenBackground>\n  );"
    if old_end in tt_region:
        tt_region_new = tt_region.replace(old_end, new_end, 1)
        content = content[:tt_idx] + tt_region_new + content[tt_idx + len(tt_region):]
        print("Updated TeamsToday component wrapper.")
    else:
        print("Error: Could not find end of TeamsToday")
else:
    print("Error: TeamsToday old wrapper match not found")

# 2.3 ChampionsScreen
# Let's inspect the start and return of ChampionsScreen first:
# function ChampionsScreen({ teams = [], design, overlayState }) {
#   const primary = tok.acc(design);
#   const secondary = tok.acc2(design);
#   const tLogo = tok.logo(design);
# ...
#   return (
#     <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
#       <GamingBackground accent={primary} accent2={secondary} />
# ...

champs_idx = content.find("function ChampionsScreen")
champs_ret_idx = content.find("return (", champs_idx)
champs_ret_end = content.find("  );\n}", champs_idx)

# Let's extract and see this region
champs_region = content[champs_idx:champs_ret_end+10]
# We want to replace the outer div:
# <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
# With ScreenBackground and keeping any inline style if we want, but wait, Change 2 says:
# "Replace the outermost <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}> [or with display flex etc] and the <GamingBackground ... /> inside it with ScreenBackground"
# Wait! ScreenBackground accepts style={{ ...style }}!
# So for ChampionsScreen:
# `<ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>`
champs_old_div = """    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <GamingBackground accent={primary} accent2={secondary} />"""

champs_new_div = """    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>"""

if champs_old_div in content:
    # Add const bgUrl definition
    const_def = "  const bgUrl = design?.backgrounds?.champion || '';\n"
    content = content.replace("function ChampionsScreen({ teams = [], design, overlayState }) {", f"function ChampionsScreen({{ teams = [], design, overlayState }}) {{\n{const_def}")
    content = content.replace(champs_old_div, champs_new_div)
    
    # Update end wrapper of ChampionsScreen:
    #       </div>\n    </div>\n  );\n}
    # Wait, let's find the closing tag for the outer div.
    champs_idx = content.find("function ChampionsScreen")
    champs_ret_end = content.find("  );\n}", champs_idx)
    champs_region = content[champs_idx:champs_ret_end+10]
    old_end = "      </div>\n    </div>\n  );"
    new_end = "      </div>\n    </ScreenBackground>\n  );"
    if old_end in champs_region:
        champs_region_new = champs_region.replace(old_end, new_end, 1)
        content = content[:champs_idx] + champs_region_new + content[champs_idx + len(champs_region):]
        print("Updated ChampionsScreen component wrapper.")
    else:
        print("Error: Could not find end of ChampionsScreen")
else:
    print("Error: ChampionsScreen old wrapper match not found")


# CHANGE 3: Remove KillFeedScreen entirely
# Let's find "function KillFeedScreen" and the next comment block block
kf_start = content.find("function KillFeedScreen")
kf_next_comment = content.find("/* ══════════════════════════════════════════════════", kf_start)
if kf_start != -1 and kf_next_comment != -1:
    # Include some of the preceding/following spacing if needed, but simple removal is fine
    content = content[:kf_start] + content[kf_next_comment:]
    print("Removed KillFeedScreen function entirely.")
else:
    print("Error: Could not locate KillFeedScreen component region to delete.")

# In the screens map near the bottom, remove these two lines:
# killfeed:        <KillFeedScreen killFeed={killFeed} design={design} />,
# kill_feed:       <KillFeedScreen killFeed={killFeed} design={design} />,
content = re.sub(r"^\s*killfeed:\s*<KillFeedScreen.*?>,\s*\n", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*kill_feed:\s*<KillFeedScreen.*?>,\s*\n", "", content, flags=re.MULTILINE)
print("Removed killfeed mappings from screens.")

# Also remove killFeed from the destructuring of overlay data
content = content.replace("    killFeed:     _killFeed     = [],\n", "")
content = content.replace("  const killFeed     = safeArray(_killFeed);\n", "")
print("Removed killFeed data poll extracts.")


# CHANGE 4 — Add TeamRosterScreen
team_roster_screen_code = """
function TeamRosterScreen({ teams = [], players = [], design }) {
  const primary = tok.acc(design);
  const secondary = tok.acc2(design);
  const bgUrl = design?.backgrounds?.teams || '';

  // Build enriched teams with players
  const enriched = useMemo(() => {
    const teamsArr = safeArray(teams);
    const playersArr = safeArray(players);
    return teamsArr.map(t => ({
      ...t,
      roster: playersArr.filter(p => p.team_id === t.id || p.teamId === t.id).slice(0, 4),
    }));
  }, [teams, players]);

  const TEAMS_PER_SLIDE = 6;
  const slides = [];
  for (let i = 0; i < Math.max(enriched.length, 1); i += TEAMS_PER_SLIDE) {
    slides.push(enriched.slice(i, i + TEAMS_PER_SLIDE));
  }
  if (slides.length === 0) slides.push([]);

  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const currentSlide = slides[slideIdx] || [];
  const tLogo = tok.logo(design);

  return (
    <ScreenBackground bgUrl={bgUrl} accent={primary} accent2={secondary}>
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', padding:'48px 64px', boxSizing:'border-box' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:36 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {tLogo && <img src={tLogo} alt="logo" style={{ width:48, height:48, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />}
            <div>
              <div style={{ fontFamily:'Orbitron', fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'0.12em', textTransform:'uppercase' }}>{tok.name(design)}</div>
              <div style={{ fontFamily:'Orbitron', fontSize:10, fontWeight:700, color:secondary, letterSpacing:'0.35em', marginTop:3 }}>TEAM ROSTER</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {slides.length > 1 && (
              <div style={{ display:'flex', gap:6 }}>
                {slides.map((_, i) => (
                  <div key={i} style={{ width: i===slideIdx ? 24 : 8, height:8, borderRadius:4, background: i===slideIdx ? primary : 'rgba(255,255,255,0.15)', transition:'all 0.4s' }} />
                ))}
              </div>
            )}
            <div style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:900, color:primary, letterSpacing:'0.15em', border:`1px solid ${primary}44`, padding:'6px 16px', borderRadius:6 }}>
              {enriched.length} TEAMS
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:2, background:`linear-gradient(90deg,${primary},${secondary},transparent)`, marginBottom:32, borderRadius:2 }} />

        {/* Team Grid — 3 columns x 2 rows */}
        <motion.div
          key={slideIdx}
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
          style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(2,1fr)', gap:24, flex:1 }}
        >
          {currentSlide.map((team, idx) => (
            <TeamRosterCard key={team.id||idx} team={team} primary={primary} secondary={secondary} design={design} />
          ))}
          {/* Fill empty slots */}
          {Array.from({ length: Math.max(0, TEAMS_PER_SLIDE - currentSlide.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ borderRadius:16, border:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)' }} />
          ))}
        </motion.div>
      </div>
    </ScreenBackground>
  );
}

function TeamRosterCard({ team, primary, secondary, design }) {
  const playerPhotos = design?.playerPhotos || {};
  const teamLogoUrl  = design?.teamLogos?.[team.id] || team.logo_url || '';
  const roster       = team.roster || [];

  return (
    <div style={{
      borderRadius:16,
      border:`1px solid ${primary}33`,
      background:'rgba(0,0,0,0.55)',
      backdropFilter:'blur(12px)',
      display:'flex',
      flexDirection:'column',
      overflow:'hidden',
      boxShadow:`0 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
    }}>
      {/* Team header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:`1px solid ${primary}22`, background:`${primary}0a` }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:`2px solid ${primary}66`, overflow:'hidden', flexShrink:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {teamLogoUrl ? (
            <img src={teamLogoUrl} alt={team.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
          ) : (
            <span style={{ fontFamily:'Orbitron', fontSize:14, fontWeight:900, color:primary }}>{(team.name||'T').charAt(0)}</span>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Orbitron', fontSize:13, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.08em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{team.name||'TEAM'}</div>
          <div style={{ fontFamily:'Orbitron', fontSize:8, color:secondary, letterSpacing:'0.2em', marginTop:2 }}>{roster.length} PLAYERS</div>
        </div>
      </div>

      {/* Player photo grid 2×2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, padding:12, flex:1 }}>
        {[0,1,2,3].map(i => {
          const player = roster[i];
          const photoUrl = player ? (playerPhotos[player.id] || player.photo_url || '') : '';
          return (
            <div key={i} style={{
              borderRadius:10,
              overflow:'hidden',
              background: player ? `${primary}0d` : 'rgba(255,255,255,0.02)',
              border:`1px solid ${player ? primary+'33' : 'rgba(255,255,255,0.04)'}`,
              aspectRatio:'1/1',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              position:'relative',
            }}>
              {player ? (
                <>
                  {photoUrl ? (
                    <img src={photoUrl} alt={player.name}
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e=>{ e.target.style.display='none'; }}
                    />
                  ) : null}
                  {/* Name overlay at bottom */}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'4px 6px', background:'linear-gradient(transparent,rgba(0,0,0,0.85))', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:8, fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center', lineHeight:1.2 }}>{player.name||'PLAYER'}</span>
                  </div>
                  {!photoUrl && (
                    <span style={{ fontFamily:'Orbitron', fontSize:20, fontWeight:900, color:`${primary}66`, zIndex:1 }}>{(player.name||'P').charAt(0)}</span>
                  )}
                </>
              ) : (
                <span style={{ fontFamily:'Orbitron', fontSize:9, color:'rgba(255,255,255,0.1)', letterSpacing:'0.1em' }}>SLOT {i+1}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
"""

# Let's insert the new TeamRosterScreen right before the LOADING & ERROR STATES comment
load_err_idx = content.find("/* ══════════════════════════════════════════════════\n   LOADING & ERROR STATES")
if load_err_idx == -1:
    print("Error: LOADING & ERROR STATES not found")
    exit(1)

content = content[:load_err_idx] + team_roster_screen_code + "\n" + content[load_err_idx:]
print("Added TeamRosterScreen component.")

# Insert new screen mapping lines in the screens object:
screens_idx = content.find("  const screens = {")
if screens_idx == -1:
    print("Error: const screens object not found")
    exit(1)

insert_screen_map_idx = content.find("  };", screens_idx)
if insert_screen_map_idx == -1:
    print("Error: End of screens mapping not found")
    exit(1)

mapping_code = """    team_roster: <TeamRosterScreen teams={teams} players={players} design={design} />,
    teamroster:  <TeamRosterScreen teams={teams} players={players} design={design} />,
"""

content = content[:insert_screen_map_idx] + mapping_code + content[insert_screen_map_idx:]
print("Added screen mappings for team_roster.")

# Write the updated content back to Overlay.jsx
with open('netlify-app/src/pages/Overlay.jsx', 'w') as f:
    f.write(content)

print("Finished transformations successfully.")
