from pathlib import Path
path = Path('NodeLinkingSystem.js')
lines = path.read_text(encoding='utf-8').splitlines()
for i in range(2660, 2745):
    print(f"{i+1}: {lines[i]}")
