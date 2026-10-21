"""Package native Pixelorama walking art and validate preserved reference sources."""
from pathlib import Path
import hashlib,json,shutil,zipfile
import numpy as np
from PIL import Image,ImageOps
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/scarlet2-walk-v2'
PUBLIC=ROOT/'apps/client/public/scarlet2-walk-v2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rgba(p):return Image.open(p).convert('RGBA')

def main():
    PUBLIC.mkdir(exist_ok=True)
    preserved=json.loads((ART/'preserved-sources.json').read_text())
    for f,s in preserved.items():assert sha(ROOT/f)==s,f'Protected source changed: {f}'
    assert sha(ART/'palette.json')==sha(ROOT/'docs/art/pixel/scarlet2-base-v2/palette.json')
    palette={tuple(bytes.fromhex(c[1:])) for c in json.loads((ART/'palette.json').read_text())}
    report={'character':'홍련2','pose':'walk','version':2,'status':'user art review pending','frameSize':128,'frames':4,'fps':6,'runtimeConnected':False,'protectedSources':len(preserved),'sources':['se','ne'],'mirrors':{'sw':'se','nw':'ne'},'baseReferences':{'se':'garden-body-walk-se-v20','ne':'garden-body-walk-ne-v8, latest user manual edit'},'method':'V1 wardrobe retained; bodice centre registered to the neck axis and waist height normalized by two continuous segments. Head uses exactly the same 0/-1px bob as the torso neck. No new generation or costume recolouring.','directions':{}}
    report['alignment']={'neckX':{'se':62,'ne':66},'bodyShiftX':{'se':[-3,3,-1,2],'ne':[2,5,1,5]},'sourceWaistY':{'se':[89,86,86,85],'ne':[86,85,85,84]},'targetWaistY':{'se':88,'ne':85},'sharedHeadNeckWaistBobY':[0,-1,0,-1]}
    allsheet=Image.new('RGBA',(512,512)); files=['palette.json','preserved-sources.json']
    for d,mirror in [('se','sw'),('ne','nw')]:
        frames=[];mframes=[];bframes=[]
        original=rgba(ROOT/f'docs/art/pixel/scarlet2-base-v2/head-{d}.png')
        for n in range(4):
            im=rgba(ART/f'frame-{d}-{n+1}.png'); a=np.array(im)
            body=rgba(ART/f'body-{d}-{n+1}.png');head=rgba(ART/f'head-{d}-{n+1}.png')
            assert im.size==(128,128)
            assert set(np.unique(a[:,:,3]))<={0,255}
            assert {tuple(c) for c in a[a[:,:,3]>0,:3]}<=palette
            expected=Image.new('RGBA',(128,128));expected.alpha_composite(original,(0,-1 if n%2 else 0))
            assert np.array_equal(np.array(head),np.array(expected)), 'Head pixels changed'
            composed=body.copy();composed.alpha_composite(head)
            assert np.array_equal(a,np.array(composed)), 'Native layer mismatch'
            exported=ART/f'editor-{d}-{n+1}.png'
            assert exported.exists(), 'Export each frame from Pixelorama first'
            assert np.array_equal(a,np.array(rgba(exported))), 'Editor export differs from review'
            labs,cnt=label(a[:,:,3]>0,np.ones((3,3)))
            assert cnt==1, f'{d}{n+1}: disconnected pixels ({cnt})'
            assert a[76:92,55:70,3].sum()>15000, 'Torso/hips missing'
            mirrored=ImageOps.mirror(im);mirrored.save(ART/f'frame-{mirror}-{n+1}.png')
            base=rgba(ART/f'base-{d}-{n+1}.png');ImageOps.mirror(base).save(ART/f'base-{mirror}-{n+1}.png')
            frames.append(im);mframes.append(mirrored);bframes.append(base)
            files += [f'{kind}-{d}-{n+1}.png' for kind in ['frame','head','body','base']]
            files += [f'frame-{mirror}-{n+1}.png',f'base-{mirror}-{n+1}.png']
        assert not np.array_equal(np.array(frames[0])[78:],np.array(frames[2])[78:]), 'Opposite contacts identical'
        assert not np.array_equal(np.array(frames[1])[78:],np.array(frames[3])[78:]), 'Passing frames identical'
        for direction,fs in [(d,frames),(mirror,mframes)]:
            sheet=Image.new('RGBA',(512,128));two=Image.new('RGBA',(256,256))
            gifs=[]
            for n,im in enumerate(fs):
                sheet.alpha_composite(im,(128*n,0));two.alpha_composite(im,(128*(n%2),128*(n//2)))
                bg=Image.new('RGBA',(128,128),'#e4e9d8');bg.alpha_composite(im);gifs.append(bg.convert('RGB').resize((384,384),Image.Resampling.NEAREST))
            sheet.save(ART/f'walk-{direction}.png');two.resize((768,768),Image.Resampling.NEAREST).save(ART/f'four-{direction}-3x.png')
            gifs[0].save(ART/f'walk-{direction}.gif',save_all=True,append_images=gifs[1:],duration=[170,160,170,170],loop=0,disposal=2)
            row=['se','sw','ne','nw'].index(direction);allsheet.alpha_composite(sheet,(0,row*128))
            report['directions'][direction]={'frameSha256':[sha(ART/f'frame-{direction}-{i+1}.png') for i in range(4)],'footBottoms':[im.getbbox()[3]-1 for im in fs],'visibleColors':[len(np.unique(np.array(im)[np.array(im)[:,:,3]>0,:3],axis=0)) for im in fs],'headReused':True,'editorCompositeExact':True}
            files += [f'walk-{direction}.png',f'four-{direction}-3x.png',f'walk-{direction}.gif']
        files.append(f'scarlet2-walk-{d}-v2.pxo')
        shutil.copyfile(ROOT/f'docs/art/pixel/scarlet2-base-v2/idle-{d}.png',PUBLIC/f'idle-{d}.png')
        ImageOps.mirror(rgba(PUBLIC/f'idle-{d}.png')).save(PUBLIC/f'idle-{mirror}.png')
    allsheet.save(ART/'walk-four-directions.png');files.append('walk-four-directions.png')
    (ART/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');files.append('manifest.json')
    for name in files:shutil.copyfile(ART/name,PUBLIC/name)
    with zipfile.ZipFile(ART/'scarlet2-walk-v2-editable.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name in files:z.write(ART/name,name)
        for script in ['build-scarlet2-walk-v2.gd','package-scarlet2-walk-v2.py']:z.write(ROOT/'tools/art'/script,'tools/'+script)
        for prompt in ART.glob('prompt-*.txt'):z.write(prompt,prompt.name)
        for name in ['README.md','source-ai-se.png','source-ai-ne.png','source-se-contact-1.png']:
            if (ART/name).exists():z.write(ART/name,name)
    shutil.copyfile(ART/'scarlet2-walk-v2-editable.zip',PUBLIC/'scarlet2-walk-v2-editable.zip')
    print(json.dumps({'protectedFiles':len(preserved),'frames':16,'palette':64,'pixeloramaExportMatches':True,'directions':report['directions']},ensure_ascii=False))
if __name__=='__main__':main()
