export type SwingFit = { left: number; top: number; sw: number; sh: number; dw: number; dh: number };

/** The isolated 1–4 pixel scraps around the extracted ropes must not travel with the seat. */
function clearLoosePixels(c: CanvasRenderingContext2D, size: number) {
  const pixels = c.getImageData(0, 0, size, size), seen = new Uint8Array(size * size);
  const queue = new Int32Array(size * size);
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || !pixels.data[start * 4 + 3]) continue;
    let count = 1; queue[0] = start; seen[start] = 1;
    for (let head = 0; head < count; head++) {
      const x = queue[head] % size, y = Math.floor(queue[head] / size);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, n = ny * size + nx;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || seen[n] || !pixels.data[n * 4 + 3]) continue;
        seen[n] = 1; queue[count++] = n;
      }
    }
    if (count <= 4) for (let n = 0; n < count; n++) pixels.data[queue[n] * 4 + 3] = 0;
  }
  c.putImageData(pixels, 0, 0);
}

/** Sample the original artwork once. Warping an already reduced sprite resamples its one-pixel edges twice. */
export function paintSwingFrame(
  c: CanvasRenderingContext2D, source: HTMLCanvasElement, fit: SwingFit,
  rest: HTMLCanvasElement, pad: number, angle: number, forward: number,
  slope: number, intercept: number,
) {
  c.save();
  c.imageSmoothingEnabled = false;
  if (angle === 0) {
    // Keep the approved rest pose exactly, including its original centring.
    c.drawImage(rest, pad, pad);
  } else {
    const size = 128 + pad * 2, frame = document.createElement('canvas'); frame.width = frame.height = size;
    const fc = frame.getContext('2d')!; fc.imageSmoothingEnabled = false;
    const a = forward * Math.sin(angle), b = Math.sin(angle) / 2 - (1 - Math.cos(angle));
    fc.setTransform(1 - a * slope, -b * slope, a, 1 + b, -a * intercept, -b * intercept);
    fc.drawImage(source, fit.left, fit.top, fit.sw, fit.sh,
      (128 - fit.dw) / 2 + pad, 128 - fit.dh + pad, fit.dw, fit.dh);
    fc.resetTransform(); clearLoosePixels(fc, size);
    c.drawImage(frame, 0, 0);
  }
  c.restore();
}
