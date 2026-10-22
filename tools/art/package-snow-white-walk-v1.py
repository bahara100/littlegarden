"""Package native walk frames; preserve prior art and manual reference bases."""
from pathlib import Path
import hashlib,json,shutil,zipfile
from PIL import Image,ImageOps
import numpy as np
from scipy.ndimage import label
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/snow-white-walk-v1'
PUBLIC=ROOT/'apps/client/public/snow-white-walk-v1'
IDLE=ROOT/'docs/art/pixel/snow-white-idle-v1'
PUBLIC.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:Image.open(p).convert('RGBA')
neck_backup=ART/'before-neck-stabilize'
neck_body_files={f'body-se-{n}.png' for n in range(1,5)}|{'body-sheet-se.png'}
rear_backup=ART/'before-rear-arm-r6'
rear_changed={'body-ne-3.png','body-sheet-ne.png','frame-ne-3.png','frame-nw-3.png','editor-ne-3.png','frame-sheet-ne.png','snow-white-walk-ne-v1.pxo','contact-ne-3x.png','walk-ne.png','walk-nw.png','walk-ne.gif','walk-nw.gif','walk-four-directions.png'}
edge_backup=ART/'before-arm-edge-r7'
for n,h in json.loads((edge_backup/'baseline.json').read_text()).items():
    assert sha(edge_backup/n)==h, f'R6 backup modified: {n}'
    if n not in rear_changed:assert sha(ART/n)==h, f'Unrelated R6 artwork changed: {n}'
edge=np.zeros((128,128),dtype=bool);edge[72:74,77:82]=True
for kind in ['body','frame']:
    before=np.array(load(edge_backup/f'{kind}-ne-3.png'));after=np.array(load(ART/f'{kind}-ne-3.png'))
    assert np.array_equal(before[~edge],after[~edge]),'Changed outside ten upper-arm pixels'
    assert np.count_nonzero(np.any(before!=after,axis=2))==10
    assert np.all(after[edge]==0),'Protruding arm tip not removed'
for n,h in json.loads((rear_backup/'baseline.json').read_text()).items():
    assert sha(rear_backup/n)==h, f'R5 backup modified: {n}'
    if n not in rear_changed:assert sha(ART/n)==h, f'Unrelated R5 artwork changed: {n}'
def check_prior(n,h):
    # R5 explicitly supersedes front body preservation inside the collar core only.
    # Keep the earlier SHA claims verifiable against the immutable R4 backup.
    path=neck_backup/n if n in neck_body_files else rear_backup/n if n in rear_changed else ART/n
    assert sha(path)==h, f'Unrelated artwork changed: {n}'
for n,h in json.loads((neck_backup/'baseline.json').read_text()).items():
    assert sha(neck_backup/n)==h, f'R4 backup modified: {n}'
    if n.startswith(('head-','front-arm-')) or '-ne-' in n or '-nw-' in n or n=='snow-white-walk-ne-v1.pxo':
        assert sha(rear_backup/n if n in rear_changed else ART/n)==h, f'Approved hair, hand or unrelated rear changed: {n}'
def neck_mask(n):
    bob=-1 if n%2==0 else 0
    mask=np.zeros((128,128),dtype=bool);mask[68+bob:81+bob,60:76]=True
    return mask
protected=json.loads((ART/'preserved-sources.json').read_text())
for n,h in protected.items():assert sha(ROOT/n)==h, f'Prior art modified: {n}'
hair_backup=ART/'before-front-hair-fill'
if (hair_backup/'protected.json').exists():
    for n,h in json.loads((hair_backup/'protected.json').read_text()).items():
        check_prior(n,h)
side_lock_backup=ART/'before-side-lock-fill'
if (side_lock_backup/'protected.json').exists():
    for n,h in json.loads((side_lock_backup/'protected.json').read_text()).items():
        check_prior(n,h)
right_lock_backup=ART/'before-right-lock-fill'
if (right_lock_backup/'protected.json').exists():
    for n,h in json.loads((right_lock_backup/'protected.json').read_text()).items():
        check_prior(n,h)
palette={tuple(bytes.fromhex(c[1:])) for c in json.loads((ART/'palette.json').read_text())}
report={'character':'스노우화이트','pose':'걷기 V1','status':'사용자 검수 전','runtimeConnected':False,
        'frameSize':128,'framesPerDirection':4,'fps':6,'paletteLimit':48,'protectedFiles':len(protected),
        'baseReferences':{'se':'SE V20','ne':'NE V8 latest user manual edits'},
        'mirrors':{'sw':'se','nw':'ne'},'method':'AI dressing of four base poses, approved standing head and hair reused, native corrections. Pose reference does not imply identical base silhouette.',
        'bandageOwnership':'Anatomical right thigh; SE2 partially occluded behind supporting left leg. NE4 duplicate band on supporting left leg removed.',
        'rearArms':'NE3/4 far arm reuses actual flexed SE3 gauntlet pixels. R6 moves frame3 elbow/gauntlet 2px inward and 2px down, preserving the shoulder root. No rotation/resizing.',
        'directions':{}}
all_sheet=Image.new('RGBA',(512,512))
for row,d in enumerate(['se','sw','ne','nw']):
    frames=[];baseframes=[];metrics=[]
    original=load(IDLE/f'idle-{d}.png')
    shutil.copyfile(IDLE/f'idle-{d}.png',PUBLIC/f'idle-{d}.png')
    for n in range(1,5):
        im=load(ART/f'frame-{d}-{n}.png');a=np.array(im)
        assert im.size==(128,128) and set(np.unique(a[:,:,3]))<={0,255}
        assert {tuple(p) for p in a[a[:,:,3]>0,:3]}<=palette
        _,cnt=label(a[:,:,3]>0,np.ones((3,3)));assert cnt==1,(d,n,'disconnected pixels',cnt)
        if d in ['se','ne']:
            head=load(ART/f'head-{d}-{n}.png');body=load(ART/f'body-{d}-{n}.png')
            joined=body.copy();joined.alpha_composite(head)
            if d=='se' and (ART/f'front-arm-{d}-{n}.png').exists():
                front_arm=load(ART/f'front-arm-{d}-{n}.png')
                visible=np.array(front_arm)[:,:,3]>0
                assert np.array_equal(np.array(front_arm)[visible],np.array(body)[visible]),'Foreground glove changed'
                joined.alpha_composite(front_arm)
            assert np.array_equal(a,np.array(joined))
            assert np.array_equal(a,np.array(load(ART/f'editor-{d}-{n}.png'))),'Pixelorama export differs'
            bob=-1 if n%2==0 else 0
            expected=Image.new('RGBA',(128,128));expected.alpha_composite(original,(0,bob))
            assert np.array_equal(a[:68+bob],np.array(expected)[:68+bob]),'Head/face changed'
            if d=='ne' and n==3:
                old_body=np.array(load(rear_backup/'body-ne-3.png'));ba=np.array(body)
                old_full=np.array(load(rear_backup/'frame-ne-3.png'))
                arm=np.zeros((128,128),dtype=bool);arm[74:85,71:85]=True;arm|=edge
                assert np.array_equal(ba[~arm],old_body[~arm]),'Changed outside rear frame3 arm'
                assert np.array_equal(a[~arm],old_full[~arm]),'Head/torso/legs changed in rear frame3'
                source=np.array(load(ART/'body-se-3.png'))
                rows={76:(49,59),77:(48,58),78:(48,57),79:(48,56),80:(48,56),81:(48,55),82:(48,54),83:(49,54),84:(50,54)}
                for y,(lo,hi) in rows.items():
                    for x in range(lo,hi+1):
                        if source[y,x,3]:assert np.array_equal(ba[y,130-x],source[y,x]),'Gauntlet detail changed'
                report['rearFrame3Arm']={'delta':[-2,2],'innerShoulderRootPreserved':True,'upperOverhangTrimmedPixels':10,'bodyPixelsChanged':int(np.any(ba!=old_body,axis=2).sum()),'handsNotResized':True,'headTorsoLegsAndOtherFramesPreserved':True}
            if d=='se':
                core=neck_mask(n);ba=np.array(body)
                old_body=np.array(load(neck_backup/f'body-se-{n}.png'))
                old_full=np.array(load(neck_backup/f'frame-se-{n}.png'))
                assert np.array_equal(ba[~core],old_body[~core]),'Arm/leg/other body pixels changed'
                assert np.array_equal(a[~core],old_full[~core]),'Changed outside neck/chest core'
                assert np.array_equal(ba[core],np.array(expected)[core]),'Neck core differs from approved standing'
                assert np.array_equal(a[:,:,3],old_full[:,:,3]),'Whole silhouette changed'
                report.setdefault('frontNeckCore',[]).append({'frame':n,'source':'approved idle-se.png','rect':[60,68+bob,16,13],'bodyPixelsChanged':int(np.any(ba!=old_body,axis=2).sum()),'hairArmsLegsRearPreserved':True})
            if d=='se' and (hair_backup/f'head-se-{n}.png').exists():
                old_head=np.array(load(hair_backup/f'head-se-{n}.png'));new_head=np.array(head)
                existing=old_head[:,:,3]>0
                assert np.array_equal(old_head[existing],new_head[existing]),'Existing head pixels changed'
                restored=(~existing)&(new_head[:,:,3]>0)
                assert restored.sum()==128,'Missing approved left/right hair pixels'
                assert np.array_equal(new_head[restored],np.array(expected)[restored]),'Restoration must copy approved hair'
                before=np.array(load(hair_backup/f'frame-se-{n}.png'))
                changed=np.any(a!=before,axis=2)
                assert not np.any(changed&~(restored|neck_mask(n))),'Changed outside hair or authorized neck core'
                report.setdefault('frontHairRestoration',[]).append({'frame':n,'restoredHeadPixels':int(restored.sum()),'visibleHairChanges':int((changed&restored).sum()),'existingHeadUnchanged':True,'armsLegsAndRearUnchanged':True})
                prior=np.array(load(side_lock_backup/f'head-se-{n}.png'))
                all_side_restored=(prior[:,:,3]==0)&(new_head[:,:,3]>0)
                side_lock=all_side_restored&(np.indices(new_head.shape[:2])[1]<64)
                assert side_lock.sum()==36
                assert np.array_equal(new_head[prior[:,:,3]>0],prior[prior[:,:,3]>0])
                before_lock=np.array(load(side_lock_backup/f'frame-se-{n}.png'))
                changed_lock=np.any(a!=before_lock,axis=2)
                assert not np.any(changed_lock&~(all_side_restored|neck_mask(n))),'Changed outside side locks or neck core'
                report.setdefault('cheekSideLockRestoration',[]).append({'frame':n,'addedHeadPixels':36,'visibleChanges':int((changed_lock&side_lock).sum()),'source':'approved idle-se actual pixels','revision':'side-lock-r2'})
                prior_right=np.array(load(right_lock_backup/f'head-se-{n}.png'))
                right_lock=(prior_right[:,:,3]==0)&(new_head[:,:,3]>0)
                assert right_lock.sum()==73
                assert np.array_equal(new_head[prior_right[:,:,3]>0],prior_right[prior_right[:,:,3]>0])
                assert np.array_equal(new_head[right_lock],np.array(expected)[right_lock])
                old_right=np.array(load(right_lock_backup/f'frame-se-{n}.png'))
                right_changes=np.any(old_right!=a,axis=2)
                assert not np.any(right_changes&~(right_lock|neck_mask(n))),'Changed outside right hair or neck core'
                report.setdefault('redBoxRightHairRestoration',[]).append({'frame':n,'rightHairPixels':73,'visibleChanges':int((right_changes&right_lock).sum()),'source':'approved idle-se.png screen-right lock','revision':'right-lock-r4'})
            base=load(ART/f'base-{d}-{n}.png')
        else:
            src='se' if d=='sw' else 'ne'
            assert np.array_equal(a,np.array(load(ART/f'frame-{src}-{n}.png'))[:,::-1])
            base=ImageOps.mirror(load(ART/f'base-{src}-{n}.png'));base.save(ART/f'base-{d}-{n}.png')
        assert 112<=im.getbbox()[3]<=116
        frames.append(im);baseframes.append(base)
        all_sheet.alpha_composite(im,((n-1)*128,row*128))
        for kind in ['frame','base']:shutil.copyfile(ART/f'{kind}-{d}-{n}.png',PUBLIC/f'{kind}-{d}-{n}.png')
        if d in ['se','sw']:
            # A new filename makes the requested filled hair visible even in an older cached review.
            shutil.copyfile(ART/f'frame-{d}-{n}.png',PUBLIC/f'frame-{d}-{n}-hair-filled.png')
            shutil.copyfile(ART/f'frame-{d}-{n}.png',PUBLIC/f'frame-{d}-{n}-right-lock-filled.png')
            shutil.copyfile(ART/f'frame-{d}-{n}.png',PUBLIC/f'frame-{d}-{n}-neck-core.png')
            shutil.copyfile(neck_backup/f'frame-{d}-{n}.png',PUBLIC/f'before-neck-{d}-{n}.png')
        if d in ['ne','nw']:
            shutil.copyfile(ART/f'frame-{d}-{n}.png',PUBLIC/f'frame-{d}-{n}-rear-arm.png')
        metrics.append({'number':n,'sha256':sha(ART/f'frame-{d}-{n}.png'),'bounds':im.getbbox()})
    assert len({m['sha256'] for m in metrics})==4,'Repeated whole frame'
    # Regional change only detects frozen artwork; it cannot certify natural movement.
    arrays=[np.array(im) for im in frames]
    for rect in [(40,70,90,89),(45,88,90,119)]:
        x0,y0,x1,y1=rect
        assert not np.array_equal(arrays[0][y0:y1,x0:x1],arrays[2][y0:y1,x0:x1])
    sheet=Image.new('RGBA',(512,128))
    for n,im in enumerate(frames):sheet.alpha_composite(im,(n*128,0))
    sheet.save(ART/f'walk-{d}.png');shutil.copyfile(ART/f'walk-{d}.png',PUBLIC/f'walk-{d}.png')
    frames[0].save(ART/f'walk-{d}.gif',save_all=True,append_images=frames[1:],duration=[170,160,170,170],loop=0,disposal=2)
    report['directions'][d]=metrics
report['reviewAssetRevision']='arm-edge-r7'
all_sheet.save(ART/'walk-four-directions.png')
shutil.copyfile(ART/'walk-four-directions.png',PUBLIC/'walk-four-directions.png')
(ART/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for name in ['manifest.json','palette.json','prompt-se-dress.txt','prompt-ne-dress.txt','side-lock-before-after.png','requested-hair-frame4-before-after.png','requested-hair-verification.json','right-lock-red-box-before-after.png','neck-core-five-way.png','rear-arm-frame3-before-after.png','rear-arm-edge-before-after.png']:
    shutil.copyfile(ART/name,PUBLIC/name)
with zipfile.ZipFile(PUBLIC/'snow-white-walk-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in ART.iterdir():
        if p.suffix in ['.png','.pxo','.json','.txt','.md','.gif'] and not p.name.startswith(('rejected-','rear-arm-candidate','rear-arm-position-candidates')):z.write(p,p.name)
    z.write(ROOT/'tools/art/build-snow-white-walk-v1.gd','build-snow-white-walk-v1.gd')
print(json.dumps({'protectedFiles':len(protected),'directions':4,'frames':16,'fps':6,'pxoExportsExact':True,'headPreserved':True,'connected':True,'mirrorsExact':True}))
