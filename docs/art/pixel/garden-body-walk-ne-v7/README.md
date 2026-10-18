# V7: restore passing-hand volume

V6 shortened the arms but also made the hands too small. V7 redraws only the four hand areas in frames 2/4 as rounded 9×8-pixel silhouettes, restoring width and volume while retaining the V6 wrists, sleeves, torso and legs. Frames 1/3 remain pixel-identical to V6. Each changed frame has 94 edited pixels, all within the hand repair regions recorded in `verification.json` and the packaging script.

Native authoring: `tools/art/fix-garden-rear-hands-v7.gd` in Pixelorama. Validation/packaging: `tools/art/package-garden-rear-hands-v7.py`. Native `.pxo` has four matching head/body frames. NW is an exact per-cell mirror; existing palette, 96×96 and 6 FPS.

Review candidate only; Momo/Lulu game assets remain V2. Review `/body-walk-ne-v7/index.html`.
