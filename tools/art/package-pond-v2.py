"""Package the generated lake into a crisp, small game sprite; preserve its source."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/art/pixel/pond-v2'
PUBLIC = ROOT / 'apps/client/public/sprites/garden/pond-v2'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    args = parser.parse_args()
    DOC.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    original = DOC / 'source.png'
    if Path(args.source).resolve() != original.resolve():
        shutil.copy2(args.source, original)
    image = Image.open(original).convert('RGBA')
    # Same opaque-alpha cutoff used for the game's other prop exports; discard translucent fringe.
    alpha = image.getchannel('A').point(lambda a: 255 if a >= 180 else 0)
    image.putalpha(alpha)
    box = alpha.getbbox()
    sprite = image.crop(box).resize((240, 144), Image.Resampling.NEAREST)
    mask = sprite.getchannel('A')
    rgb = sprite.convert('RGB').quantize(colors=96, method=Image.Quantize.MEDIANCUT).convert('RGBA')
    rgb.putalpha(mask)
    out = Image.new('RGBA', (256, 160))
    out.alpha_composite(rgb, (8, 8))
    for folder in [DOC, PUBLIC]: out.save(folder / 'pond.png')
    manifest = {'size': [256, 160], 'opaque_width': 240, 'ground_anchor': [128, 90],
                'footprint': [4, 5], 'colours': len(out.getcolors(65536)), 'source_crop': box,
                'sha256': hashlib.sha256((PUBLIC / 'pond.png').read_bytes()).hexdigest()}
    (DOC / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))

if __name__ == '__main__': main()
