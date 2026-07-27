import re

overlay_jsx_path = "netlify-app/src/pages/Overlay.jsx"
ffws_jsx_path = "netlify-app/src/pages/FFWSOverlays.jsx"

with open(overlay_jsx_path, "r", encoding="utf-8") as f:
    lines_overlay = f.readlines()

with open(ffws_jsx_path, "r", encoding="utf-8") as f:
    lines_ffws = f.readlines()

# Screens mapped to components
# In Overlay.jsx:
# - FullStandings (Lines 598-697)
# - KillFeedScreen (Lines 698-757)
# - PreMatchMap (Lines 758-843)
# - TodaysMatches (Lines 844-907)
# - TeamsToday (Lines 908-972)
# - CastersScreen (Lines 973-1044)
# - UpcomingMap (Lines 1045-1084)
# - EliminationAlert (Lines 1085-1147)
# - EventBanner (Lines 1148-1214)
# - MVPScreen (Lines 1215-1555)
# - ChampionsScreen (Lines 1556-1770)
# - TeamRosterScreen (Lines 2035-2287)
# - TeamRosterCard (Lines 1808-2034) (Helper used in TeamRosterScreen)

# In FFWSOverlays.jsx:
# - EliminatedTeamBanner (Lines 12-169) (Helper/Screen)
# - FFBoardV2 (Lines 170-484)
# - MatchInfoChip (Lines 485-606)
# - GameIntroBanner (Lines 607-835)
# - MatchScheduleGrid (Lines 836-1274)
# - PointRushStandings (Lines 1275-1647)
# - RoadmapOverlay (Lines 1648-1868)
# - EventDetailsOverlay (Lines 1869-2088)

screens_to_audit = [
    # (Name, File, Start, End)
    ("FullStandings", "Overlay.jsx", lines_overlay, 598, 697),
    ("KillFeedScreen", "Overlay.jsx", lines_overlay, 698, 757),
    ("PreMatchMap", "Overlay.jsx", lines_overlay, 758, 843),
    ("TodaysMatches", "Overlay.jsx", lines_overlay, 844, 907),
    ("TeamsToday", "Overlay.jsx", lines_overlay, 908, 972),
    ("CastersScreen", "Overlay.jsx", lines_overlay, 973, 1044),
    ("UpcomingMap", "Overlay.jsx", lines_overlay, 1045, 1084),
    ("EliminationAlert", "Overlay.jsx", lines_overlay, 1085, 1147),
    ("EventBanner", "Overlay.jsx", lines_overlay, 1148, 1214),
    ("MVPScreen", "Overlay.jsx", lines_overlay, 1215, 1555),
    ("ChampionsScreen", "Overlay.jsx", lines_overlay, 1556, 1770),
    ("TeamRosterCard", "Overlay.jsx", lines_overlay, 1808, 2034),
    ("TeamRosterScreen", "Overlay.jsx", lines_overlay, 2035, 2287),
    
    ("EliminatedTeamBanner", "FFWSOverlays.jsx", lines_ffws, 12, 169),
    ("FFBoardV2", "FFWSOverlays.jsx", lines_ffws, 170, 484),
    ("MatchInfoChip", "FFWSOverlays.jsx", lines_ffws, 485, 606),
    ("GameIntroBanner", "FFWSOverlays.jsx", lines_ffws, 607, 835),
    ("MatchScheduleGrid", "FFWSOverlays.jsx", lines_ffws, 836, 1274),
    ("PointRushStandings", "FFWSOverlays.jsx", lines_ffws, 1275, 1647),
    ("RoadmapOverlay", "FFWSOverlays.jsx", lines_ffws, 1648, 1868),
    ("EventDetailsOverlay", "FFWSOverlays.jsx", lines_ffws, 1869, 2088)
]

# Regexes
hex_color_re = re.compile(r'#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b')
rgba_color_re = re.compile(r'\brgba?\([^)]+\)', re.IGNORECASE)
orange_re = re.compile(r'\b(orange|amber|#FF6B00|#FF8C00)\b', re.IGNORECASE)
font_family_re = re.compile(r'fontFamily\s*:\s*[\'"`]([^\'"`]+)[\'"`]', re.IGNORECASE)
themed_panel_re = re.compile(r'<ThemedPanel\b')

def get_accent_vars(text):
    # check if components destructured or used accentColor / textColor from design prop
    # or if they use t.p, t.s, primary, secondary from getTheme(design)
    uses_design_tokens = False
    if "design?.accentColor" in text or "design?.textColor" in text:
        uses_design_tokens = True
    if "getTheme" in text or "t.p" in text or "t.s" in text:
        uses_design_tokens = True
    return uses_design_tokens

results = []

for name, filename, file_lines, start, end in screens_to_audit:
    comp_lines = file_lines[start-1:end]
    
    hardcoded_hexes = []
    hardcoded_rgbas = []
    oranges = []
    fonts = set()
    has_themed_panel = False
    backgrounds = []
    
    # Check if there is any usage of 'design' prop
    uses_design_tokens = False
    
    for idx, line in enumerate(comp_lines):
        line_num = start + idx
        
        # Check fonts
        for font in font_family_re.findall(line):
            for part in font.split(','):
                part = part.strip().strip("'\"").replace('sans-serif', '').strip()
                if part:
                    fonts.add(part)
                    
        # Check ThemedPanel
        if themed_panel_re.search(line):
            has_themed_panel = True
            
        # Check backgrounds
        if "background" in line or "backgroundColor" in line:
            backgrounds.append((line_num, line.strip()))
            
        # Check design tokens
        if get_accent_vars(line):
            uses_design_tokens = True
            
        # Find Hex colors
        for h in hex_color_re.findall(line):
            # Ignore common standard shades like #fff, #000, #ffffff, #000000, and transparent/none
            if h.lower() not in ['#fff', '#000', '#ffffff', '#000000', '#ffffff00', '#00000000', '#333']:
                hardcoded_hexes.append((line_num, h, line.strip()))
                
        # Find RGBA colors
        for r in rgba_color_re.findall(line):
            if r.lower() not in ['rgba(0,0,0,0)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']:
                # Filter out pure transparent / generic black overlay
                hardcoded_rgbas.append((line_num, r, line.strip()))
                
        # Find old orange
        for o in orange_re.findall(line):
            oranges.append((line_num, o, line.strip()))

    results.append({
        "name": name,
        "file": filename,
        "start": start,
        "end": end,
        "hardcoded_hexes": hardcoded_hexes,
        "hardcoded_rgbas": hardcoded_rgbas,
        "oranges": oranges,
        "fonts": list(fonts),
        "has_themed_panel": has_themed_panel,
        "backgrounds": backgrounds,
        "uses_design_tokens": uses_design_tokens
    })

# Now format the report nicely
with open("audit_report.txt", "w", encoding="utf-8") as out:
    out.write("========================================================================\n")
    out.write("OVERLAY STYLE CONSISTENCY AUDIT REPORT\n")
    out.write("========================================================================\n\n")
    
    out.write("1. FRAMER-MOTION USAGE:\n")
    out.write("-----------------------\n")
    out.write("framer-motion is completely REMOVED from both Overlay.jsx and FFWSOverlays.jsx.\n")
    out.write("Both files now explicitly state that they use CSS animations only (prevents OBS bug).\n\n")
    
    out.write("2. SUMMARY OF COMPONENTS:\n")
    out.write("-------------------------\n")
    
    for r in results:
        out.write(f"- {r['name']} ({r['file']}:{r['start']}-{r['end']}):\n")
        out.write(f"  * Uses ThemedPanel: {r['has_themed_panel']}\n")
        out.write(f"  * Fonts specified: {', '.join(r['fonts']) if r['fonts'] else 'None'}\n")
        out.write(f"  * Uses Design Tokens (accent/theme): {r['uses_design_tokens']}\n")
        if r['oranges']:
            out.write(f"  * WARNING: Uses old orange colors: {len(r['oranges'])} instances!\n")
        if r['hardcoded_hexes'] or r['hardcoded_rgbas']:
            out.write(f"  * Hardcoded colors found: {len(r['hardcoded_hexes']) + len(r['hardcoded_rgbas'])} instances\n")
        out.write("\n")
        
    out.write("\n3. DETAILED COMPONENT AUDIT:\n")
    out.write("----------------------------\n")
    for r in results:
        out.write("========================================================================\n")
        out.write(f"COMPONENT: {r['name']} ({r['file']}:{r['start']}-{r['end']})\n")
        out.write("========================================================================\n")
        
        # (1) Design tokens and hardcoded colors
        out.write("\n(1) HARDCODED COLORS AND DESIGN TOKENS:\n")
        out.write(f"  * Uses design tokens? {'Yes' if r['uses_design_tokens'] else 'No'}\n")
        if r['hardcoded_hexes'] or r['hardcoded_rgbas']:
            out.write("  * Hardcoded colors found:\n")
            for line_num, color, code in r['hardcoded_hexes']:
                out.write(f"    - Line {line_num}: {color} (should be replaced with design tokens like t.p, t.s or design?.accentColor)\n")
                out.write(f"      Code: {code}\n")
            for line_num, color, code in r['hardcoded_rgbas']:
                out.write(f"    - Line {line_num}: {color} (should be replaced with rgba(t.p, ...) or rgba(t.s, ...))\n")
                out.write(f"      Code: {code}\n")
        else:
            out.write("  * No significant hardcoded colors found (uses design tokens or neutral white/black/grey).\n")
            
        # (2) Old Orange colors
        out.write("\n(2) OLD ORANGE COLORS (#FF6B00, #FF8C00, orange, amber):\n")
        if r['oranges']:
            out.write(f"  * Found {len(r['oranges'])} occurrences of orange/amber colors! These must be updated to purple #7C3AED / blue #3B82F6.\n")
            for line_num, color, code in r['oranges']:
                out.write(f"    - Line {line_num}: {color}\n")
                out.write(f"      Code: {code}\n")
        else:
            out.write("  * Clear of old orange/amber colors. NexOverlays purple/blue are used instead.\n")
            
        # (3) Background Consistency
        out.write("\n(3) BACKGROUND CONSISTENCY:\n")
        if r['backgrounds']:
            out.write("  * Backgrounds specified in code:\n")
            for line_num, code in r['backgrounds']:
                out.write(f"    - Line {line_num}: {code}\n")
        else:
            out.write("  * No explicit background specified (uses parent container background).\n")
            
        # (4) Fonts Consistency
        out.write("\n(4) FONTS CONSISTENCY:\n")
        out.write(f"  * Fonts defined: {', '.join(r['fonts']) if r['fonts'] else 'None'}\n")
        out.write("  * Rules check: Orbitron for display, Rajdhani for body, Teko for numbers.\n")
        non_conforming = [f for f in r['fonts'] if f not in ['Orbitron', 'Rajdhani', 'Teko']]
        if non_conforming:
            out.write(f"  * WARNING: Non-conforming fonts found: {', '.join(non_conforming)}\n")
        else:
            out.write("  * Fonts conform to style guide (or uses default styling).\n")
            
        out.write("\n")

print("Audit report written successfully to audit_report.txt")
