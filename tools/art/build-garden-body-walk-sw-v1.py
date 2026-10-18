"""Common body SW walk V1: the current approved SE walk (V20) mirrored frame by frame.

User: mirror it to make the down-left (SW) walk too. Each 96x96 frame of garden-body-walk-se-v20 is flipped
horizontally (x -> 95 - x); nothing is redrawn, so SW stays pixel-identical to SE in mirror. Because the body is a
mirror image, the leg that steps forward in frame 1 is the screen-left one here.

Usage: python tools/art/build-garden-body-walk-sw-v1.py
"""
import importlib.util
import os

import numpy as np

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('walk_v3', os.path.join(HERE, 'build-garden-body-walk-se-v3.py'))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

SE = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-se-v20')
OUT = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-sw-v1')
PUBLIC = os.path.join(v3.ROOT, 'apps/client/public/body-walk-sw-v1')


def main():
    se = [np.array(v3.Image.open(os.path.join(SE, f'frame-{n}.png')).convert('RGBA')) for n in range(1, 5)]
    frames = [f[:, ::-1].copy() for f in se]
    sources = [f'SE V20 frame {n}, mirrored left-right' for n in range(1, 5)]
    walk = {'version': 1, 'direction': 'SW', 'stage': 'mirror-of-approved-se-v20', 'from': 'garden-body-walk-se-v20',
            'mirror': 'x -> 95 - x per frame'}
    v3.write_outputs(frames, sources, walk, OUT, PUBLIC)
    for a, b in zip(frames, se):
        assert (a == b[:, ::-1]).all()
    print('SW V1: approved SE V20 mirrored; saved', OUT)


if __name__ == '__main__':
    main()
