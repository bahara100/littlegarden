import { footprint, onFloor, type PlacedItem, type Point } from './layout';

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
/** How far (in x − z) art can reach beyond its ground box sideways; pairs further apart than this never overlap. */
const SIDE_REACH = 1.5;
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
export function drawRanks(boxes: readonly GroundBox[]): number[] {
  const n = boxes.length, next: number[][] = boxes.map(() => []), waiting = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = boxes[i], b = boxes[j];
    // Sideways (screen x is x − z): boxes this far apart cannot cover each other.
    if (a.x0 - a.z1 > b.x1 - b.z0 + SIDE_REACH || b.x0 - b.z1 > a.x1 - a.z0 + SIDE_REACH) continue;
    if (behind(a, b)) { next[i].push(j); waiting[j]++; } else { next[j].push(i); waiting[i]++; }
  }
  const ranks = new Array<number>(n).fill(-1), depth = boxes.map(centre);
  for (let rank = 0; rank < n; rank++) {
    // The ready box nearest the back goes next; if none is ready (a rare cycle), the one nearest the back anyway.
    let pick = -1;
    for (let i = 0; i < n; i++) if (ranks[i] < 0 && waiting[i] === 0 && (pick < 0 || depth[i] < depth[pick])) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (ranks[i] < 0 && (pick < 0 || depth[i] < depth[pick])) pick = i;
    ranks[pick] = rank;
    for (const j of next[pick]) waiting[j]--;
  }
  return ranks;
}
/** A friend's feet take about this much ground. */
export const FOOT = .6;
/**
 * Draw rank for every standing prop (by item id) and every walker (by the id given). Floor items (paths, ponds) are
 * painted with the ground and left out.
 */
export function sceneOrder(items: readonly PlacedItem[], walkers: readonly { id: string; x: number; z: number }[]): Map<string, number> {
  const ids: string[] = [], boxes: GroundBox[] = [];
  for (const item of items) if (!onFloor(item.kind)) { const f = footprint(item); ids.push(item.id); boxes.push(boxAround(f, f.w, f.d)); }
  for (const w of walkers) { ids.push(w.id); boxes.push(boxAround(w, FOOT)); }
  const ranks = drawRanks(boxes);
  return new Map(ids.map((id, i) => [id, ranks[i]]));
}
