import re, pathlib
E=pathlib.Path('EnhancedNodeModels.js').read_text()
# collect declared factory functions names after 'static ' prefix
names=set()
for m in re.finditer(r"static\s+(create\w+)",E):
    names.add(m.group(1))
# also functions assigned via function createX(...) pattern not static? skip
text = pathlib.Path('NodeVisualRegistry.js').read_text()
pat = re.compile(r"(\d+):\s*\{\s*category:\s*'([^']+)',\s*factoryName:\s*'([^']+)'\s*}\s*,?")
entries=[(int(m.group(1)),m.group(2),m.group(3)) for m in pat.finditer(text)]
fact_names={f for _,_,f in entries}
missing=[f for f in sorted(fact_names) if f not in names and f" {f}" not in E]
print('declared static factories',len(names))
print('registry factories',len(fact_names))
for f in missing[:50]:
    print('NOT_STATIC',f)
