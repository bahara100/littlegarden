"""Back up V6 and describe only the missing arm/body seam pixels."""
from pathlib import Path
import json,hashlib,shutil
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/scarlet2-walk-v6'
BACKUP=ART/'before-shoulder-fill'
BACKUP.mkdir(exist_ok=True)
names=['scarlet2-walk-se-v6.pxo','manifest.json']+[f'frame-{d}-{n}.png' for d in ['se','sw','ne','nw'] for n in range(1,5)]
names += [f'{kind}-{d}-{n}.png' for kind in ['core','legs','cap','near','far'] for d in ['se','ne'] for n in range(1,5)]
for name in names:
    if not (BACKUP/name).exists():shutil.copyfile(ART/name,BACKUP/name)
shoulder=[[(55,81),(56,81),(57,81),(56,82),(57,82),(57,83)],[(55,80),(56,80),(57,80),(56,81),(57,81)],[(57,81),(57,82),(57,83)],[(54,80),(55,80),(56,80),(57,80),(55,81),(56,81),(57,81),(57,82)]]
frames={}
for n,points in enumerate(shoulder,1):
    points=[{'x':x,'y':y,'color':'#eeb499' if x<=55 else '#da9b80' if x==56 else '#ba7d69'} for x,y in points]
    if n==1:points += [{'x':55,'y':86,'color':'#7e758a'},{'x':55,'y':87,'color':'#7e758a'},{'x':54,'y':88,'color':'#beb5ca'}]
    # The old stationary hand hid this portion of the existing sheath. Fill
    # that missing root, keeping every existing scabbard pixel and its tip.
    bob=-1 if n%2==0 else 0
    rows={89:['#463447','#beb5ca','#efeaf4','#efeaf4'],90:['#7e758a','#efeaf4','#fffdf9','#fffdf9'],91:['#7e758a','#d9d1e2','#efeaf4','#fffdf9'],92:['#352438','#7e758a','#beb5ca','#d9d1e2']}
    for y,colors in rows.items():
        for x,c in enumerate(colors,79):points.append({'x':x,'y':y+bob,'color':c})
    for x in [79,85,86,87]:points.append({'x':x,'y':95+bob,'color':'#352438' if x==79 else '#7e758a' if x==85 else '#beb5ca' if x==86 else '#d9d1e2'})
    original=Image.open(BACKUP/f'frame-se-{n}.png').convert('RGBA')
    # In poses 2 and 3 a moving arm already covers part of the root; keep it.
    points=[p for p in points if original.getpixel((p['x'],p['y']))[3]==0]
    for p in points:assert original.getpixel((p['x'],p['y']))[3]==0
    frames[str(n)]=points
record={'purpose':'Fill only transparent arm/body seam and existing scabbard root pixels requested in screenshots; no original opaque pixel changes.','direction':'se','mirror':'sw','armPixels':[9,5,3,8],'scabbardPixels':[20,17,13,20],'frames':frames,'baselineSha256':{name:hashlib.sha256((BACKUP/name).read_bytes()).hexdigest() for name in names}}
(ART/'shoulder-fill.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'nativePixelsToFill':[len(frames[str(n)]) for n in range(1,5)]}))
