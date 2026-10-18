"""Package the genuine rear-view NE whole-frame Pixelorama exports and exact NW mirrors.

Authoring: source-layout.json + garden-body-ne-v2-sample.gd inside Pixelorama.
Native project stores 4 frames / 6 FPS with losslessly separated head/body layers.
The accepted SE V20 assets are not rewritten by this script.
"""
import hashlib
import importlib.util
import json
import shutil
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/pixel/garden-body-walk-ne-v2'
NW = ROOT / 'docs/art/pixel/garden-body-walk-nw-v2'
PUBLIC = ROOT / 'apps/client/public/body-walk-ne-v2'
PUBLIC_NW = ROOT / 'apps/client/public/body-walk-nw-v2'
spec = importlib.util.spec_from_file_location('walk_v3', Path(__file__).with_name('build-garden-body-walk-se-v3.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    se = ROOT / 'docs/art/pixel/garden-body-walk-se-v20/walk.png'
    original_se_sha = sha(se)
    frames = [np.array(Image.open(OUT / f'frame-{i}-native.png').convert('RGBA')) for i in range(1, 5)]
    mirrored = [np.array(Image.open(OUT / f'frame-{i}-nw-native.png').convert('RGBA')) for i in range(1, 5)]
    for a, b in zip(frames, mirrored):
        assert np.array_equal(a[:, ::-1], b)
    assert not np.array_equal(frames[0], frames[2])
    assert not np.array_equal(frames[1], frames[3])
    info = {'version': 2, 'direction': 'NE', 'stage': 'whole-frame-rear-walk-awaiting-user-review',
            'styleReference': 'garden-body-walk-se-v20', 'poseReference': 'scarlet-ingame-walk-ne-v9',
            'authoringProject': 'garden-body-walk-ne-v2.pxo',
            'method': 'Built-in image_gen whole poses, Pixelorama uniform full-body scaling and shared palette',
            'headWidthTarget': 46, 'noPartRig': True,
            'phases': ['left-forward-right-back', 'right-passing-left-support',
                       'right-forward-left-back', 'left-passing-right-support']}
    helper.write_outputs(frames,
                         ['Revised cycle full pose 1', 'Targeted full pose 2 with right foot passing',
                          'Revised cycle full pose 3', 'Revised cycle full pose 4'], info, str(OUT), str(PUBLIC))
    helper.write_outputs(mirrored, [f'NE V2 frame {i}, exact horizontal mirror' for i in range(1, 5)],
                         {**info, 'direction': 'NW', 'from': 'garden-body-walk-ne-v2', 'mirror': 'x -> 95 - x per frame'},
                         str(NW), str(PUBLIC_NW))
    # Deliver the editable native project with the layers, not only flattened PNGs.
    project = 'garden-body-walk-ne-v2.pxo'
    shutil.copyfile(OUT / project, PUBLIC / project)
    with zipfile.ZipFile(OUT / 'layers.zip', 'a', zipfile.ZIP_DEFLATED) as z:
        z.write(OUT / project, project)
    shutil.copyfile(OUT / 'layers.zip', PUBLIC / 'layers.zip')
    sheet = np.array(Image.open(OUT / 'walk.png').convert('RGBA'))
    preview = np.array(Image.open(OUT / 'walk-preview-2x2.png').convert('RGBA').resize((192, 192), Image.Resampling.NEAREST))
    for i, frame in enumerate(frames):
        assert np.array_equal(frame, sheet[:, i * 96:(i + 1) * 96])
        assert np.array_equal(frame, preview[i // 2 * 96:(i // 2 + 1) * 96, i % 2 * 96:(i % 2 + 1) * 96])
    assert Image.open(OUT / 'walk-preview.gif').n_frames == 4
    assert sha(se) == original_se_sha
    report = {'frameCount': 4, 'fps': 6, 'frameSize': [96, 96], 'allWholeFramesConnected': True,
              'contactFramesDifferent': True, 'passingFramesDifferent': True, 'exactNwMirrors': True,
              'previewMatchesActualSheet': True, 'nativeProjectIncluded': True,
              'approvedSeV20Sha256': original_se_sha, 'approvedSeV20Unchanged': True,
              'note': 'Technical checks only; gait and back-view quality still require user review.'}
    (OUT / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
