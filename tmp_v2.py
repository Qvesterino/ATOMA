import re, pathlib
text=pathlib.Path('NodeVisualRegistry.js').read_text()
pat=re.compile(r"(\d+):\s*\{\s*category:\s*'([^']+)',\s*factoryName:\s*'([^']+)'\s*}\s*,?")
entries=[(int(m.group(1)),m.group(2),m.group(3)) for m in pat.finditer(text)]
V2=[e for e in entries if 'V2' in e[2] or 'Enhanced' in e[2]]
print('Enhanced/V2 entries',len(V2))
from collections import defaultdict
by=defaultdict(list)
for code,cat,f in V2:
    by[cat].append((code,f))
for cat in sorted(by):
    print(cat, len(by[cat]))
    for code,f in sorted(by[cat]):
        print(' ',code,f)
