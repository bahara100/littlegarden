# Rear base walk V6 — local pixel cleanup

Frames 2/4: replace V5 vertically stretched arm samples with explicitly authored compact forearms and rounded hands in Pixelorama. Preserve the original shoulder roots; clean the stale skin dots and doubled contour in the right armpit/shirt edge. No image-generation or automatic smoothing pass.

Frames 1/3 are unchanged. Head rows 0–44 and lower-body rows 68–95 are pixel-identical to V5 in every frame. NW is an exact cell mirror; 96×96, four frames, 6 FPS, existing palette. This is a review candidate, not a change to Momo/Lulu's selected game V2.

Reproduce native drawing with `tools/art/fix-garden-rear-arms-v6.gd` via Pixelorama; package and verify with `tools/art/package-garden-rear-arms-v6.py`. Native `.pxo` contains four matching frames and separate head/body layers. Preview `/body-walk-ne-v6/index.html`.
