import type { Point } from './layout';

/** 2:1 diamond projection; ground coordinates retain the existing save format. */
export function project(p: Point, unit: number): { x: number; y: number } {
  return { x: (p.x - p.z) * unit, y: (p.x + p.z) * unit / 2 };
}
export function unproject(x: number, y: number, unit: number): Point {
  return { x: (x / 2 + y) / unit, z: (y - x / 2) / unit };
}
export function depth(p: Point) { return p.x + p.z; }
/** Hard-edged filled ellipse, one pixel row at a time (no anti-aliased rim on the pixel floor). */
export function pixelEllipse(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++) {
    const dy = (y + .5 - cy) / ry, half = rx * Math.sqrt(Math.max(0, 1 - dy * dy));
    if (half >= .5) c.fillRect(Math.round(cx - half), y, Math.round(cx + half) - Math.round(cx - half), 1);
  }
}
