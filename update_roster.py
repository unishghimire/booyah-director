with open('netlify-app/src/pages/Overlay.jsx', 'r') as f:
    content = f.read()

# Let's find the boundaries of TeamRosterCard and TeamRosterScreen.
# It starts at:
# /* ══════════════════════════════════════════════════
#    SCREEN: TEAM ROSTER (6 teams per slide, auto-cycles)
# ══════════════════════════════════════════════════ */
# function TeamRosterCard({ team, primary, secondary, design }) {
# and ends right before:
# export default function Overlay() {

start_marker = "/* ══════════════════════════════════════════════════\n   SCREEN: TEAM ROSTER (6 teams per slide, auto-cycles)\n══════════════════════════════════════════════════ */"
end_marker = "export default function Overlay()"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

print(f"Start index: {start_idx}, End index: {end_idx}")
if start_idx != -1 and end_idx != -1:
    print("Found both markers!")
else:
    print("Failed to find markers!")
