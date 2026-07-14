with open('netlify-app/src/pages/Overlay.jsx', 'r') as f:
    lines = f.readlines()

print("Line 785 context:")
for i in range(770, 795):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end="")
