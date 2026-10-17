"""Common body SE walk V3: V2 with frame 3's pelvis and legs turned to walk down-right like the other frames.

In V2 frame 3 the front foot landed screen-left with its toe pointing down-left, so that one frame walked SW.
V3 mirrors frame 3's pelvis (the shorts between the arms, rows 63..68) and legs (rows 69+) around the hip
centre x = 50, so the shorts' crease and leg openings follow the turned legs. The head, chest, arms and the
other three frames are V2's pixels unchanged. Outputs mirror the V2 folder layout.

Usage: python tools/art/build-garden-body-walk-se-v3.py
"""
import json
import os
import shutil
import zipfile
from collections import deque

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'docs/art/pixel/garden-body-walk-se-v2')
OUT = os.path.join(ROOT, 'docs/art/pixel/garden-body-walk-se-v3')
PUBLIC = os.path.join(ROOT, 'apps/client/public/body-walk-se-v3')
SIZE = 96
HEAD_ROWS = 54  # rows 0..53 are the head layer, as in V2
AXIS = 100  # x -> AXIS - x: mirror around the hip centre x = 50
# (first row, last row, first column, last column); each band maps onto itself.
PELVIS = (63, 68, 41, 59)  # shorts between the hanging arms
LEGS = (69, SIZE - 1, 36, 64)  # below the hem nothing but the legs


def load(name):
    return np.array(Image.open(os.path.join(SRC, name)).convert('RGBA'))


def save(arr, folder, name):
    Image.fromarray(arr).save(os.path.join(folder, name))


def save_gif(frames, path, scale=3, fps=6):
    """Looping preview GIF of the real frames (nearest-neighbour, transparent background, one shared palette)."""
    colours = sorted({tuple(c) for f in frames for c in f[f[..., 3] > 0][:, :3]})
    index = {c: i + 1 for i, c in enumerate(colours)}
    palette = [0, 0, 0] + [v for c in colours for v in c]
    images = []
    for f in frames:
        p = np.zeros(f.shape[:2], np.uint8)
        for (y, x) in zip(*np.nonzero(f[..., 3])):
            p[y, x] = index[tuple(f[y, x, :3])]
        im = Image.fromarray(p, 'P')
        im.putpalette(palette)
        images.append(im.resize((SIZE * scale, SIZE * scale), Image.NEAREST))
    images[0].save(path, save_all=True, append_images=images[1:], duration=170 if fps == 6 else round(1000 / fps), loop=0,
                   transparency=0, disposal=2, optimize=False)


def connected(frame):
    """Head (first opaque pixel from the top) reaches the torso and the feet through 8-connected pixels."""
    solid = frame[..., 3] > 0
    start = next((y, x) for y in range(SIZE) for x in range(SIZE) if solid[y, x])
    seen, queue = {start}, deque([start])
    while queue:
        y, x = queue.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                p = (y + dy, x + dx)
                if 0 <= p[0] < SIZE and 0 <= p[1] < SIZE and p not in seen and solid[p]:
                    seen.add(p)
                    queue.append(p)
    return any(60 <= y <= 75 for y, _ in seen) and any(y >= 84 for y, _ in seen) and len(seen) == solid.sum()


def write_outputs(frames, sources, walk, out, public):
    """Sheet, head/body layers, 4x previews, GIF, walk.json and layers.zip in `out`; review copies in `public`."""
    os.makedirs(out, exist_ok=True)
    sheet = np.zeros((SIZE, SIZE * 4, 4), np.uint8)
    grid = np.zeros((SIZE * 2, SIZE * 2, 4), np.uint8)
    head_sheet, body_sheet = sheet.copy(), sheet.copy()
    info = []
    for n, f in enumerate(frames, 1):
        assert set(np.unique(f[..., 3])) <= {0, 255}, 'alpha must stay binary'
        assert connected(f), f'frame {n}: head, body and feet are not one piece'
        head, body = f.copy(), f.copy()
        head[HEAD_ROWS:] = 0
        body[:HEAD_ROWS] = 0
        for name, arr in ((f'frame-{n}.png', f), (f'head-{n}.png', head), (f'body-{n}.png', body)):
            save(arr, out, name)
        x = (n - 1) * SIZE
        sheet[:, x:x + SIZE], head_sheet[:, x:x + SIZE], body_sheet[:, x:x + SIZE] = f, head, body
        grid[(n - 1) // 2 * SIZE:(n - 1) // 2 * SIZE + SIZE, (n - 1) % 2 * SIZE:(n - 1) % 2 * SIZE + SIZE] = f
        ys = np.nonzero(f[..., 3])[0]
        colours = {tuple(c) for c in f[f[..., 3] > 0][:, :3]}
        info.append({'number': n, 'top': int(ys.min()), 'bottom': int(ys.max()), 'colors': len(colours), 'source': sources[n - 1]})
    save(sheet, out, 'walk.png')
    save(head_sheet, out, 'head-walk.png')
    save(body_sheet, out, 'body-walk.png')
    Image.fromarray(grid).resize((SIZE * 8, SIZE * 8), Image.NEAREST).save(os.path.join(out, 'walk-preview-2x2.png'))
    Image.fromarray(sheet).resize((SIZE * 16, SIZE * 4), Image.NEAREST).save(os.path.join(out, 'walk-contact-4x.png'))
    save_gif(frames, os.path.join(out, 'walk-preview.gif'))
    shutil.copyfile(os.path.join(SRC, 'palette.json'), os.path.join(out, 'palette.json'))
    walk = {**walk, 'frameCount': 4, 'fps': 6, 'frameSize': [SIZE, SIZE], 'headToFeetConnected': True,
            'frames': info, 'runtimeConnected': False}
    json.dump(walk, open(os.path.join(out, 'walk.json'), 'w'), indent=1)

    names = [f'{kind}-{n}.png' for kind in ('body', 'frame', 'head') for n in range(1, 5)]
    names += ['body-walk.png', 'head-walk.png', 'walk.png', 'walk-preview-2x2.png', 'walk-contact-4x.png']
    with zipfile.ZipFile(os.path.join(out, 'layers.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.write(os.path.join(out, name), name)
        z.write(os.path.join(out, 'walk.json'), 'manifest.json')
    os.makedirs(public, exist_ok=True)
    for name in names + ['layers.zip', 'walk-preview.gif']:
        shutil.copyfile(os.path.join(out, name), os.path.join(public, name))
    shutil.copyfile(os.path.join(out, 'walk.json'), os.path.join(public, 'manifest.json'))


def main():
    frames = [load(f'frame-{n}.png') for n in range(1, 5)]
    f3 = frames[2]
    top, _, x0, x1 = LEGS
    assert not (f3[top:, :x0, 3].any() or f3[top:, x1 + 1:, 3].any()), 'frame 3 has pixels beside the legs below the hem'
    for y0, y1, x0, x1 in (PELVIS, LEGS):
        assert AXIS - x0 == x1
        f3[y0:y1 + 1, x0:x1 + 1] = f3[y0:y1 + 1, x0:x1 + 1][:, ::-1].copy()

    sources = ['V2 frame 3, pelvis and legs mirrored' if n == 3 else f'V2 frame {n}, unchanged' for n in range(1, 5)]
    walk = {'version': 3, 'stage': 'frame3-pelvis-legs-mirrored-awaiting-user-review', 'from': 'garden-body-walk-se-v2',
            'frame3Mirror': {'x': f'{AXIS} - x', 'pelvis': {'rows': PELVIS[:2], 'columns': PELVIS[2:]},
                             'legs': {'rows': LEGS[:2], 'columns': LEGS[2:]}}}
    write_outputs(frames, sources, walk, OUT, PUBLIC)
    for n in (1, 2, 4):
        assert (load(f'frame-{n}.png') == frames[n - 1]).all()
    print('V3: frame 3 pelvis and legs mirrored; frames 1, 2, 4 identical to V2; saved', OUT)


if __name__ == '__main__':
    main()
