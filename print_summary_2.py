with open("audit_report.txt", "r") as f:
    lines = f.readlines()

for i in range(50, 160):
    if i < len(lines):
        print(lines[i], end="")
