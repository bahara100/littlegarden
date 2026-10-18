"""Package approved rear head/dress/boot layers into the missing seated direction.

No recolouring, scaling or generated replacement of the approved sprites.
The existing authoring layers remain the source of truth.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/art/pixel/garden-friends-base-walk-v2'
OUT = ROOT / 'docs/art/pixel/seesaw-rear-sit-v1'
RUNTIME = ROOT / 'apps/client/public/sprites/garden/seesaw-sit-v1'

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RUNTIME.mkdir(parents=True, exist_ok=True)
    for name, actor in [('momo', 'peach'), ('lulu', 'lilac')]:
        folder = SOURCE / name
        layers = {k: Image.open(folder / f'idle-ne-{k}.png').convert('RGBA') for k in ['legs', 'costume', 'head']}
        # A white export scrap in the far lower-right margin is unrelated to the character.
        layers['head'].paste((0, 0, 0, 0), (85, 75, 96, 96))
        result = layers['legs'].copy()
        result.paste((0, 0, 0, 0), (0, 75, 96, 96))
        result.paste(layers['legs'].crop((0, 79, 96, 96)), (1, 75))
        result.alpha_composite(layers['costume'])
        result.alpha_composite(layers['head'])
        original = Image.open(folder / 'idle-ne.png').convert('RGBA')
        for y in range(75):
            for x in range(96):
                a, b = result.getpixel((x, y)), original.getpixel((x, y))
                assert (a[3] == b[3] and (a[3] == 0 or a == b)), (name, x, y, a, b)
        result.save(OUT / f'{name}-ne.png')
        result.save(RUNTIME / f'{actor}-ne.png')
        ImageOps.mirror(result).save(OUT / f'{name}-nw.png')
        result.resize((576, 576), Image.Resampling.NEAREST).save(OUT / f'{name}-preview.png')
    print('Packaged rear seated art; head and dress pixels preserved exactly.')

if __name__ == '__main__':
    main()
