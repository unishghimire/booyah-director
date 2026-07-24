import os
import re

components = [
    "BroadcastDashboard.jsx",
    "TournamentManager.jsx",
    "TournamentSetup.jsx",
    "LiveControlPanel.jsx",
    "MatchControls.jsx",
    "KillPanel.jsx",
    "KillFeedLog.jsx",
    "StandingsTable.jsx",
    "TeamRoster.jsx",
    "PlayerManager.jsx",
    "ScreenSwitcher.jsx",
    "EventTimeline.jsx",
    "ThemeManager.jsx",
    "AssetManager.jsx",
    "OCRRegionDesigner.jsx",
    "DesignStudio.jsx",
    "MVPCard.jsx",
    "ChampionsCard.jsx",
    "SheetImport.jsx",
    "ImageUpload.jsx"
]

def find_file(name):
    if name == "ImageUpload.jsx":
        return "netlify-app/src/components/ImageUpload.jsx"
    else:
        return f"netlify-app/src/components/control/{name}"

results = {}

for name in components:
    path = find_file(name)
    if not os.path.exists(path):
        results[name] = {"error": f"File not found at {path}"}
        continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    lines = content.split('\n')
    
    # 1. Imports from overlayApi
    imports_api = False
    api_imports = []
    if "overlayApi" in content:
        imports_api = True
        
    api_calls = sorted(list(set(re.findall(r'overlayApi\.([a-zA-Z0-9_]+)', content))))
    prop_api_calls = sorted(list(set(re.findall(r'\bapi\.([a-zA-Z0-9_]+)', content))))
    
    todos = []
    for i, line in enumerate(lines):
        if any(w in line for w in ["TODO", "FIXME", "placeholder", "Placeholder"]):
            todos.append((i+1, line.strip()))
            
    has_loading = any(w in content.lower() for w in ["loading", "isloading"])
    has_error = any(w in content.lower() for w in ["error", "err", "catch"])
    
    results[name] = {
        "path": path,
        "length": len(lines),
        "imports_api": imports_api,
        "api_calls": api_calls,
        "prop_api_calls": prop_api_calls,
        "todos": todos,
        "has_loading": has_loading,
        "has_error": has_error
    }

for k, v in results.items():
    print(f"=== {k} ===")
    if "error" in v:
        print(v["error"])
        continue
    print(f"Lines: {v['length']}")
    print(f"Imports/uses overlayApi: {v['imports_api']}")
    if v['api_calls']:
        print(f"  Calls directly: {v['api_calls']}")
    if v['prop_api_calls']:
        print(f"  Calls via 'api.': {v['prop_api_calls']}")
    print(f"TODOs/FIXMEs found ({len(v['todos'])}):")
    for t in v['todos'][:10]:
        print(f"  Line {t[0]}: {t[1]}")
    if len(v['todos']) > 10:
        print(f"  ... and {len(v['todos']) - 10} more")
    print(f"Has Loading handling: {v['has_loading']}, Error handling: {v['has_error']}")
    print()
