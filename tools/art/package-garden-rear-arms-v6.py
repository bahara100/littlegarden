"""Package Pixelorama's local 2/4 arm edit; never touch friend runtime assets."""
import importlib.util
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel'
PUBLIC = ROOT / 'apps/client/public'
OUT = ART / 'garden-body-walk-ne-v6'
spec = importlib.util.spec_from_file_location('preview', ROOT / 'tools/art/build-garden-body-walk-se-v3.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
h.HEAD_ROWS = 45
h.SRC = str(ART / 'garden-body-walk-se-v20')

def read(path):
    return np.array(Image.open(path).convert('RGBA'))

frames = [read(OUT / f'frame-{n}-native.png') for n in range(1, 5)]
checks = []
for n, f in enumerate(frames, 1):
    old = read(ART / 'garden-body-walk-ne-v5' / f'frame-{n}.png')
    changed = np.any(f != old, axis=2)
    if n in (1, 3):
        assert not changed.any()
    assert np.array_equal(f[:45], old[:45])
    assert np.array_equal(f[68:], old[68:])
    # Torso centre remains the original core, not a newly generated body.
    if n in (2, 4):
        assert np.array_equal(f[45:68, 44:55], old[45:68, 44:55])
    assert h.connected(f), f'Frame {n} disconnected'
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'garden-body-walk-se-v20/palette.json').read_text())}
    assert {tuple(c[:3]) for c in f[f[..., 3] > 0]} <= palette
    checks.append({'frame': n, 'changedPixels': int(changed.sum())})
meta = {'version': 6, 'from': 'garden-body-walk-ne-v5',
        'stage': 'compact-arms-and-armpit-pixel-cleanup-awaiting-review',
        'preservedFrames': [1, 3], 'preservedHeadRows': [0, 44],
        'preservedLowerBodyRows': [68, 95], 'checks': checks}
for direction, fs in [('ne', frames), ('nw', [f[:, ::-1].copy() for f in frames])]:
    folder = ART / f'garden-body-walk-{direction}-v6'
    dest = PUBLIC / f'body-walk-{direction}-v6'
    h.write_outputs(fs, ['V5 with hand-drawn compact arms 2/4 and shirt-edge cleanup'] * 4,
                    {**meta, 'direction': direction}, str(folder), str(dest))
    html = (PUBLIC / f'body-walk-{direction}-v5/index.html').read_text(encoding='utf-8')
    html = html.replace('ne-v5', 'ne-v6').replace('nw-v5', 'nw-v6').replace('V5', 'V6')
    html = html.replace('2·4번 팔 수정: 길게 처진 대기 팔 대신, 기존 걷기 팔의 팔꿈치를 굽힌 중간 동작으로 다듬었습니다. 1·3번과 다리·보폭은 그대로입니다.',
                        '2·4번 팔을 짧고 둥근 형태로 다시 그렸습니다. 늘어난 도트와 손·소매의 빈 점, 겨드랑이에 남은 겹친 외곽선을 정리했습니다. 1·3번과 하체는 그대로입니다.')
    (dest / 'index.html').write_text(html, encoding='utf-8')
    if direction == 'ne':
        for native in OUT.glob('*.pxo'):
            shutil.copyfile(native, dest / native.name)
# Existing review URL updates only the bare body, not the dressed characters.
shutil.copyfile(OUT / 'walk.png', PUBLIC / 'friends-base-walk-v1/base-walk-ne.png')
p = PUBLIC / 'friends-base-walk-v1/index.html'
html = p.read_text(encoding='utf-8').replace('NE V5', 'NE V6').replace('NE/NW V5', 'NE/NW V6').replace('ne-v5/', 'ne-v6/')
p.write_text(html, encoding='utf-8')
(OUT / 'verification.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(checks))
