
import json
import yaml

# Load the query output
file_path = "/Users/maximilianoguzman/.gemini/antigravity/brain/9732280b-ea93-4abd-9d67-bba998bf11c2/.system_generated/steps/51/output.txt"

with open(file_path, 'r') as f:
    data = yaml.safe_load(f)

rut_map = {}
for doc in data:
    rut = doc.get('rut')
    if rut:
        if rut not in rut_map:
            rut_map[rut] = []
        rut_map[rut].append(doc)

to_delete = []
for rut, docs in rut_map.items():
    if len(docs) > 1:
        # Sort docs: keep the best one
        # 1. Prefer ones with cftestatalaricayparinacota.cl in email
        # 2. Prefer ones NOT starting with import-
        # 3. Prefer ones with more filled fields
        
        docs.sort(key=lambda x: (
            1 if x.get('email') and 'cftestatal' in x.get('email') else 0,
            1 if not str(x.get('id', '')).startswith('import-') else 0,
            len([k for k, v in x.items() if v])
        ), reverse=True)
        
        best = docs[0]
        others = docs[1:]
        
        for other in others:
            to_delete.append(other['__path__'])

# Also delete ALL docs where id starts with import- even if no duplicate found (junk data)
for doc in data:
    doc_id = str(doc.get('id', ''))
    path = doc['__path__']
    if doc_id.startswith('import-') and path not in to_delete:
        to_delete.append(path)

print("\n".join(to_delete))
