"""Package dressed V8 rear poses as a review candidate, preserving game V2."""
import hashlib
import importlib.util
import json
import re
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel'
PUBLIC=ROOT/'apps/client/public'
OUT=ART/'garden-friends-base-walk-v5'
spec=importlib.util.spec_from_file_location('preview',ROOT/'tools/art/build-garden-body-walk-se-v3.py')
h=importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
read=lambda p:np.array(Image.open(p).convert('RGBA'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'version':5,'stage':'lower-wider-arms-momo-sole-repair-review','armOffsetY':3,'armWidthAdded':2,'fps':6,'frameSize':96,'frameCount':4,
          'baseSource':'garden-body-walk-ne-v8','baseSha256':sha(ART/'garden-body-walk-ne-v8/walk.png'),
          'gameRootPreserved':'sprites/garden/base-walk-v2','characters':{}}
for who in ['momo','lulu']:
    folder=OUT/who
    old=ART/'garden-friends-base-walk-v4'/who
    runtime=PUBLIC/'sprites/garden/base-walk-v5'/who
    runtime.mkdir(parents=True,exist_ok=True)
    for file in [f'idle-{d}.png' for d in ['se','sw','ne','nw']]:
        shutil.copyfile(old/file,folder/file)
    checks=[]
    for d in ['se','ne']:
        frames=[]
        for n in range(1,5):
            f=read(folder/f'full-{d}-{n}.png')
            prev=read(old/f'full-{d}-{n}.png')
            allowed=np.zeros((96,96),bool)
            if d=='ne': allowed[49:69,25:75]=True
            if who=='momo' and n in (1,3):
                bottom=88 if d=='se' and n==1 else 89 if d=='se' else 90
                left=56 if d=='se' and n==1 else 50 if d=='se' else 35 if n==1 else 38
                right=64 if d=='se' and n==1 else 59 if d=='se' else 43 if n==1 else 46
                allowed[bottom,left:right+1]=True
                assert np.all(f[bottom,left:right+1,3]==255),'Sole gap'
            changed=np.any(f!=prev,axis=2)&((f[...,3]>0)|(prev[...,3]>0))
            assert not (changed & ~allowed).any(),(who,d,n,'Edit escaped arm/sole region')
            head=read(old/f'head-{d}-{n}.png')
            mask=head[...,3]>0
            assert np.array_equal(f[mask],head[mask]),'Hair changed'
            assert h.connected(f),(who,d,n,'Disconnected pixels')
            assert set(np.unique(f[...,3]))<={0,255}
            checks.append({'direction':d,'frame':n,'hairPreserved':True,'outsideArmAndSolePreserved':True,'changedPixels':int(changed.sum())})
            frames.append(f)
        sheet=np.concatenate(frames,axis=1)
        Image.fromarray(sheet).save(folder/f'walk-{d}.png')
        mirrored=np.concatenate([f[:,::-1] for f in frames],axis=1)
        Image.fromarray(mirrored).save(folder/f'walk-{"sw" if d=="se" else "nw"}.png')
        h.save_gif(frames,str(folder/f'walk-{d}.gif'))
        grid=np.concatenate([np.concatenate(frames[:2],axis=1),np.concatenate(frames[2:],axis=1)],axis=0)
        Image.fromarray(grid).resize((768,768),Image.Resampling.NEAREST).save(folder/f'walk-{d}-preview.png')
    for file in ['walk-se.png','walk-sw.png','walk-ne.png','walk-nw.png']+[f'idle-{d}.png' for d in ['se','sw','ne','nw']]:
        shutil.copyfile(folder/file,runtime/file)
    for native in folder.glob('*.pxo'): shutil.copyfile(native,runtime/native.name)
    manifest['characters'][who]={'checks':checks,'idlePreserved':True,'rearSha256':sha(folder/'walk-ne.png')}
for dest in [OUT/'manifest.json',PUBLIC/'sprites/garden/base-walk-v5/manifest.json']:
    dest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
p=PUBLIC/'friends-base-walk-v1/index.html'
html=p.read_text(encoding='utf-8')
html=html.replace('WARDROBE V4','WARDROBE V5')
html=html.replace('직접 수정한 V8 걷기를 모모·루루에게 입혔어요.','팔을 조금 내리고 폭을 넓혔어요. 모모 1·3번 밑창도 보강했어요.')
html=html.replace('SE V20 · NE V8 / 2·4번 팔 수정','SE V20 · NE V8 / 사용자 수정본')
html=html.replace('../sprites/garden/base-walk-v4/','../sprites/garden/base-walk-v5/')
html=html.replace('사용자 수정 V8 → 모모·루루 뒤 걷기 V4. 기존 머리·의상 몸통·치마·다리를 보존하고 팔·소매·손을 맞췄어요. 게임은 선택한 V2를 유지해요.',
                  '뒤 걷기 V5 · 양팔을 3px 내리고 폭을 2px 넓혔어요. 모모 1·3번의 앞 신발 밑창선을 앞·뒤 방향 모두 보강했어요. 게임은 선택한 V2를 유지해요.')
html=re.sub(r'im.src=url(?:\+"\?rev=[^"]+")?;', 'im.src=url+"?rev='+manifest['baseSha256'][:12]+'-friends-v5";',html)
html=html.replace('let playing=true,frame=0,last=0,ready=false;','let playing=true,frame=0,last=0,ready=false;')
p.write_text(html,encoding='utf-8')
print('V5 review packaged: lower/wider rear arms and continuous Momo 1/3 soles; edits confined to arm/sole regions. Game V2 unchanged.')
