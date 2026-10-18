import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeSimulation, activityLabel, findPath, walkable } from '../../apps/client/src/simulation.js';
import { worldFrom, type PlacedItem } from '../../apps/client/src/layout.js';
import { seesawFrame, seesawOffset } from '../../apps/client/src/seesaw.js';

function tick(sim: LifeSimulation, seconds: number) { for (let t = 0; t < seconds; t += .05) sim.update(.05); }
function until(sim: LifeSimulation, fn: () => boolean) { for (let t = 0; t < 35 && !fn(); t += .05) sim.update(.05); assert.ok(fn(), 'expected seesaw state'); }
const prop = (turn = 0): PlacedItem => ({ id: 'seesaw', kind: 'seesaw', x: 4, z: -3.5, turn });
function setup(turn = 0) {
  const sim = new LifeSimulation(() => .9); sim.applyLayout([prop(turn)]);
  for (const a of sim.avatars.values()) { a.directed = true; a.until = Infinity; }
  return sim;
}

test('all seesaw rotations have two reachable, distinct ends and tile-centred approaches', () => {
  for (let turn = 0; turn < 4; turn++) {
    const nav = worldFrom([prop(turn)]); assert.equal(nav.seats.length, 2);
    assert.notDeepEqual(nav.seats[0].approach, nav.seats[1].approach);
    const [left, right] = nav.seats;
    for (const [a, b] of [[left, right], [right, left]]) {
      const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
      assert.ok(Math.sin(a.yaw) * dx / length + Math.cos(a.yaw) * dz / length > .999, 'riders must face the opposite seat');
    }
    for (const s of nav.seats) {
      assert.ok(walkable(s.approach, nav)); assert.ok(findPath({ x: -.5, z: 2.5 }, s.approach, nav));
      for (const v of [s.approach.x, s.approach.z]) assert.equal(v - Math.floor(v), .5);
    }
  }
});

test('one waits still, two play at opposite heights, a third cannot reserve, leaving settles and frees the end', () => {
  const sim = setup(), momo = sim.avatars.get('peach')!, lulu = sim.avatars.get('lilac')!;
  assert.equal(sim.use('peach', 'seesaw'), null);
  until(sim, () => momo.phase === 'seated'); tick(sim, 2);
  assert.equal(activityLabel(momo), '시소에서 친구 기다리는 중'); assert.equal(sim.seesawTilt('seesaw'), 0);
  assert.equal(sim.use('lilac', 'seesaw'), null);
  assert.ok(sim.use('character', 'seesaw')); assert.equal(sim.reservations.size, 2);
  until(sim, () => lulu.seesaw === 'playing');
  const end = momo.until; assert.equal(end, lulu.until);
  const tilts: number[] = [];
  for (let n = 0; n < 90; n++) { sim.update(.05); tilts.push(sim.seesawTilt('seesaw')); }
  assert.ok(Math.max(...tilts) > .8); assert.ok(Math.min(...tilts) < -.8);
  assert.ok(seesawOffset(-1, seesawFrame(1)) * seesawOffset(1, seesawFrame(1)) < 0);
  sim.leave('lilac'); tick(sim, .8);
  assert.equal(sim.seesawTilt('seesaw'), 0); assert.equal(momo.seesaw, 'waiting');
  assert.equal(lulu.seatId, null); assert.ok(walkable(lulu, sim.world)); assert.equal(sim.reservations.size, 1);
  sim.applyLayout([]); assert.equal(sim.seesawTilt('seesaw'), 0); assert.equal(sim.reservations.size, 0);
  assert.equal(momo.seesaw, null);
});

test('a free friend joins a waiting seesaw and an unattended waiter eventually gets off', () => {
  const sim = setup(); sim.use('peach', 'seesaw');
  until(sim, () => sim.avatars.get('peach')!.seesaw === 'waiting');
  const lulu = sim.avatars.get('lilac')!; lulu.directed = false; lulu.until = sim.time;
  until(sim, () => lulu.seesaw === 'playing');
  assert.equal(sim.avatars.get('peach')!.seesaw, 'playing');
  const alone = setup(); alone.use('peach', 'seesaw');
  until(alone, () => alone.avatars.get('peach')!.seesaw === 'waiting'); tick(alone, 26);
  assert.equal(alone.avatars.get('peach')!.seatId, null); assert.equal(alone.reservations.size, 0);
});
