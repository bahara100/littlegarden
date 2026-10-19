import type { PlacedItem, Point } from './layout';

/** Original art / its horizontal reflection, matching the two displayed diagonals. */
export function picnicPoint(item: PlacedItem, local: Point): Point {
  return item.turn % 2 ? { x: item.x + local.z, z: item.z + local.x } : { x: item.x + local.x, z: item.z + local.z };
}
export const PICNIC_SEATS = { along: .85, near: 1, far: -1.4, height: .8 } as const;

/** Source tabletop vectors (62,38), (-28,14) become the ground grid's ±1/2 slopes. */
export const PICNIC_GRID = { shear: -7 / 138, vertical: 62 / 69, anchorX: 64, anchorY: 128 - 1.2 * 124 / 5.8 } as const;
export function picnicArtPoint(x: number, y: number) {
  const r = PICNIC_GRID;
  return { x, y: r.anchorY + r.shear * (x - r.anchorX) + r.vertical * (y - r.anchorY) };
}

/** One nearest-neighbour inverse pass; no blur, new colours, rescaling of width or runtime rotation. */
export function picnicGridArt(source: CanvasImageSource) {
  const original = document.createElement('canvas'); original.width = original.height = 128;
  const c = original.getContext('2d')!; c.drawImage(source, 0, 0, 128, 128);
  const pixels = c.getImageData(0, 0, 128, 128), result = new ImageData(128, 128), r = PICNIC_GRID;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const sy = Math.floor(r.anchorY + (y + .5 - r.anchorY - r.shear * (x + .5 - r.anchorX)) / r.vertical);
    if (sy < 0 || sy >= 128) continue;
    const from = (sy * 128 + x) * 4; result.data.set(pixels.data.subarray(from, from + 4), (y * 128 + x) * 4);
  }
  const out = document.createElement('canvas'); out.width = out.height = 128;
  out.getContext('2d')!.putImageData(result, 0, 0); return out;
}

/** A foreground copy of the existing tabletop, so far-side riders sit behind it. The source PNG stays intact. */
export function picnicTabletop(source: CanvasImageSource) {
  const out = document.createElement('canvas'); out.width = out.height = 128;
  const c = out.getContext('2d')!; c.imageSmoothingEnabled = false; c.beginPath();
  [[18, 57], [46, 43], [108, 81], [108, 86], [78, 102], [18, 63]]
    .forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.clip(); c.drawImage(source, 0, 0, 128, 128);
  return out;
}
