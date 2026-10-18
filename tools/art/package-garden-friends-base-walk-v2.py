"""Validate tailored garments and unchanged heads/foot poses; package real-frame exports."""
import hashlib
import importlib.util
import json
import shutil
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'docs/art/pixel/garden-friends-base-walk-v2'
OLD = ROOT / 'docs/art/pixel/garden-friends-base-walk-v1'
PUBLIC = ROOT / 'apps/client/public/sprites/garden/base-walk-v2'
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
    manifest = {'version': 2, 'frameSize': 96, 'frameCount': 4, 'fps': 6, 'paletteLimitIncludingTransparency': 64, 'runtimeConnected': True,
                'directions': {'se': ['se', False], 'sw': ['se', True], 'ne': ['ne', False], 'nw': ['ne', True]},
                'baseSources': {}, 'characters': {},
                'reuse': {'approvedBaseWalkPoses': 8, 'characters': 2, 'displayedWalkPosesIncludingMirrors': 32,
                          'headTemplatesUnchangedFromV1': True, 'feetPoseUnchanged': True,
                          'note': 'Garments repainted for each pose, not a colour-swap or copied skirt strip. Native composite keeps approved leg/foot geometry and existing head pixels; whole-frame runtime.'}}
    for direction, folder in sources.items():
        path = ROOT / 'docs/art/pixel' / folder / 'walk.png'
        manifest['baseSources'][direction] = {'folder': folder, 'sha256': digest(path)}
        shutil.copyfile(path, REVIEW / f'base-walk-{direction}.png')
    for who in ['momo', 'lulu']:
        folder = ART / who
        runtime = PUBLIC / who
        runtime.mkdir(exist_ok=True)
        result = {'assets': {}, 'sourceFootPosesPreserved': True, 'headPixelsPreserved': True, 'frames': {}}
        for direction, base_folder in sources.items():
            frames = []
            for n in range(1, 5):
                frame = np.array(Image.open(folder / f'full-{direction}-{n}.png').convert('RGBA'))
                legs = np.array(Image.open(folder / f'legs-{direction}-{n}.png').convert('RGBA'))
                head = np.array(Image.open(OLD / who / f'head-{direction}-{n}.png').convert('RGBA'))
                base = np.array(Image.open(ROOT / 'docs/art/pixel' / base_folder / f'frame-{n}.png').convert('RGBA'))
                assert np.array_equal(legs[69:, :, 3], base[69:, :, 3]), (who, direction, n, 'leg geometry changed')
                assert np.array_equal(frame[77:, :, 3], base[77:, :, 3]), (who, direction, n, 'foot pose changed')
                assert np.array_equal(frame[head[:, :, 3] > 0], head[head[:, :, 3] > 0]), (who, direction, n, 'head changed')
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
                assert len({tuple(p) for p in arr[arr[:, :, 3] > 0]}) <= 63
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
    preserved_path = ART / 'idle-balance-preserved.json'
    if preserved_path.exists():
        preserved = json.loads(preserved_path.read_text(encoding='utf-8'))
        for name, expected in preserved.items():
            assert digest(ART / name) == expected, f'Protected walk/front idle changed: {name}'
        for who in ['momo', 'lulu']:
            before = np.array(Image.open(ART / who / 'idle-ne-before-balance.png').convert('RGBA'))
            after = np.array(Image.open(ART / who / 'idle-ne.png').convert('RGBA'))
            before_head = np.array(Image.open(ART / who / 'idle-ne-before-head-balance.png').convert('RGBA'))
            assert np.array_equal(before_head[55:], after[55:]), 'Rear idle torso or legs changed during head alignment'
            head = np.array(Image.open(ART / who / 'idle-ne-head.png').convert('RGBA'))
            original_head = np.array(Image.open(OLD / who / 'head-ne.png').convert('RGBA'))
            assert np.array_equal(head[:, :91, 3], original_head[:, 5:, 3]), 'Rear idle head must shift left exactly 5px'
            mask = head[:, :91, 3] > 0
            assert np.array_equal(head[:, :91][mask], original_head[:, 5:][mask]), 'Head colours or drawing changed'
            assert not head[:, 91:, 3].any()
            assert np.count_nonzero(head[:, :, 3]) == np.count_nonzero(original_head[:, :, 3]), 'Head clipped'
            assert np.array_equal(after[head[:, :, 3] > 0], head[head[:, :, 3] > 0]), 'Runtime head differs from layer'
            assert np.array_equal(after[77:, :91], before[77:, 5:]), 'Rear idle feet must shift left exactly 5px'
            assert not after[77:, 91:, 3].any()
            mirror = np.array(Image.open(ART / who / 'idle-nw.png').convert('RGBA'))
            assert np.array_equal(after[:, ::-1], mirror), 'Rear idle NW mirror mismatch'
            assert preview.connected(after), 'Rear idle head, body and feet must connect'
        for name, expected in json.loads((ART / 'idle-head-balance-preserved.json').read_text(encoding='utf-8')).items():
            assert digest(ART / name) == expected, f'Body/leg layer changed during head alignment: {name}'
        print('Rear idle correction verified: head and feet each moved left 5px; no redraw; torso/legs preserved during head correction; all walks/front idles unchanged.')
    print('Validated: 16 tailored poses + mirrors; heads unchanged; base feet and leg geometry preserved; connected; binary alpha; <=64 colours.')


if __name__ == '__main__':
    main()
