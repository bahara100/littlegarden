"""Package Pixelorama's complete rear seated pose; never rewrite approved base/game art."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/pixel/garden-body-sit-ne-v1'
PUBLIC = ROOT / 'apps/client/public/body-sit-ne-v1'
FRONT = ROOT / 'docs/art/pixel/garden-body-sit-friends-v1'


def pixels(path):
    a = np.array(Image.open(path).convert('RGBA'))
    assert a.shape == (96, 96, 4)
    assert set(np.unique(a[..., 3])) <= {0, 255}
    a[a[..., 3] == 0] = 0
    return a


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    ne, nw = [pixels(OUT / f'sit-{d}.png') for d in ['ne', 'nw']]
    assert np.array_equal(ne[:, ::-1], nw), 'NW must be the exact whole-frame mirror'
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((OUT / 'palette.json').read_text())}
    assert {tuple(p[:3]) for p in ne[ne[..., 3] > 0]} <= palette
    # The head, neck, torso, bent legs and shoes must all be connected in the full sprite.
    unseen = {(x, y) for y in range(96) for x in range(96) if ne[y, x, 3]}
    stack = [unseen.pop()]
    while stack:
        x, y = stack.pop()
        for q in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]:
            if q in unseen:
                unseen.remove(q)
                stack.append(q)
    assert not unseen, 'Detached sprite pixels must be reviewed'
    for direction, full in [('ne', ne), ('nw', nw)]:
        head, body = [pixels(OUT / f'sit-{layer}-{direction}.png') for layer in ['head', 'body']]
        assert not np.any((head[..., 3] > 0) & (body[..., 3] > 0))
        joined = body.copy()
        joined[head[..., 3] > 0] = head[head[..., 3] > 0]
        assert np.array_equal(joined, full)
        Image.fromarray(full).resize((576, 576), Image.Resampling.NEAREST).save(OUT / f'sit-{direction}-preview-6x.png')
    pair = Image.new('RGBA', (1152, 576))
    pair.paste(Image.open(OUT / 'sit-ne-preview-6x.png'), (0, 0))
    pair.paste(Image.open(OUT / 'sit-nw-preview-6x.png'), (576, 0))
    pair.save(OUT / 'rear-pair-preview.png')
    files = [f'sit{layer}-{direction}.png' for layer in ['', '-head', '-body'] for direction in ['ne', 'nw']]
    files += ['sit-ne-preview-6x.png', 'sit-nw-preview-6x.png', 'rear-pair-preview.png',
              'palette.json', 'prompt.txt', 'garden-body-sit-ne-v1.pxo']
    info = {
        'version': 1, 'status': 'awaiting-user-review', 'frameSize': [96, 96],
        'directions': ['NE', 'NW'], 'frameCountPerDirection': 1, 'mirror': 'x -> 95 - x',
        'method': 'Built-in image_gen complete rear seated draft; Pixelorama uniform full-frame scaling, existing front-sit palette and lossless layer split',
        'sourceImage': 'source-sit-ai.png', 'sourceHeadWidth': 603, 'targetHeadWidth': 48,
        'targetHeadTop': 5, 'layerSplitRow': 52, 'nativeLayers': ['body', 'head'],
        'visibleColors': len({tuple(p[:3]) for p in ne[ne[..., 3] > 0]}),
        'frontPoseReference': 'garden-body-sit-friends-v1',
        'rearStyleReference': 'garden-body-walk-ne-v2/source-cycle.png',
        'runtimeConnected': False,
        'technicalChecks': {'binaryAlpha': True, 'wholeSpriteConnected': True, 'layersRecomposeExactly': True, 'mirrorExact': True},
        'preservedReferences': {str(p.relative_to(ROOT)).replace('\\', '/'): sha(p) for p in [
            FRONT / 'sit-se.png', FRONT / 'sit-sw.png',
            ROOT / 'docs/art/pixel/garden-body-walk-ne-v8/walk.png',
            ROOT / 'docs/art/pixel/garden-body-walk-se-v20/walk.png',
        ]},
        'assets': [{'file': name, 'sha256': sha(OUT / name)} for name in files],
        'note': 'Technical checks do not mean pose approval. No costume/seat-height/game changes.',
    }
    (OUT / 'manifest.json').write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding='utf-8')
    files.append('manifest.json')
    for name in files:
        shutil.copyfile(OUT / name, PUBLIC / name)
    for d in ['se', 'sw']:
        for layer in ['', '-body']:
            shutil.copyfile(FRONT / f'sit{layer}-{d}.png', PUBLIC / f'reference-front{layer}-{d}.png')
    with zipfile.ZipFile(OUT / 'layers.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in files:
            archive.write(OUT / name, name)
    shutil.copyfile(OUT / 'layers.zip', PUBLIC / 'layers.zip')
    print(json.dumps({k: info[k] for k in ['frameSize', 'directions', 'visibleColors', 'technicalChecks', 'runtimeConnected']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
