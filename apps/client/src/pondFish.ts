/** Fish travel in source-sprite coordinates, inside the clear central water. */
export const POND_FISH = { fps: 8, frames: 256, count: 3 } as const;
export const pondFishFrame = (seconds: number, still = false) => still ? 0 : Math.floor(seconds * POND_FISH.fps) % POND_FISH.frames;
export function pondFishPose(index: number, frame: number) {
  const rx = [51, 36, 25][index], ry = [19, 14, 10][index], direction = index === 1 ? -1 : 1;
  const a = frame / POND_FISH.frames * Math.PI * 2 * direction + index * 2.1;
  return { x: Math.round(128 + rx * Math.cos(a)), y: Math.round(85 + ry * Math.sin(a)),
    angle: Math.round(Math.atan2(ry * Math.cos(a) * direction, -rx * Math.sin(a) * direction) / (Math.PI / 8)) * Math.PI / 8,
    tail: [0, 1, 2, 1][Math.floor(frame / 2 + index) % 4] };
}

let mask: HTMLCanvasElement | undefined, layer: HTMLCanvasElement | undefined, last = -1;
const poses: HTMLCanvasElement[][] = [];
export function preparePondFish(source: CanvasImageSource) {
  mask = document.createElement('canvas'); mask.width = 256; mask.height = 160;
  const mc = mask.getContext('2d')!; mc.drawImage(source, 0, 0);
  const pixels = mc.getImageData(0, 0, 256, 160);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [r, g, b, a] = pixels.data.slice(i, i + 4);
    // Stones, shore, lily pads and the flower cover fish as they pass below them.
    pixels.data[i + 3] = a && g > r + 12 && b > r + 12 ? 255 : 0;
  }
  mc.putImageData(pixels, 0, 0);
  layer = document.createElement('canvas'); layer.width = 256; layer.height = 160;
  last = -1; poses.length = 0;
  const pattern = ['       ff       ', '     oobbbo     ', '    obbbhhbo    ', 'tttoobbbwwhheo  ', ' t oobbbhhhbo   ', 'tttoobbbbbbo    ', '     oobbbo     ', '       ff       '];
  for (let fish = 0; fish < POND_FISH.count; fish++) {
    const colors: Record<string, string> = { o: '#377d86', b: ['#f1bb70', '#ed9679', '#b5e1dc'][fish], h: '#d3e1bf', w: '#b2d9c7', f: '#689c9b', t: '#6faaa5', e: '#326976' };
    poses[fish] = [];
    for (let angle = 0; angle < 16; angle++) for (let tail = 0; tail < 3; tail++) {
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 24;
      const c = sprite.getContext('2d')!; c.imageSmoothingEnabled = false;
      // One whole pixel fish per direction; cached, with a small alternating tail flick.
      c.translate(12, 12); c.rotate(angle * Math.PI / 8); c.translate(-8, -4);
      pattern.forEach((row, y) => [...row].forEach((letter, x) => {
        if (!colors[letter]) return; c.fillStyle = colors[letter];
        c.fillRect(x, y + (letter === 't' ? tail - 1 : 0), 1, 1);
      }));
      poses[fish].push(sprite);
    }
  }
}

/** One tiny shared canvas updates at 8 FPS; no full-ground redraw or particle pool. */
export function pondFishArt(seconds: number, still = false) {
  if (!layer || !mask) return undefined;
  const frame = pondFishFrame(seconds, still); if (frame === last) return layer; last = frame;
  const c = layer.getContext('2d')!; c.clearRect(0, 0, 256, 160); c.imageSmoothingEnabled = false;
  c.globalAlpha = .88;
  for (let fish = 0; fish < POND_FISH.count; fish++) {
    const p = pondFishPose(fish, frame), angle = (Math.round(p.angle / (Math.PI / 8)) + 16) % 16;
    c.drawImage(poses[fish][angle * 3 + p.tail], p.x - 12, p.y - 12);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, 0, 0);
  c.globalCompositeOperation = 'source-over'; return layer;
}
