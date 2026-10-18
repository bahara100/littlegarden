"""Package source-arm restoration and verify the original pelvis survives exactly."""
import importlib.util
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel'
PUBLIC = ROOT / 'apps/client/public'
OUT = ART / 'garden-body-walk-ne-v8'
if (OUT / 'MANUAL_EDIT_LOCK.json').exists():
    raise SystemExit('V8 is user-edited. Use sync-garden-rear-v8-manual.py with fresh native exports; do not rebuild old candidates.')
spec = importlib.util.spec_from_file_location('preview', ROOT / 'tools/art/build-garden-body-walk-se-v3.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
h.HEAD_ROWS = 45
h.SRC = str(ART / 'garden-body-walk-se-v20')
read = lambda p: np.array(Image.open(p).convert('RGBA'))
frames = [read(OUT / f'frame-{n}-native.png') for n in range(1,5)]
palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'garden-body-walk-se-v20/palette.json').read_text())}
checks = []
for n, f in enumerate(frames,1):
    old = read(ART / 'garden-body-walk-ne-v7' / f'frame-{n}.png')
    source = read(ART / 'garden-body-walk-ne-v3' / f'frame-{n}.png')
    changed = np.any(f != old, axis=2)
    allowed = np.zeros((96,96), bool)
    if n in (2,4):
        allowed[45:68,25:73] = True
        assert np.array_equal(f[60:68,37:62],source[60:68,37:62]), (n,'pelvis damaged')
    assert not (changed & ~allowed).any(), (n,'outside arm/hip edit')
    assert np.array_equal(f[:45],old[:45])
    assert np.array_equal(f[68:],old[68:])
    assert h.connected(f), (n,'disconnected')
    assert {tuple(c[:3]) for c in f[f[...,3]>0]} <= palette
    checks.append({'frame':n,'changedPixels':int(changed.sum()),'headAndLegsPreserved':True,'originalPelvisRestored':n in (2,4)})
meta = {'version':8,'from':'garden-body-walk-ne-v7','pelvisSource':'garden-body-walk-ne-v3','stage':'drawn-arm-and-pelvis-restoration-awaiting-review','checks':checks}
for direction, fs in [('ne',frames),('nw',[f[:,::-1].copy() for f in frames])]:
    folder = ART / f'garden-body-walk-{direction}-v8'
    dest = PUBLIC / f'body-walk-{direction}-v8'
    h.write_outputs(fs,['V7 with original drawn arms and V3 pelvis restored']*4,{**meta,'direction':direction},str(folder),str(dest))
    html = (PUBLIC / f'body-walk-{direction}-v7/index.html').read_text(encoding='utf-8')
    html = html.replace('ne-v7','ne-v8').replace('nw-v7','nw-v8').replace('V7','V8')
    html = html.replace('2·4번에서 작아진 손의 폭과 볼륨을 복원했습니다. 손 주변만 수정했고 V6의 팔·소매·몸통·하체와 1·3번은 그대로입니다.',
        '2·4번은 기존 걷기 그림의 팔·손 명암과 굵기를 재사용했습니다. 잘린 왼쪽 엉덩이와 반바지 외곽선은 원본으로 복원했습니다. 1·3번과 다리·보폭은 유지했습니다.')
    (dest/'index.html').write_text(html,encoding='utf-8')
    if direction=='ne':
        for native in OUT.glob('*.pxo'): shutil.copyfile(native,dest/native.name)
shutil.copyfile(OUT/'walk.png',PUBLIC/'friends-base-walk-v1/base-walk-ne.png')
p = PUBLIC/'friends-base-walk-v1/index.html'
p.write_text(p.read_text(encoding='utf-8').replace('NE V7','NE V8').replace('NE/NW V7','NE/NW V8').replace('ne-v7/','ne-v8/'),encoding='utf-8')
(OUT/'verification.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(json.dumps(checks))
