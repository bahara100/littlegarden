"""Package Scarlet 2's separate standing draft; never replace game Scarlet or common bases."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/scarlet2-base-v1'
REVIEW = ROOT / 'apps/client/public/scarlet2-base-v1'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if (ART / 'idle-ne.png').exists():
        raise SystemExit('Four directions now exist. Use package-scarlet2-idle-four-v1.py to preserve the current review and manifest.')
    REVIEW.mkdir(exist_ok=True)
    preserved = json.loads((ART / 'preserved-sources.json').read_text(encoding='utf8'))
    for path, expected in preserved.items():
        assert sha(ROOT / path) == expected, f'Protected original changed: {path}'
    full = Image.open(ART / 'idle-se.png').convert('RGBA')
    pixels = np.array(full)
    base = np.array(Image.open(ART / 'base-padded-se.png').convert('RGBA'))
    legs = np.array(Image.open(ART / 'legs-se.png').convert('RGBA'))
    assert np.array_equal(legs[99:, :, 3], base[99:, :, 3]), 'Base leg silhouette must remain exact'
    assert np.array_equal(pixels[99:, :80, 3], base[99:, :80, 3]), 'Visible feet must match the common base'
    assert set(np.unique(pixels[:, :, 3])) <= {0, 255}
    joined = Image.new('RGBA', full.size)
    for name in ['legs', 'costume', 'upper']:
        joined.alpha_composite(Image.open(ART / f'{name}-se.png').convert('RGBA'))
    assert np.array_equal(np.array(joined), pixels), 'Editor layers and exported sprite must match'
    colors = len(np.unique(pixels[pixels[:, :, 3] > 0, :3], axis=0))
    assert colors <= 48
    ImageOps.mirror(full).save(ART / 'idle-sw.png')
    # Comparisons use the same pixel scale and floor row, rather than auto-fitting each silhouette.
    old = Image.open(ROOT / 'docs/art/pixel/scarlet-ingame-sd-v1/idle-se.png').convert('RGBA')
    old_canvas = Image.new('RGBA', (128, 128))
    old_canvas.alpha_composite(old, (16, 115 - old.getbbox()[3]))
    old_canvas.save(ART / 'previous-scarlet-se.png')
    sheet = Image.new('RGBA', (384, 128))
    for i, im in enumerate([Image.fromarray(base), old_canvas, full]):
        sheet.alpha_composite(im, (i * 128, 0))
    sheet.resize((1536, 512), Image.Resampling.NEAREST).save(ART / 'comparison.png')
    for d in ['se', 'sw']:
        im = Image.open(ART / f'idle-{d}.png')
        im.resize((512, 512), Image.Resampling.NEAREST).save(ART / f'preview-{d}-4x.png')
    report = {
        'name': '홍련2', 'version': 1, 'status': 'standing design draft, awaiting art review',
        'builtInImageGen': True, 'runtimeConnected': False, 'originalScarletPreserved': True,
        'canvas': [128, 128], 'baseCanvas': [96, 96], 'baseOffset': [16, 24],
        'baseSource': 'garden-body-base-v2/base-idle-se.png', 'feetBaseline': 114,
        'sourceDirections': ['se'], 'mirroredDirections': {'sw': 'se'},
        'paletteColors': colors, 'binaryAlpha': True, 'baseLegAlphaExactFromRow': 99,
        'layersRecomposeExactly': True,
        'method': 'AI head and tailored upper outfit aligned to the body; actual base lower-leg/foot geometry retained and reclothed in Pixelorama. Upper body is a draft, not a proven interchangeable animation rig.',
        'pending': ['Art approval', 'NE standing reference', 'Apply SE V20 / user-edited NE V8 walk poses', 'Sitting', 'Game connection'],
        'preservedSourceCount': len(preserved),
    }
    (ART / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    files = ['idle-se.png', 'idle-sw.png', 'base-padded-se.png', 'previous-scarlet-se.png',
             'comparison.png', 'preview-se-4x.png', 'preview-sw-4x.png', 'palette.json', 'manifest.json',
             'prompt.txt', 'scarlet2-base-idle-se-v1.pxo', 'legs-se.png', 'costume-se.png', 'upper-se.png']
    for name in files:
        shutil.copyfile(ART / name, REVIEW / name)
    with zipfile.ZipFile(ART / 'scarlet2-authoring.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in files:
            archive.write(ART / name, name)
    shutil.copyfile(ART / 'scarlet2-authoring.zip', REVIEW / 'scarlet2-authoring.zip')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
