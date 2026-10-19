import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, footprint, type PlacedItem } from '../../apps/client/src/layout.js';
import { layoutError } from '../../apps/client/src/editor.js';
import { FOUNTAIN, LifeSimulation, activityLabel, reactionLabel } from '../../apps/client/src/simulation.js';

const FOUNTAIN_ITEM: PlacedItem = { id: 'fountain-1', kind: 'fountain', x: 5.5, z: 6.5, turn: 0 };
const withFountain = () => [...DEFAULT_LAYOUT.items, FOUNTAIN_ITEM];
const until = (sim: LifeSimulation, done: () => boolean, seconds = 40) => { for (let t = 0; t < seconds && !done(); t += .05) sim.update(.05); assert.ok(done(), 'expected state not reached'); };
const beside = (p: { x: number; z: number }) => {
  const f = footprint(FOUNTAIN_ITEM), dx = Math.abs(p.x - f.x) - f.w / 2, dz = Math.abs(p.z - f.z) - f.d / 2;
  return Math.max(dx, dz) > 0 && Math.max(dx, dz) <= FOUNTAIN.gap + .001;
};

test('tapping a fountain sends the friend to the next tile, where they watch it with a fountain icon', () => {
  assert.equal(layoutError(withFountain()), null);
  const sim = new LifeSimulation(() => .5); sim.applyLayout(withFountain());
  sim.unlocks = [];
  const lulu = sim.avatars.get('lilac')!;
  for (const a of sim.avatars.values()) a.until = 1e9;
  assert.equal(sim.moveTo('lilac', { x: 5.5, z: 6.5 }), null);
  assert.equal(lulu.watchKind, 'fountain');
  assert.equal(activityLabel(lulu), '분수 보러 가는 중');
  until(sim, () => lulu.phase === 'watching');
  assert.equal(activityLabel(lulu), '분수 구경하는 중');
  assert.equal(reactionLabel(lulu, sim.time), '⛲', 'the fountain icon shows as she starts watching');
  assert.ok(beside(lulu), 'she stands on a tile right next to the fountain');
  const f = footprint(FOUNTAIN_ITEM);
  assert.ok(Math.abs(Math.atan2(f.x - lulu.x, f.z - lulu.z) - lulu.yaw) < 1e-9, 'she faces the fountain');
  for (let t = 0; t < 2.6; t += .05) sim.update(.05);
  assert.equal(reactionLabel(lulu, sim.time), '', 'the icon comes and goes');
});
test("asking to use a fountain means watching it, and the pond's lines stay at the pond", () => {
  const sim = new LifeSimulation(() => .5); sim.applyLayout(withFountain());
  const lulu = sim.avatars.get('lilac')!;
  for (const a of sim.avatars.values()) a.until = 1e9;
  assert.equal(sim.use('lilac', FOUNTAIN_ITEM.id), null);
  until(sim, () => lulu.phase === 'watching');
  assert.equal(lulu.speech, '', 'Lulu\'s "물고기다!" pond line is not said at a fountain');
  sim.leave('lilac');
  assert.equal(lulu.watchKind, null);
});
test('a free friend sometimes goes to watch a fountain on their own', () => {
  const sim = new LifeSimulation(() => 0); sim.applyLayout(withFountain());
  const momo = sim.avatars.get('peach')!;
  for (const a of sim.avatars.values()) a.until = 1e9;
  momo.until = 0; sim.update(.05);
  assert.equal(momo.watchKind, 'fountain');
  assert.ok(beside(momo.watchSpot!));
  const lone = new LifeSimulation(() => 0), momo2 = lone.avatars.get('peach')!;
  for (const a of lone.avatars.values()) a.until = 1e9;
  momo2.until = 0; lone.update(.05);
  assert.equal(momo2.watchKind, null, 'no fountain, no fountain visit');
});
