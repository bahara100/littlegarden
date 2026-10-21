"""Seated V2: approved head/palette, continuous seated body, referenced to common-body anchors."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/scarlet2-sit-v2'
STANDING = ROOT / 'docs/art/pixel/scarlet2-base-v2'
PREVIOUS = ROOT / 'docs/art/pixel/scarlet2-sit-v1'
PUBLIC = ROOT / 'apps/client/public/scarlet2-sit-v2'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    im = Image.open(path).convert('RGBA')
    assert im.size == (128, 128), path
    assert set(np.unique(np.array(im)[:, :, 3])) <= {0, 255}, path
    return im


def main():
    PUBLIC.mkdir(exist_ok=True)
    preserved = json.loads((ART / 'preserved-sources.json').read_text())
    for name, expected in preserved.items():
        assert sha(ROOT / name) == expected, f'Protected source changed: {name}'
    assert sha(ART / 'palette.json') == sha(STANDING / 'palette.json')
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'palette.json').read_text())}
    report = {'name': '홍련2', 'version': 2, 'pose': 'basic chair sitting', 'status': 'User art review pending',
        'standingV2Approved': True, 'standingV2Unchanged': True, 'runtimeConnected': False,
        'newImageGeneration': False, 'frameSize': 128, 'paletteLimit': 64, 'protectedFiles': len(preserved),
        'sources': ['se', 'ne'], 'mirrors': {'sw': 'se', 'nw': 'ne'},
        'headOffsets': {'se': [0, 0], 'ne': [-3, 0]}, 'separateLegSplice': False,
        'method': 'Existing full seated wardrobe draft refitted as one continuous neck-to-boots block; approved standingV2 head and64-color palette reused.',
        'baseReferences': {'se': 'garden-body-sit-friends-v1/sit-se.png', 'ne': 'garden-body-sit-ne-v1/sit-ne.png'},
        'baseOffset': [16, 24], 'bodyFits': {'se': [76, 42, 38], 'ne': [76, 38, 35]}, 'directions': {}}
    files = ['palette.json', 'preserved-sources.json']
    for d, mirror in [('se', 'sw'), ('ne', 'nw')]:
        im = load(ART / f'sit-{d}.png')
        full = np.array(im)
        head = load(ART / f'head-{d}.png')
        original = load(STANDING / f'head-{d}.png')
        expected = Image.new('RGBA', (128, 128))
        expected.alpha_composite(original, (0, 0) if d == 'se' else (-3, 0))
        assert np.array_equal(np.array(head), np.array(expected)), f'{d}: approved head changed'
        assert np.count_nonzero(np.array(head)[:, :, 3]) == np.count_nonzero(np.array(original)[:, :, 3]), 'Head clipped'
        mask = np.array(head)[:, :, 3] > 0
        assert np.array_equal(full[mask], np.array(head)[mask]), 'Visible head mismatch'
        joined = Image.new('RGBA', (128, 128))
        for name in ['body', 'head']:
            joined.alpha_composite(load(ART / f'{name}-{d}.png'))
        assert np.array_equal(full, np.array(joined)), 'Layer composite mismatch'
        body = np.array(load(ART / f'body-{d}.png'))
        reference = np.array(load(ART / f'reference-body-{d}.png'))
        assert np.array_equal(body[:, :, 3], reference[:, :, 3]), 'Continuous source body silhouette changed'
        base = load(PREVIOUS / f'base-sit-{d}.png')
        assert im.getbbox()[3] == base.getbbox()[3], 'Foot height differs from common seated body'
        assert {tuple(p) for p in full[full[:, :, 3] > 0, :3]} <= palette
        ImageOps.mirror(im).save(ART / f'sit-{mirror}.png')
        base.save(PUBLIC / f'base-{d}.png')
        ImageOps.mirror(base).save(PUBLIC / f'base-{mirror}.png')
        comparison = Image.new('RGBA', (384, 128))
        for column, item in enumerate([base, load(STANDING / f'idle-{d}.png'), im]):
            comparison.alpha_composite(item, (column * 128, 0))
        comparison.resize((1536, 512), Image.Resampling.NEAREST).save(ART / f'base-standing-sitting-{d}.png')
        report['directions'][d] = {'sha256': sha(ART / f'sit-{d}.png'), 'headPixelsPreserved': True,
            'layerCompositeExact': True, 'bodySilhouetteMatchesContinuousSource': True,
            'footHeightMatchesBase': True, 'footBottom': im.getbbox()[3] - 1,
            'visibleColors': len(np.unique(full[full[:, :, 3] > 0, :3], axis=0))}
        shoe_backup = ART / 'before-shoe-detail' / f'sit-{d}.png'
        if shoe_backup.exists():
            before = np.array(load(shoe_backup))
            x, y, width, height = (56, 103, 19, 11) if d == 'se' else (65, 101, 18, 10)
            allowed = np.zeros((128, 128), dtype=bool)
            allowed[y:y+height, x:x+width] = True
            changed = np.any(before != full, axis=2)
            assert np.array_equal(before[:, :, 3], full[:, :, 3]), 'Shoe correction changed pose/silhouette'
            assert not changed[~allowed].any(), 'Shoe correction affected head/torso/other clothes'
            assert changed.any(), 'Shoe detail correction missing'
            assert sha(ART / f'head-{d}.png') == sha(ART / 'before-shoe-detail' / f'head-{d}.png')
            report['directions'][d]['shoeDetail'] = {'changedPixels': int(changed.sum()),
                'allowedRectangle': [x, y, width, height], 'outsidePixelsUnchanged': True, 'allAlphaUnchanged': True}
        files += [f'{name}-{d}.png' for name in ['body', 'head', 'reference-body']]
        files.append(f'scarlet2-sit-{d}-v2.pxo')
    sheet = Image.new('RGBA', (256, 256))
    for n, d in enumerate(['se', 'sw', 'ne', 'nw']):
        im = load(ART / f'sit-{d}.png')
        if d in ['sw', 'nw']:
            assert np.array_equal(np.array(im), np.array(load(ART / f'sit-{"se" if d == "sw" else "ne"}.png'))[:, ::-1])
        im.resize((512, 512), Image.Resampling.NEAREST).save(ART / f'preview-{d}-4x.png')
        sheet.alpha_composite(im, (n % 2 * 128, n // 2 * 128))
        shutil.copyfile(STANDING / f'idle-{d}.png', PUBLIC / f'standing-{d}.png')
        files += [f'sit-{d}.png', f'preview-{d}-4x.png']
    sheet.save(ART / 'sit-four.png')
    sheet.resize((768, 768), Image.Resampling.NEAREST).save(ART / 'sit-four-preview.png')
    if (ART / 'before-shoe-detail/sit-se.png').exists():
        detail = Image.new('RGBA', (72, 32))
        for row, d in enumerate(['se', 'ne']):
            for col, folder in enumerate([ART / 'before-shoe-detail', ART]):
                detail.alpha_composite(load(folder / f'sit-{d}.png').crop((52, 100, 88, 116)), (col * 36, row * 16))
        detail.resize((576, 256), Image.Resampling.NEAREST).save(ART / 'shoe-detail-before-after.png')
        files.append('shoe-detail-before-after.png')
    (ART / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    files += ['manifest.json', 'sit-four.png', 'sit-four-preview.png']
    for name in files:
        shutil.copyfile(ART / name, PUBLIC / name)
    with zipfile.ZipFile(ART / 'scarlet2-sitting-v2.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name in files:
            z.write(ART / name, name)
    shutil.copyfile(ART / 'scarlet2-sitting-v2.zip', PUBLIC / 'scarlet2-sitting-v2.zip')
    print('SeatedV2 four directions: approvedV2 heads and palette exact; body silhouette continuous; feet match common base height; layers and mirrors exact;70 source files preserved.')


if __name__ == '__main__':
    main()
