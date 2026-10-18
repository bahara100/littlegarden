"""Validate/copy native Pixelorama output; package real-frame previews without redrawing art."""
import hashlib
import importlib.util
import json
import shutil
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/garden-friends-base-walk-v1'
PUBLIC = ROOT / 'apps/client/public/sprites/garden/base-walk-v1'
REVIEW = ROOT / 'apps/client/public/friends-base-walk-v1'
spec = importlib.util.spec_from_file_location('existing_previews', ROOT / 'tools/art/build-garden-body-walk-se-v3.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    REVIEW.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / 'docs/art/pixel/garden-body-base-v2/base-idle-se.png', REVIEW / 'base-idle-se.png')
    shutil.copyfile(ART / 'base-idle-ne.png', REVIEW / 'base-idle-ne.png')
    sources = {'se': 'garden-body-walk-se-v20', 'ne': 'garden-body-walk-ne-v3'}
    manifest = {'frameSize': 96, 'frameCount': 4, 'fps': 6, 'runtimeConnected': True,
                'directions': {'se': ['se', False], 'sw': ['se', True], 'ne': ['ne', False], 'nw': ['ne', True]},
                'baseSources': {}, 'characters': {},
                'reuse': {'approvedBaseWalkPoses': 8, 'characters': 2, 'displayedWalkPosesIncludingMirrors': 32,
                          'newRearHeadTemplates': 2, 'newCommonRearIdlePoses': 1,
                          'note': 'Head templates, semantic recolouring, sleeves and costume overlays are authoring work. Whole-frame runtime; no joint rig.'}}
    for direction, folder in sources.items():
        path = ROOT / 'docs/art/pixel' / folder / 'walk.png'
        manifest['baseSources'][direction] = {'folder': folder, 'sha256': digest(path)}
        shutil.copyfile(path, REVIEW / f'base-walk-{direction}.png')
    for who in ['momo', 'lulu']:
        folder = ART / who
        runtime = PUBLIC / who
        runtime.mkdir(exist_ok=True)
        result = {'assets': {}, 'sourceBodySilhouettesPreserved': True, 'frames': {}}
        for direction, base_folder in sources.items():
            frames = []
            for n in range(1, 5):
                frame = np.array(Image.open(folder / f'full-{direction}-{n}.png').convert('RGBA'))
                motion = np.array(Image.open(folder / f'motion-{direction}-{n}.png').convert('RGBA'))
                base = np.array(Image.open(ROOT / 'docs/art/pixel' / base_folder / f'frame-{n}.png').convert('RGBA'))
                assert np.array_equal(motion[48:, :, 3], base[48:, :, 3]), (who, direction, n, 'body silhouette changed')
                assert set(np.unique(frame[:, :, 3])) <= {0, 255}
                assert preview.connected(frame), (who, direction, n, 'disconnected head/body/feet')
                frames.append(frame)
            sheet = np.array(Image.open(folder / f'walk-{direction}.png').convert('RGBA'))
            assert np.array_equal(sheet, np.concatenate(frames, axis=1))
            mirror_dir = 'sw' if direction == 'se' else 'nw'
            mirror = np.array(Image.open(folder / f'walk-{mirror_dir}.png').convert('RGBA'))
            assert np.array_equal(mirror, np.concatenate([f[:, ::-1] for f in frames], axis=1))
            preview.save_gif(frames, str(folder / f'walk-{direction}.gif'))
            grid = np.concatenate([np.concatenate(frames[:2], axis=1), np.concatenate(frames[2:], axis=1)], axis=0)
            Image.fromarray(grid).resize((768, 768), Image.Resampling.NEAREST).save(folder / f'walk-{direction}-preview.png')
            result['frames'][direction] = [{'bottom': int(np.nonzero(f[:, :, 3])[0].max()),
                                             'colours': len({tuple(p) for p in f[f[:, :, 3] > 0]})} for f in frames]
        for direction in ['se', 'sw', 'ne', 'nw']:
            for action in ['walk', 'idle']:
                path = folder / f'{action}-{direction}.png'
                im = Image.open(path).convert('RGBA')
                assert im.size == ((384, 96) if action == 'walk' else (96, 96))
                arr = np.array(im)
                assert len({tuple(p) for p in arr[arr[:, :, 3] > 0]}) <= 31
                shutil.copyfile(path, runtime / path.name)
                result['assets'][path.name] = digest(path)
        manifest['characters'][who] = result
        with zipfile.ZipFile(folder / f'{who}-authoring.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in folder.glob('*.png'):
                archive.write(path, path.name)
            for path in folder.glob('*.pxo'):
                archive.write(path, path.name)
    for path in [ART / 'manifest.json', PUBLIC / 'manifest.json']:
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Validated: 16 dressed originals, 16 mirrored poses, connected bodies, binary alpha, <=32 colours, unchanged base-body silhouettes.')


if __name__ == '__main__':
    main()
