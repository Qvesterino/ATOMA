import re, pathlib, collections
text = pathlib.Path('NodeVisualRegistry.js').read_text()
pat = re.compile(r"(\d+):\s*\{\s*category:\s*'([^']+)',\s*factoryName:\s*'([^']+)'\s*}\s*,?")
entries = [(int(m.group(1)), m.group(2), m.group(3)) for m in pat.finditer(text)]
by_cat = collections.defaultdict(list)
for code, cat, fac in entries:
    by_cat[cat].append((code, fac))
print('categories', len(by_cat))
for cat in sorted(by_cat):
    codes = [c for c,_ in by_cat[cat]]
    print(cat, 'len', len(codes), 'min', min(codes), 'max', max(codes))
    print(' codes', codes)
