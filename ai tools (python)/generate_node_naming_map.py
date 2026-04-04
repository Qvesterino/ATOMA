import re, json

file_path = '../NodeVisualRegistry.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'export\s+const\s+NODE_VISUAL_REGISTRY\s*=\s*\{([\s\S]*)\}\s*;?', text)
if not match:
    raise SystemExit('NODE_VISUAL_REGISTRY object not found')
body = match.group(1)

entry_re = re.compile(r"(\d+)\s*:\s*\{([^}]*)\}")
rows = []
for m in entry_re.finditer(body):
    key = m.group(1)
    obj_text = m.group(2)
    category = re.search(r"category\s*:\s*'([^']*)'", obj_text)
    factory = re.search(r"factoryName\s*:\s*'([^']*)'", obj_text)
    arche = re.search(r"archetypeTag\s*:\s*'([^']*)'", obj_text)
    if category and factory and arche:
        rows.append({
            'code': key,
            'category': category.group(1),
            'factoryName': factory.group(1),
            'archetypeTag': arche.group(1)
        })

categories = sorted({r['category'] for r in rows})
archetypes = sorted({r['archetypeTag'] for r in rows})

pattern_map = {
    'knot': 'KNOT', 'torus': 'TOR', 'orb': 'ORB', 'hex': 'HEX', 'lattice': 'LTR',
    'spine': 'SPN', 'crown': 'CRW', 'fractal': 'FRM', 'wave': 'WVE', 'cluster': 'CRW',
    'vault': 'ORB', 'node': 'ORB', 'core': 'CRW', 'ring': 'TOR', 'matrix': 'LTR'
}

def infer_pattern(factory):
    low = factory.lower()
    for tok, pat in pattern_map.items():
        if tok in low:
            return pat
    return 'ORB'

origing_map = {
    'input': 'QNT', 'process': 'SIG', 'integration': 'NEX', 'analytics': 'AET',
    'storage': 'UMB', 'control': 'ASC', 'quantum': 'QNT', 'sigma': 'SIG',
    'mythic': 'LGD', 'prime': 'PRM', 'error': 'FLX', 'emotional': 'ECO'
}

signature_map = {
    'stabilizer': 'HLD', 'pressure': 'CPL', 'harmonizer': 'SYN', 'amplifier': 'PRM',
    'risky': 'BRK', 'default': 'RSP'
}

suggested = {}
for r in rows:
    cat = r['category']
    tag = r['archetypeTag']
    factory = r['factoryName']
    origin = origing_map.get(cat, 'SIG')
    sig = signature_map.get(tag, signature_map['default'])
    pat = infer_pattern(factory)
    suggested[cat] = f"{origin}-{pat}-{sig}"

output = {
    'categories': categories,
    'archetypeTags': archetypes,
    'suggestedCategoryToCode': suggested,
    'summary': {
        'totalEntries': len(rows),
        'uniqueCategories': len(categories),
        'uniqueArchetypes': len(archetypes)
    },
    'entriesExample': rows[:10]
}

out_path = '../NodeVisualRegistryNamingMap.json'
with open(out_path, 'w', encoding='utf-8') as out:
    json.dump(output, out, indent=2)

print('Generated', out_path)
print(json.dumps(output['summary'], indent=2))
