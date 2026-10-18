"""Package V20: V19 frame 1, each foot 1px inward, native Pixelorama leg edit."""
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'docs/art/pixel/garden-body-walk-se-v19'
OUT = ROOT / 'docs/art/pixel/garden-body-walk-se-v20'
PUBLIC = ROOT / 'apps/client/public/body-walk-se-v20'
spec = importlib.util.spec_from_file_location('walk_v3', Path(__file__).with_name('build-garden-body-walk-se-v3.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def main():
    frames = [np.array(Image.open(BASE / f'frame-{i}.png').convert('RGBA')) for i in range(1, 5)]
    original = frames[0].copy()
    edited = np.array(Image.open(OUT / 'frame1-pixelorama.png').convert('RGBA'))
    edited[edited[..., 3] < 128] = 0
    edited[edited[..., 3] > 0, 3] = 255
    assert np.array_equal(edited[:77], original[:77])
    palette = {tuple(c) for f in frames for c in f[f[..., 3] > 0]}
    assert {tuple(c) for c in edited[edited[..., 3] > 0]} <= palette
    frames[0] = edited
    helper.write_outputs(frames, ['V20 Pixelorama: V19 feet 1px inward each'] +
                         [f'V19 frame {i}, unchanged' for i in range(2, 5)],
                         {'version': 20, 'stage': 'approved',
                          'approval': {'date': '2026-10-18', 'quote': '좋아좋아. 이 버전으로 정할께.'},
                          'from': 'garden-body-walk-se-v19',
                          'frame1': {'tool': 'Pixelorama MCP', 'project': 'garden-body-se-frame1-v20.pxo',
                                     'frontLeftLeg': {'rows': [77, 95], 'offset': [-1, 0]},
                                     'backRightLeg': {'rows': [77, 95], 'offset': [1, 0]},
                                     'unchangedRows': [0, 76]}}, str(OUT), str(PUBLIC))
    for i in range(2, 5):
        assert (OUT / f'frame-{i}.png').read_bytes() == (BASE / f'frame-{i}.png').read_bytes()
    compare = Image.new('RGBA', (192, 96))
    compare.paste(Image.fromarray(original), (0, 0))
    compare.paste(Image.fromarray(edited), (96, 0))
    compare.resize((1152, 576), Image.Resampling.NEAREST).save(OUT / 'frame1-before-after-6x.png')
    (PUBLIC / 'frame1-before-after-6x.png').write_bytes((OUT / 'frame1-before-after-6x.png').read_bytes())
    changed = np.any(edited != original, axis=2)
    ys, xs = np.where(changed)
    report = {'changedPixels': int(changed.sum()), 'boundsInclusive': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
              'rows0to76Unchanged': True, 'frames234ByteIdentical': True,
              'publicSheetIdentical': (PUBLIC / 'walk.png').read_bytes() == (OUT / 'walk.png').read_bytes()}
    (OUT / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
