import { GARDEN, HALF, type Point } from './layout';
import type { GroundTheme } from './regions';
import { mix } from './seasons';

/** Sparse off-grid grass/petal marks. A single continuous floor lies beneath these. */
export function naturalGroundDetails(c: CanvasRenderingContext2D, theme: GroundTheme, screen: (p: Point) => { x: number; y: number }) {
  let seed = 74131;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < Math.round(GARDEN * GARDEN * .19); i++) {
    const p = screen({ x: -HALF + .4 + random() * (GARDEN - .8), z: -HALF + .4 + random() * (GARDEN - .8) });
    const x = Math.round(p.x), y = Math.round(p.y);
    c.fillStyle = i % 4 === 0 ? theme.speck : mix(theme.tiles[0], theme.tiles[2], .55);
    c.fillRect(x, y, 2, 1);
    if (i % 3 === 0) c.fillRect(x + 2, y - 1, 1, 2);
  }
}
