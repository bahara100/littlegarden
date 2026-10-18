"""Package local hand-volume repair, preserving the V6 arms and game V2."""
import importlib.util
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel'
PUBLIC = ROOT / 'apps/client/public'
OUT = ART / 'garden-body-walk-ne-v7'
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
    old = read(ART / 'garden-body-walk-ne-v6' / f'frame-{n}.png')
    changed = np.any(f != old, axis=2)
    allowed = np.zeros((96,96), bool)
    if n in (2,4):
        allowed[55 if n==2 else 53:64,31:41] = True
        allowed[53 if n==2 else 55:64,61:72] = True
    assert not (changed & ~allowed).any(), (n,'outside hand edit')
    assert h.connected(f), (n,'disconnected')
    assert {tuple(c[:3]) for c in f[f[...,3]>0]} <= palette
    checks.append({'frame':n,'changedPixels':int(changed.sum()),'outsideHandsUnchanged':True})
meta = {'version':7,'from':'garden-body-walk-ne-v6','stage':'hand-volume-repair-awaiting-review','checks':checks}
for direction, fs in [('ne',frames),('nw',[f[:,::-1].copy() for f in frames])]:
    folder = ART / f'garden-body-walk-{direction}-v7'
    dest = PUBLIC / f'body-walk-{direction}-v7'
    h.write_outputs(fs,['V6 with hand-only volume repair']*4,{**meta,'direction':direction},str(folder),str(dest))
    html = (PUBLIC / f'body-walk-{direction}-v6/index.html').read_text(encoding='utf-8')
    html = html.replace('ne-v6','ne-v7').replace('nw-v6','nw-v7').replace('V6','V7')
    html = html.replace('2·4번 팔을 짧고 둥근 형태로 다시 그렸습니다. 늘어난 도트와 손·소매의 빈 점, 겨드랑이에 남은 겹친 외곽선을 정리했습니다. 1·3번과 하체는 그대로입니다.',
        '2·4번에서 작아진 손의 폭과 볼륨을 복원했습니다. 손 주변만 수정했고 V6의 팔·소매·몸통·하체와 1·3번은 그대로입니다.')
    (dest/'index.html').write_text(html,encoding='utf-8')
    if direction=='ne':
        for native in OUT.glob('*.pxo'): shutil.copyfile(native,dest/native.name)
shutil.copyfile(OUT/'walk.png',PUBLIC/'friends-base-walk-v1/base-walk-ne.png')
p = PUBLIC/'friends-base-walk-v1/index.html'
p.write_text(p.read_text(encoding='utf-8').replace('NE V6','NE V7').replace('NE/NW V6','NE/NW V7').replace('ne-v6/','ne-v7/'),encoding='utf-8')
(OUT/'verification.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(json.dumps(checks))
