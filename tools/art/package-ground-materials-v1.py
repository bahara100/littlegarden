"""Package generated ground materials. Source images and prompts stay in docs/art/pixel/ground-materials-v1."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/art/pixel/ground-materials-v1'
PUBLIC = ROOT / 'apps/client/public/sprites/garden/ground-materials-v1'

def main():
    args = argparse.ArgumentParser()
    args.add_argument('--grass', required=True)
    args.add_argument('--path', required=True)
    opts = args.parse_args()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    DOC.mkdir(parents=True, exist_ok=True)
    records = []
    for name, source in [('grass', opts.grass), ('path', opts.path)]:
        original = DOC / f'{name}-source.png'
        if Path(source).resolve() != original.resolve(): shutil.copy2(source, original)
        image = Image.open(original).convert('RGB').resize((256, 256), Image.Resampling.NEAREST)
        image = image.quantize(colors=64, method=Image.Quantize.MEDIANCUT).convert('RGB')
        image.save(PUBLIC / f'{name}.png')
        image.save(DOC / f'{name}.png')
        records.append({'name': name, 'size': [256, 256], 'colours': len(image.getcolors(65536)), 'sha256': hashlib.sha256((PUBLIC / f'{name}.png').read_bytes()).hexdigest()})
    (DOC / 'manifest.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
    print(json.dumps(records, indent=2))

if __name__ == '__main__': main()
