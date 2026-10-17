"""Common body NE (up-right, back view) walk V1 draft: the SW walk turned into a back view.

User: make the up-right walk too. In this 3/4 view the back-right silhouette of a figure walking up-right matches
the front-left (SW) silhouette closely, and the SW frames already put the forward foot up-right and the back foot
down-left. So each NE frame is the SW V1 frame (SE V18 mirrored) with its front-only details turned into back
details; nothing else is redrawn:
- neck: the front V-neck (skin and collar line, rows 50-53) becomes suit, with a straight back neckline on row 50
- shorts: the front crotch V creases (rows 62-68) become suit, with a short centre seam (rows 65-67) above the
  crotch point
Known limit of this draft: the shoes are still the mirrored front shoes (toes pointing left).

Usage: python tools/art/build-garden-body-walk-ne-v1.py
"""
import importlib.util
import os
from collections import Counter

import numpy as np

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('walk_v3', os.path.join(HERE, 'build-garden-body-walk-se-v3.py'))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

SW = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-sw-v1')
OUT = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-ne-v1')
PUBLIC = os.path.join(v3.ROOT, 'apps/client/public/body-walk-ne-v1')


def kind(p):
    r, g, b, a = (int(v) for v in p)
    if a == 0:
        return '.'
    if r + g + b < 200:
        return 'D'  # outline
    if r > 200 and g > 140 and b > 110 and r - b > 40:
        return 'S'  # skin
    if r < 140 and abs(r - b) < 40:
        return 'h'  # dark suit line
    return 'G'  # suit grey


def back_view(f):
    suit = Counter(tuple(f[y, x]) for y in range(54, 64) for x in range(30, 66) if kind(f[y, x]) == 'G').most_common(1)[0][0]
    seam = Counter(tuple(f[y, x]) for y in range(50, 70) for x in range(30, 66) if kind(f[y, x]) == 'h').most_common(1)[0][0]
    g = f.copy()
    for y in range(50, 54):
        edge = [x for x in range(30, 66) if kind(f[y, x]) == 'D']
        if edge:
            for x in range(edge[0] + 1, edge[-1]):
                if kind(f[y, x]) in 'Sh':
                    g[y, x] = seam if y == 50 else suit
    for y in range(62, 69):
        for x in range(33, 62):
            if kind(f[y, x]) == 'h' and not {kind(f[y, x - 1]), kind(f[y, x + 1])} & {'D', '.'}:
                g[y, x] = suit
    crotch = [x for x in range(36, 58) if kind(f[69, x]) == 'D']
    cx = crotch[len(crotch) // 2] if crotch else 44
    for y in (65, 66, 67):
        if kind(g[y, cx]) == 'G':
            g[y, cx] = seam
    return g


def main():
    frames = [back_view(np.array(v3.Image.open(os.path.join(SW, f'frame-{n}.png')).convert('RGBA'))) for n in range(1, 5)]
    sources = [f'SW V1 frame {n} with back-view neck and shorts' for n in range(1, 5)]
    walk = {'version': 1, 'direction': 'NE', 'stage': 'draft-from-sw-awaiting-user-review', 'from': 'garden-body-walk-sw-v1',
            'knownLimits': ['shoes are mirrored front shoes (toes point left)']}
    v3.write_outputs(frames, sources, walk, OUT, PUBLIC)
    print('NE V1 draft: SW frames as a back view; saved', OUT)


if __name__ == '__main__':
    main()
