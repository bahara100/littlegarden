import { DEFAULT_LAYOUT, cloneLayout, snapToTiles, type Layout, type PlacedItem } from './layout';
import type { RegionId } from './regions';

/** Small park: a quiet lake, a fountain court, play lawn, picnic corner and a bridged brook. */
function makePark(): Layout {
  const items: PlacedItem[] = [
    { id: 'park-lake', kind: 'pond', x: -6.5, z: -5, turn: 0 },
    { id: 'park-fountain', kind: 'fountain', x: 3.5, z: -5.5, turn: 0 },
    { id: 'bench', kind: 'bench', x: -5.5, z: 0, turn: 0 },
    { id: 'park-court-bench', kind: 'bench', x: 7, z: -5.5, turn: 1 },
    { id: 'swing', kind: 'swing', x: 6.5, z: -.5, turn: 0 },
    { id: 'park-seesaw', kind: 'seesaw', x: 6, z: 4.5, turn: 0 },
    { id: 'park-drinking', kind: 'drinkingFountain', x: 3.5, z: .5, turn: 0 },
    { id: 'park-picnic', kind: 'picnicTable', x: -6, z: 4.5, turn: 0 },
    { id: 'park-bridge', kind: 'bridge', x: 0, z: 9, turn: 1 },
    ...[-8, -4, 0, 4, 8].map((x, i) => ({ id: `park-brook-${i}`, kind: 'stream' as const, x, z: 9, turn: 0 })),
    ...[[-10.5, -9.5], [10.5, -9.5], [-10.5, 9.5], [-10.5, -3.5], [10.5, 2.5], [-8.5, 6.5]].map(([x, z], i) => ({ id: `park-tree-${i}`, kind: 'tree' as const, x, z, turn: 0 })),
    ...[[-6, -9.5, 0], [-2, -9.5, 0], [6, -9.5, 0], [-10.5, .5, 1], [10.5, -4, 1], [3, 6.5, 0], [8, 7.5, 0]].map(([x, z, turn], i) => ({ id: `park-flower-${i}`, kind: 'flower' as const, x, z, turn })),
  ];
  items.forEach((item, i) => { items[i] = snapToTiles(item); });
  // Frame the far banks while leaving the two near edges open to the view.
  for (let x = -10; x <= 10; x += 2) items.push({ id: `park-fence-north-${x}`, kind: 'fence', x, z: -11.5, turn: 0 });
  for (let z = -10; z <= 6; z += 2) items.push({ id: `park-fence-west-${z}`, kind: 'fence', x: -11.5, z, turn: 1 });
  const paths = new Set<string>();
  const tile = (x: number, z: number) => paths.add(`${x},${z}`);
  const rect = (x0: number, z0: number, x1: number, z1: number) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) tile(x, z);
  };
  rect(-.5, -9.5, .5, 10.5);             // main promenade, including the bridge deck
  rect(-9.5, 1.5, 9.5, 2.5);            // picnic ↔ play lawn
  rect(-8.5, -1.5, -.5, -1.5);          // lake shore, behind the bench
  rect(-3.5, -8.5, -3.5, -1.5);         // lake's east shore
  rect(-3.5, -8.5, -.5, -8.5);
  rect(-8.5, 6.5, -.5, 6.5);            // picnic table's near bench
  rect(1.5, 5.5, 8.5, 5.5);             // seesaw approaches
  rect(8.5, -8.5, 8.5, 5.5);            // outer play / fountain stroll
  rect(1.5, -8.5, 8.5, -8.5);
  // A modest paved court around the fountain, rather than a path through its basin.
  for (let x = 1.5; x <= 5.5; x++) for (let z = -7.5; z <= -3.5; z++) {
    if (x === 1.5 || x === 5.5 || z === -7.5 || z === -3.5) tile(x, z);
  }
  rect(.5, -3.5, 5.5, -3.5);
  [...paths].sort().forEach((key, i) => { const [x, z] = key.split(',').map(Number); items.push({ id: `park-path-${i}`, kind: 'path', x, z, turn: 0 }); });
  return { items, stored: [] };
}

export const PARK_INITIAL_LAYOUT = makePark();
/** Regional starting layouts never replace an existing save automatically. */
export function initialLayout(id: RegionId): Layout {
  return cloneLayout(id === 'garden' ? PARK_INITIAL_LAYOUT : DEFAULT_LAYOUT);
}
