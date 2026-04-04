import json, pathlib, re
path = pathlib.Path('../NodeVisualRegistryNameAssignments.json')
j=json.loads(path.read_text(encoding='utf-8'))

roman = {0:'Zero',1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X'}

def node_number_to_phrase(n):
    try:
        x=int(n)
        if x in roman:
            return f'Harmonic {roman[x]}'
        return f'Harmonic {x}'
    except:
        return None

for k,v in j['nodes'].items():
    m=v.get('meaning','')
    if re.fullmatch(r'Node \d+', m):
        num = m.split()[1]
        new = node_number_to_phrase(num)
        if new:
            v['meaning']=new
    if re.match(r'\w+ Node', m) and m!='Patient Node':
        # drop trailing Node
        v['meaning']=m.replace(' Node','')

path.write_text(json.dumps(j, indent=2, ensure_ascii=False), encoding='utf-8')
print('node1/2 cleanup done')
