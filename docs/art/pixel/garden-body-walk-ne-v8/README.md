# Rear walk V8 — drawn-arm and pelvis restoration

## Authoritative update: user's manual edits

The user manually edited `garden-body-walk-ne-v8.pxo` and requested publishing it at the same V8 review URL. That native source now takes precedence over the procedural candidate described below. Visible pixel edits versus the old V8: frames 1/2/3/4 = 7/6/1/11. Pixelorama composite exports are copied verbatim, without redraw or palette conversion. The user source backup and exact four exports live in `manual-edit-2026-10-18/`, along with the previous `before-walk.png`.

`MANUAL_EDIT_LOCK.json` blocks the old V8 art builder and packager. To republish manual changes, export the edited native project's frames and use `tools/art/sync-garden-rear-v8-manual.py`. It synchronizes frame PNGs, sheets, head/body previews, GIF, exact NW mirrors and the downloadable native source. Do not regenerate the old art or restore earlier frame 1/3/pelvis pixels over the user's edits.

V6/V7's thin arm stencils and mitten stamps were rejected. V8 rebuilds passing frames 2/4 from the existing finished V4 arm drawings (left from frame 3, right from frame 1). Their original shaded hand pixels are reused; only the middle arm reach is shortened. The V3 pelvis rectangle x37–61/y60–67 is restored last, preserving the original left hip/shorts contour that previous arm/hand masks erased.

Frames 1/3 and all head rows 0–44 and lower-body rows 68–95 remain pixel-identical to V7. The packaging script asserts exact original pelvis pixels for frames 2/4, connectivity and the existing palette. These are preservation checks, not visual approval. NW mirrors every frame exactly. 96×96, four frames, 6 FPS. User review pending.

Native edit `tools/art/fix-garden-rear-arms-v8.gd`; package `tools/art/package-garden-rear-arms-v8.py`. Four-frame head/body `.pxo` matches exported frames. Review `/body-walk-ne-v8/index.html`. Momo/Lulu game V2 remains unchanged.
