with open("detailed_audit.py", "r") as f:
    pass

import re

# Let's search lines in Overlay.jsx and FFWSOverlays.jsx that contain orange, amber, #FF6B00, #FF8C00
orange_pattern = re.compile(r'\b(orange|amber|#FF6B00|#FF8C00)\b', re.IGNORECASE)

print("--- ORANGES IN OVERLAY.JSX ---")
with open("netlify-app/src/pages/Overlay.jsx", "r") as f:
    for idx, line in enumerate(f):
        if orange_pattern.search(line):
            print(f"Line {idx+1}: {line.strip()}")

print("\n--- ORANGES IN FFWSOVERLAYS.JSX ---")
with open("netlify-app/src/pages/FFWSOverlays.jsx", "r") as f:
    for idx, line in enumerate(f):
        if orange_pattern.search(line):
            print(f"Line {idx+1}: {line.strip()}")
