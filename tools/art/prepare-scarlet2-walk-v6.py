"""Prepare native Pixelorama V6 code and preservation manifest, without editing pixels."""
from pathlib import Path
import hashlib, json

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/art/pixel/scarlet2-walk-v6'
ART.mkdir(exist_ok=True)
PUBLIC=ROOT/'apps/client/public/scarlet2-walk-v6'
PUBLIC.mkdir(exist_ok=True)
v5=ROOT/'docs/art/pixel/scarlet2-walk-v5'
preserved=json.loads((v5/'preserved-sources.json').read_text())
for p in v5.iterdir():
    if p.suffix in {'.png','.pxo','.json'}:
        preserved[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
(ART/'preserved-sources.json').write_text(json.dumps(preserved,indent=2),encoding='utf8')
(ART/'palette.json').write_bytes((v5/'palette.json').read_bytes())
code=(ROOT/'tools/art/build-scarlet2-walk-v5.gd').read_text(encoding='utf8')
code=code.replace("scarlet2-walk-v5/", "scarlet2-walk-v6/")
# Keep native arm skin and the source's adjacent one-pixel edge. The former
# two-pixel search included detached shirt/torso edges beyond the actual arm.
code=code.replace('range(-2,3)', 'range(-1,2)')
code=code.replace("\t\t\t\telif max(c.r,max(c.g,c.b))<0.48:\n\t\t\t\t\tmask[q]=true\n", '')
code=code.replace("ink=Color('#fffdf9' if c.r>0.96 else '#efeaf4' if c.r>0.88 else '#beb5ca' if c.r>0.78 else '#7e758a')", "ink=Color('#fffdf9' if c.g>0.85 else '#efeaf4' if c.g>0.78 else '#d9d1e2' if c.g>0.70 else '#beb5ca' if c.g>0.62 else '#7e758a')")
code=code.replace("ink=Color('#a16acd' if c.r>0.92 else '#8250ac' if c.r>0.8 else '#4e2c66')", "ink=Color('#be8ee0' if c.g>0.85 else '#a16acd' if c.g>0.77 else '#8250ac' if c.g>0.67 else '#663c8c' if c.g>0.59 else '#4e2c66')")
code=code.replace("ink=Color('#4c465c' if right_arm else '#663c8c')", "ink=Color('#beb5ca' if c.g>0.68 else '#7e758a' if c.g>0.48 else '#4c465c') if right_arm else Color('#a16acd' if c.g>0.68 else '#8250ac' if c.g>0.48 else '#663c8c')")
code=code.replace("# Copy the base's actual opaque outline/cuff neighbours; no rotated samples or new limb shapes.", "# Adjacent source pixels only: no distant torso fragments, no rotation or resampling.")
if (ART/'shoulder-fill.json').exists():
    code=code.replace("['legs','far','core','near','cap','frame']", "['legs','far','core','near','cap','joint','frame']")
    code=code.replace("\t\tvar full=legs.duplicate()", "\t\tvar joint=api.create_image(128,128)\n\t\tvar fillfile='rear-shoulder-fill.json' if d=='ne' else 'shoulder-fill.json'\n\t\tif FileAccess.file_exists(root+fillfile):\n\t\t\tvar fills=JSON.parse_string(FileAccess.get_file_as_string(root+fillfile))\n\t\t\tfor p in fills.frames[str(n+1)]:joint.set_pixel(int(p.x),int(p.y),Color(p.color))\n\t\tvar full=legs.duplicate()")
    code=code.replace('[far,core,near,cap]', '[far,core,near,cap,joint]').replace("'cap':cap,'frame':full", "'cap':cap,'joint':joint,'frame':full")
(ROOT/'tools/art/build-scarlet2-walk-v6.gd').write_text(code,encoding='utf8')
package=(ROOT/'tools/art/package-scarlet2-walk-v5.py').read_text(encoding='utf8').replace('scarlet2-walk-v5','scarlet2-walk-v6').replace("'version':5", "'version':6").replace('scarlet2-walk-v4/frame-', 'scarlet2-walk-v5/frame-')
package=package.replace('retaining native source pixels and alpha', 'retaining every source skin pixel and the directly adjacent source outline; excludes distant shirt/torso fragments')
package=package.replace("{d}-v5.pxo", "{d}-v6.pxo")
package=package.replace('source outlines and hand sizes retained', 'source skin and hand sizes retained; one-pixel adjacent source outline')
package=package.replace("'armSourceAlphaExact':True", "'extractedArmAlphaExact':True,'sourceSkinPreserved':True,'outlineNeighbourhood':1")
needle="            assert im.size==(128,128)"
extra="""            # V6 is exclusively an arm cleanup; all other layer pixels stay V5.
            for kind in ['core','legs','cap']:
                assert np.array_equal(np.array(rgba(ART/f'{kind}-{d}-{n+1}.png')),np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/{kind}-{d}-{n+1}.png'))), f'{kind} changed'
            for arm in range(2):
                raw=np.array(rgba(ART/f'source-arm-{d}-{arm}-{n+1}.png'))
                prev=np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/source-arm-{d}-{arm}-{n+1}.png'))
                r,g,b=prev[:,:,0].astype(int),prev[:,:,1].astype(int),prev[:,:,2].astype(int)
                skin=(prev[:,:,3]>0)&(r>g+20)&(r>b+20)&(r>145)
                assert np.array_equal(raw[skin],prev[skin]), 'Actual base skin/hand pixels lost'
                assert not np.any((raw[:,:,3]>0)&(prev[:,:,3]==0)), 'Expanded beyond source mask'
"""
package=package.replace(needle,extra+needle)
if (ART/'shoulder-fill.json').exists():
    needle="            assert np.array_equal(a,np.array(composed)), 'Native layer mismatch'"
    addition="""            fillfile='rear-shoulder-fill.json' if d=='ne' else 'shoulder-fill.json'
            if (ART/fillfile).exists():
                composed.alpha_composite(rgba(ART/f'joint-{d}-{n+1}.png'))
            baseline=np.array(rgba(ART/f'before-shoulder-fill/frame-{d}-{n+1}.png'))
            permitted=np.zeros((128,128),dtype=bool)
            if (ART/fillfile).exists():
                fills=json.loads((ART/fillfile).read_text())
                for p in fills['frames'][str(n+1)]:permitted[p['y'],p['x']]=True
            assert np.array_equal(a[~permitted],baseline[~permitted]), 'Changed outside requested joint holes'
            assert np.all(baseline[permitted,3]==0) and np.all(a[permitted,3]==255), 'Joint patch must only fill transparency'
"""
    package=package.replace(needle,addition+needle)
    package=package.replace("files=['palette.json','preserved-sources.json']", "files=['palette.json','preserved-sources.json','shoulder-fill.json']+[f'joint-se-{n}.png' for n in range(1,5)]")
    package=package.replace("report['alignment']=", "report['jointFill']={'armSePixels':[9,5,3,8],'scabbardSePixels':[20,17,13,20],'sw':'exact mirror','otherPixelsUnchanged':True,'layers':{'se':6,'ne':5}}\n    report['alignment']=")
    package=package.replace("'head occlusion']", "'head occlusion','SE joint fill (transparent holes only)']")
    package=package.replace("'package-scarlet2-walk-v6.py']", "'package-scarlet2-walk-v6.py','fill-scarlet2-walk-v6-shoulder.gd','prepare-scarlet2-v6-shoulder-fill.py','prepare-scarlet2-walk-v6.py']")
if (ART/'rear-shoulder-fill.json').exists():
    package=package.replace("'ne':5", "'ne':6")
    package=package.replace("'SE joint fill (transparent holes only)'", "'arm/scabbard joint fill (transparent holes only)'")
    package=package.replace("    allsheet=Image.new", "    rear=json.loads((ART/'rear-shoulder-fill.json').read_text())\n    for name,s in rear['preservedFrontSha256'].items():assert sha(ART/name)==s, 'Corrected front changed'\n    report['jointFill']['armNePixels']=rear['armPixels']\n    report['jointFill']['scabbardNePixels']=rear['scabbardPixels']\n    allsheet=Image.new")
    package=package.replace("files=['palette.json','preserved-sources.json','shoulder-fill.json']", "files=['palette.json','preserved-sources.json','shoulder-fill.json','rear-shoulder-fill.json']+[f'joint-ne-{n}.png' for n in range(1,5)]")
    package=package.replace("'prepare-scarlet2-v6-shoulder-fill.py'", "'prepare-scarlet2-v6-shoulder-fill.py','prepare-scarlet2-v6-rear-fill.py'")
if (ART/'scabbard-line.json').exists():
    code=code.replace("['legs','far','core','near','cap','joint','frame']", "['legs','far','core','near','cap','joint','outline','frame']")
    code=code.replace("\t\tvar full=legs.duplicate()", "\t\tvar outline=api.create_image(128,128)\n\t\tvar linefile=root+'outline-'+d+'-'+str(n+1)+'.png'\n\t\tif FileAccess.file_exists(linefile):outline=Image.load_from_file(linefile)\n\t\tvar full=legs.duplicate()")
    code=code.replace('[far,core,near,cap,joint]', '[far,core,near,cap,joint,outline]').replace("'joint':joint,'frame':full", "'joint':joint,'outline':outline,'frame':full")
    (ROOT/'tools/art/build-scarlet2-walk-v6.gd').write_text(code,encoding='utf8')
    package=package.replace("sha(ART/name)==s, 'Corrected front changed'", "sha(ART/'before-scabbard-outline'/name)==s, 'Pre-outline corrected front changed'")
    package=package.replace("            baseline=np.array(rgba(ART/f'before-shoulder-fill/frame-{d}-{n+1}.png'))", """            line=rgba(ART/f'outline-{d}-{n+1}.png')
            composed.alpha_composite(line)
            line_mask=np.array(line)[:,:,3]>0
            preline=np.array(rgba(ART/f'before-scabbard-outline/frame-{d}-{n+1}.png'))
            assert np.array_equal(a[:,:,3],preline[:,:,3]), 'Scabbard silhouette/alpha changed'
            assert np.array_equal(a[~line_mask],preline[~line_mask]), 'Changed outside scabbard ink'
            assert np.all(preline[line_mask,3]==255), 'Outline must be inside existing scabbard'
            unlined=a.copy();unlined[line_mask]=preline[line_mask]
            baseline=np.array(rgba(ART/f'before-shoulder-fill/frame-{d}-{n+1}.png'))""")
    package=package.replace('a[~permitted],baseline[~permitted]', 'unlined[~permitted],baseline[~permitted]')
    package=package.replace("    allsheet=Image.new", "    report['scabbardOutline']={'insideExistingAlpha':True,'thickness':1,'nonScabbardPixelsPreserved':True,'layers':7}\n    allsheet=Image.new")
    package=package.replace("files=['palette.json'", "files=['scabbard-line.json']+[f'outline-{d}-{n}.png' for d in ['se','ne'] for n in range(1,5)]+['palette.json'")
    package=package.replace("'prepare-scarlet2-v6-rear-fill.py'", "'prepare-scarlet2-v6-rear-fill.py','prepare-scarlet2-v6-scabbard-line.py','outline-scarlet2-walk-v6-scabbard.gd'")
if (ART/'front-scabbard-straight.json').exists():
    helper="""
def scabbard_edit_mask(d,n):
    mask=np.zeros((128,128),dtype=bool)
    if d=='se':
        straight=json.loads((ART/'front-scabbard-straight.json').read_text())
        bob=straight['bobY'][n-1]
        for x,top,bottom in straight['oldColumns']+straight['columns']:mask[top+bob:bottom+bob+1,x]=True
    return mask

"""
    package=package.replace('def main():',helper+'def main():')
    package=package.replace("assert np.array_equal(np.array(rgba(ART/f'{kind}-{d}-{n+1}.png')),np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/{kind}-{d}-{n+1}.png'))), f'{kind} changed'", "assert np.array_equal(np.array(rgba(ART/f'{kind}-{d}-{n+1}.png'))[~(scabbard_edit_mask(d,n+1) if kind=='core' else np.zeros((128,128),dtype=bool))],np.array(rgba(ROOT/f'docs/art/pixel/scarlet2-walk-v5/{kind}-{d}-{n+1}.png'))[~(scabbard_edit_mask(d,n+1) if kind=='core' else np.zeros((128,128),dtype=bool))]), f'{kind} changed outside front sheath'")
    package=package.replace('line_mask=np.array(line)[:,:,3]>0', 'line_mask=(np.array(line)[:,:,3]>0)|scabbard_edit_mask(d,n+1)')
    package=package.replace('np.all(a[permitted,3]==255)', 'np.all(unlined[permitted,3]==255)')
    package=package.replace("assert np.array_equal(a[:,:,3],preline[:,:,3]), 'Scabbard silhouette/alpha changed'", "assert np.array_equal(a[:,:,3][~scabbard_edit_mask(d,n+1)],preline[:,:,3][~scabbard_edit_mask(d,n+1)]), 'Changed alpha outside front sheath'")
    package=package.replace("assert np.all(preline[line_mask,3]==255), 'Outline must be inside existing scabbard'", "assert d=='se' or np.all(preline[line_mask,3]==255), 'Rear outline must stay inside original scabbard'")
    package=package.replace("    allsheet=Image.new", "    straight=json.loads((ART/'front-scabbard-straight.json').read_text())\n    for name,s in straight['preservedRearSha256'].items():assert sha(ART/name)==s, 'Rear artwork changed during front correction'\n    report['frontScabbardStraight']={'parallelEdges':True,'rearUnchanged':True,'goldTipUnchanged':True}\n    allsheet=Image.new")
    package=package.replace("'insideExistingAlpha':True", "'insideExistingAlpha':'rear; front straight contour adjusted'")
    package=package.replace("files=['scabbard-line.json']", "files=['scabbard-line.json','front-scabbard-straight.json']")
    package=package.replace("'outline-scarlet2-walk-v6-scabbard.gd'", "'outline-scarlet2-walk-v6-scabbard.gd','prepare-scarlet2-v6-front-straight.py','straighten-scarlet2-walk-v6-front.gd'")
    trim="""
func trim_front_sheath(art:Image,n:int):
	var data=JSON.parse_string(FileAccess.get_file_as_string(root+'front-scabbard-straight.json'))
	var bob=int(data.bobY[n])
	for cols in [data.oldColumns,data.columns]:
		for col in cols:
			for y in range(int(col[1])+bob,int(col[2])+bob+1):art.set_pixel(int(col[0]),y,Color.TRANSPARENT)
"""
    code+=trim
    code=code.replace("\t\tvar legs=", "\t\tif d=='se':trim_front_sheath(core,n)\n\t\tvar legs=")
    code=code.replace("\t\tvar full=legs.duplicate()", "\t\tif d=='se':trim_front_sheath(joint,n)\n\t\tvar full=legs.duplicate()")
    (ROOT/'tools/art/build-scarlet2-walk-v6.gd').write_text(code,encoding='utf8')
if (ART/'front-scabbard-straight.json').exists() and json.loads((ART/'front-scabbard-straight.json').read_text()).get('mode')=='approved-standing-pixels':
    package=package.replace("report['frontScabbardStraight']={'parallelEdges':True,'rearUnchanged':True,'goldTipUnchanged':True}", "report['frontScabbardStanding']={'source':'scarlet2-base-v2/idle-se.png','visibleReferencePixelsExact':True,'rearUnchanged':True,'goldTipUnchanged':True}")
    package=package.replace("            assert im.size==(128,128)", """            if d=='se':
                source=np.array(rgba(ROOT/'docs/art/pixel/scarlet2-base-v2/idle-se.png'))
                arm=np.array(rgba(ART/f'near-se-{n+1}.png'))
                details=json.loads((ART/'front-scabbard-straight.json').read_text());bob=details['bobY'][n]
                for x,top,bottom in details['columns']:
                    if x<details['referenceStartX']:continue
                    for yy in range(top,bottom+1):
                        if arm[yy+bob,x,3]==0:assert np.array_equal(a[yy+bob,x],source[yy,x]), 'Walking sheath differs from approved standing reference'
            assert im.size==(128,128)""")
    package=package.replace("'prepare-scarlet2-v6-front-straight.py'", "'prepare-scarlet2-v6-front-straight.py','prepare-scarlet2-v6-standing-scabbard.py'")
if (ROOT/'apps/client/src/scarlet2.ts').exists() and (ROOT/'apps/client/public/sprites/scarlet2/approved-v6/manifest.json').exists():
    package=package.replace("'runtimeConnected':False", "'runtimeConnected':True")
    package=package.replace("    print(json.dumps({'protectedFiles'", "    import runpy\n    runpy.run_path(str(ROOT/'tools/art/sync-scarlet2-runtime.py'),run_name='__main__')\n    print(json.dumps({'protectedFiles'")
(ROOT/'tools/art/package-scarlet2-walk-v6.py').write_text(package,encoding='utf8')
page=(ROOT/'apps/client/public/scarlet2-walk-v5/index.html').read_text(encoding='utf8')
page=page.replace('scarlet2-walk-v5','scarlet2-walk-v6').replace('scarlet2-walk-v4','scarlet2-walk-v5')
page=page.replace('수정 전 V4','수정 전 V5').replace('수정 후 V5','수정 후 V6').replace('걷기 V5 베이스 도트','걷기 V6 팔 도트 정리')
page=page.replace('승인 베이스의 네 컷 팔을 직접 가져와 피부와 보호구를 입혔어요. 베이스와 같은 프레임으로 움직임과 외곽선을 비교해 보세요.', '베이스의 손과 팔 자세를 유지하면서 불필요하게 따라온 외곽선 조각을 덜고, 보호구 명암을 정리했어요. V5와 같은 프레임으로 비교할 수 있어요.')
page=page.replace('작은 팔 조각의 회전 때문에 외곽선과 보호구가 흐트러진 V4예요.', '베이스 팔을 가져왔지만 주변 몸통선이 일부 따라왔고, 흰 보호구의 명암이 약했던 V5예요.')
page=page.replace('베이스 팔의 원래 픽셀 선과 손 크기를 유지해요. 회전이나 크기 변형은 없어요.', '피부와 손 크기는 그대로 두고, 팔 가장자리와 보호구의 밝고 어두운 면을 정리했어요.')
page=page.replace('움직임 보정 검수본이에요.', '팔 도트 정리 검수본이에요.')
(PUBLIC/'index.html').write_text(page,encoding='utf8')
check=(v5/'check-browser.mjs').read_text(encoding='utf8').replace('scarlet2-walk-v5','scarlet2-walk-v6').replace('scarlet2-walk-v4','scarlet2-walk-v5')
check=check.replace('`[data-frame="${n}"]`', '`button[data-frame="${n}"]`').replace("'[data-frame=\"0\"]'", "'button[data-frame=\"0\"]'").replace("'[data-frame=\"2\"]'", "'button[data-frame=\"2\"]'")
(ART/'check-browser.mjs').write_text(check,encoding='utf8')
print(json.dumps({'protected':len(preserved),'nativeScript':'tools/art/build-scarlet2-walk-v6.gd'}))
