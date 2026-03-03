from pathlib import Path
lines = Path('AINodes.js').read_text().splitlines()
for i,line in enumerate(lines,1):
    if 'findSafeSpawnLocation' in line or 'findSpawnPosition' in line or 'getRandomSpawnPosition' in line:
        print(f"line {i}: {line.strip()}")
        for j in range(max(1,i-2), min(len(lines), i+2)+1):
            if j != i:
                print(f"  context {j}: {lines[j-1].strip()}" )
        print()
