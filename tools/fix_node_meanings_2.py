import json, pathlib
path = pathlib.Path('../NodeVisualRegistryNameAssignments.json')
j=json.loads(path.read_text(encoding='utf-8'))
for k,v in j['nodes'].items():
    m=v.get('meaning','')
    if m=='Node':
        if v['category']=='process':
            v['meaning']='Process Unit'
        elif v['category']=='integration':
            v['meaning']='Integration Unit'
        elif v['category']=='analytics':
            v['meaning']='Analytics Unit'
        else:
            v['meaning']='Generic Unit'
    if m.lower().startswith('node styled'):
        v['meaning']='Styled Variant'
path.write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding='utf-8')
print('applied node cleanup')
