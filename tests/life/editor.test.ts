import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, BENCH_SEAT, cloneLayout, worldFrom, transform, type PlacedItem } from '../../apps/client/src/layout.js';
import { LayoutEditor, layoutError } from '../../apps/client/src/editor.js';
import { LifeSimulation, walkable } from '../../apps/client/src/simulation.js';

test('default layout has no overlaps and every seat can be reached', () => {
  assert.equal(layoutError(DEFAULT_LAYOUT.items), null);
  assert.equal(worldFrom(DEFAULT_LAYOUT.items).seats.length, 3);
});
test('clicking or entering coordinates pins a preview while pointer movement leaves it unchanged', () => {
  const e = new LayoutEditor(); e.enter(); e.begin('tree');
  e.followPointer(4, 1.5); assert.equal(e.positionLocked, false);
  e.position(4, 1.5); e.followPointer(3, -2);
  assert.deepEqual([e.pending!.x, e.pending!.z], [4, 1.5]); assert.equal(e.error, null);
  e.rotate(); e.followPointer(20, 20); assert.equal(e.positionLocked, true);
  assert.equal(e.place(), null);
  e.move(e.selected!); assert.equal(e.positionLocked, false);
  e.followPointer(4.5, 1.5); e.position(4.5, 1.5); e.followPointer(20, 20);
  assert.equal(e.place(), null); assert.equal(e.store(), null);
  e.restore(e.draft.stored[0].id); assert.equal(e.positionLocked, false);
});
test('invalid previews never replace committed items; cancel restores the full layout', () => {
  const e = new LayoutEditor(), original = JSON.stringify(e.committed);
  e.enter(); e.move('bench'); e.position(20, 0);
  assert.match(e.error!, /경계/); assert.ok(e.place()); assert.ok(e.apply());
  assert.equal(JSON.stringify(e.committed), original);
  e.cancelPlacement(); assert.equal(e.draft.items.find(i => i.id === 'bench')!.x, -3.25);
  e.begin('tree'); e.position(4, 1.5); assert.equal(e.place(), null);
  e.cancel(); assert.equal(JSON.stringify(e.draft), original); assert.equal(JSON.stringify(e.committed), original);
});
test('rotation transforms footprints, seat anchors, approaches and facing together', () => {
  const e = new LayoutEditor(); e.enter(); e.move('bench'); e.position(-4, -2); e.rotate();
  assert.equal(e.place(), null); assert.equal(e.apply(), null);
  const bench = e.committed.items.find(i => i.id === 'bench')!, seat = worldFrom(e.committed.items).seats.find(s => s.id === 'bench-left')!;
  assert.deepEqual({ x: seat.x, z: seat.z }, transform({ x: -BENCH_SEAT.x, z: BENCH_SEAT.z }, bench));
  assert.deepEqual(seat.approach, transform({ x: -BENCH_SEAT.approachX, z: BENCH_SEAT.approachZ }, bench));
  assert.equal(seat.yaw, Math.PI / 2);
});
test('storage and restoration preserve instance identity without duplicating objects', () => {
  const e = new LayoutEditor(); e.enter(); e.selected = 'swing'; assert.equal(e.store(), null);
  assert.equal(e.draft.stored[0].id, 'swing'); assert.equal(worldFrom(e.draft.items).seats.length, 2);
  e.restore('swing'); e.rotate(); assert.equal(e.place(), null);
  assert.equal(e.draft.stored.length, 0); assert.equal(e.draft.items.filter(i => i.id === 'swing').length, 1);
});
test('objects cannot overlap or seal the routes between the hub and seats', () => {
  const e = new LayoutEditor(); e.enter(); e.begin('tree'); e.position(3, -2);
  assert.match(e.error!, /겹쳐/);
  const barrier: PlacedItem[] = Array.from({ length: 8 }, (_, i) => ({ id: `wall-${i}`, kind: 'fence', x: -7 + i * 2, z: .75, turn: 0 }));
  assert.match(layoutError([...DEFAULT_LAYOUT.items, ...barrier])!, /접근|길/);
});
test('applying a changed layout releases riders and their reservations, then uses rotated furniture', () => {
  const e = new LayoutEditor(), sim = new LifeSimulation(() => .2);
  for (let t = 0; t < 10; t += .05) sim.update(.05);
  assert.ok(sim.reservations.size > 0);
  e.enter(); e.move('bench'); e.position(-4, -2); e.rotate(); assert.equal(e.place(), null);
  e.move('swing'); e.rotate(); assert.equal(e.place(), null); assert.equal(e.apply(), null);
  sim.applyLayout(e.committed.items); assert.equal(sim.reservations.size, 0);
  for (const a of sim.avatars.values()) { assert.equal(a.seatId, null); assert.ok(walkable(a, sim.world)); }
  const used = new Set<string>();
  for (let i = 0; i < 1800; i++) {
    sim.update(.1);
    for (const a of sim.avatars.values()) {
      if (a.phase === 'seated' || a.phase === 'swinging') { used.add(sim.seatOf(a)!.kind); assert.equal(a.yaw, sim.seatOf(a)!.yaw); }
      if (a.phase === 'walking' || a.phase === 'idle') assert.ok(walkable(a, sim.world));
      if (a.seatId) assert.equal(sim.reservations.get(a.seatId), a.id);
    }
  }
  assert.ok(used.has('bench') && used.has('swing'));
});
test('additional furniture has independent seats; a garden without equipment still supports walking', () => {
  const empty = cloneLayout(DEFAULT_LAYOUT).items.filter(i => !['bench', 'swing', 'flower', 'tree'].includes(i.kind));
  const added: PlacedItem[] = [
    { id: 'bench-a', kind: 'bench', x: -4, z: -2, turn: 0 },
    { id: 'bench-b', kind: 'bench', x: 3.5, z: -2, turn: 0 },
  ];
  assert.equal(layoutError([...empty, ...added]), null);
  const sim = new LifeSimulation(); sim.applyLayout([...empty, ...added]); assert.equal(sim.seats.length, 4);
  assert.equal(sim.use('character', 'bench-b'), null); assert.ok(sim.avatars.get('character')!.seatId!.startsWith('bench-b'));
  sim.applyLayout(empty); for (let t = 0; t < 10; t += .1) sim.update(.1);
  assert.equal(sim.reservations.size, 0); assert.equal(sim.seats.length, 0);
});
