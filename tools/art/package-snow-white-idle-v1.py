"""Package native Pixelorama exports; no game or previous artwork is changed."""
from pathlib import Path
import hashlib, json, shutil, zipfile
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT/'docs/art/pixel/snow-white-idle-v1'
PUBLIC = ROOT/'apps/client/public/snow-white-idle-v1'
PUBLIC.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART/'palette.json').read_text())}
report = {'name':'스노우화이트', 'status':'사용자 작화 검수 전', 'runtimeConnected':False,
          'frameSize':128, 'framesPerDirection':1, 'paletteLimit':len(palette),
          'tool':'Built-in ImageGen + native Pixelorama GDScript',
          'method':'Base-referenced coherent full-body drawing, then whole-sprite alignment. No base limb replacement.',
          'mirrors':{'sw':'se','nw':'ne'}, 'directions':{}}
sheet = Image.new('RGBA',(256,256))
for i,d in enumerate(['se','sw','ne','nw']):
    im = Image.open(ART/f'idle-{d}.png').convert('RGBA')
    a = np.array(im)
    assert im.size==(128,128)
    assert set(np.unique(a[:,:,3])) <= {0,255}
    assert {tuple(p) for p in a[a[:,:,3]>0,:3]} <= palette
    assert im.getbbox()[3]==115
    if d in ('se','ne'):
        editor=np.array(Image.open(ART/f'editor-{d}.png').convert('RGBA'))
        assert np.array_equal(editor,a), 'PXO export and packaged sprite differ'
        joined=Image.new('RGBA',(128,128))
        for part in ('body','head'):
            joined.alpha_composite(Image.open(ART/f'{part}-{d}.png').convert('RGBA'))
        assert np.array_equal(np.array(joined),a)
    else:
        orig=Image.open(ART/f'idle-{"se" if d=="sw" else "ne"}.png').convert('RGBA')
        assert np.array_equal(a,np.array(orig)[:,::-1])
    report['directions'][d]={'sha256':sha(ART/f'idle-{d}.png'), 'bounds':im.getbbox(),
        'visibleColors':len(np.unique(a[a[:,:,3]>0,:3],axis=0))}
    sheet.alpha_composite(im,(i%2*128,i//2*128))
    shutil.copyfile(ART/f'idle-{d}.png',PUBLIC/f'idle-{d}.png')
sheet.save(ART/'idle-four.png')
sheet.resize((768,768),Image.Resampling.NEAREST).save(ART/'idle-four-preview.png')
(ART/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for f in ('idle-four.png','idle-four-preview.png','palette.json','manifest.json','prompt.txt'):
    shutil.copyfile(ART/f,PUBLIC/f)
# Padded pose references use the same source pixel scale, not a claim of identical anatomy.
for d,p in [('se','garden-body-base-v2/base-idle-se.png'),('ne','garden-friends-base-walk-v2/base-idle-ne.png')]:
    base=Image.new('RGBA',(128,128));base.alpha_composite(Image.open(ROOT/'docs/art/pixel'/p).convert('RGBA'),(16,24))
    base.save(PUBLIC/f'base-{d}.png')
with zipfile.ZipFile(PUBLIC/'snow-white-idle-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(ART.iterdir()):
        if p.suffix in ('.pxo','.json','.txt','.png','.md'):
            z.write(p,p.name)
    z.write(ROOT/'tools/art/build-snow-white-idle-v1.gd','build-snow-white-idle-v1.gd')
print(json.dumps(report,ensure_ascii=False,indent=2))
