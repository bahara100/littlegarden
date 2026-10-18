import { footprint, transform, type PlacedItem } from './layout';

/** A point on (or above / below) the ground: `h` is height in tiles (negative = below ground). */
export type Point3 = { x: number; z: number; h: number };
/** Fills a polygon of ground-space points (optionally outlined): each renderer projects them its own way. */
export type PondPen = (points: Point3[], color: string, line?: string) => void;

/** Pond colours: grassy bank, earthen basin wall, water from shallow rim to deep middle, shine, lily pads, stones. */
export const POND = {
  bank: '#7d8a5c', wall: '#5d5a3f', wallDark: '#47442f',
  shallow: '#8cc6d3', water: '#71aec4', deep: '#5c95b0', deeper: '#4f87a3', shine: '#e4f6f8',
  pad: '#6e9b55', padLine: '#4f7440', petal: '#f4c6d2',
  rockLine: '#3f3c35', rockTop: '#aaa497', rockLight: '#d6d1c4', rockSide: '#7a756b', rockFront: '#625e56',
} as const;
/** How far the water sits below the ground (tiles): the far bank shows as a wall this tall. */
export const POND_SINK = .16;

/** Repeatable 0..1 noise so the stones keep their sizes when the floor is redrawn. */
const noise = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/**
 * A pond drawn into the floor with depth: a grassy bank, a basin whose far wall shows above water sunk below the
 * ground, rings of deepening water, and a border of raised stones (lit tops, shaded fronts) drawn back to front.
 * Details sit in the pond's own frame so they turn with it. Shared by both renderers.
 */
export function paintPond(item: PlacedItem, pen: PondPen) {
  const f = footprint(item), turned = item.turn % 2 === 1;
  const quad = (x: number, z: number, w: number, d: number, h: number, color: string, line?: string) =>
    pen([{ x: x - w / 2, z: z - d / 2, h }, { x: x + w / 2, z: z - d / 2, h }, { x: x + w / 2, z: z + d / 2, h }, { x: x - w / 2, z: z + d / 2, h }], color, line);
  /** A rounded shape: three overlapping rectangles stepping in by `cut`. */
  const rounded = (x: number, z: number, w: number, d: number, cut: number, h: number, color: string) => {
    if (w <= 2 * cut || d <= 2 * cut) return;
    quad(x, z, w, d - 2 * cut, h, color); quad(x, z, w - cut, d - cut, h, color); quad(x, z, w - 2 * cut, d, h, color);
  };
  /** A raised block: the two faces toward the viewer (+x, +z) and a lit top, each outlined. */
  const block = (x: number, z: number, w: number, d: number, h: number) => {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
    pen([{ x: x1, z: z0, h: 0 }, { x: x1, z: z1, h: 0 }, { x: x1, z: z1, h }, { x: x1, z: z0, h }], POND.rockSide, POND.rockLine);
    pen([{ x: x0, z: z1, h: 0 }, { x: x1, z: z1, h: 0 }, { x: x1, z: z1, h }, { x: x0, z: z1, h }], POND.rockFront, POND.rockLine);
    quad(x, z, w, d, h, POND.rockTop, POND.rockLine);
    quad(x - w * .18, z - d * .18, w * .38, d * .38, h, POND.rockLight);
  };
  /** A water detail at a local spot (x along the pond's own length), sized in local axes, on the water surface. */
  const onWater = (lx: number, lz: number, w: number, d: number, color: string, line?: string) => {
    const p = transform({ x: lx, z: lz }, item);
    quad(p.x, p.z, turned ? d : w, turned ? w : d, -POND_SINK, color, line);
  };

  const cx = f.x, cz = f.z, basinW = f.w - .5, basinD = f.d - .5, cut = .6;
  // Bank, then the basin hole (its wall colour), then the water a little lower: lowering moves it toward the viewer,
  // so the water is shifted back by the same amount and only the far wall stays visible.
  rounded(cx, cz, f.w - .08, f.d - .08, .7, 0, POND.bank);
  rounded(cx, cz, basinW, basinD, cut, 0, POND.wallDark);
  rounded(cx - .04, cz - .04, basinW - .08, basinD - .08, cut, 0, POND.wall);
  const wx = cx - POND_SINK / 2, wz = cz - POND_SINK / 2, h = -POND_SINK;
  rounded(wx, wz, basinW - POND_SINK, basinD - POND_SINK, cut, h, POND.shallow);
  rounded(wx, wz, basinW - .6, basinD - .6, cut * .9, h, POND.water);
  rounded(wx, wz, basinW - 1.4, basinD - 1.4, cut * .8, h, POND.deep);
  rounded(wx, wz, basinW - 2.2, basinD - 2.2, cut * .6, h, POND.deeper);
  const L = (turned ? f.d : f.w) / 2, H = (turned ? f.w : f.d) / 2;
  onWater(L * .2, -H * .35, .6, .08, POND.shine);
  onWater(-L * .1, H * .12, .4, .08, POND.shine);
  onWater(L * .15, H * .45, .35, .08, POND.shine);
  onWater(-L * .42, -H * .25, .42, .36, POND.pad, POND.padLine);
  onWater(-L * .38, -H * .29, .12, .12, POND.petal);
  onWater(L * .38, H * .22, .32, .28, POND.pad, POND.padLine);

  // Stones on a rounded track along the basin rim; sizes and heights vary a little. Drawn back to front.
  const W = basinW + .05, D = basinD + .05, c = .55;
  const corners = [
    { x: -W / 2 + c, z: -D / 2 }, { x: W / 2 - c, z: -D / 2 }, { x: W / 2, z: -D / 2 + c }, { x: W / 2, z: D / 2 - c },
    { x: W / 2 - c, z: D / 2 }, { x: -W / 2 + c, z: D / 2 }, { x: -W / 2, z: D / 2 - c }, { x: -W / 2, z: -D / 2 + c },
  ];
  const stones: { x: number; z: number; s: number; h: number }[] = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i], b = corners[(i + 1) % corners.length], n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / .42));
    for (let k = 0; k < n; k++) {
      const r = noise(stones.length + cx * 7 + cz * 13);
      stones.push({ x: cx + a.x + (b.x - a.x) * k / n, z: cz + a.z + (b.z - a.z) * k / n, s: .34 + r * .12, h: .1 + noise(stones.length * 3.7 + cx) * .1 });
    }
  }
  stones.sort((p, q) => (p.x + p.z) - (q.x + q.z)).forEach(st => block(st.x, st.z, st.s, st.s, st.h));
}
