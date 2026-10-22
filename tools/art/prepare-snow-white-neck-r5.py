"""Preserve the user's approved R4 hair and moving limbs before central collar repair."""
from pathlib import Path
import hashlib, json, shutil
root=Path(__file__).resolve().parents[2]/'docs/art/pixel/snow-white-walk-v1'
backup=root/'before-neck-stabilize'
backup.mkdir(exist_ok=True)
if not (backup/'baseline.json').exists():
    names=[]
    for p in root.iterdir():
        if p.suffix=='.png' and p.name.startswith(('frame-','body-','head-','front-arm-','editor-')) or p.suffix=='.pxo':
            shutil.copyfile(p,backup/p.name)
            names.append(p.name)
    (backup/'baseline.json').write_text(json.dumps({n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in names},indent=2))
print('R4 baseline preserved:',len(json.loads((backup/'baseline.json').read_text())))
