"""Hang the swing's seat midway between its two A-frames, without redrawing anything.

In playground-swing-v1.png the ropes and the seat hang a few pixels toward the far A-frame from the point midway
between the two A-frame tops (row 0: ropes 233.5 vs frames 225.5; row 1: 211 vs 216, cell-local source px).

Instead of moving the ropes alone (which uncovers wood the art never drew), the far A-frame, the ropes + seat and the
far part of the top bar (with its rope wraps and the far end wrap) move together as one rigid piece by MOVE, along the
bar, toward the near A-frame. Everything in that piece keeps exactly its v1 pixels and its v1 overlaps. The near
A-frame and the near part of the bar (with its vines) stay. Moving the piece by twice the offset centres the seat:
the seat moves by MOVE and the midpoint between the frames by half of it.
  - Nothing that the near frame hid comes into view: the piece moves further behind it.
  - Where the piece leaves, behind it is open sky (the far end of the bar, the far A-frame's outer edge).
  - The moved bar part lands on the stationary bar along the bar's own slope; vines stay in front.

Outputs playground-swing-v2.png (same 4x2 layer layout as v1) and playground-props-v2.png (props sheet with swing
cells 2 and 3 recomposed from the new layers). The v1 files are kept.

Usage: python tools/art/center-swing-seat-v1.py
"""
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
LAYERS = os.path.join(GARDEN, 'playground-swing-v1.png')
# Per layer row (row 0 = props cell 2, row 1 = props cell 3): move (dx, dy) along the bar (slope about ±.4) toward
# the near A-frame; the far part of the bar is x >= split (row 0, far frame on the right) or x < split (row 1).
PIECES = {
    0: dict(box=(887, 0, 1330, 444), move=(-16, 6), split=167, far_side=1),
    1: dict(box=(1330, 0, 1774, 444), move=(10, 4), split=300, far_side=-1),
}


def shift(layer, dx, dy):
    out = np.zeros_like(layer)
    h, w = layer.shape[:2]
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = layer[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
    return out


def green_of(px):
    r, g, b = (px[..., i].astype(int) for i in range(3))
    return (g > r + 8) & (g > b) & (px[..., 3] > 0)


def move_bar_part(bar, piece):
    """Move the far part of the bar with the piece. The near part stays; where the moved part lands on it, the moved
    bar wins except under vines, which stay in front."""
    xs = np.arange(bar.shape[1])
    far = (xs >= piece['split']) if piece['far_side'] > 0 else (xs < piece['split'])
    vines = split_swing.dilate(green_of(bar), 3) & (bar[..., 3] > 0)  # vines on the bar grow from the near frame: they stay
    far_part = bar.copy(); far_part[:, ~far] = 0; far_part[vines] = 0
    near_part = bar.copy(); near_part[:, far] = 0; near_part[vines] = bar[vines]
    moved = shift(far_part, *piece['move'])
    out = near_part.copy()
    # Around the vines the stationary bar keeps its own pixels (the moved bar's end would show between the leaves).
    around_vines = split_swing.dilate(green_of(bar), 5) & (near_part[..., 3] > 0)
    take = (moved[..., 3] > 0) & ~vines & ~around_vines
    out[take] = moved[take]
    return out


def main():
    sheet = np.array(Image.open(LAYERS).convert('RGBA'))
    sheet_v1 = sheet.copy()
    props = Image.open(os.path.join(GARDEN, 'playground-props-v1.png')).convert('RGBA')
    for row, piece in PIECES.items():
        back, hang, bar, near = (sheet[row * CELL:(row + 1) * CELL, c * CELL:(c + 1) * CELL].copy() for c in range(4))
        # split-swing-v1 left a few rope pixels in the near layer (rope tops under the bar, outline beside a rope):
        # they belong to the ropes and move with them.
        rule = split_swing.CELLS[2 + row]['near']
        seat_area = split_swing.dilate(split_swing.inside(split_swing.CELLS[2 + row]['seat'], CELL, CELL), 4)
        stray = (near[..., 3] > 0) & split_swing.dilate(hang[..., 3] > 0, 3) & ~np.vectorize(rule)(*np.mgrid[0:CELL, 0:CELL][::-1]) & ~seat_area
        hang[stray] = near[stray]; near[stray] = 0
        # ...and put the outline of the near frame's vines, where they spill over the near rope, in the hang layer:
        # that stays with the vines. (Rope = lavender strands + 1 px outline; the seat stays with the ropes.)
        cell = split_swing.CELLS[2 + row]
        r, g, b = (hang[..., i].astype(int) for i in range(3))
        rope_colour = (np.abs(r - b) < 45) & (hang[..., :3].min(-1) > 70) & (hang[..., 3] > 0)
        seat = split_swing.inside(cell['seat'], CELL, CELL)
        vine_edge = split_swing.dilate(green_of(near) | green_of(bar), 2) & (hang[..., 3] > 0) & ~split_swing.dilate(rope_colour, 1) & ~seat
        near[vine_edge] = hang[vine_edge]; hang[vine_edge] = 0
        # Likewise bits of the bar's underside on the far side of the split, outside the near frame: part of the bar.
        cols = np.arange(CELL)
        far_cols = (cols >= piece['split']) if piece['far_side'] > 0 else (cols < piece['split'])
        bar_bits = (near[..., 3] > 0) & split_swing.dilate(bar[..., 3] > 0, 3) & ~np.vectorize(rule)(*np.mgrid[0:CELL, 0:CELL][::-1]) & far_cols[None, :]
        bar[bar_bits] = near[bar_bits]; near[bar_bits] = 0
        # Lone near-layer specks on the far side (stray background pixels the bar's far end used to cover) go.
        solid = near[..., 3] > 0
        n = sum(np.roll(np.roll(np.pad(solid, 1), dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1]
        near[solid & (n <= 2) & far_cols[None, :] & ~np.vectorize(rule)(*np.mgrid[0:CELL, 0:CELL][::-1])] = 0
        old_hang = hang[..., 3] > 0
        back = shift(back, *piece['move'])
        hang = shift(hang, *piece['move'])
        bar = move_bar_part(bar, piece)
        # The game trims each swing cell to its (alpha > 0) bounding box to set its size and place: keep v1's box with
        # two invisible anchor pixels, so the swing keeps its size and position.
        v1_solid = np.any([sheet_v1[row * CELL:(row + 1) * CELL, c * CELL:(c + 1) * CELL, 3] > 0 for c in range(4)], axis=0)
        ys, xs = np.nonzero(v1_solid)
        for y, x in ((ys.min(), xs.min()), (ys.max(), xs.max())):
            if not any(l[y, x, 3] > 0 for l in (back, hang, bar, near)):
                back[y, x] = (0, 0, 0, 1)
        whole = Image.new('RGBA', (CELL, CELL))
        for c, layer in enumerate((back, hang, bar, near)):
            sheet[row * CELL:(row + 1) * CELL, c * CELL:(c + 1) * CELL] = layer
            whole.alpha_composite(Image.fromarray(layer))
        x0, y0, x1, y1 = piece['box']
        props.paste((0, 0, 0, 0), piece['box'])
        props.paste(whole.crop((0, 0, x1 - x0, y1 - y0)), (x0, y0))
    Image.fromarray(sheet).save(os.path.join(GARDEN, 'playground-swing-v2.png'), optimize=True)
    props.save(os.path.join(GARDEN, 'playground-props-v2.png'), optimize=True)
    print('saved playground-swing-v2.png, playground-props-v2.png')


if __name__ == '__main__':
    main()
