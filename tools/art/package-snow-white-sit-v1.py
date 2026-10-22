"""Validate native seated drawings and package a review; no game integration."""
from pathlib import Path
import hashlib,json,shutil,zipfile
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/snow-white-sit-v1'
IDLE=ROOT/'docs/art/pixel/snow-white-idle-v1'
PUBLIC=ROOT/'apps/client/public/snow-white-sit-v1'
PUBLIC.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
preserved=json.loads((ART/'preserved-sources.json').read_text())
for name,h in preserved.items():assert sha(ROOT/name)==h,name
palette={tuple(bytes.fromhex(c[1:])) for c in json.loads((ART/'palette.json').read_text())}
load=lambda p:Image.open(p).convert('RGBA')
report={'name':'스노우화이트 앉기 V1','status':'사용자 검수 전','frameSize':128,
        'framesPerDirection':1,'runtimeConnected':False,'paletteLimit':48,
        'preservedSourceFiles':len(preserved),'tool':'Built-in ImageGen + native Pixelorama',
        'headRowsIdenticalToStanding':[0,67],'method':'Coherent seated body from shoulders through feet; common base posture reference; no leg silhouette replacement.',
        'mirrors':{'sw':'se','nw':'ne'},'directions':{}}
sheet=Image.new('RGBA',(256,256))
for i,d in enumerate(['se','sw','ne','nw']):
    im=load(ART/f'sit-{d}.png');a=np.array(im)
    assert im.size==(128,128) and set(np.unique(a[:,:,3]))<={0,255}
    assert {tuple(p) for p in a[a[:,:,3]>0,:3]}<=palette
    src='se' if d in ['se','sw'] else 'ne'
    if d==src:
        assert np.array_equal(a,np.array(load(ART/f'editor-{d}.png')))
        assert np.array_equal(a[:68],np.array(load(IDLE/f'idle-{d}.png'))[:68])
        joined=Image.new('RGBA',(128,128))
        for part in ['body','head']:joined.alpha_composite(load(ART/f'{part}-{d}.png'))
        assert np.array_equal(a,np.array(joined))
        before=np.array(load(ART/f'before-boot-detail-{d}.png'));body=np.array(load(ART/f'body-{d}.png'))
        assert np.array_equal(before[:,:,3],body[:,:,3])
        boot_reference=body
        if d=='ne' and (ART/'before-rear-coverage/body-ne.png').exists():
            boot_reference=np.array(load(ART/'before-rear-coverage/body-ne.png'))
            coverage=np.any(body!=boot_reference,axis=2);cy,cx=np.where(coverage)
            assert len(cy)>0 and cy.min()>=85 and cy.max()<=93 and cx.min()>=52 and cx.max()<=79
            assert np.array_equal(body[:,:,3],boot_reference[:,:,3])
            assert np.array_equal(body[94:],boot_reference[94:]),'Bandage/boots must remain unchanged'
            report['rearCoverage']={'changedPixels':int(coverage.sum()),'bounds':[int(cx.min()),int(cy.min()),int(cx.max()+1),int(cy.max()+1)],'bootsIdentical':True,'alphaIdentical':True}
        changed=np.any(before!=boot_reference,axis=2);yy,xx=np.where(changed)
        assert yy.min()>=96 and xx.min()>=60
        report['directions'][d]={'sha256':sha(ART/f'sit-{d}.png'),'bounds':im.getbbox(),
            'bootShadingPixels':int(changed.sum()),'headPreserved':True,'editorPngMatches':True}
    else:assert np.array_equal(a,np.array(load(ART/f'sit-{src}.png'))[:,::-1])
    sheet.alpha_composite(im,(i%2*128,i//2*128))
    shutil.copyfile(ART/f'sit-{d}.png',PUBLIC/f'sit-{d}.png')
    shutil.copyfile(IDLE/f'idle-{d}.png',PUBLIC/f'idle-{d}.png')
sheet.save(ART/'sit-four.png')
sheet.resize((768,768),Image.Resampling.NEAREST).save(ART/'sit-four-preview.png')
for d in ['se','ne']:
    proof=Image.new('RGBA',(96,36))
    # Comparison only; these crops do not feed back into artwork.
    region=(46,81,90,115) if d=='se' else (50,80,94,114)
    for n,im in enumerate([load(IDLE/f'idle-{d}.png'),load(ART/f'sit-{d}.png')]):
        proof.alpha_composite(im.crop(region),(n*48+2,1))
    proof.resize((576,216),Image.Resampling.NEAREST).save(ART/f'leg-detail-{d}.png')
    shutil.copyfile(ART/f'leg-detail-{d}.png',PUBLIC/f'leg-detail-{d}.png')
for d,folder in [('se','garden-body-sit-friends-v1'),('ne','garden-body-sit-ne-v1')]:
    base=Image.new('RGBA',(128,128));base.alpha_composite(load(ROOT/f'docs/art/pixel/{folder}/sit-{d}.png'),(16,24))
    base.save(PUBLIC/f'base-{d}.png')
(ART/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
if (ART/'before-rear-coverage/preserved.json').exists():
    for name,h in json.loads((ART/'before-rear-coverage/preserved.json').read_text()).items():
        assert sha(ART/name)==h, f'Unrelated front/head changed: {name}'
for name in ['sit-four.png','sit-four-preview.png','manifest.json','palette.json','prompt.txt']:
    shutil.copyfile(ART/name,PUBLIC/name)
with zipfile.ZipFile(PUBLIC/'snow-white-sit-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in ART.iterdir():
        if p.suffix in ['.png','.pxo','.json','.txt','.md']:z.write(p,p.name)
    z.write(ROOT/'tools/art/build-snow-white-sit-v1.gd','build-snow-white-sit-v1.gd')
print(json.dumps(report,ensure_ascii=False,indent=2))
