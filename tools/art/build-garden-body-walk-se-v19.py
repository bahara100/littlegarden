"""Package the V19 frame-1 candidate exported from the editable Pixelorama V18 project.

Only the existing leg layers were edited. Native nearest-pixel row offsets:
left/front: rows 73..76 +1x, rows 77+ +2x with one repeated row at 76;
right/back: rows 71..72 -1x, 73..76 -2x, 77+ -3x.
The hips (through row 70), shading, shoe artwork and upper body are preserved.
V18 remains the approved baseline; frames 2..4 are unchanged, no game integration.
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/pixel/garden-body-walk-se-v19'
BASE = ROOT / 'docs/art/pixel/garden-body-walk-se-v18'
PUBLIC = ROOT / 'apps/client/public/body-walk-se-v19'
spec = importlib.util.spec_from_file_location('walk_v3', Path(__file__).with_name('build-garden-body-walk-se-v3.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def main():
    frames = [np.array(Image.open(BASE / f'frame-{i}.png').convert('RGBA')) for i in range(1, 5)]
    original = [f.copy() for f in frames]
    drawn = np.array(Image.open(OUT / 'frame1-pixelorama.png').convert('RGBA'))
    drawn[drawn[..., 3] < 128] = 0
    drawn[drawn[..., 3] > 0, 3] = 255
    assert np.array_equal(drawn[:71], original[0][:71]), 'Upper body / hip attachment changed'
    palette = {tuple(c) for f in original for c in f[f[..., 3] > 0]}
    assert {tuple(c) for c in drawn[drawn[..., 3] > 0]} <= palette
    frames[0] = drawn
    helper.write_outputs(frames, ['V19 Pixelorama leg-layer edit from V18'] +
                         [f'V18 frame {i}, unchanged' for i in range(2, 5)],
                         {'version': 19, 'stage': 'frame1-stride-candidate-awaiting-user-review',
                          'from': 'garden-body-walk-se-v18', 'approvedBaseline': 'garden-body-walk-se-v18',
                          'frame1': {'tool': 'Pixelorama MCP', 'project': 'garden-body-se-frame1-v19.pxo',
                                     'frontLeg': 'anatomical left; screen-right hip; foot +2x,+1y',
                                     'backLeg': 'anatomical right; screen-left hip; foot -3x,0y',
                                     'unchangedRows': [0, 70]}}, str(OUT), str(PUBLIC))
    for i in range(1, 4):
        assert (OUT / f'frame-{i + 1}.png').read_bytes() == (BASE / f'frame-{i + 1}.png').read_bytes()
    before_after = Image.new('RGBA', (192, 96))
    before_after.paste(Image.fromarray(original[0]), (0, 0))
    before_after.paste(Image.fromarray(drawn), (96, 0))
    before_after.resize((1152, 576), Image.Resampling.NEAREST).save(OUT / 'frame1-before-after-6x.png')
    Image.fromarray(drawn).resize((576, 576), Image.Resampling.NEAREST).save(OUT / 'frame1-preview-6x.png')
    (PUBLIC / 'frame1-before-after-6x.png').write_bytes((OUT / 'frame1-before-after-6x.png').read_bytes())
    changed = np.any(drawn != original[0], axis=2)
    ys, xs = np.where(changed)
    report = {'frame1ChangedPixels': int(changed.sum()),
              'changedBoundsInclusive': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
              'frames234ByteIdentical': True, 'upperBodyAndHipUnchanged': True,
              'publicSheetIdentical': (PUBLIC / 'walk.png').read_bytes() == (OUT / 'walk.png').read_bytes(),
              'note': 'Technical preservation checks only; pose and loop quality await user review.'}
    (OUT / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
