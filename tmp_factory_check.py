import re, pathlib, json
text = pathlib.Path('NodeVisualRegistry.js').read_text()
pat = re.compile(r"(\d+):\s*\{\s*category:\s*'([^']+)',\s*factoryName:\s*'([^']+)'\s*}\s*,?")
entries=[(int(m.group(1)),m.group(2),m.group(3)) for m in pat.finditer(text)]
fact_names={f for _,_,f in entries}
E = pathlib.Path('EnhancedNodeModels.js').read_text()
missing=[]
for f in sorted(fact_names):
    if f not in E:
        missing.append(f)
print('total factories',len(fact_names),'missing',len(missing))
for m in missing:
    print('MISSING',m)
