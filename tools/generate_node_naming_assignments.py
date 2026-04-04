import re, json, pathlib
src = pathlib.Path('../NodeVisualRegistry.js').read_text(encoding='utf-8')
entries = {}
pattern = re.compile(r"(\d+)\s*:\s*\{\s*category\s*:\s*'([^']+)'\s*,\s*factoryName\s*:\s*'([^']+)'\s*,\s*archetypeTag\s*:\s*'([^']+)'", re.MULTILINE)
for m in pattern.finditer(src):
    vid = m.group(1)
    category = m.group(2)
    factoryName = m.group(3)
    archetypeTag = m.group(4)
    entries[vid] = {'category': category, 'factoryName': factoryName, 'archetypeTag': archetypeTag}

cat_map = {'input':'INP','process':'PRC','integration':'INT','analytics':'ANL','storage':'STR','control':'CTL','quantum':'QNT','sigma':'SGM','mythic':'MYT','prime':'PRM','error':'ERR','emotional':'EMO'}
tag_map = {'stabilizer':'SBR','pressure':'PRS','harmonizer':'HMR','amplifier':'AMP','risky':'RSK'}
pat_map = {'receptor':'RCT','gateway':'GTW','funnel':'FNL','sensor':'SNR','detector':'DTR','torus':'TOR','knot':'KNT','crystal':'CRY','lobe':'LOB','bloom':'BLM','seed':'SED','helix':'HLX','core':'COR','matrix':'MTX','vault':'VLT','node':'NDE','chamber':'CMB','ring':'RNG','input':'INP','process':'PRC'}

def make_abbr(txt, length=3):
    t = re.sub(r'[^A-Za-z0-9]+', ' ', txt).strip().upper()
    if not t:
        return 'UNK'
    tokens = t.split()
    if len(tokens) == 1:
        return tokens[0][:length].ljust(length, 'X')
    comb = ''.join(tokens)
    return comb[:length].ljust(length, 'X')


def infer_factory_code(factoryName):
    t = factoryName.lower().replace('_', ' ')
    for k, v in pat_map.items():
        if k in t:
            return v
    m = re.findall(r'[a-z]+', t)
    if m:
        return make_abbr(m[-1], 3)
    return 'NDE'


def infer_name(factoryName):
    t = re.sub(r'^create', '', factoryName, flags=re.IGNORECASE).replace('_', ' ')
    parts = re.findall(r'[A-Za-z][a-z]*|\d+', t)
    if not parts:
        return factoryName
    if parts and parts[0].lower() in {'input','process','integration','analytics','storage','control','quantum','sigma','mythic','prime','error','emotional'}:
        parts = parts[1:]
    if not parts:
        return factoryName
    parts = [p.capitalize() for p in parts]
    return ' '.join(parts)

for k, v in entries.items():
    category = v['category']
    archetypeTag = v['archetypeTag']
    factoryName = v['factoryName']
    code = f"{cat_map.get(category,'UNK')}-{tag_map.get(archetypeTag,'UNK')}-{infer_factory_code(factoryName)}"
    name = infer_name(factoryName)
    v['name'] = code
    v['meaning'] = name

out = {'nodes': entries}
path = pathlib.Path('../NodeVisualRegistryNameAssignments.json')
path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding='utf-8')
print('Done to', path)
