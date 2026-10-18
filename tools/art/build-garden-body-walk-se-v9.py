"""Common body SE walk V9: V8 redone so frame 1's legs have frame 3's thickness and rendering.

User: V3 frame 1 has the right leg forward and the left leg back; in order it must be the left leg forward and the
right leg back. The walk still goes down-right: the front foot stays lower right and the back foot upper left;
the leg stepping forward comes out of the screen-right leg opening (left leg) and the leg reaching back comes
out of the screen-left leg opening (right leg).

V8 drew both legs as thin even tubes; the user said the thickness and rendering must follow the other frames.
V9 frame 1 was built in Pixelorama through its MCP bridge (garden-body-se-frame1-v9.pxo, layers bottom to top):
body (V3 frame 1 rows 0..68) / front leg (left): frame 3's own front leg, thigh to shoe, moved 5 px right so it
comes out of the screen-right leg opening / back leg (right): frame 3's own back shin and raised shoe in place,
joined to the screen-left leg opening by frame 3's thigh pixels there, drawn over the front leg at the crotch.
This script takes Pixelorama's export frame1-pixelorama.png as frame 1; frames 2..4 are V3's PNGs unchanged.

Usage: python tools/art/build-garden-body-walk-se-v9.py
"""
import importlib.util
import os

import numpy as np

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('walk_v3', os.path.join(HERE, 'build-garden-body-walk-se-v3.py'))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

OUT = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-se-v9')
PUBLIC = os.path.join(v3.ROOT, 'apps/client/public/body-walk-se-v9')
HEM = 69  # Pixelorama only drew below the shorts


def main():
    frames = [np.array(v3.Image.open(os.path.join(v3.OUT, f'frame-{n}.png')).convert('RGBA')) for n in range(1, 5)]
    drawn = np.array(v3.Image.open(os.path.join(OUT, 'frame1-pixelorama.png')).convert('RGBA'))
    drawn[drawn[..., 3] < 128] = 0
    drawn[drawn[..., 3] > 0, 3] = 255
    assert (drawn[:HEM] == frames[0][:HEM]).all(), 'Pixelorama export changed frame 1 above the legs'
    frames[0] = drawn
    sources = ["Pixelorama garden-body-se-frame1-v9.pxo: V3 frame 1 body; frame 3's front leg +5 px as the left leg "
               "forward; frame 3's back shin and shoe as the right leg back"] + [f'V3 frame {n}, unchanged' for n in range(2, 5)]
    walk = {'version': 9, 'stage': 'frame1-left-leg-forward-frame3-legs-awaiting-user-review', 'from': 'garden-body-walk-se-v3',
            'frame1': {'tool': 'Pixelorama MCP', 'project': 'garden-body-se-frame1-v9.pxo', 'legsFrom': 'frame 3', 'walkDirection': 'down-right',
                       'frontFoot': 'lower right, left leg out of the screen-right opening',
                       'backFoot': 'upper left, right leg out of the screen-left opening'}}
    v3.write_outputs(frames, sources, walk, OUT, PUBLIC)
    print('V9: frame 1 from Pixelorama; frames 2..4 identical to V3; saved', OUT)


if __name__ == '__main__':
    main()
