import { seesawSeatDistance } from './seesaw';
import { PICNIC_SEATS, picnicPoint } from './picnicTable';

export type Point = { x: number; z: number };
/** The garden is GARDEN×GARDEN floor tiles centred on 0 (edges at ±HALF); everything sizes itself from this. */
export const GARDEN = 24, HALF = GARDEN / 2;
/** Most decorations a region can hold, placed and stored together. */
export const MAX_ITEMS = 300;
/** Map zoom (1 = the whole garden fits): the closest view and a friend close-up keep the size they had on the 16-tile map. */
export const ZOOM = { min: .65, max: 5 * GARDEN / 16, friend: 3 * GARDEN / 16 } as const;
export type ItemKind = 'bench' | 'swing' | 'tree' | 'flower' | 'fence' | 'path' | 'pond' | 'picnicTable' | 'seesaw' | 'drinkingFountain' | 'fountain' | 'bridge' | 'stream';
export interface PlacedItem extends Point { id: string; kind: ItemKind; turn: number; w?: number; d?: number }
export interface Layout { items: PlacedItem[]; stored: PlacedItem[] }
/**
 * Bench and swing scale relative to their first (oversized) sizes, so a seated Scarlet (3.3 tiles tall,
 * knees ~0.4 tiles up) fits: the bench seat lands at knee height and the swing bar clears her hat.
 * Art width, footprint, collision box and approach depth use the same factor.
 */
export const EQUIPMENT_SCALE = { bench: .65, swing: .78 } as const;
const B = EQUIPMENT_SCALE.bench, S = EQUIPMENT_SCALE.swing;
/** Bench seats sit toward the two ends (not scaled) so two big-headed friends fit side by side. */
export const BENCH_SEAT = { x: .6, z: .06 * B, approachX: .55, approachZ: 1.75 * B } as const;
export const CATALOG: Record<ItemKind, { name: string; icon: string; w: number; d: number }> = {
  bench: { name: '나무 벤치', icon: '▤', w: 4.3 * B, d: 3.2 * B }, swing: { name: '산들 그네', icon: '⋂', w: 4.2 * S, d: 4.1 * S },
  tree: { name: '초록 나무', icon: '♣', w: 1.25, d: 1.25 }, flower: { name: '작은 화단', icon: '✿', w: 2, d: 1 },
  fence: { name: '나무 울타리', icon: '▥', w: 2, d: .2 }, path: { name: '길 타일', icon: '▧', w: 1, d: 1 },
  pond: { name: '호수', icon: '≈', w: 5, d: 6 },
  picnicTable: { name: '피크닉 테이블', icon: '▦', w: 4, d: 3 },
  seesaw: { name: '시소', icon: '⚖', w: 4, d: 1 },
  drinkingFountain: { name: '음수대', icon: '♧', w: 1, d: 1 },
  fountain: { name: '분수대', icon: '♨', w: 3, d: 3 },
  bridge: { name: '작은 나무다리', icon: '⌒', w: 4, d: 2 },
  stream: { name: '시냇물', icon: '≋', w: 4, d: 2 },
};
/** Base surfaces painted with the ground. Water banks are also copied into the raised occlusion pass. */
export const onFloor = (kind: ItemKind) => kind === 'path' || kind === 'pond' || kind === 'stream';
/**
 * How far below the item centre (in tiles of screen height) each prop's lowest art pixel is drawn. The swing's lowest
 * pixel is its near leg's foot, about a tile in front of the frame's middle, so its art drops further than the
 * others; otherwise the frame stands a tile behind its seat and footprint.
 */
export const PROP_ART_BASE: Record<ItemKind, number> = { bench: .2, swing: 1.05, tree: .2, flower: .2, fence: .2, path: .2, pond: .2,
  picnicTable: 1.2, seesaw: 1, drinkingFountain: .4, fountain: 1.2, bridge: 1.5, stream: 1.5 };
/** Screen lift (tiles) of a seated rider's feet above the seat's ground point; the swing seat hangs low in its art. */
export const SEAT_LIFT = { drawn: { bench: .45, swing: -.33, seesaw: .08, picnicTable: .3 }, standing: { bench: .75, swing: -.1, seesaw: .48, picnicTable: .8 } } as const;
export function transform(local: Point, item: PlacedItem): Point {
  const angle = item.turn * Math.PI / 2, c = Math.round(Math.cos(angle)), s = Math.round(Math.sin(angle));
  return { x: item.x + local.x * c + local.z * s, z: item.z - local.x * s + local.z * c };
}
function oriented(item: PlacedItem, w: number, d: number) { const swap = item.turn % 2; return { x: item.x, z: item.z, w: swap ? d : w, d: swap ? w : d }; }
/** Whole floor tiles an art size covers (floor tiles are 1×1 with edges on whole units). */
export const tileSpan = (size: number) => Math.max(1, Math.round(size));
/**
 * Ground footprint in whole tiles (overlap checks, editor highlight). A fence stays a thin line along
 * its tiles. Navigation keeps its own tighter collision boxes (worldFrom).
 */
export function footprint(item: PlacedItem) {
  const asset = CATALOG[item.kind], w = item.w ?? asset.w, d = item.d ?? asset.d;
  return oriented(item, tileSpan(w), item.kind === 'fence' ? d : tileSpan(d));
}
/** Raised stone/grass banks extend past the flat water footprint. Navigation includes that rim. */
export const WATER_BANK_CLEARANCE = { pond: .5, stream: .25 } as const;
export const POND_WATCH_GAP = 1.5;
export function waterBounds(item: PlacedItem) {
  const f = footprint(item), rim = item.kind === 'pond' || item.kind === 'stream' ? WATER_BANK_CLEARANCE[item.kind] : 0;
  return { ...f, w: f.w + rim * 2, d: f.d + rim * 2 };
}
/** Centre on a tile centre for an odd span and on a tile edge for an even one, so the footprint fills whole tiles. */
const snapAxis = (v: number, span: number) => span % 2 ? Math.floor(v) + .5 : Math.round(v);
export function snapToTiles<T extends PlacedItem>(item: T): T {
  const asset = CATALOG[item.kind], w = tileSpan(item.w ?? asset.w), d = tileSpan(item.d ?? asset.d), swap = item.turn % 2;
  return { ...item, x: snapAxis(item.x, swap ? d : w), z: snapAxis(item.z, swap ? w : d) };
}
/** The two fixed floor features, on whole tiles: a picnic rug and a garden sign. */
export const PICNIC = { x: -3, z: 4, w: 2, d: 2 } as const;
export const SIGN = { x: -.5, z: -HALF + 1.5, w: .4, d: .4 } as const;
export interface Seat extends Point { id: string; equipment: string; kind: 'bench' | 'swing' | 'seesaw' | 'picnicTable'; approach: Point; height: number; yaw: number; side?: -1 | 1; bench?: 'near' | 'far' }
export interface NavigationWorld { rectangles: { x: number; z: number; w: number; d: number }[]; trunks: (Point & { r: number })[]; seats: Seat[] }
type Rectangle = NavigationWorld['rectangles'][number];
/** Remove the bridge deck from a water obstacle; ordinary furniture is never cut away. */
function subtractWater(r: Rectangle, deck: Rectangle): Rectangle[] {
  const x0 = r.x - r.w / 2, x1 = r.x + r.w / 2, z0 = r.z - r.d / 2, z1 = r.z + r.d / 2;
  const a = Math.max(x0, deck.x - deck.w / 2), b = Math.min(x1, deck.x + deck.w / 2);
  const c = Math.max(z0, deck.z - deck.d / 2), d = Math.min(z1, deck.z + deck.d / 2);
  if (a >= b || c >= d) return [r];
  return [[x0, a, z0, z1], [b, x1, z0, z1], [a, b, z0, c], [a, b, d, z1]]
    .filter(([l, h, t, u]) => h > l && u > t)
    .map(([l, h, t, u]) => ({ x: (l + h) / 2, z: (t + u) / 2, w: h - l, d: u - t }));
}
/** Small deck rise in ground units; both renderers use the same walking height. */
export function bridgeLift(p: Point, items: readonly PlacedItem[]): number {
  let height = 0;
  for (const item of items) if (item.kind === 'bridge') {
    const f = footprint(item), dx = p.x - item.x, dz = p.z - item.z;
    const odd = item.turn % 2, along = odd ? dz : dx, across = odd ? dx : dz;
    const ramp = (odd ? f.d : f.w) / 2 + .75, halfAcross = (odd ? f.w : f.d) / 2;
    if (Math.abs(along) >= ramp || Math.abs(across) >= halfAcross) continue;
    // The authored deck is about a tile above ground at its crown, with short entry ramps.
    height = Math.max(height, 1.05 * Math.cos(along / (ramp * 2) * Math.PI));
  }
  return height;
}
export function bridgeUnder(p: Point, items: readonly PlacedItem[]) {
  return items.find(item => { if (item.kind !== 'bridge') return false; const f = footprint(item), odd = item.turn % 2; return Math.abs(p.x - f.x) < f.w / 2 + (odd ? 0 : .75) && Math.abs(p.z - f.z) < f.d / 2 + (odd ? .75 : 0); });
}
export function worldFrom(items: PlacedItem[]): NavigationWorld {
  const rectangles: NavigationWorld['rectangles'] = [{ ...PICNIC }, { ...SIGN }];
  const waters: Rectangle[] = [], decks = items.filter(i => i.kind === 'bridge').map(footprint);
  const trunks: NavigationWorld['trunks'] = [], seats: Seat[] = [];
  for (const item of items) {
    if (item.kind === 'tree') trunks.push({ x: item.x, z: item.z, r: .67 });
    else if (item.kind === 'pond' || item.kind === 'stream') waters.push(waterBounds(item));
    else if (item.kind !== 'path' && item.kind !== 'bridge') {
      const size = item.kind === 'bench' ? { w: 3.15 * B, d: 1.15 * B } : item.kind === 'swing' ? { w: 3.25 * S, d: 2.1 * S } : { w: item.w ?? CATALOG[item.kind].w, d: item.d ?? CATALOG[item.kind].d };
      rectangles.push(oriented(item, size.w, size.d));
    }
    if (item.kind === 'bench') {
      for (const [suffix, side] of [['left', -1], ['right', 1]] as const) seats.push({
        id: `${item.id}-${suffix}`, equipment: item.id, kind: 'bench', ...transform({ x: side * BENCH_SEAT.x, z: BENCH_SEAT.z }, item),
        approach: transform({ x: side * BENCH_SEAT.approachX, z: BENCH_SEAT.approachZ }, item), height: .975 * B, yaw: item.turn * Math.PI / 2,
      });
    } else if (item.kind === 'swing') seats.push({ id: `${item.id}-seat`, equipment: item.id, kind: 'swing', ...transform({ x: 0, z: 0 }, item), approach: transform({ x: .15 * S, z: 2.25 * S }, item), height: .965 * S, yaw: item.turn * Math.PI / 2 });
    else if (item.kind === 'picnicTable') for (const bench of ['near', 'far'] as const) for (const side of [-1, 1] as const) {
      const near = bench === 'near', x = side * PICNIC_SEATS.along;
      seats.push({ id: `${item.id}-${bench}-${side}`, equipment: item.id, kind: 'picnicTable', bench, side,
        ...picnicPoint(item, { x, z: PICNIC_SEATS[bench] }),
        approach: picnicPoint(item, { x, z: near ? 2.2 : -2.2 }), height: PICNIC_SEATS.height,
        yaw: item.turn % 2 ? (near ? -Math.PI / 2 : Math.PI / 2) : (near ? Math.PI : 0) });
    }
    else if (item.kind === 'seesaw') for (const side of [-1, 1] as const) {
      // The artwork uses a mirrored diagonal for odd turns, just like the other new park props.
      const odd = item.turn % 2;
      const distance = seesawSeatDistance(side);
      const p = odd ? { x: item.x, z: item.z + distance } : { x: item.x + distance, z: item.z };
      seats.push({ id: `${item.id}-${side}`, equipment: item.id, kind: 'seesaw', side, ...p,
        approach: { x: p.x + (odd ? 1.4 : 0), z: p.z + (odd ? 0 : 1.4) },
        height: .5, yaw: odd ? (side < 0 ? 0 : Math.PI) : (side < 0 ? Math.PI / 2 : -Math.PI / 2) });
    }
  }
  for (const water of waters) {
    let pieces = [water];
    for (const deck of decks) pieces = pieces.flatMap(r => subtractWater(r, deck));
    rectangles.push(...pieces);
  }
  // Friends walk tile centre to tile centre, so each seat's approach (where they step on and off) is the nearest
  // free tile centre to the art's approach point.
  const used: Point[] = [];
  for (const seat of seats) { seat.approach = approachTile(seat.approach, rectangles, trunks, used); used.push(seat.approach); }
  return { rectangles, trunks, seats };
}
/** Same clearance as the simulation's walkable(): foot radius .34 around obstacles, inside the garden. */
function clear(p: Point, rectangles: NavigationWorld['rectangles'], trunks: NavigationWorld['trunks']) {
  return Math.abs(p.x) <= HALF - .75 && Math.abs(p.z) <= HALF - .75 &&
    !rectangles.some(r => Math.abs(p.x - r.x) < r.w / 2 + .34 && Math.abs(p.z - r.z) < r.d / 2 + .34) &&
    !trunks.some(t => Math.hypot(p.x - t.x, p.z - t.z) < t.r);
}
function approachTile(raw: Point, rectangles: NavigationWorld['rectangles'], trunks: NavigationWorld['trunks'], used: Point[]): Point {
  const candidates: Point[] = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) candidates.push({ x: Math.floor(raw.x) + .5 + dx, z: Math.floor(raw.z) + .5 + dz });
  candidates.sort((a, b) => Math.hypot(a.x - raw.x, a.z - raw.z) - Math.hypot(b.x - raw.x, b.z - raw.z));
  return candidates.find(c => clear(c, rectangles, trunks) && !used.some(u => u.x === c.x && u.z === c.z)) ?? raw;
}
export function cloneLayout(layout: Layout): Layout { return { items: layout.items.map(i => ({ ...i })), stored: layout.stored.map(i => ({ ...i })) }; }
function makeDefault(): Layout {
  const E = HALF - 1.5;   // the tile row/column just inside the fence line
  const items: PlacedItem[] = [
    // Every footprint fills whole floor tiles (snapToTiles): bench 3×2, swing 3×3, tree 1×1, beds 3×1 / 2×1 / 1×2.
    // Benches, swing and picnic stay in the middle; trees, beds and fences follow the garden's edges (E = edge tile).
    { id: 'bench', kind: 'bench', x: -3.5, z: -2, turn: 0 }, { id: 'swing', kind: 'swing', x: 3.5, z: -1.5, turn: 0 },
    ...[[-E, -E + 1], [E, -E + 1], [-E, E - 1], [E, E - 1]].map(([x, z], i) => ({ id: `tree-${i}`, kind: 'tree' as const, x, z, turn: 0 })),
    { id: 'flower-0', kind: 'flower', x: -4.5, z: -E, turn: 0, w: 2.7, d: 1 },
    { id: 'flower-1', kind: 'flower', x: 4, z: -E, turn: 0, w: 2.4, d: 1 },
    { id: 'flower-2', kind: 'flower', x: -E, z: 3, turn: 0, w: 1.3, d: 1.6 },
    { id: 'flower-3', kind: 'flower', x: E, z: 3, turn: 0, w: 1.4, d: 1.5 },
  ];
  // Fences run down the middle of the outermost tile row/column.
  for (let x = -HALF + 2; x <= HALF - 2; x += 2) items.push({ id: `fence-top-${x}`, kind: 'fence', x, z: -HALF + .5, turn: 0 });
  for (let z = -HALF + 2; z <= -2; z += 2) items.push({ id: `fence-left-${z}`, kind: 'fence', x: -HALF + .5, z, turn: 1 });
  const cells = new Set<string>();
  // Path tiles sit exactly on floor tiles: a two-tile band across (z .5, 1.5) and down (x -.5, .5) the garden.
  for (let x = -HALF + .5; x <= HALF - .5; x++) for (const z of [.5, 1.5]) cells.add(`${x},${z}`);
  for (let z = -HALF + .5; z <= HALF - .5; z++) for (const x of [-.5, .5]) {
    if (z === .5 || z === 1.5) continue;
    cells.add(`${x},${z}`);
  }
  [...cells].forEach((key, i) => { const [x, z] = key.split(',').map(Number); items.push({ id: `path-${i}`, kind: 'path', x, z, turn: 0 }); });
  return { items, stored: [] };
}
export const DEFAULT_LAYOUT = makeDefault();
export const HUB = { x: -.25, z: 2.75 };
export function geometryError(items: PlacedItem[]): string | null {
  if (items.length > MAX_ITEMS) return `놀이터에는 최대 ${MAX_ITEMS}개까지 놓을 수 있어요.`;
  const ids = new Set<string>();
  for (const item of items) {
    if (!CATALOG[item.kind] || typeof item.id !== 'string' || !item.id || !Number.isFinite(item.x) || !Number.isFinite(item.z) || !Number.isInteger(item.turn) || item.turn < 0 || item.turn > 3 || ids.has(item.id) || (item.w !== undefined && (!Number.isFinite(item.w) || item.w <= 0)) || (item.d !== undefined && (!Number.isFinite(item.d) || item.d <= 0))) return '올바르지 않은 배치 정보예요.';
    ids.add(item.id); const a = footprint(item);
    if (Math.abs(a.x) + a.w / 2 > HALF + .001 || Math.abs(a.z) + a.d / 2 > HALF + .001) return '놀이터 경계 안에 놓아주세요.';
    if (item.kind === 'path') continue;
    if (Math.abs(a.x - PICNIC.x) < (a.w + PICNIC.w) / 2 - .001 && Math.abs(a.z - PICNIC.z) < (a.d + PICNIC.d) / 2 - .001) return '피크닉 공간은 비워주세요.';
    if (Math.abs(a.x - SIGN.x) < (a.w + SIGN.w) / 2 && Math.abs(a.z - SIGN.z) < (a.d + SIGN.d) / 2) return '안내판과 겹쳐요.';
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = footprint(items[i]), b = footprint(items[j]);
    // Floor tiles can sit beneath furniture; two floor tiles cannot overlap.
    if ((items[i].kind === 'path') !== (items[j].kind === 'path')) continue;
    // A footbridge may sit over water; all other solid props keep their normal collision footprint.
    if ((items[i].kind === 'bridge' && ['stream', 'pond'].includes(items[j].kind)) ||
        (items[j].kind === 'bridge' && ['stream', 'pond'].includes(items[i].kind))) continue;
    if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 - .001 && Math.abs(a.z - b.z) < (a.d + b.d) / 2 - .001) return '다른 기구나 장식과 겹쳐요.';
  }
  return null;
}
