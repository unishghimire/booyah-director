with open('/app/netlify-app/src/pages/Overlay.jsx', 'r') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
# Let's print out lines 400 to 500
for i in range(400, 500):
    print(f"{i+1}: {lines[i]}", end="")
