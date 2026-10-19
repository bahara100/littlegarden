import { PICNIC, type Point } from './layout';

let art: HTMLCanvasElement | undefined;
/** Woven gingham, bound hem and short cotton fringe. Drawn once in source pixels for both renderers. */
export function picnicRugArt() {
  if (art) return art;
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 68;
  const c = canvas.getContext('2d')!, pixels = c.createImageData(128, 68);
  const palette = ['#90695f', '#b47c70', '#ca9683', '#e6b39a', '#f9e8c9', '#eed8b8', '#ead4b8', '#e0afa1', '#d49a90', '#c2847e', '#f4e3c7', '#edc8b4', '#b98c7e', '#ffeecf', '#a77568'];
  const rgb = palette.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  const put = (x: number, y: number, color: number) => {
    const n = (y * 128 + x) * 4;
    pixels.data.set([...rgb[color], 255], n);
  };
  // Inverse 2:1 projection: the square's weave stays aligned with the park's ground axes.
  for (let y = 0; y < 68; y++) for (let x = 0; x < 128; x++) {
    const u = Math.floor((y - 2 + (x - 64) / 2)), v = Math.floor((y - 2 - (x - 64) / 2));
    const edge = Math.min(u, v, 63 - u, 63 - v);
    if (edge < 0) {
      // Short grouped threads on the two front edges; no cast shadow outside the cloth.
      const along = u >= 0 && u < 64 ? u : v;
      if (edge >= -2 && (u >= 64 || v >= 64) && along >= 3 && along < 61 && along % 6 < 3)
        put(x, y, edge === -1 ? 5 : 12);
      continue;
    }
    const front = u > 60 || v > 60;
    let color: number;
    if (edge === 0) color = front ? 0 : 2;
    else if (edge === 1) color = front ? 1 : 3;
    else if (edge < 5) {
      color = front ? 2 : 3;
      const along = u < 5 || u > 58 ? v : u;
      if (edge === 3 && along % 5 < 3) color = 4; // ivory running stitch
    } else if (edge === 5) color = 14;
    else if (edge === 6) color = 4;
    else {
      const a = Math.floor((u - 7) / 7) % 2, b = Math.floor((v - 7) / 7) % 2;
      color = a && b ? 9 : a || b ? 7 : 10;
      // Sparse, ordered warp/weft highlights, rather than random surface noise.
      if ((u + v) % 4 === 0) color = a && b ? 8 : a || b ? 11 : 4;
      if (u % 7 === 0 && v % 3 === 0) color = a && b ? 9 : a || b ? 8 : 6;
      // Small folds beside the bound corners, still flat enough to sit on.
      const corner = Math.min(u + v, 126 - u - v);
      if (corner < 22 && Math.abs(u - v) < 2) color = 11;
      if (corner < 20 && u === v + 2) color = 13;
    }
    put(x, y, color);
  }
  c.putImageData(pixels, 0, 0); art = canvas; return art;
}

export function paintPicnicRug(c: CanvasRenderingContext2D, screen: (p: Point) => { x: number; y: number }, unit: number) {
  const p = screen(PICNIC), width = Math.round((PICNIC.w + PICNIC.d) * unit), height = Math.round(width * 68 / 128);
  c.save(); c.imageSmoothingEnabled = false;
  c.drawImage(picnicRugArt(), Math.round(p.x - width / 2), Math.round(p.y - width / 4 - width * 2 / 128), width, height);
  c.restore();
}
