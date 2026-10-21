"""Validate the continuous-source restoration and package a separate review revision."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/scarlet2-base-v2'
OLD = ROOT / 'docs/art/pixel/scarlet2-base-v1'
PUBLIC = ROOT / 'apps/client/public/scarlet2-base-v2'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    im = Image.open(path).convert('RGBA')
    assert im.size == (128, 128), path
    assert set(np.unique(np.array(im)[:, :, 3])) <= {0, 255}
    return im


def main():
    PUBLIC.mkdir(exist_ok=True)
    preserved = json.loads((ART / 'preserved-sources.json').read_text())
    for name, expected in preserved.items():
        assert sha(ROOT / name) == expected, f'Previous art changed: {name}'
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'palette.json').read_text())}
    assert len(palette) <= 64
    manifest = {'name': '홍련2', 'version': 2, 'status': 'User art review pending', 'runtimeConnected': False,
                'newImageGeneration': False, 'frameSize': 128, 'paletteLimit': 64,
                'method': 'Re-map continuous original full-frame art to reserved material ramps. No horizontal leg replacement or separated hip/shin anatomy.',
                'sourceDirections': ['se', 'ne'], 'mirrors': {'sw': 'se', 'nw': 'ne'},
                'sourceExtraOffset': {'se': [0, 0], 'ne': [0, 1]},
                'exactBaseFootReplacement': False, 'preservedPreviousFiles': len(preserved), 'directions': {}}
    files = ['palette.json', 'palette-ramps.json', 'preserved-sources.json']
    sheet = Image.new('RGBA', (256, 256))
    for d, mirror in [('se', 'sw'), ('ne', 'nw')]:
        im = load(ART / f'idle-{d}.png')
        a = np.array(im)
        reference = load(ART / f'reference-{d}.png')
        assert np.array_equal(a[:, :, 3], np.array(reference)[:, :, 3]), f'{d}: source outline changed'
        assert {tuple(p) for p in a[a[:, :, 3] > 0, :3]} <= palette
        joined = Image.new('RGBA', (128, 128))
        for part in ['body', 'head']:
            joined.alpha_composite(load(ART / f'{part}-{d}.png'))
        assert np.array_equal(np.array(joined), a), 'Editor split broke full-frame anatomy'
        ImageOps.mirror(im).save(ART / f'idle-{mirror}.png')
        ImageOps.mirror(reference).save(ART / f'reference-{mirror}.png')
        manifest['directions'][d] = {'sha256': sha(ART / f'idle-{d}.png'),
            'sourceSilhouetteExact': True, 'layerCompositeExact': True,
            'visibleColors': len(np.unique(a[a[:, :, 3] > 0, :3], axis=0))}
        files += [f'body-{d}.png', f'head-{d}.png', f'scarlet2-idle-{d}-v2.pxo']
    a = np.array(load(ART / 'idle-se.png')).astype(int)
    b = np.array(load(OLD / 'idle-se.png')).astype(int)
    def material_counts(pixels):
        eyes = pixels[63:69, 58:77, :3]
        gear = pixels[85:101, 70:84, :3]
        return {'warmBrownIrisPixels': int(np.count_nonzero((eyes[:, :, 0] > eyes[:, :, 1] + 20) & (eyes[:, :, 1] > eyes[:, :, 2] + 8) & (eyes[:, :, 0] < 230))),
                'violetHipGearPixels': int(np.count_nonzero((gear[:, :, 2] > gear[:, :, 0] + 8) & (gear[:, :, 0] > gear[:, :, 1] + 12)))}
    before, after = material_counts(b), material_counts(a)
    assert after['warmBrownIrisPixels'] > before['warmBrownIrisPixels'] + 10
    assert after['violetHipGearPixels'] > before['violetHipGearPixels'] + 20
    manifest['materialInspection'] = {'before': before, 'after': after, 'note': 'Local hue checks, not user art approval.'}
    for n, d in enumerate(['se', 'sw', 'ne', 'nw']):
        im = load(ART / f'idle-{d}.png')
        if d in ['sw', 'nw']:
            src = load(ART / f'idle-{"se" if d == "sw" else "ne"}.png')
            assert np.array_equal(np.array(im), np.array(src)[:, ::-1])
        assert im.getbbox()[3] == 115
        im.resize((512, 512), Image.Resampling.NEAREST).save(ART / f'preview-{d}-4x.png')
        sheet.alpha_composite(im, (n % 2 * 128, n // 2 * 128))
        shutil.copyfile(OLD / f'idle-{d}.png', PUBLIC / f'previous-{d}.png')
        files += [f'idle-{d}.png', f'reference-{d}.png', f'preview-{d}-4x.png']
    sheet.save(ART / 'idle-four.png')
    sheet.resize((768, 768), Image.Resampling.NEAREST).save(ART / 'idle-four-preview.png')
    # Actual before/after pixels, enlarged identically. Detail sheet rows: eyes, hip gear/leg join.
    details = Image.new('RGBA', (96, 46))
    for col, im in enumerate([load(OLD / 'idle-se.png'), load(ART / 'idle-se.png')]):
        details.alpha_composite(im.crop((48, 57, 86, 78)), (col * 48, 0))
        details.alpha_composite(im.crop((48, 88, 86, 113)), (col * 48, 21))
    details.resize((768, 368), Image.Resampling.NEAREST).save(ART / 'details-before-after.png')
    (ART / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    files += ['idle-four.png', 'idle-four-preview.png', 'details-before-after.png', 'manifest.json']
    for name in files:
        shutil.copyfile(ART / name, PUBLIC / name)
    shutil.copyfile(OLD / 'source-ai-se.png', PUBLIC / 'source-ai-se.png')
    shutil.copyfile(OLD / 'rear/source-ai-ne.png', PUBLIC / 'source-ai-ne.png')
    with zipfile.ZipFile(ART / 'scarlet2-restored-v2.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name in files:
            z.write(ART / name, name)
    shutil.copyfile(ART / 'scarlet2-restored-v2.zip', PUBLIC / 'scarlet2-restored-v2.zip')
    print(json.dumps({'preservedFiles': len(preserved), 'sourceOutlineExact': True, 'materials': manifest['materialInspection']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
