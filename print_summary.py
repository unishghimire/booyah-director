with open("audit_report.txt", "r") as f:
    lines = f.readlines()

# Print first 50 lines to see the summary of components
for i in range(50):
    if i < len(lines):
        print(lines[i], end="")
