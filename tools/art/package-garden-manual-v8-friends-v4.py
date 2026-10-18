"""Package dressed V8 rear poses as a review candidate, preserving game V2."""
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel'
PUBLIC=ROOT/'apps/client/public'
OUT=ART/'garden-friends-base-walk-v4'
spec=importlib.util.spec_from_file_location('preview',ROOT/'tools/art/build-garden-body-walk-se-v3.py')
h=importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
read=lambda p:np.array(Image.open(p).convert('RGBA'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'version':4,'stage':'manual-v8-rear-walk-review','fps':6,'frameSize':96,'frameCount':4,
          'baseSource':'garden-body-walk-ne-v8','baseSha256':sha(ART/'garden-body-walk-ne-v8/walk.png'),
          'gameRootPreserved':'sprites/garden/base-walk-v2','characters':{}}
for who in ['momo','lulu']:
    folder=OUT/who
    old=ART/'garden-friends-base-walk-v2'/who
    runtime=PUBLIC/'sprites/garden/base-walk-v4'/who
    runtime.mkdir(parents=True,exist_ok=True)
    for file in ['walk-se.png','walk-sw.png']+[f'idle-{d}.png' for d in ['se','sw','ne','nw']]:
        shutil.copyfile(old/file,folder/file)
    checks=[]
    for d in ['se','ne']:
        frames=[]
        for n in range(1,5):
            f=read(folder/f'full-{d}-{n}.png')
            prev=read(old/f'full-{d}-{n}.png')
            if d=='se': assert np.array_equal(f,prev),'Front pose changed'
            head=read(old/f'head-{d}-{n}.png')
            mask=head[...,3]>0
            assert np.array_equal(f[mask],head[mask]),'Hair changed'
            assert np.array_equal(f[66:],prev[66:]),'Skirt hem/legs changed'
            assert h.connected(f),(who,d,n,'Disconnected pixels')
            assert set(np.unique(f[...,3]))<={0,255}
            checks.append({'direction':d,'frame':n,'hairPreserved':True,'skirtHemAndLegsPreserved':True})
            frames.append(f)
        sheet=np.concatenate(frames,axis=1)
        assert np.array_equal(sheet,read(folder/f'walk-{d}.png'))
        mirrored=np.concatenate([f[:,::-1] for f in frames],axis=1)
        assert np.array_equal(mirrored,read(folder/f'walk-{"sw" if d=="se" else "nw"}.png'))
        h.save_gif(frames,str(folder/f'walk-{d}.gif'))
        grid=np.concatenate([np.concatenate(frames[:2],axis=1),np.concatenate(frames[2:],axis=1)],axis=0)
        Image.fromarray(grid).resize((768,768),Image.Resampling.NEAREST).save(folder/f'walk-{d}-preview.png')
    for file in ['walk-se.png','walk-sw.png','walk-ne.png','walk-nw.png']+[f'idle-{d}.png' for d in ['se','sw','ne','nw']]:
        shutil.copyfile(folder/file,runtime/file)
    for native in folder.glob('*.pxo'): shutil.copyfile(native,runtime/native.name)
    manifest['characters'][who]={'checks':checks,'idlePreserved':True,'rearSha256':sha(folder/'walk-ne.png')}
for dest in [OUT/'manifest.json',PUBLIC/'sprites/garden/base-walk-v4/manifest.json']:
    dest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
p=PUBLIC/'friends-base-walk-v1/index.html'
html=p.read_text(encoding='utf-8')
html=html.replace('GARDEN FRIENDS / ARM CYCLE V3','GARDEN FRIENDS / MANUAL V8 → WARDROBE V4')
html=html.replace('ベース','베이스').replace('베이스 뒤 걷기 2·4번 팔을 다시 다듬었어요.','직접 수정한 V8 걷기를 모모·루루에게 입혔어요.')
html=html.replace('SE V20 · NE V8 / 2·4번 팔 수정','SE V20 · NE V8 / 사용자 수정본')
html=html.replace('../sprites/garden/base-walk-v3/','../sprites/garden/base-walk-v4/')
html=html.replace('베이스 뒤 걷기 NE/NW V8 · 2·4번 팔만 수정했어요. 아래 의상 시안은 이전 V3이며 게임은 V2를 유지해요.',
                  '사용자 수정 V8 → 모모·루루 뒤 걷기 V4. 기존 머리·의상 몸통·치마·다리를 보존하고 팔·소매·손을 맞췄어요. 게임은 선택한 V2를 유지해요.')
html=html.replace('im.src=url;','im.src=url+"?rev='+manifest['baseSha256'][:12]+'-friends-v4";')
html=html.replace('let playing=true,frame=0,last=0,ready=false;','let playing=true,frame=0,last=0,ready=false;')
if "$('direction').value='ne';" not in html:
    html=html.replace("const root='../sprites/garden/base-walk-v4/';","const root='../sprites/garden/base-walk-v4/';\n$('direction').value='ne';")
p.write_text(html,encoding='utf-8')
print('V4 review packaged; exact front/idle/head/hem/leg preservation and mirrored rear poses verified. Game V2 unchanged.')
