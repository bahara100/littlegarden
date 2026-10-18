"""Common body SE walk V18 (current, user-approved): V17 with frame 1's left leg 2 px higher.

User (on V17): try the left leg 2 px up. V18 (garden-body-se-frame1-v18.pxo): the whole left leg moves up 2 px;
its top two rows go under the shorts (the body stays on top there), so the front shoe's sole is at row 87.
The right leg is V17's.

--- V17 notes ---
V17: V16 with the left leg's leftover rough dots cleaned.

User (on V16): just tidy the left leg's dots and finish. V17 (garden-body-se-frame1-v17.pxo): the left leg's inner
edge had a doubled outline at rows 73 and 76 (now single), and two grey-pink specks on the calf's outer edge at
rows 80-81 are calf shadow. 4 pixels change from V16.

--- V16 notes ---
V16: V15 with frame 1's left-leg stride 2 px shorter.

User (on V15): the left leg reaches too far forward; shorten only the left leg's stride a little.
V16 (garden-body-se-frame1-v16.pxo): the left leg's hip rows 69-72 stay on the shorts, the thigh's slant eases
(rows 73-74 -1 px, rows 75-76 -2 px) and the knee, calf and shoe come back 2 px. The right leg is V15's.

--- V15 notes ---
V15: V14 with the protruding pixels at frame 1's left knee cleaned up.

User (on V14): tidy the pixels sticking out at the left leg's knee. V14 had a doubled outline 2 px out at rows
73-74 and a lone outline pixel at row 77. V15 (garden-body-se-frame1-v15.pxo): the left leg's outer outline steps
out one pixel at a time, x 61, 61, 62, 62, 63 for rows 73-77; nothing else changes.

--- V14 notes ---
V14: V13 with frame 1's left thigh slanted, a smaller left calf and shoe, and the right shoe fully outlined.

User (on V13): the left thigh should run from the pelvis to the knee like "\"; of two options the user picked B
(knee forward), then asked for the left leg below the knee (calf to foot) a little smaller and the right leg's
shoe outline completed. V14 (garden-body-se-frame1-v14.pxo):
- left leg: rows 69-70 stay on the shorts, the thigh slants right down to the knee (row 77, +4 px); the calf comes
  back toward the foot (+4, +3, +3, +2) and the shoe moves +2 px. Below the knee the calf is 1 px thinner on its
  outer side and the shoe is 1 px narrower (middle column dropped) and 1 px shorter (middle row dropped, sole kept
  on the ground at row 89, calf reaching one row lower); the calf's outer edge is smoothed.
- right leg: unchanged except the raised back shoe gets outline where its grey touched empty space.

--- V13 notes ---
V13: V12 with frame 1's thighs fitted to the pelvis.

User (on V12): fit the legs to the pelvis. In V12 the thighs' outer outlines started 1 px inside the shorts' outer
outlines (x 40 left, x 59-60 right), so the outline stepped in where the shorts end. V13 (garden-body-se-frame1-
v13.pxo): the right thigh's outer outline continues the shorts' left outline at x 40 for rows 69..72, and the left
thigh's outer outline continues the shorts' 2 px right outline (x 59-60) for rows 69..70, then x 59, before both
legs narrow into V12's widths. Shoes, overlap (right leg on top) and the rest of the legs are V12's.

--- V12 notes ---
V12: V11 with frame 1's left leg 1 px thinner and right leg 1 px thicker.

User (on V11): make the left leg a little thinner and the right leg a little thicker.
V12 (garden-body-se-frame1-v12.pxo): the left (front) leg loses one column on its outer side from the hip to the
ankle, with its outline moved in; the right (back, top) leg gains one column toward the left leg from hip to shin
(11 px at the hip down to 8 px), so it covers a little more of the left thigh. Shoes are unchanged.

--- V11 notes ---
V11: V10 with frame 1's leg thickness and hip joins adjusted.

User (on V10): better, but adjust the leg thickness and where the legs join the pelvis. In V10 the right thigh was
12 px wide at the hip (wider than the left thigh beside it) and the left thigh's first row still carried frame 3's
shorts grey and outline specks. V11 (garden-body-se-frame1-v11.pxo): right thigh 10 px at the hip tapering evenly
to a 7 px shin; the left thigh's first row under the shorts is plain skin with its own outline.

--- V10 notes ---
V10: V9 with frame 1's right leg completed and drawn over the left leg.

User (on V9): fill in what the right leg is missing, put the right leg on top, and let it partly hide the left leg.
V10 (garden-body-se-frame1-v10.pxo): the right leg (back, out of the screen-left leg opening) is a full thigh and
shin with frame 3's leg thickness and shading, tapering down-left into frame 3's raised back shoe; it is the top
layer, so its thigh covers the inner side of the left leg. The left leg layer is V9's (frame 3's front leg, +5 px).


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

Usage: python tools/art/build-garden-body-walk-se-v18.py
"""
import importlib.util
import os

import numpy as np

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('walk_v3', os.path.join(HERE, 'build-garden-body-walk-se-v3.py'))
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)

OUT = os.path.join(v3.ROOT, 'docs/art/pixel/garden-body-walk-se-v18')
PUBLIC = os.path.join(v3.ROOT, 'apps/client/public/body-walk-se-v18')
HEM = 69  # Pixelorama only drew below the shorts


def main():
    frames = [np.array(v3.Image.open(os.path.join(v3.OUT, f'frame-{n}.png')).convert('RGBA')) for n in range(1, 5)]
    drawn = np.array(v3.Image.open(os.path.join(OUT, 'frame1-pixelorama.png')).convert('RGBA'))
    drawn[drawn[..., 3] < 128] = 0
    drawn[drawn[..., 3] > 0, 3] = 255
    assert (drawn[:HEM] == frames[0][:HEM]).all(), 'Pixelorama export changed frame 1 above the legs'
    frames[0] = drawn
    sources = ["Pixelorama garden-body-se-frame1-v18.pxo: V3 frame 1 body; frame 3's front leg +5 px as the left leg "
               "forward; full right leg on top, ending in frame 3's back shoe"] + [f'V3 frame {n}, unchanged' for n in range(2, 5)]
    walk = {'version': 18, 'stage': 'frame1-left-leg-2px-up-current', 'from': 'garden-body-walk-se-v3',
            'frame1': {'tool': 'Pixelorama MCP', 'project': 'garden-body-se-frame1-v18.pxo', 'leftLegUpPx': 2, 'leftStrideShorterPx': 2, 'leftThigh': 'slants down-right to the knee, knee forward', 'rightThighPx': 11, 'onTop': 'right leg', 'legsFrom': 'frame 3', 'walkDirection': 'down-right',
                       'frontFoot': 'lower right, left leg out of the screen-right opening',
                       'backFoot': 'upper left, right leg out of the screen-left opening'}}
    v3.write_outputs(frames, sources, walk, OUT, PUBLIC)
    print('V18: frame 1 from Pixelorama; frames 2..4 identical to V3; saved', OUT)


if __name__ == '__main__':
    main()
