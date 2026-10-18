"""Package six generated originals using the game's existing 128px prop convention.

No re-drawing: alpha cleanup, nearest-neighbour reduction, 64-colour palette,
bottom-centred padding. Keep every original and generation prompt for editing.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/art/pixel/park-props-v1'
PUBLIC = ROOT / 'apps/client/public/sprites/garden/park-props-v1'


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    originals = DOC / 'originals'
    originals.mkdir(exist_ok=True)
    records = json.loads((DOC / 'prompts.json').read_text(encoding='utf-8'))
    manifest = []
    for record in records:
        local = originals / f"{record['id']}.png"
        if not local.exists():
            source = re.search(r'as (C:\\.*?\.png) by default', record['outputHint']).group(1)
            shutil.copy2(source, local)
        im = Image.open(local).convert('RGBA')
        alpha = im.getchannel('A').point(lambda v: 255 if v >= 180 else 0)
        box = alpha.getbbox()
        assert box, record['id']
        im.putalpha(alpha)
        im = im.crop(box)
        scale = 124 / max(im.size)
        size = tuple(max(1, round(v * scale)) for v in im.size)
        im = im.resize(size, Image.Resampling.NEAREST)
        colours = im.convert('RGB').quantize(colors=64, method=Image.Quantize.MEDIANCUT).convert('RGBA')
        colours.putalpha(im.getchannel('A'))
        out = Image.new('RGBA', (128, 128))
        out.alpha_composite(colours, ((128 - size[0]) // 2, 128 - size[1]))
        path = PUBLIC / f"{record['id']}.png"
        out.save(path)
        out.save(DOC / path.name)
        manifest.append(dict(id=record['id'], file=path.name, sourceCrop=box,
                             opaqueSize=size, canvas=[128, 128], maxColours=64,
                             sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    (DOC / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
