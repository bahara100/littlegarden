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
    2: dict(wraps=(181, 281), move=(-8, 3), fill=((24, -9), (-24, 9)), leg_top=98,
            brace=dict(box=(290, 194, 314, 238), slope=.53, toward=1)),
    3: dict(wraps=(166, 263), move=(5, 2), fill=((24, 9), (-24, -9)), leg_top=88,
            brace=dict(box=(136, 194, 158, 238), slope=-.53, toward=-1)),
}
# brace: the far A-frame's cross brace, whose end beside the leg the ropes' knots hid; box (x0, y0, x1, y1) to
# repair, slope along the brace, toward: the side (±x) where the brace is in plain view.
HALF = 14  # a wrap band, slanted across the bar with its outlines, spans about 25 columns


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


def close_rope_tops(hang, dy, frame):
    """The ropes moved dy px down along the bar: close the gap between each rope top and the bar it hangs from.
    Any empty pixel just above a rope pixel (up to dy + 2 rows) that no frame layer covers takes that rope pixel."""
    out = hang.copy()
    covered = np.any([layer[..., 3] > 0 for layer in frame], axis=0)
    h, w = covered.shape
    for _ in range(dy + 2):
        solid = out[..., 3] > 0
        for y, x in zip(*np.nonzero(solid[1:200] & ~solid[:199] & ~covered[:199])):
            # out row y is empty, row y + 1 is rope: grow the rope up only where the bar (or frame) is close above
            if any(covered[y - k, x] for k in range(0, dy + 3) if y - k >= 0):
                out[y, x] = out[y + 1, x]
    return out


def drop_rope_residue(back, hidden, leg):
    """Thin dark leftovers of v1's rope outline beside the leg (not part of any beam): dark pixels near what the
    ropes hid, outside the leg, with at most two solid neighbours."""
    out = back.copy()
    slope = leg['slope']
    left = lambda y: leg['left'][0] + (y - leg['left'][1]) * slope
    right = lambda y: leg['right'][0] + (y - leg['right'][1]) * slope
    solid = back[..., 3] > 0
    dark = back[..., :3].astype(int).sum(-1) < 330
    near_rope = split_swing.dilate(hidden, 3)
    h, w = solid.shape
    for _ in range(3):
        for y, x in zip(*np.nonzero(solid & dark & near_rope)):
            if left(y) - 1 <= x <= right(y) + 1 and leg['top'] <= y <= leg['bottom']:
                continue
            n = sum(solid[y + dy, x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and 0 <= y + dy < h and 0 <= x + dx < w)
            if n <= 2:
                out[y, x] = 0; solid[y, x] = False
    return out


def extend_brace(back, open_, brace):
    """Continue the far A-frame's cross brace into the uncovered part of its end, copying the brace along its own
    slope from where it is in plain view (its outlines continue the same way)."""
    out = back.copy()
    x0, y0, x1, y1 = brace['box']
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not open_[y, x]:
                continue
            for k in range(3, 30, 3):
                sx = x + brace['toward'] * k
                sy = y + int(round(brace['toward'] * k * brace['slope']))
                if not open_[sy, sx]:
                    if back[sy, sx, 3] > 0:
                        out[y, x] = back[sy, sx]
                    break
    return out


def fill_pinholes(layers, region):
    """Fill 1-2 px holes the move left inside the art: an empty pixel with at least 6 solid neighbours takes the
    neighbour colour of the layer most of them belong to."""
    h, w = region.shape
    for _ in range(2):
        solid = [layer[..., 3] > 0 for layer in layers]
        any_solid = np.any(solid, axis=0)
        for y, x in zip(*np.nonzero(region & ~any_solid)):
            around = [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and 0 <= y + dy < h and 0 <= x + dx < w]
            if sum(any_solid[p] for p in around) < 6:
                continue
            counts = [sum(m[p] for p in around) for m in solid]
            k = int(np.argmax(counts))
            src = next(p for p in around if solid[k][p])
            layers[k][y, x] = layers[k][src]


def close_leg_edges(back, exposed, leg):
    """v1's rope outline also closed the leg's edge where they touched. Where an edge pixel of the leg now borders
    uncovered empty space, it becomes outline."""
    out = back.copy()
    outline = np.array(split_swing.OUTLINE, np.uint8)
    slope = leg['slope']
    left = lambda y: leg['left'][0] + (y - leg['left'][1]) * slope
    right = lambda y: leg['right'][0] + (y - leg['right'][1]) * slope
    solid = back[..., 3] > 0
    for y in range(leg['top'], leg['bottom'] + 1):
        for x in (*range(int(left(y)) - 1, int(left(y)) + 3), *range(int(right(y)) - 2, int(right(y)) + 2)):
            if solid[y, x] and any(exposed[y, x + d] and not solid[y, x + d] for d in (-1, 1)):
                out[y, x] = outline
    return out


def rebuild_leg(back, hidden, leg):
    """Redraw the far A-frame's back leg wherever v1's ropes or seat hid it, as one straight beam: an outline on
    both edges and wood copied from the rows of the same side where the leg is in plain view."""
    out = back.copy()
    slope = leg['slope']
    left = lambda y: leg['left'][0] + (y - leg['left'][1]) * slope
    right = lambda y: leg['right'][0] + (y - leg['right'][1]) * slope
    outline = np.array(split_swing.OUTLINE, np.uint8)
    # The old ropes' own outline pixels were left in the frame: dark pixels inside the leg next to the hidden part.
    dark = back[..., :3].astype(int).sum(-1) < 330
    hidden = hidden | (split_swing.dilate(hidden, 2) & dark & (back[..., 3] > 0))
    for y in range(leg['top'], leg['bottom'] + 1):
        for x in range(int(np.floor(left(y))), int(np.ceil(right(y))) + 1):
            if not hidden[y, x]:
                continue
            u = x - left(y)
            if y >= leg['bottom'] - 1:
                out[y, x] = outline
                continue
            edge = u < 3 or right(y) - x < 3
            side = 'left' if u <= leg['split'] else 'right'
            r0, r1 = leg[side + '_rows']
            for k in range(r1 - r0):
                sy = r0 + (y - r0 + k) % (r1 - r0)
                sx = int(round(left(sy) + u if side == 'left' else right(sy) - (right(y) - x)))
                # Away from the leg's edges, wood only: a dark pixel there is the old rope's outline, not the leg's.
                if not hidden[sy, sx] and back[sy, sx, 3] > 0 and (edge or back[sy, sx, :3].astype(int).sum() > 330):
                    out[y, x] = back[sy, sx]
                    break
            else:
                # No clear reference row at this distance from the edge: take the leg's own wood next to it in this row.
                step = 1 if side == 'left' else -1
                for d in range(1, 12):
                    nx = x + step * d
                    if not hidden[y, nx] and back[y, nx, 3] > 0:
                        out[y, x] = back[y, nx]
                        break
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
        hidden = hang[..., 3] > 0  # what v1's ropes and seat covered
        # Bits of rope that split() left in the near layer (rope tops just under the bar, outline beside the ropes)
        # move with the ropes.
        stray = (near[..., 3] > 0) & split_swing.dilate(hidden, 3) & ~np.vectorize(spec['near'])(*np.mgrid[0:CELL, 0:CELL][::-1])
        hang[stray] = near[stray]; near[stray] = 0
        back = rebuild_leg(back, hidden, spec['leg'])
        hang = close_rope_tops(shift(hang, *move['move']), move['move'][1], (back, bar, near))
        bar = move_wraps(bar, move)
        exposed = hidden & (hang[..., 3] == 0) & ~np.any([l[..., 3] > 0 for l in (bar, near)], axis=0)
        back = extend_brace(back, exposed & (back[..., 3] == 0), move['brace'])
        back = close_leg_edges(back, exposed, spec['leg'])
        fill_pinholes([back, hang, bar, near], split_swing.dilate(hidden, 1))
        back = drop_rope_residue(back, hidden, spec['leg'])
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
