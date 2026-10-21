"""Four standing directions, with a locked approved front and exact whole-frame mirrors."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/scarlet2-base-v1'
REAR = ART / 'rear'
PUBLIC = ROOT / 'apps/client/public/scarlet2-base-v1'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def image(path):
    im = Image.open(path).convert('RGBA')
    assert im.size == (128, 128), path
    assert set(np.unique(np.array(im)[:, :, 3])) <= {0, 255}, path
    return im


def main():
    for name, expected in json.loads((REAR / 'approved-front-sha256.json').read_text()).items():
        assert sha(ART / name) == expected, f'Approved front changed: {name}'
    for name, expected in json.loads((ART / 'preserved-sources.json').read_text()).items():
        assert sha(ROOT / name) == expected, f'Original changed: {name}'
    rear = image(REAR / 'idle-ne.png')
    joined = Image.new('RGBA', (128, 128))
    for name in ['legs', 'costume', 'upper']:
        joined.alpha_composite(image(REAR / f'{name}-ne.png'))
    assert np.array_equal(np.array(joined), np.array(rear)), 'Rear layer composite differs'
    base = np.array(image(REAR / 'base-padded-ne.png'))
    legs = np.array(image(REAR / 'legs-ne.png'))
    assert np.array_equal(legs[99:, :, 3], base[99:, :, 3]), 'Rear base leg silhouette differs'
    assert np.array_equal(np.array(rear)[103:, :, 3], base[103:, :, 3]), 'Rear visible foot geometry differs'
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ART / 'palette.json').read_text())}
    pixels = np.array(rear)
    assert {tuple(c) for c in pixels[pixels[:, :, 3] > 0, :3]} <= palette
    shutil.copyfile(REAR / 'idle-ne.png', ART / 'idle-ne.png')
    ImageOps.mirror(rear).save(ART / 'idle-nw.png')
    directions = ['se', 'sw', 'ne', 'nw']
    sheet = Image.new('RGBA', (256, 256))
    manifest = json.loads((ART / 'manifest.json').read_text(encoding='utf8'))
    manifest.update({
        'status': 'Four standing directions; front approved, rear awaiting art review',
        'sourceDirections': ['se', 'ne'], 'mirroredDirections': {'sw': 'se', 'nw': 'ne'},
        'frontApproved': True, 'frontUnchanged': True,
        'rearBaseSource': 'garden-friends-base-walk-v2/base-idle-ne.png', 'rearBaseOffset': [16, 26],
        'rearBaseLegAlphaExactFromRow': 99, 'rearVisibleFeetAlphaExactFromRow': 103,
        'pending': ['Rear art approval', 'Apply SE V20 / user-edited NE V8 walk poses', 'Sitting', 'Game connection'],
        'assets': {},
    })
    for n, d in enumerate(directions):
        im = image(ART / f'idle-{d}.png')
        if d in ['sw', 'nw']:
            original = image(ART / f'idle-{"se" if d == "sw" else "ne"}.png')
            assert np.array_equal(np.array(im), np.array(original)[:, ::-1]), d
        assert im.getbbox()[3] == 115, f'{d}: feet baseline changed'
        sheet.alpha_composite(im, (n % 2 * 128, n // 2 * 128))
        im.resize((512, 512), Image.Resampling.NEAREST).save(ART / f'preview-{d}-4x.png')
        manifest['assets'][f'idle-{d}.png'] = sha(ART / f'idle-{d}.png')
    sheet.save(ART / 'idle-four.png')
    sheet.resize((768, 768), Image.Resampling.NEAREST).save(ART / 'idle-four-preview.png')
    # Same-size reference copies for the comparison selector in all four directions.
    for d in ['se', 'ne']:
        b = image(ART / 'base-padded-se.png' if d == 'se' else REAR / 'base-padded-ne.png')
        b.save(PUBLIC / f'base-{d}.png')
        ImageOps.mirror(b).save(PUBLIC / f'base-{"sw" if d == "se" else "nw"}.png')
        old = Image.open(ROOT / f'docs/art/pixel/scarlet-ingame-sd-v1/idle-{d}.png').convert('RGBA')
        comparison = Image.new('RGBA', (128, 128))
        comparison.alpha_composite(old, (16, 115 - old.getbbox()[3]))
        comparison.save(PUBLIC / f'previous-{d}.png')
        ImageOps.mirror(comparison).save(PUBLIC / f'previous-{"sw" if d == "se" else "nw"}.png')
    (ART / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    files = [f'idle-{d}.png' for d in directions] + [f'preview-{d}-4x.png' for d in directions]
    files += ['idle-four.png', 'idle-four-preview.png', 'manifest.json', 'palette.json', 'prompt.txt', 'scarlet2-base-idle-se-v1.pxo']
    files += [f'{name}-se.png' for name in ['legs', 'costume', 'upper']]
    rear_files = ['scarlet2-base-idle-ne-v1.pxo', 'prompt-ne.txt', 'base-padded-ne.png']
    rear_files += [f'{name}-ne.png' for name in ['legs', 'costume', 'upper']]
    for name in files:
        shutil.copyfile(ART / name, PUBLIC / name)
    for name in rear_files:
        shutil.copyfile(REAR / name, PUBLIC / name)
    with zipfile.ZipFile(ART / 'scarlet2-authoring.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name in files:
            z.write(ART / name, name)
        for name in rear_files:
            z.write(REAR / name, f'rear/{name}')
    shutil.copyfile(ART / 'scarlet2-authoring.zip', PUBLIC / 'scarlet2-authoring.zip')
    print('Four standing directions verified: approved front unchanged; rear legs/feet exact; shared48-color palette; two exact mirrors; layer composition and original assets preserved.')


if __name__ == '__main__':
    main()
