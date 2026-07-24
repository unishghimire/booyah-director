import re
import os

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

def analyze_component(name, path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    lines = content.split('\n')
    
    # 1. Imports from overlayApi or props
    imports_api = False
    if "overlayApi" in content:
        imports_api = True
        
    api_calls = sorted(list(set(re.findall(r'overlayApi\.([a-zA-Z0-9_]+)', content))))
    prop_api_calls = sorted(list(set(re.findall(r'\bapi\.([a-zA-Z0-9_]+)', content))))
    
    # 2. TODOs/FIXMEs/placeholders
    todos = []
    for i, line in enumerate(lines):
        if any(w in line for w in ["TODO", "FIXME", "placeholder", "Placeholder"]):
            todos.append((i+1, line.strip()))
            
    # 3. Loading/Error states
    has_loading = any(w in content.lower() for w in ["loading", "isloading", "loader"])
    has_error = any(w in content.lower() for w in ["error", "err", "catch", "failed"])
    
    # Let's inspect potential undefined calls or references by analyzing variables used in handlers.
    # Let's also check for common issues.
    
    # 4. Check for undefined variables or other common UI bugs.
    # We will do some specific pattern matching for React bugs.
    # e.g., using a state setter that doesn't exist, or spelling bugs.
    
    # Let's check for console.log/console.error or missing props
    # Let's look for functions defined inside the component and check their parameters.
    component_defs = re.findall(r'export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)', content)
    if not component_defs:
        component_defs = re.findall(r'function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)', content)
    
    props = []
    if component_defs:
        props_str = component_defs[0][1]
        # remove spaces and braces
        props_str = props_str.replace('{', '').replace('}', '').strip()
        props = [p.strip() for p in props_str.split(',') if p.strip()]
        
    return {
        "name": name,
        "props": props,
        "imports_api": imports_api,
        "api_calls": api_calls,
        "prop_api_calls": prop_api_calls,
        "todos": todos,
        "has_loading": has_loading,
        "has_error": has_error,
        "lines_count": len(lines)
    }

for comp in components:
    path = find_file(comp)
    if not os.path.exists(path):
        print(f"File not found: {comp}")
        continue
    analysis = analyze_component(comp, path)
    print(f"Name: {analysis['name']}")
    print(f"Props: {analysis['props']}")
    print(f"Imports API: {analysis['imports_api']}")
    print(f"Direct API calls: {analysis['api_calls']}")
    print(f"Prop API calls: {analysis['prop_api_calls']}")
    print(f"TODOs: {len(analysis['todos'])}")
    print(f"Loading/Error: {analysis['has_loading']}/{analysis['has_error']}")
    print("-" * 40)
