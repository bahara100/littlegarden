import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, CATALOG, footprint, snapToTiles, type PlacedItem } from '../../apps/client/src/layout.js';
import { LayoutEditor, layoutError } from '../../apps/client/src/editor.js';
import { LAKE, LifeSimulation, activityLabel, walkable } from '../../apps/client/src/simulation.js';

const POND: PlacedItem = { id: 'pond-1', kind: 'pond', x: 4, z: 4.5, turn: 0 };
const withPond = () => [...DEFAULT_LAYOUT.items.filter(i => i.id !== 'tree-3'), POND];
const until = (sim: LifeSimulation, done: () => boolean, seconds = 40) => { for (let t = 0; t < seconds && !done(); t += .05) sim.update(.05); assert.ok(done(), 'expected state not reached'); };

test('a pond is a 4x5 decoration that fills whole tiles and cannot be walked on', () => {
  assert.deepEqual([CATALOG.pond.w, CATALOG.pond.d], [4, 5]);
  const snapped = snapToTiles({ ...POND, x: 4.3, z: 4.2 });
  assert.deepEqual([snapped.x, snapped.z], [4, 4.5], 'even width on a tile edge, odd depth on a tile centre');
  assert.deepEqual(footprint({ ...POND, turn: 1 }).w, 5, 'turning it swaps width and depth');
  assert.equal(layoutError(withPond()), null);
  assert.ok(layoutError([...DEFAULT_LAYOUT.items, { ...POND, x: 5 }]), 'it may not overlap the tree');
  const sim = new LifeSimulation(() => .5); sim.applyLayout(withPond());
  assert.equal(walkable({ x: 4, z: 4.5 }, sim.world), false);
  const e = new LayoutEditor(); e.enter(); assert.equal(e.begin('pond'), null);
});

test('tapping a pond sends the friend to the shore, where they stand facing the water', () => {
  const sim = new LifeSimulation(() => .5); sim.applyLayout(withPond());
  const lulu = sim.avatars.get('lilac')!;
  for (const a of sim.avatars.values()) a.until = 1e9;
  assert.equal(sim.moveTo('lilac', { x: 4.2, z: 5 }), null);
  assert.equal(activityLabel(lulu), '호수 보러 가는 중');
  until(sim, () => lulu.phase === 'watching');
  assert.equal(activityLabel(lulu), '호수 구경하는 중');
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
