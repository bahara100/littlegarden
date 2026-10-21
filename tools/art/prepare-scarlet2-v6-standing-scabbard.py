"""Use the approved standing sheath drawing as the front walking source."""
from pathlib import Path
from PIL import Image
import json,shutil
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'docs/art/pixel/scarlet2-walk-v6'
BACK=ART/'before-front-scabbard-standing';BACK.mkdir(exist_ok=True)
for name in ['scarlet2-walk-se-v6.pxo','front-scabbard-straight.json']+[f'{k}-se-{n}.png' for k in ['frame','core','joint','outline'] for n in range(1,5)]:
    if not (BACK/name).exists():shutil.copyfile(ART/name,BACK/name)
data=json.loads((BACK/'front-scabbard-straight.json').read_text())
ref=Image.open(ROOT/'docs/art/pixel/scarlet2-base-v2/idle-se.png').convert('RGBA')
cols=[[79,88,92],[80,88,92],[81,89,93],[82,89,93]]
for x in range(83,105):
    ys=[y for y in range(89,102) if ref.getpixel((x,y))[3]>0]
    cols.append([x,min(ys),max(ys)])
data['oldColumns']=data['oldColumns']+data['columns']
data['columns']=cols
data['mode']='approved-standing-pixels'
data['referenceSource']='docs/art/pixel/scarlet2-base-v2/idle-se.png'
data['referenceStartX']=83
data['purpose']='Restore approved standing V2 sheath angle, silhouette, pixels and gold tip in front walking frames. Draw only the root hidden by the standing hand. Rear and other artwork unchanged.'
(ART/'front-scabbard-straight.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared approved standing sheath source and preserved current front artwork.')
