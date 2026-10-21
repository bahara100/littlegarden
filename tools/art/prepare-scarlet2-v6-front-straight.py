"""Preserve V6 and replace the front sheath's uneven column steps by one line."""
from pathlib import Path
import json,shutil,hashlib
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'docs/art/pixel/scarlet2-walk-v6'
BACK=ART/'before-front-scabbard-straight';BACK.mkdir(exist_ok=True)
names=['scarlet2-walk-se-v6.pxo']+[f'{k}-se-{n}.png' for k in ['frame','core','joint','outline'] for n in range(1,5)]
for name in names:
    if not (BACK/name).exists():shutil.copyfile(ART/name,BACK/name)
old=json.loads((ART/'scabbard-line.json').read_text())['columns']['se']
new=[[x,88+int((x-79)*2/7+0.5),94+int((x-79)*2/7+0.5)] for x in range(79,101)]
rear={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ART.iterdir() if p.is_file() and (p.name.startswith(('frame-ne-','frame-nw-')) or p.name=='scarlet2-walk-ne-v6.pxo')}
(ART/'front-scabbard-straight.json').write_text(json.dumps({'purpose':'Front sheath only: parallel straight edges, same x extent, same gold tip and length. Rear unchanged.','oldColumns':old,'columns':new,'bobY':[0,-1,0,-1],'preservedRearSha256':rear},indent=2),encoding='utf8')
print('Saved front sheath backup and straight column bounds.')
