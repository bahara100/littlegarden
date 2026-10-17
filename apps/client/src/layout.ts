export type Point = { x: number; z: number };
export type ItemKind = 'bench' | 'swing' | 'tree' | 'flower' | 'fence' | 'path';
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
};
/**
 * How far below the item centre (in tiles of screen height) each prop's lowest art pixel is drawn. The swing's lowest
 * pixel is its near leg's foot, about a tile in front of the frame's middle, so its art drops further than the
 * others; otherwise the frame stands a tile behind its seat and footprint.
 */
export const PROP_ART_BASE: Record<ItemKind, number> = { bench: .2, swing: 1.05, tree: .2, flower: .2, fence: .2, path: .2 };
/** Screen lift (tiles) of a seated rider's feet above the seat's ground point; the swing seat hangs low in its art. */
export const SEAT_LIFT = { drawn: { bench: .45, swing: -.33 }, standing: { bench: .75, swing: -.1 } } as const;
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
/** Centre on a tile centre for an odd span and on a tile edge for an even one, so the footprint fills whole tiles. */
const snapAxis = (v: number, span: number) => span % 2 ? Math.floor(v) + .5 : Math.round(v);
export function snapToTiles<T extends PlacedItem>(item: T): T {
  const asset = CATALOG[item.kind], w = tileSpan(item.w ?? asset.w), d = tileSpan(item.d ?? asset.d), swap = item.turn % 2;
  return { ...item, x: snapAxis(item.x, swap ? d : w), z: snapAxis(item.z, swap ? w : d) };
}
/** The two fixed floor features, on whole tiles: a picnic rug and a garden sign. */
export const PICNIC = { x: -3, z: 4, w: 2, d: 2 } as const;
export const SIGN = { x: -.5, z: -6.5, w: .4, d: .4 } as const;
export interface Seat extends Point { id: string; equipment: string; kind: 'bench' | 'swing'; approach: Point; height: number; yaw: number }
export interface NavigationWorld { rectangles: { x: number; z: number; w: number; d: number }[]; trunks: (Point & { r: number })[]; seats: Seat[] }
export function worldFrom(items: PlacedItem[]): NavigationWorld {
  const rectangles: NavigationWorld['rectangles'] = [{ ...PICNIC }, { ...SIGN }];
  const trunks: NavigationWorld['trunks'] = [], seats: Seat[] = [];
  for (const item of items) {
    if (item.kind === 'tree') trunks.push({ x: item.x, z: item.z, r: .67 });
    else if (item.kind !== 'path') {
      const size = item.kind === 'bench' ? { w: 3.15 * B, d: 1.15 * B } : item.kind === 'swing' ? { w: 3.25 * S, d: 2.1 * S } : { w: item.w ?? CATALOG[item.kind].w, d: item.d ?? CATALOG[item.kind].d };
      rectangles.push(oriented(item, size.w, size.d));
    }
    if (item.kind === 'bench') {
      for (const [suffix, side] of [['left', -1], ['right', 1]] as const) seats.push({
        id: `${item.id}-${suffix}`, equipment: item.id, kind: 'bench', ...transform({ x: side * BENCH_SEAT.x, z: BENCH_SEAT.z }, item),
        approach: transform({ x: side * BENCH_SEAT.approachX, z: BENCH_SEAT.approachZ }, item), height: .975 * B, yaw: item.turn * Math.PI / 2,
      });
    } else if (item.kind === 'swing') seats.push({ id: `${item.id}-seat`, equipment: item.id, kind: 'swing', ...transform({ x: 0, z: 0 }, item), approach: transform({ x: .15 * S, z: 2.25 * S }, item), height: .965 * S, yaw: item.turn * Math.PI / 2 });
  }
  return { rectangles, trunks, seats };
}
export function cloneLayout(layout: Layout): Layout { return { items: layout.items.map(i => ({ ...i })), stored: layout.stored.map(i => ({ ...i })) }; }
function makeDefault(): Layout {
  const items: PlacedItem[] = [
    // Every footprint fills whole floor tiles (snapToTiles): bench 3×2, swing 3×3, tree 1×1, beds 3×1 / 2×1 / 1×2.
    { id: 'bench', kind: 'bench', x: -3.5, z: -2, turn: 0 }, { id: 'swing', kind: 'swing', x: 3.5, z: -1.5, turn: 0 },
    ...[[-6.5, -5.5], [6.5, -5.5], [-6.5, 5.5], [6.5, 5.5]].map(([x, z], i) => ({ id: `tree-${i}`, kind: 'tree' as const, x, z, turn: 0 })),
    { id: 'flower-0', kind: 'flower', x: -4.5, z: -6.5, turn: 0, w: 2.7, d: 1 },
    { id: 'flower-1', kind: 'flower', x: 4, z: -6.5, turn: 0, w: 2.4, d: 1 },
    { id: 'flower-2', kind: 'flower', x: -6.5, z: 3, turn: 0, w: 1.3, d: 1.6 },
    { id: 'flower-3', kind: 'flower', x: 6.5, z: 3, turn: 0, w: 1.4, d: 1.5 },
  ];
  // Fences run down the middle of the outermost tile row/column.
  for (let x = -6; x <= 6; x += 2) items.push({ id: `fence-top-${x}`, kind: 'fence', x, z: -7.5, turn: 0 });
  for (let z = -6; z <= -2; z += 2) items.push({ id: `fence-left-${z}`, kind: 'fence', x: -7.5, z, turn: 1 });
  const cells = new Set<string>();
  // Path tiles sit exactly on floor tiles: a two-tile band across (z .5, 1.5) and down (x -.5, .5) the garden.
  for (let x = -7.5; x <= 7.5; x++) for (const z of [.5, 1.5]) cells.add(`${x},${z}`);
  for (let z = -7.5; z <= 7.5; z++) for (const x of [-.5, .5]) {
    if (z === .5 || z === 1.5) continue;
    cells.add(`${x},${z}`);
  }
  [...cells].forEach((key, i) => { const [x, z] = key.split(',').map(Number); items.push({ id: `path-${i}`, kind: 'path', x, z, turn: 0 }); });
  return { items, stored: [] };
}
export const DEFAULT_LAYOUT = makeDefault();
export const HUB = { x: -.25, z: 2.75 };
export function geometryError(items: PlacedItem[]): string | null {
  if (items.length > 160) return '놀이터에는 최대 160개까지 놓을 수 있어요.';
  const ids = new Set<string>();
  for (const item of items) {
    if (!CATALOG[item.kind] || typeof item.id !== 'string' || !item.id || !Number.isFinite(item.x) || !Number.isFinite(item.z) || !Number.isInteger(item.turn) || item.turn < 0 || item.turn > 3 || ids.has(item.id) || (item.w !== undefined && (!Number.isFinite(item.w) || item.w <= 0)) || (item.d !== undefined && (!Number.isFinite(item.d) || item.d <= 0))) return '올바르지 않은 배치 정보예요.';
    ids.add(item.id); const a = footprint(item);
    if (Math.abs(a.x) + a.w / 2 > 8.001 || Math.abs(a.z) + a.d / 2 > 8.001) return '놀이터 경계 안에 놓아주세요.';
    if (item.kind === 'path') continue;
    if (Math.abs(a.x - PICNIC.x) < (a.w + PICNIC.w) / 2 - .001 && Math.abs(a.z - PICNIC.z) < (a.d + PICNIC.d) / 2 - .001) return '피크닉 공간은 비워주세요.';
    if (Math.abs(a.x - SIGN.x) < (a.w + SIGN.w) / 2 && Math.abs(a.z - SIGN.z) < (a.d + SIGN.d) / 2) return '안내판과 겹쳐요.';
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = footprint(items[i]), b = footprint(items[j]);
    // Floor tiles can sit beneath furniture; two floor tiles cannot overlap.
    if ((items[i].kind === 'path') !== (items[j].kind === 'path')) continue;
    if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 - .001 && Math.abs(a.z - b.z) < (a.d + b.d) / 2 - .001) return '다른 기구나 장식과 겹쳐요.';
  }
  return null;
}
