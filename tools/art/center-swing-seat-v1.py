"""Hang the swing's ropes and seat midway between its two A-frames.

In playground-swing-v1.png the ropes and the seat hang a few pixels to one side of the point midway between the two
A-frame tops (row 0: ropes 233.5 vs frames 225.5; row 1: 211 vs 216, cell-local source px), so a rider sits slightly
off-centre in the frame. This re-splits props cells 2 and 3 with split-swing-v1.py, with the far A-frame's hidden back
leg rebuilt all the way up to the bar (once the ropes move, more of it shows), then moves:
  - the hang layer (ropes + seat) by MOVE along the bar,
  - the two rope wraps on the bar layer by the same MOVE, as whole strips across the bar; where a wrap was, the bar
    is continued with the stretch FILL further along it (the bar is a straight log). Vines on the bar stay put.
back and near layers are otherwise unchanged.

Outputs playground-swing-v2.png (same 4x2 layer layout as v1) and playground-props-v2.png (props sheet with swing
cells 2 and 3 recomposed from the new layers). The v1 files are kept.

Usage: python tools/art/center-swing-seat-v1.py
"""
import copy
import importlib.util
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(__file__)
spec_ = importlib.util.spec_from_file_location('split_swing', os.path.join(HERE, 'split-swing-v1.py'))
split_swing = importlib.util.module_from_spec(spec_)
spec_.loader.exec_module(split_swing)

ROOT = split_swing.ROOT
GARDEN = os.path.join(ROOT, 'apps/client/public/sprites/garden')
CELL = split_swing.CELL
# Per props cell (row 0 = cell 2, row 1 = cell 3). wraps: rope-wrap centres on the bar's centreline (x);
# move: (dx, dy) along the bar (slope ≈ ±.38); fill: (dx, dy) from each wrap to clean bar; leg_top: rebuild the far
# back leg from this row down (v1: 140, which left the leg under the old ropes' tops missing).
MOVES = {
    2: dict(wraps=(181, 281), move=(-8, 3), fill=((16, -6), (-16, 6)), leg_top=98),
    3: dict(wraps=(164, 262), move=(5, 2), fill=((16, 6), (-16, -6)), leg_top=88),
}
HALF = 7  # a wrap band is about 15 px wide


def green_of(px):
    r, g, b = (px[..., i].astype(int) for i in range(3))
    return (g > r + 8) & (g > b) & (px[..., 3] > 0)


def move_wraps(bar, spec):
    out = bar.copy()
    green = green_of(bar)
    h, w = bar.shape[:2]
    dx, dy = spec['move']
    strip = lambda cx: range(cx - HALF, cx + HALF + 1)
    # 1. Continue the bar over each old wrap with the bar further along it (never over or from vines).
    for cx, (fx, fy) in zip(spec['wraps'], spec['fill']):
        for x in strip(cx):
            for y in range(h):
                sy, sx = y + fy, x + fx
                if not green[y, x] and 0 <= sy < h and 0 <= sx < w and not green[sy, sx]:
                    out[y, x] = bar[sy, sx]
    # 2. Put each wrap's whole strip of bar at its new place, behind any vines there.
    for cx in spec['wraps']:
        for x in strip(cx):
            for y in range(h):
                ty, tx = y + dy, x + dx
                if 0 <= ty < h and 0 <= tx < w and not green[y, x] and not green[ty, tx] and bar[y, x, 3] > 0:
                    out[ty, tx] = bar[y, x]
    return out


def shift(layer, dx, dy):
    out = np.zeros_like(layer)
    h, w = layer.shape[:2]
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = layer[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
    return out


def main():
    src = Image.open(os.path.join(GARDEN, 'playground-props-v1.png')).convert('RGBA')
    props = src.copy()
    sheet = np.zeros((CELL * 2, CELL * 4, 4), np.uint8)
    for row, (cell, base) in enumerate(split_swing.CELLS.items()):
        spec = copy.deepcopy(base)
        move = MOVES[cell]
        spec['leg']['top'] = move['leg_top']
        crop = Image.new('RGBA', (CELL, CELL))
        crop.paste(src.crop(spec['box']), (0, 0))
        back, hang, bar, near = split_swing.split(np.array(crop), spec)
        hang = shift(hang, *move['move'])
        bar = move_wraps(bar, move)
        whole = Image.new('RGBA', (CELL, CELL))
        for c, layer in enumerate((back, hang, bar, near)):
            sheet[row * CELL:(row + 1) * CELL, c * CELL:(c + 1) * CELL] = layer
            whole.alpha_composite(Image.fromarray(layer))
        x0, y0, x1, y1 = spec['box']
        props.paste((0, 0, 0, 0), spec['box'])
        props.paste(whole.crop((0, 0, x1 - x0, y1 - y0)), (x0, y0))
    Image.fromarray(sheet).save(os.path.join(GARDEN, 'playground-swing-v2.png'), optimize=True)
    props.save(os.path.join(GARDEN, 'playground-props-v2.png'), optimize=True)
    print('saved playground-swing-v2.png, playground-props-v2.png')


if __name__ == '__main__':
    main()
