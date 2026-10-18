"""Pixel icons: emotions for the speech bubbles over friends' heads (characterBubbles.ts) and the season picker.

    py tools/art/make-emote-icons.py [preview.png]

Each icon is a 16x16 grid, one character per pixel:
    .  transparent      o  outline      f  fill      h  highlight      s  shade
Other letters are extra colours named in that icon's palette. Output: apps/client/public/sprites/ui/<dir>/<name>.png
(dir 'emotes' unless the icon says otherwise), shown at whole multiples with nearest-neighbour. The first icons are
drawn by hand; newer ones build their grid from simple shapes (circles, polygons) with the outline added
automatically, and the result is still a fixed 16x16 grid. An optional preview path writes all icons enlarged side
by side on the bubble colour.
"""
import math
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'apps', 'client', 'public', 'sprites', 'ui')


def shaped(layers, outline_from='fhsc'):
    """A 16x16 grid from shapes: `layers` is a list of (char, test(x, y)) applied in order on pixel centres; then every
    empty pixel touching (4-neighbour) a pixel whose char is in `outline_from` becomes outline 'o'."""
    grid = [['.'] * 16 for _ in range(16)]
    for ch, test in layers:
        for y in range(16):
            for x in range(16):
                if test(x + .5, y + .5):
                    grid[y][x] = ch
    out = [row[:] for row in grid]
    for y in range(16):
        for x in range(16):
            if grid[y][x] == '.' and any(0 <= x + dx < 16 and 0 <= y + dy < 16 and grid[y + dy][x + dx] in outline_from
                                         for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                out[y][x] = 'o'
    return [''.join(row) for row in out]


def disc(cx, cy, r):
    return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def lower_right(test, cx, cy, k=0.0):
    """The part of a shape below-right of a diagonal through (cx, cy): its shaded side."""
    return lambda x, y: test(x, y) and (x - cx) + (y - cy) > k


def fish():
    body = lambda x, y: ((x - 8.8) / 5.2) ** 2 + ((y - 8.2) / 3.2) ** 2 <= 1
    tail = lambda x, y: 1 <= x <= 4.2 and abs(y - 8.2) <= 4.4 - x and not (x < 2.2 and abs(y - 8.2) < 1.2)
    fin = lambda x, y: 7 <= x <= 10 and 4 <= y <= 5.6 and y >= 4 + (x - 7) * .45
    return shaped([('f', body), ('f', tail), ('f', fin),
                   ('s', lambda x, y: (body(x, y) or tail(x, y)) and y > 9.6),
                   ('h', lambda x, y: body(x, y) and 6 <= y <= 7 and 6 <= x <= 9),
                   ('w', lambda x, y: body(x, y) and 4.6 <= x <= 5.6 and 6 <= y <= 11),
                   ('k', lambda x, y: 11.5 <= x <= 12.5 and 7 <= y <= 8)], outline_from='fhswk')


def fishing():
    """A fishing rod held from the bottom-left, its line hanging from the tip to a red-and-white float on a ripple."""
    def near_segment(ax, ay, bx, by, r):
        def test(x, y):
            t = max(0, min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
            return math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) <= r
        return test
    rod = near_segment(2.2, 13.8, 10.6, 2.6, .75)
    grip = lambda x, y: rod(x, y) and y > 10.6
    bobber = disc(11.5, 11.6, 2.3)
    return shaped([('f', rod), ('c', grip),
                   ('h', lambda x, y: rod(x, y) and not rod(x - 1, y) and not grip(x, y)),
                   ('l', lambda x, y: 10 <= x <= 11 and 1 <= y <= 2),
                   ('l', lambda x, y: 11 <= x <= 12 and 2 <= y <= 9.4),
                   ('r', lambda x, y: bobber(x, y) and y < 11.6),
                   ('w', lambda x, y: bobber(x, y) and y >= 11.6),
                   ('b', lambda x, y: 13.8 <= y <= 14.6 and (6 <= x <= 9 or 14 <= x <= 16))], outline_from='fchrw')


def flower():
    cx, cy, petals = 7.75, 7.75, []
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5
        petals.append(disc(cx + 4.1 * math.cos(a), cy + 4.1 * math.sin(a), 2.45))
    petal = lambda x, y: any(p(x, y) for p in petals)
    return shaped([('f', petal), ('s', lower_right(petal, cx, cy, 2.5)), ('h', lambda x, y: petal(x, y) and x + y < 9),
                   ('c', disc(cx, cy, 2.1)), ('C', lower_right(disc(cx, cy, 2.1), cx, cy, .6))], outline_from='fhscC')


def sun():
    cx = cy = 7.75
    core = disc(cx, cy, 4.3)

    def ray(x, y):
        r = math.hypot(x - cx, y - cy)
        a = math.atan2(y - cy, x - cx) % (math.pi / 4)
        return 5.6 <= r <= 7.6 and min(a, math.pi / 4 - a) * r < .75
    return shaped([('r', ray), ('f', core), ('s', lower_right(core, cx, cy, 2.2)),
                   ('h', lambda x, y: core(x, y) and (x - 5.7) ** 2 + (y - 5.7) ** 2 <= 2.3)])


def maple():
    cx, cy = 7.75, 7.6
    # Five pointed lobes (angle from straight up in degrees, length, half-width in degrees) around a small middle.
    lobes = [(0, 6.9, 34), (-62, 6.3, 32), (62, 6.3, 32), (-122, 4.3, 28), (122, 4.3, 28)]

    def leaf(x, y):
        r = math.hypot(x - cx, y - cy)
        a = math.degrees(math.atan2(x - cx, cy - y))
        if r <= 3.0:
            return True
        return any(abs(a - at) < w and r <= length * (1 - abs(a - at) / w * .75) for at, length, w in lobes)
    stem = lambda x, y: 9.5 <= y <= 15 and abs(x - (7.75 + (y - 9.5) * .3)) < .7
    vein = lambda x, y: leaf(x, y) and abs(x - cx) < .55 and 2.5 <= y <= 9.5
    return shaped([('f', leaf), ('s', lower_right(leaf, cx, cy, 2.5)), ('h', lambda x, y: leaf(x, y) and x + y < 10.5),
                   ('v', vein), ('b', stem)], outline_from='fhsvb')


def snowman():
    body, head = disc(7.75, 10.6, 4.1), disc(7.75, 4.9, 3.1)
    snow = lambda x, y: body(x, y) or head(x, y)
    shade = lambda x, y: snow(x, y) and ((x - 7.75) + (y - 10.6) > 2.6 or (head(x, y) and (x - 7.75) + (y - 4.9) > 1.9))
    return shaped([('f', snow), ('s', shade),
                   ('r', lambda x, y: 4.6 <= x <= 11 and 7 <= y <= 8.2 and snow(x, y)),
                   ('r', lambda x, y: 9 <= x <= 10.2 and 8 <= y <= 10.4),
                   ('k', lambda x, y: (6.2 <= x <= 7 or 8.6 <= x <= 9.4) and 4 <= y <= 5),
                   ('n', lambda x, y: 7.6 <= x <= 9.6 and 5.2 <= y <= 6),
                   ('k', lambda x, y: 7.2 <= x <= 8.2 and (10.2 <= y <= 11 or 12.4 <= y <= 13.2))], outline_from='fhsrkn')

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
    # 👋 greeting: a raised open hand in warm skin tones, fingers apart, thumb out to the left.
    'wave': {
        'palette': {'o': '#7d4f36', 'f': '#f5c79e', 'h': '#fff3e4', 's': '#d99a70'},
        'grid': [
            '................',
            '......oo........',
            '...oooffooo.....',
            '..ohfoffohfo....',
            '..offoffoffooo..',
            '..offoffoffohfo.',
            '..offoffoffoffo.',
            'oo.offffffffffo.',
            'ohoofffffffffso.',
            'offofffffffffso.',
            '.offffffffffsso.',
            '..offffffffsso..',
            '...offfffssso...',
            '....offssso.....',
            '.....ooooo......',
            '................',
        ],
    },
    # ! surprise: a bold amber bar and dot.
    'exclaim': {
        'palette': {'o': '#7a4a1f', 'f': '#f3a73b', 'h': '#ffe9b8', 's': '#cf7d22'},
        'grid': [
            '................',
            '......oooo......',
            '.....ohfffo.....',
            '.....ohfffo.....',
            '.....offffo.....',
            '.....offfso.....',
            '......offo......',
            '......offo......',
            '......ofso......',
            '......ofso......',
            '.......oo.......',
            '................',
            '......oooo......',
            '......ohfo......',
            '......ofso......',
            '......oooo......',
        ],
    },
    # ··· chatting: three soft sage dots.
    'dots': {
        'palette': {'o': '#4b5a44', 'f': '#93a684', 'h': '#e6efdc', 's': '#6c7e60'},
        'grid': [
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
            '.oo....oo....oo.',
            'ohfo..ohfo..ohfo',
            'ofso..ofso..ofso',
            '.oo....oo....oo.',
            '................',
            '................',
            '................',
            '................',
            '................',
            '................',
        ],
    },
    # 🐟 a little orange koi seen from the side, for watching the pond.
    'fish': {
        'palette': {'o': '#6e3418', 'f': '#f39054', 'h': '#ffdcbc', 's': '#cc6a33', 'w': '#fff4ea', 'k': '#2f1a10'},
        'grid': fish(),
    },
    # 🎣 a fishing rod and float, for fishing at the pond.
    'fishing': {
        'palette': {'o': '#4a2d1c', 'f': '#b07a45', 'h': '#e2b47a', 'c': '#5d7a4a', 'l': '#8c97a3', 'r': '#e5574b', 'w': '#ffffff', 'b': '#6aa9c4'},
        'grid': fishing(),
    },
    # Seasons for the picker in the map's top-left corner (sprites/ui/seasons/).
    'spring': {
        'dir': 'seasons',
        'palette': {'o': '#8a4762', 'f': '#f3a5bd', 'h': '#ffe1ea', 's': '#d77d99', 'c': '#f7cf55', 'C': '#d79b2c'},
        'grid': flower(),
    },
    'summer': {
        'dir': 'seasons',
        'palette': {'o': '#9a5d16', 'f': '#f8c847', 'h': '#fff2b8', 's': '#e49d2c', 'r': '#f09a3a'},
        'grid': sun(),
    },
    'autumn': {
        'dir': 'seasons',
        'palette': {'o': '#6f2614', 'f': '#e2643a', 'h': '#f8a56b', 's': '#b7432a', 'v': '#c4512f', 'b': '#7a4a2a'},
        'grid': maple(),
    },
    'winter': {
        'dir': 'seasons',
        'palette': {'o': '#55606d', 'f': '#ffffff', 's': '#cdd9e6', 'r': '#d9534f', 'k': '#2e3640', 'n': '#f08a3c'},
        'grid': snowman(),
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
    images = {name: render(name) for name in ICONS}
    for name, image in images.items():
        folder = ICONS[name].get('dir', 'emotes')
        os.makedirs(os.path.join(OUT, folder), exist_ok=True)
        image.save(os.path.join(OUT, folder, f'{name}.png'))
        print(f'wrote apps/client/public/sprites/ui/{folder}/{name}.png')
    if len(sys.argv) > 1:
        scale, pad = 14, 2
        sheet = Image.new('RGBA', ((16 + pad * 2) * len(images) * scale, (16 + pad * 2) * scale), '#fffdf7')
        for i, image in enumerate(images.values()):
            sheet.alpha_composite(image.resize((16 * scale, 16 * scale), Image.NEAREST), ((i * (16 + pad * 2) + pad) * scale, pad * scale))
        sheet.save(sys.argv[1])
        print(f'preview {sys.argv[1]}')


if __name__ == '__main__':
    main()
