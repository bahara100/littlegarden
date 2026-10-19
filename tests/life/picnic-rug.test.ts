import test from 'node:test';
import assert from 'node:assert/strict';
import { PICNIC, PICNIC_RUG_ID, SEAT_LIFT, onPicnicRug, worldFrom } from '../../apps/client/src/layout';
import { PARK_INITIAL_LAYOUT } from '../../apps/client/src/parkLayout';
import { LifeSimulation, activityLabel, findPath, walkable } from '../../apps/client/src/simulation';

function until(sim: LifeSimulation, done: () => boolean, seconds = 35) {
  for (let t = 0; t < seconds && !done(); t += .05) sim.update(.05);
  assert.ok(done(), 'expected rug state');
}

test('fixed picnic rug has two inward seats and reachable separate tile-centre approaches, also beside the park table', () => {
  for (const items of [[], PARK_INITIAL_LAYOUT.items]) {
    const nav = worldFrom(items), seats = nav.seats.filter(s => s.kind === 'picnicRug');
    assert.equal(seats.length, 2);
    assert.notDeepEqual(seats[0].approach, seats[1].approach);
    for (const s of seats) {
      assert.ok(onPicnicRug(s)); assert.equal(s.height, 0);
      assert.ok(!onPicnicRug(s.approach)); assert.ok(walkable(s.approach, nav));
      assert.ok(findPath({ x: -.5, z: 2.5 }, s.approach, nav));
      assert.equal(s.approach.x % 1, s.approach.x < 0 ? -.5 : .5);
      assert.equal(s.approach.z % 1, s.approach.z < 0 ? -.5 : .5);
      assert.ok(Math.sin(s.yaw) * (PICNIC.x - s.x) + Math.cos(s.yaw) * (PICNIC.z - s.z) > 0);
    }
    assert.ok(!walkable(PICNIC, nav), 'ordinary walking does not cut through a rug occupied by seated friends');
  }
  assert.ok(SEAT_LIFT.drawn.picnicRug < 0, 'the hips lower to the cloth rather than a bench height');
});

test('two rug reservations are exclusive; leaving and layout resets release them safely', () => {
  const sim = new LifeSimulation(() => .99); sim.applyLayout([]);
  for (const a of sim.avatars.values()) { a.directed = true; a.until = Infinity; }
  assert.equal(sim.use('peach', PICNIC_RUG_ID), null);
  assert.equal(sim.use('lilac', PICNIC_RUG_ID), null);
  assert.ok(sim.use('character', PICNIC_RUG_ID));
  assert.equal(sim.reservations.size, 2);
  until(sim, () => ['peach', 'lilac'].every(id => sim.avatars.get(id as 'peach' | 'lilac')!.phase === 'seated'));
  for (const id of ['peach', 'lilac'] as const) {
    const a = sim.avatars.get(id)!;
    assert.equal(activityLabel(a), '돗자리에서 쉬는 중'); assert.ok(onPicnicRug(a));
    assert.equal(a.yaw, sim.seatOf(a)!.yaw);
  }
  sim.leave('peach');
  assert.equal(sim.reservations.size, 2, 'reserved while standing up');
  until(sim, () => sim.avatars.get('peach')!.seatId === null);
  assert.ok(walkable(sim.avatars.get('peach')!, sim.world)); assert.equal(sim.reservations.size, 1);
  sim.applyLayout([]); assert.equal(sim.reservations.size, 0);
  assert.ok([...sim.avatars.values()].every(a => a.seatId === null && walkable(a, sim.world)));
});
test('both rug seats face the viewer: only front sitting poses (SE and SW)', async () => {
  const { scarletDirection } = await import('../../apps/client/src/scarletDirections');
  const seats = worldFrom([]).seats.filter(s => s.kind === 'picnicRug').sort((a, b) => (a.x - a.z) - (b.x - b.z));
  assert.deepEqual(seats.map(s => scarletDirection(s.yaw)), ['se', 'sw'], 'left seat turns down-right, right seat down-left');
});
