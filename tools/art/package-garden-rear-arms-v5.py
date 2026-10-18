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
OUT = ART / 'garden-body-walk-ne-v5'
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
    old = read(ART / 'garden-body-walk-ne-v4' / f'frame-{n}.png')
    changed = np.any(f != old, axis=2)
    if n in (1, 3):
        assert not changed.any()
    assert np.array_equal(f[:45], old[:45])
    assert np.array_equal(f[68:], old[68:])
    # Torso centre remains the original core, not a newly generated body.
    if n in (2, 4):
        core = read(ART / 'garden-body-walk-ne-v4' / f'core-{n}.png')
        assert np.array_equal(f[45:68, 44:57], core[45:68, 44:57])
    assert h.connected(f), f'Frame {n} disconnected'
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'garden-body-walk-se-v20/palette.json').read_text())}
    assert {tuple(c[:3]) for c in f[f[..., 3] > 0]} <= palette
    checks.append({'frame': n, 'changedPixels': int(changed.sum())})
meta = {'version': 5, 'from': 'garden-body-walk-ne-v4',
        'stage': 'passing-arms-2-4-awaiting-review',
        'preservedFrames': [1, 3], 'preservedHeadRows': [0, 44],
        'preservedLowerBodyRows': [68, 95], 'checks': checks}
for direction, fs in [('ne', frames), ('nw', [f[:, ::-1].copy() for f in frames])]:
    folder = ART / f'garden-body-walk-{direction}-v5'
    dest = PUBLIC / f'body-walk-{direction}-v5'
    h.write_outputs(fs, ['V4 with only passing arms 2/4 refined'] * 4,
                    {**meta, 'direction': direction}, str(folder), str(dest))
    html = (PUBLIC / f'body-walk-{direction}-v4/index.html').read_text(encoding='utf-8')
    html = html.replace('ne-v4', 'ne-v5').replace('nw-v4', 'nw-v5').replace('V4', 'V5')
    html = html.replace('팔 고정 수정: 1·3번은 반대 팔 스윙, 2·4번은 통과 자세입니다. 기존 다리와 보폭은 유지했습니다.',
                        '2·4번 팔 수정: 길게 처진 대기 팔 대신, 기존 걷기 팔의 팔꿈치를 굽힌 중간 동작으로 다듬었습니다. 1·3번과 다리·보폭은 그대로입니다.')
    html = html.replace('팔 수정본을 모모·루루의 뒤 걷기에도 연결했습니다. 새 팔 순환은 사용자 검토 대상입니다.',
                        '이번 수정은 베이스 몸체만의 검토용입니다. 모모·루루 게임 걷기는 선택한 V2를 유지합니다.')
    (dest / 'index.html').write_text(html, encoding='utf-8')
    if direction == 'ne':
        for native in OUT.glob('*.pxo'):
            shutil.copyfile(native, dest / native.name)
# Existing review URL updates only the bare body, not the dressed characters.
shutil.copyfile(OUT / 'walk.png', PUBLIC / 'friends-base-walk-v1/base-walk-ne.png')
p = PUBLIC / 'friends-base-walk-v1/index.html'
html = p.read_text(encoding='utf-8').replace('SE V20 · NE V3 / 원본 자세', 'SE V20 · NE V5 / 2·4번 팔 수정')
html = html.replace('뒤 걷기 팔 수정 · 1·3번은 반대 스윙, 2·4번은 중간 통과 자세예요.',
                    '베이스 뒤 걷기 2·4번 팔을 다시 다듬었어요. <a href="../body-walk-ne-v5/index.html">베이스 네 컷 크게 보기 ↗</a>')
html = html.replace('베이스 뒤 걷기 NE/NW V4 · 팔이 번갈아 움직이도록 고쳤고 모모·루루의 소매와 손도 맞췄어요.',
                    '베이스 뒤 걷기 NE/NW V5 · 2·4번 팔만 수정했어요. 아래 의상 시안은 이전 V3이며 게임은 V2를 유지해요.')
p.write_text(html, encoding='utf-8')
(OUT / 'verification.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(checks))
