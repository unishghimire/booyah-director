import re
from parse_routes import extract_blocks

def analyze_block(filepath, block):
    code = block['code']
    routes = block['routes']
    start_line = block['start_line']
    end_line = block['end_line']
    
    # Check Try-Catch
    has_try = 'try' in code
    
    # Check sanitization
    # We look for references to body.xxx or query.xxx
    # and whether they are wrapped in sanitizeString/sanitizeNumber/sanitizeUrl/Number/parseInt
    body_fields = re.findall(r'body\.([a-zA-Z0-9_]+)', code)
    query_fields = re.findall(r'query\.([a-zA-Z0-9_]+)', code)
    
    # Check if there is sanitization functions used
    uses_sanitize = any(f in code for f in ['sanitizeString', 'sanitizeNumber', 'sanitizeUrl', 'Number(', 'parseInt('])
    
    # Check namespacing
    # Look for db reference and if it uses 'uid' or similar. 
    # Since loadDb(uid) is called before these handlers, is db being written to saveDb(uid, db)?
    uses_uid = 'uid' in code or 'user.uid' in code or 'loadDb' in code
    saves_db = 'saveDb' in code
    
    # Check if there are any TODOs or incomplete parts in this block
    todos = [line for line in code.splitlines() if 'todo' in line.lower() or 'incomplete' in line.lower()]
    
    return {
        'routes': routes,
        'start_line': start_line,
        'end_line': end_line,
        'has_try': has_try,
        'body_fields': sorted(list(set(body_fields))),
        'query_fields': sorted(list(set(query_fields))),
        'uses_sanitize': uses_sanitize,
        'uses_uid': uses_uid,
        'saves_db': saves_db,
        'todos': todos,
        'code_len': len(code)
    }

print("=== AUDIT FOR api/index.js ===")
api_blocks = extract_blocks('api/index.js')
for b in api_blocks:
    analysis = analyze_block('api/index.js', b)
    print(f"Routes: {analysis['routes']} (L{analysis['start_line']}-{analysis['end_line']})")
    print(f"  Has Try: {analysis['has_try']} | Saves DB: {analysis['saves_db']} | Uses Sanitization: {analysis['uses_sanitize']}")
    if analysis['body_fields']:
        print(f"  Body fields: {analysis['body_fields']}")
    if analysis['query_fields']:
        print(f"  Query fields: {analysis['query_fields']}")
    if analysis['todos']:
        print(f"  TODOS: {analysis['todos']}")
    # Look for potential missing sanitization:
    # If there are body fields but no sanitization functions are mentioned in the block
    if analysis['body_fields'] and not analysis['uses_sanitize']:
        print(f"  [WARNING] May be missing sanitization for fields: {analysis['body_fields']}")

print("\n=== AUDIT FOR netlify-app/api/index.js ===")
net_blocks = extract_blocks('netlify-app/api/index.js')
for b in net_blocks:
    analysis = analyze_block('netlify-app/api/index.js', b)
    print(f"Routes: {analysis['routes']} (L{analysis['start_line']}-{analysis['end_line']})")
    print(f"  Has Try: {analysis['has_try']} | Saves DB: {analysis['saves_db']} | Uses Sanitization: {analysis['uses_sanitize']}")
    if analysis['body_fields']:
        print(f"  Body fields: {analysis['body_fields']}")
    if analysis['query_fields']:
        print(f"  Query fields: {analysis['query_fields']}")
    if analysis['todos']:
        print(f"  TODOS: {analysis['todos']}")
    if analysis['body_fields'] and not analysis['uses_sanitize']:
        print(f"  [WARNING] May be missing sanitization for fields: {analysis['body_fields']}")

