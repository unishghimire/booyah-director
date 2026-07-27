with open("audit_report.txt", "r") as f:
    text = f.read()

# Let's search for "Uses old orange colors" and some lines following it
import re
matches = re.finditer(r"WARNING: Uses old orange colors:.*?(?===|COMPONENT:|$)", text, re.DOTALL)
for m in matches:
    print(m.group(0))
    print("-" * 40)
