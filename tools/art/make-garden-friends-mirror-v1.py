"""Mirrored sheets for the garden friends Momo and Lulu.

garden-friends-v1.png faces down-right (SE): idle in column 0 and three walk frames in columns 1..3, Momo on row 0
and Lulu on row 1. garden-friends-sw-v1.png is the same sheet with every cell flipped left-right in place, so the
friends face and walk down-left (SW) with the same cell order. garden-friends-sit-v1.png (seated, cells 0 and 4) is
made from the idle cells and so faces down-right too; its mirror is garden-friends-sit-sw-v1.png. Nothing is redrawn.

The source sheets are 4x2 cells of fractional width (1774 / 4 = 443.5 px); each cell is flipped inside its rounded
box, which the game's atlas loader (pixelAtlas.ts) then scales to 90 px, so the rounding is far below one pixel.

Usage: python tools/art/make-garden-friends-mirror-v1.py
"""
import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
GARDEN = os.path.join(ROOT, 'apps/client/public/sprites/garden')
SHEETS = [('garden-friends-v1.png', 'garden-friends-sw-v1.png'), ('garden-friends-sit-v1.png', 'garden-friends-sit-sw-v1.png')]


def mirror_cells(src: Image.Image) -> Image.Image:
    out = Image.new('RGBA', src.size, (0, 0, 0, 0))
    w, h = src.width / 4, src.height / 2
    for row in range(2):
        for col in range(4):
            box = (round(col * w), round(row * h), round((col + 1) * w), round((row + 1) * h))
            out.paste(src.crop(box).transpose(Image.Transpose.FLIP_LEFT_RIGHT), box[:2])
    return out


def main():
    for name, mirrored in SHEETS:
        src = Image.open(os.path.join(GARDEN, name)).convert('RGBA')
        out = mirror_cells(src)
        assert mirror_cells(out).tobytes() == src.tobytes(), f'{name}: mirroring twice must give the source back'
        out.save(os.path.join(GARDEN, mirrored), optimize=True)
        print('saved', mirrored)


if __name__ == '__main__':
    main()
