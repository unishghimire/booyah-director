import re

with open('netlify-app/src/pages/Overlay.jsx', 'r') as f:
    content = f.read()

start_marker = "/* ══════════════════════════════════════════════════\n   SCREEN: TEAM ROSTER (6 teams per slide, auto-cycles)\n══════════════════════════════════════════════════ */"
end_marker = "export default function Overlay()"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

# We want to replace the text between start_idx and end_idx with our updated code.
# Let's write out our new implementation for TeamRosterCard and TeamRosterScreen.

new_code = """/* ══════════════════════════════════════════════════
   SCREEN: TEAM ROSTER (6 teams per slide, auto-cycles)
══════════════════════════════════════════════════ */
function TeamRosterCard({ team, primary, secondary, design }) {
  const playerPhotos = design?.playerPhotos || {};
  const teamLogoUrl  = design?.teamLogos?.[team.id] || team.logo_url || '';
  const roster       = safeArray(team.roster || []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        borderRadius: 12,
        border: '1.5px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Corner hazard accent (subtle top-right) */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 60,
        background: 'repeating-linear-gradient(45deg, #fcd34d, #fcd34d 5px, #000 5px, #000 10px)',
        opacity: 0.15,
        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        pointerEvents: 'none',
      }} />

      {/* Team header block */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px 16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Team logo circular container */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
          flexShrink: 0,
        }}>
          {teamLogoUrl ? (
            <img
              src={teamLogoUrl}
              alt={team.name}
              style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#fff' }}>
              {(team.name || 'T').charAt(0)}
            </span>
          )}
        </div>

        {/* Team Name and Rank info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Orbitron',
            fontSize: 22,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}>
            {team.name || 'TEAM'}
          </div>
          {team.rank && (
            <div style={{
              display: 'inline-block',
              fontFamily: 'Rajdhani',
              fontSize: 12,
              fontWeight: 700,
              color: '#fcd34d',
              letterSpacing: '0.1em',
              marginTop: 2,
              textTransform: 'uppercase',
            }}>
              RANK #{team.rank}
            </div>
          )}
        </div>
      </div>

      {/* Players Row container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 8,
        padding: '24px 16px',
        flex: 1,
      }}>
        {[0, 1, 2, 3, 4].map(i => {
          const player = roster[i];
          if (!player && i >= 4) return null; // Only show 5th slot if there's a player, otherwise show exactly 4
          const photoUrl = player ? (playerPhotos[player.id] || player.photo_url || '') : '';
          
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* Circular Avatar Border wrapper */}
              <div style={{
                position: 'relative',
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: player ? '2.5px solid #ffffff' : '2.5px dashed rgba(255, 255, 255, 0.15)',
                background: player ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                boxShadow: player ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}>
                {player ? (
                  photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={player.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: player.is_alive !== false ? 1 : 0.4,
                      }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{
                      fontFamily: 'Orbitron',
                      fontSize: 20,
                      fontWeight: 900,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      {(player.name || 'P').charAt(0).toUpperCase()}
                    </span>
                  )
                ) : (
                  <span style={{
                    fontFamily: 'Rajdhani',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.15)',
                  }}>
                    +
                  </span>
                )}

                {/* Dead overlay indicator */}
                {player && player.is_alive === false && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      fontFamily: 'Orbitron',
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#ffffff',
                      textShadow: '0 0 4px #000',
                    }}>
                      ELIM
                    </span>
                  </div>
                )}
              </div>

              {/* Player Nickname */}
              <div style={{
                fontFamily: 'Rajdhani',
                fontSize: 14,
                fontWeight: 700,
                color: player ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {player ? (player.name || 'PLAYER') : 'EMPTY'}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TeamRosterScreen({ teams = [], players = [], design }) {
  const primary   = tok.acc(design);
  const secondary = tok.acc2(design);
  const bgUrl     = design?.backgrounds?.teams || '';
  const tLogo     = tok.logo(design);
  const sponsorLogo = tok.sponsorLogo(design);
  const tournamentName = design?.tournamentName || tok.name(design);

  const enriched = useMemo(() => {
    const teamsArr   = safeArray(teams);
    const playersArr = safeArray(players);
    return teamsArr.map(t => ({
      ...t,
      roster: playersArr.filter(p => p.team_id === t.id || p.teamId === t.id).slice(0, 5),
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

  return (
    <div style={{
      width: 1920,
      height: 1080,
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #3b82f6 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      {/* Yellow/Black hazard diagonal stripes top-left */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        background: 'repeating-linear-gradient(45deg, #fcd34d, #fcd34d 15px, #000 15px, #000 30px)',
        transform: 'rotate(-15deg)',
        opacity: 0.35,
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        zIndex: 1,
      }} />

      {/* Yellow/Black hazard stripes bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: 300,
        height: 300,
        background: 'repeating-linear-gradient(45deg, #fcd34d, #fcd34d 15px, #000 15px, #000 30px)',
        transform: 'rotate(-15deg)',
        opacity: 0.35,
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
        zIndex: 1,
      }} />

      {/* Subtle overlay grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 80px',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        {/* Header Block */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Tournament & Section Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {tLogo ? (
              <img
                src={tLogo}
                alt="logo"
                style={{ height: 75, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                onError={e => e.target.style.display = 'none'}
              />
            ) : (
              design?.logoUrl && (
                <img
                  src={design.logoUrl}
                  alt="logo"
                  style={{ height: 75, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                  onError={e => e.target.style.display = 'none'}
                />
              )
            )}
            <div>
              <div style={{
                fontFamily: 'Orbitron',
                fontSize: 36,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 4px 10px rgba(0,0,0,0.4)',
              }}>
                {tournamentName || 'FREE FIRE TOURNAMENT'}
              </div>
              <div style={{
                fontFamily: 'Orbitron',
                fontSize: 16,
                fontWeight: 700,
                color: '#fcd34d',
                letterSpacing: '0.3em',
                marginTop: 4,
                textTransform: 'uppercase',
                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }}>
                TEAMS ROSTER
              </div>
            </div>
          </div>

          {/* Indicators & Slides Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {slides.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {slides.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === slideIdx ? 32 : 10,
                      height: 10,
                      borderRadius: 5,
                      background: i === slideIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      boxShadow: i === slideIdx ? '0 0 10px #ffffff' : 'none',
                      transition: 'all 0.4s ease',
                    }}
                  />
                ))}
              </div>
            )}
            <div style={{
              fontFamily: 'Orbitron',
              fontSize: 14,
              fontWeight: 900,
              color: '#fcd34d',
              letterSpacing: '0.15em',
              border: '2px solid #fcd34d',
              padding: '8px 20px',
              borderRadius: 6,
              background: 'rgba(252, 211, 77, 0.1)',
              boxShadow: '0 0 15px rgba(252, 211, 77, 0.2)',
            }}>
              {enriched.length} TEAMS
            </div>
          </div>
        </div>

        {/* 3×2 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 30,
          flex: 1,
          margin: '40px 0',
        }}>
          <AnimatePresence mode="wait">
            {currentSlide.map((team, idx) => (
              <TeamRosterCard
                key={`${slideIdx}-${team.id || idx}`}
                team={team}
                primary={primary}
                secondary={secondary}
                design={design}
              />
            ))}
            {Array.from({ length: Math.max(0, TEAMS_PER_SLIDE - currentSlide.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  borderRadius: 12,
                  border: '1.5px dashed rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Sponsor/Tournament Branding Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: 20,
        }}>
          <div style={{
            fontFamily: 'Rajdhani',
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.15em',
          }}>
            OFFICIAL ESPORTS BROADCAST
          </div>
          {(sponsorLogo || design?.sponsorLogoUrl) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: 'Orbitron',
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.2em',
                fontWeight: 700,
              }}>
                SPONSORED BY
              </span>
              <img
                src={sponsorLogo || design?.sponsorLogoUrl}
                alt="sponsor"
                style={{ height: 32, objectFit: 'contain' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"""

# Insert the replacement
updated_content = content[:start_idx] + new_code + content[end_idx:]

with open('netlify-app/src/pages/Overlay.jsx', 'w') as f:
    f.write(updated_content)

print("File updated successfully!")
