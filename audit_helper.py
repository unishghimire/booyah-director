import re

overlay_jsx_path = "netlify-app/src/pages/Overlay.jsx"
ffws_jsx_path = "netlify-app/src/pages/FFWSOverlays.jsx"

# Let's define the line ranges for components in Overlay.jsx
# We got these from grep:
# 158:function ThemedPanel
# 216:function ThemedBackground
# 248:function ThemedHeader
# 279:function GamingBackground
# 340:function FFPanel
# 361:function FFPanelHeader
# 398:function TeamLogo
# 434:function FFBoard
# 598:function FullStandings
# 698:function KillFeedScreen
# 758:function PreMatchMap
# 844:function TodaysMatches
# 908:function TeamsToday
# 973:function CastersScreen
# 1045:function UpcomingMap
# 1085:function EliminationAlert
# 1148:function EventBanner
# 1215:function MVPScreen
# 1556:function ChampionsScreen
# 1771:function OverlayLoading
# 1786:function ScreenBackground
# 1808:function TeamRosterCard
# 2035:function TeamRosterScreen
# 2288:export default function Overlay

# In FFWSOverlays.jsx:
# 12:export function EliminatedTeamBanner
# 170:export function FFBoardV2
# 485:export function MatchInfoChip
# 607:export function GameIntroBanner
# 836:export function MatchScheduleGrid
# 1275:export function PointRushStandings
# 1648:export function RoadmapOverlay
# 1869:export function EventDetailsOverlay
# 2089:function StatCard

def get_file_lines(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.readlines()

lines_overlay = get_file_lines(overlay_jsx_path)
lines_ffws = get_file_lines(ffws_jsx_path)

# Let's map out components and their ranges in Overlay.jsx
comps_overlay = [
    ("ThemedPanel", 158, 215),
    ("ThemedBackground", 216, 247),
    ("ThemedHeader", 248, 278),
    ("GamingBackground", 279, 339),
    ("FFPanel", 340, 360),
    ("FFPanelHeader", 361, 397),
    ("TeamLogo", 398, 433),
    ("FFBoard", 434, 597),
    ("FullStandings", 598, 697),
    ("KillFeedScreen", 698, 757),
    ("PreMatchMap", 758, 843),
    ("TodaysMatches", 844, 907),
    ("TeamsToday", 908, 972),
    ("CastersScreen", 973, 1044),
    ("UpcomingMap", 1045, 1084),
    ("EliminationAlert", 1085, 1147),
    ("EventBanner", 1148, 1214),
    ("MVPScreen", 1215, 1555),
    ("ChampionsScreen", 1556, 1770),
    ("OverlayLoading", 1771, 1785),
    ("ScreenBackground", 1786, 1807),
    ("TeamRosterCard", 1808, 2034),
    ("TeamRosterScreen", 2035, 2287),
    ("Overlay", 2288, len(lines_overlay))
]

comps_ffws = [
    ("EliminatedTeamBanner", 12, 169),
    ("FFBoardV2", 170, 484),
    ("MatchInfoChip", 485, 606),
    ("GameIntroBanner", 607, 835),
    ("MatchScheduleGrid", 836, 1274),
    ("PointRushStandings", 1275, 1647),
    ("RoadmapOverlay", 1648, 1868),
    ("EventDetailsOverlay", 1869, 2088),
    ("StatCard", 2089, len(lines_ffws))
]

# Regexes
hex_color_re = re.compile(r'#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b')
# find named colors or old orange colors
orange_re = re.compile(r'\b(orange|amber|#FF6B00|#FF8C00)\b', re.IGNORECASE)
rgb_re = re.compile(r'\brgba?\([^)]+\)', re.IGNORECASE)

# Fonts
font_re = re.compile(r'fontFamily\s*:\s*[\'"`]([^\'"`]+)[\'"`]')

# Look for ThemedPanel usage
themed_panel_re = re.compile(r'<ThemedPanel\b')

def analyze_file_components(file_lines, comps, filename):
    results = {}
    for comp_name, start, end in comps:
        comp_lines = file_lines[start-1:end]
        results[comp_name] = {
            "start": start,
            "end": end,
            "lines": [],
            "hex_colors": [],
            "rgba_colors": [],
            "orange_colors": [],
            "fonts": set(),
            "has_themed_panel": False,
            "backgrounds": []
        }
        
        # Check line by line
        for offset, line_text in enumerate(comp_lines):
            line_num = start + offset
            
            # Find hex colors
            hexs = hex_color_re.findall(line_text)
            for h in hexs:
                results[comp_name]["hex_colors"].append((line_num, h))
                
            # Find old orange
            oranges = orange_re.findall(line_text)
            for o in oranges:
                results[comp_name]["orange_colors"].append((line_num, o))
                
            # Find rgb/rgba
            rgbs = rgb_re.findall(line_text)
            for r in rgbs:
                results[comp_name]["rgba_colors"].append((line_num, r))
                
            # Find fonts
            fonts_found = font_re.findall(line_text)
            for f in fonts_found:
                # clean up fonts
                for part in f.split(','):
                    part = part.strip().strip("'\"").replace('sans-serif', '').strip()
                    if part:
                        results[comp_name]["fonts"].add(part)
                        
            # Check ThemedPanel
            if themed_panel_re.search(line_text):
                results[comp_name]["has_themed_panel"] = True
                
            # Check backgrounds
            if "background" in line_text or "backgroundColor" in line_text:
                results[comp_name]["backgrounds"].append((line_num, line_text.strip()))
                
    return results

res_overlay = analyze_file_components(lines_overlay, comps_overlay, "Overlay.jsx")
res_ffws = analyze_file_components(lines_ffws, comps_ffws, "FFWSOverlays.jsx")

print("--- OVERLAY.JSX ---")
for c, r in res_overlay.items():
    print(f"\nComponent: {c} (Lines {r['start']}-{r['end']})")
    print(f"  Has ThemedPanel: {r['has_themed_panel']}")
    print(f"  Fonts found: {list(r['fonts'])}")
    if r['orange_colors']:
        print(f"  Orange/Amber/Old colors found: {r['orange_colors']}")
    if r['hex_colors']:
        # Filter out common neutrals like #fff, #000, #ffffff, #000000
        interest_hex = [h for h in r['hex_colors'] if h[1].lower() not in ['#fff', '#000', '#ffffff', '#000000', '#ffffff00', '#00000000']]
        if interest_hex:
            print(f"  Interesting Hex colors found: {interest_hex}")
    if r['backgrounds']:
        print(f"  Background declarations:")
        for b in r['backgrounds'][:5]: # show first 5
            print(f"    Line {b[0]}: {b[1]}")
        if len(r['backgrounds']) > 5:
            print(f"    ... and {len(r['backgrounds'])-5} more")

print("\n\n--- FFWSOVERLAYS.JSX ---")
for c, r in res_ffws.items():
    print(f"\nComponent: {c} (Lines {r['start']}-{r['end']})")
    print(f"  Has ThemedPanel: {r['has_themed_panel']}")
    print(f"  Fonts found: {list(r['fonts'])}")
    if r['orange_colors']:
        print(f"  Orange/Amber/Old colors found: {r['orange_colors']}")
    if r['hex_colors']:
        interest_hex = [h for h in r['hex_colors'] if h[1].lower() not in ['#fff', '#000', '#ffffff', '#000000', '#ffffff00', '#00000000']]
        if interest_hex:
            print(f"  Interesting Hex colors found: {interest_hex}")
    if r['backgrounds']:
        print(f"  Background declarations:")
        for b in r['backgrounds'][:5]:
            print(f"    Line {b[0]}: {b[1]}")
        if len(r['backgrounds']) > 5:
            print(f"    ... and {len(r['backgrounds'])-5} more")
