"""Package native rear sitting layers and check unchanged heads / common seated feet."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/pixel/garden-friends-sit-rear-v2'
PUBLIC = ROOT / 'apps/client/public/friends-sit-rear-v2'
RUNTIME = ROOT / 'apps/client/public/sprites/garden/friends-sit-rear-v2'
OLD = ROOT / 'docs/art/pixel/garden-friends-base-walk-v2'
BASE = ROOT / 'docs/art/pixel/garden-body-sit-ne-v1'

def pixels(path):
    a = np.array(Image.open(path).convert('RGBA'))
    assert a.shape == (96,96,4), path
    a[a[...,3] == 0] = 0
    assert set(np.unique(a[...,3])) <= {0,255}, path
    return a

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    PUBLIC.mkdir(exist_ok=True, parents=True)
    RUNTIME.mkdir(exist_ok=True, parents=True)
    report = {'version':2, 'status':'awaiting-user-review', 'frameSize':[96,96], 'directions':['NE','NW'],
              'base':'garden-body-sit-ne-v1', 'method':'AI tailored costume, exact common seated legs, original head translated +4px; Pixelorama 3 layers',
              'runtimeConnected':True, 'walkingRuntime':'base-walk-v2 (unchanged)', 'characters':{}}
    sheet = Image.new('RGBA',(192,192))
    base = pixels(BASE/'sit-ne.png')
    for n,(who,actor) in enumerate([('momo','peach'),('lulu','lilac')]):
        folder=OUT/who
        layers={k:pixels(folder/f'{k}-ne.png') for k in ['legs','costume','head']}
        full=pixels(folder/'full-ne.png')
        old_head=Image.open(OLD/who/'idle-ne-head.png').convert('RGBA')
        head=Image.new('RGBA',(96,96)); head.paste(old_head,(4,0))
        expected=np.array(head); expected[expected[...,3]==0]=0
        assert np.array_equal(expected,layers['head']), 'Original head pixels must not be redrawn'
        assert np.array_equal(layers['legs'][77:,:,3],base[77:,:,3]), 'Seated feet geometry must be the base'
        joined=Image.new('RGBA',(96,96))
        for layer in layers.values(): joined.alpha_composite(Image.fromarray(layer))
        a=np.array(joined); a[a[...,3]==0]=0
        assert np.array_equal(a,full), 'Layer composite differs from the game sprite'
        files=[]
        for kind in ['full','legs','costume','head','body']:
            ne=pixels(folder/f'{kind}-ne.png'); nw=pixels(folder/f'{kind}-nw.png')
            assert np.array_equal(nw,ne[:,::-1]), 'NW must be an exact whole-frame mirror'
            for direction in ['ne','nw']:
                name=f'{kind}-{direction}.png'; files.append(name)
                shutil.copyfile(folder/name,PUBLIC/f'{who}-{name}')
        for i,d in enumerate(['ne','nw']):
            native=Image.open(folder/f'full-{d}.png').convert('RGBA')
            native.resize((576,576),Image.Resampling.NEAREST).save(folder/f'preview-{d}-6x.png')
            shutil.copyfile(folder/f'full-{d}.png',RUNTIME/f'{actor}-{d}.png')
            sheet.paste(native,(i*96,n*96))
        project=f'{who}-rear-sit-v2.pxo'; files.append(project)
        shutil.copyfile(folder/project,PUBLIC/project)
        report['characters'][who]={'headMatchesOriginal':True,'headOffset':[4,0], 'baseFeetExact':True,
            'layersRecomposeExactly':True,'mirrorExact':True,
            'visibleColors':len({tuple(p[:3]) for p in full[full[...,3]>0]}),
            'assets':{name:sha(folder/name) for name in files}}
    sheet.resize((1152,1152),Image.Resampling.NEAREST).save(OUT/'preview-4-directions.png')
    # Preserve the actual base and old game sitting poses as labelled comparisons.
    for d in ['ne','nw']:
        shutil.copyfile(BASE/f'sit-{d}.png',PUBLIC/f'base-{d}.png')
    for who,actor in [('momo','peach'),('lulu','lilac')]:
        shutil.copyfile(ROOT/f'apps/client/public/sprites/garden/seesaw-sit-v1/{actor}-ne.png',PUBLIC/f'{who}-previous-ne.png')
    (OUT/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    for name in ['manifest.json','prompt.txt','preview-4-directions.png']:
        shutil.copyfile(OUT/name,PUBLIC/name)
    with zipfile.ZipFile(OUT/'layers.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for who in ['momo','lulu']:
            for name in report['characters'][who]['assets']: archive.write(OUT/who/name,f'{who}/{name}')
        for name in ['manifest.json','prompt.txt']: archive.write(OUT/name,name)
    shutil.copyfile(OUT/'layers.zip',PUBLIC/'layers.zip')
    print(json.dumps({who:{k:v for k,v in info.items() if k!='assets'} for who,info in report['characters'].items()},ensure_ascii=False))

if __name__=='__main__': main()
