import { bridgeUnder, footprint, onFloor, type PlacedItem, type Point } from './layout';

/**
 * Back-to-front drawing order for things standing on the ground (props and friends), shared by both renderers.
 *
 * Sorting by the centre's x + z alone breaks for long or large footprints: a 2-tile fence behind a tree can have a
 * larger centre sum than the tree and get drawn over its canopy. Instead each thing is a ground box and two boxes
 * that could cover each other on screen are ordered by which one lies wholly behind the other (smaller x or z side);
 * only boxes that overlap fall back to the centre sum. The pairs form a graph that is drawn in topological order.
 */
export interface GroundBox { x0: number; x1: number; z0: number; z1: number }
export const boxAround = (p: Point, w: number, d = w): GroundBox => ({ x0: p.x - w / 2, x1: p.x + w / 2, z0: p.z - d / 2, z1: p.z + d / 2 });
const centre = (b: GroundBox) => (b.x0 + b.x1 + b.z0 + b.z1) / 2;
/**
 * How far apart (in x − z) two ground boxes can be and still have their art overlap sideways: a tree canopy reaches
 * about 1 past its tile and Scarlet's sprite (3.9 wide) about 1.7 past her feet. Pairs further apart are not compared.
 */
const SIDE_REACH = 3;
const EPS = 1e-6;

/** Whether `a` has to be drawn before `b` (it is behind it). */
export function behind(a: GroundBox, b: GroundBox): boolean {
  const aBack = a.x1 <= b.x0 + EPS || a.z1 <= b.z0 + EPS, bBack = b.x1 <= a.x0 + EPS || b.z1 <= a.z0 + EPS;
  if (aBack !== bBack) return aBack;
  if (aBack) {
    // Each is behind the other along one axis: they stand side by side on screen and only art reaching sideways can
    // overlap. Compare their corners that face each other (the left one's right corner, the right one's left corner).
    const aLeft = a.x0 + a.x1 - a.z0 - a.z1 < b.x0 + b.x1 - b.z0 - b.z1;
    const [left, right] = aLeft ? [a, b] : [b, a];
    return (left.x1 + left.z0 <= right.x0 + right.z1) === aLeft;
  }
  return centre(a) <= centre(b);
}
/** Draw rank (0 = first) for each box. */
export function drawRanks(boxes: readonly GroundBox[], before: readonly [number, number][] = []): number[] {
  const n = boxes.length, next: number[][] = boxes.map(() => []), waiting = new Array<number>(n).fill(0);
  const forced = new Set(before.map(([a, b]) => `${a},${b}`));
  const hardPredecessors: number[][] = boxes.map(() => []);
  for (const [a, b] of before) hardPredecessors[b].push(a);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = boxes[i], b = boxes[j];
    // Sideways (screen x is x − z): boxes this far apart cannot cover each other.
    if (a.x0 - a.z1 > b.x1 - b.z0 + SIDE_REACH || b.x0 - b.z1 > a.x1 - a.z0 + SIDE_REACH) continue;
    const aFirst = forced.has(`${i},${j}`) || (!forced.has(`${j},${i}`) && behind(a, b));
    if (aFirst) { next[i].push(j); waiting[j]++; } else { next[j].push(i); waiting[i]++; }
  }
  const ranks = new Array<number>(n).fill(-1), depth = boxes.map(centre);
  for (let rank = 0; rank < n; rank++) {
    // Break a spatial cycle at the back, but never put a bridge below its own water bank.
    let pick = -1;
    for (let i = 0; i < n; i++) if (ranks[i] < 0 && waiting[i] === 0 && (pick < 0 || depth[i] < depth[pick])) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (ranks[i] < 0 && hardPredecessors[i].every(j => ranks[j] >= 0) && (pick < 0 || depth[i] < depth[pick])) pick = i;
    // Defensive fallback for invalid mutually forced constraints supplied by a caller.
    if (pick < 0) pick = ranks.findIndex(rank => rank < 0);
    ranks[pick] = rank;
    for (const j of next[pick]) waiting[j]--;
  }
  return ranks;
}
/** A friend's feet take about this much ground. */
export const FOOT = .6;
/**
 * Draw rank for standing props, raised water banks and walkers. Only path tiles have no raised pass.
 */
export function sceneOrder(items: readonly PlacedItem[], walkers: readonly { id: string; x: number; z: number }[]): Map<string, number> {
  const ids: string[] = [], boxes: GroundBox[] = [];
  const raised = items.filter(item => !onFloor(item.kind) || item.kind === 'pond' || item.kind === 'stream');
  for (const item of raised) { const f = footprint(item); ids.push(item.id); boxes.push(boxAround(f, f.w, f.d)); }
  for (const w of walkers) { ids.push(w.id); boxes.push(boxAround(w, FOOT)); }
  const before: [number, number][] = [];
  raised.forEach((a, i) => { if (a.kind !== 'pond' && a.kind !== 'stream') return;
    raised.forEach((b, j) => { if (b.kind !== 'bridge') return; const p = boxes[i], q = boxes[j];
      if (p.x0 < q.x1 && p.x1 > q.x0 && p.z0 < q.z1 && p.z1 > q.z0) before.push([i, j]);
    });
  });
  const ranks = drawRanks(boxes, before);
  return new Map(ids.map((id, i) => [id, ranks[i]]));
}
/** A bridge walker is above its deck / far rail, but below the separate near rail (+.2). */
export function walkerDepth(p: Point & { id: string }, items: readonly PlacedItem[], order: Map<string, number>) {
  const bridge = bridgeUnder(p, items);
  return bridge ? (order.get(bridge.id) ?? 0) + .1 : order.get(p.id) ?? 0;
}
