import json, pathlib, re
path = pathlib.Path('../NodeVisualRegistryNameAssignments.json')
j = json.loads(path.read_text(encoding='utf-8'))

replacements = {
    'Node Styled V 2': 'Styled Node Variant II',
    'Node 2': 'Harmonic Node II',
    'Node 3': 'Harmonic Node III',
    'Node 0': 'Prime Node Zero',
    'Folded': 'Petal-Folded Structure',
}

for k,v in j['nodes'].items():
    meaning = v.get('meaning','')
    if meaning in replacements:
        v['meaning'] = replacements[meaning]

    if meaning.startswith('Node ') and len(meaning.split()) <= 3:
        base = meaning.replace('Node ', '').strip()
        if base and not base.isdigit():
            v['meaning'] = base

    if ' Node' in v['meaning'] and v['meaning'].count(' Node') > 0:
        v['meaning'] = v['meaning'].replace(' Node', '')

    v['meaning'] = re.sub(r'\s+', ' ', v['meaning']).strip()

path.write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding='utf-8')
print('updated', path)
