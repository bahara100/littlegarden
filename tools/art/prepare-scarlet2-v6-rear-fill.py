"""Record rear-only transparent seam fills; preserve the corrected front."""
from pathlib import Path
from PIL import Image
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/scarlet2-walk-v6'
BACK=ART/'before-shoulder-fill'
if not (BACK/'scarlet2-walk-ne-v6.pxo').exists():shutil.copyfile(ART/'scarlet2-walk-ne-v6.pxo',BACK/'scarlet2-walk-ne-v6.pxo')
front={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ART.glob('*') if p.is_file() and (p.name.startswith(('frame-se-','frame-sw-')) or p.name=='scarlet2-walk-se-v6.pxo')}
far=[[(71,81),(72,81),(71,82),(72,82),(71,83),(71,84),(71,85)],[(x,y) for y in range(80,85) for x in [71,72]],[(71,81),(72,81),(73,81)]+[(x,y) for y in range(82,86) for x in [71,72]],[(71,80),(72,80),(73,80)]+[(x,y) for y in range(81,85) for x in [71,72]]]
frames={};arm_counts=[];sheath_counts=[]
for n in range(1,5):
    im=Image.open(BACK/f'frame-ne-{n}.png').convert('RGBA');bob=-1 if n%2==0 else 0
    patches={}
    def add(x,y,c):
        if im.getpixel((x,y))[3]==0:patches[(x,y)]={'x':x,'y':y,'color':c}
    for x,y in far[n-1]:
        dy=y-(81+bob)
        c=('#ba7d69' if x==71 else '#da9b80' if x==72 else '#eeb499') if dy<=1 else ('#7e758a' if x==71 else '#beb5ca') if dy==2 else ('#4c465c' if x==71 else '#7e758a') if dy==3 else '#4e2c66'
        add(x,y,c)
    if n>1:add(60,80 if n%2==0 else 81,'#8250ac')
    add(71,91+bob,'#663c8c')
    arm_counts.append(len(patches))
    # Continue the existing diagonal sheath behind the moving left arm.
    rows={86:(55,['#463447','#55475c']),87:(53,['#efeaf4','#fffdf9']),88:(51,['#efeaf4','#fffdf9','#efeaf4','#d9d1e2']),89:(49,['#efeaf4','#fffdf9','#efeaf4','#d9d1e2','#beb5ca','#7e758a']),90:(50,['#beb5ca','#7e758a','#55475c','#352438'])}
    start=len(patches)
    for y,(x0,colors) in rows.items():
        for x,c in enumerate(colors,x0):add(x,y+bob,c)
    add(48,93+bob,'#352438')
    sheath_counts.append(len(patches)-start)
    frames[str(n)]=list(patches.values())
data={'direction':'ne','mirror':'nw','purpose':'Fill rear arm/body seams and existing scabbard root only; retain all original opaque pixels and corrected front.','armPixels':arm_counts,'scabbardPixels':sheath_counts,'frames':frames,'preservedFrontSha256':front}
(ART/'rear-shoulder-fill.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'arm':arm_counts,'sheath':sheath_counts,'total':[len(v) for v in frames.values()]}))
