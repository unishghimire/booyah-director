import re

def extract_blocks(filepath):
    with open(filepath) as f:
        content = f.read()
    
    # We find all occurrences of "if (route ===" or "if (route ==="
    # and extract the full block by matching braces.
    # Note: we need to handle case where route is checked in various ways, e.g. "if (route === 'xyz') {"
    pattern = r'if\s*\(\s*route\s*===[^\{]*\{'
    matches = list(re.finditer(pattern, content))
    
    blocks = []
    for m in matches:
        start_idx = m.start()
        # Find the opening brace of this block
        brace_idx = content.find('{', start_idx)
        if brace_idx == -1:
            continue
        
        # Match braces
        count = 1
        curr_idx = brace_idx + 1
        while count > 0 and curr_idx < len(content):
            char = content[curr_idx]
            if char == '{':
                count += 1
            elif char == '}':
                count -= 1
            curr_idx += 1
        
        block_text = content[start_idx:curr_idx]
        # Extract the route names
        route_matches = re.findall(r'route\s*===\s*\'([^\'\s]+)\'', m.group(0))
        blocks.append({
            'routes': route_matches,
            'code': block_text,
            'start_line': content[:start_idx].count('\n') + 1,
            'end_line': content[:curr_idx].count('\n') + 1
        })
    return blocks

print("=== API/INDEX.JS BLOCKS ===")
api_blocks = extract_blocks('api/index.js')
print(f"Found {len(api_blocks)} block handlers in api/index.js")
for b in api_blocks[:5]:
    print(f"Routes: {b['routes']} (Lines {b['start_line']}-{b['end_line']})")

print("\n=== NETLIFY-APP/API/INDEX.JS BLOCKS ===")
net_blocks = extract_blocks('netlify-app/api/index.js')
print(f"Found {len(net_blocks)} block handlers in netlify-app/api/index.js")
for b in net_blocks[:5]:
    print(f"Routes: {b['routes']} (Lines {b['start_line']}-{b['end_line']})")
