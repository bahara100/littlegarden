import { GARDEN, HALF, PICNIC, footprint, type PlacedItem, type Point } from './layout';
import type { GroundTheme } from './regions';
import { mix } from './seasons';
import { paintGroundMaterial } from './groundMaterials';

type Screen = (p: Point) => { x: number; y: number };
type Edge = { a: Point; b: Point; inward: Point };
type GroundPlan = { cells: Point[]; edges: Edge[]; path: Set<string> };
const key = (x: number, z: number) => `${x},${z}`;
const plans = new WeakMap<readonly PlacedItem[], GroundPlan>();
function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const hash = (x: number, z: number) => (Math.imul(x + 211, 73856093) ^ Math.imul(z + 179, 19349663)) >>> 0;

/** Only the outside of joined path tiles has a border; junctions and corners remain one continuous path. */
export function groundPlan(items: readonly PlacedItem[]): GroundPlan {
  const cached = plans.get(items); if (cached) return cached;
  const path = new Set<string>();
  for (const item of items) if (item.kind === 'path') {
    const f = footprint(item);
    for (let x = f.x - f.w / 2; x < f.x + f.w / 2; x++) for (let z = f.z - f.d / 2; z < f.z + f.d / 2; z++) path.add(key(x, z));
  }
  const cells = [...path].map(k => { const [x, z] = k.split(',').map(Number); return { x, z }; }).sort((a, b) => a.x - b.x || a.z - b.z);
  const edges: Edge[] = [];
  for (const { x, z } of cells) {
    if (!path.has(key(x - 1, z))) edges.push({ a: { x, z }, b: { x, z: z + 1 }, inward: { x: 1, z: 0 } });
    if (!path.has(key(x + 1, z))) edges.push({ a: { x: x + 1, z }, b: { x: x + 1, z: z + 1 }, inward: { x: -1, z: 0 } });
    if (!path.has(key(x, z - 1))) edges.push({ a: { x, z }, b: { x: x + 1, z }, inward: { x: 0, z: 1 } });
    if (!path.has(key(x, z + 1))) edges.push({ a: { x, z: z + 1 }, b: { x: x + 1, z: z + 1 }, inward: { x: 0, z: -1 } });
  }
  const result = { cells, edges, path }; plans.set(items, result); return result;
}

function polygon(c: CanvasRenderingContext2D, screen: Screen, points: Point[], color: string) {
  c.beginPath(); points.forEach((p, i) => { const q = screen(p); if (i) c.lineTo(Math.round(q.x), Math.round(q.y)); else c.moveTo(Math.round(q.x), Math.round(q.y)); });
  c.closePath(); c.fillStyle = color; c.fill();
}
function pixel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, scale: number) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
}
function tuft(c: CanvasRenderingContext2D, p: { x: number; y: number }, scale: number, dark: string, light: string, variant: number) {
  if (scale < .45) { pixel(c, p.x, p.y, variant % 3 ? 1 : 2, 1, dark, scale); return; }
  const s = Math.max(1, Math.round(scale));
  pixel(c, p.x - s, p.y, 3, 1, dark, scale);
  pixel(c, p.x, p.y - 2 * s, 1, 3, dark, scale);
  pixel(c, p.x - 2 * s, p.y - s, 1, 2, light, scale);
  if (variant % 2) pixel(c, p.x + 2 * s, p.y - s, 1, 2, dark, scale);
  else pixel(c, p.x + s, p.y - 2 * s, 1, 2, light, scale);
}

/** World-anchored lawn patches and clusters: fixed seed, no tile seams or movement when props are moved. */
export function naturalGroundDetails(c: CanvasRenderingContext2D, theme: GroundTheme, screen: Screen, items: readonly PlacedItem[], unit: number, textured = true) {
  if (textured && paintGroundMaterial(c, 'grass', theme, screen, unit)) return;
  const plan = groundPlan(items), rng = random(74131), scale = unit / 18;
  const base = theme.tiles[0], dark = mix(base, theme.grid, .72), light = mix(base, theme.tiles[3], .9);
  const blocked = items.filter(i => i.kind === 'pond' || i.kind === 'stream').map(footprint);
  const lawn = (p: Point, margin = .12) => Math.abs(p.x) < HALF - margin && Math.abs(p.z) < HALF - margin &&
    !plan.path.has(key(Math.floor(p.x), Math.floor(p.z))) &&
    !(Math.abs(p.x - PICNIC.x) < PICNIC.w / 2 + margin && Math.abs(p.z - PICNIC.z) < PICNIC.d / 2 + margin) &&
    !blocked.some(f => Math.abs(p.x - f.x) < f.w / 2 + margin && Math.abs(p.z - f.z) < f.d / 2 + margin);
  // Restrained irregular colour islands, instead of checkerboard shading.
  for (let i = 0; i < 110; i++) {
    const center = { x: -HALF + 1.1 + rng() * (GARDEN - 2.2), z: -HALF + 1.1 + rng() * (GARDEN - 2.2) };
    const w = .35 + rng() * .85, d = .25 + rng() * .65;
    const pts = [[-.8, -.25], [-.3, -.7], [.5, -.5], [.9, .1], [.35, .65], [-.5, .5]]
      .map(([x, z]) => ({ x: center.x + x * w, z: center.z + z * d }));
    if (pts.every(p => lawn(p))) polygon(c, screen, pts, mix(base, i % 3 ? theme.tiles[2] : theme.tiles[3], .38));
  }
  for (let i = 0; i < 460; i++) {
    const center = { x: -HALF + .35 + rng() * (GARDEN - .7), z: -HALF + .35 + rng() * (GARDEN - .7) };
    const kind = rng(), amount = i % 5 === 0 ? 3 : 1;
    for (let n = 0; n < amount; n++) {
      const p = { x: center.x + (rng() - .5) * .45, z: center.z + (rng() - .5) * .45 };
      if (!lawn(p, .2)) continue;
      const q = screen(p), x = Math.round(q.x), y = Math.round(q.y);
      if (kind < .78) tuft(c, { x, y }, scale, dark, light, i + n);
      else if (kind < .91) {
        pixel(c, x, y, 2, 1, mix(base, theme.tiles[1], .8), scale);
        pixel(c, x + Math.max(1, Math.round(scale)), y - Math.max(1, Math.round(scale)), 1, 1, light, scale);
      } else {
        if (scale < .45) { pixel(c, x, y, 1, 1, theme.speck, scale); continue; }
        const s = Math.max(1, Math.round(scale)), petal = i % 3 ? mix(theme.path[2], '#fff6df', .65) : theme.speck;
        pixel(c, x, y, 1, 2, dark, scale);
        pixel(c, x - s, y - 2 * s, 3, 1, petal, scale);
        pixel(c, x, y - 3 * s, 1, 3, petal, scale);
        pixel(c, x, y - 2 * s, 1, 1, mix(theme.path[0], '#dfb16c', .5), scale);
      }
    }
  }
}

/** Compacted earth, fine gravel and a grass fringe along exposed edges, with no internal tile borders. */
export function naturalPaths(c: CanvasRenderingContext2D, theme: GroundTheme, screen: Screen, items: readonly PlacedItem[], unit: number, textured = true) {
  const { cells, edges } = groundPlan(items), scale = unit / 18;
  if (!cells.length) return;
  c.save(); c.beginPath();
  [{ x: -HALF, z: -HALF }, { x: HALF, z: -HALF }, { x: HALF, z: HALF }, { x: -HALF, z: HALF }].map(screen)
    .forEach((p, i) => i ? c.lineTo(Math.round(p.x), Math.round(p.y)) : c.moveTo(Math.round(p.x), Math.round(p.y)));
  c.closePath(); c.clip();
  const soil = theme.path[0], grain = mix(soil, theme.path[1], .45), pale = mix(soil, theme.path[2], .8);
  const shapes = cells.map(({ x, z }) => [{ x, z }, { x: x + 1, z }, { x: x + 1, z: z + 1 }, { x, z: z + 1 }]);
  const painted = textured && paintGroundMaterial(c, 'path', theme, screen, unit, shapes);
  if (!painted) for (const shape of shapes) polygon(c, screen, shape, soil);
  const fringe: Point[][] = [];
  for (const edge of edges) {
    const rng = random(hash(edge.a.x * 3 + edge.inward.x, edge.a.z * 3 + edge.inward.z));
    const along = (t: number, inset: number) => ({ x: edge.a.x + (edge.b.x - edge.a.x) * t + edge.inward.x * inset, z: edge.a.z + (edge.b.z - edge.a.z) * t + edge.inward.z * inset });
    for (let i = 0; i < 4; i++) {
      const outside = -.025 - rng() * .045;
      polygon(c, screen, [along(i / 4, outside), along((i + 1) / 4, outside), along((i + 1) / 4, .065), along(i / 4, .065)], mix(soil, theme.path[1], .62));
      if (painted && rng() < .6) fringe.push([along(i / 4, -.1), along((i + 1) / 4, -.1), along((i + .8) / 4, .06 + rng() * .1), along((i + .35) / 4, .015)]);
    }
    if (!painted && rng() < .55) {
      const p = along(.2 + rng() * .6, -.085);
      if (Math.abs(p.x) < HALF - .2 && Math.abs(p.z) < HALF - .2) tuft(c, screen(p), scale, mix(theme.tiles[0], theme.grid, .8), theme.tiles[3], Math.round(rng() * 10));
    }
  }
  if (painted && fringe.length) paintGroundMaterial(c, 'grass', theme, screen, unit, fringe);
  if (!painted) for (const { x, z } of cells) {
    const rng = random(hash(x, z));
    for (let n = 0; n < Math.max(2, Math.round(7 * Math.min(1, scale))); n++) {
      const p = screen({ x: x + .12 + rng() * .76, z: z + .12 + rng() * .76 });
      pixel(c, p.x, p.y, n % 3 ? 1 : 2, 1, rng() > .4 ? pale : grain, scale);
      if (n === 0) pixel(c, p.x + Math.max(1, Math.round(scale)), p.y + Math.max(1, Math.round(scale)), 1, 1, grain, scale);
    }
  }
  c.restore();
}

/** An editing overlay, not a property of the painted ground material. */
export function groundGrid(c: CanvasRenderingContext2D, theme: GroundTheme, screen: Screen) {
  c.save(); c.strokeStyle = theme.grid; c.lineWidth = 1; c.globalAlpha = .78; c.beginPath();
  for (let n = -HALF; n <= HALF; n++) for (const [a, b] of [[{ x: n, z: -HALF }, { x: n, z: HALF }], [{ x: -HALF, z: n }, { x: HALF, z: n }]]) {
    const p = screen(a), q = screen(b); c.moveTo(Math.round(p.x), Math.round(p.y)); c.lineTo(Math.round(q.x), Math.round(q.y));
  }
  c.stroke(); c.restore();
}
