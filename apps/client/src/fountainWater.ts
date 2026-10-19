/** Shared, cached 128px frames: only the original blue water pixels move. */
export const FOUNTAIN_WATER = { frames: 24, fps: 12 } as const;
export function fountainFrame(seconds: number, still = false) {
  return still ? 0 : ((Math.floor(seconds * FOUNTAIN_WATER.fps) % FOUNTAIN_WATER.frames) + FOUNTAIN_WATER.frames) % FOUNTAIN_WATER.frames;
}

export function fountainFrames(source: CanvasImageSource): HTMLCanvasElement[] {
  const original = document.createElement('canvas'); original.width = original.height = 128;
  const ctx = original.getContext('2d')!; ctx.drawImage(source, 0, 0, 128, 128);
  const pixels = ctx.getImageData(0, 0, 128, 128);
  return Array.from({ length: FOUNTAIN_WATER.frames }, (_, frame) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const out = new ImageData(pixels.data.slice(), 128, 128), phase = frame / FOUNTAIN_WATER.frames;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4, r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
      // Warm stone, white foam, the pedestal and transparent outline stay pixel-identical.
      if (!pixels.data[i + 3] || g < r + 9 || b < r + 15 || b < g - 18) continue;
      let wave: number;
      if (y >= 73) {
        // Elliptical ripples spread away from the two falling streams into the basin.
        const left = Math.hypot(x - 34, (y - 82) * 2.5), right = Math.hypot(x - 94, (y - 82) * 2.5);
        wave = Math.cos((Math.min(left, right) / 13 - phase) * Math.PI * 2);
      } else {
        // Highlights travel down the existing curved water jets, rather than moving the stone art.
        const flow = y + Math.abs(x - 64) * .35;
        wave = Math.cos((flow / 12 - phase * 4) * Math.PI * 2);
      }
      const amount = wave > .72 ? .62 : wave > .15 ? .18 : wave < -.65 ? -.14 : 0;
      const target = amount < 0 ? [40, 137, 164] : [224, 255, 250];
      for (let channel = 0; channel < 3; channel++) out.data[i + channel] = Math.round(pixels.data[i + channel] * (1 - Math.abs(amount)) + target[channel] * Math.abs(amount));
    }
    canvas.getContext('2d')!.putImageData(out, 0, 0); return canvas;
  });
}
