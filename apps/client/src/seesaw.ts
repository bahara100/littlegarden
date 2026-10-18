import { PARK_PROPS } from './parkProps';

/** Original 128px prop coordinates; both renderers and the seat layout share this rig. */
export const SEESAW = { width: 124, pivotX: 56, slope: .2, poses: 16, period: 3.2, seatX: [16, 112], pad: 16 } as const;
export function seesawFrame(tilt: number, still = false) { return still ? 0 : Math.round(tilt * SEESAW.poses); }
export function seesawSeatDistance(side: number) {
  return (SEESAW.seatX[side < 0 ? 0 : 1] - 64) * PARK_PROPS.seesaw.width / SEESAW.width;
}
export function seesawOffset(side: number, frame: number) {
  const x = SEESAW.seatX[side < 0 ? 0 : 1];
  return frame / SEESAW.poses * SEESAW.slope * (x - SEESAW.pivotX) * PARK_PROPS.seesaw.width / SEESAW.width;
}

/** Preserve the green fulcrum while the wooden beam and handles tilt together. */
export function seesawFrames(source: CanvasImageSource): HTMLCanvasElement[] {
  const canvas = () => { const c = document.createElement('canvas'); c.width = c.height = 128; return c; };
  const original = canvas(), oc = original.getContext('2d')!; oc.drawImage(source, 0, 0, 128, 128);
  const px = oc.getImageData(0, 0, 128, 128);
  const polygon = (points: number[][]) => {
    const c = canvas(), ctx = c.getContext('2d')!; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    return ctx.getImageData(0, 0, 128, 128).data;
  };
  const frontMask = polygon([[54, 90], [58, 88], [62, 94], [68, 114], [69, 117], [65, 121], [60, 119], [59, 115], [49, 111], [45, 115], [42, 112], [43, 109], [48, 106], [52, 94]]);
  const rearMask = polygon([[65, 82], [70, 83], [73, 94], [78, 108], [78, 112], [73, 114], [68, 111], [66, 103], [63, 91]]);
  const support = new Uint8Array(128 * 128);
  for (let n = 0; n < support.length; n++) {
    const i = n * 4, [r, g, b, a] = px.data.slice(i, i + 4);
    const wood = r > b + 55 && r > 130 && r > g * 1.15;
    if (a && (frontMask[i + 3] >= 128 || (rearMask[i + 3] >= 128 && !wood))) support[n] = 1;
  }
  const beam = canvas(), base = canvas(), rear = canvas();
  const bp = new ImageData(px.data.slice(), 128, 128), sp = new ImageData(128, 128), rp = new ImageData(128, 128);
  for (let n = 0; n < support.length; n++) if (support[n]) {
    const target = frontMask[n * 4 + 3] >= 128 ? sp : rp;
    target.data.set(px.data.subarray(n * 4, n * 4 + 4), n * 4); bp.data[n * 4 + 3] = 0;
    const x = n % 128, y = Math.floor(n / 128), depth = y - .52 * x;
    // Continue the original wood grain beneath the axle; the fixed support covers it at rest.
    if (depth >= 51 && depth <= 66) for (const dx of [18, -18, 24, -24]) {
      const sx = x + dx, sy = Math.round(y + .52 * dx), sn = sy * 128 + sx;
      if (sx >= 0 && sx < 128 && sy >= 0 && sy < 128 && !support[sn] && px.data[sn * 4 + 3]) {
        bp.data.set(px.data.subarray(sn * 4, sn * 4 + 4), n * 4); break;
      }
    }
  }
  // Continue the rear post behind the board, using the visible lower post's own texture.
  for (let y = 88; y <= 104; y++) for (let dx = -2; dx <= 2; dx++) {
    const x = Math.round(67 + (y - 89) * .3) + dx, sourceX = 72 + dx, i = (107 * 128 + sourceX) * 4;
    if (px.data[i + 3]) rp.data.set(px.data.subarray(i, i + 4), (y * 128 + x) * 4);
  }
  beam.getContext('2d')!.putImageData(bp, 0, 0); base.getContext('2d')!.putImageData(sp, 0, 0); rear.getContext('2d')!.putImageData(rp, 0, 0);
  return Array.from({ length: SEESAW.poses * 2 + 1 }, (_, i) => {
    const frame = i - SEESAW.poses, out = canvas(), pad = SEESAW.pad;
    out.width = out.height = 128 + pad * 2;
    const c = out.getContext('2d')!, slope = frame / SEESAW.poses * SEESAW.slope;
    c.imageSmoothingEnabled = false;
    if (!frame) { c.drawImage(original, pad, pad); return out; }
    c.drawImage(rear, pad, pad);
    c.setTransform(1, slope, 0, 1, pad, pad - slope * SEESAW.pivotX); c.drawImage(beam, 0, 0);
    c.resetTransform(); c.drawImage(base, pad, pad); return out;
  });
}
