"""Package native Pixelorama walking art and validate preserved reference sources."""
from pathlib import Path
import hashlib,json,shutil,zipfile
import numpy as np
from PIL import Image,ImageOps
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/scarlet2-walk-v6'
PUBLIC=ROOT/'apps/client/public/scarlet2-walk-v6'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rgba(p):
    # Godot's transparent white and PNG's transparent black render identically.
    a=np.array(Image.open(p).convert('RGBA'));a[a[:,:,3]==0,:3]=0
    return Image.fromarray(a)


def scabbard_edit_mask(d,n):
    mask=np.zeros((128,128),dtype=bool)
    if d=='se':
        straight=json.loads((ART/'front-scabbard-straight.json').read_text())
        bob=straight['bobY'][n-1]
        for x,top,bottom in straight['oldColumns']+straight['columns']:mask[top+bob:bottom+bob+1,x]=True
    return mask

def main():
    PUBLIC.mkdir(exist_ok=True)
    preserved=json.loads((ART/'preserved-sources.json').read_text())
    for f,s in preserved.items():assert sha(ROOT/f)==s,f'Protected source changed: {f}'
    assert sha(ART/'palette.json')==sha(ROOT/'docs/art/pixel/scarlet2-base-v2/palette.json')
    palette={tuple(bytes.fromhex(c[1:])) for c in json.loads((ART/'palette.json').read_text())}
    report={'character':'홍련2','pose':'walk','version':6,'status':'user art review pending','frameSize':128,'frames':4,'fps':6,'runtimeConnected':True,'protectedSources':len(preserved),'sources':['se','ne'],'mirrors':{'sw':'se','nw':'ne'},'baseReferences':{'se':'garden-body-walk-se-v20','ne':'garden-body-walk-ne-v8, latest user manual edit'},'method':'Approved standing V2 head, shoulders, chest, waist and scabbard form a single native core shared across four poses. Actual SE V20 / manually edited NE V8 arm drawings are recoloured with Scarlet skin/guards while retaining every source skin pixel and the directly adjacent source outline; excludes distant shirt/torso fragments, using integer shoulder offsets only. V2 leg poses overlap underneath hip garments. No new generation.','directions':{}}
    report['jointFill']={'armSePixels':[9,5,3,8],'scabbardSePixels':[20,17,13,20],'sw':'exact mirror','otherPixelsUnchanged':True,'layers':{'se':6,'ne':6}}
    report['alignment']={'method':'One approved full upper-body artwork from hat through waist, including shoulder-neck overlap; source-base pose pixels and front/back arm ordering; V2 legs overlap behind hip garments. No independently generated torso in the cycle.','sharedCoreBobY':[0,-1,0,-1],'layerOrder':['legs','far arm','coherent torso','near arm','head occlusion','arm/scabbard joint fill (transparent holes only)'],'articulation':'Actual approved-base four-pose arm pixels, source skin and hand sizes retained; one-pixel adjacent source outline with integer translations only. No rotation, scale or limb interpolation.','extractedArmAlphaExact':True,'sourceSkinPreserved':True,'outlineNeighbourhood':1,'sourceOffsets':{'se':{'near':[-3,2],'far':[-3,2]},'ne':{'near':[3,5],'far':[0,5]}},'masterPixelColoursUnchanged':True}
    rear=json.loads((ART/'rear-shoulder-fill.json').read_text())
    for name,s in rear['preservedFrontSha256'].items():assert sha(ART/'before-scabbard-outline'/name)==s, 'Pre-outline corrected front changed'
    report['jointFill']['armNePixels']=rear['armPixels']
    report['jointFill']['scabbardNePixels']=rear['scabbardPixels']
    report['scabbardOutline']={'insideExistingAlpha':'rear; front straight contour adjusted','thickness':1,'nonScabbardPixelsPreserved':True,'layers':7}
    straight=json.loads((ART/'front-scabbard-straight.json').read_text())
    for name,s in straight['preservedRearSha256'].items():assert sha(ART/name)==s, 'Rear artwork changed during front correction'
    report['frontScabbardStanding']={'source':'scarlet2-base-v2/idle-se.png','visibleReferencePixelsExact':True,'rearUnchanged':True,'goldTipUnchanged':True}
    allsheet=Image.new('RGBA',(512,512)); files=['scabbard-line.json','front-scabbard-straight.json']+[f'outline-{d}-{n}.png' for d in ['se','ne'] for n in range(1,5)]+['palette.json','preserved-sources.json','shoulder-fill.json','rear-shoulder-fill.json']+[f'joint-ne-{n}.png' for n in range(1,5)]+[f'joint-se-{n}.png' for n in range(1,5)]
    for d,mirror in [('se','sw'),('ne','nw')]:
        frames=[];mframes=[];bframes=[]
        original=rgba(ROOT/f'docs/art/pixel/scarlet2-base-v2/head-{d}.png')
        for n in range(4):
            im=rgba(ART/f'frame-{d}-{n+1}.png'); a=np.array(im)
            body=rgba(ART/f'legs-{d}-{n+1}.png');head=rgba(ART/f'core-{d}-{n+1}.png')
            # V6 is exclusively an arm cleanup; all other layer pixels stay V5.
            for kind in ['core','legs','cap']:
                assert np.array_equal(np.array(rgba(ART/f'{kind}-{d}-{n+1}.png'))[~(scabbard_edit_mask(d,n+1) if kind=='core' else np.zeros((128,128),dtype=bool))],np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/{kind}-{d}-{n+1}.png'))[~(scabbard_edit_mask(d,n+1) if kind=='core' else np.zeros((128,128),dtype=bool))]), f'{kind} changed outside front sheath'
            for arm in range(2):
                raw=np.array(rgba(ART/f'source-arm-{d}-{arm}-{n+1}.png'))
                prev=np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/source-arm-{d}-{arm}-{n+1}.png'))
                r,g,b=prev[:,:,0].astype(int),prev[:,:,1].astype(int),prev[:,:,2].astype(int)
                skin=(prev[:,:,3]>0)&(r>g+20)&(r>b+20)&(r>145)
                assert np.array_equal(raw[skin],prev[skin]), 'Actual base skin/hand pixels lost'
                assert not np.any((raw[:,:,3]>0)&(prev[:,:,3]==0)), 'Expanded beyond source mask'
            if d=='se':
                source=np.array(rgba(ROOT/'docs/art/pixel/scarlet2-base-v2/idle-se.png'))
                arm=np.array(rgba(ART/f'near-se-{n+1}.png'))
                details=json.loads((ART/'front-scabbard-straight.json').read_text());bob=details['bobY'][n]
                for x,top,bottom in details['columns']:
                    if x<details['referenceStartX']:continue
                    for yy in range(top,bottom+1):
                        if arm[yy+bob,x,3]==0:assert np.array_equal(a[yy+bob,x],source[yy,x]), 'Walking sheath differs from approved standing reference'
            assert im.size==(128,128)
            assert set(np.unique(a[:,:,3]))<={0,255}
            assert {tuple(c) for c in a[a[:,:,3]>0,:3]}<=palette
            expected=Image.new('RGBA',(128,128));expected.alpha_composite(rgba(ART/f'core-{d}-1.png'),(0,-1 if n%2 else 0))
            assert np.array_equal(np.array(head),np.array(expected)), 'Shared head/shoulder/chest/waist has changed angle or shape'
            composed=body.copy();composed.alpha_composite(rgba(ART/f'far-{d}-{n+1}.png'));composed.alpha_composite(head);composed.alpha_composite(rgba(ART/f'near-{d}-{n+1}.png'));composed.alpha_composite(rgba(ART/f'cap-{d}-{n+1}.png'))
            fillfile='rear-shoulder-fill.json' if d=='ne' else 'shoulder-fill.json'
            if (ART/fillfile).exists():
                composed.alpha_composite(rgba(ART/f'joint-{d}-{n+1}.png'))
            line=rgba(ART/f'outline-{d}-{n+1}.png')
            composed.alpha_composite(line)
            line_mask=(np.array(line)[:,:,3]>0)|scabbard_edit_mask(d,n+1)
            preline=np.array(rgba(ART/f'before-scabbard-outline/frame-{d}-{n+1}.png'))
            assert np.array_equal(a[:,:,3][~scabbard_edit_mask(d,n+1)],preline[:,:,3][~scabbard_edit_mask(d,n+1)]), 'Changed alpha outside front sheath'
            assert np.array_equal(a[~line_mask],preline[~line_mask]), 'Changed outside scabbard ink'
            assert d=='se' or np.all(preline[line_mask,3]==255), 'Rear outline must stay inside original scabbard'
            unlined=a.copy();unlined[line_mask]=preline[line_mask]
            baseline=np.array(rgba(ART/f'before-shoulder-fill/frame-{d}-{n+1}.png'))
            permitted=np.zeros((128,128),dtype=bool)
            if (ART/fillfile).exists():
                fills=json.loads((ART/fillfile).read_text())
                for p in fills['frames'][str(n+1)]:permitted[p['y'],p['x']]=True
            assert np.array_equal(unlined[~permitted],baseline[~permitted]), 'Changed outside requested joint holes'
            assert np.all(baseline[permitted,3]==0) and np.all(unlined[permitted,3]==255), 'Joint patch must only fill transparency'
            assert np.array_equal(a,np.array(composed)), 'Native layer mismatch'
            near=np.array(rgba(ART/f'near-{d}-{n+1}.png'))
            cap=np.array(rgba(ART/f'cap-{d}-{n+1}.png'));visible=(near[:,:,3]>0)&(cap[:,:,3]==0)
            assert np.array_equal(a[visible],near[visible]), 'Near arm hidden beneath torso'
            old=np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/frame-{d}-{n+1}.png'))
            hm=np.array(original)[:,:,3]>0;hm[78:]=False
            assert np.array_equal(a[hm],old[hm]), 'Head direction changed'
            for kind in ['near','far']:
                dressed=np.array(rgba(ART/f'{kind}-{d}-{n+1}.png'));ref=np.array(rgba(ART/f'reference-{kind}-{d}-{n+1}.png'))
                assert np.array_equal(dressed[:,:,3],ref[:,:,3]), 'Base arm silhouette resampled or damaged'
            exported=ART/f'editor-{d}-{n+1}.png'
            assert exported.exists(), 'Export each frame from Pixelorama first'
            assert np.array_equal(a,np.array(rgba(exported))), 'Editor export differs from review'
            labs,cnt=label(a[:,:,3]>0,np.ones((3,3)))
            assert cnt==1, f'{d}{n+1}: disconnected pixels ({cnt})'
            assert a[76:92,55:70,3].sum()>15000, 'Torso/hips missing'
            mirrored=ImageOps.mirror(im);mirrored.save(ART/f'frame-{mirror}-{n+1}.png')
            base=rgba(ART/f'base-{d}-{n+1}.png');ImageOps.mirror(base).save(ART/f'base-{mirror}-{n+1}.png')
            frames.append(im);mframes.append(mirrored);bframes.append(base)
            files += [f'{kind}-{d}-{n+1}.png' for kind in ['frame','core','legs','far','near','cap','reference-near','reference-far','base']]
            files += [f'frame-{mirror}-{n+1}.png',f'base-{mirror}-{n+1}.png']
        assert not np.array_equal(np.array(frames[0])[78:],np.array(frames[2])[78:]), 'Opposite contacts identical'
        assert not np.array_equal(np.array(frames[1])[78:],np.array(frames[3])[78:]), 'Passing frames identical'
        arm_changes=[int(np.any(np.array(frames[a])[81:93] != np.array(frames[b])[81:93],axis=2).sum()) for a,b in [(0,2),(1,3)]]
        assert min(arm_changes)>20, 'Arms are frozen after torso consolidation'
        report.setdefault('visibleArmChanges',{})[d]=arm_changes
        for direction,fs in [(d,frames),(mirror,mframes)]:
            sheet=Image.new('RGBA',(512,128));two=Image.new('RGBA',(256,256))
            gifs=[]
            for n,im in enumerate(fs):
                sheet.alpha_composite(im,(128*n,0));two.alpha_composite(im,(128*(n%2),128*(n//2)))
                bg=Image.new('RGBA',(128,128),'#e4e9d8');bg.alpha_composite(im);gifs.append(bg.convert('RGB').resize((384,384),Image.Resampling.NEAREST))
            sheet.save(ART/f'walk-{direction}.png');two.resize((768,768),Image.Resampling.NEAREST).save(ART/f'four-{direction}-3x.png')
            gifs[0].save(ART/f'walk-{direction}.gif',save_all=True,append_images=gifs[1:],duration=[170,160,170,170],loop=0,disposal=2)
            row=['se','sw','ne','nw'].index(direction);allsheet.alpha_composite(sheet,(0,row*128))
            report['directions'][direction]={'frameSha256':[sha(ART/f'frame-{direction}-{i+1}.png') for i in range(4)],'footBottoms':[im.getbbox()[3]-1 for im in fs],'visibleColors':[len(np.unique(np.array(im)[np.array(im)[:,:,3]>0,:3],axis=0)) for im in fs],'wholeTorsoShared':True,'editorCompositeExact':True}
            files += [f'walk-{direction}.png',f'four-{direction}-3x.png',f'walk-{direction}.gif']
        files.append(f'scarlet2-walk-{d}-v6.pxo')
        shutil.copyfile(ROOT/f'docs/art/pixel/scarlet2-base-v2/idle-{d}.png',PUBLIC/f'idle-{d}.png')
        ImageOps.mirror(rgba(PUBLIC/f'idle-{d}.png')).save(PUBLIC/f'idle-{mirror}.png')
    allsheet.save(ART/'walk-four-directions.png');files.append('walk-four-directions.png')
    (ART/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');files.append('manifest.json')
    for name in files:shutil.copyfile(ART/name,PUBLIC/name)
    with zipfile.ZipFile(ART/'scarlet2-walk-v6-editable.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name in files:z.write(ART/name,name)
        for script in ['build-scarlet2-walk-v6.gd','package-scarlet2-walk-v6.py','fill-scarlet2-walk-v6-shoulder.gd','prepare-scarlet2-v6-shoulder-fill.py','prepare-scarlet2-v6-rear-fill.py','prepare-scarlet2-v6-scabbard-line.py','outline-scarlet2-walk-v6-scabbard.gd','prepare-scarlet2-v6-front-straight.py','prepare-scarlet2-v6-standing-scabbard.py','straighten-scarlet2-walk-v6-front.gd','prepare-scarlet2-walk-v6.py']:z.write(ROOT/'tools/art'/script,'tools/'+script)
        for prompt in ART.glob('prompt-*.txt'):z.write(prompt,prompt.name)
        for name in ['README.md','source-ai-se.png','source-ai-ne.png','source-se-contact-1.png']:
            if (ART/name).exists():z.write(ART/name,name)
    shutil.copyfile(ART/'scarlet2-walk-v6-editable.zip',PUBLIC/'scarlet2-walk-v6-editable.zip')
    import runpy
    runpy.run_path(str(ROOT/'tools/art/sync-scarlet2-runtime.py'),run_name='__main__')
    print(json.dumps({'protectedFiles':len(preserved),'frames':16,'palette':64,'pixeloramaExportMatches':True,'directions':report['directions']},ensure_ascii=False))
if __name__=='__main__':main()
