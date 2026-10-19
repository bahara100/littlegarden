/** A small loop, generated once per renderer: the original stone/tap stay still. */
export const DRINKING_WATER = { frames: 16, fps: 12 } as const;
export const drinkingWaterFrame = (seconds: number, still = false) => still ? 0 :
  ((Math.floor(seconds * DRINKING_WATER.fps) % DRINKING_WATER.frames) + DRINKING_WATER.frames) % DRINKING_WATER.frames;

// Centreline of the white water already drawn in drinking-fountain.png, from the nozzle into the bowl.
const STREAM = [[76, 12], [75, 10], [74, 8], [71, 7], [69, 7], [67, 8], [65, 11], [63, 15], [61, 20], [59, 25], [59, 28]];
function flowAt(x: number, y: number) {
  let distance = Infinity, travel = 0, length = 0;
  for (let i = 1; i < STREAM.length; i++) {
    const [ax, ay] = STREAM[i - 1], [bx, by] = STREAM[i], dx = bx - ax, dy = by - ay, size = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (size * size)));
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < distance) { distance = d; travel = length + size * t; }
    length += size;
  }
  return { distance, travel };
}

export function drinkingWaterFrames(source: CanvasImageSource): HTMLCanvasElement[] {
  const original = document.createElement('canvas'); original.width = original.height = 128;
  const c = original.getContext('2d')!; c.drawImage(source, 0, 0, 128, 128);
  const pixels = c.getImageData(0, 0, 128, 128), stream = new Map<number, number>(), pool: number[] = [];
  for (let y = 5; y <= 31; y++) for (let x = 50; x <= 77; x++) {
    const n = y * 128 + x, i = n * 4, [r, g, b, a] = pixels.data.subarray(i, i + 4);
    if (a < 180) continue;
    // Exclude the warm stone rim and brass fixture; only the light, cool water stroke is recoloured.
    if (r > 170 && g > 170 && b > 155 && !(r > g + 8 && r > b + 24)) {
      const flow = flowAt(x, y); if (flow.distance <= 1.35) stream.set(n, flow.travel);
    }
    if (x >= 52 && x <= 66 && y >= 24 && y <= 30 && Math.abs(r - b) < 42 && g < 210) pool.push(n);
  }
  return Array.from({ length: DRINKING_WATER.frames }, (_, frame) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const out = new ImageData(pixels.data.slice(), 128, 128), phase = frame / DRINKING_WATER.frames;
    const tint = (n: number, color: number[], amount: number) => {
      for (let k = 0; k < 3; k++) out.data[n * 4 + k] = Math.round(pixels.data[n * 4 + k] * (1 - amount) + color[k] * amount);
    };
    for (const [n, travel] of stream) {
      const wave = Math.cos((travel / 8 - phase * 3) * Math.PI * 2);
      tint(n, wave > .45 ? [218, 255, 250] : [87, 180, 205], wave > .45 ? .8 : .62);
    }
    for (const n of pool) {
      const x = n % 128, y = Math.floor(n / 128), radius = Math.hypot(x - 59, (y - 27) * 2.2);
      // Two little elliptical rings spread from the falling stream; no movement of the metal bowl.
      if (radius < 6 && Math.abs(((radius - phase * 4 + 8) % 4) - 1.5) < .5)
        tint(n, [159, 228, 231], .52);
    }
    canvas.getContext('2d')!.putImageData(out, 0, 0); return canvas;
  });
}
