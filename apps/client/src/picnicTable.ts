import type { PlacedItem, Point, Seat } from './layout';
import type { ScarletDirection } from './scarletDirections';

/** Original art / its horizontal reflection, matching the two displayed diagonals. */
export function picnicPoint(item: PlacedItem, local: Point): Point {
  return item.turn % 2 ? { x: item.x + local.z, z: item.z + local.x } : { x: item.x + local.x, z: item.z + local.z };
}
export const PICNIC_SEATS = { along: .85, near: 1, far: -1.4, height: .8 } as const;

/** Contact lines on the actual grid-aligned 128px bench surfaces, not the tabletop or the feet below them. */
export const PICNIC_BENCH_ART = {
  near: { from: [11,80], to: [62,108] },
  far: { from: [64,55], to: [120,86] },
} as const;
type SittingSprite = { character: string; facing: ScarletDirection; frameSize: number; worldSize: number; originY: number };
/** Seat contact on the existing sitting drawings. Front and rear hips differ even on the same padded canvas. */
const HIPS = {
  snow: { se: [54,94], ne: [59,94] },
  character: { se: [56,97], ne: [59,98] },
  friend: { se: [40,71], ne: [44,71] },
} as const;
export function picnicSeatContact(bench: 'near' | 'far', side: -1 | 1) {
  const line=PICNIC_BENCH_ART[bench],t=side<0?.25:.75;
  return { x:line.from[0]+(line.to[0]-line.from[0])*t, y:line.from[1]+(line.to[1]-line.from[1])*t };
}
/** Keep navigation/reservations unchanged; align the drawing's hip to its bench contact, mirrored with the table. */
export function picnicRiderOffset(item: PlacedItem, seat: Pick<Seat,'x'|'z'|'bench'|'side'>, sprite: SittingSprite, progress: number, artWidth=124, lift=.3) {
  const contact=picnicSeatContact(seat.bench!,seat.side!),unit=5.8/artWidth;
  const targetX=(contact.x-64)*unit*(item.turn%2?-1:1),targetY=1.2+(contact.y-128)*unit;
  const profile=HIPS[sprite.character==='snow'?'snow':sprite.character==='character'?'character':'friend'];
  const hip=profile[sprite.facing.startsWith('s')?'se':'ne'];
  const hipX=((sprite.facing.endsWith('w')?sprite.frameSize-hip[0]:hip[0])/sprite.frameSize-.5)*sprite.worldSize;
  const hipY=(hip[1]/sprite.frameSize-sprite.originY)*sprite.worldSize;
  const dx=seat.x-item.x,dz=seat.z-item.z,p=Math.max(0,Math.min(1,progress));
  return { x:(targetX-(dx-dz)-hipX)*p, y:(targetY-(dx+dz)/2+lift-hipY)*p };
}

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

/** Near bench lip in front of inward-facing legs; the hip and torso stay above the seat surface. Input is grid-aligned. */
export function picnicBenchFront(source: CanvasImageSource) {
  const out=document.createElement('canvas');out.width=out.height=128;
  const c=out.getContext('2d')!;c.drawImage(source,0,0,128,128);
  const pixels=c.getImageData(0,0,128,128);c.clearRect(0,0,128,128);c.beginPath();
  [[2,78],[14,74],[66,103],[67,117],[57,121],[2,89]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();c.fill();const mask=c.getImageData(0,0,128,128).data;
  for(let i=0;i<pixels.data.length;i+=4)if(mask[i+3]<128)pixels.data[i+3]=0;
  c.putImageData(pixels,0,0);return out;
}
