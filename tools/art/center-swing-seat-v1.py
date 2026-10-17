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


# The near A-frame's inner edge (its outline included) beside the seat, measured on v1 (cell-local px): x at row y,
# slope in x per row; side +1: the post is right of the edge (row 1), -1: left of it (row 0).
NEAR_POST = {
    0: dict(x=161, y=300, slope=.21, side=-1, top=150, bottom=390),
    1: dict(x=283, y=300, slope=-.22, side=1, top=150, bottom=390),
}


def components(mask):
    """8-connected pieces of a mask, as (ys, xs) index arrays."""
    seen = np.zeros_like(mask)
    h, w = mask.shape
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack, ys, xs = [(y0, x0)], [], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); ys.append(y); xs.append(x)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; stack.append((ny, nx))
        out.append((np.array(ys), np.array(xs)))
    return out


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
        # The near post is in front of the seat and ropes, so by its own straight edge: what lies outside the post (and
        # is not a vine) is seat or rope and swings; what lies on the post is post and stays.
        post = NEAR_POST[row]
        seat_zone = split_swing.dilate(split_swing.inside(split_swing.CELLS[2 + row]['seat'], CELL, CELL), 3)
        yy, xx = np.mgrid[0:CELL, 0:CELL]
        edge = post['x'] + (yy - post['y']) * post['slope']
        on_post = (xx >= edge) if post['side'] > 0 else (xx <= edge)
        span = (yy >= post['top']) & (yy <= post['bottom'])
        vine = split_swing.dilate(green_of(near), 2) & (near[..., 3] > 0)
        rope_or_seat = split_swing.inside(split_swing.CELLS[2 + row]['seat'], CELL, CELL)
        for rope in split_swing.CELLS[2 + row]['ropes']:
            rope_or_seat |= split_swing.inside(rope['poly'], CELL, CELL)
        off_post = span & ~on_post & (near[..., 3] > 0) & ~vine & rope_or_seat
        hang[off_post] = near[off_post]; near[off_post] = 0
        deep = ((xx >= edge + 2) if post['side'] > 0 else (xx <= edge - 2))
        dark = hang[..., :3].astype(int).sum(-1) < 250
        # On the post every pixel is the post (it is in front); by the seat, keep a 2 px margin for the seat's own end.
        back_on = span & on_post & (hang[..., 3] > 0) & (~seat_zone | dark | deep)
        empty = back_on & (near[..., 3] == 0)
        near[empty] = hang[empty]
        hang[back_on] = 0  # under the post it never shows at rest, and must not swing out from under it
        # Small pieces of the near layer cut off from the post (leaf tips and outline bits over the rope) swing with it.
        for comp in components(near[..., 3] > 0):
            ys, xs = comp
            if len(ys) < 40 and span[ys, xs].all() and not on_post[ys, xs].any() and not green_of(near)[ys, xs].any()                     and not vine[ys, xs].any():
                hang[ys, xs] = near[ys, xs]; near[ys, xs] = 0
        # The far A-frame's wood seen beside the far rope belongs to the frame, not the rope (both move together, so
        # nothing changes at rest; it just no longer swings).
        far_rope = np.zeros((CELL, CELL), bool)
        for rope in split_swing.CELLS[2 + row]['ropes']:
            if rope['behind']:
                far_rope |= split_swing.inside(rope['poly'], CELL, CELL)
        hr, hb = hang[..., 0].astype(int), hang[..., 2].astype(int)
        hl = (hang[..., 3] > 0) & (np.abs(hr - hb) < 45) & (hang[..., :3].min(-1) > 70)
        rope_body = (far_rope & split_swing.dilate(hl, 4)) | split_swing.dilate(hl, 1)  # strands, knots, outline
        frame_wood = split_swing.dilate(far_rope, 8) & (hang[..., 3] > 0) & ~rope_body & ~seat_zone
        joined = np.zeros_like(frame_wood)
        for _ in range(12):  # keep only what joins the far frame itself
            joined |= frame_wood & split_swing.dilate((back[..., 3] > 0) | joined, 1)
        frame_wood = joined
        back[frame_wood] = hang[frame_wood]; hang[frame_wood] = 0
        # Leaf pieces of the near frame's vines that split() hung with the rope (dark leaves, not green enough to be
        # recognised there) stay with the vines: hang pixels near the vines that are neither rope nor seat.
        hr, hg, hb = (hang[..., i].astype(int) for i in range(3))
        lav = (hang[..., 3] > 0) & (np.abs(hr - hb) < 45) & (hang[..., :3].min(-1) > 70)
        leaves = (hang[..., 3] > 0) & ~split_swing.dilate(lav, 2) & ~seat_zone & split_swing.dilate(green_of(near), 6)
        near[leaves] = hang[leaves]; hang[leaves] = 0
        # Whatever split() hung outside the rope and seat shapes is not rope: near the far rope it is the far frame,
        # elsewhere the near frame's vines.
        ropes = np.zeros((CELL, CELL), bool)
        for rope in split_swing.CELLS[2 + row]['ropes']:
            ropes |= split_swing.inside(rope['poly'], CELL, CELL)
        stray_hang = (hang[..., 3] > 0) & ~split_swing.dilate(ropes, 2) & ~seat_zone & (yy > 150)
        to_back = stray_hang & split_swing.dilate(far_rope, 8)
        to_near = stray_hang & ~to_back
        back[to_back] = hang[to_back]; near[to_near] = hang[to_near]; hang[stray_hang] = 0
        faint = (hang[..., 3] > 0) & (hang[..., 3] < 100) & span
        hang[faint] = 0
        # ...and put the outline of the near frame's vines, where they spill over the near rope, in the hang layer:
        # that stays with the vines. (Rope = lavender strands + 1 px outline; the seat stays with the ropes.)
        cell = split_swing.CELLS[2 + row]
        r, g, b = (hang[..., i].astype(int) for i in range(3))
        rope_colour = (np.abs(r - b) < 45) & (hang[..., :3].min(-1) > 70) & (hang[..., 3] > 0)
        seat = split_swing.inside(cell['seat'], CELL, CELL)
        vine_edge = split_swing.dilate(green_of(near) | green_of(bar), 2) & (hang[..., 3] > 0) & ~split_swing.dilate(rope_colour, 1) & ~seat_zone
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
        # The seat's end behind the post was never drawn: when the seat swings out it would end in a raw cut. Carry
        # the seat 1 px on under the post and close it with a 2 px outline there; at rest the post covers all of it.
        step = post['side']
        outline = np.array(split_swing.OUTLINE, np.uint8)
        solid = hang[..., 3] > 0
        for y, x in zip(*np.nonzero(solid & seat_zone & span)):
            body = any(0 <= x - k * step < CELL and hang[y, x - k * step, 3] > 0 and hang[y, x - k * step, :3].astype(int).sum() > 250
                       for k in range(0, 5))
            if body and 0 <= x + 3 * step < CELL and on_post[y, x + step] and not solid[y, x + step]:
                hang[y, x + step] = hang[y, x]
                if hang[y, x, :3].astype(int).sum() > 250:  # seat body: cap it; its own outline rows just continue
                    hang[y, x + 2 * step] = outline
                    hang[y, x + 3 * step] = outline
                else:
                    hang[y, x + 2 * step] = hang[y, x]
        for ys, xs in components(hang[..., 3] > 0):  # lone specks left by the steps above
            if len(ys) < 8:
                hang[ys, xs] = 0
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
