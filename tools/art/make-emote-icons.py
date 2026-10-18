"""Pixel emote icons for the speech bubbles over friends' heads (characterBubbles.ts).

    py tools/art/make-emote-icons.py [preview.png]

Each icon is a 16x16 grid drawn by hand below, one character per pixel:
    .  transparent      o  outline      f  fill      h  highlight      s  shade
The palette is per icon. Output: apps/client/public/sprites/ui/emotes/<name>.png (16x16, shown at 2x with
nearest-neighbour). An optional preview path writes all icons enlarged side by side on the bubble colour.
"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'apps', 'client', 'public', 'sprites', 'ui', 'emotes')

ICONS = {
    # ♡ heart: soft pink with a white shine on the upper left and a deeper pink underside.
    'heart': {
        'palette': {'o': '#8c4560', 'f': '#ee8fa6', 'h': '#fff1f4', 's': '#c9637f'},
        'grid': [
            '................',
            '................',
            '..oooo....oooo..',
            '.offffo..offffo.',
            'ofhhfffoofffffso',
            'ofhfffffffffffso',
            'offfffffffffffso',
            '.offffffffffsso.',
            '..offffffffsso..',
            '...offffffsso...',
            '....offffsso....',
            '.....offsso.....',
            '......ofso......',
            '.......oo.......',
            '................',
            '................',
        ],
    },
    # ♪ eighth note: lavender head and flag on a dark plum outline.
    'note': {
        'palette': {'o': '#5b4470', 'f': '#a98bd0', 'h': '#efe6fb', 's': '#7f62a6'},
        'grid': [
            '.......oo.......',
            '.......ofoo.....',
            '.......offfoo...',
            '.......ofsfffo..',
            '.......ofosssfo.',
            '.......ofo.ooso.',
            '.......ofo...oo.',
            '.......ofo......',
            '.......ofo......',
            '.......ofo......',
            '...ooooofo......',
            '..offhffffo.....',
            '.offhhffffo.....',
            '.offffffffo.....',
            '..ofsssffo......',
            '...ooooo........',
        ],
    },
}


def render(name: str) -> Image.Image:
    icon = ICONS[name]
    image = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y, row in enumerate(icon['grid']):
        assert len(row) == 16, f'{name} row {y} is {len(row)} wide'
        for x, ch in enumerate(row):
            if ch != '.':
                image.putpixel((x, y), Image.new('RGB', (1, 1), icon['palette'][ch]).getpixel((0, 0)) + (255,))
    assert len(icon['grid']) == 16, f'{name} is {len(icon["grid"])} tall'
    return image


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    images = {name: render(name) for name in ICONS}
    for name, image in images.items():
        image.save(os.path.join(OUT, f'{name}.png'))
        print(f'wrote apps/client/public/sprites/ui/emotes/{name}.png')
    if len(sys.argv) > 1:
        scale, pad = 14, 2
        sheet = Image.new('RGBA', ((16 + pad * 2) * len(images) * scale, (16 + pad * 2) * scale), '#fffdf7')
        for i, image in enumerate(images.values()):
            sheet.alpha_composite(image.resize((16 * scale, 16 * scale), Image.NEAREST), ((i * (16 + pad * 2) + pad) * scale, pad * scale))
        sheet.save(sys.argv[1])
        print(f'preview {sys.argv[1]}')


if __name__ == '__main__':
    main()
