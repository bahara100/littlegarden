import type { Point } from './layout';

/** 2:1 diamond projection; ground coordinates retain the existing save format. */
export function project(p: Point, unit: number): { x: number; y: number } {
  return { x: (p.x - p.z) * unit, y: (p.x + p.z) * unit / 2 };
}
export function unproject(x: number, y: number, unit: number): Point {
  return { x: (x / 2 + y) / unit, z: (y - x / 2) / unit };
}
export function depth(p: Point) { return p.x + p.z; }
