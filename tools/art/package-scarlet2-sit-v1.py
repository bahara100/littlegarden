"""Package four seated directions, protecting standing art and the original game characters."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/scarlet2-sit-v1'
STANDING = ROOT / 'docs/art/pixel/scarlet2-base-v1'
PUBLIC = ROOT / 'apps/client/public/scarlet2-sit-v1'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    im = Image.open(path).convert('RGBA')
    assert im.size == (128, 128), path
    a = np.array(im)
    assert set(np.unique(a[:, :, 3])) <= {0, 255}, path
    return im


def main():
    PUBLIC.mkdir(exist_ok=True)
    for snapshot in [ART / 'preserved-sources.json', STANDING / 'preserved-sources.json']:
        for name, expected in json.loads(snapshot.read_text()).items():
            assert sha(ROOT / name) == expected, f'Protected art changed: {name}'
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'palette.json').read_text())}
    assert sha(ART / 'palette.json') == sha(STANDING / 'palette.json')
    report = {'name': '홍련2', 'pose': 'sitting', 'status': 'User art review pending',
              'standingApproved': True, 'standingUnchanged': True, 'runtimeConnected': False,
              'canvas': [128, 128], 'sourceDirections': ['se', 'ne'],
              'mirrors': {'sw': 'se', 'nw': 'ne'}, 'paletteLimit': 48,
              'baseOffset': [16, 24], 'headOffsetsFromStanding': {'se': [0, 0], 'ne': [-3, 0]},
              'headsPreserved': True, 'baseFeetAlphaExactFromRow': 103, 'directions': {}}
    for d in ['se', 'ne']:
        full = load(ART / f'sit-{d}.png')
        a = np.array(full)
        base = np.array(load(ART / f'base-sit-{d}.png'))
        assert np.array_equal(a[103:, :, 3], base[103:, :, 3]), f'{d}: base feet differ'
        head = load(ART / f'head-{d}.png')
        original = load(STANDING / ('upper-se.png' if d == 'se' else 'rear/upper-ne.png'))
        expected = Image.new('RGBA', (128, 128))
        expected.alpha_composite(original, (0, 0) if d == 'se' else (-3, 0))
        assert np.array_equal(np.array(head), np.array(expected)), f'{d}: head redraw'
        assert np.count_nonzero(np.array(head)[:, :, 3]) == np.count_nonzero(np.array(original)[:, :, 3]), 'Head clipped'
        mask = np.array(head)[:, :, 3] > 0
        assert np.array_equal(a[mask], np.array(head)[mask]), 'Visible head differs'
        composite = Image.new('RGBA', (128, 128))
        for part in ['legs', 'costume', 'head']:
            composite.alpha_composite(load(ART / f'{part}-{d}.png'))
        assert np.array_equal(np.array(composite), a), 'Layer export mismatch'
        assert {tuple(p) for p in a[a[:, :, 3] > 0, :3]} <= palette, 'Palette drift'
        mirror = 'sw' if d == 'se' else 'nw'
        ImageOps.mirror(full).save(ART / f'sit-{mirror}.png')
        report['directions'][d] = {'sha256': sha(ART / f'sit-{d}.png'),
            'visibleColors': len(np.unique(a[a[:, :, 3] > 0, :3], axis=0)), 'footBottom': full.getbbox()[3] - 1,
            'layerCompositeExact': True, 'feetMatchBase': True}
        load(ART / f'base-sit-{d}.png').save(PUBLIC / f'base-{d}.png')
        ImageOps.mirror(load(ART / f'base-sit-{d}.png')).save(PUBLIC / f'base-{mirror}.png')
    sheet = Image.new('RGBA', (256, 256))
    for n, d in enumerate(['se', 'sw', 'ne', 'nw']):
        im = load(ART / f'sit-{d}.png')
        if d in ['sw', 'nw']:
            assert np.array_equal(np.array(im), np.array(load(ART / f'sit-{"se" if d == "sw" else "ne"}.png'))[:, ::-1])
        sheet.alpha_composite(im, (n % 2 * 128, n // 2 * 128))
        im.resize((512, 512), Image.Resampling.NEAREST).save(ART / f'preview-{d}-4x.png')
        shutil.copyfile(STANDING / f'idle-{d}.png', PUBLIC / f'standing-{d}.png')
    sheet.save(ART / 'sit-four.png')
    sheet.resize((768, 768), Image.Resampling.NEAREST).save(ART / 'sit-four-preview.png')
    (ART / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    files = ['palette.json', 'manifest.json', 'sit-four.png', 'sit-four-preview.png', 'prompt-se.txt', 'prompt-ne.txt']
    files += [f'sit-{d}.png' for d in ['se', 'sw', 'ne', 'nw']]
    files += [f'preview-{d}-4x.png' for d in ['se', 'sw', 'ne', 'nw']]
    for d in ['se', 'ne']:
        files += [f'{p}-{d}.png' for p in ['legs', 'costume', 'head', 'base-sit']]
        files.append(f'scarlet2-sit-{d}-v1.pxo')
    for name in files:
        shutil.copyfile(ART / name, PUBLIC / name)
    with zipfile.ZipFile(ART / 'scarlet2-sitting-authoring.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name in files:
            z.write(ART / name, name)
    shutil.copyfile(ART / 'scarlet2-sitting-authoring.zip', PUBLIC / 'scarlet2-sitting-authoring.zip')
    print('Four sitting directions: standing sources intact, heads reused exactly (rear x-3 only), source feet silhouettes intact, shared48-color palette, exact mirrors and layer exports.')


if __name__ == '__main__':
    main()
