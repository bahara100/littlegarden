"""Package native Pixelorama exports; validate preserved pixels and exact mirrors.

Drawing/pose edits happen in the saved .pxo projects, not in this packaging script.
"""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel'
PUBLIC = ROOT / 'apps/client/public'


def pixels(path):
    a = np.array(Image.open(path).convert('RGBA'))
    assert a.shape == (96, 96, 4)
    assert set(np.unique(a[..., 3])) <= {0, 255}
    a[a[..., 3] == 0] = 0  # Ignore invisible RGB in the old PNGs when comparing.
    return a


def write(folder, public, files, info):
    out = ART / folder
    dest = PUBLIC / public
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ART / 'garden-body-base-v1/palette.json', out / 'palette.json')
    files = [*files, 'palette.json']
    info['assets'] = [{'file': n, 'sha256': hashlib.sha256((out / n).read_bytes()).hexdigest()} for n in files]
    (out / 'manifest.json').write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding='utf-8')
    files.append('manifest.json')
    for n in files:
        shutil.copyfile(out / n, dest / n)
    with zipfile.ZipFile(out / 'layers.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for n in files:
            z.write(out / n, n)
    shutil.copyfile(out / 'layers.zip', dest / 'layers.zip')


def page(public, title, description, cards, badge):
    items = ''.join(f'<article><h2>{label}</h2><div class="checker"><img src="{image}" alt="{label}" width="96" height="96"></div></article>' for label, image in cards)
    html = f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f5f0f7;color:#44364d;font:16px/1.65 system-ui,sans-serif}}main{{max-width:1000px;margin:auto;padding:24px}}a{{color:#795489}}h1{{font-size:26px;margin-bottom:10px}}h2{{font-size:17px;margin:12px 8px}}nav{{display:flex;flex-wrap:wrap;gap:8px 16px}}.badge{{display:inline-block;padding:3px 12px;border-radius:20px;background:#e6d8ee;font-size:14px}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:24px}}article{{border:1px solid #ded3e5;border-radius:14px;overflow:hidden;background:white;text-align:center}}.checker{{background:repeating-conic-gradient(#e6dfed 0 25%,#faf5fc 0 50%) 0/20px 20px}}img{{display:block;width:100%;height:auto;image-rendering:pixelated}}.muted{{color:#796784;font-size:14px}}a:focus-visible{{outline:3px solid #a380b9;outline-offset:3px}}@media(max-width:600px){{main{{padding:16px}}.grid{{gap:8px}}h1{{font-size:23px}}h2{{font-size:14px}}}}
</style><main><nav><a href="../body-base-v2/index.html">서 있는 몸체</a><a href="../body-walk-se-v20/index.html">승인 걷기 V20</a><a href="../body-sit-friends-v1/index.html">모모·루루 참고 앉기</a></nav>
<h1>{title}</h1><span class="badge">{badge}</span><p>{description}</p>
<section class="grid">{items}</section>
<p><a href="layers.zip">몸·머리 편집 파일</a> · <a href="manifest.json">자산 기록</a> · <a href="../body-sit-se-v1/index.html">별도 보관한 첫 앉기 시안</a></p>
<p class="muted">현재는 자세와 비율을 확인하는 제작 화면입니다. 의상 덧그림과 실제 놀이터 연결은 다음 단계입니다.</p></main></html>'''
    (PUBLIC / public / 'index.html').write_text(html, encoding='utf-8')


def main():
    idle = ART / 'garden-body-base-v2'
    f = pixels(idle / 'base-idle-se.png')
    old = pixels(ART / 'garden-body-base-v1/base-idle-se.png')
    assert np.array_equal(f[:54], old[:54])
    assert np.array_equal(f[75:], old[75:])
    h, b = pixels(idle / 'base-head.png'), pixels(idle / 'base-body.png')
    joined = b.copy()
    joined[h[..., 3] > 0] = h[h[..., 3] > 0]
    assert np.array_equal(joined, f)
    for n in ['momo-head.png', 'lulu-head.png']:
        shutil.copyfile(ART / 'garden-body-base-v1' / n, idle / n)
    shutil.copyfile(ART / 'garden-body-base-v1/base-idle-se.png', idle / 'previous-idle-se.png')
    colours = len({tuple(c) for c in f[f[..., 3] > 0][:, :3]})
    write('garden-body-base-v2', 'body-base-v2',
          ['base-idle-se.png', 'base-head.png', 'base-body.png', 'base-preview-6x.png',
           'previous-idle-se.png', 'momo-head.png', 'lulu-head.png', 'garden-body-idle-relaxed-v2.pxo', 'prompt.txt'],
          {'version': 2, 'pose': 'idle-se-relaxed-arms', 'status': 'user-accepted', 'frameSize': [96, 96],
           'bodyColors': colours, 'headAndLowerLegsPreserved': True, 'layerSplitRow': 54,
           'method': 'Built-in image_gen arm draft; Pixelorama palette mapping and native head/body layers',
           'outfitsNeedNewSleevesAndHands': True, 'runtimeConnected': False})

    for folder, public, status in [('garden-body-sit-se-v1', 'body-sit-se-v1', 'stored-alternative-at-user-request'),
                                   ('garden-body-sit-friends-v1', 'body-sit-friends-v1', 'awaiting-user-review')]:
        out = ART / folder
        se, sw = pixels(out / 'sit-se.png'), pixels(out / 'sit-sw.png')
        assert np.array_equal(se[:54], f[:54]), 'Sitting head must be the existing idle head'
        assert np.array_equal(sw, se[:, ::-1]), 'SW must mirror each complete SE frame'
        for d in ['se', 'sw']:
            head, body = pixels(out / f'sit-head-{d}.png'), pixels(out / f'sit-body-{d}.png')
            together = body.copy()
            together[head[..., 3] > 0] = head[head[..., 3] > 0]
            assert np.array_equal(together, se if d == 'se' else sw)
        files = [f'{kind}-{d}.png' for kind in ['sit', 'sit-head', 'sit-body'] for d in ['se', 'sw']]
        files += ['sit-se-preview-6x.png', 'sit-sw-preview-6x.png', 'prompt.txt']
        if folder == 'garden-body-sit-friends-v1':
            files += ['garden-body-sit-friends-se-v1.pxo', 'reference-momo-sit.png', 'reference-lulu-sit.png']
        else:
            files += ['garden-body-sit-se-v1.pxo', 'garden-body-sit-sw-v1.pxo']
        write(folder, public, files,
              {'version': 1, 'status': status, 'frameSize': [96, 96], 'frameCountPerDirection': 1,
               'directions': ['SE', 'SW'], 'mirror': 'x -> 95 - x', 'layerSplitRow': 54,
               'bodyColors': len({tuple(c) for c in se[se[..., 3] > 0][:, :3]}),
               'headMatchesIdle': True, 'mirrorExact': True, 'runtimeConnected': False,
               'source': 'Momo/Lulu actual game sitting cells 0 and 4' if 'friends' in folder else 'independent seated-pose alternative',
               'method': 'Built-in image_gen pose draft; Pixelorama palette mapping, existing head and native layers'})
    page('body-base-v2', '공통 몸체 · 편안한 정지 자세',
         '가슴 앞에 모았던 손을 내려 몸통 양옆에 두었습니다. 팔꿈치를 살짝 굽히고 좌우 각도를 다르게 해 힘을 뺀 모습입니다.',
         [('이전 · 손을 모은 자세', 'previous-idle-se.png'), ('정지 V2 · 편안한 팔', 'base-idle-se.png')],
         '96×96 · 19색 · 정지 1컷')
    page('body-sit-se-v1', '공통 몸체 · 별도 보관한 앉기 시안',
         '처음 만든 허벅지가 앞으로 나온 앉기 자세입니다. 요청대로 따로 보관했고, 모모·루루의 앉기 자세를 참고한 베이스는 별도 페이지에서 확인할 수 있습니다.',
         [('첫 시안 · 앞오른쪽 SE', 'sit-se.png'), ('첫 시안 · 앞왼쪽 SW 반전', 'sit-sw.png')],
         '별도 보관 · 96×96 · 방향당 1컷')
    page('body-sit-friends-v1', '공통 몸체 · 모모·루루 참고 앉기',
         '실제 모모·루루의 앉기 그림을 참고해 손과 팔꿈치를 몸 가까이에 모으고, 짧은 다리와 발을 가까이 둔 자세로 만들었습니다. 먼저 만든 앉기 시안은 별도로 보관했습니다.',
         [('새 베이스 · 앞오른쪽 SE', 'sit-se.png'), ('새 베이스 · 앞왼쪽 SW 반전', 'sit-sw.png'),
          ('게임 참고 · 모모 앉기', 'reference-momo-sit.png'), ('게임 참고 · 루루 앉기', 'reference-lulu-sit.png')],
         '96×96 · 방향당 정지 1컷 · 검토용')
    print('Packaged idle V2 and both separate sitting studies. Existing head, lower legs and exact SW mirrors verified.')


if __name__ == '__main__':
    main()
