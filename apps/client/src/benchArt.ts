/** Same fitted 128px bench cells in both renderers; only the near iron arm/leg covers a rider. */
const NEAR_ARM = [[108,72],[121,72],[121,115],[110,128],[77,128],[77,93],[83,83],[98,80],[107,77]];
function inside(x: number, y: number) {
  let hit = false;
  for (let i = 0, j = NEAR_ARM.length - 1; i < NEAR_ARM.length; j = i++) {
    const [ax,ay] = NEAR_ARM[i], [bx,by] = NEAR_ARM[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
  }
  return hit;
}
export function benchFrontArt(source: CanvasImageSource, cell: 0 | 1) {
  const out = document.createElement('canvas'); out.width = out.height = 128;
  const c = out.getContext('2d')!; c.drawImage(source, 0, 0, 128, 128);
  const pixels = c.getImageData(0, 0, 128, 128), p = pixels.data;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    // The warm wood and the open loop stay behind the rider, including inside this trace.
    const iron = p[i + 2] > p[i + 1] && p[i + 2] >= p[i] * .75;
    if (!inside(cell === 1 ? x + .5 : 127.5 - x, y + .5) || !iron) p[i + 3] = 0;
  }
  c.putImageData(pixels, 0, 0); return out;
}
/** Tuck a rider slightly away from the near arm. Mirror with the unchanged art, fade during boarding/leaving. */
export function benchSeatShift(turn: number, progress: number) {
  return (turn === 0 || turn === 3 ? -1 : 1) * .16 * Math.max(0, Math.min(1, progress));
}
