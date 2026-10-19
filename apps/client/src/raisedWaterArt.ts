/** Copy only terrestrial pixels connected to the outer silhouette; interior lily pads stay on the water layer. */
export function waterBankArt(source: CanvasImageSource, width = 128, height = width) {
  const out = document.createElement('canvas'); out.width = width; out.height = height;
  const c = out.getContext('2d')!; c.drawImage(source, 0, 0, width, height);
  const pixels = c.getImageData(0, 0, width, height), bank = new Uint8Array(width * height), queue: number[] = [];
  const land = (n: number) => { const i = n * 4, p = pixels.data; return p[i + 3] > 0 && !(p[i + 1] > p[i] + 12 && p[i + 2] > p[i] + 12); };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const n = y * width + x; if (!land(n)) continue;
    if (!x || !y || x === width - 1 || y === height - 1 || [n - 1, n + 1, n - width, n + width].some(k => !pixels.data[k * 4 + 3])) { bank[n] = 1; queue.push(n); }
  }
  for (let head = 0; head < queue.length; head++) {
    const n = queue[head], x = n % width, y = Math.floor(n / width);
    for (const k of [x ? n - 1 : -1, x < width - 1 ? n + 1 : -1, y ? n - width : -1, y < height - 1 ? n + width : -1]) {
      if (k >= 0 && !bank[k] && land(k)) { bank[k] = 1; queue.push(k); }
    }
  }
  for (let n = 0; n < bank.length; n++) if (!bank[n]) pixels.data[n * 4 + 3] = 0;
  c.putImageData(pixels, 0, 0); return out;
}

/** Near railing / front face of the unchanged 128px bridge; the open deck and far railing remain behind walkers. */
export function bridgeFrontArt(source: CanvasImageSource) {
  const out = document.createElement('canvas'); out.width = out.height = 128;
  const c = out.getContext('2d')!; c.drawImage(source, 0, 0, 128, 128);
  const pixels = c.getImageData(0, 0, 128, 128); c.clearRect(0, 0, 128, 128); c.beginPath();
  [[3, 57], [14, 57], [14, 65], [30, 68], [46, 78], [62, 91], [77, 106], [78, 104], [88, 104], [90, 128], [3, 128]]
    .forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.fill(); const mask = c.getImageData(0, 0, 128, 128).data;
  for (let i = 0; i < pixels.data.length; i += 4) if (mask[i + 3] < 128) pixels.data[i + 3] = 0;
  c.putImageData(pixels, 0, 0); return out;
}
