import re

hex_re = re.compile(r'#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b')

def get_hex_colors(path):
    colors = {}
    with open(path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            found = hex_re.findall(line)
            for h in found:
                colors[h.lower()] = colors.get(h.lower(), []) + [idx + 1]
    return colors

hex_overlay = get_hex_colors("netlify-app/src/pages/Overlay.jsx")
hex_ffws = get_hex_colors("netlify-app/src/pages/FFWSOverlays.jsx")

print("=== HEX COLORS IN OVERLAY.JSX ===")
for c, lines in sorted(hex_overlay.items()):
    print(f"  {c}: found on {len(lines)} lines, first few: {lines[:5]}")

print("\n=== HEX COLORS IN FFWSOVERLAYS.JSX ===")
for c, lines in sorted(hex_ffws.items()):
    print(f"  {c}: found on {len(lines)} lines, first few: {lines[:5]}")
