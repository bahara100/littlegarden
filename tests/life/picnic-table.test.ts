import test from 'node:test';
import assert from 'node:assert/strict';
import { worldFrom, type PlacedItem } from '../../apps/client/src/layout.js';
import { LifeSimulation, activityLabel, findPath, walkable } from '../../apps/client/src/simulation.js';
import { picnicArtPoint, PICNIC_GRID } from '../../apps/client/src/picnicTable.js';

const table = (turn = 0, id = 'table'): PlacedItem => ({ id, kind: 'picnicTable', x: 4, z: -3.5, turn });
function until(sim: LifeSimulation, fn: () => boolean, seconds = 40) { for (let t = 0; t < seconds && !fn(); t += .05) sim.update(.05); assert.ok(fn(), 'expected picnic seat state'); }

test('picnic tabletop long and short edges follow the grid, preserving the ground anchor and width', () => {
  const a = picnicArtPoint(46, 43), b = picnicArtPoint(108, 81), c = picnicArtPoint(18, 57);
  assert.ok(Math.abs((b.y - a.y) / (b.x - a.x) - .5) < 1e-9);
  assert.ok(Math.abs((c.y - a.y) / (c.x - a.x) + .5) < 1e-9);
  assert.deepEqual(picnicArtPoint(PICNIC_GRID.anchorX, PICNIC_GRID.anchorY), { x: PICNIC_GRID.anchorX, y: PICNIC_GRID.anchorY });
  for (let x = 0; x < 128; x++) assert.equal(picnicArtPoint(x, 64).x, x);
});

test('picnic tables have four reachable seats, separate approaches and inward facing on every rotation', () => {
  for (let turn = 0; turn < 4; turn++) {
    const item = table(turn), nav = worldFrom([item]), seats = nav.seats.filter(s => s.kind === 'picnicTable');
    assert.equal(seats.length, 4); assert.equal(new Set(seats.map(s => s.id)).size, 4);
    assert.equal(new Set(seats.map(s => `${s.approach.x},${s.approach.z}`)).size, 4);
    for (const s of seats) {
      assert.ok(findPath({ x: -.5, z: 2.5 }, s.approach, nav)); assert.ok(walkable(s.approach, nav));
      for (const v of [s.approach.x, s.approach.z]) assert.equal(v - Math.floor(v), .5);
      const dot = Math.sin(s.yaw) * (item.x - s.x) + Math.cos(s.yaw) * (item.z - s.z);
      assert.ok(dot > .9, 'both benches face the tabletop');
    }
  }
});

test('friends reserve different seats on both sides, sit, leave onto free tiles and release seats on layout changes', () => {
  const sim = new LifeSimulation(() => .9); sim.applyLayout([table()]);
  for (const id of ['character', 'peach', 'lilac'] as const) assert.equal(sim.use(id, 'table'), null);
  assert.equal(sim.reservations.size, 3); assert.equal(new Set([...sim.avatars.values()].map(a => a.seatId)).size, 3);
  until(sim, () => [...sim.avatars.values()].every(a => a.phase === 'seated'));
  assert.equal(new Set([...sim.avatars.values()].map(a => sim.seatOf(a)!.bench)).size, 2);
  for (const a of sim.avatars.values()) { assert.equal(activityLabel(a), '테이블에서 쉬는 중'); assert.equal(a.yaw, sim.seatOf(a)!.yaw); }
  sim.leave('peach'); until(sim, () => sim.avatars.get('peach')!.seatId === null);
  assert.ok(walkable(sim.avatars.get('peach')!, sim.world)); assert.equal(sim.reservations.size, 2);
  sim.applyLayout([]); assert.equal(sim.reservations.size, 0);
  assert.ok([...sim.avatars.values()].every(a => a.seatId === null));
});

test('independent tables keep independent seats and free friends can choose the picnic table', () => {
  const sim = new LifeSimulation(() => .1); sim.applyLayout([table(), { ...table(1, 'second'), x: -5, z: -3.5 }]);
  assert.equal(sim.seats.filter(s => s.kind === 'picnicTable').length, 8);
  assert.equal(sim.use('peach', 'table'), null); assert.equal(sim.use('lilac', 'second'), null);
  until(sim, () => sim.avatars.get('character')!.seatId !== null);
  assert.equal(sim.seatOf(sim.avatars.get('character')!)!.kind, 'picnicTable');
});
