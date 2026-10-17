"""Common body SE walk V4: V3 with frame 1's feet swapped, left foot forward and right foot back.

User: "기존꺼에서 왼발을 앞으로 뻗고 오른발을 뒤로 뻗으면 되는건데" (from 4 into 1 the left foot stays in front and
the right foot behind). V3 frame 1 had the screen-left foot raised behind and the screen-right foot planted in
front. V4 mirrors frame 1's own pelvis and legs around the hip centre x = 50 with the same bands V3 used for
frame 3, so the drawing is frame 1's pixels, not a repaint. The head, chest and arms of frame 1 and frames
2..4 are V3's PNGs unchanged.

Usage: python tools/art/build-garden-body-walk-se-v4.py
"""
import importlib.util
import os

import numpy as np

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('walk_v3', os.path.join(HERE, 'build-garden-body-walk-se-v3.py'))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

OUT = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-se-v4')
PUBLIC = os.path.join(v3.ROOT, 'apps/client/public/body-walk-se-v4')


def main():
    frames = [np.array(v3.Image.open(os.path.join(v3.OUT, f'frame-{n}.png')).convert('RGBA')) for n in range(1, 5)]
    f1 = frames[0]
    top, _, x0, x1 = v3.LEGS
    assert not (f1[top:, :x0, 3].any() or f1[top:, x1 + 1:, 3].any()), 'frame 1 has pixels beside the legs below the hem'
    for y0, y1, x0, x1 in (v3.PELVIS, v3.LEGS):
        f1[y0:y1 + 1, x0:x1 + 1] = f1[y0:y1 + 1, x0:x1 + 1][:, ::-1].copy()
    sources = ['V3 frame 1, pelvis and legs mirrored: left foot forward, right foot back'] + \
              [f'V3 frame {n}, unchanged' for n in range(2, 5)]
    walk = {'version': 4, 'stage': 'frame1-feet-swapped-awaiting-user-review', 'from': 'garden-body-walk-se-v3',
            'frame1Mirror': {'x': f'{v3.AXIS} - x', 'pelvis': {'rows': v3.PELVIS[:2], 'columns': v3.PELVIS[2:]},
                             'legs': {'rows': v3.LEGS[:2], 'columns': v3.LEGS[2:]}}}
    v3.write_outputs(frames, sources, walk, OUT, PUBLIC)
    print('V4: frame 1 pelvis and legs mirrored; frames 2..4 identical to V3; saved', OUT)


if __name__ == '__main__':
    main()
