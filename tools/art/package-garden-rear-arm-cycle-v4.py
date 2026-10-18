"""Package native rear arm correction, preserving poses outside the edited arm regions."""
import hashlib
import importlib.util
import json
import shutil
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel'
PUBLIC=ROOT/'apps/client/public'
BASE=ART/'garden-body-walk-ne-v4'
FRIENDS=ART/'garden-friends-base-walk-v3'
spec=importlib.util.spec_from_file_location('preview',ROOT/'tools/art/build-garden-body-walk-se-v3.py')
helper=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return np.array(Image.open(p).convert('RGBA'))
def dump(p,data): p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    frames=[read(BASE/f'frame-{i}-native.png') for i in range(1,5)]
    for n,f in enumerate(frames,1):
        old=read(ART/'garden-body-walk-ne-v3'/f'frame-{n}.png')
        assert np.array_equal(f[:45],old[:45]), 'Bald head changed'
        assert np.array_equal(f[68:],old[68:]), 'Base legs changed'
        assert helper.connected(f), f'Base pose {n} disconnected'
    assert np.array_equal(frames[2],read(ART/'garden-body-walk-ne-v3/frame-3.png'))
    # No identical arm pair: the two passing poses differ as well as the two swings.
    arms=[read(BASE/f'arms-{i}.png') for i in range(1,5)]
    assert all(not np.array_equal(arms[i],arms[j]) for i in range(4) for j in range(i))
    positions=[]
    for arm in arms:
        rgb=arm[:,:,:3].astype(int)
        skin=(arm[:,:,3]>0)&(rgb[:,:,0]>rgb[:,:,1]+18)&(rgb[:,:,0]>rgb[:,:,2]+10)
        positions.append([float(np.where(skin[:,:49])[0].mean()),float(np.where(skin[:,49:])[0].mean())])
    assert positions[0][0]+3 < positions[0][1], 'Pose1 must raise left hand, lower right hand'
    assert positions[2][1]+3 < positions[2][0], 'Pose3 must raise right hand, lower left hand'
    dump(BASE/'arm-cycle-verification.json',{'handMeanRows':positions,'fourDistinctArmDrawings':True,'oppositeSwings':True,'headAndLowerBodyPreserved':True})
    shutil.copyfile(ART/'garden-body-walk-se-v20/palette.json',BASE/'palette.json')
    helper.SRC=str(ART/'garden-body-walk-se-v20')
    helper.HEAD_ROWS=45
    metadata={'version':4,'direction':'NE','stage':'arm-cycle-correction-awaiting-user-review',
              'from':'garden-body-walk-ne-v3','method':'Existing opposite-arm/relaxed-arm pixels; preserve head and lower body',
              'armPhases':['left-forward-right-back','passing-return','right-forward-left-back','passing-reverse'],
              'headRowsPreserved':[0,44],'lowerBodyRowsPreserved':[68,95],'runtimeConnected':True}
    helper.write_outputs(frames,['V3 legs/head, arm pass' for _ in frames],metadata,str(BASE),str(PUBLIC/'body-walk-ne-v4'))
    helper.write_outputs([f[:,::-1].copy() for f in frames],['V4 exact cell mirror']*4,{**metadata,'direction':'NW'},str(ART/'garden-body-walk-nw-v4'),str(PUBLIC/'body-walk-nw-v4'))
    for p in BASE.glob('*.pxo'): shutil.copyfile(p,PUBLIC/'body-walk-ne-v4'/p.name)
    for src,dst in [('body-walk-ne-v3','body-walk-ne-v4'),('body-walk-nw-v3','body-walk-nw-v4')]:
        old=PUBLIC/src/'index.html'
        if old.exists():
            text=old.read_text(encoding='utf-8').replace('ne-v3','ne-v4').replace('nw-v3','nw-v4').replace('V3','V4')
            text=text.replace('첫 번째 이미지의 1·3·4번과 두 번째 이미지의 2번을 골라 조합했습니다. 선택한 자세를 새로 그리지 않고 전신 그대로 축소·정렬했습니다.','팔 고정 수정: 1·3번은 반대 팔 스윙, 2·4번은 통과 자세입니다. 기존 다리와 보폭은 유지했습니다.')
            text=text.replace("['첫 이미지 1번','두 번째 이미지 2번','첫 이미지 3번','첫 이미지 4번']","['왼팔 앞 · 오른팔 뒤','팔 통과 · 돌아오기','오른팔 앞 · 왼팔 뒤','팔 통과 · 반대로']")
            text=text.replace('새 뒷모습은 검토용이며 실제 놀이터에는 아직 연결하지 않았습니다.','팔 수정본을 모모·루루의 뒤 걷기에도 연결했습니다. 새 팔 순환은 사용자 검토 대상입니다.')
            (PUBLIC/dst/'index.html').write_text(text,encoding='utf-8')
    manifest={'version':3,'frameSize':96,'frameCount':4,'fps':6,'runtimeConnected':True,
              'directions':{'se':['se',False],'sw':['se',True],'ne':['ne',False],'nw':['ne',True]},
              'baseSources':{},'characters':{},'correction':'Rear arm cycle only; idle/head/legs/skirt and front walk preserved'}
    for direction,folder in [('se','garden-body-walk-se-v20'),('ne','garden-body-walk-ne-v4')]:
        p=ART/folder/'walk.png'
        manifest['baseSources'][direction]={'folder':folder,'sha256':sha(p)}
        shutil.copyfile(p,PUBLIC/'friends-base-walk-v1'/f'base-walk-{direction}.png')
    for who in ['momo','lulu']:
        old=ART/'garden-friends-base-walk-v2'/who
        folder=FRIENDS/who
        runtime=PUBLIC/'sprites/garden/base-walk-v3'/who
        runtime.mkdir(parents=True,exist_ok=True)
        for file in ['walk-se.png','walk-sw.png']+[f'idle-{d}.png' for d in ['se','sw','ne','nw']]:
            shutil.copyfile(old/file,folder/file)
        for n in range(1,5):
            f=read(folder/f'full-ne-{n}.png')
            previous=read(old/f'full-ne-{n}.png')
            assert np.array_equal(f[66:],previous[66:]), 'Dress hem or legs changed'
            head=read(old/f'head-ne-{n}.png')
            mask=head[:,:,3]>0
            assert np.array_equal(f[mask],head[mask]), 'Hair changed'
            assert helper.connected(f), (who,n,'Disconnected')
        result={'assets':{},'headPixelsPreserved':True,'legsAndSkirtPreserved':True,'idleUnchangedFromV2':True}
        for d in ['se','sw','ne','nw']:
            for action in ['idle','walk']:
                path=folder/f'{action}-{d}.png'
                pixels=read(path)
                assert set(np.unique(pixels[:,:,3])) <= {0,255}
                assert len({tuple(p) for p in pixels[pixels[:,:,3]>0]})<=63
                shutil.copyfile(path,runtime/path.name)
                result['assets'][path.name]=sha(path)
            if d in ['se','ne']:
                sheet=read(folder/f'walk-{d}.png')
                fs=[read(folder/f'full-{d}-{i}.png') for i in range(1,5)]
                assert np.array_equal(sheet,np.concatenate(fs,axis=1))
                mirror=read(folder/f'walk-{"sw" if d=="se" else "nw"}.png')
                assert np.array_equal(mirror,np.concatenate([f[:,::-1] for f in fs],axis=1))
                helper.save_gif(fs,str(folder/f'walk-{d}.gif'))
                grid=np.concatenate([np.concatenate(fs[:2],axis=1),np.concatenate(fs[2:],axis=1)],axis=0)
                Image.fromarray(grid).resize((768,768),Image.Resampling.NEAREST).save(folder/f'walk-{d}-preview.png')
        with zipfile.ZipFile(folder/f'{who}-arm-cycle-v3.zip','w',zipfile.ZIP_DEFLATED) as z:
            for p in folder.glob('*.png'): z.write(p,p.name)
            for p in folder.glob('*.pxo'): z.write(p,p.name)
        manifest['characters'][who]=result
    dump(FRIENDS/'manifest.json',manifest)
    dump(PUBLIC/'sprites/garden/base-walk-v3/manifest.json',manifest)
    print('Base NE/NW V4 and dressed V3 packaged. Four distinct arm poses; head, legs, dress hem, all idles and front walk preserved.')

if __name__=='__main__': main()
