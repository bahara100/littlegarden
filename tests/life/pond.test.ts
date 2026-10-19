import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, CATALOG, footprint, snapToTiles, type PlacedItem } from '../../apps/client/src/layout.js';
import { LayoutEditor, layoutError } from '../../apps/client/src/editor.js';
import { LAKE, LifeSimulation, activityLabel, reactionLabel, walkable } from '../../apps/client/src/simulation.js';
import { decodeGarden, encodeSave } from '../../apps/client/src/persistence.js';
import { pondFishPose, pondFishFrame, POND_FISH } from '../../apps/client/src/pondFish.js';

const POND: PlacedItem = { id: 'pond-1', kind: 'pond', x: 4.5, z: 4, turn: 0 };
const withPond = () => [...DEFAULT_LAYOUT.items.filter(i => i.id !== 'tree-3'), POND];
const until = (sim: LifeSimulation, done: () => boolean, seconds = 40) => { for (let t = 0; t < seconds && !done(); t += .05) sim.update(.05); assert.ok(done(), 'expected state not reached'); };

test('a pond is a 5x6 decoration that fills whole tiles and cannot be walked on', () => {
  assert.deepEqual([CATALOG.pond.w, CATALOG.pond.d], [5, 6]);
  const snapped = snapToTiles({ ...POND, x: 4.3, z: 4.2 });
  assert.deepEqual([snapped.x, snapped.z], [4.5, 4], 'odd width on a tile centre, even depth on a tile edge');
  assert.deepEqual(footprint({ ...POND, turn: 1 }).w, 6, 'turning it swaps width and depth');
  assert.equal(layoutError(withPond()), null);
  assert.ok(layoutError([...DEFAULT_LAYOUT.items, { ...POND, x: 10, z: 8.5 }]), 'it may not overlap the tree');
  const sim = new LifeSimulation(() => .5); sim.applyLayout(withPond());
  assert.equal(walkable({ x: 4, z: 4.5 }, sim.world), false);
  const e = new LayoutEditor(); e.enter(); assert.equal(e.begin('pond'), null);
});

test('v3 lakes grow where safe; crowded and edge lakes keep their old footprint without losing a save', () => {
  const old: PlacedItem = { id: 'old-lake', kind: 'pond', x: 4, z: 4.5, turn: 0 };
  const oldSave = (items: PlacedItem[]) => JSON.stringify({ app: 'little-garden', version: 3, regions: { garden: { items, stored: [{ ...old, id: 'stored-lake' }] } } });
  const grown = decodeGarden(oldSave([old]));
  assert.deepEqual(grown.regions.garden!.items[0], { ...old, x: 4.5, z: 5, w: 5, d: 6 });
  const tree: PlacedItem = { id: 'nearby-tree', kind: 'tree', x: 6.5, z: 4.5, turn: 0 };
  const crowded = decodeGarden(oldSave([old, tree]));
  assert.deepEqual(crowded.regions.garden!.items, [{ ...old, w: 4, d: 5 }, tree]);
  assert.deepEqual(footprint(crowded.regions.garden!.stored[0]), { x: 4.5, z: 5, w: 5, d: 6 });
  const edge = decodeGarden(oldSave([{ ...old, x: 10, z: .5 }]));
  assert.equal(footprint(edge.regions.garden!.items[0]).w, 4);
  assert.deepEqual(decodeGarden(encodeSave(crowded)), crowded, 'the retained legacy footprint survives future saves');
  const editor = new LayoutEditor(); editor.committed = crowded.regions.garden!; editor.enter(); editor.move(old.id);
  assert.deepEqual([editor.pending!.w, editor.pending!.d], [5, 6]);
  assert.ok(editor.error, 'the larger preview still checks nearby furniture');
  editor.position(4.5, -3); assert.equal(editor.place(), null); assert.equal(editor.apply(), null);
  assert.deepEqual(editor.committed.items.find(i => i.id === tree.id), tree, 'moving the lake does not move nearby furniture');
});

test('fish swim in smooth closed loops inside the central water and stop with reduced motion', () => {
  for (let fish = 0; fish < POND_FISH.count; fish++) {
    assert.deepEqual(pondFishPose(fish, 0), pondFishPose(fish, POND_FISH.frames));
    for (let frame = 0; frame < POND_FISH.frames; frame++) {
      const a = pondFishPose(fish, frame), b = pondFishPose(fish, frame + 1);
      assert.ok(a.x >= 77 && a.x <= 179 && a.y >= 66 && a.y <= 104);
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) <= 2, 'no position jump on turns or the loop seam');
    }
  }
  assert.equal(pondFishFrame(17, true), 0);
  assert.equal(pondFishFrame(32), 0);
});

test('tapping a pond sends the friend to the shore, where they stand facing the water', () => {
  const sim = new LifeSimulation(() => .5); sim.applyLayout(withPond());
  sim.unlocks = [];  // no lines over the fish here (Lulu has a line for watching)
  const lulu = sim.avatars.get('lilac')!;
  for (const a of sim.avatars.values()) a.until = 1e9;
  assert.equal(sim.moveTo('lilac', { x: 4.2, z: 5 }), null);
  assert.equal(activityLabel(lulu), '호수 보러 가는 중');
  until(sim, () => lulu.phase === 'watching');
  assert.equal(activityLabel(lulu), '호수 구경하는 중');
  assert.equal(reactionLabel(lulu, sim.time), '🐟', 'a fish shows up as she starts watching');
  const f = footprint(POND);
  const outside = Math.abs(lulu.x - f.x) > f.w / 2 || Math.abs(lulu.z - f.z) > f.d / 2;
  assert.ok(outside, 'she stands on the shore, not in the water');
  assert.ok(Math.abs(lulu.x - f.x) <= f.w / 2 + 1 && Math.abs(lulu.z - f.z) <= f.d / 2 + 1, 'right next to it');
  const toPond = Math.atan2(f.x - lulu.x, f.z - lulu.z);
  assert.ok(Math.abs(Math.atan2(Math.sin(lulu.yaw - toPond), Math.cos(lulu.yaw - toPond))) < 1e-9, 'facing the pond');
  until(sim, () => lulu.phase !== 'watching', LAKE.watch + LAKE.extra + 1);
  assert.equal(lulu.lookAt, null);
});

test('free friends sometimes visit the pond on their own, each at their own spot', () => {
  const sim = new LifeSimulation(() => .1); sim.applyLayout(withPond());   // .1 < LAKE.visit: they go
  for (const a of sim.avatars.values()) a.until = 0;
  sim.update(.05);
  const spots = [...sim.avatars.values()].filter(a => a.watchSpot).map(a => `${a.watchSpot!.x},${a.watchSpot!.z}`);
  assert.ok(spots.length >= 2, 'friends head for the pond');
  assert.equal(new Set(spots).size, spots.length, 'no two friends pick the same shore tile');
  const none = new LifeSimulation(() => .1);
  for (const a of none.avatars.values()) a.until = 0;
  none.update(.05);
  assert.ok([...none.avatars.values()].every(a => !a.watchSpot), 'no pond, no pond visits');
});
