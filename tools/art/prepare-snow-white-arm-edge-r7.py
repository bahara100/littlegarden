"""Preserve R6 before trimming only the exposed old shoulder-root overhang."""
from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[2]/'docs/art/pixel/snow-white-walk-v1'
backup=root/'before-arm-edge-r7'
backup.mkdir(exist_ok=True)
if not (backup/'baseline.json').exists():
    files=[p for p in root.iterdir() if p.suffix in ['.png','.pxo']]
    for p in files:shutil.copyfile(p,backup/p.name)
    (backup/'baseline.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2))
print('R6 saved')
