"""Keep the complete R5 front and rear artwork before the requested rear frame3 edit."""
from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[2]/'docs/art/pixel/snow-white-walk-v1'
backup=root/'before-rear-arm-r6'
backup.mkdir(exist_ok=True)
if not (backup/'baseline.json').exists():
    files=[p for p in root.iterdir() if p.suffix in ['.png','.pxo']]
    for p in files:shutil.copyfile(p,backup/p.name)
    (backup/'baseline.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2))
print('R5 saved')
