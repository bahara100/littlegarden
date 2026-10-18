"""Split the two swing poses of playground-props-v1.png into layers that can move separately.

Output: apps/client/public/sprites/garden/playground-swing-v1.png, 4 columns x 2 rows of 444x444 cells.
  columns: 0 back - far A-frame (always behind the seat and the rider)
           1 hang - ropes below the bar + seat (swings around the rope tops, see SWING_RIG in phaserGarden.ts)
           2 bar  - top bar with its rope wraps (in front of the rider only while the seat swings back)
           3 near - near A-frame and its vines (always in front of the seat and the rider)
  rows:    0 = props cell 2 (seat faces down-right), 1 = props cell 3 (seat faces down-left)
The four layers of a row add up to the original cell. The original sheet is not modified.
Where the ropes and the seat hid the far A-frame's back leg, the leg is continued along its own axis
and closed with an outline at the ground, so nothing is missing when the seat swings away.

Usage: python tools/art/split-swing-v1.py [debug-dir]
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'apps/client/public/sprites/garden/playground-props-v1.png')
OUT = os.path.join(ROOT, 'apps/client/public/sprites/garden/playground-swing-v1.png')
CELL = 444
OUTLINE = (52, 26, 44, 255)

# Per source cell (cell-local source pixels). pivots: bottoms of the rope wraps on the bar; nothing above the
# line through them hangs. ropes/seat: polygons that hang. near: near A-frame edge, pixels on its side stay in
# front. far: the far A-frame (back layer). bar: the top bar, above its bottom edge. leg: outer edges of the far A-frame's back leg, which the ropes and
# the seat partly hide.
CELLS = {
    2: dict(
        box=(887, 0, 1330, 444),
        pivots=((182, 140), (285, 101)),
        ropes=[
            # near rope: nothing behind it, all of it hangs
            dict(poly=[(162, 136), (202, 128), (202, 250), (212, 300), (200, 312), (170, 312), (156, 304), (164, 250)], behind=False),
            # far rope: hangs in front of the far back leg, so only rope colours (+ their outline) hang
            dict(poly=[(268, 96), (302, 92), (302, 205), (318, 284), (300, 292), (280, 288), (260, 284), (262, 225), (270, 205)], behind=True),
        ],
        seat=[(159, 298), (262, 251), (302, 260), (338, 279), (340, 304), (214, 366), (194, 366), (159, 352)],
        near=lambda x, y: x <= 160 + (y - 300) * .1 if y >= 240 else x <= 154,
        far=lambda x, y: x >= 240 and y >= 130 - .35 * (x - 200) + 1,
        bar=lambda x, y: y <= 130 - .35 * (x - 200) + 2,
        # x = edge_x + (y - edge_y) * slope for the left and right outer outline; rows in plain view per side.
        leg=dict(slope=-.27, left=(257, 250), right=(315, 160), top=140, bottom=274, split=11, left_rows=(226, 250), right_rows=(150, 176)),
    ),
    3: dict(
        box=(1330, 0, 1774, 444),
        pivots=((160, 97), (262, 135)),
        ropes=[
            dict(poly=[(150, 92), (176, 92), (178, 200), (186, 240), (182, 280), (160, 284), (132, 282), (134, 260), (148, 205)], behind=True),
            dict(poly=[(248, 130), (278, 132), (278, 250), (292, 300), (280, 314), (232, 314), (238, 280), (250, 250)], behind=False),
        ],
        seat=[(116, 268), (160, 254), (204, 250), (238, 262), (288, 292), (290, 326), (252, 352), (224, 358), (116, 314)],
        near=lambda x, y: x >= 288 - (y - 300) * .27 if y >= 240 else x >= 292,
        far=lambda x, y: x <= 200 and y >= 95 + .4 * (x - 180) + 1,
        bar=lambda x, y: y <= 95 + .4 * (x - 180) + 2,
        leg=dict(slope=.285, left=(128, 150), right=(172, 190), top=140, bottom=274, split=21, left_rows=(148, 176), right_rows=(222, 250)),
    ),
}


def inside(poly, w, h):
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.array(m) > 0


def dilate(mask, r):
    out = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


def split(px, spec):
    h, w = px.shape[:2]
    rgb = px[..., :3].astype(int)
    alpha = px[..., 3]
    opaque = alpha > 0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    wood = (r - b > 70) & (r > 120)
    green = (g > r + 8) & (g > b)
    rope_colour = (np.abs(r - b) < 45) & (rgb.min(-1) > 70) & ~wood
    ys, xs = np.mgrid[0:h, 0:w]
    (x1, y1), (x2, y2) = spec['pivots']
    below = ys > y1 + (y2 - y1) / (x2 - x1) * (xs - x1)
    near = np.vectorize(spec['near'])(xs, ys)
    far = np.vectorize(spec['far'])(xs, ys)
    bar = np.vectorize(spec['bar'])(xs, ys)

    # The far A-frame's back leg, between its two outer edges.
    leg = spec['leg']
    slope = leg['slope']
    left = lambda y: leg['left'][0] + (y - leg['left'][1]) * slope
    right = lambda y: leg['right'][0] + (y - leg['right'][1]) * slope
    # Rope pixels over the leg hang whatever their colour; the leg under them is rebuilt below.
    band = (xs >= left(ys) - .5) & (xs <= right(ys) + .5) & (ys >= leg['top']) & (ys <= leg['bottom'])

    hang = inside(spec['seat'], w, h)
    for rope in spec['ropes']:
        zone = inside(rope['poly'], w, h)
        if rope['behind']:
            zone &= dilate(zone & rope_colour, 4) & (~wood | band)
        hang |= zone
    hang &= opaque & below & ~near & ~green

    frame = px.copy()
    frame[hang] = 0
    # Continue the far back leg wherever the hanging part covered it. The leg is a straight beam, so each hidden
    # pixel copies the pixel at the same distance from the leg's edge in a reference stretch of rows where that
    # side of the leg is in plain view (left side up to `split` pixels from its edge, right side beyond).
    filled = np.zeros_like(hang)
    for y, x in zip(*np.nonzero(band & hang)):
        u = x - left(y)
        side = 'left' if u <= leg['split'] else 'right'
        r0, r1 = leg[side + '_rows']
        for k in range(r1 - r0):
            sy = r0 + (y - r0 + k) % (r1 - r0)
            sx = int(round(left(sy) + u if side == 'left' else right(sy) - (right(y) - x)))
            if not hang[sy, sx]:
                frame[y, x] = px[sy, sx]
                filled[y, x] = px[sy, sx, 3] >= 180
                break
    # The foot was always hidden under the seat: close the continued leg with an outline at the ground.
    solid = frame[..., 3] >= 180
    for y, x in zip(*np.nonzero(filled)):
        if y >= leg['bottom'] - 2 or any(not solid[y + dy, x + dx] for dy, dx in ((1, 0), (0, 1), (0, -1))):
            frame[y, x] = OUTLINE
    solid = frame[..., 3] > 0

    back_mask = solid & far & ~near
    bar_mask = solid & ~back_mask & bar
    near_mask = solid & ~back_mask & ~bar_mask
    layers = []
    for mask, source in ((back_mask, frame), (hang, px), (bar_mask, frame), (near_mask, frame)):
        layer = np.zeros_like(px)
        layer[mask] = source[mask]
        layers.append(layer)
    return layers


def main():
    src = Image.open(SRC).convert('RGBA')
    sheet = Image.new('RGBA', (CELL * 4, CELL * 2))
    debug = sys.argv[1] if len(sys.argv) > 1 else None
    for row, (cell, spec) in enumerate(CELLS.items()):
        crop = Image.new('RGBA', (CELL, CELL))
        crop.paste(src.crop(spec['box']), (0, 0))
        layers = split(np.array(crop), spec)
        for col, layer in enumerate(layers):
            sheet.paste(Image.fromarray(layer), (col * CELL, row * CELL))
        if debug:
            tint = np.zeros((CELL, CELL, 4), np.uint8)
            for layer, colour in zip(layers, ((60, 90, 255), (255, 60, 60), (240, 200, 40), (60, 220, 60))):
                tint[layer[..., 3] > 0] = (*colour, 150)
            view = Image.new('RGBA', (CELL, CELL), (40, 60, 90, 255))
            view.alpha_composite(crop)
            view.alpha_composite(Image.fromarray(tint))
            view.resize((CELL * 2, CELL * 2), Image.NEAREST).save(os.path.join(debug, f'swing-split-{cell}.png'))
    sheet.save(OUT)
    print('saved', OUT)


if __name__ == '__main__':
    main()
