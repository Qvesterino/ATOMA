import re,itertools,json
text_reg=open('NodeVisualRegistry.js',encoding='utf-8').read()
regentries={}
for m in re.finditer(r'^(\s*)(\d+)\s*:\s*\{([^}]+)\}',text_reg,re.M):
    code=int(m.group(2))
    body=m.group(3)
    cat=re.search(r"category:\s*'([^']+)'",body)
    factory=re.search(r"factoryName:\s*'([^']+)'",body)
    regentries[code]={'category':cat.group(1) if cat else None,'factory':factory.group(1) if factory else None}

pools={}
for code,defn in regentries.items():
    cat=defn['category']
    pools.setdefault(cat,[]).append(code)
for codes in pools.values(): codes.sort()

text_ai=open('AINodes.js',encoding='utf-8').read()
val_match=re.search(r'availableCategories\s*=\s*\[(.*?)\];',text_ai,re.S)
validator_categories=[]
if val_match:
    validator_categories=[s.strip(" '""\n") for s in val_match.group(1).split(',') if s.strip()]

regcats=[v['category'] for v in regentries.values() if v['category']]
cats=sorted(set(validator_categories)|set(pools.keys())|set(regcats))
cat_rows=[{'category':c,'in_validator':c in validator_categories,'in_pool':c in pools,'in_registry':c in regcats} for c in cats]

poolinfo={}
for cat,codes in pools.items():
    issues=[]
    if not codes: issues.append('empty')
    if len(codes)!=len(set(codes)): issues.append('dupes')
    poolinfo[cat]={'len':len(codes),'codes':codes,'issues':issues}

poolcodes=set(itertools.chain.from_iterable(pools.values()))
unreachable=[c for c in regentries if c not in poolcodes]
missing_factory=[c for c,v in regentries.items() if not v['factory']]
missing_cat=[c for c,v in regentries.items() if not v['category']]

print(json.dumps({'cat_rows':cat_rows,'poolinfo':poolinfo,'unreachable':unreachable,'missing_factory':missing_factory,'missing_cat':missing_cat},indent=2))
