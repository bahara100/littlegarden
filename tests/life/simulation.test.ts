import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeSimulation, findPath, tileCentre, walkable, SEATS, type AvatarId } from '../../apps/client/src/simulation.js';
function advance(sim: LifeSimulation, seconds: number) { for (let t = 0; t < seconds; t += .05) sim.update(.05); }
function until(sim: LifeSimulation, fn: () => boolean, seconds = 40) { for (let t = 0; t < seconds && !fn(); t += .05) sim.update(.05); assert.ok(fn(), 'expected state not reached'); }
function seeded() { let n = 12345; return () => { n = n * 16807 % 2147483647; return n / 2147483647; }; }
test('A* goes around the bench and rejects obstacles/outside/non-finite points', () => {
  const path = findPath({ x: -5.25, z: -2.25 }, { x: -1.25, z: -2.25 });
  assert.ok(path && path.length > 9);
  path.forEach(p => assert.ok(walkable(p)));
  path.slice(1).forEach((p, i) => assert.ok(Math.abs(p.x - path[i].x) + Math.abs(p.z - path[i].z) <= .501));
  for (const target of [{ x: -3.25, z: -2 }, { x: 100, z: 0 }, { x: NaN, z: 0 }, { x: 6, z: -5.4 }]) assert.equal(findPath({ x: -.25, z: 2.25 }, target), null);
  const treePath = findPath({ x: 5.75, z: -4.75 }, { x: 6.25, z: -4.75 });
  assert.ok(treePath && treePath.length > 2, 'walkable endpoints must not cut through a round trunk');
  treePath.slice(1).forEach((p, i) => { for (let f = 0; f <= 1; f += .1) assert.ok(walkable({ x: treePath[i].x + (p.x - treePath[i].x) * f, z: treePath[i].z + (p.z - treePath[i].z) * f })); });
});
test('paths run down tile centres and turn on them', () => {
  const centre = (v: number) => Math.abs(v - Math.floor(v) - .5) < 1e-9;
  const path = findPath({ x: -5.5, z: -2.5 }, { x: -1.5, z: -2.5 });
  assert.ok(path && path.length > 2);
  path.forEach(p => assert.ok(centre(p.x) || centre(p.z), `node ${p.x},${p.z} lies on a tile edge line`));
  path.slice(1).forEach((p, i) => { if (p.x !== path[i].x) assert.ok(centre(p.z)); else assert.ok(centre(p.x)); });
  assert.deepEqual(tileCentre({ x: -1.25, z: 1.99 }), { x: -1.5, z: 1.5 });
});
test('two bench reservations are exclusive before arrival, failed requests preserve existing orders', () => {
  const sim = new LifeSimulation(seeded());
  assert.equal(sim.use('character', 'bench'), null); assert.equal(sim.use('peach', 'bench'), null);
  assert.ok(sim.use('lilac', 'bench')); assert.equal(sim.reservations.size, 2);
  const a = sim.avatars.get('character')!, original = a.seatId;
  assert.ok(sim.moveTo('character', { x: 100, z: 0 })); assert.equal(a.seatId, original);
  sim.wave('character'); assert.equal(sim.reservations.size, 1);
  assert.equal(sim.use('lilac', 'bench'), null); assert.equal(sim.reservations.size, 2);
});
test('boarding, sitting, leaving and cancellation return seats without teleporting', () => {
  const sim = new LifeSimulation(seeded()), a = sim.avatars.get('character')!;
  sim.use(a.id, 'bench'); until(sim, () => a.phase === 'boarding'); sim.update(.1);
  const before = { x: a.x, z: a.z }; sim.leave(a.id); sim.update(.05);
  assert.ok(Math.hypot(a.x - before.x, a.z - before.z) < .2);
  until(sim, () => a.phase === 'idle'); assert.equal(a.seatId, null); assert.ok(walkable(a));
  sim.use(a.id, 'bench'); until(sim, () => a.phase === 'seated');
  assert.ok(sim.moveTo(a.id, { x: .25, z: .25 })); assert.equal(a.phase, 'seated');
  const slot = a.seatId!; sim.leave(a.id); assert.equal(sim.reservations.get(slot), a.id);
  until(sim, () => a.phase === 'idle'); assert.equal(sim.reservations.has(slot), false);
});
test('a command interrupts a reservation; manual movement finishes and autonomy resumes', () => {
  const sim = new LifeSimulation(seeded()), a = sim.avatars.get('character')!;
  sim.use(a.id, 'swing'); assert.equal(sim.moveTo(a.id, { x: -1.25, z: 1.25 }), null);
  assert.equal(sim.reservations.has('swing-seat'), false);
  until(sim, () => a.phase === 'idle'); assert.ok(Math.hypot(a.x + 1.5, a.z - 1.5) < .05, 'stops on the clicked tile centre');
  until(sim, () => !a.directed && a.phase === 'walking');
});
test('three friends live for ten simulated minutes with consistent reservations and safe paths', () => {
  const sim = new LifeSimulation(seeded()), visited = new Map<AvatarId, Set<string>>();
  for (const a of sim.avatars.values()) visited.set(a.id, new Set());
  for (let i = 0; i < 6000; i++) {
    sim.update(.1);
    for (const a of sim.avatars.values()) {
      assert.ok(Number.isFinite(a.x) && Number.isFinite(a.z));
      assert.ok(Math.abs(a.x) <= 7.25 && Math.abs(a.z) <= 7.25);
      if (['walking', 'idle', 'waving'].includes(a.phase)) assert.ok(walkable(a), `${a.name} entered obstacle at ${a.x},${a.z}`);
      if (a.seatId) { assert.equal(sim.reservations.get(a.seatId), a.id); assert.ok(SEATS.some(s => s.id === a.seatId)); }
      if (a.phase === 'seated' || a.phase === 'swinging') visited.get(a.id)!.add(a.phase);
      if (a.phase === 'walking') assert.ok(sim.time <= a.deadline + .11);
    }
    for (const [seat, id] of sim.reservations) assert.equal(sim.avatars.get(id)!.seatId, seat);
  }
  for (const [id, phases] of visited) assert.ok(phases.has('seated') && phases.has('swinging'), `${id} did not use both kinds of equipment`);
});
test('passing friends do not deadlock and repeated resume does not leak reservations', () => {
  const sim = new LifeSimulation(seeded());
  sim.moveTo('character', { x: 2.25, z: 2.25 }); sim.moveTo('lilac', { x: -.25, z: 2.25 });
  advance(sim, 3); assert.ok(sim.avatars.get('character')!.x > 1.5); assert.ok(sim.avatars.get('lilac')!.x < .5);
  for (let i = 0; i < 10; i++) { sim.resume('peach'); sim.use('peach', 'bench'); sim.resume('peach'); }
  assert.ok([...sim.reservations.values()].every(id => id !== 'peach'));
});
