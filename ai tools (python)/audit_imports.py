import re
import os

# Vsetky JS subory v hlavnom priecinku
all_files = [f for f in os.listdir(".") if f.endswith(".js") and os.path.isfile(f)]

# Importy z main.js
with open("main.js", "r", encoding="utf-8") as f:
    content = f.read()

# Najdeme vsetky importy
imports = re.findall(r'from [\'"]([^\'"]+)[\'"]', content)

imported_files = set()
for imp in imports:
    filename = imp.split("/")[-1]
    imported_files.add(filename)

print(f"Total JS files in root: {len(all_files)}")
print(f"Files imported in main.js: {len(imported_files)}")
print()

# Najst nepripojene subory
unconnected = [f for f in all_files if f not in imported_files]

print("=== UNCONNECTED FILES ===")
for f in sorted(unconnected):
    print(f)
print()
print(f"Count: {len(unconnected)}")